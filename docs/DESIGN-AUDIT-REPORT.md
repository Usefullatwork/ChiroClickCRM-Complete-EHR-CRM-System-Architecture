# Design Audit Report — Sprint 7A

> Generated 2026-03-30. Covers typography, color, tokens, and UX recommendations.

## Executive Summary

| Category         | Before             | After Sprint 7A                        |
| ---------------- | ------------------ | -------------------------------------- |
| Font             | System stack       | Inter Variable + JetBrains Mono        |
| Type scale       | Fixed rem          | Fluid `clamp()` (body through display) |
| WCAG contrast    | 5 failures (light) | 0 failures (20/20 pass AA)             |
| Token coverage   | Colors + spacing   | + radius, shadow, focus, transition    |
| Dark mode tokens | Colors only        | Colors + shadows (full parity)         |
| Design context   | None               | `.impeccable.md` (110 lines)           |

---

## 1. Typography Audit

### Font Selection: Inter Variable

**Why Inter?**

- Designed for computer screens at small sizes — ideal for data-dense EHR interfaces
- Variable font (single file, any weight) — 200KB vs 400KB+ for multiple static files
- Supports all Norwegian characters natively (aaoAaO + accented Latin)
- OpenType features enabled: `cv01` (alt a), `cv02` (alt G) for clinical readability
- Widely validated in healthcare and fintech UIs

**Pairing**: JetBrains Mono for code/clinical data display — designed for code readability, clear distinction between 0/O/o, 1/l/I.

### Fluid Type Scale

| Token            | Min (mobile) | Max (desktop) | Use                    |
| ---------------- | ------------ | ------------- | ---------------------- |
| `--text-xs`      | 12px         | 12px (fixed)  | Badges, timestamps     |
| `--text-sm`      | 14px         | 14px (fixed)  | Table cells, labels    |
| `--text-body`    | 14px         | 16px          | Default paragraph      |
| `--text-lg`      | 16px         | 18px          | Section subtitles      |
| `--text-heading` | 18px         | 22px          | Card titles            |
| `--text-title`   | 20px         | 26px          | Page titles            |
| `--text-display` | 28px         | 36px          | Dashboard hero numbers |

Small sizes (xs, sm) are fixed — fluid scaling below 14px hurts readability.

---

## 2. Color Contrast Audit (WCAG 2.1 AA)

### Light Mode — All Fixed

| Pair                            | Before        | After         | Ratio  |
| ------------------------------- | ------------- | ------------- | ------ |
| primary-fg on primary           | `174 62% 38%` | `174 62% 30%` | 5.03:1 |
| destructive-fg on destructive   | `0 72% 55%`   | `0 72% 48%`   | 5.24:1 |
| success-fg on success           | `152 60% 40%` | `152 60% 33%` | 4.51:1 |
| info-fg on info                 | `210 70% 52%` | `210 70% 45%` | 4.88:1 |
| clinical (aligned with primary) | `174 62% 38%` | `174 62% 30%` | 5.03:1 |

### Dark Mode — All Pass (no changes needed)

All dark mode pairs were already >= 5.0:1. The lighter foreground on dark backgrounds creates naturally strong contrast.

### Full Results (20/20 PASS)

```
LIGHT MODE
foreground on background         16.72:1  PASS
primary-fg on primary             5.03:1  PASS
muted-fg on background            4.96:1  PASS
secondary-fg on secondary        11.97:1  PASS
destructive-fg on destructive     5.24:1  PASS
success-fg on success             4.51:1  PASS
warning-fg on warning             6.26:1  PASS
info-fg on info                   4.88:1  PASS
accent-fg on accent               6.26:1  PASS
card-fg on card                  16.37:1  PASS
popover-fg on popover            17.06:1  PASS

DARK MODE
foreground on background         15.65:1  PASS
primary-fg on primary             8.09:1  PASS
muted-fg on background            6.75:1  PASS
secondary-fg on secondary        10.07:1  PASS
destructive-fg on destructive     5.04:1  PASS
success-fg on success             6.88:1  PASS
warning-fg on warning             9.42:1  PASS
info-fg on info                   5.29:1  PASS
card-fg on card                  14.62:1  PASS
```

