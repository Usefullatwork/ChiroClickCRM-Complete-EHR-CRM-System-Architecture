# 🏥 ChiroClickCRM - Complete EHR-CRM System

A Norwegian-compliant practice management system that combines Electronic Health Records (EHR), Customer Relationship Management (CRM), and Practice Management System (PMS) specifically designed for chiropractic practices.

## ⭐ What's New - November 2025

**Production-Ready Release!** All core features completed and tested.

### 🆕 Recent Updates
- ✅ **Clinical Template System** - 60+ Norwegian examination protocols with click-to-insert functionality
- ✅ **New Patient Form** - Comprehensive registration with GDPR consent management
- ✅ **Financial Tracking Dashboard** - Complete billing analytics with charts and filters
- ✅ **Database Migration System** - Safe, tracked database updates
- ✅ **Full API Integration** - 19 backend routes, 40+ endpoints, 12 frontend API services

**📖 See [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) for detailed documentation**

## 🎯 System Overview

ChiroClickCRM is a comprehensive solution that includes:

- **EHR (Electronic Health Records)**: Clinical documentation, SOAP notes, diagnosis, treatment tracking
- **CRM (Customer Relationship Management)**: Patient retention, automated communications, follow-ups
- **PMS (Practice Management System)**: Scheduling, KPIs, financial tracking
- **Clinical Intelligence**: Outcome tracking, risk assessment, treatment effectiveness

## 🏗️ Architecture

### Four-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│  UI Layer - React + Vite + Tailwind + shadcn/ui    │
├─────────────────────────────────────────────────────┤
│  Business Logic - Clinical rules, safety checks     │
├─────────────────────────────────────────────────────┤
│  API Layer - Node.js/Express with multi-tenancy    │
├─────────────────────────────────────────────────────┤
│  Data Layer - PostgreSQL with full audit trails    │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with JSONB support
- **Authentication**: Clerk.com
- **SMS**: Telnyx ($0.007/SMS)
- **PDF Generation**: react-pdf
- **State Management**: Zustand, React Query

## 📊 Database Schema

The system includes 14 comprehensive tables:

### Core Clinical Tables (EHR)
1. **organizations** - Multi-tenant foundation
2. **users** - Practitioners and staff with role-based access
3. **patients** - Master patient record with GDPR compliance
4. **clinical_encounters** - SOAP notes and clinical documentation
5. **clinical_measurements** - Detailed test results and outcome measures

### CRM & Business Tables
6. **communications** - All patient communications with delivery tracking
7. **appointments** - Scheduling with recurring appointment support
8. **follow_ups** - CRM tasks and automated recalls
9. **financial_metrics** - Transaction tracking with Norwegian insurance
10. **message_templates** - Reusable templates for communications

### Reference Tables
11. **diagnosis_codes** - ICPC-2 and ICD-10 reference data
12. **treatment_codes** - Norwegian treatment codes (Takster)

