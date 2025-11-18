# 🏥 ChiroClickCRM - Complete EHR-CRM System

A Norwegian-compliant practice management system that combines Electronic Health Records (EHR), Customer Relationship Management (CRM), and Practice Management System (PMS) specifically designed for chiropractic practices.

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

### KPI
- `GET /api/v1/kpi/dashboard` - Main KPI dashboard
- `GET /api/v1/kpi/daily` - Daily metrics
- `GET /api/v1/kpi/weekly` - Weekly metrics
- `GET /api/v1/kpi/monthly` - Monthly metrics
- `GET /api/v1/kpi/retention` - Retention metrics
- `GET /api/v1/kpi/rebooking-rate` - Rebooking rate

## 🗺️ Implementation Roadmap

### ✅ Phase 1: Foundation (Completed)
- [x] Database schema setup
- [x] Multi-tenant architecture
- [x] Backend API structure
- [x] Frontend React application
- [x] Authentication setup (Clerk.com)

### 🔄 Phase 2: Core Patient Management (In Progress)
- [ ] Patient CRUD operations
- [ ] Data import from Excel
- [ ] Patient search functionality
- [ ] Patient statistics

### 📋 Phase 3: Clinical Documentation (Planned)
- [ ] SOAP note builder interface
- [ ] Click-to-text functionality
- [ ] ICPC-2/ICD-10 diagnosis system
- [ ] Treatment tracking
- [ ] Safety alert system

### 💬 Phase 4: CRM Engine (Planned)
- [ ] Communication templates
- [ ] SMS integration (Telnyx)
- [ ] Email integration with tracking
- [ ] Automated recall system
- [ ] Follow-up management

### 📅 Phase 5: Practice Management (Planned)
- [ ] Appointment scheduling
- [ ] Recurring appointments
- [ ] KPI dashboard
- [ ] Financial tracking
- [ ] Smart patient lists

### 📊 Phase 6: Intelligence & Reporting (Planned)
- [ ] Outcome tracking
- [ ] Clinical analytics
- [ ] Retention analytics
- [ ] PDF letter generator

### 🔒 Phase 7: Compliance & Security (Planned)
- [ ] GDPR features
- [ ] Data encryption
- [ ] Audit trail implementation
- [ ] Role-based access control

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

- **v1.0.0** (Current) - Initial foundation and architecture
  - Complete database schema
  - Backend API structure
  - Frontend application skeleton
  - Authentication integration
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
