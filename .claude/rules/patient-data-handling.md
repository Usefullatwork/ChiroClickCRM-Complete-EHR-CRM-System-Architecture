# Patient Data Handling Rules

These rules apply to ALL code that touches patient data in ChiroClickCRM.

## Never Do

- Log patient data (fødselsnummer, names, diagnoses, ICPC-2 codes) to console or log files
- Use SELECT \* on patient-related tables
- Return full patient objects without field filtering in API responses
- Put patient identifiers in URL query parameters
- Store fødselsnummer in plain text outside the database
- Expose stack traces that might contain patient data in production

## Always Do

- Use authentication middleware (requireAuth) on ALL patient data routes
- Use authorization middleware (requireRole/requireOrganization) to verify access
- Write to audit_log for ALL mutations on patient records (POST/PUT/PATCH/DELETE)
- Write to audit_log for patient record access (GET) — Normen requires read logging
- Filter API response fields to only what the client needs
- Use parameterized queries (never string concatenation for SQL)

## Fødselsnummer (National ID)

- 11 digits: DDMMYYIIIKK
- Treat as PHI — same protection level as health data
- Never in URLs, logs, error messages, or client-side storage
- Validate format before storing: use modulo-11 check digits

## ICPC-2 Codes

- Format: One letter [A-Z] + two digits [01-99]
- Components 01-29: symptoms, 30-49: diagnostic, 50-59: treatment, 70-99: diagnoses
- Store with encounter, always with audit trail
