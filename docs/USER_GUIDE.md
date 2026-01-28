# ChiroClickCRM User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Patient Management](#patient-management)
4. [Clinical Encounters](#clinical-encounters)
5. [CRM Features](#crm-features)
6. [Appointments](#appointments)
7. [Communications](#communications)
8. [Follow-ups](#follow-ups)
9. [Financial & Billing](#financial--billing)
10. [Settings](#settings)
11. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### Logging In

1. Navigate to `https://app.chiroclickcrm.no`
2. Enter your email and password
3. Click "Logg inn" (Login)

### First-Time Setup

After logging in for the first time:
1. Navigate to **Settings** > **Clinic Info**
2. Fill in your clinic details (name, address, org number)
3. Configure your clinical preferences in the **Clinical** tab
4. Set up notification preferences

---

## Dashboard Overview

The dashboard provides a quick overview of your practice:

### Key Metrics
- **Today's Appointments** - Number of scheduled appointments
- **Pending Follow-ups** - Tasks requiring attention
- **New Patients This Month** - Patient acquisition metric
- **Revenue This Month** - Financial summary

### Quick Actions
- Click any metric card to navigate to its detailed view
- Use the "+" button to quickly add a new patient or appointment

---

## Patient Management

### Searching for Patients

1. Use the **search bar** at the top (or press `Ctrl+K`)
2. Search by name, Solvit ID, phone, or email
3. Click a patient to view their details

### Creating a New Patient

1. Navigate to **Patients** > **New Patient**
2. Fill in required fields:
   - First name and last name
   - Date of birth
   - At least one contact method (phone or email)
   - Fødselsnummer (optional but recommended)
3. Add optional information:
   - Address
   - Insurance details
   - Referral source
4. Click **Save Patient**

### Patient Detail View

The patient detail view shows:

| Tab | Description |
|-----|-------------|
| Overview | Basic info, lifecycle stage, quick stats |
| Encounters | Clinical visit history |
| Appointments | Scheduled and past appointments |
| Documents | Uploaded files and generated PDFs |
| Communications | SMS/email history |
| Billing | Invoices and payments |
| Notes | Internal notes |

### Patient Lifecycle Stages

Patients automatically transition through lifecycle stages:

- **NEW** - Just created, no visits yet
- **ONBOARDING** - 1-2 visits in last 30 days
- **ACTIVE** - Regular visits (within 6 weeks)
- **AT_RISK** - No visit for 6-12 weeks
- **INACTIVE** - No visit for 3-6 months
- **LOST** - No visit for 6+ months
- **REACTIVATED** - Returned after being lost

---

## Clinical Encounters

### Starting a New Encounter

1. Navigate to the patient's detail page
2. Click **New Encounter** or press `N`
3. Select encounter type:
   - Initial Consultation
   - Follow-up Visit
   - Re-evaluation
   - Acute Visit

### SOAP Documentation

The encounter screen follows SOAP format:

#### Subjective (S)
- Chief complaint
- History of present illness
- Pain characteristics (location, intensity, quality)
- Aggravating/relieving factors

#### Objective (O)
- Vital signs
- Postural analysis
- Palpation findings (use Quick-Click Spine tool)
- Range of motion
- Orthopedic tests
- Neurological examination

#### Assessment (A)
- Diagnoses (ICD-10/ICPC-2)
- Red flag screening results
- Clinical impression

#### Plan (P)
- Treatment performed (Takster codes)
- Home exercises prescribed
- Follow-up recommendations

### Quick-Click Spine Palpation

The sidebar shows a clickable spine diagram:

1. Click a vertebral segment (e.g., C5)
2. Select direction (L/R/B/P/A)
3. Norwegian clinical text auto-inserts into palpation field

### Signing an Encounter

1. Review all documentation for completeness
2. Click **Sign Encounter**
3. The encounter becomes immutable (legal record)
4. Amendments can be added but original text preserved

### Templates

Save time with encounter templates:
1. Document a typical encounter
2. Click **Save as Template**
3. Use the template for similar future encounters

---

## CRM Features

### Lead Management

Track potential patients before they become clients:

1. Navigate to **CRM** > **Leads**
2. View pipeline: New → Contacted → Qualified → Booked → Converted

#### Creating a Lead
- Click **Add Lead**
- Enter contact information
- Select source (Website, Google Ads, Referral, etc.)
- Assign to a staff member

#### Converting a Lead
1. Open the lead
2. Click **Convert to Patient**
3. A patient record is created with the lead's information

### Retention Dashboard

Monitor patient retention and identify at-risk patients:

1. Navigate to **CRM** > **Retention**
2. View:
   - Churn rate over time
   - Patients at risk of churning
   - Reactivation opportunities

### Referral Program

Track patient referrals:

1. Navigate to **CRM** > **Referrals**
2. Log referrals from existing patients
3. Track conversion status
4. Issue rewards when referrals convert

### Surveys & NPS

Collect patient feedback:

1. Navigate to **CRM** > **Surveys**
2. Create NPS or CSAT surveys
3. Send automatically after appointments
4. View responses and analytics

---

## Appointments

### Viewing the Calendar

1. Navigate to **Appointments**
2. Toggle between Day, Week, and Month views
3. Filter by practitioner

### Booking an Appointment

1. Click on an empty time slot
2. Search for patient or create new
3. Select service type and duration
4. Add notes if needed
5. Click **Book**

### Managing Appointments

- **Reschedule**: Drag and drop to new time
- **Cancel**: Click appointment → Cancel
- **No-show**: Mark patient as no-show for analytics

### Waitlist

When schedule is full:
1. Add patient to waitlist
2. Specify preferred times
3. When slot opens, system notifies patient

---

## Communications

### Sending SMS

1. Navigate to patient detail
2. Click **Send SMS**
3. Select template or write custom message
4. Click **Send**

Rate limits apply: 10 SMS/hour, 3 messages per patient/day

### Sending Email

1. Navigate to patient detail
2. Click **Send Email**
3. Enter subject and body
4. Click **Send**

### Communication History

View all patient communications:
1. Go to patient detail
2. Click **Communications** tab
3. Filter by type (SMS, Email, Phone)

### Message Templates

Create reusable templates:
1. Navigate to **Settings** > **Templates**
2. Click **New Template**
3. Use variables like `{first_name}`, `{appointment_date}`
4. Save for future use

---

## Follow-ups

### Creating Follow-ups

Follow-ups can be created:
- Manually from patient detail
- Automatically from encounter plans
- Via workflow automation

### Managing Follow-ups

1. Navigate to **Follow-ups**
2. View list sorted by due date
3. Filter by status, priority, or assignee

### Completing a Follow-up

1. Open the follow-up
2. Contact the patient
3. Add completion notes
4. Click **Mark Complete**

---

## Financial & Billing

### Creating an Invoice

1. Navigate to patient detail
2. Click **Billing** tab
3. Click **New Invoice**
4. Add line items (from encounter treatments or manually)
5. Set payment terms
6. Generate invoice

### Payment Processing

Record payments:
1. Open invoice
2. Click **Record Payment**
3. Select payment method (card, bank, Vipps, etc.)
4. Enter amount

### Financial Reports

Navigate to **Financial** to view:
- Revenue by period
- Outstanding invoices
- Payment breakdown by method
- Monthly/quarterly summaries

---

## Settings

### Clinic Settings

**General Tab**
- Clinic name, address, contact info
- Logo upload
- Business hours

**Clinical Tab**
- Adjustment style (Gonstead vs Diversified)
- Test result formats
- ROM documentation preferences
- Palpation templates

**Users Tab**
- Manage staff accounts
- Set roles and permissions
- View login history

**Notifications Tab**
- Email notification preferences
- SMS reminder settings
- System alerts

**Integrations Tab**
- Connect external services
- API key management
- Calendar sync settings

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Global search |
| `N` | New encounter (in patient view) |
| `S` | Save current form |
| `Esc` | Close modal/sidebar |
| `Ctrl+Enter` | Sign encounter |
| `←` / `→` | Navigate calendar days |
| `T` | Go to today (in calendar) |

---

## Getting Help

### In-App Help
- Click the **?** icon for context-sensitive help
- Hover over form fields for tooltips

### Support
- Email: support@chiroclickcrm.no
- Phone: +47 xxx xxx xxx (Business hours)

### Training
- Video tutorials available at help.chiroclickcrm.no
- Onboarding sessions for new clinics

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
