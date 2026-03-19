---
description: Analyzes build output sizes, chunk composition, and performance regressions.
---

Run a performance audit on the frontend build.

## Steps

### 1. Build

```bash
cd frontend && npm run build 2>&1
```

Capture Vite's output showing chunk sizes.

### 2. Analyze Chunks

```bash
ls -la frontend/dist/assets/*.js | awk '{print $5, $9}' | sort -rn
ls -la frontend/dist/assets/*.css | awk '{print $5, $9}' | sort -rn
```

For each chunk >50KB:

- Identify what's in it (check import graph or chunk name)
- Flag if it grew >10% since last audit

### 3. Source Map Check

```bash
ls frontend/dist/assets/*.map 2>/dev/null | wc -l
```

Source maps should NOT be in production builds.

### 4. CSS Analysis

```bash
wc -c frontend/dist/assets/*.css | sort -rn | head -5
```

Flag CSS files >100KB as candidates for purging.

### 5. Lazy Loading Verification

Check that heavy components are lazy-loaded:

- ClinicalEncounter (should be split after -50.7% optimization)
- EasyAssessment (should be lazy)
- CRM module (should be lazy — 11 modules)
- Training page

### 6. Report Format

```
# Performance Audit — {date}

## Build Summary
- Total JS: X KB (Y files)
- Total CSS: X KB (Y files)
- Source maps: present/absent
- Build time: Xs

## Chunk Analysis
| Chunk | Size | Status |
|-------|------|--------|
| index.js | XKB | OK/WARNING |
| ClinicalEncounter.js | XKB | OK (was YKB) |

## Regressions
[any chunk that grew >10%]

## Recommendations
[specific suggestions]
```

Write report to `reports/perf-audit-{date}.md`.
If a previous report exists, compare and highlight changes.
