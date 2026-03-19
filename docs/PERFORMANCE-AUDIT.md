# ChiroClickEHR — Performance Audit

**Date:** 2026-03-07
**Build tool:** Vite 5 + Rollup
**Frontend framework:** React 18

## Summary

| Metric           | Before               | After  | Change    |
| ---------------- | -------------------- | ------ | --------- |
| Total dist/ size | ~16.5 MB             | 5.7 MB | **-65%**  |
| Source map files | 169                  | 0      | **-100%** |
| JS asset total   | ~3.7 MB (excl. maps) | 3.6 MB | -3%       |
| CSS total        | 173 KB               | 173 KB | No change |

### Changes Applied

1. **Disabled source maps** (`vite.config.js` `sourcemap: false`) — saved ~10.8 MB
2. **Removed three-vendor manual chunk** — Three.js (889 KB) now auto-chunked into `Spine3DViewer` (already lazy-loaded via `AnatomyViewer`)

## Chunk Analysis (>10 KB)

### JavaScript — Large Chunks

| Chunk               | Size   | Gzip   | Purpose                             |
| ------------------- | ------ | ------ | ----------------------------------- |
| Spine3DViewer       | 889 KB | 246 KB | Three.js + 3D spine viewer (lazy)   |
| chart-vendor        | 422 KB | 113 KB | Recharts (lazy via Dashboard/KPI)   |
| ExamPanelManager    | 332 KB | 80 KB  | 17 exam panels (lazy via encounter) |
| index (app shell)   | 297 KB | 90 KB  | Core app, router, layouts           |
| ui-vendor           | 163 KB | 53 KB  | React + React DOM + React Router    |
| ClinicalEncounter   | 118 KB | 35 KB  | Main encounter page (lazy)          |
| EasyAssessment      | 98 KB  | 27 KB  | Quick assessment (lazy)             |
| AnatomicalBodyChart | 62 KB  | 14 KB  | Body diagram (lazy)                 |
| PatientDetail       | 57 KB  | 13 KB  | Patient detail page (lazy)          |
| Kiosk               | 45 KB  | 12 KB  | Kiosk mode (lazy)                   |
| AnatomyViewer       | 45 KB  | 14 KB  | Anatomy UI wrapper (lazy)           |
| socket-vendor       | 41 KB  | 13 KB  | Socket.IO client                    |
| ExercisePanel       | 40 KB  | 9 KB   | Exercise prescription (lazy)        |
| Dashboard           | 29 KB  | 7 KB   | Dashboard page (lazy)               |

### CSS

| File      | Size   |
| --------- | ------ |
| index.css | 173 KB |

## Recommendations

### Quick Wins (Small Effort)

#### 1. Source maps disabled (DONE)

- **Impact:** -10.8 MB (-65% dist size)
- **Risk:** None for production. Enable per-build with `VITE_SOURCEMAP=true` if debugging needed.

#### 2. Three.js manual chunk removed (DONE)

- **Impact:** Three.js now only loads when user opens 3D spine viewer
- **Before:** Named `three-vendor` chunk was listed in manifest, potentially prefetched
- **After:** Auto-chunked into `Spine3DViewer`, loaded on demand only

### Medium Effort

#### 3. Lazy-load ExamPanelManager sub-panels

- **Current:** 17 exam panels bundled into one 332 KB chunk
- **Proposal:** `React.lazy()` individual panels, keep top 3 eager (ExaminationProtocol, BodyDiagram, VisualROMSelector)
- **Expected impact:** -225 KB from initial encounter load
- **Risk:** Slight delay when expanding an exam section for the first time

#### 4. Socket.IO conditional import for desktop

- **Current:** 41 KB `socket-vendor` chunk loaded by LiveAppointmentBoard and usePatientPresence
- **Desktop is single-user** — real-time collaboration is unnecessary
- **Proposal:** Skip WebSocket initialization when `DESKTOP_MODE` detected
- **Expected impact:** -41 KB from app shell
- **Risk:** Low — desktop mode doesn't benefit from WebSocket

### Deferred (Large Effort)

#### 5. Tailwind CSS safelist reduction

- **Current:** 16 colors x 10 shades x 5 variants = 800 force-kept classes
- **Analysis:** All 16 colors are used in dynamic `bg-${color}-50` patterns across CRM, Letters, ExamPanelManager, SpineDiagram, SOAPTemplate, etc.
- **Root cause:** Components use string interpolation instead of the `colorClasses.js` utility
- **Proposal:** Migrate all dynamic color patterns to use `colorClasses.js`, then remove safelist
- **Expected impact:** -40-60 KB CSS
- **Risk:** High — touching 20+ component files, requires thorough visual testing
- **Verdict:** Not worth the risk for v1.0 release. Revisit in v1.1.

#### 6. Service worker consolidation (NOT needed)

- **Finding:** `sw.js` and `service-worker.js` serve different purposes:
  - `sw.js` (646 lines) — clinic staff PWA, registered by `usePWA.js`
  - `service-worker.js` (590 lines) — patient portal offline exercises, registered by `useOffline.js`
- **Both are needed.** They are not duplicates.
- For desktop mode (Electron), consider disabling both SWs since Electron has its own caching.

## Initial Page Load Budget

For a typical desktop user opening the app:

| Resource          | Size (gzip) |
| ----------------- | ----------- |
| HTML              | ~1 KB       |
| CSS               | ~45 KB      |
| ui-vendor (React) | 53 KB       |
| index (app shell) | 90 KB       |
| Dashboard (lazy)  | 7 KB        |
| **Total initial** | **~196 KB** |

Three.js (246 KB gzip) only loads when user navigates to anatomy viewer. Chart vendor (113 KB gzip) only loads when Dashboard/KPI renders charts. This is a healthy initial load for a desktop Electron app.

## Build Command

```bash
cd frontend && npm run build
# Output: dist/ (~5.7 MB, 169 asset files, 0 source maps)
```
