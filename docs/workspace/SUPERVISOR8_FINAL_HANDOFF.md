# Apexify.js Workspace — Supervisor #8 Engineering Report

**2026-10-20 | LOCAL ONLY | Supervisor #8 checkpoint status: PARTIAL**

Repository: EIAS79/Apexify.js-Documentation
Branch: codex/workspace-foundation-supervisor2-local
Preserved start: c625700ea81de60eb27fbc844f78b2fa880e8d88
Installed Apexify.js 6.0.0 pin: 379a5248f09ed39c1b1734fe104b6bd73a77857f
Checkpoint HEAD: retrieve from local git log after commit.

## 1. Application build recovery

The Windows host has 15.65 GiB RAM but initially had only 1.47–1.70 GiB free and resident Chromium processes using multiple GiB. The prior Next 14.2.35 default-worker production build compiled/typechecked but prerender workers crashed with Node/V8 OOM code 134; raising heap alone did not solve it.

Isolated baseline detached worktree: D:/ApexifySupervisor8Baseline at af418562aceaf550390241cb573b534f60e71d4e. Initial baseline preparation encountered missing generated docs data, an invalid cross-drive node_modules junction, and missing built Apexify.js artifacts from npm ci --ignore-scripts. These were resolved without changing baseline Git source: generated docs build prerequisites materialized in isolated checkout; dependencies installed independently; Apexify.js compiled artifact copied from the main package, with matching CJS entrypoint SHA-256. Baseline root typecheck passed.

Baseline application production build then PASSED exit 0, including compiler, TypeScript, all 482/482 static pages, and BUILD_ID. Main development application production build likewise PASSED exit 0 with the same controlled setting.

The reproducible setting is a temporary next.config.js experimental.cpus = 1 and NODE_OPTIONS=--max-old-space-size=4096. Config contents were restored byte-for-byte afterward; no permanent dependency or app configuration change. The default worker-count OOM remains an environment/resource limitation and is not claimed fixed. Production browser verification is a separate gate; any later dev server use can overwrite the shared Next build output directory, so use isolated build directories for future test runs.

Build logs: supervisor8_baseline_build_pinned_runtime_1worker.txt, supervisor8_current_build_pinned_1worker.txt, supervisor8_current_build_final_for_prod_browser.txt in D:/ApexifySupervisor5LocalBuildArtifacts.

## 2. Authoritative API reference audit

Owner documents read in full:
- 01_createCanvas(4)(6).md, source audit baseline cbeea053c2a973d4e867f8ca96e79546060dd62d
- 03_shared_styles_gradients_patterns(4)(6).md, same source audit baseline.

These were compared against installed Apexify.js 6.0.0 package declarations, not treated as newer-runtime execution certificates. Pinned declarations confirm CanvasConfig backgrounds, background layers union, gradient / GradientConfig distinction, 12 procedural pattern variants plus custom pattern, nested stroke/shadow declarations, and videoBg meaning one extracted still frame. Pinned runtime was exercised directly for 12 procedural patterns and 3 gradient variants; decoded PNG and source-backed custom pattern root/layer outputs were observed. No untested declaration-only option is FULL.

## 3. Durable project save protocol

features/apex-workspace/durable-assets.ts now uses an IndexedDB revision-aware CAS inside the SAME readwrite transaction as immutable Blob storage and active manifest update. Stored project revision increments monotonically; legacy manifests without revision start at zero. Stale tabs fail with ProjectSaveConflictError, no lost writer; the UI shows a conflict, offers export of local edits and explicit reload. Tests use two actual Chromium tabs and verify both read revision 1, A commits revision 2 linear gradient, B's stale radial gradient is rejected, and linear/revision 2 remains authoritative.

The localStorage pointer update is separate but recoverable: on missing pointer or an old inline-v1 record, the verified newer IDB committed project wins. Neither missing pointer nor interrupted pointer update can silently replace it. Fresh v1-only documents still migrate into IndexedDB. Committed manifest/blob storage remains atomic and content-addressed. Explicit backup/reset and raw download from Supervisor #7 are preserved. Garbage collection remains read-only to protect backup, history and project references.

Unfinished fault gates: forced browser quota exhaustion, transaction abort at every transition, download and backup write failures, complete cross-browser reopening and process-kill matrix. These must be separately verified; no FULL storage certification.

## 4. Asset memory and render-request boundary

features/apex-workspace/render-assets.ts and client-render.ts now select only referenced immutable imported media assets for a render request. The dependency walk covers root customBg and custom pattern, ordered image and custom presetPattern layers, root image backgrounds and image layers. Missing dependencies reject before network fetch. Portable v1 authoring, Code export and current undo/redo still hydrate original data URIs; fully eliminating buffers from history requires canonical v2 manifest-owned state and a separate bounded stream transport. No external URLs or filesystem paths are passed to Node.

## 5. Verified pattern CanvasConfig implementation

