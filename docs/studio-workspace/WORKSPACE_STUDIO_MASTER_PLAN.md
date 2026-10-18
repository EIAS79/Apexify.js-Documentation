# Apexify Workspace Studio — Unified Master Plan

> Program: WORKSPACE-STUDIO (WS)
> Status: ACTIVE MASTER PLAN — design/architecture stage, implementation not yet started except preservation of legacy entrypoints
> Effective date: 2026-10-18
> Repositories: EIAS79/Apexify.js (engine), EIAS79/Apexify.js-Documentation (application)
> Source of truth: pinned Apexify.js declarations + actual runtime implementation + executable proof. Never use mockup code as API evidence.
> Documents: README.md, SOURCE_AUDIT_AND_CAPABILITY_TRUTH.md, UX_RESPONSIVE_INTERACTION_SPEC.md, EXECUTION_ROADMAP_AND_RELEASE_GATES.md in this directory.

## 0. Program reset and product objective

The old /studio hosts CodeStudio and VisualStudio as independent views under StudioShell. They share asset/output/history session state, but Code buffers and the VisualProject model are not a universally reversible project. Broad Visual capability classification is not comprehensive runtime parity. The current UI shows too many panels, uses outdated blue-heavy colors and is inconsistent with the new Home, Frame Docs and Motion Field Gallery.

**Build one unified Workspace Studio**: one project and one execution/output system, with three optional authoring projections — Visual Canvas, Code and Graph — and explicit split view on demand. Users can build assets/scenes, edit real Apexify.js source, compose supported operations as graph nodes, preview real outputs, export portable source/assets, maintain multiple projects and manage real render tasks. The approved visual direction is the first canvas-first concept, corrected for low clutter, optional drawers and website design tokens.

**Plan transitions:** STUDIO-VISUAL / STUDIO-0..10 plans are superseded as schedules, while their technical artifacts are migration inputs. STUDIO-PARITY historical inventories are evidence, not permission to claim FULL on the current pin. Existing Code and Visual implementations stay accessible at /studio/legacy/code and /studio/legacy/visual and are NOT deleted. The /studio production route keeps the old UI until a flagged new Workspace is production-qualified. Existing unrelated engine Phases 15–43 are not cancelled by this Studio-specific reset.

## 1. Immutable product constraints

1. The same project ID, files, assets, timeline, revisions, run history and output identities persist across Visual / Code / Graph mode switches.
2. A feature appears as enabled only if the exact pinned Apexify.js runtime supports the operation and its declared options, and a verified backend can execute it; show capability routing and meaningful failures.
3. All advertised actions are working; no fake render progress, generated-code placeholders, invented APIs, fake asset uploads, implied cloud collaboration or false preview claims.
4. Code is a first-class environment (JS/TS, multiple virtual files, imports, syntax errors, history, full artifact protocol) — not a modal behind a Visual-only editor.
5. Visual is a first-class environment (canvas, layer tree, selection/drag/transform, inspector, snapping, history, validated options, real codegen).
6. Graph is a Studio-level authoring projection of a VERIFIED subset of engine methods. The Apexify package is not claimed to ship a node-editor public API. Arbitrary Code→Graph conversion is impossible without loss; show supported-range overlays and require consent for partial conversion.
7. Source-backed outputs include reproducible package pin, inputs/assets/fonts/options and exact render command. Generated source is ordinary Apexify JS/TS, not private Studio harness code.
8. Restrictive Deno executor, media subprocess mediation, media quotas, no secrets leakage and clear hosted API exclusions remain in effect throughout migration.
9. Do not publish as production-complete until migration, runtime parity for every *claimed* capability, browsers, accessibility, security and real artifact comparisons pass.
10. At every size, active authoring surface receives remaining space when panels are dismissed. Desktop grid pressure is never allowed to make canvas/code unusable.

## 2. Information architecture

