# Data Protection Impact Assessment (DPIA)
## ChiroClickCRM - Norwegian Healthcare EHR/CRM System

**Version:** 1.0
**Date:** 2025-11-19
**Status:** Template - Must be completed before production deployment
**Responsible:** Data Protection Officer / System Owner

---

## 1. EXECUTIVE SUMMARY

### 1.1 Purpose
This Data Protection Impact Assessment (DPIA) evaluates the privacy and data protection risks associated with the ChiroClickCRM electronic health record (EHR) and customer relationship management (CRM) system.

### 1.2 System Overview
- **System Name:** ChiroClickCRM
- **Type:** Electronic Health Record (EHR) and CRM System
- **Data Controller:** [ORGANIZATION NAME]
- **Data Processor:** [IF APPLICABLE - e.g., Cloud hosting provider]
- **Target Users:** Chiropractic clinics in Norway
- **Geographic Scope:** Norway (potential future expansion to EU)

### 1.3 DPIA Conclusion
☐ **Low Risk** - No further action required
☐ **Medium Risk** - Implement recommended mitigations
☐ **High Risk** - Consult with Datatilsynet before deployment

---

## 2. NECESSITY AND PROPORTIONALITY

### 2.1 Legal Basis for Processing

#### Primary Legal Basis (GDPR Article 6)
☐ **Article 6(1)(c)** - Legal obligation (Norwegian Health Personnel Act)
☐ **Article 6(1)(e)** - Public interest / Official authority
☐ **Article 6(1)(f)** - Legitimate interests

#### Special Category Data Legal Basis (GDPR Article 9)
☑ **Article 9(2)(h)** - Health or social care (medical treatment)
☑ **Article 9(2)(i)** - Public health interest

#### Norwegian Legal Framework
- Helseregisterloven (Health Register Act)
- Pasientjournalloven (Patient Records Act)
- Helsepersonelloven (Health Personnel Act)
- Personopplysningsloven (Personal Data Act)

### 2.2 Legitimate Purpose
**Primary Purpose:** Provide electronic health record system for chiropractic treatment documentation, patient management, and practice administration.

**Specific Purposes:**
1. Clinical documentation (SOAP notes, treatment plans)
2. Patient appointment scheduling and communication
3. Billing and financial management
4. Treatment outcome tracking
5. Regulatory compliance (10-year record retention)
6. Quality improvement and analytics

### 2.3 Necessity Assessment
Is the data processing necessary for the stated purposes?

| Data Category | Necessary? | Justification |
|--------------|------------|---------------|
| Fødselsnummer (National ID) | ☑ Yes | Legal requirement for patient identification in Norwegian healthcare |
| Name, address, contact | ☑ Yes | Essential for patient communication and record management |
| Health data (diagnoses, treatments) | ☑ Yes | Core purpose - medical record keeping |
| Financial data (invoices, payments) | ☑ Yes | Billing and compliance with accounting regulations |
| Email/SMS communication logs | ☑ Yes | Appointment reminders and patient communication (consent-based) |
| Analytics/usage patterns | ☐ Optional | Only if anonymized/pseudonymized |

### 2.4 Proportionality Assessment
Is the data processing proportionate to the purpose?

**Data Minimization:**
- ☑ Only collect data necessary for stated purposes
- ☑ Do not collect sensitive data beyond health records
- ☑ Implement role-based access (not all users see all data)

**Storage Limitation:**
- ☑ 10-year retention for medical records (legal requirement)
- ☑ Shorter retention for non-medical data (marketing: 2 years)
- ☑ Automatic deletion after retention period

---

## 3. DATA CATEGORIES AND PROCESSING ACTIVITIES

### 3.1 Personal Data Categories

#### Basic Identifiers
- Full name
- Fødselsnummer (Norwegian national ID number) - **ENCRYPTED**
- Date of birth (extracted from fødselsnummer)
- Gender
- Address (street, postal code, city)
- Phone number (mobile and landline)
- Email address

#### Special Category Data (Article 9 GDPR)
- Health data:
  - Medical history
  - Diagnoses (ICPC-2, ICD-10 codes)
  - Treatment notes (SOAP: Subjective, Objective, Assessment, Plan)
  - Treatment plans
  - Medications and allergies
  - X-ray/imaging records
  - Outcome measurements
  - Symptom descriptions
- Biometric data: None currently collected

#### Financial Data
- Invoice amounts
- Payment history
- Payment method (anonymized)
- Insurance information

#### Communication Data
- Email correspondence
- SMS message logs (delivery status only, not content)
- Appointment reminders
- Follow-up communications

### 3.2 Data Subjects
- **Primary:** Patients (current and former)
- **Secondary:** Healthcare practitioners (users of the system)
- **Tertiary:** Administrative staff

