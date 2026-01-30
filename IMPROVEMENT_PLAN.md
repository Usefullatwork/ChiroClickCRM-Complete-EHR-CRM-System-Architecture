# ChiroClickCRM Improvement Plan
**Created:** 2026-01-16
**Goal:** Enable contact import, note generation/sending, and continuous AI improvement

---

## Executive Summary

Your ChiroClickCRM is a **comprehensive system** with solid foundations. Based on analysis of your codebase and comparison with industry leaders (ChiroTouch, ChiroFusion, Jane App), here's a prioritized plan to make it production-ready for:
1. **Contact data import** - Bring in your existing contacts
2. **Note generation & sending** - AI-powered communications
3. **Continuous improvement** - Local model that learns from your usage

---

## Current State Assessment

### What You Have (Strong Foundation)
| Feature | Status | Location |
|---------|--------|----------|
| Patient import (Excel/Text) | ✅ Working | `backend/src/controllers/import.js` |
| SOAP note generation | ✅ Working | `backend/src/services/ai.js` |
| Local LLM (Ollama) | ✅ Configured | `ai-training/Modelfile` |
| Communication infrastructure | ✅ Built | `backend/src/services/communications.js` |
| Feedback recording | ✅ Built | `backend/src/services/aiLearning.js` |
| 5,642 training examples | ✅ Ready | `ai-training/training-data.jsonl` |
| CRM API endpoints | ✅ 40+ routes | `backend/src/routes/crm.js` |

### What's Missing (Gaps to Fill)
| Feature | Priority | Effort |
|---------|----------|--------|
| Google Contacts sync | HIGH | 2-3 days |
| vCard/CSV import | MEDIUM | 1 day |
| Automated retraining pipeline | HIGH | 3-4 days |
| Feedback UI components | HIGH | 2 days |
| Bulk communication sending | MEDIUM | 2 days |
| Communication templates wizard | MEDIUM | 2 days |
| Model performance dashboard | LOW | 2 days |

---

## Phase 1: Contact Import Enhancement (Week 1)

### 1.1 Current Import Capabilities
You already have:
- Excel import with validation
- Text parsing with Norwegian ID extraction
- Duplicate detection (SolvIt ID, email, phone, name+DOB)

### 1.2 Add Google Contacts Integration
**File:** `frontend/src/services/GoogleContactsService.js` (exists but needs activation)

```javascript
// Enable OAuth flow for Google Contacts
// Add to frontend settings page
const syncGoogleContacts = async () => {
  const contacts = await googleContactsService.fetchAllContacts();
  const mapped = contacts.map(contact => ({
    first_name: contact.names?.[0]?.givenName,
    last_name: contact.names?.[0]?.familyName,
    email: contact.emailAddresses?.[0]?.value,
    phone: contact.phoneNumbers?.[0]?.value,
    // Map additional fields...
  }));
  return await importPatientsFromText({ patients: mapped });
};
```

**Required Steps:**
1. Enable Google People API in Google Cloud Console
2. Add OAuth credentials to `.env`
3. Create sync UI in Settings → Integrations
4. Map Google Contact fields to patient schema

### 1.3 Add vCard Import
**Create:** `backend/src/services/vcardImport.js`

```javascript
// vCard parser for .vcf files
import vCard from 'vcf';

export const parseVCard = (vcfContent) => {
  const cards = vCard.parse(vcfContent);
  return cards.map(card => ({
    first_name: card.get('n')?.valueOf()?.split(';')[1],
    last_name: card.get('n')?.valueOf()?.split(';')[0],
    email: card.get('email')?.valueOf(),
    phone: card.get('tel')?.valueOf(),
    address_street: card.get('adr')?.valueOf()?.split(';')[2],
    // ... more mappings
  }));
};
```

### 1.4 Add CSV Import with Column Mapping
**Create:** `frontend/src/components/import/CSVColumnMapper.jsx`

Features:
- Drag-and-drop column mapping
- Preview first 5 rows
- Auto-detect common headers
- Save mapping templates for reuse

---

## Phase 2: Note Generation & Sending (Week 2)

### 2.1 Current Communication Flow
```
Patient → Select → Choose Template → Generate with AI → Preview → Send
```

### 2.2 Improve AI Generation with Tone Selection

**Update:** `frontend/src/services/LocalAIService.js`

Current tones: `direct`, `kind`, `professional`, `empathetic`

