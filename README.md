# ChiroClickCRM v2.0.0 - Standalone Desktop Edition

A Norwegian-compliant practice management system combining Electronic Health Records (EHR), Customer Relationship Management (CRM), and Practice Management System (PMS) for chiropractic practices.

**v2.0.0** is a fully self-contained desktop application. Zero cloud dependencies. All data stays on your machine.

## Quick Start (Desktop)

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Ollama (optional, for AI features)

### Option 1: Double-click launcher

```bash
START-DESKTOP.bat
```

### Option 2: Manual start

```bash
# Install dependencies (first time only)
cd backend && npm install --legacy-peer-deps
cd ../frontend && npm install --legacy-peer-deps

# Start the application
cd backend && npm run dev
# In a new terminal:
cd frontend && npm run dev
```

### Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **Health check**: http://localhost:3000/health

### Demo Credentials

- **Admin**: admin@chiroclickcrm.no / admin123
- **Practitioner**: kiropraktor@chiroclickcrm.no / admin123

## System Overview

ChiroClickCRM provides:

- **EHR**: Clinical documentation, SOAP notes, diagnosis, treatment tracking
- **CRM**: Patient retention, automated communications, follow-ups
- **PMS**: Scheduling, KPIs, financial tracking
- **AI**: Local AI clinical assistant via Ollama (no cloud API keys needed)
- **Dark Mode**: Full dark/light theme support

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  UI Layer - React + Vite + Tailwind + shadcn/ui    │
├─────────────────────────────────────────────────────┤
│  Business Logic - Clinical rules, safety checks     │
├─────────────────────────────────────────────────────┤
│  API Layer - Node.js/Express (local only)          │
├─────────────────────────────────────────────────────┤
│  Data Layer - PGlite (embedded) or PostgreSQL      │
├─────────────────────────────────────────────────────┤
│  AI Layer - Ollama (local models, optional)        │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express |
| Database | PGlite (embedded) or PostgreSQL |
| Cache | In-memory (desktop) or Redis (SaaS) |
| Auth | Local sessions + bcrypt + JWT |
| AI | Ollama (local models) |
| Desktop | Electron (optional packaging) |
| State | Zustand, TanStack Query |

## Database Modes

| Mode | Engine | Use Case |
|------|--------|----------|
| `DB_ENGINE=pglite` | PGlite (embedded) | Desktop, no install needed |
| `DB_ENGINE=postgres` | PostgreSQL | Docker, SaaS, production |

## AI Models (Optional)

ChiroClickCRM uses local AI models via Ollama for clinical documentation:

| Model | Base | Size | Purpose |
|-------|------|------|---------|
| chiro-no | Mistral 7B | ~4.5GB | Clinical documentation |
| chiro-fast | Llama 3.2 3B | ~2GB | Quick autocomplete |
| chiro-norwegian | NorwAI-Mistral-7B | ~4.5GB | Norwegian language |
| chiro-medical | MedGemma 4B | ~2.5GB | Clinical safety |

```bash
# Install Ollama, then build models:
cd ai-training && build-model.bat
```

## Security & Compliance

### GDPR Compliance

- AES-256-CBC encryption for sensitive fields
- Complete audit trails (Article 30)
- Right to Access, Erasure, and Portability

### Norwegian Healthcare Compliance

- ICPC-2 and ICD-10 diagnosis codes
- Norwegian treatment codes (Takster)
- HPR number validation

## Key Features

| Module | Capabilities |
|--------|--------------|
| **Clinical (EHR)** | SOAP notes, click-to-text, body chart, orthopedic tests, red flag alerts |
| **CRM** | SMS/Email via templates, automated recalls, delivery tracking |
| **Scheduling** | Appointments, recurring bookings, waitlist |
| **Financial** | Package tracking, NAV series, HELFO claims |
| **KPI Dashboard** | Revenue, visits, no-shows, retention rates |
| **AI Assistant** | Local clinical documentation, streaming completions |
| **GDPR** | Data access, portability, erasure requests |

## Project Structure

```
ChiroClickCRM/
├── backend/           # Node.js/Express API
│   ├── src/
│   │   ├── config/    # Database, cache, vault routers
│   │   ├── routes/    # API endpoints (40+)
│   │   ├── controllers/
│   │   ├── middleware/ # Auth, security, rate limiting
│   │   └── services/  # Business logic, AI, CRM
│   └── database/
├── frontend/          # React + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/     # Auto-save, theme, AI streaming
│       └── services/
├── desktop/           # Electron packaging
│   ├── main.js
│   ├── preload.js
│   └── backend-launcher.js
├── ai-training/       # Ollama Modelfiles + training data
├── database/          # Schema, migrations, seeds
├── docs/              # Full documentation
└── _archive/          # Legacy Docker/cloud configs
```

## Testing

```bash
# Backend tests
cd backend && npm test

# Frontend build verification
cd frontend && npm run build
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

**Required:**
- `ENCRYPTION_KEY` - 32-char key for AES-256
- `JWT_SECRET` - Secret for JWT tokens
- `SESSION_SECRET` - Session encryption secret

**Desktop defaults (no config needed):**
- `DESKTOP_MODE=true`
- `DB_ENGINE=pglite`
- `CACHE_ENGINE=memory`

See `.env.example` for all options.

## License

Private and Confidential - All Rights Reserved

---

Built for Norwegian chiropractic practices. v2.0.0 - Standalone Desktop Edition.
