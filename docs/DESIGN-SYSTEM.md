# ChiroClickEHR Design System

> Scandi-Clinical: Warm Nordic palette with clinical precision.

## Color Tokens

All colors are HSL triples (`H S% L%`) consumed via `hsl(var(--token))` or `hsl(var(--token) / opacity)`.

### Primitive (raw values in `tokens.css`)

| Token            | Light         | Dark          | Intent                |
| ---------------- | ------------- | ------------- | --------------------- |
| `--background`   | `40 20% 99%`  | `220 20% 8%`  | Page background       |
| `--foreground`   | `220 25% 12%` | `35 15% 92%`  | Default text          |
| `--card`         | `40 15% 98%`  | `220 18% 11%` | Card/panel background |
| `--popover`      | `0 0% 100%`   | `220 18% 11%` | Dropdowns, tooltips   |
| `--border`       | `35 15% 88%`  | `220 15% 20%` | Borders, dividers     |
| `--input`        | `35 15% 88%`  | `220 15% 20%` | Input borders         |
| `--ring`         | `174 62% 30%` | `174 55% 48%` | Focus rings           |
| `--shadow-color` | `35 20% 60%`  | `220 30% 5%`  | Shadow base           |

### Semantic (intent-based)

| Token           | Light         | Dark          | Use                            | Contrast   |
| --------------- | ------------- | ------------- | ------------------------------ | ---------- |
| `--primary`     | `174 62% 30%` | `174 55% 48%` | Buttons, links, clinical trust | 5.03:1 AA  |
| `--secondary`   | `35 15% 95%`  | `220 15% 18%` | Secondary buttons, subtle bg   | 11.97:1 AA |
| `--accent`      | `38 90% 55%`  | `38 85% 58%`  | Badges, highlights             | 6.26:1 AA  |
| `--muted`       | `35 12% 93%`  | `220 15% 18%` | Disabled, dividers             | 4.96:1 AA  |
| `--destructive` | `0 72% 48%`   | `0 65% 45%`   | Delete, errors                 | 5.24:1 AA  |

### Status Colors

| Token        | Light         | Dark          | Use              | Contrast  |
| ------------ | ------------- | ------------- | ---------------- | --------- |
| `--clinical` | `174 62% 30%` | `174 55% 48%` | Clinical actions | 5.03:1 AA |
| `--success`  | `152 60% 33%` | `152 55% 45%` | Confirmed, saved | 4.51:1 AA |
| `--warning`  | `38 90% 55%`  | `38 85% 58%`  | Needs attention  | 6.26:1 AA |
| `--info`     | `210 70% 45%` | `210 65% 55%` | Informational    | 4.88:1 AA |

Each status has a `-foreground` variant for text on that status background.

---

## Typography

### Font Stack

| Family      | Font                    | Fallback          | Use                |
| ----------- | ----------------------- | ----------------- | ------------------ |
| `font-sans` | Inter Variable          | System sans-serif | All UI text        |
| `font-mono` | JetBrains Mono Variable | System monospace  | Code, clinical IDs |

### Scale (fluid with `clamp()`)

| Token            | Range        | Tailwind Class | Use                    |
| ---------------- | ------------ | -------------- | ---------------------- |
| `--text-xs`      | 12px (fixed) | `text-xs`      | Badges, timestamps     |
| `--text-caption` | 12px (fixed) | `text-caption` | Form hints, metadata   |
| `--text-sm`      | 14px (fixed) | `text-sm`      | Table cells, labels    |
| `--text-body`    | 14-16px      | `text-body`    | Paragraphs, inputs     |
| `--text-lg`      | 16-18px      | `text-lg`      | Section subtitles      |
| `--text-heading` | 18-22px      | `text-heading` | Card titles, headers   |
| `--text-title`   | 20-26px      | `text-title`   | Page titles            |
| `--text-display` | 28-36px      | `text-display` | Dashboard hero numbers |

### Weight Tokens

| Token                    | Value | Tailwind        | Use                   |
| ------------------------ | ----- | --------------- | --------------------- |
| `--font-weight-normal`   | 400   | `font-normal`   | Body copy             |
| `--font-weight-medium`   | 500   | `font-medium`   | Labels, button text   |
| `--font-weight-semibold` | 600   | `font-semibold` | Card titles, headings |
| `--font-weight-bold`     | 700   | `font-bold`     | Dashboard metrics     |

### Line Heights

