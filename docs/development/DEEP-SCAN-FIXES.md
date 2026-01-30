# ChiroClick CRM - Deep Scan Fix Plan

Generated: 2026-01-29

## Executive Summary

A deep scan of the codebase revealed **42 issues** affecting user experience, data integrity, and system reliability. This document outlines the problems and proposed solutions.

---

## Part 1: Critical Fixes (Do Immediately)

### 1.1 Fix Hardcoded Practitioner ID

**Problem:** All SOAP notes saved under dev user ID
**File:** `frontend/src/pages/ClinicalEncounter.jsx:722, 769`
**Fix:**
```javascript
// Replace:
practitioner_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',

// With:
practitioner_id: user?.id || session?.user?.id,
```

### 1.2 Add Error Display for Save Failures

**Problem:** Silent save failures cause data loss
**File:** `frontend/src/pages/ClinicalEncounter.jsx:445-447`
**Fix:**
```javascript
onError: (error) => {
  setAutoSaveStatus('error');
  setSaveError(error.message || 'Kunne ikke lagre. Prøv igjen.');
  // Show toast notification
  toast.error('Lagring feilet: ' + error.message);
}
```

### 1.3 Fix Race Condition in Sign & Lock

**Problem:** setTimeout(500ms) causes data loss if save takes longer
**File:** `frontend/src/pages/ClinicalEncounter.jsx:763-814`
**Fix:**
```javascript
const handleSignAndLock = async () => {
  if (encounterId) {
    // Wait for save to complete, then sign
    await saveMutation.mutateAsync(dataToSave);
    signMutation.mutate(encounterId);
  }
};
```

### 1.4 Remove Dead EncounterContext Imports

**Problem:** Components import non-existent context
**Files:** `Encounter/SubjectiveSection.jsx`, `ObjectiveSection.jsx`, `AssessmentSection.jsx`, `PlanSection.jsx`
**Fix:** Delete these files or create the missing EncounterContext

---

## Part 2: Quick Notes System Design

### Feature: Quick Notes in Patient File

**Goal:** Add quick follow-up notes, tasks, and reminders directly from patient file or SOAP note.

#### Database Schema
```sql
CREATE TABLE patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES users(id),

  -- Note content
  note_type VARCHAR(20) NOT NULL DEFAULT 'note', -- note, task, reminder, follow_up
  content TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent

  -- Task/reminder specific
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  assigned_to UUID REFERENCES users(id),

  -- Communication link
  send_method VARCHAR(10), -- null, sms, email
  message_template_id UUID REFERENCES message_templates(id),
  message_status VARCHAR(20), -- draft, pending_approval, approved, sent, failed

  -- Metadata
  encounter_id UUID REFERENCES clinical_encounters(id), -- Link to SOAP note if created there
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patient_notes_patient ON patient_notes(patient_id);
CREATE INDEX idx_patient_notes_due ON patient_notes(due_date) WHERE completed_at IS NULL;
CREATE INDEX idx_patient_notes_pending ON patient_notes(message_status) WHERE message_status = 'pending_approval';
```

#### UI Component: QuickNotePanel

Location: Right sidebar in PatientDetail and ClinicalEncounter

```
┌─────────────────────────────────┐
│  📝 Hurtignotater               │
├─────────────────────────────────┤
│ [📌 Notat] [✓ Oppgave] [⏰ Påm] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Skriv notat...              │ │
│ └─────────────────────────────┘ │
│ Prioritet: [Normal ▼]           │
│ Forfallsdato: [__/__/____]      │
│                                 │
│ ☐ Send SMS til pasient          │
│ ☐ Send e-post til pasient       │
│                                 │
│ [Lagre] [Lagre & Send ▼]        │
├─────────────────────────────────┤
│ Tidligere notater:              │
│ ─────────────────────────────── │
│ 📌 Ring om 2 uker      27.01.26 │
│ ✓ Sjekk røntgen        25.01.26 │
│ ⏰ Oppfølging hodepine  20.01.26 │
└─────────────────────────────────┘
```