### 3.3 Processing Activities

| Activity | Purpose | Legal Basis | Data Categories | Automated? |
|----------|---------|-------------|-----------------|------------|
| Patient registration | Create medical record | Art 9(2)(h) | Identifiers, health data | Manual input |
| Clinical documentation | Treatment records | Art 9(2)(h) | Health data | Manual + AI-assisted |
| Appointment scheduling | Clinic operations | Art 6(1)(f) | Identifiers, contact | Automated |
| SMS/Email reminders | Patient communication | Art 6(1)(a) Consent | Contact info | Automated |
| Billing | Financial compliance | Art 6(1)(c) | Financial data | Automated |
| AI clinical suggestions | Clinical decision support | Art 9(2)(h) | Health data | Automated (human-in-loop) |
| GDPR export | Data subject rights | Art 15 | All categories | Automated |
| Analytics | Quality improvement | Art 9(2)(i) | Anonymized health data | Automated |
| Backup/archiving | Compliance, disaster recovery | Art 6(1)(c) | All categories | Automated |

### 3.4 Data Flows

#### Data Collection
1. **Manual input:** Healthcare practitioners enter data during consultations
2. **Electronic import:** Import from external systems (SolvIt, insurance portals)
3. **Patient self-service:** Online booking, intake forms (future feature)

#### Data Storage
- **Primary Database:** PostgreSQL (encrypted at rest)
  - Location: [SPECIFY - Norway datacenter recommended]
  - Encryption: AES-256 (fødselsnummer, sensitive fields)
- **Backup Storage:** [SPECIFY - e.g., Azure Backup Norway region]
  - Retention: Daily (90 days), Weekly (1 year), Monthly (10 years)

#### Data Transmission
- **Internal:** HTTPS/TLS 1.3 (between frontend and backend)
- **External:**
  - Email: SMTP/TLS (appointment confirmations)
  - SMS: Telnyx API (HTTPS)
  - Insurance: HTTPS APIs

#### Data Recipients
- **Internal:** Healthcare practitioners, administrative staff (role-based access)
- **External Processors:**
  - Clerk.com (authentication) - USA (Standard Contractual Clauses required)
  - Telnyx (SMS) - USA (SCC required)
  - Cloud hosting provider - [SPECIFY]
  - Backup provider - [SPECIFY]

#### Data Deletion
- **Medical records:** 10 years after last treatment (legal requirement)
- **Marketing data:** 2 years after consent withdrawal
- **System logs:** 1 year

---

## 4. RISK ASSESSMENT

### 4.1 Risk Identification

#### Risk 1: Unauthorized Access to Health Records
**Likelihood:** Medium
**Impact:** High (GDPR Article 83 fines, reputational damage)

**Threat Scenarios:**
- Brute force password attacks
- Insider threat (employee accessing records without legitimate purpose)
- Stolen credentials (phishing)
- SQL injection attacks

**Existing Controls:**
- ☑ 2FA enforcement for admin users
- ☑ Rate limiting (5 attempts per 15 min)
- ☑ Audit logging (all access tracked)
- ☑ Input sanitization (XSS/SQL injection prevention)
- ☑ CSRF protection
- ☑ Role-based access control (RBAC)

**Residual Risk:** LOW (after mitigations)

**Additional Mitigations Required:**
- ☐ Implement 2FA for ALL users (not just admins)
- ☐ Intrusion detection system (IDS)
- ☐ Regular penetration testing (annually)
- ☐ Security awareness training for all users

---

#### Risk 2: Data Breach - Database Compromise
**Likelihood:** Low
**Impact:** Critical (mass exposure of health data)

**Threat Scenarios:**
- Database server compromise
- Unpatched vulnerabilities (PostgreSQL, OS)
- Backup theft/exposure

**Existing Controls:**
- ☑ Encryption at rest (fødselsnummer, sensitive fields)
- ☑ SSL/TLS for database connections (rejectUnauthorized: true)
- ☑ Database access restricted (firewall, VPC)
- ☑ Encrypted backups
- ☑ Minimal privileges (application user cannot DROP tables)

**Residual Risk:** LOW

**Additional Mitigations Required:**
- ☐ Full database encryption (PostgreSQL pgcrypto or disk encryption)
- ☐ Database activity monitoring (DAM)
- ☐ Regular security updates (automated patching)
- ☐ Air-gapped backup copies (offline storage)

---

#### Risk 3: Third-Party Processor Breach
**Likelihood:** Low-Medium
**Impact:** High

**Threat Scenarios:**
- Clerk.com breach (authentication provider - US-based)
- Telnyx breach (SMS provider - US-based)
- Cloud hosting provider breach

