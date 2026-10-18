# WS-00 — Execution kickoff / current-pin baseline

> Status: IN PROGRESS (2026-10-18). This is a source/repository audit, not a completed renderer or parity audit.
> Docs main audited at faf79499e7c7244003fe733c92d3d586740d8698. Latest Apexify.js main at the audit was cbeea053c2a973d4e867f8ca96e79546060dd62d.
> No production Studio or Apexify.js runtime code was modified by this audit.

## Grounded findings

| Source | Actual pinned identity | Consequence |
|---|---|---|
| Docs package.json + package-lock.json root | github:EIAS79/Apexify.js#379a5248f09ed39c1b1734fe104b6bd73a77857f | This exact full-runtime dependency is the WS-00 starting baseline, not moving engine main |
| Apexify.js package.json at that SHA | Package version 6.0.0 | Record the SHA, not only the version label |
| Studio isolatedNodeExecutor.ts | APEXIFY_PIN = 379a5248f09ed39c1b1734fe104b6bd73a77857f | Static executor pin agrees with declared package |
| @apexify/web installer | 5e0f5534762af7d9d358e83d774a38f931f720e0 | Separate immutable browser-runtime snapshot; browser/full-runtime feature differences require proof |
| Parity scanner runtime-source.json | a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a | Existing scanner intentionally targets a different runtime revision |
| Historical parity gap-summary.json | Audits a62a68d…; its installedPinCommit was db96446… | Old 226 public surfaces / 69,501 recursive records / 0 FULL at historical baseline are NOT current-parity numbers |
| Apexify.js main | cbeea053c2a973d4e867f8ca96e79546060dd62d | Do not silently upgrade the application to latest HEAD |

**P0 finding:** full-runtime package declarations and executor agree at 379a5248… but the legacy parity scanner/report are historical. The next current-pin recursive scan MUST be versioned separately and executed with a clean checkout and installed declarations. Neither a version number nor a prior generated capability matrix proves current feature parity.

## Open Studio PR risk matrix

All these pull requests were open at audit time. Ahead/behind numbers are comparisons against current main, NOT definitive merge conflicts or proof another background agent is running.

| PR | Title / scope | Ahead / behind | Changed files | Handling |
|---|---|---|---|---|
| #142 | Font style / curved text; executor/package pins | 22 / 43 | 22 | Compare engine pin and security changes before selective reuse |
| #140 | Text/measure parity v2, Visual compiler/model | 1 / 50 | 18 | Compare implementation overlap with #131 and new unified compiler |
| #131 (draft) | Earlier text parity implementation | 10 / 101 | 9 | Preserve, select only proven improvements if needed |
| #59 | Code session assets / chart routing | 1 / 808 | 9 | Highly divergent historical branch; inspect already-landed equivalents |

Source links: https://github.com/EIAS79/Apexify.js-Documentation/pull/142,
https://github.com/EIAS79/Apexify.js-Documentation/pull/140,
https://github.com/EIAS79/Apexify.js-Documentation/pull/131,
https://github.com/EIAS79/Apexify.js-Documentation/pull/59

No PR was reset, closed, merged or force-pushed.

## Reproducible read-only guard

    node scripts/studio/workspace/ws00-pin-audit.mjs
    node --test scripts/studio/workspace/ws00-pin-audit.test.mjs

The default checker verifies declared package, lockfile, executor and separate web snapshot identities; reports the historical parity inputs as stale instead of promoting their totals; does not change generated files. To REQUIRE a current parity scan, run:

    node scripts/studio/workspace/ws00-pin-audit.mjs --require-current-parity

That option is expected to FAIL until the new current-pin scan is actually generated and verified. Do not make it green by falsifying report commit metadata.

## WS-00 remaining execution (ordered)

1. Clean-install pinned full runtime, verify installed metadata/declaration artifacts actually resolve to 379a5248…; separately validate @apexify/web snapshot.
2. Checkout engine 379a5248… into a disposable tree and build a NEW WS-00 recursive inventory. Do not overwrite STUDIO-PARITY-0 archive/source pin or historical evidence.
3. Map every declared API/option/union variant to implemented runtime, Studio Code/Visual capabilities, actual browser/full backend, codegen, persistence and tests.
4. Prove representative true PNG/GIF/MP4/WAV/JSON output fixtures and exact asset handling with bounded tolerances, rather than inferring from type declarations.
5. Inventory both legacy saved formats, localStorage, VisualProject and IndexedDB asset limits; define non-destructive import, backups, unsupported JS handling and rollback tests.
6. Reconcile #142/#140/#131/#59 file and test changes before merging any of them; preserve original branches.
7. Benchmark existing Code and Visual experiences, responsive/keyboard/accessibility, oversized projects/assets and sandbox resource limits; produce prioritised P0/P1 backlog.
8. Approve a source-backed feature matrix with exact current pinned SHA and evidence, then unlock WS-01 UI implementation.

## Honest status

WS-00 is STARTED, not complete. Repository pin references and PR divergence have been examined; current full recursive runtime parity, behavioral/browser QA, migrations and performance remain TO DO. Old Studio and production site remain unaffected.
