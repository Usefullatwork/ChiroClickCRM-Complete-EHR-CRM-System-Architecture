# ChiroClickEHR WCAG 2.1 AA Accessibility Audit

**Date**: 2026-03-30
**Sprint**: 7B — Accessibility Hardening
**Standard**: WCAG 2.1 Level AA (Norwegian healthcare — mandatory per universell utforming)

---

## Executive Summary

| Category                   | Critical | High   | Medium | Low        | Total    |
| -------------------------- | -------- | ------ | ------ | ---------- | -------- |
| aria-labels                | 40       | 36     | 0      | widespread | 78+      |
| Semantic roles & landmarks | 4        | 6      | 4      | 1          | 15       |
| Focus management           | 5        | 5      | 2      | 2          | 14       |
| Norwegian UX copy          | 5        | 16     | 4      | 0          | 25       |
| **Total**                  | **54**   | **63** | **10** | **3+**     | **132+** |

**Existing good patterns**: Input validation uses `role="alert"`, LoadingSpinner uses `role="status"` + `aria-live`, sidebar `<nav>` has `aria-label`, skip-to-content link exists, nav items use `aria-current="page"`, breadcrumbs have `aria-label`, mobile drawer has `role="dialog"` + `aria-modal`.

---

## 1. Icon-Only Interactive Elements Missing aria-label

### 1a. Critical — No aria-label AND no title (40 elements)

| File                                  | Line | Icon         | Suggested aria-label      |
| ------------------------------------- | ---- | ------------ | ------------------------- |
| `billing/InvoiceGenerator.jsx`        | 211  | X            | "Lukk"                    |
| `billing/InvoicePreview.jsx`          | 218  | X            | "Lukk"                    |
| `billing/PaymentTracker.jsx`          | 171  | X            | "Lukk"                    |
| `crm/ExerciseTemplates.jsx`           | 362  | Eye          | "Vis mal"                 |
| `crm/ExerciseTemplates.jsx`           | 368  | Edit         | "Rediger mal"             |
| `crm/ExerciseTemplates.jsx`           | 371  | Copy         | "Kopier mal"              |
| `crm/ExerciseTemplates.jsx`           | 669  | Download     | "Last ned"                |
| `crm/LeadManagement.jsx`              | 408  | MoreVertical | "Flere handlinger"        |
| `crm/PatientLifecycle.jsx`            | 451  | MoreVertical | "Flere handlinger"        |
| `crm/RecallManager.jsx`               | 513  | Pause/Play   | "Pause/Start kampanje"    |
| `crm/RecallManager.jsx`               | 520  | Edit3        | "Rediger kampanje"        |
| `crm/RecallManager.jsx`               | 523  | Trash2       | "Slett kampanje"          |
| `crm/SMSConversation.jsx`             | 359  | MoreVertical | "Flere handlinger"        |
| `crm/SurveyManager.jsx`               | 413  | Edit         | "Rediger undersokelse"    |
| `crm/SurveyManager.jsx`               | 416  | Send         | "Send undersokelse"       |
| `crm/SurveyManager.jsx`               | 419  | BarChart2    | "Vis statistikk"          |
| `encounter/DiagnosisPanel.jsx`        | 81   | X            | "Fjern diagnosekode"      |
| `examination/BPPVTestPanel.jsx`       | 445  | XCircle      | "Lukk"                    |
| `ExaminationProtocolPicker.jsx`       | 170  | X            | "Lukk"                    |
| `exercises/ExercisePanel.jsx`         | 314  | X            | "Lukk"                    |
| `exercises/ExercisePanel.jsx`         | 325  | X            | "Lukk feilmelding"        |
| `exercises/PatientExercises.jsx`      | 136  | X            | "Lukk"                    |
| `exercises/PrescriptionPreview.jsx`   | 202  | X            | "Lukk"                    |
| `GDPRExportModal.jsx`                 | 72   | X            | "Lukk"                    |
| `InvoiceModal.jsx`                    | 64   | X            | "Lukk"                    |
| `macros/MacroManager.jsx`             | 527  | X            | "Lukk"                    |
| `notes/FollowUpTemplate.jsx`          | 810  | X            | "Fjern kode"              |
| `notes/ICD10CodePicker.jsx`           | 390  | X            | "Lukk"                    |
| `notes/NotePreview.jsx`               | 237  | X            | "Lukk"                    |
| `settings/AutoAcceptSettings.jsx`     | 171  | X            | "Lukk feilmelding"        |
| `TemplatePicker.jsx`                  | 187  | X            | "Lukk"                    |
| `templates/DragDropFormBuilder.jsx`   | 346  | X            | "Lukk"                    |
| `templates/DragDropFormBuilder.jsx`   | 764  | Star         | "Vurdering N av 5"        |
| `OldNotesImporter.jsx`                | 245  | SVG(X)       | "Lukk"                    |
| `pages/ExercisePrescription.jsx`      | 533  | X            | "Lukk feilmelding"        |
| `pages/Exercises.jsx`                 | 413  | X            | "Lukk feilmelding"        |
| `pages/portal/PortalAppointments.jsx` | 203  | X            | "Lukk feilmelding"        |
| `pages/portal/PortalMessages.jsx`     | 166  | X            | "Lukk feilmelding"        |
| `pages/portal/PatientExercises.jsx`   | 326  | Star         | "Vurdering N av 5"        |
| `notes/ICD10CodePicker.jsx`           | 373  | Star         | "Legg til/Fjern favoritt" |