**Existing Controls:**
- ☑ Vault/secrets management (no credentials in code)
- ☑ Minimal data shared with third parties
- ☐ Data Processing Agreements (DPAs) in place
- ☐ Standard Contractual Clauses (SCCs) for US processors

**Residual Risk:** MEDIUM (international data transfers)

**Additional Mitigations Required:**
- ☑ **CRITICAL:** Sign DPAs with all processors
- ☑ **CRITICAL:** Implement SCCs for Clerk, Telnyx (Schrems II compliance)
- ☐ Consider Norwegian/EU alternatives (BankID for auth, Norwegian SMS provider)
- ☐ Regular processor audits (review SOC 2 reports)

---

#### Risk 4: Ransomware Attack
**Likelihood:** Medium (healthcare is high-value target)
**Impact:** Critical (loss of access to patient records)

**Threat Scenarios:**
- Encryption of production database
- Encryption of backups (if accessible from compromised system)

**Existing Controls:**
- ☑ Daily backups with 10-year retention
- ☑ Backup script with cloud upload
- ☐ Air-gapped/offline backups
- ☐ Immutable backup storage

**Residual Risk:** MEDIUM-HIGH

**Additional Mitigations Required:**
- ☑ **CRITICAL:** Implement offline/air-gapped backups (weekly)
- ☑ **CRITICAL:** Test backup restoration (monthly)
- ☐ Endpoint protection (antivirus, EDR)
- ☐ Network segmentation (isolate database)
- ☐ Incident response plan (ransomware playbook)

---

#### Risk 5: Insider Threat - Unauthorized Data Export
**Likelihood:** Low
**Impact:** High

**Threat Scenarios:**
- Employee exports patient list for personal gain
- Practitioner accesses ex-partner's medical records

**Existing Controls:**
- ☑ Audit logging (all data access logged)
- ☑ GDPR export rate limiting (5 per 15 min)
- ☑ Organization isolation (can't access other clinics' data)
- ☐ Data Loss Prevention (DLP) tools
- ☐ Export approval workflow

**Residual Risk:** LOW-MEDIUM

**Additional Mitigations Required:**
- ☐ Alert on bulk exports (>100 patients)
- ☐ Quarterly audit log review
- ☐ Background checks for employees
- ☐ Exit procedures (disable access immediately)

---

#### Risk 6: AI Clinical Suggestions - Incorrect Medical Advice
**Likelihood:** Medium (AI can hallucinate)
**Impact:** Critical (patient harm)

**Threat Scenarios:**
- AI suggests incorrect diagnosis
- AI misses critical red flags (Cauda Equina)

**Existing Controls:**
- ☑ Human-in-the-loop (all AI suggestions require review)
- ☑ Red flag detection (11 critical patterns)
- ☑ Confidence scoring (low confidence flagged)
- ☑ AI feedback system (track incorrect suggestions)
- ☑ Disclaimer (AI is assistive, not diagnostic)

**Residual Risk:** LOW

**Additional Mitigations Required:**
- ☐ Regular AI model validation
- ☐ Clinical governance oversight
- ☐ User training on AI limitations

---

#### Risk 7: Non-Compliance with 10-Year Retention
**Likelihood:** Low
**Impact:** High (regulatory fines, legal liability)

**Threat Scenarios:**
- Backup failure (data lost before 10 years)
- Premature deletion due to system error

**Existing Controls:**
- ☑ Automated backup script (daily/weekly/monthly)
- ☑ Cloud backup storage
- ☐ Backup restoration testing

**Residual Risk:** MEDIUM

**Additional Mitigations Required:**
- ☑ **CRITICAL:** Test backup restoration (monthly)
- ☐ Backup monitoring/alerts
- ☐ Legal hold process (prevent deletion during litigation)

---

#### Risk 8: GDPR Subject Access Request (SAR) Failure
**Likelihood:** Low
**Impact:** Medium (GDPR Article 83 fines)

**Threat Scenarios:**
- Incomplete data export (missing audit logs)
- Export contains other patients' data (multi-tenant leak)

**Existing Controls:**
- ☑ Automated GDPR export endpoint
- ☑ Organization isolation validation
- ☐ SAR testing

**Residual Risk:** LOW

**Additional Mitigations Required:**
- ☐ Regular SAR testing (quarterly)
- ☐ 30-day response SLA monitoring

---

### 4.2 Risk Summary Matrix

| Risk | Likelihood | Impact | Residual Risk | Priority |
|------|-----------|--------|---------------|----------|
| Unauthorized access | Medium | High | LOW | P2 |
| Database breach | Low | Critical | LOW | P2 |
| Third-party breach | Medium | High | MEDIUM | **P1** |
| Ransomware | Medium | Critical | MEDIUM-HIGH | **P1** |
| Insider threat | Low | High | LOW-MEDIUM | P2 |
| AI incorrect advice | Medium | Critical | LOW | P2 |
| Retention non-compliance | Low | High | MEDIUM | P2 |
| SAR failure | Low | Medium | LOW | P3 |

