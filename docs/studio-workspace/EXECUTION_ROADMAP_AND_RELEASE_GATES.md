# Workspace Studio — A-to-Z Execution Roadmap and Release Gates

> Program: WORKSPACE-STUDIO (WS) · Execution controller after 2026-10-18
> State: PLANNING, awaiting review and approval of architecture and UI.
> Branch strategy: a separate feature branch/PR for each phase, rebased against current main after securing original work. Do not merge the planning PR merely to trigger unfinished UX.
> Historical Studio roadmaps are marked SUPERSEDED; their technical contracts/tests remain inputs.

## Operating model

Each phase must include: scope and API source audit; detailed design/UX; code and migrations; unit/contract tests; verified output fixtures; desktop and mobile browser evidence; security/performance review; docs/coverage matrix changes; PR review and merged checkpoint. A phase is not DONE merely because components compile. If a subsequent phase depends on unverified functionality, status is BLOCKED, not invented success.

Release branch/prod policy:
- Keep old /studio fully operational and safe.
- Keep /studio/legacy/code and /studio/legacy/visual explicit, identifiable and recoverable.
- Implement new shell at isolated /studio/workspace with a flag; never silently switch production /studio before qualification.
- Preview CI must run with actual pinned dependencies and sample artifacts; a production build alone is not a runtime pass.
- Avoid excessive Vercel builds: batch meaningful checkpoints and prevent noisy parallel build runs; do not suppress CI tests.

## Phase board

