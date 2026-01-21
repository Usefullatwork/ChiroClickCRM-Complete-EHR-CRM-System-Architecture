# Technology Stack

**Analysis Date:** 2026-01-21

## Languages

**Primary:**
- JavaScript (ES Modules) - All application code (`backend/src/`, `frontend/src/`)

**Secondary:**
- SQL - Database schema and migrations (`database/schema.sql`, `backend/database/migrations/`)
- Python - Data processing scripts (`download_all_videos.py`, `training_data/validate_dataset.py`)

## Runtime

**Environment:**
- Node.js >= 18.0.0 - `package.json` engines field
- Browser runtime for frontend (React SPA)

**Package Manager:**
- npm >= 9.0.0
- Lockfile: `package-lock.json` present in root, backend, and frontend

## Frameworks

**Core:**
- Express 4.18 - Backend HTTP server (`backend/src/server.js`)
- React 18.2 - Frontend UI framework (`frontend/src/main.jsx`)
- Vite 5.0 - Frontend build tool (`frontend/vite.config.js`)

**Testing:**
- Jest 29.7 - Backend tests with `--experimental-vm-modules` (`backend/package.json`)
- Vitest 1.1 - Frontend tests (`frontend/vitest.config.js`)
- Playwright - E2E tests (`e2e/playwright.config.js`)
- Testing Library - React component tests (`@testing-library/react`)
- Supertest - API integration tests (`backend/package.json`)

**Build/Dev:**
- Vite 5.0 - Frontend bundling (`frontend/vite.config.js`)
- Nodemon 3.0 - Backend hot reload (`backend/package.json`)
- ESLint 8.55 - Linting (both packages)
- Prettier 3.1 - Code formatting (both packages)
- Husky 8.0 - Git hooks (`package.json`)

## Key Dependencies

**Critical - Backend:**
- `express` 4.18 - HTTP server and routing (`backend/src/server.js`)
- `pg` 8.11 - PostgreSQL client (`backend/src/config/database.js`)
- `@clerk/clerk-sdk-node` 4.13 - Authentication (`backend/src/middleware/auth.js`)
- `redis` 4.6 - Caching and sessions (`backend/src/config/`)
- `nodemailer` 6.9 - Email service (`backend/src/services/`)
- `pdfkit` 0.17 - PDF generation (`backend/src/routes/pdf.js`)
- `winston` 3.11 - Logging (`backend/src/utils/logger.js`)
- `joi` 17.11 - Validation (`backend/src/validators/`)

**Critical - Frontend:**
- `react` 18.2 - UI framework (`frontend/src/`)
- `react-router-dom` 6.20 - Client-side routing (`frontend/src/App.jsx`)
- `@tanstack/react-query` 5.14 - Server state management (`frontend/src/`)
- `zustand` 4.4 - Client state management (`frontend/src/`)
- `@clerk/clerk-react` 4.30 - Authentication (`frontend/src/`)
- `axios` 1.6 - HTTP client (`frontend/src/services/api.js`)
- `recharts` 2.10 - Charts and analytics (`frontend/src/components/analytics/`)
- `zod` 3.22 - Schema validation (`frontend/src/`)
- `react-hook-form` 7.49 - Form handling (`frontend/src/`)

**UI Components:**
- Radix UI primitives - Accessible components (`@radix-ui/react-*`)
- Tailwind CSS 3.3 - Styling (`frontend/tailwind.config.js`)
- shadcn/ui patterns - Component library (Radix + Tailwind)
- Lucide React - Icons (`lucide-react`)
- Sonner - Toast notifications (`sonner`)

**Infrastructure:**
- `helmet` 7.1 - Security headers (`backend/src/server.js`)
- `cors` 2.8 - CORS middleware (`backend/src/server.js`)
- `express-rate-limit` 7.1 - Rate limiting (`backend/src/middleware/`)
- `@sentry/node` 7.91 - Error tracking (`backend/src/`)
- `node-cron` 3.0 - Scheduled tasks (`backend/src/`)

## Configuration

**Environment:**
- `.env` files for configuration (gitignored)
- `.env.example` documents all required variables
- Key vars: `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `OPENAI_API_KEY`

**Build:**
- `vite.config.js` - Frontend build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `jest.config.js` - Backend test configuration
- `vitest.config.js` - Frontend test configuration
- `playwright.config.js` - E2E test configuration

## Platform Requirements

**Development:**
- Any platform with Node.js 18+
- PostgreSQL 14+ (local or Docker)
- Redis (optional for caching)
- Docker available (`docker-compose.yml`)

**Production:**
- PostgreSQL database
- Redis for caching/sessions
- Node.js 18+ runtime
- Docker support (`docker-compose.prod.yml`)
- Terraform for infrastructure (`terraform/`)

---

*Stack analysis: 2026-01-21*
*Update after major dependency changes*
