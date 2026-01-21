# External Integrations

**Analysis Date:** 2026-01-21

## APIs & External Services

**SMS Service (Twilio/Telnyx):**
- Purpose: Patient communication, appointment reminders
- SDK/Client: Direct API calls / Twilio SDK
- Auth: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` env vars
- Alternative: Telnyx ($0.007/SMS) - `TELNYX_*` vars
- Rate limits: Configurable per patient/org (`SMS_RATE_LIMIT_*`)
- Files: `backend/src/services/` (SMS service)

**Email (SMTP/SendGrid):**
- Purpose: Transactional emails, notifications
- SDK/Client: Nodemailer for SMTP, SendGrid API
- Auth: `SMTP_*` or `SENDGRID_API_KEY` env vars
- Config: Host, port, user, password in `.env`
- Alternative: Microsoft Outlook via Graph API (`OUTLOOK_*` vars)
- Files: `backend/src/services/` (email service)

**AI Services (OpenAI):**
- Purpose: Clinical note generation, AI assistance
- SDK/Client: OpenAI API
- Auth: `OPENAI_API_KEY` env var
- Model: `AI_MODEL` (default: gpt-4-turbo-preview)
- Token limit: `AI_MAX_TOKENS` (default: 2000)
- Files: `backend/src/routes/ai.js`, `backend/src/services/`

**PDF Generation:**
- Purpose: Patient letters, invoices, clinical documents
- Tool: PDFKit (server-side)
- No external API - local generation
- Files: `backend/src/routes/pdf.js`

## Data Storage

**Database (PostgreSQL):**
- Type: PostgreSQL 14+
- Connection: `DATABASE_URL` env var
- Client: `pg` (node-postgres) with connection pooling
- Pool config: `DB_MAX_CONNECTIONS` (default: 20)
- Migrations: `backend/database/migrations/`
- Schema: `database/schema.sql` (14 tables)
- Features: JSONB for flexible data, full audit trails
- Files: `backend/src/config/database.js`

**Caching (Redis):**
- Purpose: Session storage, caching, rate limiting
- Connection: `REDIS_URL` env var
- Client: `redis` npm package
- Key prefix: `REDIS_KEY_PREFIX` (default: chiroclickcrm:)
- Files: `backend/src/config/`

**File Storage:**
- Type: Local filesystem or S3-compatible
- Local: `STORAGE_PATH` (default: ./uploads)
- S3: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- Files: `backend/src/services/`

## Authentication & Identity

**Auth Provider (Clerk.com):**
- Purpose: User authentication, session management
- SDK: `@clerk/clerk-sdk-node` (backend), `@clerk/clerk-react` (frontend)
- Auth: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Webhook: `CLERK_WEBHOOK_SECRET` for user events
- Token validation: JWT in Authorization header
- Files: `backend/src/middleware/auth.js`, `frontend/src/` (Clerk provider)

**Role-Based Access:**
- Roles: ADMIN, PRACTITIONER, ASSISTANT
- Enforced at API middleware level
- Stored in `users` table with Clerk ID mapping

## Monitoring & Observability

**Error Tracking (Sentry):**
- Purpose: Error monitoring and alerting
- SDK: `@sentry/node`, `@sentry/profiling-node`
- Auth: `SENTRY_DSN` env var
- Performance profiling enabled
- Files: `backend/src/` (Sentry initialization)

**Logging:**
- Framework: Winston (backend)
- Format: JSON structured logs (`LOG_FORMAT`)
- Level: Configurable via `LOG_LEVEL`
- HTTP logs: Morgan middleware
- Files: `backend/src/utils/logger.js`

## CI/CD & Deployment

**Container Platform:**
- Development: `docker-compose.yml`
- Production: `docker-compose.prod.yml`
- Services: Backend, frontend, PostgreSQL, Redis

**Infrastructure:**
- Terraform configs in `terraform/`
- Deployment guide: `DEPLOYMENT_GUIDE.md`

**Git Hooks:**
- Husky for pre-commit hooks
- lint-staged for staged file linting

## Environment Configuration

**Development:**
- Required vars: `DATABASE_URL`, `CLERK_*` keys
- Optional: Redis, S3, Twilio (fallbacks available)
- Secrets: `.env` file (gitignored)
- Template: `.env.example` (comprehensive)

**Feature Flags:**
```
FEATURE_AI_ENABLED=true
FEATURE_SMS_ENABLED=true
FEATURE_EMAIL_ENABLED=true
FEATURE_GDPR_STRICT=true
```

**Testing:**
- `TEST_DATABASE_URL` - Separate test database
- `PLAYWRIGHT_BASE_URL` - E2E test target

## Webhooks & Callbacks

**Incoming:**
- Clerk webhooks - `/api/v1/webhooks/clerk`
  - Events: user.created, user.updated, session.*
  - Verification: `CLERK_WEBHOOK_SECRET`

**Outgoing:**
- SMS delivery status (if provider supports)
- Email tracking (opens, clicks) - `EMAIL_TRACKING_ENABLED`

## Norwegian Healthcare Integrations

**Diagnosis Codes:**
- ICPC-2 (primary) - Stored in `diagnosis_codes` table
- ICD-10 (secondary) - Mapping available
- Files: `backend/src/routes/diagnosis.js`

**Treatment Codes:**
- Norwegian Takster (L214, L215, etc.)
- Stored in `treatment_codes` table
- Files: `backend/src/routes/treatments.js`

**Insurance (NAV/HELFO):**
- Tracking for reimbursement
- Max visit tracking (14 visits for NAV series)
- Files: `backend/src/routes/financial.js`

**HelseID (Norwegian Health ID):**
- Integration endpoint: `backend/src/routes/helseId.js`
- National health authentication standard

**FHIR:**
- Healthcare interoperability standard
- Files: `backend/src/fhir/`, `backend/src/routes/fhir.js`

## Encryption & Security

**Data Encryption:**
- Algorithm: AES-256-CBC
- Key: `ENCRYPTION_KEY` (32 bytes, base64)
- IV: `ENCRYPTION_IV` (16 bytes, base64)
- Key rotation: `KEY_ROTATION_DAYS`, `KEY_ROTATION_ENABLED`
- Files: `backend/src/utils/encryption.js`

**Security Headers:**
- Helmet.js for HTTP security headers
- CORS configured via `CORS_ORIGIN`
- Rate limiting with configurable windows

---

*Integration audit: 2026-01-21*
*Update when adding/removing external services*
