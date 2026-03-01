---
name: release-check
description: Pre-release compliance gate. Run before any deployment to verify healthcare compliance, PHI safety, and test status.
---

Run a pre-release compliance check for ChiroClickCRM. Execute these steps in order:

1. **Run all tests** — `cd backend && npm test` and `cd frontend && npx vitest --run`
2. **Check for console.log** — Grep all backend/src and frontend/src for console.log (PHI leak risk)
3. **Check npm audit** — `npm audit --audit-level=high`
4. **Verify auth middleware** — Grep patient/encounter/appointment routes for requireAuth
5. **Verify audit logging** — Check POST/PUT/PATCH/DELETE handlers on patient routes for logAudit calls
6. **Check for http:// URLs** — Grep config files for http:// (must be https://)
7. **Run lint** — `npm run lint`

Report: PASS/FAIL for each step. Block release if any CRITICAL items fail.
