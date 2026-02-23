# Codebase Concerns

**Analysis Date:** 2026-01-21

## Tech Debt

**JavaScript without TypeScript:**

- Issue: Entire codebase is JavaScript, no static typing
- Files: All `*.js` and `*.jsx` files
- Why: Faster initial development
- Impact: Runtime type errors, harder refactoring, less IDE support
- Fix approach: Gradual TypeScript migration starting with shared types and API contracts

**Large number of route files:**

- Issue: 45+ route files in `backend/src/routes/`, some with overlapping concerns
- Files: `backend/src/routes/` directory
- Why: Organic growth as features were added
- Impact: Difficult to find specific endpoints, potential duplication
- Fix approach: Consider grouping related routes, document API structure

**Multiple documentation markdown files in root:**

- Issue: 20+ `.md` files in project root (IMPLEMENTATION_COMPLETE.md, CRITICAL_FIXES_TODAY.md, etc.)
- Why: Documentation created during development
- Impact: Cluttered root directory, unclear which docs are current
- Fix approach: Consolidate into `docs/` directory, archive obsolete files

## Known Issues

**TODO: Alerting not implemented:**

- File: `backend/src/services/auditLog.js`
- Symptoms: Security alerts logged but not sent to external systems
- Issue: Comment `// TODO: Implement alerting (email, Slack, PagerDuty, etc.)`
- Workaround: Manual log monitoring
- Fix: Integrate with notification service

**TODO: AI learning notifications:**

- File: `backend/src/services/aiLearning.js`
- Issue: Comment `// TODO: Implement actual notification`
- Workaround: None - feature incomplete
- Fix: Add notification when AI learning triggers

## Security Considerations

**Encryption key management:**

- Risk: Single encryption key in environment variable
- Files: `backend/src/utils/encryption.js`
- Current mitigation: Key rotation config available (`KEY_ROTATION_DAYS`)
- Recommendations: Implement automated key rotation, use secrets manager

**Rate limiting configuration:**

- Risk: Rate limits configurable via env vars, could be misconfigured
- Files: `backend/src/middleware/`, `.env.example`
- Current mitigation: Sensible defaults in code
- Recommendations: Add validation for rate limit values, document limits

**GDPR data access:**

- Risk: GDPR endpoints could expose sensitive data if misconfigured
- Files: `backend/src/routes/gdpr.js`
- Current mitigation: Authentication required, role checks
- Recommendations: Add additional audit logging for GDPR operations

## Performance Considerations

**No query optimization documented:**

- Problem: No explicit query optimization or indexing strategy documented
- Files: `database/schema.sql`
- Current mitigation: PostgreSQL default indexes on primary keys
- Improvement path: Add index documentation, query analysis

**Large frontend bundle potential:**

- Problem: Many UI components and libraries could lead to large bundle
- Files: `frontend/src/components/` (20+ subdirectories)
- Current mitigation: Vite code splitting
- Improvement path: Analyze bundle size, lazy load routes

## Fragile Areas

**Multi-tenant data isolation:**

- Files: All route handlers
- Why fragile: Every query must filter by `organization_id`
- Common failures: Missing org filter could expose cross-tenant data
- Safe modification: Always include org filter, add middleware validation
- Test coverage: Needs explicit multi-tenant isolation tests

**Norwegian healthcare codes:**

- Files: `backend/src/routes/diagnosis.js`, `backend/src/routes/treatments.js`
- Why fragile: Dependent on external code standards (ICPC-2, ICD-10, Takster)
- Common failures: Code updates from Norwegian health authorities
- Safe modification: Version code tables, document update process
- Test coverage: Limited - codes are reference data

## Scaling Limits

**PostgreSQL single instance:**

- Current capacity: Single database, unknown concurrent connection limit
- Limit: Connection pool configured to 20 (`DB_MAX_CONNECTIONS`)
- Symptoms at limit: Connection timeouts, slow queries
- Scaling path: Increase pool, add read replicas, connection pooling (PgBouncer)

**Redis optional:**

- Current capacity: Redis used for caching but optional
- Limit: Without Redis, no caching layer
- Symptoms at limit: Increased database load, slower responses
- Scaling path: Make Redis required, add cache warming

## Dependencies at Risk

**Clerk.com dependency:**

- Risk: External auth provider dependency
- Impact: Auth outage affects entire application
- Migration plan: Abstract auth layer, document Clerk alternatives

**Large dependency count:**

- Risk: 50+ npm dependencies in each package
- Impact: Security vulnerabilities, maintenance burden
- Migration plan: Regular `npm audit`, dependency review

## Missing Critical Features

**Mobile app incomplete:**

- Problem: `mobile-app/` directory exists but status unknown
- Current workaround: Web app only
- Blocks: Mobile user access
- Implementation complexity: Medium (React Native exists)

**Automated testing gaps:**

- Problem: E2E tests exist but unit test coverage unclear
- Current workaround: Manual testing
- Blocks: Confident refactoring
- Implementation complexity: Medium (test framework already set up)

## Test Coverage Gaps

**Multi-tenant isolation tests:**

- What's not tested: Cross-organization data access prevention
- Risk: Data leak between tenants
- Priority: High
- Difficulty to test: Medium - need test setup with multiple orgs

**GDPR compliance tests:**

- What's not tested: Complete GDPR workflow (access, erasure, portability)
- Risk: GDPR violation
- Priority: High
- Difficulty to test: Medium - complex data flows

**Edge cases in clinical workflows:**

- What's not tested: Clinical safety checks (red flags, contraindications)
- Risk: Patient safety
- Priority: High
- Difficulty to test: Need domain expertise for test cases

---

_Concerns audit: 2026-01-21_
_Update as issues are fixed or new ones discovered_
