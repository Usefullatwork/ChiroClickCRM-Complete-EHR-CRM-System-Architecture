# Feature: Anonymous Training Data Export

## The Idea

Friends use ChiroClick → the app silently logs AI interactions (what was suggested, what they accepted/modified/rejected) → they click "Export Training Data" → get an anonymized JSONL file → send it back to you → you merge it into your training dataset → model improves.

**This is a real-world clinical feedback loop.** Every friend who uses the app becomes a free data contributor.

---

## What Already Exists

You already have 90% of the infrastructure:

| Component                  | Status | Location                                                                    |
| -------------------------- | ------ | --------------------------------------------------------------------------- |
| `ai_feedback` table        | EXISTS | `database/migrations/011_ai_feedback.sql`                                   |
| `ai_daily_metrics` table   | EXISTS | Same migration                                                              |
| `AIFeedbackService`        | EXISTS | `backend/src/application/services/AIFeedbackService.js`                     |
| Event-driven capture       | EXISTS | SUGGESTION_ACCEPTED / REJECTED / MODIFIED events                            |
| Feedback columns           | EXISTS | `original_suggestion`, `user_correction`, `correction_type`, `context_data` |
| `logSuggestion()` in ai.js | EXISTS | Line 569 — logs every AI call to `ai_suggestions`                           |

### What's Captured Per AI Interaction

```
ai_feedback row:
├── suggestion_type: "soap_subjective" / "diagnosis_code" / "red_flag" / etc.
├── original_suggestion: "Pasienten rapporterer smerter i korsryggen..."
├── user_correction: "Pasienten har hatt smerter i 3 uker..."  (or null if accepted)
├── accepted: true/false
├── correction_type: "accepted_as_is" / "minor_edit" / "major_edit" / "rejected"
├── confidence_score: 0.75
├── context_data: { chief_complaint, patient_age, diagnosis_codes }
└── time_to_decision: 4500  (ms from display to accept/reject)
```

---

## What Needs to Be Built

### 1. Backend: Export Endpoint + Anonymization (~2h)

**New file**: `backend/src/services/trainingExport.js`