### Compliance Tables
13. **audit_logs** - Complete audit trail (GDPR Article 30)
14. **gdpr_requests** - Patient data requests (access, erasure, portability)

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChiroClickCRM-Complete-EHR-CRM-System-Architecture
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb chiroclickcrm

   # Run schema
   psql chiroclickcrm < database/schema.sql
   ```

3. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run dev
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/v1
   - Health check: http://localhost:3000/health

## 🔐 Security & Compliance

### GDPR Compliance

- **Consent Management**: Tracks patient consent for SMS, email, marketing
- **Data Encryption**: Sensitive fields (fødselsnummer) are encrypted using AES-256-CBC
- **Audit Trails**: Complete logging of all data access and modifications
- **Right to Access**: Patients can request all their data
- **Right to Erasure**: Secure data deletion process
- **Data Portability**: Export patient data in machine-readable format

### Norwegian Healthcare Compliance

- **ICPC-2 Codes**: Primary diagnosis coding system (L & N chapters for chiropractic)
- **ICD-10 Mapping**: Secondary diagnosis codes
- **Treatment Codes**: Norwegian Takster (L214, L215, etc.)
- **NAV/HELFO Integration**: Tracking for public insurance reimbursement
- **HPR Numbers**: Health Personnel Registry validation
- **Fødselsnummer**: Encrypted personal identification numbers

## 🎨 Features

### 1. Clinical Documentation (EHR)

- **SOAP Note Builder**
  - Click-to-text interface
  - Clickable body chart (SVG)
  - Symptom library
  - Orthopedic tests (SLR, Kemps, Spurlings, etc.)
  - Quick phrases

- **Diagnosis Engine**
  - ICPC-2 primary codes
  - ICD-10 mapping
  - Favorite diagnosis codes

- **Treatment Tracking**
  - Multiple techniques (HVLA, Mobilization, Soft tissue, Dry needling)
  - Anatomical regions
  - Treatment modalities

- **Safety System**
  - Red flag warnings
  - Contraindication alerts
  - Drug interaction checks
  - Maximum visit warnings

### 2. Patient Relationship (CRM)

- **Communication Center**
  - SMS via Telnyx
  - Email with SMTP
  - Letter generation (PDF)
  - Template system with variables
  - Delivery tracking (opens, clicks, bookings)

- **Automation Rules**
  - 3-month recall system
  - 6-month recall system
  - Birthday greetings
  - Insurance expiration alerts

- **Smart Patient Lists**
  - High-value patients (LTV > 10,000 NOK)
  - At-risk patients (declining frequency)
  - Insurance expiring

- **Retention Analytics**
  - Rebooking rates
  - Patient lifetime metrics
  - Referral tracking

### 3. Practice Management

- **Scheduling**
  - Online booking
  - Recurring appointments
  - Waitlist management
  - Capacity planning

- **KPI Dashboard**
  - Daily metrics (Revenue, Visits, No-shows, New patients)
  - Weekly metrics (Rebooking %, Avg visits/patient)
  - Monthly metrics (Growth rate, Retention, Top diagnoses)

- **Financial Intelligence**
  - Package tracking (10-visit, 5-visit)
  - NAV series management (max 14 visits)
  - HELFO claim tracking
  - Invoice generation

- **Reporting**
  - Clinical outcomes
  - Financial analysis
  - Operational metrics
  - Compliance reports

## 📁 Project Structure

```
ChiroClickCRM/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   └── database.js
│   │   ├── models/          # Database models
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, validation, etc.
│   │   │   ├── auth.js
│   │   │   └── validator.js
│   │   ├── services/        # External services
│   │   ├── utils/           # Helper functions
│   │   │   ├── logger.js
│   │   │   ├── encryption.js
│   │   │   └── audit.js
│   │   └── server.js        # Main entry point
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   └── layouts/
│   │   │       └── DashboardLayout.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Patients.jsx
│   │   │   ├── ClinicalEncounter.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Communications.jsx
│   │   │   ├── FollowUps.jsx
│   │   │   ├── KPI.jsx
│   │   │   └── Settings.jsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client
│   │   │   └── api.js
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── database/
│   └── schema.sql           # Complete database schema
└── docs/
    └── README.md