**P1 = Critical (address before production)**
**P2 = High (address within 90 days)**
**P3 = Medium (address within 6 months)**

---

## 5. MITIGATION MEASURES

### 5.1 Technical Measures (Implemented)
- ✅ Encryption at rest (AES-256 for fødselsnummer)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Database SSL with certificate verification
- ✅ CSRF protection
- ✅ XSS/SQL injection prevention
- ✅ 2FA for admin users
- ✅ Rate limiting (strict for sensitive operations)
- ✅ Audit logging (10-year retention)
- ✅ Role-based access control
- ✅ Multi-tenant isolation
- ✅ Automated backups
- ✅ Session security (httpOnly, secure, sameSite)
- ✅ Security headers (CSP, HSTS, etc.)

### 5.2 Organizational Measures (To Be Implemented)
- ☐ **Data Protection Officer (DPO) appointment** (if required by GDPR Article 37)
- ☐ **Data Processing Agreements (DPAs)** with all processors
- ☐ **Standard Contractual Clauses (SCCs)** for US processors
- ☐ **Privacy Policy** (public-facing)
- ☐ **Internal data protection policies**
- ☐ **Incident response plan** (breach notification within 72 hours)
- ☐ **Staff training** (GDPR, data security, phishing awareness)
- ☐ **Access control procedures** (onboarding/offboarding)
- ☐ **Backup restoration testing** (monthly)
- ☐ **Penetration testing** (annually)
- ☐ **Audit log review** (quarterly)

### 5.3 Compliance Measures
- ☐ **Records of Processing Activities (RoPA)** - GDPR Article 30
- ☐ **Consent management** (for marketing communications)
- ☐ **Subject Access Request (SAR) procedures** (30-day response)
- ☐ **Data retention schedule** (documented policies)
- ☐ **Breach notification procedures** (Datatilsynet + data subjects)

---

## 6. CONSULTATION AND APPROVAL

### 6.1 Stakeholder Consultation

| Stakeholder | Role | Consulted? | Feedback |
|------------|------|-----------|----------|
| Data Protection Officer | Privacy oversight | ☐ Yes ☐ No | |
| Healthcare practitioners | Data controllers | ☐ Yes ☐ No | |
| IT Security team | Technical controls | ☐ Yes ☐ No | |
| Legal counsel | Compliance | ☐ Yes ☐ No | |
| Datatilsynet (if high risk) | Regulatory | ☐ Yes ☐ No | |

### 6.2 DPIA Approval

**Prepared by:**
Name: ________________________
Role: _________________________
Date: _________________________

**Reviewed by (DPO):**
Name: ________________________
Date: _________________________
Signature: _____________________

**Approved by (Data Controller):**
Name: ________________________
Role: _________________________
Date: _________________________
Signature: _____________________

### 6.3 Review Schedule
This DPIA must be reviewed:
- ☐ Before production deployment
- ☐ Annually (minimum)
- ☐ When processing activities change significantly
- ☐ After a data breach
- ☐ When new high-risk processing is introduced

**Next Review Date:** _________________________

---

## 7. DATATILSYNET CONSULTATION (If Required)

**Is prior consultation with Datatilsynet required?**
☐ Yes ☐ No

Prior consultation is required if:
- High residual risk remains after mitigation
- Large-scale processing of special category data
- Systematic monitoring of publicly accessible areas
- Automated decision-making with legal effects

**If yes, consultation details:**
Date submitted: _________________________
Reference number: _________________________
Datatilsynet response: _________________________

---

## APPENDICES

### Appendix A: Data Processing Agreements (DPAs)
- [ ] Clerk.com (authentication)
- [ ] Telnyx (SMS)
- [ ] [Cloud hosting provider]
- [ ] [Backup provider]

### Appendix B: Standard Contractual Clauses (SCCs)
- [ ] Clerk.com (US transfer)
- [ ] Telnyx (US transfer)

### Appendix C: Privacy Policy
See: `PRIVACY_POLICY.md`

### Appendix D: Records of Processing Activities (RoPA)
See: `ROPA.md`

### Appendix E: Technical Documentation
- Database schema: `backend/migrations/`
- Security implementation: `SECURITY.md`
- Deployment guide: `DEPLOYMENT_GUIDE.md`

---

**Document Control:**
Version: 1.0
Last Updated: 2025-11-19
Classification: Internal - Confidential
Owner: Data Protection Officer / System Owner
