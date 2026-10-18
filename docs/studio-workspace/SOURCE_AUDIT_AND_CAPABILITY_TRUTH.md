# Unified Workspace Studio — Source Audit and Capability Truth

> Audit date: 2026-10-18
> Status: INITIAL SOURCE-BACKED AUDIT; NOT a freshly executed complete recursive parity scan.
> Authority: EIAS79/Apexify.js code at its pinned Studio dependency commit and EIAS79/Apexify.js-Documentation main.
> Do not market FULL engine coverage based on this audit alone. WS-00 must run exact current pin inventories and runtime test suite.

## A. Repositories and verified structure

**Apexify runtime:** lib-next/index.ts exposes ApexPainter plus types/runtime policy. lib-next/apex-painter/main.ts and creates/* compose createCanvas, createImage, createText, measureText, chart families, createScene, renderScene, createTemplate, createGIF/animate, createVideo, audio, batch/chain and output. Facets in lib-next/apex-painter/facets.ts expose detect, path2d, pixels and output transforms. Distinct implemented modules include lib-next/chart, image, path, pixels, scene, gif, audio-synth, video/operations, components, assets, plugins. This is SOURCE evidence of engine families, not a proof every nested option is reachable in all Studio modes.

**Web runtime:** Apexify.js packages/web/README.md explicitly describes @apexify/web as browser-native Canvas2D runtime; advertised entrypoints createApexifyWebRuntime, renderApexifyWebPreview, registerApexifyWebFonts and getApexifyWebCapabilities. Its separate retained-mode/realtime expansion roadmap is not assumed to be finished. Do not route a Node-only media operation to the browser merely because the Visual interface has a control.

**Studio Code:** components/studio/CodeStudio.tsx is a large dedicated React client, with syntax editing, multi-buffer tabs, runtime resolver, browser or full execution, asset shelf and preview history. lib/studio/runtime/capabilities.ts classifies method/facet families and excludes hosted host-persistence/external credential work. lib/studio/runtime/isolatedNodeExecutor.ts uses a restricted same-origin Deno child and media proxies for full-runtime. lib/studio/studioStorage.ts persists Code buffers/history in localStorage and migrates a legacy v1 shape.

**Studio Visual:** components/studio/visual/VisualStudio.tsx provides a crash boundary; VisualStudioPre4.tsx is the high-complexity authoring shell with viewport, panels, assets, direct manipulation, codegen and runtime preview. lib/studio/visual/model.ts defines VisualProject (schema 1, .apexstudio.json) with canvas, group, surface, image, shape, text, chart, path, component, scene, GIF/audio/video and generated-buffer node kinds. lib/studio/visual/compiler/*, codegen/* and reconcile.ts build operation plans/source and attempt supported reverse synchronization. Explicit parser errors for dynamic expressions show why arbitrary JS cannot be losslessly mapped to the Visual model.

**Existing shared session:** components/studio/StudioShell.tsx mounts CodeStudio and lazy-loads VisualStudio by mode. StudioSharedSession.tsx shares virtual assets, preview artifact IDs, errors, provenance, warnings, output tab, run history and code handoff. It is NOT a canonical multiproject file graph. Existing CodeStudio and VisualStudio states are therefore **not simply two skins of one editable model**.

**Asset limits:** lib/studio/runtime/assets.ts currently defines maxCount 12, maxBytesPerAsset 8 MiB and maxTotalBytes 24 MiB and uses an IndexedDB shelf. A UI design showing unlimited assets is misleading until increased caps and quota/resume proofs are implemented.

**Page route:** app/studio/page.tsx currently serves StudioShell. The legacy routes on the WS planning branch preserve the old code and visual components, with CSS imported at the route. They are separate entrypoints, not a migrated unified editor.

## B. Historic proof reconciliation

Current generated/studio/runtime-parity/gap-summary.json is Phase-0 historical:
- recorded audit runtime commit a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a;
- recorded installed Studio pin db96446ef51ede70febb03892d86b599483a4302 — the file itself flags a mismatch;
- 226 public surfaces, 69,501 recursive records, 0 FULL at baseline, 167 PARTIAL, 206 MISSING, 968 RUNTIME-ONLY, 68,247 UNKNOWN among combined status counts.
- This baseline predates later domain closures and also predates current project runtime pin changes. **Do not present those figures as current live limitations either.**

Later Phase 1/2/3 completion records report domain-specific proof; notably Phase-3 createText+measureText reports 1,739 FULL, 90 DEPRECATED-COMPAT and 32 RUNTIME-ONLY for its historical inventory. That does not establish broader package-wide FULL parity for the pinned current engine. Re-run scan-runtime, gap report and relevant domain comparators under current pin; reconcile newer runtime union options and validate browser/backend/artifact equivalence before using a FULL label.

Generated/studio/visual-capability-matrix.json and generated/studio/capability-matrix.json are valuable classification inventories; they are not by themselves proof of correct preview, per-leaf UI, round trips and export. Historical reports and generated docs may be overwritten by generators; preserve historical evidence and create new WS coverage reports rather than hand-edit machine-generated results.

## C. Baseline interfaces to adapt

| Existing source | Current responsibility | New WS strategy / danger |
|---|---|---|
| components/studio/StudioShell.tsx | top-level mode switching | legacy stays untouched; new /studio/workspace shell and shared project provider |
| components/studio/CodeStudio.tsx | rich Code execution | extract reusable editor and execution services, preserve behavior and history |
| components/studio/visual/VisualStudioPre4.tsx | Visual layers/inspector/viewport | incrementally extract controllers; avoid a full one-shot rewrite |
| components/studio/StudioSharedSession.tsx | assets/output/history | extend/rearchitect under WorkspaceProject with migrations |
| lib/studio/visual/model.ts | visual semantic schema | retain via adapter; new versioned workspace envelope |
| lib/studio/visual/compiler, codegen | generation & lowering | keep and prove deterministic exact source/runtime parity |
| lib/studio/visual/codegen/reconcile.ts | subset reverse sync | protect unsupported user JS and display loss boundaries |
| lib/studio/runtime/isolatedNodeExecutor.ts | bounded full-runtime | do not loosen network, file or process permissions |
| lib/studio/runtime/capabilities.ts | automatic backend routing | re-evaluate based on exact current engine implementation |
| lib/studio/runtime/assets.ts | asset DB and limits | import without losing ID mappings; volume/performance gate |
| lib/studio/studioStorage.ts | Code state and migration | read-only import into new project storage, never discard old key |
| lib/studio/visual/persistence.ts | visual project export/import | import original schema and preserve unknown fields until examined |
| scripts/studio/visual/* and scripts/studio/parity/* | proof suites | retain, run and gradually extend rather than delete |

## D. Required recursive capability record

Every Studio-visible operation should have a machine-readable record:

~~~json
{
  "id": "ApexPainter.createCanvas",
  "runtimeCommit": "<exact-sha>",
  "declarationPath": "<file and symbol>",
  "implementationPath": "<file and symbol>",
  "optionTree": "<recursive path and union variants>",
  "defaultsAndValidation": "<source and proof>",
  "backend": "browser | full-runtime | excluded",
  "uiOwner": "visual | code | graph | advanced",
  "visualModelPath": "<schema path or unsupported reason>",
  "graphNodeSchema": "<node type or none>",
  "sourceEmitter": "<generator path>",
  "reverseParser": "verified | partial | not-reversible",
  "previewEvidence": "<run identifier>",
  "artifactEvidence": "<hash/visual delta/typed result>",
  "persistenceEvidence": "<fixture>",
  "tests": ["<unit>", "<browser>", "<runtime>"],
  "support": "VERIFIED_FULL | VERIFIED_CODE_ONLY | VERIFIED_FULL_RUNTIME_ONLY | PARTIAL | WEB_APPROXIMATE | EXCLUDED_WITH_REASON | BLOCKED | UNKNOWN"
}
~~~

Complete option audits include nested object leaves, arrays, union variants, discriminated defaults, co-constraints, resource limits, validation errors, optional file/network restrictions and deprecated semantics. Studio must not flatten nested complex options merely to make the inspector simpler. Complex options may be authored with advanced validated JSON/schema editor, but should be declared as such rather than silently hidden.

## E. Coverage workstreams

1. Canvas/background/Pattern/noise/multi-source/transparentBase: declaration, runtime, Visual canvas inspector, browser path, real full preview, export and persistence. Test unexpected invalid options.
2. Images/shapes: all image effects/crop/resize/masks/gradients/transforms/blur/perspective/mesh, asset references, grouped image operations, copy/clone semantics and output.
3. Text/measure: batches, curved/affine/perspective group transforms, font asset registration, accuracy vs browser approximate metrics; retain Phase-3 proof fixtures.
4. Charts: all declared chart families, complex axis/legend/marker/labels, buffer composition, invalid data; never reduce to mock screenshot cards.
5. Paths and pixels: path2d draw/create/custom, detection facets, pixel read/write/manipulation and typed outputs. Provide advanced controls or code-only as justified.
6. Scene graph, components/templates and named assets: ordered layers, SceneBuilder defaults, cyclic refs, named $ refs and resolveAssetRefs defaults differing by method; compiler decisions must preserve resolution semantics.
7. Images utilities and outputs: masked image pipelines, conversion, compression, blend, crop/stitch, save alternatives with correct client-side download semantics.
8. GIF/animation/audio/video: finite real frames and durations, metadata and progressive preview; FFmpeg feature subsets, abort, time limits, safe parameters, asset bundling.
9. Batch/chain and plugins: real multi-output execution, resource quotas, dependency ordering; plugin APIs cannot imply unrestricted code execution in hosted Studio.
10. Browser-vs-server parity: @apexify/web supports only current documented subset; route fallbacks and warnings explicitly.
11. Engine roadmap changes: distinguish runtime features already shipped from future Phases 15–43 (retained-mode, interaction, intelligence, distributed workflows). A future feature is ROADMAP, not ENABLED.

## F. Current active work and conflict risks

At audit time the documentation repository had relevant unmerged pull requests:
- #140 (studio-parity-3-text-v2, text/measure rebuild): OPEN;
- #142 (studio font styles and curved text): OPEN;
- #131 (earlier studio-parity-3-text): DRAFT;
- #59 (studio session assets): OPEN.

Their changes are NOT destroyed or auto-merged. The old standalone Studio feature roadmap stops here; each PR needs explicit rebase/compare, source-backed relevance and migration decision before inclusion in WS. Do not claim the status of PRs means a background agent has been stopped. Do not close them silently; label/comment/defer where authorized and useful.

Other unrelated runtime engine and documentation plans remain unaffected.

## G. Gap priorities / red flags

P0: model divergence / loss of code or existing projects during switching; invalid runtime API from graph/codegen; arbitrary source execution outside sandbox; broken source→artifact export; corrupted offline project migration.
P1: incomplete exact runtime options; missing video metadata; asset storage limits and broken references; unsafe render queue concurrency; unreadable mobile inspector; keyboard trap; stale output incorrectly bound to new revision.
P2: visually distracting excessive panels; high bundle weight; poor workspace persistence; expensive previews or timeline scrolling.

Known local failure context: the recent Studio batch sample needed an explicit return of created buffers, and metadata errors previously dumped executor debug. Keep tests for no-artifact results and typed errors; do not assume all Code Studio samples return previewable artifacts.

## H. WS-00 audit procedure and exit gate

1. Resolve the exact current Docs dependency SHA (including package-lock and installed runtime) and compare it to Apexify.js source SHA; record package version, declarations hash, binary FFmpeg/Deno/web adapter pins. Do not infer exact version from current HEAD alone.
2. Generate full public recursive inventory per API domain and union variant; attach source map to package and Studio controls.
3. Map every relevant existing UI control, codegen, preview adapter, backend route, syntax parser and asset/persistence path.
4. Execute baseline sample suite separately for Code mode and Visual mode, on browser and isolated runtime, with screenshots and typed artifact comparisons.
5. Classify supported vs unsupported Graph projection operation families; explicitly prohibit unsupported dynamic reverse sync.
6. Audit projects/import/export, safe errors, sandbox, mobile/a11y and performance budgets; record baseline benchmarks.
7. Produce versioned coverage report with known uncertainty and prioritised P0/P1 backlog.
8. WS-00 cannot close until current pin matches evidence, open PR collision scan is signed off, and explicit no-data-loss migration plan is reviewed.

**Disposition:** architecture design may proceed on verified source families; NO production claim of complete parity is supported yet.
