# Codebase Structure

**Analysis Date:** 2026-01-21

## Directory Layout

```
ChiroClickCRM/
├── backend/                    # Express API server
│   ├── src/                   # Source code
│   │   ├── config/           # Configuration (database, etc.)
│   │   ├── controllers/      # Request handlers
│   │   ├── domain/           # Domain logic (entities, usecases)
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API route definitions (45+ files)
│   │   ├── services/         # Business services
│   │   ├── utils/            # Helper functions
│   │   ├── validators/       # Joi validation schemas
│   │   ├── auth/             # Authentication logic
│   │   ├── fhir/             # FHIR integration
│   │   ├── docs/             # API documentation
│   │   └── server.js         # Main entry point
│   ├── database/             # Migrations and seeds
│   └── package.json
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── layouts/     # Page layouts
│   │   │   ├── clinical/    # Clinical documentation
│   │   │   ├── anatomy/     # Body charts, diagrams
│   │   │   ├── crm/         # CRM components
│   │   │   └── ...          # Domain-specific components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx          # Root component
│   │   └── main.jsx         # Entry point
│   └── package.json
├── database/                   # Database schema
│   └── schema.sql            # PostgreSQL schema (14 tables)
├── mobile-app/                 # React Native mobile app
├── e2e/                        # Playwright E2E tests
│   └── tests/                # Test files
├── docs/                       # Documentation
├── compliance/                 # Compliance documents
├── terraform/                  # Infrastructure as code
├── scripts/                    # Utility scripts
├── ai-training/                # AI model training data
├── training_data/              # Training datasets
├── ehr-templates/              # Clinical note templates
├── sample-data/                # Sample/seed data
├── docker-compose.yml          # Development Docker
├── docker-compose.prod.yml     # Production Docker
├── package.json                # Root workspace
└── *.md                        # Documentation files
```

## Directory Purposes

**backend/src/routes/**
- Purpose: API endpoint definitions
- Contains: 45+ route files for different domains
- Key files: `patients.js`, `encounters.js`, `appointments.js`, `financial.js`, `gdpr.js`
- Pattern: Each file exports an Express Router

**backend/src/controllers/**
- Purpose: Request handling logic
- Contains: Controller functions for each domain
- Pattern: Async functions with (req, res, next) signature

**backend/src/services/**
- Purpose: External service integrations and business logic
- Contains: SMS, email, encryption, AI services
- Pattern: Module exports with async functions

**backend/src/middleware/**
- Purpose: Cross-cutting middleware
- Contains: `auth.js` (Clerk), `validator.js`, rate limiting
- Key files: `auth.js` - JWT validation

**backend/src/validators/**
- Purpose: Request validation schemas
- Contains: Joi schemas for each domain
- Pattern: Export schema objects

**frontend/src/components/**
- Purpose: Reusable UI components
- Contains: 20+ subdirectories by domain
- Key dirs: `ui/` (shadcn), `clinical/`, `anatomy/`, `crm/`
- Pattern: React functional components

**frontend/src/pages/**
- Purpose: Page-level components (routed views)
- Contains: Dashboard, Patients, Encounters, etc.
- Key files: `Dashboard.jsx`, `Patients.jsx`, `ClinicalEncounter.jsx`

**frontend/src/services/**
- Purpose: API client functions
- Contains: `api.js` - Axios-based API calls
- Pattern: Async functions returning data

## Key File Locations

**Entry Points:**
- `backend/src/server.js` - Backend Express server
- `frontend/src/main.jsx` - Frontend React entry
- `frontend/src/App.jsx` - React Router setup

**Configuration:**
- `backend/src/config/database.js` - PostgreSQL connection
- `frontend/vite.config.js` - Vite build config
- `frontend/tailwind.config.js` - Tailwind CSS config
- `.env.example` - Environment variables template
- `docker-compose.yml` - Docker services

**Core Logic:**
- `backend/src/routes/*.js` - All API routes
- `backend/src/middleware/auth.js` - Authentication
- `backend/src/utils/encryption.js` - Data encryption
- `backend/src/utils/audit.js` - Audit logging

**Testing:**
- `backend/src/**/__tests__/` - Backend unit tests
- `frontend/src/components/**/__tests__/` - Frontend unit tests
- `e2e/tests/*.spec.js` - Playwright E2E tests

**Documentation:**
- `README.md` - Main documentation
- `IMPLEMENTATION_COMPLETE.md` - Feature documentation
- `DATABASE_SETUP.md` - Database setup guide
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

## Naming Conventions

**Files:**
- `camelCase.js` - JavaScript modules (`patients.js`, `auth.js`)
- `PascalCase.jsx` - React components (`Dashboard.jsx`, `Patients.jsx`)
- `*.test.js` / `*.spec.js` - Test files
- `UPPERCASE.md` - Important documentation

**Directories:**
- `kebab-case` - Most directories (`ai-training`, `sample-data`)
- `camelCase` - Some src directories (`followups`, `neuroexam`)
- Plural for collections (`components`, `routes`, `services`)

**Special Patterns:**
- `__tests__/` - Jest test directories
- `__mocks__/` - Jest mock directories
- `index.js` - Barrel exports (rarely used)

## Where to Add New Code

**New API Endpoint:**
- Route definition: `backend/src/routes/{domain}.js`
- Controller: `backend/src/controllers/{domain}.js`
- Validation: `backend/src/validators/{domain}.js`
- Tests: `backend/src/routes/__tests__/{domain}.test.js`

**New React Page:**
- Page component: `frontend/src/pages/{PageName}.jsx`
- Route: Add to `frontend/src/App.jsx`
- Tests: `frontend/src/pages/__tests__/{PageName}.test.jsx`

**New Component:**
- Implementation: `frontend/src/components/{domain}/{ComponentName}.jsx`
- Tests: `frontend/src/components/{domain}/__tests__/{ComponentName}.test.jsx`

**New Service:**
- Backend: `backend/src/services/{service}.js`
- Frontend: Add to `frontend/src/services/api.js`

**Utilities:**
- Backend: `backend/src/utils/{utility}.js`
- Frontend: `frontend/src/utils/{utility}.js`

## Special Directories

**.planning/**
- Purpose: GSD planning documents (new)
- Source: Created during project planning
- Committed: Yes

**node_modules/**
- Purpose: NPM dependencies
- Source: Auto-generated by npm install
- Committed: No (gitignored)

**terraform/**
- Purpose: Infrastructure as code
- Source: Manual infrastructure definitions
- Committed: Yes

**ai-training/**
- Purpose: AI model training data and scripts
- Source: Training data preparation
- Committed: Yes

---

*Structure analysis: 2026-01-21*
*Update when directory structure changes*
