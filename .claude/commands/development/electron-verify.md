---
description: Verifies Electron desktop build artifacts and runs smoke tests for the desktop app.
---

Verify the Electron build is complete and functional.

## Prerequisites

This command should be run after `npx electron-builder` completes.

## Verification Steps

### 1. Build Artifacts Exist

```bash
ls -la dist/*.exe dist/*.dmg dist/*.AppImage 2>/dev/null
ls -la dist/*.blockmap 2>/dev/null
ls -la dist/*.yml 2>/dev/null
```

At minimum, one platform-specific installer must exist.

### 2. Artifact Size Check

- Windows .exe: should be 60-150MB (flag if >200MB or <30MB)
- Check for unexpected files in dist/ (source maps, .env, test files)

### 3. No Secrets in Build

```bash
grep -r "CLAUDE_API_KEY\|DB_PASSWORD\|JWT_SECRET\|OPENAI_API_KEY" dist/ 2>/dev/null
grep -r "admin123\|password123\|test@test" dist/ 2>/dev/null
```

If any match found: BUILD REJECTED.

### 4. Data Directory Verification

Check that PGlite data path is configured for user's app data directory (not project root):

```bash
grep -r "pglite\|DB_PATH\|data-dir" dist/ --include="*.js" 2>/dev/null | head -5
```

### 5. First-Run Wizard Check

Verify the first-run wizard is wired in:

```bash
grep -r "FirstRunWizard\|first-run\|firstRun" dist/ --include="*.js" 2>/dev/null | head -3
```

### 6. Orphan Process Check

```bash
ps aux | grep -i electron | grep -v grep
ps aux | grep -i node | grep -v grep | grep -v claude
```

Flag any lingering Electron or Node processes from previous builds.

## Output Format

```
ELECTRON BUILD VERIFICATION

Artifacts:
  [x] Windows installer: filename (X MB)
  [ ] macOS DMG: not found (expected on Windows)
  [ ] Linux AppImage: not found (expected on Windows)

Security:
  [x] No secrets in build artifacts
  [x] No test credentials in build

Integrity:
  [x] PGlite data path configured
  [x] First-run wizard present
  [x] No orphan processes

Result: PASS / FAIL
[If FAIL: specific reason and fix suggestion]
```

## Integration

This command is called as part of `/release-check` when on the desktop branch.
