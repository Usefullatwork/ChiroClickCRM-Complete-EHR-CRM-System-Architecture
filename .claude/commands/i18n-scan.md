---
description: Scans frontend code for hardcoded Norwegian strings and tracks i18n migration progress against the 676-string baseline.
---

Scan for hardcoded Norwegian strings in frontend source code.

$ARGUMENTS

## What to Scan

Search `frontend/src/` (excluding test files and translation JSONs) for:

### Pattern 1: Norwegian Characters in Strings
```bash
grep -rn "['\"].*[aeoeaa].*['\"]" frontend/src/ --include="*.jsx" --include="*.js" --exclude-dir="__tests__" --exclude-dir="locales" --exclude-dir="i18n" | grep -v "\.test\." | grep -v "import " | grep -v "require(" | head -50
```

### Pattern 2: Common Norwegian UI Words
```bash
grep -rn "'Lagre\|'Avbryt\|'Slett\|'Opprett\|'Rediger\|'Lukk\|'Bekreft\|'Vis\|'Sok\|'Hjem\|'Innstillinger\|'Pasient\|'Behandling\|'Timebestilling\|'Journal" frontend/src/ --include="*.jsx" --include="*.js" --exclude-dir="__tests__" --exclude-dir="locales" | head -50
```

### Pattern 3: Norwegian Sentences (strings with spaces + Norwegian chars)
```bash
grep -rn "['\"].*[A-Z][a-z].*[aeoeaa].*[a-z].*['\"]" frontend/src/ --include="*.jsx" --include="*.js" --exclude-dir="__tests__" --exclude-dir="locales" | grep -v "import\|require\|console\|\.test\." | head -50
```

## Exclusions

Do NOT flag:
- Import statements
- Variable names or object keys
- Comments
- Test files (`*.test.js`, `*.test.jsx`, `__tests__/`)
- Translation files (`locales/`, `i18n/`)
- Already-translated strings using `t()` or `useTranslation()`

## Output Format

```
# i18n Coverage Scan — {date}

## Progress
- Baseline: 676 hardcoded strings (as of CLAUDE.md)
- Current: X hardcoded strings found
- Delta: +/-Y since baseline
- Components extracted: [list of components with i18n]

## By Component (Top 10)
| File | Count | Sample String |
|------|-------|---------------|
| PatientDetail.jsx | 42 | "Pasientdetaljer" |
| ... | ... | ... |

## Suggested Quick Wins
[files with 1-3 strings that could be extracted in <5 min each]

## Full List
[all findings with file:line and the hardcoded string]
```

Track progress against baseline. If count decreased, celebrate. If increased, flag the regression.