Follow Tailwind defaults: `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625).

---

## Spacing

| Token         | Value   | px  | Tailwind         | Use                          |
| ------------- | ------- | --- | ---------------- | ---------------------------- |
| `--space-xs`  | 0.25rem | 4   | `p-xs`, `gap-xs` | Icon-to-text gaps            |
| `--space-sm`  | 0.5rem  | 8   | `p-sm-token`     | Inner padding, compact lists |
| `--space-md`  | 1rem    | 16  | `p-md-token`     | Card padding, section gaps   |
| `--space-lg`  | 1.5rem  | 24  | `p-lg-token`     | Between sections             |
| `--space-xl`  | 2rem    | 32  | `p-xl-token`     | Page margins                 |
| `--space-2xl` | 3rem    | 48  | `p-2xl-token`    | Major section breaks         |

### Layout Conventions

| Context        | Pattern                                                | Example                   |
| -------------- | ------------------------------------------------------ | ------------------------- |
| Page container | `p-4 sm:p-6 max-w-7xl mx-auto`                         | Dashboard, Settings       |
| Stats grid     | `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4` | Dashboard                 |
| Section gap    | `space-y-6`                                            | Between major sections    |
| Card padding   | `p-5` or `p-6`                                         | StatCard, analytics cards |

---

## Border Radius

| Token                      | Value  | Tailwind       | Use              |
| -------------------------- | ------ | -------------- | ---------------- |
| `--radius-sm`              | 4px    | `rounded-sm`   | Badges, chips    |
| `--radius-md`              | 6px    | `rounded-md`   | Inputs, buttons  |
| `--radius` / `--radius-lg` | 8px    | `rounded-lg`   | Cards (default)  |
| `--radius-xl`              | 12px   | `rounded-xl`   | Dialogs, panels  |
| `--radius-2xl`             | 16px   | `rounded-2xl`  | Large containers |
| `--radius-full`            | 9999px | `rounded-full` | Avatars, pills   |

---

## Elevation (Shadows)

| Token         | Tailwind         | Use                       |
| ------------- | ---------------- | ------------------------- |
| `--shadow-sm` | `shadow-soft-sm` | Cards at rest             |
| `--shadow-md` | `shadow-soft-md` | Elevated cards, dropdowns |
| `--shadow-lg` | `shadow-soft-lg` | Modals, popovers          |
| (inline)      | `shadow-soft`    | Default subtle elevation  |

Dark mode shadows use higher opacity (0.08-0.20 vs 0.03-0.10) for visibility on dark surfaces.

---

## Focus & Transitions

### Focus Indicators

| Token                 | Value | Use                      |
| --------------------- | ----- | ------------------------ |
| `--focus-ring-width`  | 2px   | Ring thickness           |
| `--focus-ring-offset` | 2px   | Ring offset from element |

Pattern: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

### Transitions

| Token               | Value                          | Use                 |
| ------------------- | ------------------------------ | ------------------- |
| `--duration-fast`   | 100ms                          | Hover states        |
| `--duration-normal` | 200ms                          | Default transitions |
| `--duration-slow`   | 300ms                          | Complex animations  |
| `--ease-default`    | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing     |
| `--ease-in`         | `cubic-bezier(0.4, 0, 1, 1)`   | Enter transitions   |
| `--ease-out`        | `cubic-bezier(0, 0, 0.2, 1)`   | Exit transitions    |

---

## Components

### Buttons

| Variant     | Background       | Text                          | Border         | Use                   |
| ----------- | ---------------- | ----------------------------- | -------------- | --------------------- |
| Primary     | `bg-primary`     | `text-primary-foreground`     | none           | Main CTA              |
| Secondary   | `bg-secondary`   | `text-secondary-foreground`   | none           | Secondary actions     |
| Ghost       | transparent      | `text-foreground`             | none           | Toolbar actions       |
| Destructive | `bg-destructive` | `text-destructive-foreground` | none           | Delete, cancel        |
| Outline     | transparent      | `text-foreground`             | `border-input` | Alternative secondary |

Sizes: `sm` (h-8 px-3 text-sm), `md` (h-10 px-4), `lg` (h-12 px-6 text-lg).

### Cards

| Part      | Classes                                                                       |
| --------- | ----------------------------------------------------------------------------- |
| Container | `bg-card text-card-foreground rounded-xl border border-border shadow-soft-sm` |
| Header    | `p-6 pb-0`                                                                    |
| Body      | `p-6`                                                                         |
| Footer    | `p-6 pt-0`                                                                    |

### Forms

| Element     | Classes                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| Input       | `rounded-md border-input bg-background text-foreground focus:ring-ring` |
| Label       | `text-sm font-medium text-foreground`                                   |
| Helper text | `text-xs text-muted-foreground`                                         |
| Error       | `text-xs text-destructive`                                              |

### Status Badges

Each status has a unique icon (not color alone) for accessibility:

- CONFIRMED: CheckCircle (green)
- PENDING: Clock (amber)
- CANCELLED: XCircle (red)
- COMPLETED: CheckCheck (green)
- NO_SHOW: AlertTriangle (red)
- IN_PROGRESS: Loader2 (blue)

### Tables

| Part   | Classes                                                   |
| ------ | --------------------------------------------------------- |
| Header | `bg-muted/50 text-muted-foreground font-semibold text-sm` |
| Row    | `border-b border-border hover:bg-muted/30`                |
| Cell   | `p-3 text-sm`                                             |

---

## Dark Mode

Toggle: Add/remove `.dark` class on `<html>` element.

Every semantic color token has a light and dark variant. Components use Tailwind's `dark:` prefix for direct overrides.

### Token Mapping

| Category    | Light Warmth                      | Dark Approach              |
| ----------- | --------------------------------- | -------------------------- |
| Backgrounds | Warm off-white (amber undertones) | Deep charcoal (cool)       |
| Foregrounds | Deep charcoal                     | Warm off-white             |
| Primary     | Deeper teal (30% L)               | Brighter teal (48% L)      |
| Shadows     | Low opacity (0.03-0.10)           | Higher opacity (0.08-0.20) |
| Borders     | Warm gray (88% L)                 | Cool gray (20% L)          |

**Principle**: Dark mode inverts without losing warmth. Foreground text stays warm-tinted even on cool dark backgrounds.