Add context-aware generation:
```javascript
const generateCommunication = async (type, patient, options) => {
  const context = {
    patient_name: patient.first_name,
    last_visit: patient.last_visit_date,
    main_problem: patient.main_problem,
    days_since_visit: daysSince(patient.last_visit_date),
    upcoming_appointment: patient.next_appointment,
    ...options
  };

  const prompt = buildPrompt(type, context, options.tone);
  return await ollamaGenerate(prompt);
};
```

### 2.3 Bulk Communication Sending

**Create:** `frontend/src/components/communications/BulkSender.jsx`

Features:
- Select patients by filter (inactive, birthday coming, needs follow-up)
- Choose communication type & template
- AI generates personalized version for each
- Preview all before sending
- Schedule for optimal send time
- Track delivery & responses

**API Updates:**
```javascript
// backend/src/routes/communications.js
router.post('/bulk-send', async (req, res) => {
  const { patientIds, templateId, type, scheduledAt } = req.body;

  const jobs = patientIds.map(patientId => ({
    patientId,
    templateId,
    type,
    scheduledAt,
    status: 'pending'
  }));

  await communicationQueue.addBulk(jobs);
  return res.json({ queued: jobs.length });
});
```

### 2.4 Communication Templates Wizard

**Create:** `frontend/src/components/templates/TemplateWizard.jsx`

Step-by-step template creation:
1. **Choose Type** - Recall, Follow-up, Birthday, Custom
2. **Select Tone** - Direct, Kind, Professional, Empathetic
3. **Add Variables** - {{patient_name}}, {{last_visit}}, etc.
4. **AI Enhancement** - Generate variations
5. **Test Send** - Send to yourself first
6. **Save & Activate**

---

## Phase 3: Continuous AI Improvement (Week 3-4)

### 3.1 Current Feedback Infrastructure

You have `aiLearning.js` with:
- `recordFeedback()` - Stores corrections
- `checkRetrainingThreshold()` - 50 samples or 20 rejections
- `analyzeCommonCorrections()` - Pattern detection
- `exportFeedbackForTraining()` - JSONL export

**What's Missing:** Automated retraining pipeline

### 3.2 Implement Automated Retraining Pipeline

**Create:** `backend/src/services/aiRetraining.js`

```javascript
import { exportFeedbackForTraining, analyzeCommonCorrections } from './aiLearning.js';
import { exec } from 'child_process';
import fs from 'fs/promises';

export const runRetrainingPipeline = async () => {
  console.log('🔄 Starting AI retraining pipeline...');

  // Step 1: Export recent feedback
  const feedbackData = await exportFeedbackForTraining({
    days: 90,
    minRating: 3,
    format: 'jsonl'
  });

  // Step 2: Merge with base training data
  const baseData = await fs.readFile('ai-training/training-data.jsonl', 'utf-8');
  const mergedData = baseData + '\n' + feedbackData;

  // Step 3: Write new training file
  const timestamp = new Date().toISOString().split('T')[0];
  const newTrainingFile = `ai-training/training-data-${timestamp}.jsonl`;
  await fs.writeFile(newTrainingFile, mergedData);

  // Step 4: Convert to Ollama format
  await convertToOllamaFormat(newTrainingFile);

  // Step 5: Rebuild model
  await rebuildOllamaModel();

  // Step 6: Test new model
  const testResults = await testNewModel();

  // Step 7: If tests pass, activate
  if (testResults.passRate > 0.8) {
    await activateNewModel();
    console.log('✅ New model activated!');
  } else {
    console.log('⚠️ Model tests failed, keeping current model');
  }

  return { success: true, testResults };
};

const rebuildOllamaModel = async () => {
  return new Promise((resolve, reject) => {
    exec('ollama create chiro-no -f ai-training/Modelfile', (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
};
```

### 3.3 Enhanced Feedback UI

**Create:** `frontend/src/components/ai/AIFeedbackPanel.jsx`