Global header: shared brand/navigation, project picker, revision/autosave badge, search/command palette, verified Run/backend status, Export, help. Primary left **slim rail**: Projects, Files, Layers, Templates, Assets, Create, History. It activates *one contextual drawer*, never permanent three-column navigation. Context drawer: search, tree, filters, actions, visible close X, pin/unpin when space allows.

Center workspace: **Visual / Code / Graph** segmented switch, optional Split, responsive zoom/fit, object focus, device/artboard selection, core run controls. Switching views replaces main surface and restores scroll/selection. Split shows maximum two major panes, user-initiated only.

Right inspector: Properties, Presets, Data/Assets, Advanced; opens on selection or by explicit command. Sections collapsed by default if complex, option search; schema validation and source docs references. Inspector is overlay on tablet/mobile.

Bottom dock: Render Queue, Timeline, Outputs, Console, Diagnostics, History; collapsed to ~34–42px bar initially. Expand with tab, dismiss via X/Escape; resize on desktop, mobile bottom sheet. Queue entries show actual states and artifact status; no simulated 72% progress.

Main authoring modes:
- **Visual Canvas:** artboard, objects, layers, gizmos, direct manipulation, preview.
- **Code:** project editor/files and diagnostics, run and output pane if wanted.
- **Graph:** typed nodes/ports/connections for actual operations, compiled to valid code/operation plan, independent optional preview.
- **Split:** Code+Preview, Graph+Preview, Visual+Code for supported documents; no default four-panel grid.
- **Asset/Project manager:** drawer/palette full-screen workflow at small widths, not permanent panels.

## 3. Canonical data model / synchronizing source

Build a versioned WorkspaceProject envelope rather than grafting independent old Studio states:
- id, name, schemaVersion, created/updated, pinned runtime, capability digest, revisions;
- virtualFiles with real relative paths, languages, imports and per-file dirty/history state;
- documents/artboards with dimensions/background and VisualProject-compatible semantic object tree;
- optional Graph DAG, typed port and node/edge layout, supported operation mapping;
- asset manifest (IDs, digest, MIME, dimensions/duration, provenance, references) and binary blobs stored outside localStorage;
- execution configurations, source/asset snapshot manifests and job requests;
- typed output records, artifact ownership, retention and cleanup; user-visible diagnostics;
- undo/redo transaction journal and autosave checkpoints; per-device-class UI panel preferences;
- compatibility/migration evidence including code-only ranges and graph/visual support boundaries.

The last edited **authoritative projection** wins until its conversion transaction succeeds. Conversions are validation+commit, never overwrites on speculative parsing. Preserve unsupported Code text on Code→Visual and Code→Graph; show Keep Code / Convert Supported Subset / Cancel and a before/after diff. One-way generated code is allowed but must say so. Visual→Code must be deterministic and generated source must rerender to the same declared artifact tolerances. Graph→Code must emit ONLY verified Apexify APIs or validated ordinary JS facilities. Add revision checks, stale-run rejection and conflict prevention.

Architecture:
~~~text
Edit transaction → WorkspaceProject revision
   ├── Visual model → normalized compiler → deterministic Apexify source
   ├── Code editor/parser → supported Visual/Graph projection or code-only marker
   └── Graph nodes/typed ports → validated operations → source/Visual model
            ↓ frozen source + asset/font + runtime/version snapshot
         capability resolver
       ┌── @apexify/web when actually supported
       └── same-origin restricted Deno + mediated FFmpeg for full runtime
            ↓ structured artifacts, metadata, logs, warnings
          preview / outputs / queue / export
~~~

Refactor within existing code boundaries, not an unreviewed rewrite of compiler, sandbox and package pin. Existing interfaces may be adapter-wrapped until migrated. Guard editor history, error boundaries and persistent saved formats.

## 4. Features and service ownership