### 1b. High — Has title but no aria-label (36 elements)

Elements with `title` tooltips that need `aria-label` for reliable screen reader support. Key files: `notes/NotesList.jsx` (5), `crm/CampaignManager.jsx` (5), `crm/WorkflowBuilder.jsx` (4), `exercises/PrescriptionCard.jsx` (4), `training/DataCurationTab.jsx` (3), anatomy viewers (2), assessment tools (3), clinical components (4), portal (1).

### 1c. Non-button clickable elements (2 elements)

| File                                        | Line | Element         | Fix                                                 |
| ------------------------------------------- | ---- | --------------- | --------------------------------------------------- |
| `ClinicalProtocols/ProtocolList.jsx`        | 14   | `<div onClick>` | Change to `<button>` or add role/tabIndex/onKeyDown |
| `PatientEducationLibrary/EducationCard.jsx` | 8    | `<div onClick>` | Change to `<button>` or add role/tabIndex/onKeyDown |

---

## 2. Semantic Roles & Landmarks

### 2a. Critical — Missing `<main>` landmark

`DashboardLayout.jsx` line 385: Content area is `<div id="main-content">` — should be `<main id="main-content">`.

### 2b. Critical — 10 custom tab interfaces missing tab ARIA roles

None use `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`.

| Page               | Lines   | Tab count     |
| ------------------ | ------- | ------------- |
| Settings.jsx       | 288-314 | 12 tabs       |
| PatientDetail.jsx  | 250-263 | 5 tabs        |
| Billing.jsx        | 281-317 | 3 tabs        |
| Communications.jsx | 156-185 | 2 tabs        |
| FollowUps.jsx      | 179-227 | 4 tabs        |
| Automations.jsx    | 390-411 | 3 tabs        |
| Training.jsx       | 109-120 | 4 tabs        |
| Import.jsx         | 162-189 | 2 tabs        |
| Exercises.jsx      | 354-384 | 2-3 tabs      |
| EasyAssessment.jsx | 292-306 | 4 tabs (SOAP) |

### 2c. High — Alert components missing role="alert"

| Component                     | Fix                                                                     |
| ----------------------------- | ----------------------------------------------------------------------- |
| Alert.jsx                     | Add `role="alert"` for danger/warning, `role="status"` for info/success |
| ErrorBoundary.jsx             | Add `role="alert"`                                                      |
| PageErrorBoundary.jsx         | Add `role="alert"`                                                      |
| OfflineIndicator.jsx          | Add `role="status"` + `aria-live="polite"`                              |
| EasyAssessment red flags      | Add `role="alert"`                                                      |
| PatientDetail follow-up alert | Add `role="alert"`                                                      |

### 2d. High — 35+ tables missing scope="col"

Zero `scope="col"` on `<th>` elements across entire codebase. No `<caption>` elements. Priority fix: `ResponsiveTable.jsx` (reusable component).

### 2e. Medium — Lists missing semantic markup

PatientDetail encounters, Appointments list, ResponsiveTable card view — should use `<ul>/<li>`.