canvas-options.ts supports 12 pinned procedural patterns: grid, dots, diagonal, stripes, waves, crosses, hexagons, checkerboard, diamonds, triangles, stars, polka, plus customPatternImage with verified SHA256 asset-only sources. Root repeat, scale, offsets, spacing, opacity, rotation and restricted blend enumerations are validated with numeric budgets.

CanvasOptionsEditor presents structured controls and imported image-backed root pattern with source selection. Ordered presetPattern insertion and safe custom pattern source resolution were implemented. model.ts rejects missing/untrusted asset references; server/assets.ts resolves authorized custom pattern assets in root/layers to the pinned runtime; codegen.ts produces public-v6 output with exact byte parity on tested cases.

The typed Graph projects root pattern identity and an editable image-source connection. Connect/disconnect rejects missing/unverified asset IDs, and edits update the same authoritative document. Nested layer-specific Graph edits, all cycle-safe port semantics, per-layer full UI controls, image filters, pattern gradients, advanced stroke/shadow, gradient repetition/geometry edge cases, native media and browser-retained rendering remain partial or unimplemented.

## 6. Render lifecycle correction

WorkspaceApp uses an incrementing live render generation token in addition to AbortController. Obsolete success, error, and finally blocks cannot replace the newest preview. Object URLs for replaced previews are revoked; active preview URL remains live. browser-stale-render.cjs deterministically delays an old render, completes a newer edit, releases an old HTTP error and verifies newest decoded Visual/Graph pixels and object URL cleanup.

## 7. API coverage ledger

docs/workspace/CREATE_CANVAS_COVERAGE_S8.json preserves 208 original subpaths: 79 PARTIAL_AUTHORING_SUBSET, 11 PARTIAL_ASSET_BACKED_CANVAS, 40 BLOCKED_ASSET_OR_NATIVE_BOUNDARY, 78 NOT_MAPPED, and 0 FULL. Total 90 partial, 40 blocked, 78 not mapped. Neither 208 entries nor a union subpath automatically means 208 fully independent features. The ledger was updated without marking declaration/runtime-only support as FULL.

## 8. Tests and decoded output

- node --import tsx --test [all tests/workspace/*.test.ts]: 45 passed / 0 failed, exit 0.
- node --test tests/workspace/foundation-audit.test.mjs tests/workspace/timebase-adr-proposal.test.mjs: 17/17, exit 0.
- node --import tsx --test scripts/studio/docs-batch-no-artifact.test.ts: 3/3, exit 0.
- Workspace static boundary audit with expected pin: exit 0.
- Root npm run typecheck: exit 0.
- Isolated baseline and current npm run build, single Next worker: exit 0, 482 static pages each.
- Pinned pattern runtime direct decoded 12 procedural PNGs; root custom-pattern codegen exact byte output equals server PNG; actual Chromium custom image 1280 x 720 decoded sample RGBA [205,44,82,255].
- Real Chromium: original Supervisor #6 import/Graph/undo/redo/reload/fit pixel suite; Supervisor #7 durable blobs/recovery/fresh-context v1 migration; new two-tab revision conflict; custom-pattern Visual/Graph PNG+reload; delayed old render request/error regression. Individual run outputs and screenshots captured under D:/ApexifySupervisor5LocalBuildArtifacts. The final collective run of all five Chromium suites against the freshly built local Next.js production server PASSED, exit 0; evidence is recorded in supervisor8_prod_browser-*.txt files.

## 9. Security and release

Read-only npm audit --json returned 17 advisories (1 low, 2 moderate, 13 high, 1 critical). Next.js 14.2.35 remains a CRITICAL release blocker. Audit reports affected Next range 9.3.4-canary.0 to 16.3.0-preview.10; npm suggests fix version 16.4.2 requiring a semver-major upgrade. No patched-version compatibility test or owner authorization exists for a main-branch update. A separate isolated compatibility/rollback evaluation remains necessary. Native videoBg still-frame extraction remains DISABLED until approved asset identity, bounded FFmpeg isolation, cancellation, timeout and provenance contract.

## 10. Recommended next checkpoint

1. Finish deterministic quota/crash injection matrix across IDB transaction, pointer and backup phases, and browser restart, with explicit recovery UI.
2. Migrate editor history and jobs to manifest-authoritative canonical v2 media references with lazy hydration, then bounded binary render request transfer; keep v1 compatibility and portable export.
3. Fill nested background-layer pattern editing and typed Graph ports, verify gradient/stroke/shadow variants using pinned runtime decoded pixels, and expand browser undo/redo+Code/Graph parity.
4. Test a patched Next.js major upgrade only in an owner-approved isolated worktree with typecheck/build/routes/image-optimization/Chromium/rollback verification.
5. Keep createCanvas PARTIAL and native video extraction disabled until all required links pass.

**Restrictions observed:** no remote Git push, PR, Vercel preview or production deployment, Vercel configuration edit, destructive workspace cleanup/reset, or dependency pin upgrade. Local commits/recovery ZIP+format-patch and SHA-256 are generated separately for supervisor review.
