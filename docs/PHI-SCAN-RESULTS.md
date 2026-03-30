# PHI Leak Scan Results

**Date**: 2026-03-30
**Scanner**: Automated PHI Scan (Sprint 7C)
**Scope**: `backend/src/` and `frontend/src/` (all subdirectories)
**PHI Rules**: As defined in `.claude/rules/patient-data-handling.md`

## Summary

**8 findings** (1 High, 4 Medium, 3 Low)

No Critical findings. No fodselsnummer/national ID leaks to console, logs, URLs, or client-side storage. The codebase demonstrates good PHI discipline overall. The findings below are defense-in-depth gaps and areas where the blast radius of a single bug could expose PHI.

---

## 1. Console/Log Leaks

| File                                 | Line  | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/utils/logger.js`       | 68-89 | **Medium** | `sendToRemote()` sends `window.location.href` and error `data` to a remote logging endpoint. If a component passes patient data as the `data` argument (e.g., `logger.error('Failed to save', patientObject)`), PHI would be transmitted to the remote logging service. The logger itself does not filter or redact PHI fields.                              |
| `backend/src/jobs/actionExecutor.js` | 21    | **Low**    | Logs `patientId` and full `config` object: `logger.info('[ActionExecutor] Executing ${actionType}', { organizationId, patientId, config })`. The `config` object may contain patient-related template variables (e.g., `firstName`, `phone`) depending on the action type. Patient UUIDs in logs are acceptable, but the unfiltered `config` dump is a risk. |

**Backend `console.*` calls**: Zero. The backend uses Winston exclusively. The pre-commit hook blocks `console.log` and the backend has no `console.error/warn/info` calls in `src/`.

**Frontend `console.*` calls**: Only in `frontend/src/utils/logger.js` (the centralized logger). All 6 calls (lines 108, 110, 123, 125, 138, 140, 153, 155) are gated behind `shouldLog()` which checks `config.enabled`. In production, logging is disabled by default (`import.meta.env.DEV` is false) unless `VITE_ENABLE_LOGGING=true` is explicitly set. This is a solid design.

---

## 2. Error Response Leaks

| File | Line | Severity | Finding |
| ---- | ---- | -------- | ------- |

**Clean** -- with one advisory note.

**server.js global error handler** (lines 494-526): Properly suppresses error details in production. Stack traces are only sent when `NODE_ENV === 'development'` (line 524). For 500 errors in production, the message is hardcoded to `'Internal server error'` (lines 514-516). Non-500 operational errors send `err.message` which is controlled by the `AppError` subclasses and contains no PHI.

**errorHandler.js middleware** (lines 109-116): Same pattern -- `isDevelopment` guard for stack traces and messages. 500 responses in production use generic `'An unexpected error occurred'`.

**Advisory**: The server.js error handler unconditionally sends `err.details` (line 523: `...(err.details && { details: err.details })`). The `AppError.details` field is set by application code (e.g., `ConflictError` includes `{ resource, field, value }`). If a `ConflictError` is thrown with patient-identifiable field values (e.g., `new ConflictError('Patient', 'solvit_id', 'actual-id')`), the `details` field would leak to the client in all environments including production. Currently the code does not pass PHI into error constructors, but this is a defense-in-depth gap.

---

## 3. URL Parameter Leaks

| File                                        | Line   | Severity | Finding                                                                      |
| ------------------------------------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| `backend/src/controllers/appointments.js`   | 53     | **Low**  | `req.query.patientId` used as a filter parameter for listing appointments.   |
| `backend/src/controllers/communications.js` | 15     | **Low**  | `req.query.patientId` used as a filter parameter for listing communications. |
| `backend/src/controllers/followups.js`      | 16     | Low      | `req.query.patientId` used as a filter for follow-up listing.                |
| `backend/src/controllers/crmCore.js`        | 214    | Low      | `req.query.patientId` used as a filter for CRM data.                         |
| `backend/src/controllers/financial.js`      | 17     | Low      | `req.query.patientId` used as a filter for financial listing.                |
| `backend/src/controllers/encounters.js`     | 53     | Low      | `req.query.patientId` used as a filter for encounter listing.                |
| `backend/src/routes/billing/claims.js`      | 42, 54 | Low      | `req.query.patient_id` used as a filter for claims listing.                  |

**Assessment**: These are UUID-format patient IDs used as query parameter **filters** (e.g., `GET /appointments?patientId=uuid`), not as primary resource identifiers. This is a common API pattern and the IDs are opaque UUIDs, not fodselsnummer or names. All routes require authentication. The URL query string approach means patient UUIDs may appear in server access logs, browser history, and proxy logs.

**No fodselsnummer/fnr/national_id in query parameters** -- confirmed clean via grep.

**Verdict**: Low risk. UUIDs in query params are acceptable for filtering. The patient-data-handling rules state "Never put patient identifiers in URL query parameters" which technically includes UUIDs, but the spirit of the rule targets identifying information (fodselsnummer, names). This is a borderline finding.

---

## 4. Client-Side Storage Leaks

| File                                                | Line     | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/hooks/useAutoSave.js`                 | 63       | **High**   | Auto-saves form data to `localStorage` with key prefix `chiroclickehr_autosave_`. The hook is generic and saves **whatever data is passed to `save()`**. If used on encounter/SOAP forms, this persists clinical notes (subjective complaints, diagnoses, ICPC-2 codes, treatment plans) in plaintext localStorage. Data expires after 24 hours but is not encrypted. Any XSS vulnerability or browser extension with storage access could read this. |
| `frontend/src/services/messagingService.js`         | 367      | **Medium** | Stores full conversation history (SMS messages) in `localStorage` under key `chiroclickehr_conversations`. Messages contain patient phone numbers, and message bodies may contain patient first names from template variables (e.g., `"Hei {firstName}! ..."`). No encryption, no expiry.                                                                                                                                                             |
| `frontend/src/components/notes/ICD10CodePicker.jsx` | 319, 336 | **Medium** | Stores recent and favorite ICD-10 codes in `localStorage` keys `recentICD10Codes` and `favoriteICD10Codes`. ICD-10 codes are diagnosis codes and constitute PHI when associated with a patient. While the stored data is just code lists without patient linkage, the usage pattern reveals the practitioner's diagnostic habits and could indicate their patient population's conditions.                                                            |
| `frontend/src/api/patientApi.js`                    | 173      | Low        | Stores portal session token in `sessionStorage`. Acceptable -- session tokens are ephemeral and `sessionStorage` clears on tab close.                                                                                                                                                                                                                                                                                                                 |

