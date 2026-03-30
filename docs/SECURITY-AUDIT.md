# ChiroClickEHR Security Audit Report

**Date**: 2026-03-30
**Auditor**: CSO Automated Audit (Sprint 7C)
**Scope**: Full backend + frontend security assessment
**Baseline**: v2.1.0 codebase on `main` (post-Sprint 6 merge)

---

## Executive Summary

ChiroClickEHR demonstrates a **mature security posture for a desktop-first EHR** with meaningful defenses: Helmet + CSP, CSRF double-submit cookies, bcrypt password hashing (cost 12), multi-layer rate limiting, Joi input validation, sanitize-html XSS prevention, parameterized SQL queries, comprehensive audit logging, RBAC enforcement, session-based auth, and key rotation infrastructure. However, the audit identified **2 Critical**, **4 High**, **5 Medium**, and **6 Low** findings that must be addressed before any network-exposed deployment. The most urgent issues are: real secrets committed to `.env.production` in the repository, AES-256-CBC without authentication (must migrate to AES-256-GCM), and an open user registration endpoint that accepts a caller-supplied `role` parameter.

**Overall Score: 7.5 / 10** (same as Sprint 6 baseline -- no regression, no improvement)

---

## Secrets Archaeology

### Committed `.env` Files Containing Real Secrets

| File                        | Line(s) | Severity     | Finding                                                                                                       |
| --------------------------- | ------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| `.env.production`           | 21      | **CRITICAL** | Real database password committed: `DB_PASSWORD=df5994d90c403e9361cb79fe`                                      |
| `.env.production`           | 28-29   | **CRITICAL** | Real Redis password committed: `REDIS_PASSWORD=e73fdea16ce29118f8e92f9d487cb4a4`                              |
| `.env.production`           | 32      | **CRITICAL** | Real encryption key committed: `ENCRYPTION_KEY=af11c92a59eb72e17e5d1cc41b38f26c`                              |
| `.env.production`           | 37      | **CRITICAL** | Real JWT secret committed (128 hex chars): `JWT_SECRET=b79fd0b5f7a2...`                                       |
| `.env.production`           | 38      | **CRITICAL** | Real session secret committed: `SESSION_SECRET=d501d8fc1c6c...`                                               |
| `.env.production`           | 73      | **CRITICAL** | Backup encryption key committed: `BACKUP_ENCRYPTION_KEY=abdb4817f5337...`                                     |
| `.env` (root)               | 53      | HIGH         | Encryption key as Base64 literal: `ENCRYPTION_KEY=NTVhODE2MjA1YmE2ZGYx...`                                    |
| `.env` (root)               | 46-48   | LOW          | Placeholder Clerk keys (`pk_test_placeholder`, `sk_test_placeholder`) -- not real but should not be committed |
| `backend/.env`              | 27      | HIGH         | Known-weak encryption key: `ENCRYPTION_KEY=12345678901234567890123456789012` (in WEAK_KEYS list)              |
| `backend/.env`              | 28      | MEDIUM       | Predictable JWT secret: `chiroclickcrm_jwt_secret_change_in_production`                                       |
| `backend/.env`              | 29      | MEDIUM       | Predictable session secret: `chiroclickcrm_session_secret_32chars`                                            |
| `backend/tests/setup.js`    | 13      | INFO         | Test JWT secret: `test_jwt_secret` -- acceptable for test fixtures                                            |
| `backend/tests/envSetup.js` | 10      | INFO         | Test JWT secret: `test_jwt_secret` -- acceptable for test fixtures                                            |

### `.gitignore` Coverage

The `.gitignore` correctly excludes `.env`, `.env.local`, `.env.production`, `.env.development.local`, `.env.test.local`, and `.env.production.local`. **However**, `.env.production` is currently tracked in git despite being listed in `.gitignore`. This means it was force-added or added before the ignore rule existed. The file must be removed from tracking with `git rm --cached .env.production` and all secrets within must be rotated immediately.

The root `.env` file is also present on disk and excluded by `.gitignore`, but `backend/.env` is tracked and committed.

### Secrets in Test Files