```javascript
/**
 * Anonymous Training Data Export Service
 *
 * Exports AI feedback data as anonymized ChatML JSONL
 * suitable for LoRA fine-tuning.
 *
 * Anonymization rules:
 * - Strip ALL patient identifiers (names, DOB, fødselsnummer, phone, email)
 * - Replace patient names with "Pasient"
 * - Replace practitioner names with "Behandler"
 * - Keep age ranges (not exact age): 20-29, 30-39, etc.
 * - Keep clinical content: symptoms, findings, diagnoses, treatments
 * - Keep diagnosis codes (ICPC-2)
 * - Remove dates → keep relative timing ("3 uker siden")
 * - Remove organization identifiers
 * - Remove session/encounter IDs
 */

import { query } from "../config/database.js";
import logger from "../utils/logger.js";

// Norwegian PHI patterns to scrub
const PHI_PATTERNS = [
  // Fødselsnummer (11 digits)
  { pattern: /\b\d{6}\s?\d{5}\b/g, replacement: "[FNUMMER]" },
  // Phone numbers (8 digits, with or without country code)
  {
    pattern: /(?:\+47\s?)?\b\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b/g,
    replacement: "[TELEFON]",
  },
  // Email
  { pattern: /[\w.-]+@[\w.-]+\.\w+/g, replacement: "[EPOST]" },
  // Dates (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD)
  { pattern: /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g, replacement: "[DATO]" },
  // Norwegian names (common patterns after "Pasient:", "Behandler:", "Hr.", "Fru", etc.)
  // This is best-effort — clinical content should NOT have names in SOAP fields
];

function anonymizeText(text) {
  if (!text) return text;
  let result = text;
  for (const { pattern, replacement } of PHI_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function anonymizeAge(age) {
  if (!age || age < 1) return null;
  // Round to decade range
  const decade = Math.floor(age / 10) * 10;
  return `${decade}-${decade + 9}`;
}

function buildChatMLExample(feedback) {
  const systemPrompt = getSystemPromptForType(feedback.suggestion_type);
  const userPrompt = buildUserPrompt(feedback);
  const assistantResponse = feedback.accepted
    ? feedback.user_correction || feedback.original_suggestion
    : feedback.user_correction; // The corrected version is the "right" answer

  if (!assistantResponse) return null;

  return {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: anonymizeText(userPrompt) },
      { role: "assistant", content: anonymizeText(assistantResponse) },
    ],
    metadata: {
      source: "clinical_feedback",
      suggestion_type: feedback.suggestion_type,
      correction_type: feedback.correction_type,
      confidence: feedback.confidence_score,
      age_range: anonymizeAge(feedback.context_data?.patient_age),
    },
  };
}

// Also build DPO pairs from rejected/modified suggestions
function buildDPOPair(feedback) {
  if (feedback.correction_type === "accepted_as_is") return null;
  if (!feedback.user_correction) return null;

  return {
    prompt: anonymizeText(buildUserPrompt(feedback)),
    chosen: anonymizeText(feedback.user_correction), // What the human preferred
    rejected: anonymizeText(feedback.original_suggestion), // What the AI generated
    metadata: {
      source: "clinical_feedback",
      suggestion_type: feedback.suggestion_type,
      correction_type: feedback.correction_type,
    },
  };
}

export async function exportTrainingData(organizationId) {
  // Get all feedback with corrections
  const result = await query(
    `
    SELECT
      af.suggestion_type,
      af.original_suggestion,
      af.user_correction,
      af.accepted,
      af.correction_type,
      af.confidence_score,
      af.context_data,
      af.user_rating,
      af.time_to_decision
    FROM ai_feedback af
    WHERE af.organization_id = $1
      AND af.processed_for_training = false
      AND af.original_suggestion IS NOT NULL
      AND af.original_suggestion != ''
    ORDER BY af.created_at ASC
  `,
    [organizationId],
  );

  const sftExamples = [];
  const dpoExamples = [];
  const stats = {
    total: result.rows.length,
    accepted: 0,
    modified: 0,
    rejected: 0,
    sftGenerated: 0,
    dpoGenerated: 0,
    byType: {},
  };

  for (const row of result.rows) {
    // Count stats
    if (row.accepted) stats.accepted++;
    else if (
      row.correction_type === "major_edit" ||
      row.correction_type === "minor_edit"
    )
      stats.modified++;
    else stats.rejected++;

    stats.byType[row.suggestion_type] =
      (stats.byType[row.suggestion_type] || 0) + 1;

    // Build SFT example (from accepted + modified)
    if (row.accepted || row.user_correction) {
      const sft = buildChatMLExample(row);
      if (sft) {
        sftExamples.push(sft);
        stats.sftGenerated++;
      }
    }

    // Build DPO pair (from modified + rejected)
    if (row.correction_type !== "accepted_as_is" && row.user_correction) {
      const dpo = buildDPOPair(row);
      if (dpo) {
        dpoExamples.push(dpo);
        stats.dpoGenerated++;
      }
    }
  }

  // Mark as exported
  await query(
    `
    UPDATE ai_feedback
    SET processed_for_training = true, training_status = 'exported'
    WHERE organization_id = $1 AND processed_for_training = false
  `,
    [organizationId],
  );

  return { sftExamples, dpoExamples, stats };
}
```

### 2. Backend: Export Route (~15 min)

**Add to existing routes** or create `backend/src/routes/trainingExport.js`:

```javascript
import express from "express";
import { exportTrainingData } from "../services/trainingExport.js";

const router = express.Router();

// GET /api/v1/training/export — Download anonymized training data
router.get("/export", async (req, res) => {
  const orgId = req.user?.organization_id;
  if (!orgId) return res.status(401).json({ error: "Unauthorized" });

  const { sftExamples, dpoExamples, stats } = await exportTrainingData(orgId);

  // Build JSONL content
  const sftLines = sftExamples.map((e) => JSON.stringify(e)).join("\n");
  const dpoLines = dpoExamples.map((e) => JSON.stringify(e)).join("\n");

  // Return as downloadable file
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `chiroclick-training-${timestamp}.jsonl`;

  res.setHeader("Content-Type", "application/jsonl");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  // Write header comment
  res.write(`// ChiroClick Anonymous Training Export — ${timestamp}\n`);
  res.write(
    `// SFT examples: ${stats.sftGenerated}, DPO pairs: ${stats.dpoGenerated}\n`,
  );
  res.write(`// Stats: ${JSON.stringify(stats)}\n`);

  // Write SFT examples
  if (sftLines) res.write(sftLines + "\n");

  // Write DPO examples (with marker)
  if (dpoLines) {
    res.write(`// === DPO PAIRS ===\n`);
    res.write(dpoLines + "\n");
  }

  res.end();
});