```

## 🔌 API Endpoints

### Patients
- `GET /api/v1/patients` - List all patients
- `GET /api/v1/patients/:id` - Get patient details
- `POST /api/v1/patients` - Create new patient
- `PATCH /api/v1/patients/:id` - Update patient
- `DELETE /api/v1/patients/:id` - Delete patient
- `GET /api/v1/patients/search?q=` - Search patients

### Clinical Encounters
- `GET /api/v1/encounters` - List encounters
- `GET /api/v1/encounters/:id` - Get encounter
- `POST /api/v1/encounters` - Create encounter
- `PATCH /api/v1/encounters/:id` - Update encounter
- `POST /api/v1/encounters/:id/sign` - Sign encounter (makes immutable)
- `POST /api/v1/encounters/:id/generate-note` - Generate formatted note

### Appointments
- `GET /api/v1/appointments` - List appointments
- `GET /api/v1/appointments/:id` - Get appointment
- `POST /api/v1/appointments` - Create appointment
- `PATCH /api/v1/appointments/:id` - Update appointment
- `POST /api/v1/appointments/:id/cancel` - Cancel appointment
- `POST /api/v1/appointments/:id/confirm` - Confirm appointment

### Communications
- `GET /api/v1/communications` - List communications
- `POST /api/v1/communications/sms` - Send SMS
- `POST /api/v1/communications/email` - Send email
- `GET /api/v1/communications/templates` - Get templates
- `POST /api/v1/communications/templates` - Create template
- `GET /api/v1/communications/stats` - Communication statistics

### Follow-ups
- `GET /api/v1/followups` - List follow-ups
- `GET /api/v1/followups/:id` - Get follow-up
- `POST /api/v1/followups` - Create follow-up
- `PATCH /api/v1/followups/:id` - Update follow-up
- `POST /api/v1/followups/:id/complete` - Complete follow-up
- `GET /api/v1/followups/overdue` - Get overdue follow-ups
- `GET /api/v1/followups/upcoming` - Get upcoming follow-ups
- `GET /api/v1/followups/stats` - Follow-up statistics

### Financial
- `GET /api/v1/financial` - List financial metrics
- `GET /api/v1/financial/:id` - Get financial metric
- `POST /api/v1/financial` - Create financial metric
- `PATCH /api/v1/financial/:id/payment-status` - Update payment status
- `GET /api/v1/financial/summary` - Revenue summary
- `GET /api/v1/financial/revenue-by-code` - Revenue by treatment code
- `GET /api/v1/financial/payment-methods` - Payment method breakdown
- `GET /api/v1/financial/outstanding` - Outstanding invoices
- `GET /api/v1/financial/patient/:patientId` - Patient payment history
- `GET /api/v1/financial/invoice-number` - Generate invoice number
- `GET /api/v1/financial/chart/daily-revenue` - Daily revenue chart

### KPI
- `GET /api/v1/kpi/dashboard` - Main KPI dashboard
- `GET /api/v1/kpi/retention` - Patient retention metrics
- `GET /api/v1/kpi/rebooking-rate` - Rebooking rate
- `GET /api/v1/kpi/top-diagnoses` - Top diagnoses

### Outcomes
- `GET /api/v1/outcomes/patient/:patientId/summary` - Patient outcome summary
- `GET /api/v1/outcomes/patient/:patientId/longitudinal` - Longitudinal data
- `POST /api/v1/outcomes/patient/:patientId/predict` - Predict treatment outcome
- `GET /api/v1/outcomes/diagnosis/:icpcCode` - Diagnosis outcome stats
- `GET /api/v1/outcomes/treatments` - Treatment outcome stats
- `GET /api/v1/outcomes/cohort-analysis` - Cohort analysis

### GDPR
- `GET /api/v1/gdpr/requests` - List GDPR requests
- `POST /api/v1/gdpr/requests` - Create GDPR request
- `PATCH /api/v1/gdpr/requests/:requestId/status` - Update request status
- `GET /api/v1/gdpr/patient/:patientId/data-access` - Data access request
- `GET /api/v1/gdpr/patient/:patientId/data-portability` - Data portability
- `POST /api/v1/gdpr/requests/:requestId/erasure` - Process erasure
- `PATCH /api/v1/gdpr/patient/:patientId/consent` - Update consent
- `GET /api/v1/gdpr/patient/:patientId/consent-audit` - Consent audit trail

### PDF Generation
- `POST /api/v1/pdf/letter/:encounterId` - Generate patient letter
- `POST /api/v1/pdf/invoice/:financialMetricId` - Generate invoice PDF

## 🗺️ Implementation Roadmap

### ✅ Phase 1: Foundation (Completed)
- [x] Database schema setup with 14 tables
- [x] Multi-tenant architecture
- [x] Backend API structure with Express
- [x] Frontend React application with Vite + Tailwind
- [x] Authentication setup (Clerk.com)
- [x] Encryption utilities (AES-256-CBC)
- [x] Audit logging system

### ✅ Phase 2: Core Patient Management (Completed)
- [x] Patient CRUD operations with multi-tenant support
- [x] Data import from Excel with validation
- [x] Advanced search and filtering
- [x] Patient statistics and analytics
- [x] Fødselsnummer encryption
- [x] Consent management

### ✅ Phase 3: Clinical Documentation (Completed)
- [x] Full SOAP note builder interface
- [x] ICPC-2/ICD-10 diagnosis system
- [x] Norwegian treatment codes (Takster)
- [x] Red flag safety alert system
- [x] VAS pain tracking
- [x] Clinical measurements
- [x] Encounter signing (immutable records)
- [x] Formatted note generation

### ✅ Phase 4: CRM Engine (Completed)
- [x] Communication templates with variables
- [x] SMS service integration (Telnyx ready)
- [x] Email service with tracking
- [x] Automated follow-up system
- [x] Follow-up task management
- [x] Communication statistics
- [x] Overdue/upcoming follow-up tracking

### ✅ Phase 5: Practice Management (Completed)
- [x] Appointment scheduling with recurring support
- [x] Appointment status management
- [x] KPI dashboard with multiple metrics
- [x] Retention rate tracking
- [x] Rebooking rate analytics
- [x] Financial metrics tracking
- [x] Revenue analysis by treatment code
- [x] Outstanding invoice management
- [x] Invoice generation with Norwegian formats

### ✅ Phase 6: Intelligence & Reporting (Completed)
- [x] Patient outcome tracking over time
- [x] VAS pain trend analysis
- [x] Treatment effectiveness scoring
- [x] Diagnosis outcome statistics
- [x] Cohort analysis (age groups, gender)
- [x] Longitudinal data charts
- [x] Treatment outcome prediction
- [x] PDF letter generation (sick leave, referrals, summaries)
- [x] PDF invoice generation

### ✅ Phase 7: Compliance & Security (Completed)
- [x] Complete GDPR request management
- [x] Right to Access (Article 15) - Full data export
- [x] Right to Portability (Article 20) - JSON export
- [x] Right to Erasure (Article 17) - Anonymization with legal retention
- [x] Consent audit trail
- [x] Data encryption (AES-256-CBC)
- [x] Complete audit trail (Article 30)
- [x] Role-based access control (ADMIN, PRACTITIONER, ASSISTANT)
- [x] IP and user agent tracking

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Production Build

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Environment Variables

Ensure all production environment variables are set:
- Database credentials
- API keys (Clerk, Telnyx, etc.)
- Encryption keys (32 characters for AES-256)
- SMTP configuration

## 🤝 Contributing

This is a proprietary system. For questions or support, contact the development team.

## 📄 License

Private and Confidential - All Rights Reserved

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs`

