# ChiroClickEHR Compliance Documentation

**Version**: 2.1.0
**Last Updated**: 2026-03-30
**Auditor**: Sprint 7C Compliance Review
**Scope**: Norwegian healthcare regulations applicable to a desktop-first chiropractic EHR

---

## 1. Normen (Norm for informasjonssikkerhet og personvern i helse- og omsorgssektoren)

### 1.1 Access Control (Tilgangskontroll)

**Status**: Partial

| Control                  | Implementation                                                                           | Evidence                                                | Gap                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Role-based access (RBAC) | `requireRole()` middleware on all sensitive routes                                       | `backend/src/middleware/auth.js`, `security.js:114-129` | Open registration accepts caller-supplied `role` (A01-1 in SECURITY-AUDIT.md) |
| Organization scoping     | `requireOrganization()` + PostgreSQL RLS context via `set_config('app.organization_id')` | `backend/src/middleware/auth.js:141-178`                | Dev bypass inconsistency between auth and org middleware (A01-3)              |
| Multi-tenant isolation   | All patient queries scoped by `organization_id`                                          | `backend/src/services/practice/patientCrud.js`          | SUPER_ADMIN is the only cross-org role                                        |
| 2FA for administrators   | `enforce2FA()` middleware for ADMIN/SUPER_ADMIN/OWNER roles                              | `backend/src/middleware/security.js:62-109`             | Framework exists but 2FA enrollment UX not verified                           |
| Minimum privilege        | Users default to PRACTITIONER role, admins can elevate                                   | `backend/src/auth/authService.js`                       | Registration endpoint should not accept role parameter                        |

### 1.2 Audit Logging (Loggfoering)

**Status**: Compliant

| Control                | Implementation                                                                                   | Evidence                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Read access logging    | All GET requests on patient resources logged                                                     | `backend/src/middleware/auditLogger.js:65-90`   |
| Write access logging   | All POST/PUT/PATCH/DELETE logged with old/new values                                             | `backend/src/middleware/auditLogger.js:92-135`  |
| Auth event logging     | Login, logout, failed login, password change, registration                                       | `backend/src/middleware/auditLogger.js:274-309` |
| Bulk operation logging | Bulk operations logged with affected record counts                                               | `backend/src/middleware/auditLogger.js:176-201` |
| Sensitive data access  | Decryption operations require explicit reason                                                    | `backend/src/utils/encryption.js`               |
| Correlation IDs        | Request tracing via `correlationId.js` middleware                                                | `backend/src/middleware/correlationId.js`       |
| Log fields             | user_id, email, role, action, resource_type, resource_id, changes, IP, user_agent, response_time | `backend/src/middleware/auditLogger.js`         |

**Gap**: Audit logs stored in same database with same credentials — app user can UPDATE/DELETE records. Append-only enforcement recommended.

### 1.3 Encryption (Kryptering)

**Status**: Partial

| Control          | Implementation                                         | Evidence                                                            | Gap                                                                                     |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| In transit       | HSTS with preload (31536000s), requireHTTPS middleware | `backend/src/middleware/security.js:199-203`, `security.js:306-313` | None                                                                                    |
| At rest (PHI)    | AES-256-CBC encryption for fodselsnummer               | `backend/src/utils/encryption.js`                                   | **Must migrate to AES-256-GCM** for authenticated encryption (C-2 in SECURITY-AUDIT.md) |
| Key management   | Key rotation infrastructure with scheduling            | `backend/src/utils/keyRotation.js`                                  | Rotated keys stored in plaintext (H-3)                                                  |
| Key validation   | Startup check blocks weak/missing keys in production   | `backend/src/utils/encryption.js:validateEncryptionKey()`           | Desktop env uses weak key (`123...`)                                                    |
| Password hashing | bcrypt cost factor 12                                  | `backend/src/auth/password.js`                                      | None                                                                                    |
| PGlite at rest   | Unencrypted database on disk                           | Desktop mode                                                        | PHI fields encrypted individually, but SOAP notes/diagnoses in plaintext                |

### 1.4 Data Retention (Oppbevaring)

