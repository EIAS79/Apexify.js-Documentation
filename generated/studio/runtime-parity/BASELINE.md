# STUDIO-PARITY-0 — Deep Runtime Inventory Baseline

> Generated deterministically from the pinned Apexify.js source checkout. Do not hand-edit.

## Runtime identity

- Runtime repository: `EIAS79/Apexify.js`
- Runtime commit: `a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a`
- Runtime version: `6.0.0`
- Studio dependency pin: `github:EIAS79/Apexify.js#db96446ef51ede70febb03892d86b599483a4302`
- Runtime pin matches installed package: **no**

## Inventory

| Measure | Count |
|---|---:|
| Public surfaces | 226 |
| Recursive input/output records | 69501 |
| Input records | 57347 |
| Output records | 12154 |
| Union variants | 67939 |
| Legacy capability rows imported as evidence | 187 |
| Legacy option paths | 17233 |

## Truthful status baseline

| Status | Public surfaces | Recursive records | Combined |
|---|---:|---:|---:|
| `FULL` | 0 | 0 | 0 |
| `PARTIAL` | 167 | 0 | 167 |
| `MISSING` | 39 | 167 | 206 |
| `RUNTIME-ONLY` | 16 | 952 | 968 |
| `CODE-ONLY` | 0 | 0 | 0 |
| `EXCLUDED-WITH-REASON` | 4 | 39 | 43 |
| `DEPRECATED-COMPAT` | 0 | 0 | 0 |
| `DRIFT` | 0 | 0 | 0 |
| `BLOCKED` | 0 | 96 | 96 |
| `UNKNOWN` | 0 | 68247 | 68247 |

**Important:** legacy “implemented/classified” evidence is intentionally not promoted to `FULL`.

## Runtime / Studio drift

- **ERROR — PARITY-RUNTIME-PIN-DRIFT:** Studio package dependency is pinned to db96446ef51ede70febb03892d86b599483a4302 while STUDIO-PARITY-0 audits runtime a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a.
- **WARNING — PARITY-SURFACE-RECONCILIATION:** Legacy/runtime surface audit: 187 exact, 0 alias, 0 name-drift, 0 removed, 0 legacy non-public, 39 runtime-only.
- **WARNING — PARITY-LEGACY-COMPLETE-NOT-PROOF:** Legacy capability/option classification is imported only as evidence. No old implemented/classified row is promoted to FULL.

## Public-surface reconciliation

| Measure | Count |
|---|---:|
| Legacy capability rows | 187 |
| Current runtime surfaces | 226 |
| Exact matches | 187 |
| Codegen aliases | 0 |
| Public-name drift / reachable aliases | 0 |
| Intentional hosted exclusions | 0 |
| Introspection / non-authorable legacy rows | 0 |
| Removed from current runtime | 0 |
| Legacy rows not on current public surface | 0 |
| Current runtime surfaces missing from legacy matrix | 39 |

Every non-exact row is retained in `surface-reconciliation.json` with an explicit reason and, where discoverable, a current runtime candidate.

## Domains

| Domain | Surfaces | Records | Status summary |
|---|---:|---:|---|
| `canvas` | 1 | 595 | PARTIAL=1, UNKNOWN=595 |
| `image` | 1 | 680 | PARTIAL=1, UNKNOWN=680 |
| `text` | 2 | 1861 | PARTIAL=2, UNKNOWN=1861 |
| `charts` | 3 | 10519 | PARTIAL=3, UNKNOWN=10423, BLOCKED=96 |
| `scene` | 19 | 30419 | PARTIAL=18, MISSING=2, UNKNOWN=30418 |
| `templates-components-assets` | 31 | 9550 | MISSING=18, PARTIAL=24, UNKNOWN=9539 |
| `paths-pixels-detect` | 15 | 1268 | MISSING=15, PARTIAL=12, UNKNOWN=1256 |
| `image-utils` | 16 | 123 | PARTIAL=15, RUNTIME-ONLY=3, UNKNOWN=121 |
| `gif-animation` | 3 | 3160 | PARTIAL=3, UNKNOWN=3160 |
| `audio` | 10 | 249 | MISSING=10, PARTIAL=6, RUNTIME-ONLY=6, EXCLUDED-WITH-REASON=4, UNKNOWN=233 |
| `video` | 99 | 9978 | PARTIAL=69, MISSING=134, RUNTIME-ONLY=943, UNKNOWN=8931 |
| `output` | 12 | 61 | MISSING=8, PARTIAL=6, EXCLUDED-WITH-REASON=39, RUNTIME-ONLY=2, UNKNOWN=18 |
| `batch-chain-plugins` | 12 | 1020 | PARTIAL=6, MISSING=2, RUNTIME-ONLY=14, UNKNOWN=1010 |
| `rendering` | 1 | 2 | PARTIAL=1, UNKNOWN=2 |
| `other` | 1 | 16 | MISSING=17 |

## Phase-0 gates

- [x] `deterministicSourcePin`
- [x] `runtimeSourceReadable`
- [x] `apexPainterFound`
- [x] `zeroSilentPublicSurfaceOmissions`
- [x] `deepRecursiveTypeResolution`
- [x] `surfaceReconciliationComplete`
- [x] `sourceMappingVerified`
- [x] `noBootstrapFullClaims`
- [x] `everyRecordHasStatus`
- [x] `baselineComplete`

## Interpretation

This baseline proves inventory coverage and exposes drift. It does **not** claim domain parity.
A record becomes `FULL` only in later STUDIO-PARITY phases after runtime semantics, controls, validation, preview, generated source, reverse reconciliation, persistence, and runtime-equivalence proof are all present.