```jsx
const AIFeedbackPanel = ({ suggestion, onFeedback }) => {
  const [rating, setRating] = useState(0);
  const [correction, setCorrection] = useState('');

  return (
    <div className="ai-feedback-panel">
      {/* AI Suggestion Display */}
      <div className="suggestion-box">
        <span className="confidence-badge">{suggestion.confidence}%</span>
        <p>{suggestion.text}</p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button onClick={() => onFeedback({ accepted: true, type: 'accepted_as_is' })}>
          ✓ Accept
        </button>
        <button onClick={() => setShowEdit(true)}>
          ✏️ Edit & Accept
        </button>
        <button onClick={() => onFeedback({ accepted: false })}>
          ✗ Reject
        </button>
      </div>

      {/* Rating */}
      <StarRating value={rating} onChange={setRating} />

      {/* Optional correction */}
      {showEdit && (
        <textarea
          value={correction}
          onChange={(e) => setCorrection(e.target.value)}
          placeholder="Skriv din forbedrede versjon..."
        />
      )}
    </div>
  );
};
```

### 3.4 Implement RLAIF (AI-Assisted Feedback)

When you don't have enough human feedback, use AI to generate preference pairs:

**Create:** `backend/src/services/rlaif.js`

```javascript
/**
 * RLAIF - Reinforcement Learning from AI Feedback
 * Uses Claude API to evaluate and rank AI suggestions
 */

export const generatePreferencePairs = async (suggestions) => {
  const prompt = `
    As a Norwegian chiropractic documentation expert, rank these clinical notes
    from best to worst based on:
    1. Medical accuracy
    2. Professional language
    3. ICPC-2 code relevance
    4. Clarity and conciseness

    Notes to rank:
    ${suggestions.map((s, i) => `[${i+1}] ${s}`).join('\n\n')}

    Return ranking as JSON: { "ranking": [best_index, ..., worst_index], "reasoning": "..." }
  `;

  const response = await claudeAPI.complete(prompt);
  return response;
};

export const augmentTrainingData = async () => {
  // Get low-confidence suggestions that weren't corrected
  const uncorrectedSuggestions = await getLowConfidenceSuggestions();

  for (const suggestion of uncorrectedSuggestions) {
    // Generate 3 alternative versions
    const alternatives = await generateAlternatives(suggestion);

    // Use Claude to rank them
    const ranking = await generatePreferencePairs([
      suggestion.text,
      ...alternatives
    ]);

    // Add best version to training data
    await addToTrainingData({
      input: suggestion.context,
      output: ranking.bestVersion,
      source: 'rlaif'
    });
  }
};
```

### 3.5 Model Performance Dashboard

**Create:** `frontend/src/pages/AIPerformance.jsx`

Display:
- **Acceptance Rate** - % of suggestions accepted as-is
- **Correction Rate** - % needing edits
- **Rejection Rate** - % completely rejected
- **Average Rating** - User satisfaction score
- **Decision Time** - How long users spend reviewing
- **Top Corrections** - Common patterns in user edits
- **Retraining Status** - Feedback count, next retraining trigger

```jsx
const AIPerformanceDashboard = () => {
  const { data: metrics } = useQuery(['aiMetrics'], getPerformanceMetrics);

  return (
    <div className="dashboard">
      <MetricCard title="Acceptance Rate" value={`${metrics.acceptanceRate}%`} trend={metrics.trend} />
      <MetricCard title="Avg Rating" value={metrics.avgRating} />
      <LineChart data={metrics.history} title="Performance Over Time" />
      <Table data={metrics.topCorrections} title="Common Corrections" />
      <RetrainingStatus count={metrics.feedbackCount} threshold={50} />
    </div>
  );
};
```

---

## Phase 4: Production Hardening (Week 5)

### 4.1 Missing CRM Component Connections

Per your `NEXT_SESSION_TODO.md`, these components need API connection:

| Component | API Method | Action |
|-----------|------------|--------|
| LeadManagement.jsx | crmAPI.getLeads() | Connect to backend |
| PatientLifecycle.jsx | crmAPI.getPatientsByLifecycle() | Connect to backend |
| ReferralProgram.jsx | crmAPI.getReferrals() | Connect to backend |
| SurveyManager.jsx | crmAPI.getSurveys() | Connect to backend |
| CampaignManager.jsx | crmAPI.getCampaigns() | Connect to backend |
| WorkflowBuilder.jsx | crmAPI.getWorkflows() | Connect to backend |
| RetentionDashboard.jsx | crmAPI.getRetentionDashboard() | Connect to backend |

### 4.2 Run Database Migration

```bash
cd F:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\backend
npm run migrate
```

This will create the CRM tables from `database/migrations/010_crm_full_features.sql`

### 4.3 Add Missing ai_feedback Table

**Create:** `database/migrations/011_ai_feedback.sql`

