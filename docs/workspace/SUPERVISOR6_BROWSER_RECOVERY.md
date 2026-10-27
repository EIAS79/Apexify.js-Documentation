# Apexify.js Workspace — Supervisor Directive #6 Browser Recovery

**Date:** 2026-10-19. **Status:** Browser regression FIXED and reproduced; \`createCanvas\` PARTIAL. **Repository:** EIAS79/Apexify.js-Documentation; local-only branch \`codex/workspace-foundation-supervisor2-local\`. **Preserved base:** \`06a1812382d04faf1771462dd8c0cbf6f45aade7\`. Engine remains pinned to \`379a5248f09ed39c1b1734fe104b6bd73a77857f\` (Apexify.js 6.0.0).

## 1. Exact original failure and root cause

Original Supervisor #5 screenshot and failing script were found and preserved at:
- \`D:/ApexifySupervisor5LocalBuildArtifacts/workspace_canvas_s5_chromium.png\`
- \`%TEMP%/apexify_supervisor5_browser.cjs\` (never modified).

The original script was rerun unchanged on the locally hosted production build at \`http://127.0.0.1:38473/workspace\` and failed with exit 1:
\`locator.waitFor: Timeout 28000ms exceeded; waiting for locator('.aw-graph-node-output img')\`.

**Cause:** The actual \`features/apex-workspace/components/Graph.tsx\` Graph output has two class tokens \`className="aw-graph-node aw-node-output"\`; the test used one nonexistent class \`.aw-graph-node-output\`. The corrected compound selector \`.aw-graph-node.aw-node-output img\` immediately passed the original test, proving the Graph preview was present and decoded. The secondary instrumented test initially used an \`async\` predicate in \`waitForFunction\`; Playwright returned a truthy Promise handle before the image existed, creating another **test-only** false positive. This was fixed by a synchronous predicate returning an atomic pixel + source URL snapshot. Neither issue justified changing the renderer.

## 2. Persisted Chromium regression

\`tests/workspace/browser-canvas-assets.cjs\` is the executable regression. Run against an authorized LOCAL Next build:
\`S6_PROJECT_ROOT=<full repository source> S6_BROWSER_URL=http://127.0.0.1:38474/workspace S6_EVIDENCE_DIR=<writable screenshot dir> node tests/workspace/browser-canvas-assets.cjs\`.
The test requires an externally installed local \`playwright-core\` at \`%TEMP%/apexify-s4-browser-test-only/node_modules\` and installed Chrome; it does not alter production setup. Test imports actual in-memory PNGs (115 and 116 bytes), validates SHA-256 ID, dimensions, file sizes, Graph typed port, saved \`customBg\` reference and live renderer state. No binary asset data is logged.

## 3. Actual decoded pixel evidence

All frames 1280 × 720, with matching Visual and Graph \`img.currentSrc\` at the instant of assertion:
- Green image import: RGBA \`[25,213,75,255]\`.
- Second magenta import: \`[213,35,217,255]\`.
- Undo: green; redo: magenta.
- Disconnect Graph image port: \`[0,9,22,255]\`; undo: magenta.
- Reload saved project: magenta.
- \`customBg.fit=contain\`: \`[0,0,0,0]\` at tested corner; \`fit=cover\`: magenta.
- Rapid graph asset switches (green/magenta/green/magenta): final latest preview remains magenta.
- Direct in-browser \`POST /api/workspace/render\`, independent of live preview/queue: HTTP **200**, \`image/png\`, **25,416 bytes**, decoded **1280 × 720**, RGBA magenta.
- Network lifecycle telemetry on the passing run: 13 successful PNG responses; 5 object URLs created, 3 revoked, 42 preview mutation transitions; zero uncaught browser errors. Playwright's event-handler \`response.body()\` was not used as evidence: the independent direct fetch decoded the buffer reliably. **Browser-retained rendering parity is not claimed**; the browser displays server PNG output.

Screenshot evidence (real Chromium Workspace; preserved, not stock):
\`D:/ApexifySupervisor5LocalBuildArtifacts/supervisor6_before.png\`,
\`supervisor6_after_import.png\`,
\`supervisor6_after_reload.png\`,
\`supervisor6_corrupt_recovery_preserved.png\`.
The original Supervisor #5 failed and existing-smoke screenshots remain untouched.

## 4. Asset integrity and recovery hardening

\`features/apex-workspace/asset-store.ts\` adds \`verifyBrowserImageAssets\` on restored asset records: MIME/magic, bounded decode, SHA-256 using WebCrypto and \`createImageBitmap\` dimensions. The same immutable SHA-addressed assets remain per-document records. The prior server-side Sharp SHA/format/dimension validation is retained.

\`WorkspaceApp.tsx\` now waits for async verification before loading persisted document or setting \`ready\`. A corrupt saved asset cannot be silently accepted. On recovery failure, \`recoveryBlocked\` prevents the fallback hero document from overwriting the original localStorage record; the user is informed that the stored backup is preserved. A deliberate user edit can resume normal saving. The Chromium test tampers with persisted asset base64, reloads and verifies that the original malformed record (2 assets, 2,213 serialized characters in fixture) survives while the safe default renders.

## 5. Storage and resource budgets

Aggregate authorable **raw image** budget was reduced from 4 MB to 2 MB. Existing per-file max remains 2 MB, 8 file records, 12 MP maximum decoded image per record. \`validateDocument\` additionally rejects JSON authoring documents over 3,000,000 characters **before** a commit; the existing render API body cap is 6,000,000 bytes. The intentional headroom limits base64/storage pressure in the existing localStorage architecture. Tests verify model budget rejection and security failures; this does **not** prove universal browser quota guarantees. An IndexedDB-backed separate immutable blob store and revision/garbage-collection policy remain future work; undo/history and queue may still retain copies of large document strings. No untrusted external URL/filesystem media ingestion or native FFmpeg is enabled.

## 6. Tests and commands

- 40/40 TypeScript Workspace, canvas, pinned runtime and domain tests: PASS, exit 0. Logs: \`supervisor6_workspace_tests.txt\`.
- 17/17 Node foundation/timebase tests: PASS, exit 0. Logs: \`supervisor6_foundation_tests.txt\`.
- 3/3 legacy Studio regression tests: PASS, exit 0. Logs: \`supervisor6_studio_tests.txt\`.
- Static foundation audit: PASS, exit 0. \`supervisor6_static_audit.json\`.
- \`npm run typecheck\` on full source snapshot, SHA-mirrored changed files: PASS, exit 0.
- \`npm run build\` on full snapshot with output junction isolated on drive D: PASS, exit 0; **482 static routes**, log \`supervisor6_build_log.txt\`.
- Local Chromium S6 import/pixel/Graph/fit/undo/reload/storage-corruption test: PASS, exit 0, \`supervisor6_browser_output.txt\`. An additional original-script run with selector corrected also passed. No production/browser parity claim beyond tested paths.

## 7. Canvas 208-path ledger

\`docs/workspace/CREATE_CANVAS_COVERAGE_S6.json\`: exactly 208 pinned declaration-derived paths, **62 prior partially mapped + 9 asset-backed partially mapped = 71 PARTIAL**, 42 BLOCKED, 95 NOT_MAPPED and **0 FULL**. The nine image-related paths now link to browser evidence but remain partial. The original owner references \`01_createCanvas.md\` and \`03_shared_styles_gradients_patterns.md\` have not been provided to this coding context: no invented source-equivalence claim. Source data and pinned runtime are used, not newer engine \`main\`.

## 8. Remaining blocked functionality

Native \`videoBg\` single-frame extraction requires approved isolated media ingestion and FFmpeg limits. Filters, source-backed image patterns, gradient variants, full blend-mode enums, complex strokes/shadows, general typed graph connection editing, complete model v2 ownership and browser-retained renderer remain PARTIAL/BLOCKED/NOT_MAPPED. Remote HTTP media and unrestricted filesystem inputs remain prohibited.

**Security release blocker:** Installed Next.js **14.2.35** has unresolved critical npm advisories GHSA-p293-qw3h-jr36 (Windows-hosted unauthenticated RCE) and GHSA-2xp9-vwfh-vxw4 (AVIF optimizer RCE). Prior npm audit: 17 total (1 critical, 13 high, 2 moderate, 1 low). No upgrade was made. An isolated patched Next.js compatibility evaluation, image optimization exposure review, and explicit owner approval are needed before any production release.

## 9. Git safety and recovery

All implementation remains on the preapproved **local** branch; no rebase, reset, clean, remote push, PR, preview or production deployment. Recovery should use the complete local \`git format-patch\` export and local screenshot/test-log archive. The original Supervisor #5 recovery package and screenshots were preserved. No production task ledger gates were marked PASSED.

## 10. Next checkpoint

After accepting browser recovery, separately scope IndexedDB-backed immutable blobs and manifest migration with cross-browser quota measurements; extend secure image filters and canvas option union semantics per attached owner references; improve cancellable render lifecycle with deterministic delayed-request tests; resolve the independent Next.js release blocker before production consideration.