---

## 3. Token Coverage Audit

### Tokens Added in Sprint 7A

| Category     | Tokens                                                 | Status  |
| ------------ | ------------------------------------------------------ | ------- |
| Radius       | `--radius-sm` through `--radius-full` (6 values)       | New     |
| Shadows      | `--shadow-sm/md/lg` (light + dark variants)            | New     |
| Focus        | `--focus-ring-width`, `--focus-ring-offset`            | New     |
| Transitions  | `--duration-fast/normal/slow`, `--ease-default/in/out` | New     |
| Font weights | `--font-weight-normal/medium/semibold/bold`            | New     |
| Typography   | Fluid `clamp()` scale for body through display         | Updated |

### Token Dark Mode Parity

| Token Category     | Light  | Dark   | Parity                 |
| ------------------ | ------ | ------ | ---------------------- |
| Colors (14 pairs)  | 14     | 14     | 100%                   |
| Shadows (3 levels) | 3      | 3      | 100%                   |
| Typography         | Shared | Shared | N/A (mode-independent) |
| Spacing            | Shared | Shared | N/A (mode-independent) |
| Radius             | Shared | Shared | N/A (mode-independent) |

---

## 4. Hardcoded Color Inventory

### Inline Styles (non-token hex/rgb values)

| Location                    | Count   | Type                  | Recommendation                                                                       |
| --------------------------- | ------- | --------------------- | ------------------------------------------------------------------------------------ |
| Chart components (Recharts) | ~30 hex | Visualization arrays  | Keep — Recharts requires hex arrays. Create `chartColors` token set in future sprint |
| Anatomy/Body diagrams       | ~12 hex | Pain intensity scale  | Keep — medical standard colors for pain visualization                                |
| Print preview/documents     | ~8      | Print-specific fonts  | Keep — intentional for print output fidelity                                         |
| ClinicalProtocols styles.js | ~5      | CSS-in-JS backgrounds | Migrate to tokens (future sprint)                                                    |

### Tailwind Utility Classes (gray/slate)

~1,900 occurrences of `bg-gray-*`, `text-gray-*`, `border-slate-*` across 69 files. These are Tailwind design system classes (not hardcoded values) and work correctly. Full migration to semantic tokens (`bg-muted`, `text-muted-foreground`) is recommended for a future sprint but not critical — they already respond to dark mode via `dark:` prefix.

---

## 5. UX Guideline Check (5 Key Pages)

### Dashboard (`/`)

- Stats grid uses `StatCard` component consistently
- Heading hierarchy: h1 (page title) → h2 (section headers) → content
- Spacing: `p-4 sm:p-6 max-w-7xl mx-auto` — consistent with conventions
- Recommendation: Consider using `--text-display` token for hero metrics

### Patient Detail (`/patients/:id`)

- Complex page with multiple tabs and data sections
- Good use of `StatusBadge` for lifecycle status
- Tab navigation is keyboard-accessible (Radix Tabs)
- Recommendation: Audit tab content for heading level consistency

### Clinical Encounter (`/encounters/:id`)

- SOAP note structure is clear and well-organized
- Form inputs have visible Norwegian labels
- Recommendation: Ensure all form error messages use destructive token color

### Settings (`/settings`)

- Tab pattern well-documented in DESIGN.md
- Lazy-loaded tabs with Suspense fallback
- Recommendation: Verify all settings labels use `--text-sm` consistently

### CRM Leads (`/crm/leads`)

- Table layout with filtering and sorting
- StatusBadge integration for lead status
- Recommendation: Ensure table headers use `font-semibold` consistently

---

## 6. Recommendations for Future Sprints

### Sprint 7B (Tuesday — Component hardening)

1. Migrate remaining `bg-white` → `bg-card` or `bg-background` in UI components
2. Migrate `border-gray-200` → `border-border` in Card, Modal, Table
3. Create `chartColors` token set for Recharts components

### Sprint 7C+ (Later in week)

4. Heading hierarchy audit across all 346 components (check for skipped levels)
5. Focus indicator audit — ensure all interactive elements have visible focus rings
6. Reduced motion support (`prefers-reduced-motion` media query)
7. Colorblind mode validation for clinical status colors
