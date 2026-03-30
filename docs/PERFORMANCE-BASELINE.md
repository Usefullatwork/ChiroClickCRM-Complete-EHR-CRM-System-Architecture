# Performance Baseline — Sprint 7D

**Date**: 2026-03-30
**Branch**: sprint7/performance (from sprint7/security-hardening)
**Build tool**: Vite 5.0.8

---

## Frontend Bundle

| Metric          | Value  |
| --------------- | ------ |
| Total dist size | 6.3 MB |
| Total JS chunks | 173    |
| Chunks >500 KB  | 2      |
| Chunks >300 KB  | 3      |

### Largest Chunks (before optimization)

| Chunk             | Size      | Gzip      | Status                     |
| ----------------- | --------- | --------- | -------------------------- |
| Spine3DViewer     | 888.62 KB | 245.67 KB | Lazy-loaded (Three.js)     |
| index (main)      | 519.78 KB | 151.90 KB | Needs splitting            |
| chart-vendor      | 422.25 KB | 112.63 KB | Already split (recharts)   |
| ExamPanelManager  | 332.21 KB | 80.51 KB  | Large component            |
| ui-vendor         | 162.93 KB | 53.21 KB  | Already split (react core) |
| ClinicalEncounter | 123.25 KB | 36.89 KB  | Lazy-loaded page           |

### Current manualChunks Config

```js
manualChunks: {
  'socket-vendor': ['socket.io-client'],     // 41.55 KB
  'chart-vendor': ['recharts'],               // 422.25 KB
  'ui-vendor': ['react', 'react-dom', 'react-router-dom'], // 162.93 KB
}
```

---

## Backend — Database Query Patterns

| Metric                              | Count |
| ----------------------------------- | ----- |
| SELECT \* in services (excl. COUNT) | 39    |
| RETURNING \* in services            | 140   |
| RETURNING \* in all src             | 149   |
| N+1 loop patterns detected          | 0     |

### SELECT \* Distribution

| Service Directory | Count |
| ----------------- | ----- |
| clinical/         | 12    |
| communication/    | 4     |
| crm/              | 10    |
| practice/         | 7+    |

---

## Targets

| Metric         | Before | Target                 |
| -------------- | ------ | ---------------------- |
| Total dist     | 6.3 MB | <5 MB                  |
| Chunks >500 KB | 2      | 1 (Spine3D acceptable) |
| SELECT \*      | 39     | 0                      |
| RETURNING \*   | 140    | Explicit columns only  |
| Cache headers  | None   | Static + API caching   |
