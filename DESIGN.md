# ChiroClickEHR Design System: Scandi-Clinical

**Philosophy**: Warm Nordic palette with clinical precision. Surfaces lean warm (amber undertones) for approachability; the primary teal signals clinical trust. Dark mode inverts without losing warmth.

**Brand**: ChiroClickEHR (Norwegian-compliant EHR/CRM, Electron + PGlite, React 18 + Vite + Tailwind).

**Token source**: `frontend/src/styles/tokens.css` -- all values are HSL triples consumed by Tailwind via `hsl(var(--token))` / `hsl(var(--token) / opacity)`.

---

## Color Tokens

### Base

| Token          | Light         | Dark         | Intent                                       |
| -------------- | ------------- | ------------ | -------------------------------------------- |
| `--background` | `40 20% 99%`  | `220 20% 8%` | Page background (warm white / deep charcoal) |
| `--foreground` | `220 25% 12%` | `35 15% 92%` | Default text                                 |

### Surfaces

| Token                  | Light         | Dark          | Intent                       |
| ---------------------- | ------------- | ------------- | ---------------------------- |
| `--card`               | `40 15% 98%`  | `220 18% 11%` | Card/panel background        |
| `--card-foreground`    | `220 25% 12%` | `35 15% 92%`  | Text on cards                |
| `--popover`            | `0 0% 100%`   | `220 18% 11%` | Dropdowns, tooltips, dialogs |
| `--popover-foreground` | `220 25% 12%` | `35 15% 92%`  | Text on popovers             |

### Primary (Teal -- clinical trust)

| Token                  | Light         | Dark          | Intent                      |
| ---------------------- | ------------- | ------------- | --------------------------- |
| `--primary`            | `174 62% 38%` | `174 55% 48%` | Buttons, links, focus rings |
| `--primary-foreground` | `0 0% 100%`   | `220 20% 8%`  | Text on primary backgrounds |

### Secondary (Warm neutral)

| Token                    | Light         | Dark          | Intent                       |
| ------------------------ | ------------- | ------------- | ---------------------------- |
| `--secondary`            | `35 15% 95%`  | `220 15% 18%` | Secondary buttons, subtle bg |
| `--secondary-foreground` | `220 20% 20%` | `35 12% 85%`  | Text on secondary            |

### Muted

| Token                | Light         | Dark          | Intent                         |
| -------------------- | ------------- | ------------- | ------------------------------ |
| `--muted`            | `35 12% 93%`  | `220 15% 18%` | Disabled backgrounds, dividers |
| `--muted-foreground` | `220 10% 45%` | `35 10% 60%`  | Placeholder, helper text       |

### Accent (Amber -- energy, attention)

| Token                 | Light        | Dark         | Intent                       |
| --------------------- | ------------ | ------------ | ---------------------------- |
| `--accent`            | `38 90% 55%` | `38 85% 58%` | Badges, highlights, warnings |
| `--accent-foreground` | `25 80% 18%` | `220 20% 8%` | Text on accent               |

### Destructive

| Token                      | Light       | Dark         | Intent                 |
| -------------------------- | ----------- | ------------ | ---------------------- |
| `--destructive`            | `0 72% 55%` | `0 65% 45%`  | Delete, cancel, errors |
| `--destructive-foreground` | `0 0% 100%` | `35 15% 92%` | Text on destructive    |

### Semantic Status

| Token                  | Light         | Dark          | Intent            |
| ---------------------- | ------------- | ------------- | ----------------- |
| `--clinical`           | `174 62% 38%` | `174 55% 48%` | Clinical actions  |
| `--success`            | `152 60% 40%` | `152 55% 45%` | Confirmed, saved  |
| `--warning`            | `38 90% 55%`  | `38 85% 58%`  | Needs attention   |
| `--info`               | `210 70% 52%` | `210 65% 55%` | Informational     |
| All have `-foreground` | white or dark | dark charcoal | Text on status bg |

### Chrome (Borders, inputs, focus rings)

