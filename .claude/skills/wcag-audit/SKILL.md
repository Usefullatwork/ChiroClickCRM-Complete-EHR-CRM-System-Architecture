---
name: wcag-audit
description: Scans frontend components for WCAG 2.1 AA compliance issues. Activates before releases or when modifying UI components.
allowed-tools: Read, Grep, Glob
---

# WCAG 2.1 AA Audit

Norwegian law requires WCAG 2.1 AA compliance for healthcare applications.

## Scan Categories

### 1. Missing ARIA Labels (WCAG 4.1.2)

Search JSX files for interactive elements without accessible names:

```
grep -rn '<button' --include="*.jsx" | grep -v 'aria-label\|aria-labelledby\|children'
grep -rn '<input' --include="*.jsx" | grep -v 'aria-label\|id=.*label\|<label'
grep -rn '<select' --include="*.jsx" | grep -v 'aria-label\|id=.*label'
grep -rn 'onClick' --include="*.jsx" | grep '<div\|<span' | grep -v 'role=\|aria-'
```

### 2. Missing Alt Text (WCAG 1.1.1)

```
grep -rn '<img' --include="*.jsx" | grep -v 'alt='
```

Decorative images should have `alt=""`, not missing alt.

### 3. Color Contrast (WCAG 1.4.3)

Check Tailwind classes against WCAG ratios:

- `text-gray-400` on white = FAIL (3.28:1, need 4.5:1)
- `text-gray-500` on white = PASS (4.64:1)
- `text-gray-300` on anything = likely FAIL
  Flag any `text-gray-300` or `text-gray-400` used for readable text (not decorative).

### 4. Keyboard Accessibility (WCAG 2.1.1)

```
grep -rn 'onClick' --include="*.jsx" | grep -v 'onKeyDown\|onKeyPress\|onKeyUp\|button\|<a\|<input\|<select\|role="button"'
```

Elements with onClick but no keyboard handler and no native keyboard role.

### 5. Form Labels (WCAG 1.3.1)

```
grep -rn '<input\|<select\|<textarea' --include="*.jsx" | grep -v 'type="hidden"' | grep -v 'aria-label\|aria-labelledby\|id=.*htmlFor'
```

### 6. Language (WCAG 3.1.1)

Verify `lang="nb"` on root HTML element.
Check that error messages are in Norwegian (nb-NO).

### 7. Focus Management (WCAG 2.4.3)

- Modals should trap focus
- Dialog close should return focus to trigger
- Search for `useRef` + `focus()` patterns in modal components

## Report Format

```
# WCAG 2.1 AA Audit — {date}

## Summary
| Category | Issues | Severity |
|----------|--------|----------|
| ARIA Labels | X | HIGH |
| Alt Text | X | HIGH |
| Color Contrast | X | MEDIUM |
| Keyboard | X | HIGH |
| Form Labels | X | HIGH |
| Language | X | LOW |
| Focus | X | MEDIUM |

## CRITICAL (Blocks release)
[issues that violate Norwegian accessibility law]

## HIGH
[issues that affect usability]

## MEDIUM
[issues that affect experience]

## Detailed Findings
[file:line for each issue with specific WCAG criterion]
```

## Norwegian-Specific Requirements

- All form validation errors must be in Norwegian
- Screen reader text must be in Norwegian
- Date pickers must use DD.MM.YYYY format
- Currency must display as "X kr" not "$X"
