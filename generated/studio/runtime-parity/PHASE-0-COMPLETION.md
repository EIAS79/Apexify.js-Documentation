# STUDIO-PARITY-0 — Completion Report

> Deterministic Phase-0 closure report generated from the pinned runtime inventory.

## Phase

- Program: `STUDIO-PARITY`
- Phase: `STUDIO-PARITY-0`
- Status: **COMPLETE**
- Runtime repository: `EIAS79/Apexify.js`
- Runtime SHA: `a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a`
- Runtime package version: `6.0.0`

## Inventory result

| Measure | Count |
|---|---:|
| Public/reachable runtime surfaces | 226 |
| Recursive runtime records | 69501 |
| Input records | 57347 |
| Output records | 12154 |
| Union-variant records | 67939 |
| Legacy capability rows reconciled | 187 |
| Legacy option paths retained as evidence | 17233 |

## Status inspection

| Status | Public surfaces | Recursive records |
|---|---:|---:|
| `FULL` | 0 | 0 |
| `PARTIAL` | 167 | 0 |
| `MISSING` | 39 | 167 |
| `RUNTIME-ONLY` | 16 | 952 |
| `CODE-ONLY` | 0 | 0 |
| `EXCLUDED-WITH-REASON` | 4 | 39 |
| `DEPRECATED-COMPAT` | 0 | 0 |
| `DRIFT` | 0 | 0 |
| `BLOCKED` | 0 | 96 |
| `UNKNOWN` | 0 | 68247 |

Phase 0 intentionally leaves `FULL=0`: classification or existence is not promoted to proven Studio parity. Later domain phases must earn `FULL` with UI/model/validation/preview/codegen/reconciliation/persistence/runtime-equivalence proof.

## Source evidence

| Evidence | Count |
|---|---:|
| Surfaces with multi-file implementation call graph | 126 |
| Surfaces reaching validator/assertion code | 123 |
| Surfaces with literal runtime default evidence | 121 |
| Surfaces reaching resource-limit assertions | 100 |
| Surfaces reaching structured Apexify errors | 125 |
| Recursive records with resolved literal runtime defaults | 6313 |
| Recursive records linked to runtime resource limits | 33366 |

Core source-mapping gate proves `createCanvas`, `createImage`, `createText`, and `measureText` reach their real validator modules through TypeScript symbol/call relationships rather than filename/text matching.

## Gaps and exclusions carried forward

- `MISSING` surfaces: **39**; recursive records: **167**.
- `PARTIAL` surfaces: **167**; recursive records: **0**.
- `RUNTIME-ONLY` surfaces: **16**; recursive records: **952**.
- `EXCLUDED-WITH-REASON` surfaces: **4**; recursive records: **39**.
- `DEPRECATED-COMPAT` surfaces: **0**; recursive records: **0**.
- `BLOCKED` recursive records: **96**; these are explicitly retained for later manual/domain audit rather than silently omitted.
- `UNKNOWN` recursive records: **68247**; this is expected at Phase 0 because leaf-level functional parity has not yet been proven.

## Drift and risks

- **ERROR — PARITY-RUNTIME-PIN-DRIFT:** Studio package dependency is pinned to db96446ef51ede70febb03892d86b599483a4302 while STUDIO-PARITY-0 audits runtime a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a.
- **WARNING — PARITY-SURFACE-RECONCILIATION:** Legacy/runtime surface audit: 187 exact, 0 alias, 0 name-drift, 0 removed, 0 legacy non-public, 39 runtime-only.
- **WARNING — PARITY-LEGACY-COMPLETE-NOT-PROOF:** Legacy capability/option classification is imported only as evidence. No old implemented/classified row is promoted to FULL.

- The Studio package dependency pin remains different from the audited runtime SHA; domain work must not silently use the older installed package as parity truth.
- AST source evidence proves reachable implementation/validator/default/limit/error relationships, but semantic interactions and exact behavior still require each domain phase.
- Recursive depth blocks are explicit and must be eliminated or justified before the final `STUDIO-PARITY-17` release gate.

## Verification

- `npm run studio:parity:scan` — deterministic baseline generation.
- `npm run studio:parity:check` — regenerated-artifact and invariant verification.
- `npm run studio:parity:test` — **10** declared Phase-0 regression tests.
- `npm run studio:parity:typecheck` — isolated strict TypeScript verification for parity tooling.
- CI gate: `Studio Parity 0 — Runtime Inventory` must pass generation, checks, tests, typecheck, and artifact publication.

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

## Generated artifacts

- `index.json`
- `public-surface.json`
- `runtime-source-map.json`
- `surface-reconciliation.json`
- `gap-summary.json`
- `domains/*.json`
- `BASELINE.md`
- `PHASE-0-COMPLETION.md`

## Next phase

Proceed to **STUDIO-PARITY-1 — createCanvas complete recursive parity**. Phase 1 must consume this baseline and may not replace missing evidence with legacy classification claims.