### 2f. Medium — Tab `<nav>` semantically incorrect

5 pages use `<nav>` for tab controls — should be `<div role="tablist">`.

### 2g. Medium — MobileNav missing aria-label

`MobileNav.jsx` line 177: `<nav>` without `aria-label`.

---

## 3. Focus Management

### 3a. Critical — 11 modals/dialogs have no focus trap

| Component                           | Focus Trap  | ESC | Auto-focus | role="dialog"     |
| ----------------------------------- | ----------- | --- | ---------- | ----------------- |
| Modal.jsx                           | YES (buggy) | YES | YES        | YES               |
| ConfirmDialog.jsx                   | NO          | NO  | NO         | YES (alertdialog) |
| PromptDialog.jsx                    | NO          | YES | YES        | YES               |
| SendDocumentModal.jsx               | NO          | NO  | NO         | YES               |
| KeyboardShortcutsModal (common)     | NO          | NO  | NO         | YES               |
| KeyboardShortcutsModal (encounter)  | NO          | NO  | NO         | NO                |
| UnsavedChangesDialog.jsx            | NO          | NO  | NO         | YES (alertdialog) |
| BookingModal.jsx                    | NO          | NO  | NO         | NO                |
| GDPRExportModal.jsx                 | NO          | NO  | NO         | NO                |
| InvoiceModal.jsx                    | NO          | NO  | NO         | NO                |
| RedFlagModal.jsx                    | NO          | NO  | NO         | YES               |
| InviteUserModal.jsx                 | NO          | NO  | YES        | NO                |
| EasyAssessmentModals.jsx (8 modals) | NO          | NO  | NO         | NO                |

### 3b. Critical — No focus restoration on any modal

No modal stores `document.activeElement` before open or restores focus on close.

### 3c. Critical — Skip-to-content link in wrong DOM position

Located AFTER sidebar navigation in DOM (line 332) — should be FIRST focusable element.

### 3d. High — Modal.jsx bugs

- Static focusable element list (never refreshes for dynamic content)
- Missing `useTranslation` import

### 3e. Medium — No global `:focus-visible` styles

Design tokens exist (`--ring`, `--focus-ring-width`) but no global CSS rule applies them. Inconsistent focus ring colors across components (blue-500, teal-500, ring token).

---

## 4. Norwegian UX Copy Issues

### 4a. Critical — Login page entirely in English

`Login.jsx`: Zero i18n — "Sign in to your account", "Signing in...", "Failed to login" all hardcoded English.

### 4b. Critical — NewAppointment validation messages in English

Lines 85-109: "Patient is required", "Start time is required", etc.

### 4c. Critical — EasyAssessment clinical labels in English

SubjectiveTab, ObjectiveTab, PlanTab, AssessmentTab — all field labels and placeholders in English ("Chief Complaint", "History", "Range of Motion", etc.).

### 4d. High — Typos in ClinicalNotes.jsx

- Line 335: "Prosv" should be "Prøv"
- Line 372: "prov" should be "prøv"

### 4e. High — "e.g." instead of "f.eks." across forms

NewPatient.jsx, AdvancedPatientSearch.jsx — English abbreviation throughout.

### 4f. High — Breadcrumbs use "Dashboard" in English

NewAppointment.jsx, NewPatient.jsx — hardcoded English fallbacks.

### 4g. Medium — Empty states too terse

"Ingen avtaler" without actionable guidance — should add "Legg til..." CTA text.

### 4h. Medium — 9+ CRM components with English error messages

"Failed to load patient data", "Failed to load workflows", etc.

---

## Remediation Plan

| Phase       | Scope                                                                  | Priority      |
| ----------- | ---------------------------------------------------------------------- | ------------- |
| Sprint 7B-2 | Fix all 78+ aria-label violations                                      | Critical      |
| Sprint 7B-3 | Add tab roles, `<main>`, `role="alert"`, table scope                   | Critical      |
| Sprint 7B-4 | Focus traps, restoration, skip-link position, global focus-visible     | Critical      |
| Sprint 7B-5 | Norwegian copy: Login, EasyAssessment, validation, typos, empty states | Critical/High |
| Sprint 7B-6 | vitest-axe automated tests for 10 key pages                            | High          |