Test files in `backend/tests/` and `backend/__tests__/` contain test-only values like `process.env.CLAUDE_API_KEY = 'test-api-key'` and `password: 'admin123'`. These are acceptable for test fixtures but the `admin123` password appears in `e2e/tests/auth.setup.js` and load test files, suggesting it may be a real seeded credential. The CLAUDE.md confirms `admin@chiroclickehr.no / admin123` as dev credentials.

---

## OWASP Top 10 Assessment

### A01: Broken Access Control -- PARTIAL PASS

**Evidence of good practices:**

- `requireAuth` middleware applied via `router.use()` in most route files (503 occurrences across 50 route files)
- `requireOrganization` enforces multi-tenant isolation with PostgreSQL RLS context
- `requireRole` RBAC checks on sensitive endpoints (GDPR, backup, AI training, admin functions)
- `validateOrganization` in `security.js` prevents cross-org data access
- SUPER_ADMIN bypass is the only cross-org escalation path

**Findings:**

| ID    | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01-1 | **HIGH**   | **Open registration with caller-supplied role**: `POST /auth/register` accepts `role` in the request body (line 234, `auth.js`). The `registerUser` service defaults to `PRACTITIONER` but accepts any value passed. An attacker can register as `ADMIN` on any `organizationId`. Registration should require an existing admin invitation or restrict role assignment to admin-only endpoints. |
| A01-2 | **HIGH**   | **Desktop mode bypasses all auth**: When `DESKTOP_MODE=true`, `requireAuth` returns a hardcoded ADMIN user (auth.js:83-98) with no session validation. While documented as intentional for Electron, this is unsafe if the backend port is network-accessible. There is no bind-to-localhost enforcement.                                                                                       |
| A01-3 | **MEDIUM** | **Dev bypass with weak guard in requireOrganization**: Line 162-164 of `auth.js` -- `requireOrganization` checks `req.headers['x-dev-bypass'] === 'true'` in development mode, but the `requireAuth` dev bypass on line 107 checks `process.env.DEV_BYPASS_SECRET`. These two guards are inconsistent: the org middleware accepts the literal string `'true'` while auth checks an env var.     |
| A01-4 | **MEDIUM** | **Portal document download without portal auth**: `GET /patient-portal/documents/:token/download` (patientPortal.js:288) uses only `strictLimiter` but no `requirePortalAuth`. The download is protected by a URL token, which is acceptable if tokens are cryptographically random, time-limited, and single-use. Verify the token generation meets these criteria.                            |
| A01-5 | **LOW**    | **Patient portal PIN is only 4 digits**: The portal uses a 4-digit PIN for patient authentication (pinAuthSchema). With 10,000 possible combinations, this is vulnerable to brute force even with rate limiting. Consider requiring PIN + date of birth (already optional in the schema) as mandatory dual-factor.                                                                              |

### A02: Cryptographic Failures -- PARTIAL PASS

**Evidence of good practices:**

- bcrypt with cost factor 12 for password hashing (strong)
- `crypto.randomBytes()` for token generation (CSPRNG)
- `crypto.timingSafeEqual()` for CSRF token comparison
- Key rotation infrastructure with automatic scheduling
- Encryption key validation at startup with weak-key blocklist
- HSTS with preload, 1-year max-age

**Findings:**