| Domain | Editor/display | Runtime contract / proof |
|---|---|---|
| Canvas / backgrounds / pattern / gradient | Visual artboard + inspector; Code; Graph where representable | ApexPainter.createCanvas and CanvasConfig variant tests |
| Images / shapes / masks / blending | Layers, inspector, image asset shelf | createImage and real image config, transforms and render |
| Text / typography / curved/grouped text | Text tools, font shelf, inspectors | createText, measureText, actual fonts, complex options |
| Charts and data | Chart picker, structured data inspector, code | runtime chart families, data shape/axes tests |
| Paths/Path2D/doodle | Path controls & edit overlay | path2d facade; drawing and pixel output |
| Pixels and detection | Advanced data inspector | pixels/detect typed results and bounds errors |
| Scenes / SceneBuilder | Canvas, layers, Graph DAG | createScene/renderScene/SceneBuilder semantics |
| Components/templates/named assets | Reusable components and recipes | actual component factories, placeholders, refs |
| Image effects/utilities | Non-destructive effect stack where possible, Code | crop/stitch/resize/convert/filters/mask |
| GIF & animation | Timeline, frame shelf | createGIF, animate, real frame + duration output |
| Audio | Media pane/timeline, waveform | createAudio presets/synth/sequence/mix/WAV |
| Video | Video timeline/pipeline, player, job options | createVideo/videoPipeline/FFmpeg/ffprobe true metadata |
| Batch / chain | Graph where valid + jobs/results | batch/chain real concurrency and artifact arrays |
| Export/output | Formats/presets/Results | buffers, download, serialization and provenance |
| Plugins | Code and verified advanced UI only | allowlist, sandbox compatibility, no implicit trust |
| External/host writes | Explicit excluded-with-reason in hosted Studio | safe download alternatives |

Capability states: VERIFIED_FULL, VERIFIED_CODE_ONLY, VERIFIED_FULL_RUNTIME_ONLY, PARTIAL, WEB_APPROXIMATE, EXCLUDED_WITH_REASON, BLOCKED, UNKNOWN. Public-type coverage ≠ runtime-proven Studio feature. Link each enabled UI control to inventory record, source and passing tests.

**Graph caveat:** Graph and Render Queue are Studio product functionality, not Apexify.js engine exports until proven. Never invent names such as painter.createGradient() or canvas.text() merely to match an illustration.

## 5. Projects, files, templates and assets

Projects: create/rename/duplicate/close/delete/restore/export/import, recent list, per-project preference and revision snapshots, cross-tab conflict handling. Files: virtual JS/TS modules and supported data/assets, folder tree, open tabs, search, rename/move, safe import resolution, usable diagnostics, code snapshots. Never promise arbitrary npm/OS file access. Templates: verified actual executable recipes with source, asset, expected output, pinned runtime and setup instructions. Gallery→Studio transfer imports COMPLETE recipe/project or clearly states external dependencies.

Assets: retain current Studio asset manager and limits as baseline (12 items, 8 MiB each, 24 MiB total); any increase requires quota/performance tests. Image/video/audio/font asset types, consistent studio:// references, thumbnails/metadata, dedup, rename, deletion impact, export portability. Blob storage IndexedDB or approved durable solution — never huge base64 in localStorage. Cloud projects/team sync must remain labeled **NOT IMPLEMENTED** until real auth, storage, rights, conflict protocol and security are built.

Import CodeStudio localStorage and VisualStudio .apexstudio.json via read-only discovery → non-destructive snapshot → schema validation → dry-run/preview and conflict report → explicit confirmation → new store. Keep legacy source data untouched until verified restore/export; rollback reopens legacy.

## 6. Render Queue / timelines / outputs

Render Queue is a UI/backend scheduler over real requests, not a fictional engine feature. Job fields: ID, source revision hash, asset snapshot digest, runtime pin/backend, requested output(s), owner, priority, status, actual progress if emitted, elapsed/error/warnings, artifacts and retention. Implement queued→running→completed/failed/cancelled, cancellation and worker/FFmpeg cleanup, source snapshot immutability and idempotency. A Vercel synchronous function is not a durable background job runner: introduce background persistence/worker only with measured platform support. Initially honest local/session queue is permitted, with no fake progress or persistence claim.