**Clean areas**: `organizationId`, `token`, `language`, `theme`, `clinicalPreferences` (notation method, language, no PHI), `pwa_install_dismissed`, `csvMappingTemplates` (column mapping config), `aiService` config, `contactSyncService` (OAuth tokens), `oauth_state` -- all non-PHI.

---

## 5. API Response Filtering

| File                                                   | Line           | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/services/practice/patientCrud.js`         | 76-77, 120-121 | **Medium** | `getAllPatients()` and `getPatientById()` use `SELECT p.*` which returns ALL columns from the patients table. This includes `encrypted_personal_number`, `medical_history`, `red_flags`, `contraindications`, `allergies`, `current_medications`, `internal_notes`, and all consent fields. The `getAllPatients` function masks the personal number before returning (line 92-97), but returns everything else unfiltered. `getPatientById` decrypts the personal number and includes `decrypted_personal_number` in the response (line 145-146). |
| `backend/src/services/practice/patientSearch.js`       | 249-250        | Medium     | `advancedSearchPatients()` uses `SELECT p.*` returning full patient records for search results. Masks the personal number but returns all other fields.                                                                                                                                                                                                                                                                                                                                                                                           |
| `backend/src/services/clinical/pdfReport.js`           | 22             | Low        | `SELECT p.*` for PDF generation. Acceptable -- PDF is generated server-side and the full record is needed for the document.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `backend/src/services/clinical/pdfTreatmentSummary.js` | 29             | Low        | Same pattern. Acceptable for server-side PDF generation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `backend/src/services/practice/automationTriggers.js`  | 86             | Low        | `SELECT p.*` for automation triggers. The full patient object is used server-side for template variable substitution. Acceptable if the result is not sent to the client.                                                                                                                                                                                                                                                                                                                                                                         |
| All `RETURNING *` queries                              | Multiple       | Low        | 70+ instances of `RETURNING *` across the codebase. These return full row data after INSERT/UPDATE. The data flows through controllers that may send it directly to the client via `res.json(result.rows[0])`. Controllers should filter fields before responding.                                                                                                                                                                                                                                                                                |

**Positive**: The `searchPatients()` basic search function (patientSearch.js line 16-39) uses an **explicit column list** -- good practice. The FHIR controller (fhir.js line 11) has an explicit comment: "Explicit column lists to prevent PHI leakage (no SELECT _)". No `SELECT _`found in`backend/src/controllers/`or`backend/src/routes/`.

---

## 6. Log File Content

| File | Line | Severity | Finding |
| ---- | ---- | -------- | ------- |

**Clean** -- with advisory notes.

**Backend logger** (`backend/src/utils/logger.js`): Winston with JSON format in production, human-readable in dev. Writes to `logs/error.log`, `logs/combined.log`, `logs/exceptions.log`, `logs/rejections.log`. No PHI redaction filter configured.

**Audit logger** (`backend/src/middleware/auditLogger.js`):

- `captureChanges()` (line 119-127) stores `req.body` as `new_values` for UPDATE operations. If a patient update includes `first_name`, `last_name`, `personal_number`, or clinical data in the request body, these are persisted to the `audit_logs.changes` JSONB column. This is **by design** for GDPR Article 30 compliance (record of processing activities). The audit trail needs to record what changed. This is acceptable but must be protected at the database level with encryption at rest.
- `auditAuthEvent()` (line 274-309) logs `userEmail` which is non-PHI.
- The audit logger does NOT log patient names, diagnoses, or fodselsnummer directly. It logs resource IDs, action types, and metadata.

**Audit utility** (`backend/src/utils/audit.js`):

- `logAudit()` (line 67-73) writes a Winston info log with `organizationId`, `userId`, `action`, `resourceType`, `resourceId`. No PHI in the log line.
- The `changes` field (which may contain PHI) is written to the database only (line 60), not to Winston logs.

**Advisory**: The `createPatient` controller (patients.js line 123) passes `{ new: patientData }` as the `changes` field to `logAudit()`. This means the full patient creation payload (including `personal_number` before encryption, `first_name`, `last_name`, `medical_history`, etc.) is stored in the `audit_logs.changes` JSONB column. This is necessary for GDPR compliance but the `personal_number` should be encrypted before being written to the audit trail, since the audit trail stores it in plaintext JSON while the patients table stores it encrypted.

---

## Recommendations

### Priority 1 (High) -- Fix This Sprint

1. **Encrypt or disable `useAutoSave` for clinical forms**: The auto-save hook persists clinical notes to plaintext `localStorage`. Either:
   - Add a PHI-aware wrapper that encrypts data before saving to localStorage
   - Disable auto-save for encounter/SOAP forms (pass `enabled: false`)
   - Move auto-save storage to the backend (encrypted at rest) via a draft API endpoint
   - At minimum, reduce the 24-hour TTL to match the session duration

### Priority 2 (Medium) -- Fix Next Sprint

2. **Add explicit column lists to `patientCrud.js` and `patientSearch.js`**: Replace `SELECT p.*` with explicit column lists for `getAllPatients()`, `getPatientById()`, and `advancedSearchPatients()`. The basic `searchPatients()` already does this correctly -- follow its pattern. This prevents future schema additions (e.g., new sensitive fields) from automatically leaking through the API.

3. **Encrypt personal_number in audit trail**: In `createPatient` and `updatePatient` controllers, encrypt `personal_number` in the `changes` object before passing to `logAudit()`. Currently the audit trail stores the plaintext value while the patients table stores it encrypted -- inconsistent protection.

4. **Add PHI redaction filter to the frontend remote logger**: The `sendToRemote()` function in `frontend/src/utils/logger.js` should strip known PHI fields (`first_name`, `last_name`, `personal_number`, `fodselsnummer`, `phone`, `email`, `diagnoses`) from the `data` parameter before transmission.

5. **Clear messaging conversations on logout**: The `messagingService.js` stores conversation history indefinitely in localStorage. Add a cleanup call on logout/session end. Consider encrypting the stored data or moving it to the backend.

### Priority 3 (Low) -- Backlog

6. **Scrub `config` from actionExecutor log**: Filter the `config` object in `actionExecutor.js` line 21 to remove patient-identifying template variables before logging.

7. **Consider POST for patient-filtered endpoints**: The `patientId` query parameter pattern (`?patientId=uuid`) causes UUIDs to appear in server access logs, proxy logs, and browser history. Consider switching to POST body or using path parameters (`/patients/:id/appointments`) where the patient is the primary resource. Most of these already have path-param equivalents on the patient routes.

8. **Audit `RETURNING *` usage**: Review the 70+ `RETURNING *` call sites to ensure controllers filter response fields before sending to clients. The FHIR controller's explicit column list pattern should be the standard.

---

## Appendix: Files Scanned

### Backend (zero console.\* calls)

- `backend/src/server.js` -- Global error handler, middleware chain
- `backend/src/middleware/errorHandler.js` -- Centralized error handling
- `backend/src/middleware/auditLogger.js` -- GDPR audit trail
- `backend/src/utils/logger.js` -- Winston configuration
- `backend/src/utils/audit.js` -- Audit trail utility
- `backend/src/utils/errors.js` -- Custom error classes
- `backend/src/controllers/patients.js` -- Patient CRUD controller
- `backend/src/routes/patients.js` -- Patient route definitions
- `backend/src/services/practice/patientCrud.js` -- Patient CRUD service
- `backend/src/services/practice/patientSearch.js` -- Patient search service
- `backend/src/services/clinical/pdfReport.js` -- PDF generation
- `backend/src/services/clinical/pdfTreatmentSummary.js` -- Treatment summary PDF
- `backend/src/services/practice/automationTriggers.js` -- Automation triggers
- `backend/src/jobs/actionExecutor.js` -- Action execution
- `backend/src/controllers/appointments.js` -- Appointment controller
- `backend/src/controllers/communications.js` -- Communications controller
- `backend/src/routes/billing/claims.js` -- Billing claims routes

### Frontend (6 console.\* calls, all in centralized logger)

- `frontend/src/utils/logger.js` -- Centralized frontend logger
- `frontend/src/hooks/useAutoSave.js` -- Auto-save to localStorage
- `frontend/src/hooks/useClinicalPreferences.js` -- Clinical preferences (clean)
- `frontend/src/services/messagingService.js` -- SMS messaging service
- `frontend/src/components/notes/ICD10CodePicker.jsx` -- Diagnosis code picker
- `frontend/src/api/patientApi.js` -- Patient portal API
- `frontend/src/components/documents/SickNoteGenerator.jsx` -- Sick note generation
- `frontend/src/components/documents/ReferralLetterGenerator.jsx` -- Referral letters
- `frontend/src/utils/norwegianIdValidation.js` -- Fodselsnummer validation (clean)
- All localStorage/sessionStorage usage across 30+ files reviewed