## 🔄 Version History

- **v4.0.0** (Current) - Complete Backend Implementation
  - All 7 phases completed (Backend)
  - 40+ API endpoints across 12 route modules
  - Full GDPR compliance suite
  - Outcome tracking and analytics
  - PDF generation for letters and invoices
  - Financial tracking and reporting
  - Automated follow-up system
  - Communication templates and tracking
  - KPI dashboard and metrics

- **v3.0.0** - Clinical Documentation Complete
  - Full SOAP note builder
  - ICPC-2/ICD-10 diagnosis system
  - Red flag safety system
  - Treatment tracking
  - Encounter signing

- **v2.0.0** - Patient Management Complete
  - Patient CRUD with encryption
  - Excel import functionality
  - Advanced search and filtering
  - Patient analytics

- **v1.0.0** - Initial Foundation
  - Complete database schema (14 tables)
  - Backend API structure
  - Frontend application skeleton
  - Authentication integration (Clerk.com)
  - Multi-tenant support

## 🌍 Internationalization

Currently supports:
- Norwegian (Bokmål) - Primary
- English - Secondary

All clinical terminology uses Norwegian standards (ICPC-2, NAV Takster).

## ⚡ Performance

- Database queries optimized with indexes
- Connection pooling for database
- React Query for client-side caching
- Lazy loading for components
- Image optimization

## 🛠️ Development

```bash
# Run backend in development mode
cd backend
npm run dev

# Run frontend in development mode
cd frontend
npm run dev

# Run both concurrently (optional)
# Install concurrently: npm install -g concurrently
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

## 📞 Contact

For more information about ChiroClickCRM, please contact the project maintainers.

---

Built with ❤️ for Norwegian chiropractic practices
