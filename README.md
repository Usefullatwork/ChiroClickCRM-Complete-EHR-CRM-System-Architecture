# ChiroClickCRM - Complete EHR-CRM System

A Norwegian-compliant practice management system combining Electronic Health Records (EHR), Customer Relationship Management (CRM), and Practice Management System (PMS) for chiropractic practices.

## System Overview

ChiroClickCRM provides:

- **EHR**: Clinical documentation, SOAP notes, diagnosis, treatment tracking
- **CRM**: Patient retention, automated communications, follow-ups
- **PMS**: Scheduling, KPIs, financial tracking
- **Clinical Intelligence**: Outcome tracking, risk assessment, treatment effectiveness

## Architecture

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

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express |
| Database | PostgreSQL with JSONB |
| Auth | Clerk.com |
| SMS | Telnyx |
| PDF | react-pdf |
| State | Zustand, React Query |

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api/v1
```

### Manual Installation

1. **Clone and setup database**
   ```bash
   git clone <repository-url>
   cd ChiroClickCRM-Complete-EHR-CRM-System-Architecture

   # Create PostgreSQL database
   createdb chiroclickcrm
   psql chiroclickcrm < database/schema.sql
   ```

2. **Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run dev
   ```

3. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

4. **Access**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/v1
   - Health check: http://localhost:3000/health

### Demo Credentials

- **Admin**: admin@chiroclickcrm.no / admin123
- **Practitioner**: kiropraktor@chiroclickcrm.no / admin123
- **Receptionist**: resepsjon@chiroclickcrm.no / admin123

## Security & Compliance

### GDPR Compliance

- Consent management for SMS, email, marketing
- AES-256-CBC encryption for sensitive fields (fodselsnummer)
- Complete audit trails (Article 30)
- Right to Access, Erasure, and Portability

### Norwegian Healthcare Compliance

- ICPC-2 and ICD-10 diagnosis codes
- Norwegian treatment codes (Takster)
- NAV/HELFO integration
- HPR number validation

## Key Features

| Module | Capabilities |
|--------|--------------|
| **Clinical (EHR)** | SOAP notes, click-to-text, body chart, orthopedic tests, red flag alerts |
| **CRM** | SMS/Email via templates, automated recalls, delivery tracking |
| **Scheduling** | Online booking, recurring appointments, waitlist |
| **Financial** | Package tracking, NAV series, HELFO claims, invoicing |
| **KPI Dashboard** | Revenue, visits, no-shows, retention, rebooking rates |
| **Outcomes** | VAS tracking, treatment effectiveness, cohort analysis |
| **GDPR** | Data access, portability, erasure requests |

## Database Schema

14 core tables organized into:

- **Clinical**: organizations, users, patients, clinical_encounters, clinical_measurements
- **CRM**: communications, appointments, follow_ups, message_templates
- **Financial**: financial_metrics, diagnosis_codes, treatment_codes
- **Compliance**: audit_logs, gdpr_requests

## API Overview

The backend provides 40+ endpoints across these modules:

- `/api/v1/patients` - Patient management
- `/api/v1/encounters` - Clinical documentation
- `/api/v1/appointments` - Scheduling
- `/api/v1/communications` - SMS/Email
- `/api/v1/followups` - CRM tasks
- `/api/v1/financial` - Billing and invoices
- `/api/v1/kpi` - Dashboard metrics
- `/api/v1/outcomes` - Treatment analytics
- `/api/v1/gdpr` - Compliance requests
- `/api/v1/pdf` - Document generation

See [docs/development/API.md](docs/development/API.md) for full API documentation.

## Project Structure

```
ChiroClickCRM/
├── backend/           # Node.js/Express API
│   ├── src/
│   │   ├── config/    # Database, logger config
│   │   ├── routes/    # API endpoints
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/  # Business logic
│   │   └── utils/     # Helpers, encryption
│   └── database/
├── frontend/          # React + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
├── database/          # Schema and migrations
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
├── docs/              # Full documentation
│   ├── getting-started/
│   ├── architecture/
│   ├── clinical/
│   ├── deployment/
│   └── development/
└── docker-compose.yml
```

## Documentation

Detailed documentation is in the `/docs` directory:

- **Getting Started**: [docs/getting-started/](docs/getting-started/)
- **Architecture**: [docs/architecture/](docs/architecture/)
- **Clinical Modules**: [docs/clinical/](docs/clinical/)
- **Deployment**: [docs/deployment/](docs/deployment/)
- **Development**: [docs/development/](docs/development/)

## Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Deployment

```bash
# Production build
cd backend && npm run build
cd frontend && npm run build
```

Required environment variables:
- Database credentials
- API keys (Clerk, Telnyx)
- Encryption key (32 chars for AES-256)
- SMTP configuration

See [docs/deployment/](docs/deployment/) for detailed deployment guides.

## Version

**v4.0.0** - Production-Ready Release (November 2025)
- All 7 implementation phases complete
- 40+ API endpoints, 14 database tables
- Full GDPR compliance suite
- Norwegian healthcare compliance (ICPC-2, Takster, NAV/HELFO)

## License

Private and Confidential - All Rights Reserved

## Support

- Check documentation in `/docs`
- Create an issue in the repository
- Contact the development team

---

Built for Norwegian chiropractic practices