```sql
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES clinical_encounters(id),
  suggestion_type VARCHAR(50) NOT NULL,
  original_suggestion TEXT NOT NULL,
  user_correction TEXT,
  accepted BOOLEAN NOT NULL,
  correction_type VARCHAR(20), -- 'accepted_as_is', 'minor', 'major', 'rejected'
  confidence_score DECIMAL(3,2),
  feedback_notes TEXT,
  user_id UUID REFERENCES users(id),
  template_id UUID,
  context_data JSONB,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  time_to_decision INTEGER, -- milliseconds
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_feedback_type ON ai_feedback(suggestion_type);
CREATE INDEX idx_ai_feedback_created ON ai_feedback(created_at);
CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_accepted ON ai_feedback(accepted);

-- Daily metrics aggregation table
CREATE TABLE IF NOT EXISTS ai_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  suggestion_type VARCHAR(50) NOT NULL,
  total_suggestions INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  avg_confidence DECIMAL(3,2),
  avg_rating DECIMAL(3,2),
  avg_decision_time INTEGER,
  UNIQUE(date, suggestion_type)
);

-- Function to update daily metrics
CREATE OR REPLACE FUNCTION update_daily_ai_metrics(target_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_daily_metrics (date, suggestion_type, total_suggestions, accepted_count, rejected_count, avg_confidence, avg_rating, avg_decision_time)
  SELECT
    target_date,
    suggestion_type,
    COUNT(*),
    SUM(CASE WHEN accepted THEN 1 ELSE 0 END),
    SUM(CASE WHEN NOT accepted THEN 1 ELSE 0 END),
    AVG(confidence_score),
    AVG(user_rating),
    AVG(time_to_decision)
  FROM ai_feedback
  WHERE DATE(created_at) = target_date
  GROUP BY suggestion_type
  ON CONFLICT (date, suggestion_type) DO UPDATE SET
    total_suggestions = EXCLUDED.total_suggestions,
    accepted_count = EXCLUDED.accepted_count,
    rejected_count = EXCLUDED.rejected_count,
    avg_confidence = EXCLUDED.avg_confidence,
    avg_rating = EXCLUDED.avg_rating,
    avg_decision_time = EXCLUDED.avg_decision_time;
END;
$$ LANGUAGE plpgsql;
```

---

## Phase 5: Workflow Automation (Week 6)

### 5.1 Automated Communication Triggers

```javascript
// backend/src/services/automations.js

const automationRules = [
  {
    name: 'new_patient_welcome',
    trigger: 'PATIENT_CREATED',
    delay: '0m',
    action: { type: 'SEND_EMAIL', template: 'welcome' }
  },
  {
    name: 'appointment_reminder_24h',
    trigger: 'APPOINTMENT_UPCOMING',
    condition: 'hours_until <= 24',
    action: { type: 'SEND_SMS', template: 'reminder_24h' }
  },
  {
    name: 'follow_up_check_in',
    trigger: 'ENCOUNTER_COMPLETED',
    delay: '2d',
    action: { type: 'SEND_SMS', template: 'follow_up_check' }
  },
  {
    name: 'recall_3_month',
    trigger: 'NO_APPOINTMENT_SCHEDULED',
    condition: 'days_since_last_visit >= 90',
    action: { type: 'CREATE_FOLLOW_UP', priority: 'HIGH' }
  },
  {
    name: 'birthday_greeting',
    trigger: 'PATIENT_BIRTHDAY',
    delay: '9am',
    action: { type: 'SEND_SMS', template: 'birthday' }
  },
  {
    name: 'feedback_request',
    trigger: 'ENCOUNTER_COMPLETED',
    delay: '7d',
    condition: 'patient.needs_feedback = true',
    action: { type: 'SEND_SURVEY', survey: 'nps' }
  }
];
```

### 5.2 Scheduled Jobs

**Create:** `backend/src/jobs/scheduler.js`

```javascript
import cron from 'node-cron';
import { processAutomations } from '../services/automations.js';
import { updateDailyMetrics } from '../services/aiLearning.js';
import { checkRetrainingThreshold } from '../services/aiLearning.js';

// Run every hour - process pending automations
cron.schedule('0 * * * *', async () => {
  await processAutomations();
});

// Run daily at midnight - update AI metrics
cron.schedule('0 0 * * *', async () => {
  await updateDailyMetrics(new Date(Date.now() - 86400000)); // Yesterday
});

// Run weekly - check if retraining needed
cron.schedule('0 6 * * 1', async () => {
  const needsRetraining = await checkRetrainingThreshold();
  if (needsRetraining.length > 0) {
    await triggerRetrainingPipeline();
  }
});
```