**Status**: Partial

| Control           | Implementation                            | Evidence                                         | Gap                                        |
| ----------------- | ----------------------------------------- | ------------------------------------------------ | ------------------------------------------ |
| 10-year retention | Configured in system settings             | CLAUDE.md references 10-year retention           | Deletion process not verified              |
| GDPR erasure      | `DELETE /api/v1/gdpr/erasure` endpoint    | `backend/src/routes/gdpr.js`                     | E2E test exists                            |
| Backup            | Automated backup scheduler (desktop mode) | `backend/src/services/practice/backupService.js` | Backup encryption key was committed to git |

### 1.5 Incident Response (Avvikshåndtering)

**Status**: TODO

| Control                   | Status | Notes                                                            |
| ------------------------- | ------ | ---------------------------------------------------------------- |
| Incident response plan    | TODO   | No documented incident response procedure                        |
| Breach notification (72h) | TODO   | GDPR Article 33 requires notification within 72 hours            |
| Datatilsynet reporting    | TODO   | Norwegian DPA must be notified of breaches affecting health data |
| Patient notification      | TODO   | GDPR Article 34 requires notification when breach is high risk   |

---

## 2. GDPR / Personopplysningsloven

### 2.1 Article 15 — Right of Access (Innsynsrett)

**Status**: Compliant

- Data export capability via GDPR endpoints
- Patient portal provides access to own records
- Audit log accessible to patients (who accessed their records)
- Evidence: `backend/src/routes/gdpr.js`, portal routes

### 2.2 Article 17 — Right to Erasure (Rett til sletting)

**Status**: Compliant

- `DELETE /api/v1/gdpr/erasure` endpoint with admin-only access
- E2E test coverage for erasure workflows
- Evidence: `backend/src/routes/gdpr.js`, `e2e/tests/gdpr-erasure.spec.js`
- Note: Healthcare data retention exceptions apply (Pasientjournalloven may override erasure for clinical records)

### 2.3 Article 20 — Data Portability (Dataportabilitet)

**Status**: Partial

- FHIR export stubs exist (`backend/src/routes/fhir.js`)
- Not yet implemented — regulatory stub for future
- CSV/JSON data export available via GDPR endpoints

### 2.4 Data Processing Agreement (Databehandleravtale)

**Status**: TODO

- Required when using third-party processors (Twilio, SendGrid, cloud hosting)
- Desktop-only mode has no third-party processors (all local)
- Template needed before any cloud deployment

### 2.5 Privacy Policy (Personvernerklæring)

**Status**: TODO

- Required before patient portal goes live
- Must cover: data collected, purposes, legal basis, retention, rights, DPO contact
- Must be in Norwegian

### 2.6 Article 25 — Data Protection by Design

**Status**: Compliant

- Input validation at system boundaries (Joi schemas)
- Output filtering (no SELECT \* in controllers/routes)
- Data minimization in API responses
- Parameterized SQL queries (no string concatenation)
- Evidence: `backend/src/middleware/validation.js`, `backend/src/middleware/security.js:244-270`

### 2.7 Article 30 — Records of Processing Activities

**Status**: Compliant

- Comprehensive audit logging covers all processing activities
- Changes (old/new values) recorded for GDPR accountability
- Evidence: `backend/src/middleware/auditLogger.js:119-127`

---

## 3. Pasientjournalloven (Patient Records Act)

### 3.1 Electronic Record Security

**Status**: Partial

| Requirement    | Status    | Evidence                                             |
| -------------- | --------- | ---------------------------------------------------- |
| Secure storage | Partial   | PHI encrypted (AES-256-CBC), but needs GCM migration |
| Access control | Compliant | RBAC + organization scoping                          |
| Backup         | Compliant | Automated backup with encryption                     |
| Availability   | Compliant | Desktop-first = no cloud dependency                  |

### 3.2 Access Logging (Mandatory)

**Status**: Compliant

- ALL read access to patient records is logged (Normen requirement)
- Write access logged with change details
- Auth events separately tracked
- Evidence: `backend/src/middleware/auditLogger.js` — read logging at lines 65-90

