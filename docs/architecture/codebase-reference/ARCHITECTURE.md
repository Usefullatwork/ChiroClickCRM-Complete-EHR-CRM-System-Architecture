# Architecture

**Analysis Date:** 2026-01-21

## Pattern Overview

**Overall:** Four-Layer Monolithic Full-Stack Application with Multi-Tenant Support

**Key Characteristics:**

- Separate backend (Express API) and frontend (React SPA)
- Multi-tenant architecture with organization-based data isolation
- RESTful API design with versioned endpoints (`/api/v1/`)
- GDPR-compliant with full audit trails
- Norwegian healthcare standards (ICPC-2, ICD-10, NAV Takster)

## Layers

**UI Layer (Frontend):**

- Purpose: User interface and client-side interactions
- Contains: React components, pages, hooks, state management
- Location: `frontend/src/`
- Depends on: API Layer via HTTP calls
- Used by: End users (practitioners, staff)

**API Layer (Backend Routes):**

- Purpose: HTTP request handling, routing, validation
- Contains: Express routes, request validation, response formatting
- Location: `backend/src/routes/`
- Depends on: Service Layer, Middleware
- Used by: Frontend, Mobile app, External integrations

**Business Logic Layer (Services/Controllers):**

- Purpose: Core business rules, clinical logic, data transformations
- Contains: Services for each domain, controllers, validators
- Location: `backend/src/services/`, `backend/src/controllers/`
- Depends on: Data Layer, Utils
- Used by: API Layer

**Data Layer:**

- Purpose: Database access, persistence, caching
- Contains: PostgreSQL queries, Redis caching, models
- Location: `backend/src/config/database.js`, `database/schema.sql`
- Depends on: PostgreSQL, Redis
- Used by: Business Logic Layer

## Data Flow

**HTTP Request Lifecycle:**

1. Request arrives at Express server (`backend/src/server.js`)
2. Global middleware: helmet, cors, compression, morgan logging
3. Authentication middleware: Clerk JWT validation (`backend/src/middleware/auth.js`)
4. Route matching: `/api/v1/{resource}` routes to handler
5. Request validation: Joi schemas validate input (`backend/src/validators/`)
6. Controller/service executes business logic
7. Database queries via pg pool (`backend/src/config/database.js`)
8. Audit logging for sensitive operations (`backend/src/utils/audit.js`)
9. Response serialization and return

**State Management (Frontend):**

- Server state: React Query for API data caching
- Client state: Zustand stores for UI state
- Form state: React Hook Form with Zod validation
- Auth state: Clerk React SDK

## Key Abstractions

**Routes:**

- Purpose: Define API endpoints and connect to handlers
- Examples: `backend/src/routes/patients.js`, `backend/src/routes/encounters.js`
- Pattern: Express Router with middleware chains

**Services:**

- Purpose: Encapsulate business logic for each domain
- Examples: `backend/src/services/` (SMS, email, encryption)
- Pattern: Module exports with async functions

**Controllers:**

- Purpose: Handle request/response for specific domains
- Examples: `backend/src/controllers/`
- Pattern: Exported functions with (req, res, next) signature

**Middleware:**

- Purpose: Cross-cutting concerns (auth, validation, rate limiting)
- Examples: `backend/src/middleware/auth.js`, `backend/src/middleware/validator.js`
- Pattern: Express middleware functions

**React Components:**

- Purpose: UI building blocks
- Examples: `frontend/src/components/ui/` (shadcn/ui), `frontend/src/pages/`
- Pattern: Functional components with hooks

**API Services (Frontend):**

- Purpose: Encapsulate API calls
- Examples: `frontend/src/services/api.js`
- Pattern: Axios-based functions

## Entry Points

**Backend Entry:**

- Location: `backend/src/server.js`
- Triggers: `npm run dev` or `npm start`
- Responsibilities: Initialize Express, connect DB, register routes, start listening

**Frontend Entry:**

- Location: `frontend/src/main.jsx`
- Triggers: `npm run dev` or built assets
- Responsibilities: Render React app, setup providers (Clerk, React Query)

**CLI/Scripts:**

- Location: `backend/database/migrations/run.js`, `backend/database/seeds/run.js`
- Triggers: `npm run migrate`, `npm run seed`
- Responsibilities: Database migrations and seeding

## Error Handling

**Strategy:** Centralized error handling with error middleware

**Patterns:**

- `express-async-errors` for async route handlers
- Try/catch in services, throw custom errors
- Error middleware at end of Express chain
- Winston logger for error logging (`backend/src/utils/logger.js`)
- Sentry integration for production error tracking

## Cross-Cutting Concerns

**Logging:**

- Winston logger with configurable levels (`backend/src/utils/logger.js`)
- Morgan for HTTP request logging
- Audit logs for GDPR compliance (`backend/src/utils/audit.js`)

**Validation:**

- Joi schemas at API boundary (`backend/src/validators/`)
- Zod schemas in frontend (`frontend/src/`)
- express-validator for route validation

**Authentication:**

- Clerk.com for identity management
- JWT tokens validated via middleware (`backend/src/middleware/auth.js`)
- Role-based access control (ADMIN, PRACTITIONER, ASSISTANT)

**Multi-Tenancy:**

- Organization-based data isolation
- All queries filtered by `organization_id`
- User belongs to organization via `users` table

**Encryption:**

- AES-256-CBC for sensitive data (fødselsnummer)
- Encryption utilities (`backend/src/utils/encryption.js`)
- Key rotation support

**Caching:**

- Redis for session storage and caching
- React Query for frontend data caching

---

_Architecture analysis: 2026-01-21_
_Update when major patterns change_