| ID    | Severity     | Finding                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A02-1 | **CRITICAL** | **AES-256-CBC without authentication tag**: `encryption.js` uses `aes-256-cbc` which provides confidentiality but NOT integrity. An attacker who can modify ciphertext can perform padding oracle attacks or bit-flipping. Healthcare data (fodselsnummer) requires authenticated encryption. **Migrate to AES-256-GCM** which provides both confidentiality and integrity with an authentication tag.           |
| A02-2 | **HIGH**     | **Key rotation stores new keys in plaintext**: `keyRotation.js` line 83 inserts `newKey` directly into `encryption_keys.encrypted_key` column. The comment on line 85 says "In production, encrypt this with a master key" but no master key envelope encryption is implemented. Rotated keys sit in plaintext in the database.                                                                                  |
| A02-3 | **MEDIUM**   | **Desktop ENCRYPTION_KEY is predictable**: The `backend/.env` file uses `12345678901234567890123456789012` which is explicitly in the `WEAK_KEYS` blocklist. While `validateEncryptionKey()` logs a warning and continues in non-production, any PHI encrypted with this key in development has zero security. Desktop mode auto-generates a key from machine ID (per CLAUDE.md), but the env file overrides it. |
| A02-4 | **MEDIUM**   | **SHA-256 unsalted hash for search index**: `encryption.js:hash()` uses `crypto.createHash('sha256')` without a salt. While documented as "for comparison only", unsalted SHA-256 hashes of 11-digit fodselsnummer values are trivially reversible via rainbow tables (~100 billion combinations, precomputable). Add an HMAC with a secret key instead.                                                         |
| A02-5 | **LOW**      | **API key hashed with SHA-256 (no salt)**: `password.js:hashToken()` hashes API keys with unsalted SHA-256. Since API keys are high-entropy (32 random bytes), this is less critical than the fodselsnummer case, but HMAC-SHA256 with a server-side secret is best practice.                                                                                                                                    |

### A03: Injection -- PASS

**Evidence of good practices:**

- All SQL queries use parameterized queries (`$1`, `$2`, etc.) via `pg` query interface
- Zero instances of `SELECT *` in production code (1 instance is a comment explicitly prohibiting it)
- Dynamic SQL construction (e.g., `SET ${updates.join(', ')}`) uses parameterized values -- field names are derived from code-controlled allow lists, not user input
- `sanitize-html` with strict allow-list for non-clinical fields and permissive allow-list for SOAP fields
- `stripDangerousProtocols` removes `javascript:` and `on*=` event handlers
- Joi validation at route level with `abortEarly: false`

**Note**: The validation middleware uses `allowUnknown: true` and `stripUnknown: false` (validation.js:16-17). This means unexpected fields pass through to controllers. While not a direct injection vector (parameterized queries prevent SQLi), it increases the attack surface for mass assignment.

### A04: Insecure Design -- PARTIAL PASS

**Evidence of good practices:**

- Circuit breakers for external services (Ollama)
- Rate limiting at multiple granularities (IP, user, patient, endpoint-specific)
- Feature gates for optional modules
- GDPR data retention enforcement
- Fresh session requirement for sensitive operations (password change)

**Findings:**

| ID    | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                          |
| ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A04-1 | **MEDIUM** | **No account lockout beyond rate limiting**: The brute force protection (5 attempts per 15 minutes per IP) resets after the window. There is no persistent lockout mechanism. An attacker using multiple IPs can sustain credential stuffing indefinitely. Implement account-level lockout after N failed attempts requiring admin unlock or email verification. |
| A04-2 | **LOW**    | **Login error messages differentiate states**: The login route returns `error.message` from `authService.loginWithPassword`, which likely differentiates "user not found" from "wrong password". The forgot-password endpoint correctly returns a generic message to prevent enumeration, but login may leak which emails are registered.                        |

### A05: Security Misconfiguration -- PASS

**Evidence of good practices:**

- Helmet with strict CSP (self + specific Ollama localhost only)
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection` enabled
- `X-Powered-By` hidden
- HSTS with preload
- Session cookie: `httpOnly: true`, `secure: true` in production, `sameSite: 'strict'`
- Session name changed from default `connect.sid` to `sessionId`
- Swagger docs served at `/api-docs` (should be disabled in production)
- Stack traces suppressed in production error responses (server.js:512-514)
- `DEV_SKIP_AUTH=true` blocked in production (server.js:39-42)
- `requireHTTPS` middleware for production redirects

**Findings:**

| ID    | Severity | Finding                                                                                                                                                                                                                                                                                         |
| ----- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A05-1 | **LOW**  | **Swagger UI exposed unconditionally**: `/api-docs` and `/api/docs` are mounted without auth gates. In production, this reveals the full API surface including parameter schemas, making reconnaissance trivial. Gate behind `requireAuth` + `requireRole(['ADMIN'])` or disable in production. |
| A05-2 | **LOW**  | **CSP allows `'unsafe-inline'` for styles**: Line 183 of `security.js`. This is common and lower-risk than inline scripts, but nonce-based style CSP is best practice for healthcare applications.                                                                                              |
| A05-3 | **INFO** | **CORS origin from env variable**: Properly configured with explicit origins. Desktop mode defaults to `localhost:5173,5174`. Production example correctly restricts to `https://chiroclickehr.no`.                                                                                             |

