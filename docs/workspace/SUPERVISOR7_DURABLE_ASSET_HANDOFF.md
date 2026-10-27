# Supervisor #7 — Workspace durable asset checkpoint

Date: 2026-10-20. Base commit: af418562aceaf550390241cb573b534f60e71d4e.
Branch: codex/workspace-foundation-supervisor2-local. Installed Apexify.js v6.0.0 pin: 379a5248f09ed39c1b1734fe104b6bd73a77857f. No remote writes or Vercel deployments.

## Implementation

- New features/apex-workspace/durable-assets.ts: versioned IndexedDB database with separate immutable Blob and project manifest object stores. Blobs are addressed by SHA-256 IDs and verified against metadata/bytes. Transactionally saves all project-owned blob references and manifest together; advances a small localStorage pointer only on successful commit; serializes saves.
- Legacy v1 embedded asset records: browser decodes/verifies WebCrypto SHA-256 and image dimensions, hydrates the existing document, then migrates automatically to IDB. The legacy inline record remains the fallback if IndexedDB is unavailable. Node renderer does not receive arbitrary URLs, filesystem paths or database handles.
- WorkspaceApp.tsx: explicit recovery panel with raw download, validated backup import and confirmed reset; ordinary edits blocked until recovery choice; independent recovered manifest backup kept before replacing the active saved project. Main Workspace state reports aria-busy during async restore and refuses premature edits.
- Backup export includes original localStorage pointer, original manifest and best-effort unvalidated blob bytes. Missing blob entries are marked explicitly. Raw rejected bytes are never executed.
- Garbage collection is read-only: listOrphanAssets protects current and backup manifests plus caller-provided undo/history pins. No automatic deletion, which could destroy recovery data.
- Existing in-memory undo snapshots, generated Code output and render requests still hydrate inline bytes. A manifest-authoritative canonical v2 migration and streamed render transport are NOT implemented.

## Security and resource limits

Per-image PNG/JPEG/WebP max 2 MB; aggregate image bytes max 2 MB; eight records; 12 MP/image; document JSON max 3 million characters; render API request cap 6 MB. Browser and server MIME/magic, decoded dimensions and SHA checks preserved. Database quota and absence fail closed with error reporting; no remote media, arbitrary local paths or unrestricted FFmpeg enabled.

## Real verification

- 40/40 Workspace/pinned runtime tests, exit 0.
- 17/17 foundation and timebase tests, exit 0.
- 3/3 Studio regression tests, exit 0.
- Workspace static boundary audit, exit 0.
- npm run typecheck against complete mirrored source, exit 0.
- Real Chromium supervisor7 browser-durable-assets.cjs PASS, exit 0: duplicate image import yields one immutable blob, corrupt/missing Blob triggers recovery lock; raw bundle download; explicit reset preserving backup manifest; future schema fail closed; valid backup import/reopen; invalid JSON preserved; v1 inline auto-migration.
- Real Chromium migrated Supervisor6 pixel regression PASS, exit 0: original import/Visual-Graph matching decoded pixels, cover/contain output, undo/redo, reload, rapid source changes and direct pinned Node PNG byte/pixel decoding.
- Build: ordinary npm run build compiled and typechecked but Next static generation aborted with Windows worker memory error (exit 134). Repeat at --max-old-space-size=6144 also exited 134. Isolated worker-count experiment with cpus=1 did not complete; PowerShell treated Browserslist warning as terminating error. Temporary next.config.js was restored byte-identically; DO NOT mark root build PASS.

## 208-path createCanvas coverage

Source ledger: docs/workspace/CREATE_CANVAS_COVERAGE_S7.json, 208 exact paths: 71 PARTIAL (62 established + 9 image source), 42 BLOCKED, 95 NOT_MAPPED, 0 FULL. Durable-storage and browser tests were linked to relevant image source paths, without promoting any untested union variant to FULL.

Owner source audits 01_createCanvas(4).md and 03_shared_styles_gradients_patterns(4).md (baseline cbeea053c2a973d4e867f8ca96e79546060dd62d) were NOT provided in this coding conversation or working checkout. New CanvasConfig option whitelist work is intentionally blocked until they can be reconciled with the installed pin. Existing pinned-runtime behavior is execution authority.

Native videoBg still-frame extraction remains OFF pending approved asset ingestion and isolated cancelable FFmpeg execution contract. The existing Next.js 14.2.35 critical advisory remains unresolved; prior npm audit reported 17 vulnerabilities including 1 critical. No automatic upgrades or patched compatibility worktree were run.

## Remaining work

1. Acquire owner audit documents and reconcile pinned 208-path union variants, then implement actual gradient/pattern/stroke/background options with Visual/Code/Graph/runtime/browser evidence.
2. Fix full build-worker memory/environment limitations and re-run unmodified production build to exit 0.
3. Implement streaming asset request protocol, canonical v2 manifest ownership, browser storage quota/error simulations and explicit garbage collection after undo/history constraints.
4. Add deterministic delayed-response browser previews test, secure video still extraction contract, cross-browser asset imports and no-shadow side effects.
5. Owner-approved isolated patched Next.js compatibility tests; no production release while critical vulnerability remains.

## Evidence and recovery

Actual Chrome screenshots and test/build logs in D:/ApexifySupervisor5LocalBuildArtifacts. New local Git commit and format-patch/ZIP should be preferred over deploying incomplete code. Preserve predecessor commit af418562 and earlier Supervisor6 recovery artifacts. No remote push, PR, Vercel preview/production deployment or settings changes occurred.
