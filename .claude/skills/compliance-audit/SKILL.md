---
name: compliance-audit
description: Full Norwegian healthcare compliance audit. Activates when discussing Normen, GDPR, HelseID, WCAG, regulatory compliance, release preparation, or security review. Run before any production release.
allowed-tools: Read, Grep, Glob, Bash(npm run test *), Bash(npx vitest *), Bash(npx playwright *)
---

# Norwegian Healthcare Compliance Audit

Run each section. Report PASS or FAIL with evidence.

## 1. Normen v7.0 — Informasjonssikkerhet

- [ ] Role-based access control on ALL patient data endpoints
- [ ] Authentication required for ALL non-public routes
- [ ] ALL patient data access logged (read AND write) with: userId, timestamp, action, resourceId, patientId, ipAddress
- [ ] TLS everywhere (no http:// in config, no unencrypted connections)
- [ ] Session management: secure cookies, httpOnly, sameSite, expiration
- [ ] Error messages in production: generic only, no stack traces, no patient data

### Scan Commands

```bash
# Routes without auth middleware
grep -rn 'router\.\(get\|post\|put\|patch\|delete\)' backend/src/routes/ | grep -v 'authenticate\|authMiddleware\|requireAuth'

# Missing audit logging on mutations
grep -rn 'router\.\(post\|put\|patch\|delete\)' backend/src/routes/patient*.js backend/src/routes/journal*.js backend/src/routes/appointment*.js | grep -v 'audit'
```

## 2. GDPR / Personvernforordningen

- [ ] Consent management: explicit opt-in mechanism exists
- [ ] Consent withdrawal: mechanism exists and actually deletes/anonymizes
- [ ] Data minimization: API responses filter fields per purpose
- [ ] Right to access: patient data export endpoint exists
- [ ] Right to correction: patient data update with audit trail
- [ ] Right to deletion: patient data deletion/anonymization endpoint
- [ ] Data processing register: documented legal basis per data type

## 3. WCAG 2.1 AA (Norwegian law — universell utforming)

- [ ] HTML lang="nb" on root element
- [ ] All images have alt text
- [ ] All form inputs have associated <label> elements
- [ ] Color contrast >= 4.5:1 for normal text, >= 3:1 for large text
- [ ] All functionality accessible via keyboard
- [ ] Focus indicators visible on interactive elements
- [ ] Error messages programmatically linked to form fields (aria-describedby)

### Scan Commands

```bash
# Check for lang attribute
grep -rn 'lang=' frontend/src/index.html frontend/index.html

# Form inputs without labels
grep -rn '<input' frontend/src/ --include='*.jsx' --include='*.tsx' | grep -v 'label\|aria-label\|aria-labelledby'
```

## 4. ICPC-2 Validation

- [ ] ICPC-2 codes match pattern: [A-Z][0-9]{2} (e.g., L86, N99)
- [ ] Only valid chapter letters used: A,B,D,F,H,K,L,N,P,R,S,T,U,W,X,Y,Z
- [ ] Code descriptions match Helsedirektoratet's official Norwegian translations
- [ ] L-chapter (musculoskeletal) and N-chapter (neurological) are primary for chiropractic

## OUTPUT: Checklist with PASS/FAIL, evidence for failures, and specific fix instructions.