---

## Comparison with Industry Leaders

### vs ChiroTouch (Market Leader)
| Feature | ChiroTouch | ChiroClickCRM | Gap |
|---------|------------|---------------|-----|
| SOAP Notes | ✅ AI-assisted | ✅ AI-assisted | None |
| Scheduling | ✅ Full | ✅ Full | None |
| Billing | ✅ Norwegian codes | ✅ Norwegian codes | None |
| AI Documentation | ✅ Rheo (92% time save) | ✅ Ollama local | You have privacy advantage |
| Patient Portal | ✅ Yes | ❌ Planned | Add in Phase 6 |
| SMS/Email | ✅ Built-in | ✅ Built-in | None |
| Continuous Learning | ❌ Cloud only | ✅ Local model | Your advantage |

### vs ChiroFusion
| Feature | ChiroFusion | ChiroClickCRM | Gap |
|---------|-------------|---------------|-----|
| Cloud-based | ✅ Yes | ✅ Optional | None |
| ICPC-2 Codes | ❌ US only | ✅ Norwegian | Your advantage |
| Multi-tenant | ✅ Yes | ✅ Yes | None |
| Custom workflows | ❌ Limited | ✅ Full builder | Your advantage |

### Your Competitive Advantages
1. **Local AI** - Data never leaves your server (privacy/GDPR)
2. **Norwegian-specific** - ICPC-2, Takster, fødselsnummer
3. **Continuous learning** - Model improves from your usage
4. **Open architecture** - Full customization possible
5. **Cost** - No per-seat licensing fees

---

## Implementation Roadmap

```
Week 1: Contact Import
├── Day 1-2: Google Contacts OAuth + sync
├── Day 3: vCard import parser
├── Day 4-5: CSV import with column mapper UI

Week 2: Communications
├── Day 1-2: Bulk sender component
├── Day 3-4: Template wizard
├── Day 5: Test all communication flows

Week 3: AI Feedback Loop
├── Day 1-2: Feedback UI components
├── Day 3-4: Retraining pipeline
├── Day 5: RLAIF augmentation

Week 4: Integration & Testing
├── Day 1-2: Connect CRM components to API
├── Day 3: Run migrations, test database
├── Day 4-5: End-to-end testing

Week 5: Automation
├── Day 1-3: Workflow automation engine
├── Day 4-5: Scheduled jobs & monitoring

Week 6: Polish
├── Day 1-2: AI performance dashboard
├── Day 3-4: Documentation
├── Day 5: Launch preparation
```

---

## Quick Start Commands

```bash
# Start the system
cd F:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture
.\START-CHIROCLICK.bat

# Or manually:
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Ollama (ensure model is loaded)
ollama run chiro-no

# Run database migration
cd backend && npm run migrate

# Build custom AI model
cd ai-training && ollama create chiro-no -f Modelfile
```

---

## Next Immediate Steps

1. **Run database migration** to enable CRM features
2. **Start backend and frontend** to test current state
3. **Build the AI model** with existing training data
4. **Test the import flow** with sample contacts
5. **Begin Phase 1** - Contact import enhancement

---

## Resources

### Documentation
- [Ollama Fine-Tuning Guide 2025](https://collabnix.com/how-to-fine-tune-llm-and-use-it-with-ollama-a-complete-guide-for-2025/)
- [OpenRLHF Framework](https://github.com/OpenRLHF/OpenRLHF)
- [RLHF Best Practices](https://medium.com/@meeran03/fine-tuning-llms-with-human-feedback-rlhf-latest-techniques-and-best-practices-3ed534cf9828)
- [LoRA Fine-Tuning](https://huggingface.co/blog/trl-peft)

### Similar Software (Research)
- [ChiroTouch](https://www.chirotouch.com/) - Market leader
- [ChiroFusion](https://www.chirofusionsoftware.com/) - Cloud-based
- [Jane App](https://www.janeapp.com/) - Solo practitioners
- [DoliMed EMR](https://www.dolibarr.org/) - Open source base

---

**Ready to start? Let me know which phase you want to tackle first!**