| Token            | Light          | Dark          | Intent                         |
| ---------------- | -------------- | ------------- | ------------------------------ |
| `--border`       | `35 15% 88%`   | `220 15% 20%` | Card borders, dividers         |
| `--input`        | `35 15% 88%`   | `220 15% 20%` | Form input borders             |
| `--ring`         | `174 62% 38%`  | `174 55% 48%` | Focus ring (matches primary)   |
| `--shadow-color` | `35 20% 60%`   | `220 30% 5%`  | Used via `shadow-soft-*` utils |
| `--radius`       | `0.5rem` (8px) | same          | Base border-radius             |

---

## Typography Scale

Defined as CSS custom properties in `tokens.css`. Uses Tailwind default font stack (`font-sans`).

| Token            | Value    | px  | Use                                  |
| ---------------- | -------- | --- | ------------------------------------ |
| `--text-xs`      | 0.75rem  | 12  | Badges, captions, timestamps         |
| `--text-caption` | 0.75rem  | 12  | Alias for xs -- form hints, metadata |
| `--text-sm`      | 0.875rem | 14  | Body small, table cells, labels      |
| `--text-body`    | 1rem     | 16  | Default paragraph, form inputs       |
| `--text-lg`      | 1.125rem | 18  | Section subtitles                    |
| `--text-heading` | 1.25rem  | 20  | Card titles, section headers         |
| `--text-title`   | 1.5rem   | 24  | Page titles                          |
| `--text-display` | 2rem     | 32  | Dashboard hero numbers               |

In practice, most components use Tailwind classes (`text-sm`, `text-2xl`, etc.) rather than these tokens directly. The tokens exist for consistency documentation and non-Tailwind contexts.

---

## Spacing & Layout

### Spacing Scale (tokens.css)

| Token         | Value   | px  | Use                          |
| ------------- | ------- | --- | ---------------------------- |
| `--space-xs`  | 0.25rem | 4   | Tight gaps (icon-to-text)    |
| `--space-sm`  | 0.5rem  | 8   | Inner padding, compact lists |
| `--space-md`  | 1rem    | 16  | Card padding, section gaps   |
| `--space-lg`  | 1.5rem  | 24  | Between sections             |
| `--space-xl`  | 2rem    | 32  | Page margins                 |
| `--space-2xl` | 3rem    | 48  | Major section breaks         |

### Layout Conventions

- **Page container**: `p-6 max-w-7xl mx-auto` (see `Settings.jsx`)
- **Card padding**: `p-5` (StatCard) or `p-6` (analytics StatCard)
- **Grid gaps**: `gap-4` between cards, `gap-6` between tab items
- **Section spacing**: `mb-6` between page header and content

---

## Reusable Components

All live in `frontend/src/components/ui/` unless noted.

### 1. StatCard

**Files**: `frontend/src/components/ui/StatCard.jsx` (dashboard), `frontend/src/components/analytics/StatCard.jsx` (analytics pages)

**Props (ui version)**:
| Prop | Type | Default | Description |
|-------------|-------------------|---------------|------------------------------------|
| `label` | string | required | Metric name |
| `value` | string/number | required | Displayed value |
| `icon` | Lucide component | -- | Icon in top-right box |
| `bgClass` | string | `'bg-teal-50'`| Icon container background |
| `iconClass` | string | `'text-teal-600'`| Icon color |
| `trend` | number | -- | Percentage change (positive/negative/zero) |
| `trendLabel`| string | -- | Label next to trend arrow |
| `sparkline` | ReactNode | -- | Slot for inline chart |
| `onClick` | function | -- | Makes card a clickable button |
| `urgent` | boolean | `false` | Red border + ping dot when `value > 0` |
| `className` | string | `''` | Extra classes |

**When to use**: KPI grids on Dashboard, patient overview.
**When NOT to use**: For detailed data (use a table). For status indicators (use StatusBadge).

**Note**: The analytics version (`analytics/StatCard.jsx`) adds `loading`, `subtitle`, `changeLabel` props and a built-in loading skeleton. Also exports `StatCardGrid` and `MiniStatCard`.

### 2. StatusBadge

**File**: `frontend/src/components/ui/StatusBadge.jsx`

**Props**:
| Prop | Type | Default | Description |
|------------|---------|---------|------------------------------------------|
| `status` | string | required| Key into STATUS_CONFIG (see below) |
| `label` | string | -- | Override display text (defaults to status)|
| `size` | `'xs'`/`'sm'` | `'sm'` | Badge size |
| `showIcon` | boolean | `true` | Show leading icon |
| `className`| string | `''` | Extra classes |