### A06: Vulnerable and Outdated Components -- DEFERRED

npm audit should be run separately as stated in scope. The project uses:

- `express-rate-limit` (maintained)
- `helmet` (maintained)
- `bcrypt` (maintained, native addon)
- `sanitize-html` (maintained)
- `joi` (maintained)
- `swagger-jsdoc` / `swagger-ui-express` (check for known XSS in swagger-ui)
- `axios` (maintained)
- `cookie-parser` (maintained)
- `compression` (maintained)

**Recommendation**: Run `npm audit --production` in both `backend/` and `frontend/` and address any critical/high findings. Generate SBOM with `npx @cyclonedx/cyclonedx-npm --output-file sbom.json`.

### A07: Identification and Authentication Failures -- PARTIAL PASS

**Evidence of good practices:**

- bcrypt cost 12 for password hashing
- Password strength validation (min 8 chars, upper, lower, digit)
- Session-based auth with 7-day expiry
- Fresh session concept for sensitive operations (30 min)
- Session listing and "logout from all devices"
- Rate limiting on login (5 per 15 min per IP)
- Double rate limiting on login (both `loginLimiter` and `authBruteForceLimit`)
- 2FA enforcement framework for admin users
- API keys with prefix-based lookup and SHA-256 hash storage

**Findings:**

| ID    | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                        |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A07-1 | **MEDIUM** | **7-day session without absolute timeout**: Sessions last 7 days (`SESSION_DURATION_MS`) with rolling renewal (maxAge resets on each request via `rolling: true` in session config). A session that is used at least once per 7 days never expires. Healthcare systems should enforce an absolute session lifetime (e.g., 12-24 hours) regardless of activity. |
| A07-2 | **MEDIUM** | **Password minimum 8 characters with no special char requirement**: While 8 chars with upper+lower+digit is reasonable, NIST 800-63B recommends checking passwords against known breached-password lists (e.g., HaveIBeenPwned top 100k). No breached-password check exists.                                                                                   |
| A07-3 | **LOW**    | **Session cookie uses `sameSite: 'lax'`**: Auth route cookies (auth.js:104,248,311) use `sameSite: 'lax'` while the security middleware session config (security.js:328) uses `sameSite: 'strict'`. This inconsistency means the session cookie set during login is less restrictive. Use `strict` consistently.                                               |

### A08: Software and Data Integrity Failures -- PASS

**Evidence of good practices:**

- CSRF double-submit cookie pattern with token rotation (csrf.js)
- CSRF uses `crypto.timingSafeEqual` for comparison
- CSRF skipped only for GET/HEAD/OPTIONS and webhooks (which need their own verification)
- GitHub Actions workflows use pinned action versions (`@v3`, `@v4`)
- Dependency review action runs on PRs and blocks moderate+ severity
- CodeQL runs weekly and on push/PR to main

**Findings:**

| ID    | Severity | Finding                                                                                                                                                                                                                             |
| ----- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A08-1 | **LOW**  | **CSRF disabled in desktop mode**: Server.js line 111-114 skips CSRF in desktop mode. This is intentional for Electron but creates risk if the backend is accessed from a browser on the same machine while desktop mode is active. |
| A08-2 | **INFO** | **Actions use version tags, not SHA pins**: `actions/checkout@v3`, `github/codeql-action/init@v3` etc. Best practice for supply chain security is to pin to full commit SHAs.                                                       |

### A09: Security Logging and Monitoring Failures -- PASS

**Evidence of good practices:**

