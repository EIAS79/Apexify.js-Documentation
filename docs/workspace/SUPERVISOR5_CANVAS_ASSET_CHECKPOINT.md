# Supervisor #5 — Secure Canvas Asset Vertical Slice (2026-10-19)

## Scope and source identity

Repository: EIAS79/Apexify.js-Documentation. Base commit: a1db5fd34176b60a09cd4ba8e99a70c6b4435224. Preserved branch: codex/workspace-foundation-supervisor2-local. Package pin unchanged: 379a5248f09ed39c1b1734fe104b6bd73a77857f (apexify.js 6.0.0). Owner files 01_createCanvas.md and 03_shared_styles_gradients_patterns.md were not present in the supplied conversation files or coding checkout. This work uses actual installed pinned declarations and runtime, not upstream main.

## Implemented code

- `features/apex-workspace/asset-store.ts`: portable content-addressed immutable image asset records. SHA-256 asset IDs, MIME/magic checking for PNG/JPEG/WebP, 2 MB per asset, 4 MB aggregate bytes, eight assets, 12 MP per image. Browser import uses actual image decode and SHA-256. Only opaque `asset:<64 hexadecimal>` references are accepted for canvas-owned image sources.
- `features/apex-workspace/canvas-options.ts`: validated `customBg` image source, fit, alignment, inheritance and opacity plus `bgLayers` image union with source, fit, align, opacity and selected blending variants. Disallows URLs/filesystem paths and unresolved source kinds.
- `features/apex-workspace/model.ts`: single document-scoped immutable image asset collection and canvas reference integrity. Legacy v1 content remains readable; records migrate through the existing v2 adapter without duplicating asset bytes in frame snapshots.
- `features/apex-workspace/server/assets.ts`: server-only SHA-256 bytes check and Sharp format/dimensions/decode validation with bounded input/pixel budgets, plus translation to the actual CanvasConfig data-URI source shape; cancellation is checked before and after verification. External URL fetching is not enabled.
- `features/apex-workspace/server/render.ts`: real pinned ApexPainter canvas invocation with resolved image-backed options, preserving legacy preview and layer behavior.
- `features/apex-workspace/codegen.ts`: executable public ApexPainter program with content-checked embedded asset registry lookup; generated source and server renderer produce byte-identical buffers for the tested imported background.
- `features/apex-workspace/components/CanvasOptionsEditor.tsx`, `Inspector.tsx`, `WorkspaceApp.tsx`: visible dark/neon style preserved; import as base image or ordered image layer; choose existing imported asset; edit fit, alignment, opacity; validated document history and local persistence retain records.
- `features/apex-workspace/canvas-graph.ts`, `components/Graph.tsx`: typed derived canvas/asset/layer/output graph nodes and connections with canonical document edits for image input and ordered background ports. This is still a SUBSET, not a fully general editable graph.
- `tests/workspace/canvas-assets.test.ts`: actual pinned engine image decode/pixel inspection and generated-program parity, reorder pixel changes, migration, typed graph editing, missing hashes, invalid URLs/paths/MIME/dimensions and collection budget rejection.
- `tests/workspace/canvas-authoring.test.ts`: updates obsolete error-string assertion while preserving the external URL rejection guarantee.
- `docs/workspace/CREATE_CANVAS_COVERAGE_S5.json`: explicit status for all 208 declaration-derived paths.

## Coverage (S5)

208 declared paths: 62 earlier partial plus 9 newly partially mapped = 71 PARTIAL; 42 BLOCKED; 95 NOT MAPPED; zero fully certified. Runtime evidence covers an image backed CanvasConfig customBg, background image layer ordering, source resolution and a typed Graph subset. The ledger never interprets this as complete support for `customBg.filters`, image patterns, native `videoBg`, every blend mode or browser-retained rendering.

## Security and production release blockers

Current read-only npm audit: 17 vulnerabilities (1 critical, 13 high, 2 moderate, 1 low). Direct installed Next.js 14.2.35 has critical advisories GHSA-p293-qw3h-jr36 (Windows-hosted unauthenticated RCE) and GHSA-2xp9-vwfh-vxw4 (AVIF image optimizer unauthenticated RCE). The Windows-hosted issue may not apply to Linux Vercel production but remains relevant for Windows hosts. The AVIF exposure requires a route/config verification; current next.config.js has no explicit images/formats/remotePatterns override, but this does NOT demonstrate safety. npm audit identifies next 16.4.2 as a major-version fix candidate; a compatible, patched 15.5.24-series release might avoid some advisories, but is not fully evaluated. No dependency was upgraded. Owner approval is required before any dependency migration, integration or deployment.

Native videoBg still-frame extraction is NOT implemented: source ingestion, private execution sandbox and bounded FFmpeg job isolation have not been approved. No fake frame or unsafe subprocess is substituted. Remote media URLs and unrestricted filesystems remain disallowed. Browser-retained mode is not implemented.

## Tests and scope

Executed against the local Git checkout with a junction to the dependency tree: 39 Workspace TS tests PASS, 17 foundation/timing tests PASS. Full application typecheck PASS against a full source snapshot with SHA-matched edited files. Root Next.js build compiled and checked types. An initial attempt encountered C: ENOSPC during static-page output; a D: temp-build location needed a read-only junction for dependency resolution. With generated build output isolated on drive D:, npm run build exited 0 and generated 482/482 pages. Existing Chromium Workspace smoke test exited 0, verified Visual-Graph sync, background reordering, save/reload and preview, and produced screenshot D:/ApexifySupervisor5LocalBuildArtifacts/workspace_canvas_s5_existing_smoke.png. A stricter new asset-specific Chromium test FAILED: the verified imported asset persisted in localStorage and POST /api/workspace/render returned 200, but its Graph output image did not appear within the test timeout. The failing flow is not certified; reproduction script and an actual screenshot are retained at D:/ApexifySupervisor5LocalBuildArtifacts/workspace_canvas_s5_chromium.png. This is a high-priority next regression.

## Deployment policy

Local-only development; no remote push, PR, Vercel preview, production deployment, automated upgrade or Vercel settings modification. The installed engine pin and approved Workspace visual theme are unchanged. Production task ledger and release gates remain open.

## Next package

Finish verified image filters and source-bearing pattern variants, thumbnail/asset management and stale-preview cancellation under browser instrumentation, complete canvas config and Graph coverage, implement isolated videoBg still-frame extraction only after security boundary approval, and verify patched Next.js in separate owner-approved local compatibility worktree before considering production.