Timeline: show/edit keyframes and media tracks only for runtime-proven GIF/audio/video/animation semantics; otherwise represent clips or output frames read-only with limitations explained. Output inspector supports multiple PNG/GIF/MP4/WAV/text/JSON artifacts, progress/provenance, preview/copy/download with MIME/duration checks.

## 7. Design language

Use Home/Frame Docs + Gallery dark editorial tokens as authority, not current Studio blue. Reference docs variables: #111210 background, #1b1d18 panel, #34382e border, #f3f4ec text, #d5ff5f selected lime, Gallery #c1a4ee lavender accent. Teal for status, amber for warning; saturated prismatic art belongs in generated media and sparingly on active control, NOT every panel. Scope all new theme tokens under Workspace root; no global component overrides. Define accessible dark/light/high contrast and reduced motion, typography scale, semantic sizing and focus styles.

## 8. Responsivity, window management and scroll

Detailed invariants: UX_RESPONSIVE_INTERACTION_SPEC.md. Main visual editor uses available height, not fixed 900px. Layout uses flex/grid with min-width:0 and min-height:0 for every inner pane; explicitly scroll individual drawer, source, inspector, tree and queue regions. Document has no inadvertent horizontal overflow at 320/390/768/1024/1440/1920+ CSS px. 44px touch targets where appropriate; viewport/keyboard/safe-area handled with dvh, max-height and safe area. On mobile: one full-focus editor, context sheets, queue closed initially, inspector only on demand. Resizers have min/max and accessibility alternatives. Escape closes dialogs/panels and restores keyboard focus. Code never becomes 120px wide from excess docks.

## 9. Performance, safety, quality and release

Reference targets to measure, not promises: p95 keystroke input acknowledgement <50ms, responsive pan/zoom on normal projects, 60 fps target on modest canvases, no long main-thread codegen, no stale preview overwrite, minimal layout shift, bounded assets/output memory; test large files, 1000 layers, many graph nodes and cancellation under load. Lazy-load heavy Graph/Code/media, virtualize trees, debounce compile, version asset and renderer caches, offload costly analysis to workers where supported. Strict quotas across CPU, job count, media and storage; no secret leakage or arbitrary network/filesystem.

A release needs passing typecheck/build, backend isolation probes, source/visual/graph equivalence for supported subsets, keyboard/screen-reader, reduced motion, 320px to ultrawide, real MP4 metadata, cancellation, migration/export and rollback tests. Stage behind flag on an isolated workspace route. The old /studio stays until sign-off; only then switch default. Never delete /studio/legacy/code or /studio/legacy/visual automatically.

## 10. Implementation order

WS-00 audit/source/pin, WS-01 responsive shell + theme, WS-02 storage/migrations, WS-03 shared session + execution, WS-04 Visual, WS-05 Code, WS-06 Graph, WS-07 project/files/assets/templates, WS-08 media/timeline, WS-09 queue, WS-10 exhaustive claimed-feature parity, WS-11 performance/a11y/responsivity, WS-12 security and isolation, WS-13 browser/end-to-end and recovery, WS-14 staged launch, WS-15 production cutover, WS-16 postrelease support. Each has acceptance criteria and PR gates in EXECUTION_ROADMAP_AND_RELEASE_GATES.md.

## 11. Rules for future Work sessions

- Secure any current uncommitted changes before touching the workspace; isolate branch, no reset/clean.
- Read current runtime pin and source; generated historical matrices are NOT authority on new runtime.
- Do not resume old STUDIO-VISUAL-16 or STUDIO-PARITY-4 as parallel plans. Incorporate unmerged old PR changes only after checking conflicts and proofs.
- Every new control, node, file action and Run behavior is backed by tests and correct package imports. Do not fabricate demonstrations.
- Every design phase collects real screenshots at multiple widths and changes layout freely when observed usability demands, without losing agreed responsive/capability invariants.
- After each milestone: report commit, feature evidence, support status, unresolved issues, tests, screenshots, performance, fallback/rollback, and next gate.