**Built-in statuses**: `CONFIRMED`, `PENDING`, `CANCELLED`, `COMPLETED`, `NO_SHOW`, `IN_PROGRESS`, `active`, `overdue`, `at_risk`, `inactive`, `new`. Unknown statuses get a gray fallback with `HelpCircle` icon.

**Accessibility**: Uses `role="status"` and `aria-label`. Every status has a unique icon (not color-only) for colorblind users.

**When to use**: Appointment status, patient lifecycle status.
**When NOT to use**: For counts or metrics (use StatCard). For inline labels without semantic meaning.

### 3. EmptyState

**File**: `frontend/src/components/ui/EmptyState.jsx`

**Props**:
| Prop | Type | Default | Description |
|----------------|-------------------|----------|---------------------------------|
| `title` | string | required | Heading text |
| `description` | string | -- | Explanatory subtitle |
| `icon` | Lucide component | `Inbox` | Icon in rounded box |
| `illustration` | ReactNode | -- | Custom SVG (overrides icon) |
| `action` | ReactNode | -- | CTA slot (button or link) |
| `className` | string | `''` | Extra classes |

**When to use**: Any list/table that can be empty. Always include an `action` button to guide the user ("Legg til pasient", "Opprett avtale").
**When NOT to use**: For loading states (use Skeleton). For error states (use toast or inline error).

### 4. LoadingButton

**File**: `frontend/src/components/ui/LoadingButton.jsx`

**Props**:
| Prop | Type | Default | Description |
|---------------|-------------------|-------------|---------------------------------|
| `loading` | boolean | `false` | Show Loader2 spinner + disable |
| `loadingText` | string | -- | Replaces children while loading |
| `variant` | `'primary'`/`'secondary'`/`'destructive'`/`'ghost'` | `'primary'` | Color variant |
| `size` | `'sm'`/`'md'`/`'lg'` | `'md'` | Height and padding |
| `icon` | Lucide component | -- | Left icon |
| `disabled` | boolean | -- | Disabled (also set by loading) |
| `children` | ReactNode | required | Button label |

**Variants**: primary (teal-600), secondary (gray-100), destructive (red-600), ghost (transparent).

**When to use**: Any form submit or async action button.
**When NOT to use**: Navigation links (use `<a>` or router Link). Non-interactive labels.

### 5. ConfirmDialog

**File**: `frontend/src/components/ui/ConfirmDialog.jsx`

**Two usage patterns**:

1. **Declarative**: `<ConfirmDialog open onConfirm={fn} onCancel={fn} title="..." />`
2. **Imperative (preferred)**: `const confirm = useConfirm(); const ok = await confirm({ title, description });`

**Props (declarative)**:
| Prop | Type | Default | Description |
|---------------|----------|-----------------|------------------------------|
| `open` | boolean | required | Visibility toggle |
| `onConfirm` | function | required | Called on confirm |
| `onCancel` | function | required | Called on cancel or backdrop |
| `title` | string | `t('areYouSure')`| Dialog heading |
| `description` | string | `''` | Explanatory text |
| `confirmText` | string | `t('confirm')` | Confirm button label |
| `cancelText` | string | `t('cancel')` | Cancel button label |
| `variant` | `'destructive'`/`'warning'` | `'destructive'` | Icon and button color |
| `loading` | boolean | `false` | Spinner on confirm button |

**When to use**: Deletions, irreversible actions, data loss scenarios.
**When NOT to use**: Informational confirmations (use toast). Multi-step wizards.

### 6. ConfirmProvider + useConfirm

**File**: `frontend/src/components/ui/ConfirmDialog.jsx` (same file, named exports)

**Setup**: Wrap app root in `<ConfirmProvider>` (already done in `frontend/src/main.jsx`).

**Usage**:

```jsx
const confirm = useConfirm();
const ok = await confirm({
  title: "Slett pasient?",
  description: "Denne handlingen kan ikke angres.",
  variant: "destructive",
});
if (ok) {
  /* delete */
}
```

Throws if used outside the provider.

### 7. Skeleton