- Comprehensive audit middleware (auditLogger.js) covering all CRUD operations on sensitive resources
- Audit logs include: user ID, email, role, action, resource type, resource ID, changes (old/new values), IP address, user agent, response time
- Sensitive data access audit (requires explicit reason for decryption operations)
- Bulk operation audit with affected record counts
- Auth event audit (login, logout, failed login, password change, registration)
- Billing event audit
- Security event logging (`logSecurityEvent` in security.js)
- Winston logger with structured JSON output
- Correlation IDs for request tracing (correlationId.js)
- Request logging via Morgan (combined format in production)

**Finding**: The audit logging middleware silently catches and logs errors (`catch` block at line 203-209 of auditLogger.js) rather than failing the request. This is intentional (do not block business operations for audit failures) but means audit gaps can occur silently. Consider alerting on audit log failures.

### A10: Server-Side Request Forgery (SSRF) -- PARTIAL PASS

**Evidence of good practices:**

- Ollama base URL is configured via environment variable, not user-supplied
- Ollama provider only sends requests to the configured `OLLAMA_BASE_URL`
- No user-controllable URL fetch endpoints found in routes

**Findings:**

| ID    | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A10-1 | **LOW**  | **Ollama proxy to localhost**: CSP explicitly allows `http://localhost:11434` and `http://127.0.0.1:11434`. If an attacker gains code execution on the server, they can leverage the Ollama connection for SSRF to internal services. This is inherent to the architecture (local AI) and acceptable for desktop mode but should be reviewed for cloud deployments. The `/health/detailed` endpoint also probes the Ollama URL, but it is admin-gated. |

---

## STRIDE Threat Model

### System Overview

| Attribute             | Value                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Architecture          | Desktop-first monolith (Electron + Express + PGlite), with cloud-ready multi-tenant mode             |
| Tech Stack            | Node.js, Express, React 18, PGlite/PostgreSQL, Ollama AI, Socket.io                                  |
| Data Classification   | PHI (fodselsnummer, diagnoses, SOAP notes), PII (names, emails, phones), financial (billing, claims) |
| Deployment            | Electron portable EXE (primary), Docker Compose (secondary)                                          |
| External Integrations | Ollama (local), Twilio/SendGrid (optional), Outlook/Google (optional)                                |

### Trust Boundaries

| Boundary                     | From              | To                  | Controls                                           |
| ---------------------------- | ----------------- | ------------------- | -------------------------------------------------- |
| Browser -> Backend           | End user          | Express API         | TLS (production), Helmet, CSP, CSRF, rate limiting |
| Patient Portal -> Backend    | Patient browser   | Patient Portal API  | PIN auth, portal session tokens, rate limiting     |
| Backend -> PGlite/PostgreSQL | Application       | Database            | Parameterized queries, RLS context                 |
| Backend -> Ollama            | Application       | AI service          | Hardcoded localhost, circuit breaker, timeout      |
| WebSocket -> Backend         | Browser           | Socket.io           | Session cookie validation, org room isolation      |
| Desktop App -> Backend       | Electron renderer | Express (localhost) | DESKTOP_MODE auto-auth (no auth)                   |

### S - Spoofing

| Risk Level | Current Mitigations                                                                           | Gaps                                                                                                                       | Recommendations                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **HIGH**   | bcrypt password hashing, session-based auth, rate limiting on login, 2FA framework for admins | Open registration allows self-enrollment as any role. Desktop mode has zero auth. PIN-only portal auth is weak (4 digits). | Require admin invitation for registration. Bind desktop backend to 127.0.0.1 only. Require PIN + DOB for portal. |

### T - Tampering

| Risk Level | Current Mitigations                                                                   | Gaps                                                                                                                                                       | Recommendations                                                                                          |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **MEDIUM** | CSRF double-submit cookies, input sanitization, Joi validation, parameterized queries | AES-CBC lacks integrity (no auth tag). Audit log writes are fire-and-forget (audit gaps possible). `allowUnknown: true` in validation allows extra fields. | Migrate to AES-256-GCM. Add integrity monitoring for audit logs. Set `stripUnknown: true` in validation. |

### R - Repudiation

