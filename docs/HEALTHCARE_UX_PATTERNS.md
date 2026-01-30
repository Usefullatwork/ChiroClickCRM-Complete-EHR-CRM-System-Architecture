# Healthcare UX Patterns for ChiroClickCRM

**A Complete Design Guide for Next-Generation Clinical Documentation**

*Version 1.0 | January 2026*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Documentation Efficiency Imperative](#the-documentation-efficiency-imperative)
3. [SOAP Note Documentation Patterns](#soap-note-documentation-patterns)
4. [Interactive Body Diagrams](#interactive-body-diagrams)
5. [Intake Form UX](#intake-form-ux)
6. [AI-Assisted Documentation](#ai-assisted-documentation)
7. [AI Suggestion Presentation Patterns](#ai-suggestion-presentation-patterns)
8. [Confidence Visualization](#confidence-visualization)
9. [Voice Technology Architecture](#voice-technology-architecture)
10. [Offline-First Architecture](#offline-first-architecture)
11. [Norwegian Healthcare Compliance](#norwegian-healthcare-compliance)
12. [Accessibility Standards (WCAG)](#accessibility-standards-wcag)
13. [Mobile and Tablet Patterns](#mobile-and-tablet-patterns)
14. [Implementation Roadmap](#implementation-roadmap)
15. [Key Metrics](#key-metrics)

---

## Executive Summary

Building an effective chiropractic EHR that reduces documentation burden requires implementing proven patterns from industry leaders (Jane App, ChiroTouch, ChiroUp) while adapting them for a Norwegian practice context. This guide synthesizes UX patterns from enterprise EHRs alongside emerging AI documentation interfaces.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Minimal Interaction** | Reduce clicks, not features |
| **Maximum Output** | Every action should produce substantial documentation |
| **Accuracy First** | Norwegian healthcare regulations demand precision |
| **Offline Resilient** | Clinical environments have unpredictable connectivity |
| **AI-Augmented** | Assistance without interruption |

### The Goal

Transform the clinician's role from **documentation creator** to **documentation verifier**. The best UI is less UI.

---

## The Documentation Efficiency Imperative

### The Burnout Crisis

- **75% of physicians** with burnout identify EHR as primary source
- Clinicians spend **2x more time** with software than with patients
- Legacy EHRs prioritize billing over clinical workflow
- The "4,000-click day" is destroying clinical sustainability

### The Cognitive Load Problem

Legacy "Spine" navigation systems impose severe cognitive costs:

| Problem | Impact |
|---------|--------|
| **Decision Fatigue** | Every click is a micro-decision |
| **Note Bloat** | Macro overuse creates "garbage notes" |
| **Tunnel Vision** | Linear UI for non-linear clinical thinking |
| **Context Switching** | Fragmenting patient narrative into database fields |

### The Solution: Narrative-First Design

Two paradigms are replacing click-heavy interfaces:

#### 1. Reporting by Exception (RBE)

Assume baseline "Normal" - require interaction only for pathology.

```
Standard Exam (Healthy Patient):
- Legacy UI: ~40 clicks
- RBE Visual Body Map: 2-3 clicks (or "All Normal" confirmation)
```

#### 2. Generative Extraction

LLMs bridge free text and structured data:

```
Workflow:
1. Clinician dictates/types narrative
2. NLP extracts structured codes (ICPC-2, SNOMED)
3. Clinician verifies rather than enters

Example:
Input: "Pasienten presenterer med 3 dager produktiv hoste, grønt spytt, ingen feber."
Output: ✓ Hoste (Symptom) ✓ 3 dager (Duration) ✓ Produktiv (Quality) ✓ Ingen feber (Pertinent Negative)
```

---

## SOAP Note Documentation Patterns

### Assessment-First Workflow

ChiroUp's patented "SAOP" approach reflects how clinicians think - they typically know the diagnosis before documenting findings.

**Implementation:**
1. Allow flexible section ordering
2. When assessment selected (e.g., "L03 - Low back symptom"), auto-suggest:
   - Relevant objective findings templates
   - Default ROM values
   - Typical treatment codes

### Text Expansion Systems

The highest-impact pattern across all major EHRs:

| Trigger Type | Example | Use Case |
|-------------|---------|----------|
| Dot-prefix | `.normspine` | Standard exam findings |
| Slash-prefix | `/cc` | Chief complaint templates |
| Keyword | `insert cervical exam` | Voice-activated expansion |
| Context | Auto on diagnosis selection | Diagnosis-driven templates |

**Jane App Pattern - Click-to-Narrative:**
```
Clicking: [decreased] + [cervical] + [flexion]
Produces: "Pasienten demonstrerer redusert cervical fleksjon."
```

### SALT Pattern (Same As Last Time)

One-click duplication of previous encounter with modification capability.

**Implementation Requirements:**
- Visual differentiation for carried-forward content (subtle background)
- Comparison view showing previous visit alongside current
- Required touch points forcing review before signing
- Auto-SALT suggestions when patient returns with same complaint

### Modular Templates

Combine base templates with condition-specific modules:

```
Structure:
├── Base Templates (3-5)
│   ├── Ny pasient (New patient)
│   ├── Oppfølging (Follow-up)
│   └── Re-evaluering (Re-evaluation)
│
└── Condition Modules (15-20)
    ├── Nakkesmerter (Neck pain)
    ├── Korsryggsmerter (Low back pain)
    ├── Hodepine (Headache)
    └── ...
```

---

## Interactive Body Diagrams

### Spine Diagram Implementation (ChiroTouch Pattern)

**Core Interaction Model:**
1. Touchscreen-optimized segments on SVG spine image
2. Single tap selects segment → populates chart notes
3. SPINE-LR macro extends with laterality (V/H/B for Venstre/Høyre/Bilateral)
4. Selections generate standardized text

**Technical Requirements:**
- SVG spine with clickable path segments
- Segment → Norwegian nomenclature mapping
- Touch, stylus, and mouse support
- **Minimum 48×48px hit targets** for clinical accuracy

### ChiroClickCRM's Existing Implementation

The QuickPalpationSpine system already implements this pattern:

```jsx
// Current implementation in QuickPalpationSpine.jsx
// Click segment → Direction popup → Norwegian text insertion

Example:
Click C5 → Select "V" (Venstre) → Inserts: "C5: Segmentdysfunksjon, restriksjon venstre rotasjon"
```

### Enhanced Anatomy Module

The EnhancedClinicalSidebar provides mode switching:

| Mode | Component | Use Case |
|------|-----------|----------|
| Quick | QuickPalpationSpine | Fast documentation |
| 2D | EnhancedSpineDiagram | Detailed anatomical SVG |
| 3D | Spine3DViewer | Interactive Three.js model |
| Body | EnhancedBodyDiagram | Full body mapping |

### Drawing vs. Point-and-Click

| Approach | Best For | Complexity |
|----------|----------|------------|
| Point-and-click segments | Spine adjustments, standardized findings | Medium |
| Freehand drawing | Complex pain patterns, patient-drawn areas | Medium |
| Numbered reference points | Detailed examination annotations | Low |

### Accessibility Requirements

Body diagrams require alternative access methods:
- Dropdown/list alternative for selecting body regions
- Announce selections via `aria-live` regions
- Keyboard navigation through regions (arrow keys)
- High-contrast mode option
- Text descriptions for screen readers

---

## Intake Form UX

### Three-Tier Architecture

1. **Profile Fields** - Name, contact, insurance
2. **Questionnaire** - Conditional based on responses
3. **Consent & Signatures** - Legal documentation

### Conditional Logic Patterns

```javascript
// Example conditional flow
if (hasInsurance === true) {
  showInsuranceDetailFields();
}

if (patientAge < 18) {
  showPediatricConsentForms();
}

if (chiefComplaint === 'low_back') {
  loadOutcomeMeasure('oswestry');
} else if (chiefComplaint === 'neck') {
  loadOutcomeMeasure('bournemouth');
}
```

### Smart Defaults

| Field Type | Default Strategy |
|------------|-----------------|
| Date fields | Today's date |
| Appointment type | Pre-fills expected sections |
| Returning patient | Pull existing demographics |
| Common medications | Searchable dropdown (not open text) |
| Pain scale | Slider with previous visit comparison |

### Patient-Facing Requirements

- Progress indicators ("Steg 2 av 4")
- Large touch targets (minimum 44×44px)
- Autosave preventing data loss
- Draw-on-diagram for pain areas
- Clear required field indicators
- Helpful (not punitive) error messages

---

## AI-Assisted Documentation

### Implementation Phases

#### Phase 1: Smart Template Expansion (Weeks 1-4)

Highest impact, lowest complexity:

```javascript
// User types
/normcspine

// System expands with context
"Cervicalcolumna: Normal lordotisk kurve opprettholdt.
Ingen palpatorisk ømhet over spinous processes C2-C7.
Paraspinal muskulatur smidig bilateralt."

// AI enhancement: Send context to LLM for customization
const suggestion = await aiService.expandTemplate({
  template: 'normcspine',
  context: {
    chiefComplaint: patient.chiefComplaint,
    diagnosis: selectedDiagnosis
  }
});
```

#### Phase 2: Click-to-Dictate Voice Input (Weeks 5-8)

**UI Flow:**
1. Click microphone icon in note field
2. Icon state changes: Gray (ready) → Red/pulse (recording) → Blue/spinner (processing)
3. Browser MediaRecorder captures audio
4. Send to transcription API
5. Insert at cursor

**Microphone State Indicators:**
```
┌─────────────────────────────────────┐
│ 🎤 Ready     ● REC (0:15)  ⏳ Processing │
│ (gray)       (red+pulse)    (blue+spin)  │
└─────────────────────────────────────┘
```

#### Phase 3: AI-Structured Note Generation (Weeks 9-12)

```
Workflow:
1. Provider dictates free-form during encounter
2. Click "Generer notat" button
3. System: dictation + template + context → LLM
4. Draft appears in modal for review
5. Provider edits and saves
```

### Realistic MVP Budget

| Component | Monthly Cost |
|-----------|-------------|
| OpenAI GPT-4o-mini (~1000 notes) | $10-30 |
| Transcription (Whisper, ~100 hours) | $60 |
| Hosting (self-hosted) | $20-50 |
| **Total** | **~$100/month** |

---

## AI Suggestion Presentation Patterns

### Pattern Comparison

| Pattern | Best For | Disruption Level |
|---------|----------|------------------|
| Inline Ghost Text | SOAP phrase completion | Minimal |
| Sidebar Panel | Diagnosis codes, recommendations | Low |
| Toast Notification | Status updates, soft alerts | Low |
| Modal Dialog | Red flag alerts ONLY | High |

### Inline Ghost Text (GitHub Copilot Pattern)

For fast-paced SOAP completion:

```javascript
// Debounced suggestion pattern
useEffect(() => {
  if (!draftText) return;
  const timeout = setTimeout(() => {
    fetchAISuggestion(draftText, context);
  }, 400); // 300-500ms debounce critical
  return () => clearTimeout(timeout);
}, [draftText]);
```

**Interaction:**
- Dimmed text at cursor shows prediction
- **Tab** accepts full suggestion
- **Escape** dismisses
- Continue typing ignores/overwrites

### Sidebar Panel (Clinical Decision Support)

```
┌─────────────────────────────┬──────────────────┐
│                             │ 🤖 AI Assistent  │
│  SOAP Notat Editor          │ ────────────────│
│  ──────────────────         │ Foreslåtte koder:│
│  [Skriver vurdering...]     │ • L03 (92%)      │
│                             │ • L86 (74%)      │
│                             │ [Sett inn] [Rediger] │
└─────────────────────────────┴──────────────────┘
```

**Advantages:**
- Shows multiple options with confidence
- Space for reasoning/evidence
- Doesn't obscure documentation
- Collapsible when not needed

### Recommended Hybrid for ChiroClickCRM

| Context | Pattern |
|---------|---------|
| SOAP phrase completion | Inline ghost text |
| Diagnosis/ICPC-2 codes | Sidebar panel |
| Treatment techniques | Inline ghost text |
| Red flag detection | Modal (immediate) |
| Exercise recommendations | Sidebar panel |

### Modal: Reserved for Critical Alerts

Use ONLY for immediate life-safety concerns:
- Cauda equina symptoms
- Progressive neurological deficit
- Suspected fracture
- Drug-drug interactions (cardiac risk)

---

## Confidence Visualization

### Traffic Light System with Qualitative Labels

Research shows clinicians respond better to qualitative descriptors than percentages.

```
🟢 Høy sikkerhet (85-100%): Direkte aksept foreslått
🟡 Gjennomgang anbefalt (60-84%): Kliniker verifisering nødvendig
🔴 Manuell input anbefalt (0-59%): AI usikker
```

### Progressive Disclosure of Reasoning

**Level 1 (Always Visible):** Colored dot indicator

**Level 2 (On Hover):** Qualitative label + one-line reason
```
"Høy sikkerhet — matcher 23 lignende konsultasjoner"
```

**Level 3 (On Click/Expand):** Full explanation
```
┌─────────────────────────────────────────────┐
│ AI foreslått: L03 - Ryggsymptom/smerte      │
├─────────────────────────────────────────────┤
│ 📊 Basert på:                               │
│ • Hovedplage: "Ryggsmerter"                 │
│ • Ligner 23 tidligere konsultasjoner        │
│ • VAS-mønster konsistent med L03            │
└─────────────────────────────────────────────┘
```

### Source Linking (Audio-to-Text Alignment)

Critical trust-building feature:

```
AI generates: "Pasienten har tatt Ibuprofen 800mg daglig"
                    ↓
[Hovering highlights waveform segment]
[Clicking plays 3-second audio clip]
                    ↓
Patient voice: "Jeg tar den store Ibuxen hver dag"
```

**Visual Flagging:**
- Solid underline: High confidence transcription
- Dashed underline: Audio unclear, human review needed

### Feedback Capture

```
┌─────────────────────────────────────────┐
│ Var dette nyttig?  [👍] [👎]            │
│                                         │
│ Hvis avvist, hvorfor? (valgfritt)       │
│ ○ Feil teknikk                          │
│ ○ Feil region                           │
│ ○ Manglende kontekst                    │
└─────────────────────────────────────────┘
```

Track acceptance rates by suggestion type.

---

## Voice Technology Architecture

### Technology Comparison

| Option | Cost | HIPAA/GDPR | Best For |
|--------|------|------------|----------|
| **OpenAI Whisper API** | $0.006/min | Not compliant | MVP testing |
| **AWS HealthScribe** | ~$0.02/min | BAA available | Production with PHI |
| **Self-hosted Whisper** | Infrastructure | Full control | Maximum data sovereignty |
| **Browser Web Speech** | Free | No server transmission | Low-stakes dictation |
| **Nuance Dragon** | High licensing | Compliant | Command & control |

### Whisper vs Dragon

| Feature | Whisper | Dragon Medical |
|---------|---------|----------------|
| **Architecture** | Transformer (local/cloud) | Cloud/Hybrid |
| **Medical Accuracy** | Excellent (fine-tuned) | Industry standard |
| **Noise Robustness** | Superior | Good |
| **Accent Handling** | Excellent | Good |
| **Real-time** | Via WebGPU | Yes |
| **Cost** | Low/Free | High per-user |
| **Norwegian** | Good | Limited |

### WebGPU Local Processing

For Norwegian GDPR compliance, local processing is preferred:

```javascript
// Browser-based Whisper via WebGPU
// Audio never leaves device

const transcriber = await pipeline(
  'automatic-speech-recognition',
  'Xenova/whisper-small',
  { device: 'webgpu' }
);

const result = await transcriber(audioBlob, {
  language: 'norwegian',
  task: 'transcribe'
});
```

**Benefits:**
- Privacy: Audio processed in RAM, discarded
- Zero latency on modern hardware
- Offline capability
- No "Business Associate" processing

### Recommendation for ChiroClickCRM

| Use Case | Technology |
|----------|------------|
| Ambient documentation | Local Whisper (WebGPU) |
| UI navigation by voice | Browser Speech API |
| High-accuracy medical terms | Self-hosted Whisper (fine-tuned) |

---

## Offline-First Architecture

### Why Offline Matters

Clinical environments have unpredictable connectivity:
- Lead-lined radiology suites
- Rural home health
- Emergency situations
- Unreliable clinic WiFi

### Local-First Storage Pattern

```
┌─────────────────────────────────────┐
│           UI Layer                  │
│  (Reads from local database only)   │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│         IndexedDB (via Dexie.js)    │
│  - All reads/writes go here first   │
│  - Single source of truth for UI    │
└────────────────┬────────────────────┘
                 │ (Background sync)
┌────────────────▼────────────────────┐
│         Sync Queue                  │
│  - Queues changes when offline      │
│  - Processes when online            │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│         Remote Server               │
└─────────────────────────────────────┘
```

### Existing Implementation

ChiroClickCRM's exercise system already uses this pattern:

```javascript
// frontend/src/hooks/useExerciseSync.js
// Implements IndexedDB caching with background sync
```

### Conflict Resolution

For single-clinician practice, **last-write-wins with timestamps**:

```javascript
if (clientRecord.updatedAt > serverRecord.updatedAt) {
  acceptClientChange();
} else {
  returnServerVersionToClient();
}
```

For critical medical data: **full audit trail, soft-delete only**.

### Connection Status UI

```
┌────────────────────────────────────┐
│ 🟢 Synkronisert 2m siden           │
│ ⏳ Synkroniserer...                │
│ 🟡 Arbeider offline (3 ventende)   │
│ 🔴 Synkronisering feilet - prøv igjen │
└────────────────────────────────────┘
```

### Delta Sync Optimization

Minimize bandwidth with timestamp-based sync:

```javascript
// Client sends last_sync_timestamp
// Server returns only changed rows
const changes = await api.sync({
  since: lastSyncTimestamp,
  tables: ['encounters', 'patients', 'exercises']
});
```

---

## Norwegian Healthcare Compliance

### Normen Requirements

Norway's Normen (Code of Conduct for Information Security) applies to all healthcare software:

| Requirement | Implementation |
|-------------|---------------|
| Documented access control | Role-based permissions with audit logging |
| Risk analysis documentation | DPIA templates in `/compliance/` |
| Encryption at rest | AES-256 |
| Encryption in transit | TLS 1.3 |
| Patient rights | Access, correction, deletion workflows |
| Data location | EEA/adequate countries only |

### HelseID Integration

Norway adopted **FAPI 2.0** (banking-grade security) for healthcare auth.

**Architecture for future integration:**
```
ChiroClickCRM → HelseID OAuth 2.0/OIDC → Helsenorge Patient Portal
```

### Localization Requirements

| Element | Norwegian Standard |
|---------|-------------------|
| Language | Bokmål (primary) |
| Date format | DD.MM.YYYY |
| Number format | 1.234,56 |
| Currency | NOK |
| Medical terminology | ICPC-2 Norwegian edition |

### Uu-tilsynet Enforcement

The Authority for Universal Design of ICT actively enforces accessibility:

- **Active audits** and fines (not passive requirements)
- Daily fines up to NOK 50,000 for WCAG violations
- Case precedent: HelsaMi patient portal fined for violations

---

## Accessibility Standards (WCAG)

### Critical Requirements for Medical Forms

#### Color Contrast
- **4.5:1 minimum** for normal text
- **3:1 minimum** for UI components
- Never rely on color alone - add icons/text labels

#### Touch Targets
- **44×44px minimum** for clinical buttons (WCAG 2.2 AAA)
- **24×24px absolute minimum** with 24px spacing
- Larger = fewer errors during fast clinical work

#### Keyboard Navigation
- All interactive elements keyboard-accessible
- **Visible focus indicators** (3:1 contrast)
- Logical tab order
- Focus never obscured by sticky headers

### Body Diagram Accessibility

```jsx
// Accessible body diagram implementation
<svg role="application" aria-label="Velg kroppsregion">
  {regions.map(region => (
    <path
      key={region.id}
      role="button"
      tabIndex={0}
      aria-label={region.norwegianName}
      onKeyDown={(e) => e.key === 'Enter' && selectRegion(region)}
      onClick={() => selectRegion(region)}
    />
  ))}
</svg>

{/* Text alternative */}
<label htmlFor="region-select" className="sr-only">
  Velg kroppsregion (alternativ)
</label>
<select id="region-select" onChange={handleRegionSelect}>
  {regions.map(r => <option key={r.id}>{r.norwegianName}</option>)}
</select>

{/* Live announcements */}
<div aria-live="polite" className="sr-only">
  {selectedRegion && `Valgt: ${selectedRegion.norwegianName}`}
</div>
```

### Leveraging Norwegian Design Systems

**NAV Aksel** - Government design system with accessible React components:
```bash
npm install @navikt/ds-react @navikt/ds-css
```

**Helsedirektoratet Frisk** - Health-specific components:
```
https://utviklingdesignsystem.helsedir.no/
```

---

## Mobile and Tablet Patterns

### Touch-Optimized Clinical Documentation

| Mode | Use Case |
|------|----------|
| Portrait | Form entry, scrolling notes |
| Landscape | Body diagrams, comparison views |

**Requirements:**
- Support both orientations (WCAG 1.3.4)
- Sticky save button always visible
- Swipe gestures with button alternatives
- Pinch-zoom on body diagrams

### Responsive Layout Strategy

```
Portrait tablet (768px):
┌─────────────────────────┐
│ Patient Header          │
├─────────────────────────┤
│ SOAP Notes Form         │
│ (full width, stacked)   │
├─────────────────────────┤
│ Body Diagram            │
│ (collapsible section)   │
└─────────────────────────┘

Landscape tablet (1024px):
┌───────────────┬─────────┐
│ Patient Info  │ Body    │
├───────────────┤ Diagram │
│ SOAP Notes    │ (fixed) │
│ (scrollable)  │         │
└───────────────┴─────────┘
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-6)

- [ ] Text expansion/macro system with `/` triggers
- [ ] SOAP template library with modular add-ons
- [ ] SALT/duplicate last visit functionality
- [ ] Basic click-to-mark spine diagram ✅ (Implemented)
- [ ] IndexedDB local storage with basic sync
- [ ] Norwegian localization (date/number formats)

### Phase 2: AI Enhancement (Weeks 7-12)

- [ ] Click-to-dictate voice input with state indicators
- [ ] Inline ghost text suggestions for SOAP phrases
- [ ] AI-structured note generation
- [ ] Sidebar panel for diagnostic codes
- [ ] Confidence visualization (traffic light)

### Phase 3: Polish and Compliance (Weeks 13-16)

- [ ] Progressive disclosure for AI reasoning
- [ ] Feedback capture system
- [ ] Red flag detection with modal alerts
- [ ] WCAG AA audit and remediation
- [ ] Offline robustness testing
- [ ] Normen compliance documentation

---

## Key Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Clicks per encounter | <15 | Measures documentation efficiency |
| Time to complete SOAP | <90 seconds | Reduces after-hours documentation |
| AI suggestion acceptance | 65-75% | Indicates suggestion quality |
| Template usage rate | >70% of notes | Shows system adoption |
| Offline sync success | >99% | Ensures data integrity |
| Accessibility score | WCAG AA pass | Compliance and usability |

---

## Keyboard Shortcuts Reference

| Action | Shortcut | Context |
|--------|----------|---------|
| Accept AI suggestion | `Tab` | Inline ghost text |
| Accept next word | `Ctrl+→` | Incremental acceptance |
| Dismiss suggestion | `Escape` | Any AI suggestion |
| See alternatives | `Alt+]` / `Alt+[` | Browse options |
| Accept + flag review | `Ctrl+Enter` | Uncertain acceptance |
| Open quick search | `Ctrl+K` | Global |
| Save note | `Ctrl+S` | Note editor |
| Insert template | `/` | Note editor |

---

## Related Documentation

- [NORWEGIAN_HEALTHCARE_ROADMAP.md](../NORWEGIAN_HEALTHCARE_ROADMAP.md) - Regulatory integration
- [CLAUDE.md](../CLAUDE.md) - Project overview and AI system
- [docs/AUTOMATED_ANAMNESIS_SYSTEM.md](AUTOMATED_ANAMNESIS_SYSTEM.md) - Intake automation
- [frontend/src/components/anatomy/](../frontend/src/components/anatomy/) - Body diagram components
- [frontend/src/components/clinical/](../frontend/src/components/clinical/) - Clinical UI components

---

## References

### Industry Standards
- Jane App Documentation Patterns
- ChiroTouch Spine Interface
- ChiroUp SAOP Methodology
- Epic SmartPhrases
- Nuance DAX Copilot
- Nabla Copilot

### Technical Resources
- WCAG 2.1/2.2 Guidelines
- NAV Aksel Design System
- Helsedirektoratet Frisk
- Normen (Norwegian Healthcare Security Standard)
- FAPI 2.0 (HelseID)

### Research
- Physician Burnout and EHR Studies (Tebra, Health Catalyst)
- Ambient Clinical Intelligence Patterns
- Offline-First Architecture (RxDB, CRDTs)

---

*Last Updated: January 2026*
*Maintainer: ChiroClickCRM Development Team*
