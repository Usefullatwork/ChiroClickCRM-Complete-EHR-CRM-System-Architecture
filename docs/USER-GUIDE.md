# ChiroClickEHR — Daily Workflow Guide

A quick-start guide for the 5 things you do every day.

## 1. Start Your Day

1. Launch ChiroClickEHR
2. The **Dashboard** shows today's overview:
   - Upcoming appointments
   - Red flag alerts (patients needing follow-up)
   - Unsigned clinical notes
   - Key metrics (patients seen, revenue)

## 2. Register a New Patient

1. Click **Pasienter** in the sidebar → **Ny pasient** (New Patient)
2. Fill in required fields:
   - Name, date of birth, phone number
   - Fødselsnummer (national ID) — securely encrypted
   - Address and insurance info (optional)
3. Click **Lagre** (Save)

> **Tip**: Use the search bar (Ctrl+K) to quickly find existing patients by name or phone number.

## 3. Book an Appointment

1. Click **Timeplan** (Schedule) in the sidebar
2. Click on the desired time slot in the calendar
3. Select or search for the patient
4. Choose appointment type (Ny pasient / Kontroll / Akutt)
5. Click **Bekreft** (Confirm)

### Kiosk Check-In (Optional)

If you use a tablet in the waiting room:

1. Navigate to `/kiosk` on the tablet
2. Patients check in by tapping their name
3. They complete intake forms and consent digitally
4. You see them appear in your practitioner queue

## 4. Clinical Encounter

This is the core of your daily workflow:

### Opening an Encounter

1. From Dashboard, click on an appointment → **Start behandling**
2. Or from the patient profile → **Ny konsultasjon**

### SOAP Note

The encounter screen has four sections:

- **S (Subjective)**: What the patient tells you — chief complaint, pain description, history
- **O (Objective)**: Your findings — ROM, palpation, orthopedic tests, vitals
- **A (Assessment)**: Diagnosis — select ICPC-2 codes (search by Norwegian or Latin terms)
- **P (Plan)**: Treatment performed, exercises prescribed, follow-up plan

> **AI Suggestions** (if Ollama is running): Look for the lightbulb icon — click for AI-generated suggestions based on your findings. Always review before accepting.

### Diagnosis Coding

- Type to search ICPC-2 codes (e.g., "L03" or "rygg")
- ICD-10 codes also available for referrals
- CMT procedure codes (98940-98942) auto-suggested based on treatment region

### Body Chart

- Click on the anatomical diagram to mark pain areas
- Select pain type (sharp, dull, radiating, numbness)
- Findings are automatically linked to the SOAP note

### Signing the Note

- Click **Signer journal** (Sign note) when complete
- Signed notes are locked and appear in the audit trail
- Unsigned notes show in your Dashboard alerts

## 5. Prescribe Exercises

1. During or after an encounter, click the **Øvelser** (Exercises) tab
2. Search the exercise library by body region or name
3. Click **+** to add exercises to the prescription
4. Set repetitions, sets, and frequency
5. Click **Send** — the patient receives the exercise program

### Patient Access

Patients can view their exercises through the patient portal or mobile app with video instructions and tracking.

## Quick Reference

| Action             | Shortcut                          |
| ------------------ | --------------------------------- |
| Search anything    | Ctrl+K                            |
| New patient        | Sidebar → Pasienter → Ny pasient  |
| Today's schedule   | Sidebar → Timeplan                |
| Clinical encounter | Dashboard → appointment → Start   |
| Export data        | File → Export Data (Ctrl+Shift+E) |
| Reload app         | Ctrl+R                            |

## Key Norwegian Terms

| Norwegian    | English           |
| ------------ | ----------------- |
| Pasient      | Patient           |
| Timeplan     | Schedule          |
| Behandling   | Treatment         |
| Konsultasjon | Consultation      |
| Undersøkelse | Examination       |
| Øvelser      | Exercises         |
| Henvisning   | Referral          |
| Epikrise     | Discharge summary |
| Lagre        | Save              |
| Signer       | Sign              |
| Bestill time | Book appointment  |

## Generating Reports

### Clinical Letters / Referrals

1. Open patient profile → **Dokumenter** (Documents)
2. Click **Ny henvisning** (New referral) or **Ny epikrise** (New summary)
3. Fill in template, click **Generer PDF** (Generate PDF)
4. Download or print

### Audit Log

- **Sidebar → Revisjon** (Audit) to see all data access and changes
- Required by Normen for healthcare data compliance
- Every read and write is logged with timestamp and user
