---
name: health
description: Run all health checks — backend, frontend, PGlite, seed data. Full system status report.
---

Run a comprehensive health check of the ChiroClickCRM system.

## Run All Check Scripts

Execute each check script and collect results:

```bash
bash scripts/check-health.sh
bash scripts/check-pglite.sh
bash scripts/check-seeds.sh
```

## Report Status

Present a summary table:

| Component | Status             | Details                              |
| --------- | ------------------ | ------------------------------------ |
| Backend   | OK/DOWN            | Port 3000                            |
| Frontend  | OK/DOWN            | Port 5173                            |
| Ollama    | OK/DOWN            | Port 11434 (optional)                |
| PGlite    | OK/EMPTY/CORRUPTED | data/pglite/                         |
| Seed Data | LOADED/MISSING     | patients, spine templates, exercises |

## Recommendations

If anything is down, suggest the fix:

- Backend down → `cd backend && npm run dev`
- Frontend down → `cd frontend && npm run dev`
- PGlite corrupted → `rm -rf data/pglite && cd backend && npm run dev`
- Seeds missing → restart backend (db-init.js auto-seeds)