#### Quick Actions from SOAP Note

Add to ClinicalEncounter.jsx footer:
```
┌─────────────────────────────────────────────────────────┐
│ Hurtighandlinger:                                       │
│ [📱 SMS pasient] [📧 E-post] [📅 Neste time] [📝 Notat] │
└─────────────────────────────────────────────────────────┘
```

---

## Part 3: No-Show Auto-Messaging with Approval

### Feature: No-Show Management Dashboard

**Goal:** Upload/mark no-shows → Auto-generate messages → Review & approve → Send

#### Workflow

```
1. Mark No-Show (manual or import)
         ↓
2. System generates message from template
         ↓
3. Message enters "Pending Approval" queue
         ↓
4. Staff reviews in Approval Dashboard
         ↓
5. [Approve] → Send immediately
   [Edit] → Modify then send
   [Reject] → Discard message
```

#### Database Changes

```sql
-- Add approval workflow to communications
ALTER TABLE communications ADD COLUMN IF NOT EXISTS
  approval_status VARCHAR(20) DEFAULT 'approved'; -- draft, pending, approved, rejected

ALTER TABLE communications ADD COLUMN IF NOT EXISTS
  approved_by UUID REFERENCES users(id);

ALTER TABLE communications ADD COLUMN IF NOT EXISTS
  approved_at TIMESTAMP;

ALTER TABLE communications ADD COLUMN IF NOT EXISTS
  original_content TEXT; -- Store pre-edit content

-- Add no-show trigger
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS
  noshow_message_queued BOOLEAN DEFAULT false;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS
  noshow_reason VARCHAR(100);
```

#### UI: Message Approval Dashboard

Location: New page at `/communications/approval`

```
┌──────────────────────────────────────────────────────────────────┐
│ 📬 Meldingsgodkjenning                        [Godkjenn alle ✓]  │
├──────────────────────────────────────────────────────────────────┤
│ Venter på godkjenning: 5 meldinger                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 📱 SMS til Ola Nordmann                      No-show 28.01   │ │
│ │ ───────────────────────────────────────────────────────────  │ │
│ │ Hei Ola, du møtte ikke til timen din i dag. Ring oss på      │ │
│ │ 12345678 for å avtale ny time. Hilsen Klinikken              │ │
│ │ ───────────────────────────────────────────────────────────  │ │
│ │ [✓ Godkjenn] [✏️ Rediger] [✗ Avvis]                          │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 📱 SMS til Kari Hansen                       No-show 28.01   │ │
│ │ ───────────────────────────────────────────────────────────  │ │
│ │ Hei Kari, vi savnet deg på timen i dag! Håper alt er bra...  │ │
│ │ ───────────────────────────────────────────────────────────  │ │
│ │ [✓ Godkjenn] [✏️ Rediger] [✗ Avvis]                          │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### UI: No-Show Import

Location: Modal in Schedule page

```
┌──────────────────────────────────────────────────────────┐
│ 📥 Importer No-Shows                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Dra fil hit eller [Velg fil]                             │
│                                                          │
│ Format: CSV med kolonner:                                │
│ - pasient_id ELLER telefon ELLER e-post                  │
│ - dato (valgfri, standard = i dag)                       │
│                                                          │
│ ───────────────────────────────────────────────────────  │
│                                                          │
│ Forhåndsvisning:                                         │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ✓ Ola Nordmann - 28.01.2026 kl 10:00                 │ │
│ │ ✓ Kari Hansen - 28.01.2026 kl 11:30                  │ │
│ │ ⚠ Ukjent telefon: 98765432                           │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ☑ Generer SMS-meldinger automatisk                       │
│ ☐ Send til godkjenningskø (anbefalt)                     │
│ ☐ Send direkte (ikke anbefalt)                           │
│                                                          │
│ [Avbryt] [Importer og kømeldinger]                       │
└──────────────────────────────────────────────────────────┘
```

#### Backend: Auto-Generate No-Show Messages

```javascript
// backend/src/jobs/noShowProcessor.js