| Risk Level | Current Mitigations                                                                                                                | Gaps                                                                                                                                                           | Recommendations                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LOW**    | Comprehensive audit logging with user ID, IP, user agent. Auth events logged. Bulk operations logged. Correlation IDs for tracing. | Audit logs are stored in the same database as application data. No tamper-evident storage (no hash chain, no write-once). Audit failure is silently swallowed. | Implement append-only audit log table (no UPDATE/DELETE grants for app user). Consider hash-chaining for tamper evidence. Alert on audit write failures. |

### I - Information Disclosure

| Risk Level | Current Mitigations                                                                                                                           | Gaps                                                                                                                                                                                                                                                                                       | Recommendations                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **MEDIUM** | No `SELECT *`. Explicit column lists. Stack traces suppressed in production. `maskSensitive()` for logging. PHI encryption for fodselsnummer. | `.env.production` committed with real secrets. Unsalted SHA-256 hash on fodselsnummer is reversible. Swagger UI exposes full API schema. Dev mode returns email verify tokens and password reset tokens in response body. Login errors may differentiate user-not-found vs wrong-password. | Remove `.env.production` from git, rotate all secrets. Switch to HMAC for search hashes. Gate swagger behind admin auth. Ensure login returns generic error. |

### D - Denial of Service

| Risk Level | Current Mitigations                                                                                                                                                           | Gaps                                                                                                                                                                | Recommendations                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **LOW**    | Multi-layer rate limiting (IP, user, patient, endpoint). Request body size limit (10MB). Compression middleware. Circuit breaker on Ollama. WebSocket ping/pong with timeout. | 10MB body limit is generous for a healthcare API (SOAP notes are text). No per-route body size limits. No request timeout middleware (Ollama already has timeouts). | Reduce default body limit to 1MB, with 10MB override on file upload routes only. Add request timeout middleware (30s default). |

### E - Elevation of Privilege

| Risk Level | Current Mitigations                                                                            | Gaps                                                                                                                                                                          | Recommendations                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **HIGH**   | RBAC with `requireRole()`. Multi-tenant org isolation. SUPER_ADMIN is the only cross-org role. | Registration endpoint allows caller to supply `role: 'ADMIN'`. `DESKTOP_MODE` hardcodes ADMIN role. Dev bypass inconsistency between `requireAuth` and `requireOrganization`. | Remove `role` from registration body (derive from invitation). Ensure desktop mode binds to localhost. Unify dev bypass logic. |

---

## CI/CD Security

### Workflow Files Reviewed

