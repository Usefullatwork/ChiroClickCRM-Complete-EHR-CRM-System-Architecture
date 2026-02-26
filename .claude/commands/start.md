---
name: start
description: Start the ChiroClickCRM system (backend + frontend). Kills stale processes, starts fresh, verifies health.
---

Start the ChiroClickCRM system. Follow these steps in order:

## 1. Pre-flight Check

Run `bash scripts/check-health.sh` to see if anything is already running.

## 2. Kill Stale Processes (if needed)

If backend or frontend are already running but unhealthy, kill them:

```bash
# Find and kill node processes on ports 3000 and 5173
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
```

## 3. Check PGlite

Run `bash scripts/check-pglite.sh`. If CORRUPTED:

- Delete the corrupted data dir: `rm -rf data/pglite`
- The backend will auto-recreate it via db-init.js on startup

## 4. Start Backend

```bash
cd backend && npm run dev &
```

Wait ~5 seconds for PGlite initialization, then verify:

```bash
sleep 5 && curl -s http://localhost:3000/health
```

## 5. Start Frontend

```bash
cd frontend && npm run dev &
```

Wait ~3 seconds, then verify:

```bash
sleep 3 && curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

## 6. Final Health Check

Run `bash scripts/check-health.sh` — all services should show OK.

Report the final status to the user.