### 3.3 Patient Access to Log (Innsyn i logg)

**Status**: Partial

- Audit log route exists: `GET /api/v1/audit-logs`
- Admin-only access currently
- Patient portal should expose "who accessed my records" view
- Evidence: `backend/src/routes/auditLogs.js`

---

## 4. Helsepersonelloven (Health Personnel Act)

### 4.1 Authorization Requirements

**Status**: Compliant

- Only authenticated users with appropriate roles can access patient data
- `requireAuth` middleware on all patient routes
- `requireRole` for sensitive operations (GDPR, backup, admin)
- Organization scoping prevents cross-practice access
- Evidence: All route files in `backend/src/routes/` use auth middleware

### 4.2 Professional Secrecy (Taushetsplikt)

**Status**: Partial

| Control            | Status    | Evidence                                                      | Gap                                              |
| ------------------ | --------- | ------------------------------------------------------------- | ------------------------------------------------ |
| PHI not in logs    | Compliant | PHI scan found 0 fodselsnummer leaks to console/logs          | Advisory: `actionExecutor.js` logs config object |
| PHI not in URLs    | Compliant | No fodselsnummer in query params                              | Patient UUID in query params (low risk)          |
| PHI not in errors  | Compliant | Stack traces suppressed in production                         | `err.details` could leak if misused              |
| Client-side PHI    | Partial   | `useAutoSave` stores clinical notes in plaintext localStorage | Must encrypt or disable for clinical forms       |
| PHI in audit trail | Partial   | `personal_number` stored plaintext in audit log changes       | Should encrypt before writing to audit           |

---

## 5. Compliance Summary

| Regulation          | Status  | Score           | Key Gaps                                              |
| ------------------- | ------- | --------------- | ----------------------------------------------------- |
| Normen              | Partial | 3/5 compliant   | AES-CBC→GCM, key storage, incident response           |
| GDPR                | Partial | 5/7 compliant   | Data portability (FHIR), DPA template, privacy policy |
| Pasientjournalloven | Partial | 2/3 compliant   | Patient-facing audit log view needed                  |
| Helsepersonelloven  | Partial | 1.5/2 compliant | localStorage PHI, audit trail encryption              |

**Overall Compliance Rating**: **72%** (11.5/17 controls fully compliant)

---

## 6. Remediation Roadmap

### Sprint 8 (Critical — before any network deployment)

1. **Migrate AES-256-CBC to AES-256-GCM** — Normen requires authenticated encryption for health data
   - File: `backend/src/utils/encryption.js`
   - Impact: All encrypted PHI must be re-encrypted

2. **Remove `.env.production` from git, rotate all secrets**
   - Run: `git rm --cached .env.production`
   - Rotate: DB password, encryption key, JWT secret, session secret

3. **Restrict user registration** — Remove caller-supplied `role` parameter
   - File: `backend/src/routes/auth.js`

### Sprint 9 (High — before multi-user deployment)

4. **Encrypt or disable `useAutoSave` for clinical forms**
   - File: `frontend/src/hooks/useAutoSave.js`

5. **Implement envelope encryption for key rotation**
   - File: `backend/src/utils/keyRotation.js`

6. **Add patient-facing audit log view** to patient portal
   - "Hvem har sett journalen min?" (Who has seen my records?)

7. **Create incident response procedure document**

### Sprint 10 (Medium — before public launch)

8. **Complete FHIR data export** for data portability (GDPR Article 20)
9. **Write privacy policy** (Personvernerklæring) in Norwegian
10. **Create data processing agreement template** (Databehandleravtale)
11. **Implement HelseID integration** for healthcare network authentication

### Backlog

12. Add HMAC-based search hash for fodselsnummer (replace unsalted SHA-256)
13. Add absolute session timeout (12-24 hours)
14. Encrypt personal_number in audit trail changes
15. PGlite at-rest encryption investigation

---

_This document should be reviewed and updated after each sprint that touches security, authentication, or data handling. Norwegian healthcare compliance is not a one-time activity — it requires continuous verification and improvement._