| File                                      | Assessment                                                                                                                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.github/workflows/codeql.yml`            | **PASS** -- Runs CodeQL with `security-extended,security-and-quality` queries on push to main/develop, on PRs, and weekly. Minimal permissions (read contents, write security-events). Uses `actions/checkout@v4` and `github/codeql-action@v3`. |
| `.github/workflows/dependency-review.yml` | **PASS** -- Runs on all PRs. Blocks moderate+ severity and GPL-3.0/AGPL-3.0 licenses. Uses `actions/checkout@v3` and `actions/dependency-review-action@v3`.                                                                                      |

**Findings:**

| ID   | Severity   | Finding                                                                                                                                                                                                                |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI-1 | **MEDIUM** | **No SAST beyond CodeQL**: While CodeQL is excellent for JavaScript, adding Semgrep with `p/owasp-top-ten` rules would catch framework-specific patterns (Express misconfiguration, Node.js-specific vulnerabilities). |
| CI-2 | **LOW**    | **No secrets scanning in CI**: No Gitleaks, truffleHog, or similar secrets scanner in the workflow pipeline. The committed `.env.production` would have been caught by a pre-commit secrets scanner.                   |
| CI-3 | **LOW**    | **No container image scanning**: If Docker deployments are used (docker-compose files exist), add Trivy or Grype scanning for the built images.                                                                        |
| CI-4 | **INFO**   | **Actions use version tags, not SHA pins**: `@v3`/`@v4` tags can be force-pushed. For supply chain hardening, pin to commit SHAs.                                                                                      |

---

## Recommendations (Priority Order)

### CRITICAL (Fix Immediately)

1. **C-1: Remove `.env.production` from git and rotate ALL secrets**
   - Run `git rm --cached .env.production .env backend/.env`
   - Rotate: DB password, Redis password, encryption key, JWT secret, session secret, backup encryption key
   - Re-encrypt all PHI data after rotating the encryption key
   - Verify `.gitignore` prevents re-addition
   - File: `.env.production` (all lines with real secrets)

2. **C-2: Migrate from AES-256-CBC to AES-256-GCM**
   - AES-CBC lacks authentication -- ciphertext can be tampered with undetected
   - For healthcare PHI (fodselsnummer), this is a compliance failure
   - Implement: Replace `createCipheriv('aes-256-cbc')` with `createCipheriv('aes-256-gcm')`, store the 16-byte auth tag alongside the ciphertext
   - Run a data migration to re-encrypt all existing records
   - File: `backend/src/utils/encryption.js`

### HIGH (Fix Before Any Network Deployment)

3. **H-1: Restrict user registration -- remove caller-supplied `role`**
   - The `POST /auth/register` endpoint accepts `role` in the request body, allowing anyone to register as `ADMIN`
   - Default to `PRACTITIONER` and require an admin to elevate roles via a separate admin-only endpoint
   - Or: Require an invitation token for registration that embeds the allowed role
   - File: `backend/src/routes/auth.js:232-268`, `backend/src/auth/authService.js:22-76`

4. **H-2: Bind desktop mode backend to localhost only**
   - When `DESKTOP_MODE=true`, the server should bind to `127.0.0.1` not `0.0.0.0` to prevent LAN access
   - Desktop mode grants ADMIN without authentication -- network exposure = full unauthenticated admin access
   - File: `backend/src/server.js:534` -- change `listen(PORT)` to `listen(PORT, '127.0.0.1')` when `DESKTOP_MODE=true`

5. **H-3: Implement envelope encryption for rotated keys**
   - `keyRotation.js` stores new encryption keys in plaintext in the `encryption_keys` table
   - Implement master key encryption: encrypt data keys with a master key stored outside the database
   - File: `backend/src/utils/keyRotation.js:83`

6. **H-4: Add HMAC-based search hash for fodselsnummer**
   - The `hash()` function uses unsalted SHA-256, making fodselsnummer hashes reversible via precomputation
   - Replace with `crypto.createHmac('sha256', serverSecret).update(text).digest('hex')`
   - File: `backend/src/utils/encryption.js:157-163`

### MEDIUM (Fix Within Next Sprint)

7. **M-1: Add absolute session timeout (12-24 hours)**
   - Current sessions renew indefinitely with activity (7-day rolling)
   - Add `created_at` check and enforce absolute maximum of 24 hours
   - File: `backend/src/auth/sessions.js`

8. **M-2: Require PIN + date of birth for patient portal authentication**
   - 4-digit PIN alone has only 10,000 combinations
   - Make `dateOfBirth` required in `pinAuthSchema`, not optional
   - File: `backend/src/validators/patientPortal.validators.js`

9. **M-3: Add account lockout after repeated failed attempts**
   - Rate limiting resets after the window; no persistent lockout exists
   - After 10 failed attempts, lock the account for 30 minutes or require email verification
   - File: `backend/src/auth/authService.js` (login function)

10. **M-4: Add Semgrep SAST to CI pipeline**
    - Create `.github/workflows/security-scan.yml` with Semgrep `p/owasp-top-ten` + `p/cwe-top-25`
    - Add Gitleaks for secrets scanning on every PR
    - File: `.github/workflows/` (new file)

11. **M-5: Unify dev bypass logic between auth middleware**
    - `requireAuth` checks `process.env.DEV_BYPASS_SECRET` header match
    - `requireOrganization` checks `x-dev-bypass === 'true'` literal
    - Centralize to a single `isDevMode()` helper
    - Files: `backend/src/middleware/auth.js:102-123,155-165`

### LOW (Fix When Convenient)

12. **L-1: Gate Swagger UI behind admin auth in production**
    - File: `backend/src/server.js:174`

13. **L-2: Use `sameSite: 'strict'` consistently for session cookies**
    - Auth routes use `lax`, security middleware config uses `strict`
    - File: `backend/src/routes/auth.js` (all `res.cookie` calls)

14. **L-3: Reduce default body size limit to 1MB**
    - Apply 10MB limit only to file upload routes
    - File: `backend/src/server.js:104-105`

15. **L-4: Add secrets scanner (Gitleaks) as pre-commit hook**
    - Would have prevented `.env.production` commit
    - File: `.husky/pre-commit` or `.github/workflows/`

16. **L-5: Set `stripUnknown: true` in Joi validation**
    - Prevents unexpected fields from reaching controllers
    - File: `backend/src/middleware/validation.js:17`

17. **L-6: Add breached-password check to password validation**
    - Check against k-anonymity HaveIBeenPwned API or bundled top-100k list
    - File: `backend/src/auth/password.js:45-67`

---

## Compliance Notes (Norwegian Healthcare / Normen)

### Positive Findings

1. **Normen 5.3 - Access Control**: Multi-tenant organization isolation with RLS context, RBAC enforcement, and SUPER_ADMIN as the only cross-org role.

2. **Normen 5.4 - Audit Trail**: Comprehensive audit logging covering all CRUD operations on patient data, including read access (required by Normen). Auth events, billing events, and sensitive data access are separately audited. Audit entries include IP address and user agent.

3. **Normen 5.5 - Encryption**: PHI encryption implemented for fodselsnummer. Encryption key validation at startup blocks missing/weak keys in production. Key rotation infrastructure exists.

4. **GDPR Article 17 (Right to Erasure)**: Dedicated GDPR routes with admin-only access and E2E test coverage for erasure workflows.

5. **GDPR Article 25 (Data Protection by Design)**: Input validation, output filtering (no SELECT \*), data minimization in API responses.

6. **Pasientjournalloven / Helsepersonelloven**: 10-year data retention configured. Norwegian language compliance. ICPC-2 code support.

### Compliance Gaps

1. **AES-CBC lacks integrity verification (CRITICAL)**: Normen requires both confidentiality AND integrity for health data. AES-CBC does not provide integrity. Must migrate to AES-256-GCM.

2. **PGlite at-rest encryption**: In desktop mode, the PGlite embedded database stores data unencrypted on disk. PHI fields are individually encrypted, but other health data (SOAP notes, diagnoses, appointment details) is in plaintext at rest. Consider SQLite/PGlite-level encryption or full-disk encryption enforcement.

3. **Audit log immutability**: Normen requires that audit logs cannot be modified or deleted. Current implementation stores audit records in the same database with the same access credentials. The application user can UPDATE/DELETE audit records. Implement append-only table (revoke DELETE/UPDATE grants) or use a separate audit database.

4. **Key rotation stores keys in plaintext**: The rotated encryption keys are stored unencrypted in the `encryption_keys` table. This violates the principle of key hierarchy -- data encryption keys must be encrypted by a key encryption key (KEK).

5. **No HelseID integration**: `routes/helseId.js` is a stub. HelseID (Norwegian health sector identity provider) is required for inter-system authentication in the Norwegian healthcare network. This is acceptable for desktop-only mode but must be implemented before any multi-practitioner or network-connected deployment.

---

## Summary of Findings by Severity

| Severity | Count | Key Items                                                                                                                          |
| -------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| CRITICAL | 2     | Committed production secrets, AES-CBC without auth tag                                                                             |
| HIGH     | 4     | Open registration with role escalation, desktop mode network exposure, plaintext key storage, reversible PHI hash                  |
| MEDIUM   | 5     | No absolute session timeout, weak portal PIN auth, no account lockout, missing SAST, inconsistent dev bypass                       |
| LOW      | 6     | Swagger exposure, cookie inconsistency, body size limit, no secrets scanner, validation permissiveness, no breached-password check |
| INFO     | 3     | Test fixtures acceptable, action version tags, CORS properly configured                                                            |

---

_Report generated by CSO Automated Audit. Next review recommended after remediation of Critical and High findings._
