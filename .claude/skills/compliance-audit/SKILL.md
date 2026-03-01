---
name: compliance-audit
description: Full Norwegian healthcare compliance checklist. Use when preparing for release, conducting periodic reviews, or when asked about compliance status. Activates for Normen, GDPR, HelseID, WCAG, or regulatory compliance questions.
allowed-tools: Read, Grep, Glob, Bash(npm run test *), Bash(npx playwright test *)
---

# Norwegian Healthcare Compliance Audit Checklist

## Normen v7.0 Requirements

- [ ] Role-based access control on all patient data endpoints
- [ ] Strong authentication (security level 4 for health data access)
- [ ] All patient data access logged (who, when, what, action)
- [ ] Patients can see who accessed their records (audit trail query)
- [ ] TLS on all communications (no http:// anywhere)
- [ ] Data encrypted at rest in database
- [ ] Periodic access control review capability

## GDPR / Personvernforordningen

- [ ] Legal basis documented for each data processing activity
- [ ] Consent management with explicit opt-in for non-treatment processing
- [ ] Consent withdrawal mechanism exists and works
- [ ] Data minimization: only necessary fields queried and returned
- [ ] Right to access: patient can export their data
- [ ] Right to correction: patient data can be corrected with audit trail
- [ ] Data Protection Impact Assessment documented

## HelseID Integration (if applicable)

- [ ] PKCE with S256 code challenge method
- [ ] Pushed Authorization Requests (PAR) enabled
- [ ] Client authentication via private_key_jwt (NOT client_secret)
- [ ] DPoP or mTLS for sender-constrained tokens
- [ ] JWT signing with RS256 or stronger
- [ ] No http:// redirect URIs
- [ ] Security level 4 validated in middleware

## WCAG 2.1 AA (required by Norwegian law for both public and private sector)

- [ ] All images have alt text
- [ ] HTML lang attribute set to "nb" (Norwegian Bokmal)
- [ ] All form inputs have associated labels
- [ ] Color contrast minimum 4.5:1 for text
- [ ] All functionality accessible via keyboard
- [ ] Skip navigation links present
- [ ] Error messages programmatically associated with form fields

Run each section, report pass/fail with evidence, and list specific violations.
