# Coding Conventions

**Analysis Date:** 2026-01-21

## Naming Patterns

**Files:**

- `camelCase.js` for backend modules (`patients.js`, `auth.js`, `encryption.js`)
- `PascalCase.jsx` for React components (`Dashboard.jsx`, `Patients.jsx`)
- `*.test.js` or `*.spec.js` for test files
- `UPPERCASE.md` for important docs (`README.md`, `DEPLOYMENT_GUIDE.md`)

**Functions:**

- camelCase for all functions (`getPatient`, `createEncounter`)
- Async functions use `async/await` pattern
- Handler functions: `handle{Action}` for event handlers

**Variables:**

- camelCase for variables and parameters
- UPPER_SNAKE_CASE for constants (`DATABASE_URL`, `API_VERSION`)
- Boolean prefixes: `is`, `has`, `can` (`isActive`, `hasConsent`)

**Types:**

- PascalCase for React components
- No TypeScript - JavaScript with JSDoc comments

## Code Style

**Formatting:**

- Prettier with default config
- ESLint with React plugins
- 2 space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multiline

**Linting:**

- ESLint with `eslint-plugin-react`, `eslint-plugin-react-hooks`
- Run: `npm run lint` (both packages)
- lint-staged via Husky pre-commit hook

**Module System:**

- ES Modules (`"type": "module"` in package.json)
- `import/export` syntax throughout

## Import Organization

**Order (Backend):**

1. Node.js built-ins (`fs`, `path`, `crypto`)
2. External packages (`express`, `pg`, `axios`)
3. Internal modules (`./config/database.js`, `./utils/logger.js`)

**Order (Frontend):**

1. React (`react`, `react-dom`)
2. External packages (`@tanstack/react-query`, `axios`)
3. Internal components (`@/components/ui/`)
4. Relative imports (`./utils`, `../hooks`)

**Grouping:**

- Blank line between groups
- No sorting enforced (manual organization)

**Path Aliases:**

- Frontend uses `@/` alias for `src/` (configured in Vite)

## Error Handling

**Patterns:**

- `express-async-errors` wraps async route handlers
- Try/catch in service functions
- Throw errors, let middleware catch
- Custom error classes not used (plain Error)

**Error Types:**

- HTTP errors with status codes: `res.status(404).json({ error: 'Not found' })`
- Validation errors: Return 400 with message
- Auth errors: Return 401/403
- Server errors: Return 500, log to Winston

**Async:**

- Always use `async/await` (no raw Promises)
- No `.catch()` chains

## Logging

**Framework:**

- Winston logger (`backend/src/utils/logger.js`)
- Levels: debug, info, warn, error
- Morgan for HTTP request logging

**Patterns:**

- Structured logging with context
- Log at service boundaries
- Audit logging for sensitive operations (`backend/src/utils/audit.js`)
- No `console.log` in production code

## Comments

**When to Comment:**

- Explain complex business logic
- Document Norwegian healthcare terminology
- Note GDPR compliance requirements
- Explain non-obvious algorithms

**JSDoc:**

- Optional but encouraged for public functions
- Used for complex functions

**TODO Comments:**

- `// TODO: description` format
- Some `// FIXME:` for known issues

## Function Design

**Size:**

- Keep functions focused (single responsibility)
- Extract helpers for complex logic

**Parameters:**

- Destructure request: `const { patient_id } = req.params`
- Use object params for multiple options

**Return Values:**

- Explicit returns
- Return early for guard clauses
- Consistent response format: `{ success, data, error }`

## Module Design

**Exports (Backend):**

- Named exports for utilities
- Default export for Express routers
- Example: `export default router` in route files

**Exports (Frontend):**

- Default exports for React components
- Named exports for utilities and hooks

**Barrel Files:**

- Not commonly used
- Components imported directly from file

## React Patterns

**Components:**

- Functional components with hooks
- Props destructuring in function signature
- No class components

**State Management:**

- React Query for server state
- Zustand for client state
- Local state with `useState` for UI

**Forms:**

- React Hook Form with Zod validation
- Controlled inputs

**Styling:**

- Tailwind CSS utility classes
- `className` with clsx/tailwind-merge
- No CSS modules or styled-components

## API Patterns

**Request/Response:**

```javascript
// Route handler pattern
router.get("/", async (req, res) => {
  const { organization_id } = req.auth;
  const result = await service.getAll(organization_id);
  res.json(result);
});
```

**Response Format:**

- Success: `{ data: ... }` or array directly
- Error: `{ error: 'message' }` with HTTP status

**Query Parameters:**

- Pagination: `?page=1&limit=20`
- Search: `?q=term`
- Filters: `?status=active`

---

_Convention analysis: 2026-01-21_
_Update when patterns change_