### WS-00 — source audit, freeze truth and reconcile ongoing work
Depends: no prerequisites. Priority: P0.
- Verify current installed Apexify.js commit, installed declarations and engine exports; regenerate FULL recursive inventory and actual execution coverage, not only historical Phase-0 JSON.
- Compare Studio modes: state, storage, visual options, code generation, sync, runtime backend, asset limits, security boundary and exact artifacts.
- Examine open Studio PRs (#140, #142, #131, #59 as of initial audit), assess nonmerged changes, conflicts and merge eligibility; preserve independent branches. Do not close PRs or reset work without specific review.
- Create WS capability matrix with support status, source refs, backend and test evidence; identify P0 and P1 gaps.
- Collect screenshots of current UI and runtime verification at responsive breakpoints. Record performance baseline.
Gate: pinned-runtime identity proven, inventory no unclassified surfaces without explicit reason, risks triaged, migration strategy reviewed, old work preserved.

### WS-01 — design system, adaptive shell, docking and responsive foundation
Depends: WS-00.
- Establish scoped design tokens from Home/Frame Docs/Motion Field, themes and focus/typography standards; no blue-heavy legacy globals.
- New /studio/workspace behind flag; header/project switcher, minimal rail, single active Visual/Code/Graph slot, left drawer, right inspector, collapsed bottom dock.
- Responsive docking/overlay and focus transitions, window drag sizing, dynamic viewport/safe-area, scroll ownership, keyboard shortcuts and a11y semantics.
- Build genuine empty states and real, verified preview fixtures; no dummy actionable controls.
Gate: viewport matrix from UX spec, 320px no horizontal overflow, panel X restores area, 200% zoom, reduced motion and keyboard basics, no regression of old routes.

### WS-02 — WorkspaceProject, migrations and persistence
Depends: WS-00, WS-01.
- Schema for project/files/documents/visual/graph/assets/outputs/revisions/layout preferences; validators, migrations and semantic transaction journal.
- IndexedDB-backed local-first store, atomic checkpoints, object URLs lifecycle, multiple projects, id/collision handling, quota and offline recovery.
- Read-only import from existing Code localStorage and Visual schema 1/autosaves, with backups and migration preview; export old data intact.
Gate: 100% corpus old-format fixtures import without silent data loss; interrupted-save corruption recovery; reimport idempotence; no legacy key deletion.

### WS-03 — unified execution session and live output contract
Depends: WS-02.
- Migrate StudioSharedSession to project-aware provider; preserve Code and Visual execution API usage through compatibility adapters.
- Per-run immutable source/assets/fonts/runtime snapshots; exact artifact IDs, output version and MIME metadata; backend negotiation and safe errors.
- Browser/web and same-origin isolated Deno channels, cancellation and timeouts; logging/diagnostics and accurate Run status.
- Ensure old Code/Visual sample runs survive unchanged; no speculative auto-run for heavy jobs.
Gate: representative PNG/JSON/GIF/WAV/MP4 outputs from pinned runtime; complete correct artifact collection, no empty-result debug leak or stale result misassociation.

### WS-04 — Visual Canvas and inspector integration
Depends: WS-01..03.
- Reuse working VisualProject/node/history/direct manipulation; extract VisualStudioPre4 features incrementally into new shell.
- Layers, selection, transforms, canvas backgrounds/gradients/patterns, text/image/shape/chart, effects/options, asset references and contextual inspector.
- Fit/zoom/pan/guide/snapping and object keyboard interaction, preset save, undo/redo, supported advanced schema control.
Gate: existing phase4..phase18 Visual proofs + new mode-switch persistence and visual-to-generated-source rerender equivalence on supported fixture matrix.

### WS-05 — serious Code workspace, project modules and diagnostics
Depends: WS-01..03.
- Integrate editor/file tabs into WorkspaceProject; TypeScript/JavaScript, search, find/replace, syntax/color, commands, diagnostics and code formatting.
- Stable virtual module resolution/import policy, real compile errors, hover docs for pinned APIs; code-first users can ignore Visual.
- Code→Visual supported conversion with diff/unsupported ranges; preserve dynamic code exactly, no destructive reverse-sync.
Gate: Code Studio regression suite, 100+ file stress fixtures, lossless supported projections, intentional code-only unsupported cases with original code preserved.

### WS-06 — Graph editor and real operations compiler
Depends: WS-00, WS-02, WS-04, WS-05.
- Design typed node contracts mapped to exact current ApexPainter public methods, not a fictional engine Graph API.
- Node library for selected real domains (canvas, text, image, compose, refs and output), typed sockets, DAG validation, topological ordering, undo/history.
- Render from operation plan and generate idiomatic Apexify code, export project; Code→Graph supported subset only with explicit losses/unsupported representation.
- Keyboard node creation/navigation, viewport zoom/pan, minimap optional, virtualization for large graphs and mobile focus support.
Gate: graph-to-code-to-runtime produces same fixture outputs; cycle/invalid type tests; unsupported code survives untouched; no mock/unimplemented nodes offered as working.

### WS-07 — project/files/templates/assets integration
Depends: WS-02..06.
- Project switcher, recent list, rename, duplicate, export/import/restore, per-project asset namespace and code modules.
- File browser, context actions, search, move/delete safety, virtual folders and tabs, missing dependency diagnostics.
- Template catalog imported from real vetted Gallery recipes/Docs samples with actual source/assets/expected output/versions and accessible descriptions.
- Asset shelf: upload, metadata, refs, dedup, fonts, media preview, deletions and transfer; enforce current storage quotas until formally raised.
Gate: complete template project import + run + download; remove/restore assets safely; no claimed cloud storage or npm features without service.

### WS-08 — GIF/audio/video timeline and advanced media tools
Depends: WS-03..07.
- Conditional timeline dock, media tracks, playback/seek, frame sequence and FFmpeg settings grounded in runtime options, overlays/sound mix.
- Distinguish frame GIF, audio WAV, video MP4 jobs; show exact duration/dimensions/buffer metadata and live loadedmetadata updates.
- Video pipeline and audio synthesis controls only where source/proof verified; advanced Code-only modes explicit.
Gate: pinned runtime GIF/audio/video smoke output; browser player metadata and cancel; no fake keyframe APIs, measured resource costs.

### WS-09 — real Render Queue orchestration
Depends: WS-03, WS-07, WS-08.
- Request snapshot and state machine, idempotency, concurrency/admission caps, cancellation/abort and worker cleanup, truthful progress/indeterminate status.
- Queue defaults collapsed; active badge and details; Outputs shelf linked to job provenance; stale artifact retention and download.
- Session-scoped queue first if environment doesn't support durability. Durable/background jobs require separately verified infrastructure/storage and an explicit implementation decision.
Gate: 2+ simultaneous jobs under caps, queued→cancelled→cleaned, failure and retry, no zombie processes or false progress; mobile dock usable.

### WS-10 — engine-capability parity completion
Depends: WS-04..09; ongoing maintenance per phase.
- For each declared engine method/option family: runtime declaration/implementation, defaults, UI model, codegen, Graph subset, preview, artifacts and export/migration proof.
- Finish Canvas, Images, Text/metrics, Charts, Paths/pixels/detect, Scenes, components/templates, effects/utilities, GIF, audio, video, batch/chain, output and safe plugin/external exclusions.
- Cross-backend compare @apexify/web vs isolated full-runtime; differential visual pixel/frame/metadata tests with bounded tolerances.
- Mark each record FULL or explicit PARTIAL/CODE-ONLY/BLOCKED with concrete proof. No UI marketing blanket "all features".
Gate: every advertised feature verified; 0 UNKNOWN among advertised controls; every unsupported family truthfully classified and reachable via Code where allowed.

### WS-11 — interaction/scroll/responsive/accessibility/performance hardening
Depends: WS-01..10.
- Exact UX matrix at 320/360/390/430/600/768/820/1024/1280/1366/1440/1920/2560 widths and small heights.
- Scroll, resize, keyboard, touch, font zoom, contrast/light/dark/reduced motion, screen reader, modal focus, mobile keyboard/safe-area.
- Optimize with project-aware caching, workers, lazy mounts, virtualization, asset references, memory/URL cleanup, scheduler and instrumentation.
Gate: no P0/P1 UX defects, no horizontal viewport overflow, queue/inspector/drawer reclaim space, acceptable measured p95 target with benchmark report.

### WS-12 — runtime isolation, quota and security review
Depends: WS-03..11.
- Fuzz untrusted source, invalid imports, malicious assets, media subprocess options, resource exhaustion, combined concurrent users and timed cancellation.
- Verify no arbitrary network/FS/process, secret leakage, path traversal, zip-slip, stored XSS, unsafe SVG/HTML previews and command injection.
- Harden upload/asset/archive handling and per-project permissions. Host persistence and external credentials stay excluded unless separately approved architecture.
Gate: security CI, no critical/high reachable finding without mitigation/exemption, complete sandbox cleanup evidence, documented threat model.

### WS-13 — end-to-end proof, migration, rollback and review
Depends: WS-00..12.
- Full clean install, typecheck, build, old Code/Visual tests, new model/code/graph/preview tests, browser matrix and realistic multi-project usage.
- Migration audit in both directions, old project export if new format broken, no data corruption; snapshot screenshots/video and link artifacts to PR.
- Perform long-duration media tests and cross-runtime result comparisons; peer review and audit of new API claims.
Gate: all required CI green, feature/support ledger approved, reproducible artifacts and rollback rehearsed, no unreviewed breaking change.

### WS-14 — feature-flagged staging / limited preview
Depends: WS-13.
- New route only for opt-in staging; run Vercel build & staging smoke, staging user journey sessions, monitor errors/performance and fix regressions.
- Test role permissions/authorization and server quotas; confirm current /studio and explicit legacy routes still work.
Gate: agreed qualitative/quantitative UX acceptance, no P0/P1 issues, stable error/health metrics, rollout authorization.

### WS-15 — production promotion / compatibility cutover
Depends: WS-14 and explicit approval.
- Commit reviewed release/merge to main, wait Vercel production READY, verify production URLs + actual source/render/asset flows.
- /studio default becomes new Workspace; /studio/legacy/code and /studio/legacy/visual preserved and prominently linked for recovery.
- Publish migration docs and support matrix, observe metrics, rollback if necessary.
Gate: production smoke and release checklist signed; rollback command/procedure documented.

### WS-16 — postrelease maintenance / legacy decision
Depends: WS-15.
- Triage customer data migrations and capability regressions, improve performance and panels from measured use.
- Continue upgrading pinned engine versions through rerun parity. Run deprecation/retirement plan for legacy **only upon later explicit approval**.
Gate: stable release, migration confidence and documented maintenance/engine drift policy. No automatic removal deadline.

## Status board for future updates

| Phase | Status at plan creation | Evidence required |
|---|---|---|
| WS-00 | IN PROGRESS — pinned recursive inventory passed (226 public surfaces / 71,086 records); runtime and migration verification ongoing | current-pin proof and migration acceptance |
| WS-01 | COMPLETE — gated adaptive shell, eight-width CI + inspected Code/Visual screenshots, responsive resizing/keyboard/focus/theme, default-collapsed Visual controls; integration semantics reserved for WS-02..10 | [WS-01 checkpoint](./WS01_IMPLEMENTATION_CHECKPOINT.md) |
| WS-02 | TO DO | project schema, migration fixture suite |
| WS-03 | TO DO | sandbox and artifact equivalence |
| WS-04 | TO DO | Visual integration and codegen tests |
| WS-05 | TO DO | Code integration and source safety |
| WS-06 | TO DO | typed graph, real code + output proof |
| WS-07 | TO DO | projects/files/assets/template E2E |
| WS-08 | TO DO | media fixtures and timeline tests |
| WS-09 | TO DO | real queue state/cancel/perf proof |
| WS-10 | TO DO | capability ledger classification and runtime parity |
| WS-11 | TO DO | mobile/desktop/a11y/perf acceptance |
| WS-12 | TO DO | sandbox and resource safety |
| WS-13 | TO DO | full release candidate and rollback |
| WS-14 | TO DO | staged preview and monitoring |
| WS-15 | TO DO | production cutover |
| WS-16 | TO DO | postrelease migration/legacy review |

Plan created and legacy routes prepared ≠ WS-01 complete. Keep statuses honest.

## Per-phase pull request template

- Scope and source-of-truth runtime SHA;
- Changed project schema/components/assets/CSS and migration impact;
- Feature matrix delta (advertised support vs real proof);
- Security impact and exact restricted sandbox assumptions;
- Desktop/tablet/mobile screenshots, reduced-motion keyboard check and scrollbar evidence;
- Tests, output hash/visual equivalence, performance metrics and CI URL;
- Remaining limitations, backward compatibility, rollback and next phase;
- Review signoff before merge.

## Conflict/recovery policy

Keep unmerged historic feature PRs as sources until owner reviews migration; preserve all existing branches and uncommitted Work changes. Do not reset/clean/force-push. Stop executing superseded Studio phase schedules as controlling plans; avoid duplicate implementation. If a separate agent is actively running, do not claim it has been stopped from changing this file. Coordinate via PR/issue assignment before concurrent code changes.

## Global release acceptance

- [ ] ONE unified project, Visual/Code/Graph share canonical revisions.
- [ ] No false feature or generated source claims.
- [ ] Current engine pin and runtime execution evidence traceable.
- [ ] Mode conversion never silently erases user code.
- [ ] Projects/files/assets/media/templates and outputs work end to end.
- [ ] Queue scheduling truthful with cancellation and resource limits.
- [ ] Collapsible/scrollable flexible responsive UI across real devices.
- [ ] Keyboard, accessibility, light/dark and reduced motion green.
- [ ] Sandboxed execution and asset upload verified secure.
- [ ] Migration and rollback from legacy complete.
- [ ] Build, browser, render/artifact and compatibility CI green.
- [ ] Production release and monitoring explicitly approved.