**File**: `frontend/src/components/ui/Skeleton.jsx`

**Exports**: `Skeleton` (base), `CardSkeleton`, `StatsGridSkeleton`, `TableSkeleton`, `TableRowSkeleton`, `ListSkeleton`, `ListItemSkeleton`, `AppointmentItemSkeleton`, `AppointmentsListSkeleton`, `PatientRowSkeleton`, `PatientsTableSkeleton`, `QuickActionSkeleton`, `QuickActionsGridSkeleton`.

**Base Skeleton props**: `className` (string) -- set dimensions via Tailwind (`h-4 w-24`).

**When to use**: Initial page loads, lazy-loaded tab content, data fetching states. Pick the domain-specific variant (e.g., `PatientsTableSkeleton`) when available.
**When NOT to use**: Button loading states (use LoadingButton). Short operations under 300ms (skip skeleton, show nothing).

---

## Settings Tab Pattern

Reference: `frontend/src/pages/Settings.jsx`

### How to add a new settings tab

1. **Lazy import** the component:

   ```jsx
   const MyNewTab = lazy(() => import("../components/settings/MyNewTab"));
   ```

2. **Add tab object** to the `tabs` array (icon from `lucide-react`):

   ```jsx
   {
     id: 'mytab',
     icon: SomeLucideIcon,
     label: t('myTabLabel'),
     activeClass: 'border-teal-600 text-teal-600',
   }
   ```

3. **Add render block** inside the `<Suspense>`:

   ```jsx
   {
     activeTab === "mytab" && <MyNewTab />;
   }
   ```

4. **Add i18n key** for the label in the `settings` namespace.

The `<Suspense fallback={<TabLoading />}>` wraps all tab content. `TabLoading` renders a centered `Loader2` spinner. Each tab component is code-split into its own Vite chunk.

---

## Norwegian UI Standards

| Rule                | Standard                                                         |
| ------------------- | ---------------------------------------------------------------- |
| Language            | Norwegian Bokmal (nb-NO), informal: du/deg                       |
| Date format         | DD.MM.YYYY (`02.03.2026`)                                        |
| Time format         | HH:MM 24-hour (`14:30`)                                          |
| Currency            | NOK, space as thousands separator, comma decimal (`1 234,50 kr`) |
| Phone               | +47 XX XX XX XX                                                  |
| Form labels         | Norwegian, visible at all times                                  |
| Error messages      | Explain the problem AND the fix, in Norwegian                    |
| Medical terminology | Norwegian first, Latin/English in parentheses                    |
| ICPC-2 descriptions | Helsedirektoratet official Norwegian translations                |
| Code comments       | English                                                          |
| Variable names      | English (camelCase)                                              |

---

## Interaction States

| State   | Pattern                                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------- |
| Loading | `Skeleton` variants for initial loads; `Loader2` spinner for tab switches (`TabLoading`); `LoadingButton` for form submits |
| Empty   | `EmptyState` component -- always include a title, description, and primary action button                                   |
| Error   | `toast.error(message)` for transient errors; inline `<p className="text-sm text-red-600">` for form validation             |
| Success | `toast.success(message)` for transient confirmations                                                                       |
| Confirm | `useConfirm()` hook for destructive actions; `ConfirmDialog` for declarative cases                                         |

Toast utility: `frontend/src/utils/toast.js` (custom wrapper).

---

## Accessibility

WCAG 2.1 AA is required by Norwegian law (Likestillings- og diskrimineringsloven).

| Requirement              | Implementation                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Visible labels           | All form inputs have `<label>` elements in Norwegian                                           |
| Keyboard accessible      | All interactive elements focusable, `focus-visible:ring-2 ring-ring`                           |
| Contrast ratio           | 4.5:1 normal text, 3:1 large text (enforced by token choices)                                  |
| Skip navigation          | Present in app shell                                                                           |
| Color-independent status | `StatusBadge` uses unique icon per status (not color alone)                                    |
| Dialog accessibility     | `ConfirmDialog` uses `role="alertdialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby` |
| Icon-only buttons        | Must have `aria-label`; decorative icons get `aria-hidden="true"`                              |
| Lang attribute           | `lang="nb"` on HTML root                                                                       |