async function processNoShows() {
  // Find appointments that became no-show without message queued
  const noShows = await db.query(`
    SELECT a.*, p.first_name, p.phone, p.email, p.preferred_language
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.status = 'NO_SHOW'
    AND a.noshow_message_queued = false
    AND a.start_time > NOW() - INTERVAL '24 hours'
  `);

  for (const noShow of noShows.rows) {
    // Get template based on patient preference/clinic settings
    const template = await getTemplate('no_show_follow_up', noShow.preferred_language);

    // Generate personalized message
    const message = renderTemplate(template, {
      firstName: noShow.first_name,
      date: formatDate(noShow.start_time),
      time: formatTime(noShow.start_time),
      clinic: noShow.clinic_name,
      phone: noShow.clinic_phone
    });

    // Queue message for approval
    await db.query(`
      INSERT INTO communications (
        patient_id, organization_id, type, content,
        approval_status, created_at
      ) VALUES ($1, $2, 'SMS', $3, 'pending', NOW())
    `, [noShow.patient_id, noShow.organization_id, message]);

    // Mark appointment as queued
    await db.query(`
      UPDATE appointments SET noshow_message_queued = true WHERE id = $1
    `, [noShow.id]);
  }
}

// Register job - run every 30 minutes
scheduler.register('noshow-message-generator', '*/30 * * * *', processNoShows);
```

---

## Part 4: Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. ✅ Fix hardcoded practitioner ID
2. ✅ Add save error display with toast
3. ✅ Fix race condition in sign & lock
4. ✅ Add error boundaries to all pages
5. ✅ Fix "View all visits" button

### Phase 2: Quick Notes (Week 2)
1. Create patient_notes table
2. Build QuickNotePanel component
3. Add to PatientDetail sidebar
4. Add quick actions to ClinicalEncounter footer
5. Create API endpoints

### Phase 3: No-Show System (Week 3)
1. Add approval workflow columns
2. Create no-show message processor job
3. Build Message Approval Dashboard
4. Build No-Show Import modal
5. Add no-show auto-detection job

### Phase 4: Reminders & Automation (Week 4)
1. Implement appointment reminder job
2. Connect TodaysMessages to real data
3. Build kiosk check-in UI
4. Implement recurring appointment generation

---

## Appendix: All Issues by Category

### Clinical Encounter (15 issues)
1. CRITICAL: Non-existent EncounterContext
2. CRITICAL: Hardcoded dev user ID
3. HIGH: Silent save failures
4. HIGH: Race condition save+sign
5. HIGH: Auto-save race on mount
6. HIGH: No unsaved changes warning
7. MEDIUM: 65+ state variables
8. MEDIUM: Misleading auto-save status
9. MEDIUM: Macro hint positioning
10. LOW: Console logs in production

### Communication System (8 issues)
1. CRITICAL: Appointment reminders not implemented
2. HIGH: No-show handling manual only
3. HIGH: No approval workflow
4. HIGH: TodaysMessages uses mock data
5. MEDIUM: Bulk communications stubbed
6. MEDIUM: Automations stubbed
7. MEDIUM: No two-way SMS
8. LOW: No message scheduling

### Scheduler/Appointments (8 issues)
1. CRITICAL: Kiosk route is stub
2. CRITICAL: Recurring appointments fake
3. HIGH: No conflict detection
4. HIGH: Status mismatch (CHECKED_IN vs ARRIVED)
5. MEDIUM: Calendar uses mock data
6. MEDIUM: Waitlist not automated
7. MEDIUM: No double-booking prevention
8. LOW: Missing minimum duration validation

### API/Data Flow (15 issues)
1. CRITICAL: Two conflicting API clients
2. CRITICAL: Stubbed routes called from frontend
3. HIGH: Zero error state handling
4. HIGH: Missing error boundaries
5. HIGH: Unsafe response assumptions
6. MEDIUM: React Query version mismatch
7. MEDIUM: Missing enabled guards
8. MEDIUM: No retry logic
9. MEDIUM: Stale data issues
10. LOW: Inconsistent query keys
