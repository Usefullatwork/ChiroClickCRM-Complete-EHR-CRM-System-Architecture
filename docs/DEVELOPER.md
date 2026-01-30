# ChiroClickCRM Developer Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Authentication](#authentication)
7. [Adding New Features](#adding-new-features)
8. [Testing Guidelines](#testing-guidelines)
9. [Code Conventions](#code-conventions)
10. [Common Patterns](#common-patterns)

---

## Architecture Overview

ChiroClickCRM is a multi-tenant Norwegian-compliant EHR-CRM-PMS system.

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js 18 + Express |
| Database | PostgreSQL 15 |
| Cache | Redis |
| AI | Ollama (local) with custom fine-tuned models |
| Authentication | Session-based with bcrypt |

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                     │
│  Port: 5173                                                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend API (Node.js + Express)                             │
│  Port: 3000                                                  │
│  ├── Routes → Controllers → Services → Database             │
│  ├── Middleware (auth, validation, RLS)                     │
│  └── Jobs (scheduler, workflows)                            │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             ▼                              ▼
┌────────────────────────┐    ┌────────────────────────────────┐
│  PostgreSQL            │    │  Redis                         │
│  Port: 5432            │    │  Port: 6379                    │
│  - Multi-tenant RLS    │    │  - Session storage             │
│  - JSONB for flexible  │    │  - API caching                 │
│    data                │    │  - Rate limiting               │
└────────────────────────┘    └────────────────────────────────┘
             │
             ▼
┌────────────────────────┐
│  Ollama AI             │
│  Port: 11434           │
│  - chiro-no (default)  │
│  - chiro-fast          │
│  - chiro-norwegian     │
│  - chiro-medical       │
└────────────────────────┘
```

### Multi-Tenancy

- Each organization has a unique `organization_id`
- Row-Level Security (RLS) enforces data isolation
- All queries are scoped by organization automatically

---

## Development Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL client (psql)
- Git

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/chiroclickcrm.git
cd chiroclickcrm

# Start Docker services
docker-compose up -d

# Backend setup
cd backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev

# Frontend setup (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chiroclickcrm
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=your-32-character-encryption-key
SESSION_SECRET=your-session-secret

# AI (optional for dev)
OLLAMA_URL=http://localhost:11434
AI_MODEL=chiro-no
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
```

### Database Setup

```bash
# Connect to database
docker exec -it chiroclickcrm-db psql -U postgres -d chiroclickcrm

# Run migrations
cd backend
npm run migrate

# Seed demo data
npm run seed
```

### Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@chiroclickcrm.no | admin123 | ADMIN |
| kiropraktor@chiroclickcrm.no | admin123 | PRACTITIONER |

---

## Project Structure

```
chiroclickcrm/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Redis, env config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   ├── jobs/            # Background job handlers
│   │   │   ├── scheduler.js # Cron job management
│   │   │   ├── actionExecutor.js # Workflow action execution
│   │   │   └── triggerDetector.js # Event-based triggers
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Express app entry point
│   ├── __tests__/           # Test files
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # API client functions
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Helper functions
│   │   └── App.jsx          # Root component
│   └── package.json
│
├── database/
│   ├── schema.sql           # Main database schema
│   ├── migrations/          # Incremental migrations
│   └── seeds/               # Reference data
│
├── ai-training/             # AI model training data
│   ├── Modelfile*           # Ollama model definitions
│   └── training-data.jsonl  # Training examples
│
├── docs/                    # Documentation
└── docker-compose.yml       # Container orchestration
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant organization data |
| `users` | Staff accounts and credentials |
| `patients` | Patient demographics and CRM data |
| `clinical_encounters` | SOAP documentation |
| `appointments` | Scheduling |
| `communications` | SMS/email history |
| `follow_ups` | Task management |

### Key Relationships

```sql
-- Organizations own everything
organizations
  ├── users (1:N)
  ├── patients (1:N)
  │     ├── clinical_encounters (1:N)
  │     ├── appointments (1:N)
  │     ├── communications (1:N)
  │     └── follow_ups (1:N)
  └── settings

-- Multi-tenant foreign keys
organization_id UUID REFERENCES organizations(id)
```

### Row-Level Security

All tables use RLS policies:

```sql
-- Example RLS policy
CREATE POLICY patients_tenant_isolation ON patients
  USING (organization_id = current_tenant_id());
```

Set tenant context before queries:

```javascript
// In service code
import { setTenantContext } from '../config/database.js';

await setTenantContext(organizationId);
const result = await query('SELECT * FROM patients');
```

---

## API Design

### REST Conventions

```
GET    /api/v1/{resource}         # List
GET    /api/v1/{resource}/:id     # Get one
POST   /api/v1/{resource}         # Create
PATCH  /api/v1/{resource}/:id     # Update
DELETE /api/v1/{resource}/:id     # Delete
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Format

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### Authentication

Include session cookie with requests:

```javascript
// Frontend API client
const response = await fetch('/api/v1/patients', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-Organization-Id': organizationId
  }
});
```

---

## Authentication

### Session-Based Auth

```javascript
// Login flow
POST /api/v1/auth/login
Body: { email, password }
Response: Sets httpOnly cookie + returns user data

// Get current user
GET /api/v1/auth/me
Response: Current user profile

// Logout
POST /api/v1/auth/logout
Response: Clears session cookie
```

### Auth Middleware

```javascript
// backend/src/middleware/auth.js

// Require authentication
router.use(requireAuth);

// Require specific role
router.use(requireRole(['ADMIN', 'PRACTITIONER']));
```

### Password Hashing

```javascript
import bcrypt from 'bcrypt';

// Hash password (on registration)
const passwordHash = await bcrypt.hash(password, 12);

// Verify password (on login)
const valid = await bcrypt.compare(password, user.password_hash);
```

---

## Adding New Features

### 1. Add Database Table

```sql
-- database/migrations/XXX_feature_name.sql
CREATE TABLE feature_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feature_items_org ON feature_items(organization_id);
```

### 2. Create Service

```javascript
// backend/src/services/featureItems.js
import { query } from '../config/database.js';

export const getAllItems = async (organizationId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT * FROM feature_items
     WHERE organization_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [organizationId, limit, offset]
  );

  return result.rows;
};

export const createItem = async (organizationId, data) => {
  const result = await query(
    `INSERT INTO feature_items (organization_id, name)
     VALUES ($1, $2)
     RETURNING *`,
    [organizationId, data.name]
  );

  return result.rows[0];
};
```

### 3. Create Controller

```javascript
// backend/src/controllers/featureItems.js
import * as featureItemsService from '../services/featureItems.js';

export const getAll = async (req, res) => {
  const items = await featureItemsService.getAllItems(
    req.user.organization_id,
    req.query
  );

  res.json({ success: true, data: items });
};

export const create = async (req, res) => {
  const item = await featureItemsService.createItem(
    req.user.organization_id,
    req.body
  );

  res.status(201).json({ success: true, data: item });
};
```

### 4. Create Routes

```javascript
// backend/src/routes/featureItems.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as controller from '../controllers/featureItems.js';

const router = Router();

router.use(requireAuth);

router.get('/', controller.getAll);
router.post('/', controller.create);

export default router;
```

### 5. Register in Server

```javascript
// backend/src/server.js
import featureItemsRoutes from './routes/featureItems.js';

app.use(`/api/${API_VERSION}/feature-items`, featureItemsRoutes);
```

### 6. Add Frontend API Client

```javascript
// frontend/src/services/api.js
export const featureItemsAPI = {
  getAll: (params) => request('/feature-items', { params }),
  create: (data) => request('/feature-items', { method: 'POST', data })
};
```

### 7. Create React Component

```jsx
// frontend/src/pages/FeatureItems.jsx
import { useState, useEffect } from 'react';
import { featureItemsAPI } from '../services/api';

export default function FeatureItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await featureItemsAPI.getAll();
        setItems(response.data);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

---

## Testing Guidelines

### Backend Tests

Location: `backend/__tests__/`

```javascript
// backend/__tests__/integration/api/featureItems.test.js
import request from 'supertest';
import app from '../../../src/server.js';
import { createTestUser, cleanupTestData } from '../../helpers/testUtils.js';

describe('Feature Items API', () => {
  let authCookie;

  beforeAll(async () => {
    const { cookie } = await createTestUser();
    authCookie = cookie;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  test('GET /feature-items returns list', async () => {
    const response = await request(app)
      .get('/api/v1/feature-items')
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

### Running Tests

```bash
# All tests
cd backend && npm test

# With coverage
npm test -- --coverage

# Specific file
npm test -- featureItems.test.js

# Watch mode
npm test -- --watch
```

### Test Coverage Requirements

- Minimum 70% overall coverage
- 100% coverage for auth-related code
- All API endpoints must have tests

---

## Code Conventions

### JavaScript/Node.js

```javascript
// Use ES modules
import express from 'express';

// Async/await over callbacks
const data = await someAsyncOperation();

// Descriptive variable names
const patientEncounters = await getEncountersByPatientId(patientId);

// Error handling
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed:', error);
  throw error; // Re-throw for middleware to handle
}
```

### Database Queries

```javascript
// Always use parameterized queries
await query('SELECT * FROM patients WHERE id = $1', [patientId]);

// Never concatenate user input
// BAD: `SELECT * FROM patients WHERE name = '${name}'`

// Use explicit column lists
const result = await query(
  'SELECT id, first_name, last_name FROM patients WHERE id = $1',
  [patientId]
);
```

### React Components

```jsx
// Functional components with hooks
export default function PatientCard({ patient }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3>{patient.first_name} {patient.last_name}</h3>
    </div>
  );
}

// Props destructuring
function Button({ onClick, children, variant = 'primary' }) { ... }
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | camelCase | `patientService.js` |
| Components | PascalCase | `PatientCard.jsx` |
| Functions | camelCase | `getPatientById` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Database tables | snake_case | `clinical_encounters` |
| Database columns | snake_case | `first_name` |

---

## Common Patterns

### Service Pattern

```javascript
// Services contain business logic
export const calculatePatientValue = async (organizationId, patientId) => {
  const encounters = await getEncountersByPatient(patientId);
  const payments = await getPaymentsByPatient(patientId);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const visitCount = encounters.length;

  return {
    lifetimeValue: totalRevenue,
    averageVisitValue: visitCount > 0 ? totalRevenue / visitCount : 0,
    visitCount
  };
};
```

### Error Handling Middleware

```javascript
// Errors bubble up to global handler
app.use((err, req, res, next) => {
  logger.error('Request error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});
```

### Pagination

```javascript
// Standard pagination helper
export const paginate = async (tableName, organizationId, options = {}) => {
  const { page = 1, limit = 20, orderBy = 'created_at DESC' } = options;
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    query(`SELECT COUNT(*) FROM ${tableName} WHERE organization_id = $1`, [organizationId]),
    query(
      `SELECT * FROM ${tableName}
       WHERE organization_id = $1
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset]
    )
  ]);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(countResult.rows[0].count / limit)
    }
  };
};
```

### Workflow Triggers

```javascript
// Trigger workflows on events
import { onPatientCreated } from '../jobs/triggerDetector.js';

// In patient service
export const createPatient = async (organizationId, patientData) => {
  const patient = await query(
    `INSERT INTO patients (...) VALUES (...) RETURNING *`,
    [...]
  );

  // Trigger any NEW_PATIENT workflows
  await onPatientCreated(organizationId, patient.id);

  return patient;
};
```

---

## Debugging

### Backend Logging

```javascript
import logger from '../utils/logger.js';

logger.info('Patient created', { patientId, organizationId });
logger.warn('Rate limit approaching', { userId, count });
logger.error('Database error', { error: err.message, query });
```

### Database Query Debugging

```bash
# Enable query logging
docker exec -it chiroclickcrm-db psql -U postgres -d chiroclickcrm
\set ECHO queries
```

### Frontend Debugging

```javascript
// Use React DevTools
// Use Network tab to inspect API calls
// Console logging (remove before commit)
console.log('State:', state);
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