// GET /api/v1/training/export/stats — Preview what would be exported
router.get("/export/stats", async (req, res) => {
  const orgId = req.user?.organization_id;
  const result = await query(
    `
    SELECT
      suggestion_type,
      correction_type,
      COUNT(*) as count,
      AVG(confidence_score) as avg_confidence,
      AVG(user_rating) as avg_rating
    FROM ai_feedback
    WHERE organization_id = $1
      AND processed_for_training = false
    GROUP BY suggestion_type, correction_type
    ORDER BY count DESC
  `,
    [orgId],
  );

  res.json({
    pendingExamples: result.rows.reduce((sum, r) => sum + parseInt(r.count), 0),
    breakdown: result.rows,
  });
});

export default router;
```

### 3. Frontend: Export Button in Settings (~30 min)

Add to the Settings page (or Training/AI page):

```jsx
// In Settings.jsx or Training.jsx

function TrainingDataExport() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Fetch export stats on mount
    api.get("/training/export/stats").then((res) => setStats(res.data));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get("/training/export", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chiroclick-training-${new Date().toISOString().slice(0, 10)}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
      // Refresh stats
      const newStats = await api.get("/training/export/stats");
      setStats(newStats.data);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-2">
        {t("settings.trainingExport.title", "Bidra til AI-forbedring")}
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        {t(
          "settings.trainingExport.description",
          "Eksporter anonymisert bruksdata for å forbedre AI-modellen. " +
            "Ingen pasientinformasjon inkluderes.",
        )}
      </p>

      {stats && (
        <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
          <span className="font-medium">{stats.pendingExamples}</span>{" "}
          {t(
            "settings.trainingExport.pending",
            "nye eksempler klar for eksport",
          )}
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={exporting || !stats?.pendingExamples}
        className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
      >
        {exporting
          ? t("settings.trainingExport.exporting", "Eksporterer...")
          : t("settings.trainingExport.button", "Last ned treningsdata")}
      </button>

      <p className="text-xs text-gray-400 mt-3">
        {t(
          "settings.trainingExport.privacy",
          "Alle data er anonymisert. Ingen navn, fødselsnummer, telefonnummer, " +
            "datoer eller andre personopplysninger inkluderes.",
        )}
      </p>
    </div>
  );
}
```

---

## Anonymization Rules (Norwegian Healthcare Compliance)

| Data Type            | Rule            | Example                                                      |
| -------------------- | --------------- | ------------------------------------------------------------ |
| Patient name         | REMOVE          | "Per Hansen" → stripped (shouldn't be in SOAP fields anyway) |
| Fødselsnummer        | REGEX scrub     | "01019012345" → "[FNUMMER]"                                  |
| Phone                | REGEX scrub     | "+47 99 88 77 66" → "[TELEFON]"                              |
| Email                | REGEX scrub     | "per@gmail.com" → "[EPOST]"                                  |
| Dates                | REGEX scrub     | "12.01.2026" → "[DATO]"                                      |
| Age                  | Round to decade | 47 → "40-49"                                                 |
| Organization         | REMOVE          | Stripped from export                                         |
| User/Practitioner    | REMOVE          | Stripped from export                                         |
| Encounter ID         | REMOVE          | Not included                                                 |
| **Chief complaint**  | **KEEP**        | "Korsryggsmerter med utstråling"                             |
| **SOAP content**     | **KEEP**        | "Palpasjon: ømhet L4-L5"                                     |
| **Diagnosis codes**  | **KEEP**        | "L03", "L86"                                                 |
| **Correction type**  | **KEEP**        | "minor_edit"                                                 |
| **Confidence score** | **KEEP**        | 0.75                                                         |

### Key Principle

Clinical content (symptoms, findings, diagnoses, treatments) is **not PHI** on its own. "Korsryggsmerter med utstråling til venstre ben" doesn't identify anyone. What's PHI is the **combination** of clinical data with identifiers (name, DOB, etc.). By stripping all identifiers, the clinical content becomes safe to share.

---

## Output Format: Training-Ready JSONL

### SFT Examples (Supervised Fine-Tuning)

Each line is a complete ChatML conversation — ready to feed directly to `train_unsloth.py`:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Du er en klinisk assistent for kiropraktorer..."
    },
    {
      "role": "user",
      "content": "Skriv subjektiv for pasient med korsryggsmerter, alder 40-49"
    },
    {
      "role": "assistant",
      "content": "Pasienten rapporterer gradvis debut av smerter i korsryggen de siste 3 ukene..."
    }
  ],
  "metadata": {
    "source": "clinical_feedback",
    "suggestion_type": "soap_subjective",
    "correction_type": "minor_edit",
    "confidence": 0.72,
    "age_range": "40-49"
  }
}
```

### DPO Pairs (Direct Preference Optimization)

For rejected/modified suggestions — teaches the model what NOT to do:

```json
{
  "prompt": "Skriv subjektiv for pasient med nakkesmerter",
  "chosen": "Pasienten har hatt nakkesmerter i 2 uker etter bilulykke...",
  "rejected": "Pasienten opplever nakkesmerter.",
  "metadata": {
    "source": "clinical_feedback",
    "suggestion_type": "soap_subjective",
    "correction_type": "major_edit"
  }
}
```

---

## Your Merge Workflow

When a friend sends you a `.jsonl` file:

```bash
cd ai-training

# 1. Review the file (spot check anonymization)
head -5 friend-data-2026-03-01.jsonl

# 2. Merge SFT examples into training dataset
cat friend-data-2026-03-01.jsonl \
  | grep -v "^//" \
  | grep -v "DPO PAIRS" \
  >> data/mined/clinical-feedback.jsonl

# 3. Merge DPO pairs into DPO dataset
# (extract lines after "DPO PAIRS" marker)
# Or use a simple script to split SFT vs DPO

# 4. Rebuild combined dataset
# Same process as Task 2.5 in the week plan

# 5. Retrain when you have enough new examples
# The AIFeedbackService already tracks retrainingThreshold = 100
```

---

## How It Looks for Your Friend

1. They use ChiroClick normally (creating encounters, SOAP notes, etc.)
2. Every time they accept/modify/reject an AI suggestion, it's logged automatically
3. After a week of use, they go to **Settings → AI → Training Data**
4. They see: "47 new examples ready for export"
5. They click **"Last ned treningsdata"** → downloads `chiroclick-training-2026-03-07.jsonl`
6. They send you the file (WhatsApp, email, USB, whatever)
7. You merge it into your training data and retrain

**Zero friction for the friend.** They don't need to understand training data, anonymization, or JSONL. They just click a button.

---

## Implementation Timeline

| Task                               | Time    | When                                |
| ---------------------------------- | ------- | ----------------------------------- |
| Create `trainingExport.js` service | 2h      | Day 2 or Day 4 (fits either)        |
| Add export route                   | 15 min  | Same session                        |
| Add UI button in Settings          | 30 min  | Same session                        |
| Test anonymization with real data  | 30 min  | After you have some AI interactions |
| **Total**                          | **~3h** |                                     |

This can be added as a **Day 2 bonus task** or squeezed into **Day 4** after the test fixes.

---

## Data Volume Expectations

| Scenario                      | AI Interactions/Day | Export After 1 Week |
| ----------------------------- | ------------------- | ------------------- |
| Light use (1-2 patients/day)  | 5-10                | ~50 examples        |
| Normal use (5-8 patients/day) | 20-40               | ~200 examples       |
| Heavy use (10+ patients/day)  | 50-100              | ~500 examples       |

With 3 friends using it for 2 weeks = **600-3,000 new training examples**. That's enough to meaningfully improve the model, especially for diagnosis codes and SOAP quality.
