# Standalone Apexify Workspace — A–Z Production Master Plan

| Field | Value |
| --- | --- |
| Program | AWP — independent workspace production program |
| Roadmap priority | **P0 — HIGHEST** |
| Decision date | 2026-10-19, Europe/Warsaw |
| Product route | `/workspace` |
| Repositories | `EIAS79/Apexify.js-Documentation` and upstream `EIAS79/Apexify.js` |
| Foundation | [PR #158](https://github.com/EIAS79/Apexify.js-Documentation/pull/158), merged |
| Runtime pin at foundation | `379a5248f09ed39c1b1734fe104b6bd73a77857f` |
| Production acceptance | **NOT ACCEPTED — program remains open** |
| Task ownership | Assign before execution; no person is implicitly assigned |

This is a concrete delivery contract for the new workspace. Finish the existing design in place. The future engine documents describe upstream architecture; they do not mean those packages/features already exist.

## 1. Product contract

Create, inspect, edit, execute, animate, export, save and recover Apexify compositions through connected Visual, Code and Graph views. Preview/Output display actual artifacts. Queue/Terminal report real work, progress and errors. The product requires no account.

Preserve the accepted dark/neon reference at `docs/design/workspace/reference.png`: tools/properties on the sides; canvas/code/graph and output windows in the working area. The original nine panels, including both sidebars, and the new Timeline and Frame Collection/Media Bin windows independently close, reopen, resize and maximize. Closing a window preserves its state and jobs while others reclaim its space. Permanent Panels and all-panels-closed recovery actions stay reachable.

Production means complete authoring behavior, accurate API semantics, responsive/accessible UI, reproducible code/output, persistence and recovery, isolation/resource controls, performance evidence, operational monitoring and verified deployment. A screenshot or API inventory alone is insufficient.

### Scope boundaries

- No login, profile, avatar, account system, dashboard or collaboration backend is required.
- Legacy Studio implementation stays outside this product. A later legacy-project importer needs an explicit versioned loss-aware contract.
- Terminal is a documented workspace command console. A remote OS shell, if later approved, requires isolated execution.
- Arbitrary JavaScript is not always reversible into visual/graph editing. Preserve unsupported code and identify exact synchronization boundaries.
- Browser and Node backends may differ. Record font/render/codec capabilities and tolerances; never silently claim pixel identity across unrelated backends.
- Cover the existing pinned v6 public surface deeply. Future engine-only HDR/WebGPU/native/distributed/AI features have separate versioned dependencies and scope decisions.
- Architecture decisions must precede new infrastructure/provider spending. P0 priority does not imply unlimited costs or waived release gates.

### Required frame and media authoring clarification — 2026-10-19

The [media/timeline authoring contract](MEDIA_TIMELINE_AND_AUTHORING_SPEC.md) is mandatory P0 scope. It specifies image/text/filter/layer/style/template editing, freehand doodles/lines, first-class editable frame collections and a shared multitrack timeline for GIF, animation, video and audio. Frame-local content edits, clip trim/split/ripple, keyframes, timed effects, waveforms/mixing, source timing and three-view synchronization need real controls and runtime evidence. Audio uses precise time/sample editing, rather than being forced onto video-frame boundaries.

The [function-reference map](FUNCTION_REFERENCE_MAPPING.md) binds all 14 supplied audits to tasks and caveats. Those audits use `cbeea053`; the actual package pin remains `379a5248`. A06/A07 reconcile differences before certification. This planning revision adds 40 concrete tasks (170 total), four capability rows (32 total), two mandatory gates (16 total) and 12 end-to-end media acceptance cases. No runtime feature is marked implemented by this revision.

## 2. Merged baseline and preservation

The original local foundation `245c49ffd2dcc417983110e182b4863d3a1ac768` and published commit `7d444469595a9ba02572d323d51b7851e7e2e0f0` have identical trees. PR #158 merged them as `a008940b57730c93893afd8dd1a473b02f0a75a5`.

| Area | Present in merged foundation | Still unproven or absent |
| --- | --- | --- |
| Ownership | New route/API/feature/assets directories; no Studio imports or account UI | Whole-app deployed integration |
| Docking | Nine independently closable/restorable/maximizable/resizable panels; space reclaim | Exhaustive remount state/focus/touch/viewport combinations |
| Visual | Basic backgrounds, text, image, rectangle/circle, bar/pie | Full nested options and remaining runtime domains |
| Code | Public-v6 program and canonical composition-JSON application | AST reconciliation and custom-code execution |
| Graph | Derived layer diagram, selection and render action | Editable typed nodes/ports/compiler/branches |
| Jobs/outputs | In-page sequential static jobs, actual PNG output, basic cancellation and console | Durable jobs, media, isolated code, distributed admission |
| Persistence | Local document/layout/draft storage, JSON import/export, bounded undo/redo | Asset database, schema migrations, cross-tab/quota/crash recovery |
| Evidence | Seven contract/runtime tests and isolated TypeScript check passed on exact foundation | Complete-app release gates and exhaustive runtime parity |
| Prior fixture/browser checks | Isolated Next production fixture, desktop interactions, 390x844 CSS viewport, real PNG download | Physical mobile, full root integration, all-browser/a11y, completed source-download verification |

The separate backup [codex/workspace-advanced-wip-20261019](https://github.com/EIAS79/Apexify.js-Documentation/tree/codex/workspace-advanced-wip-20261019), commit `209194cbe5d5b857c3aa7476127470cd5fae35bb`, preserves unfinished path/component/preset/graph/media additions. It is unvalidated reference material, not shipped support. A05 reviews it before any selective port.

A green check named `Vercel Preview Comments` only reports comment feedback; it is not build, browser, parity or production proof.

### Existing baseline commands

From a checkout with the pinned runtime installed and built:

```sh
node --import tsx --test tests/workspace/contracts.test.ts tests/workspace/runtime.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false --skipLibCheck --jsx preserve --target es2020 --module esnext --moduleResolution bundler --esModuleInterop --lib dom,dom.iterable,esnext features/apex-workspace/WorkspaceApp.tsx features/apex-workspace/server/render.ts
```

Root `npm run typecheck`, `npm run build` and `npm run verify` exist. Isolated success does not establish complete-app success. Reproduce baseline errors before attribution; fix relevant integration blockers without disabling gates, blanket exclusions or unrelated changes to Studio.

Suggested future `workspace:*` commands in the release document are tooling deliverables, not commands already installed by this plan.

## 3. Authority and recursive completeness

Use current owner decisions, verified runtime implementation/validation/defaults/limits, public exports, tests, approved workspace contracts, current docs, and historical reports in that order. Investigate contradictions instead of silently changing runtime semantics to match old UI or matrices.

Each capability record includes runtime commit/source/option path; legal/default/invalid values and union/array/interactions; model/UI/graph/code mapping; browser/Node/export capabilities; reversible vs opaque source behavior; persistence/migrations/history; resource/security policy; owner and executable evidence. Every discovered leaf/variant needs a disposition.

Completion chain:

`runtime → model/validation → controls/graph → real execution → generated source → artifact equivalence → supported reverse sync → persistence/history → failure/resource evidence`.

Use direct fields for common options, structured editors for collections/graphs/timelines and validated advanced editors for infrequent safe data. Advanced JSON is not arbitrary execution or a replacement for core UX. Collections need applicable create/edit/remove/reorder behavior.

Statuses: NOT_STARTED, IN_PROGRESS, BLOCKED, PARTIAL, FULL, EXPERIMENTAL, DEPRECATED, REMOVED. FULL requires evidence. Experimental or partial rows do not close a mandatory production requirement. A blocked item names the owner, missing prerequisite and next decision.

## 4. Architecture target

| Boundary | Owns | Invariant |
| --- | --- | --- |
| Shell | Docking, focus, menus, shortcuts, responsive UI | Project/assets/jobs survive panel mounts |
| Domain | Versioned project, scenes, graph, media, references, transactions | Portable data, stable IDs and validation |
| Authoring adapters | Canvas/inspector/graph/source reconciliation | Shared semantic model; opaque code preserved |
| Compiler | Normalize, refs, type/dependency/cost validation and plans | No evaluation of project data |
| Browser adapter | Retained surface/resources, interactions, timeline | No Node-native imports or server-PNG hot loop |
| Node adapter | Public-v6 rendering and bounded media export | Real outputs and deterministic semantics where promised |
| Code execution | Isolated programs, virtual inputs/outputs | Never host-process eval/vm of untrusted source |
| Jobs/artifacts | Admission, lifecycle, cancellation, metadata and retention | Actual events and cross-instance policy |
| Persistence | IndexedDB/assets/migrations/recovery | Atomic saves and explicit quotas without login |
| Capability registry | Audited runtime/support/evidence map | Drift fails verification |

Keep implementation in workspace-owned directories. Suggested responsibilities: `features/apex-workspace/{domain,compiler,runtime,execution,assets,persistence,commands,components}`, `app/api/workspace`, and workspace assets/tests. These are responsibility boundaries, not an instruction to create unnecessary packages. Portable engine behavior belongs upstream; editor behavior remains here.

Required ADRs: schema, AST grammar/sync, graph ports/execution/paint order, browser capability integration, custom-code isolation, media hosting/durable queues, storage/asset lifecycle and deployment/resource/cost budgets. The unimplemented browser-worker idea is not an approved full-Node sandbox.

## 5. Ordered delivery and dependencies

| Milestone | Workstreams | Exit |
| --- | --- | --- |
| M0 Foundation | PR #158 | UI/core landed; no production completion claim |
| M1 Contracts and guardrails | A, B, C, U; W begins | Audited baseline, schema, architecture and execution policy |
| M2 Editing and files | D–L; T begins | Coherent controls, assets, state/history/recovery |
| M3 Connected programming | M, N, O; S expands | Supported source/visual/graph round trips and shared animation |
| M4 Media | P, Q, R, S | Real GIF/audio/video/code jobs under enforced policy |
| M5 Hardening | T–Y | Security, resource, accessibility, browser and deployment evidence |
| M6 Acceptance | Z | All mandatory gates pass on the exact candidate |

U and W are continuous requirements, not end-stage cleanup. Dependencies mean the prerequisite contract is available; independent work may overlap with documented partial prerequisites, but closure requires all evidence. No sub-agent delegation is implied.

## 6. A–Z work packages

All 170 production tasks initially remain NOT_STARTED. Existing foundation evidence is separate from completion of these broader tasks. Assign an owner and exact scope before implementation; update `TASKS.json` and evidence in the same PR as the work.

### A — Authority, inventory and truthful baseline

Dependencies: none. Deliverable: Reproducible runtime-backed inventory and whole-app baseline.

- [ ] A01 — Record documentation SHA, runtime source SHA, installed artifact hash, Node/toolchain and deployment identity. Distinguish Git source, installed artifact and npm release tags.
- [ ] A02 — Recursively inventory every public v6 method/facet and nested object, union variant, array item, default, alias, deprecated option, callback, output mode, error and resource limit; verify runtime behavior against declarations.
- [ ] A03 — Reproduce whole-app typecheck/build/browser behavior on the base commit and workspace commit. Retain logs and minimal reproductions distinguishing existing failures from new-route failures.
- [ ] A04 — Create a machine-readable capability ledger linking each runtime path to source evidence, model/control/graph/code mappings, execution backends, persistence, tests, owner and support status.
- [ ] A05 — Review the preserved WIP branch file by file. Record usable code, defects and rejected approaches; port only reviewed pieces with their own evidence, rather than blindly cherry-picking the branch.

- [ ] A06 — Register the 14 supplied v6 function references with content hashes, static-audit status and baseline cbeea053; reconcile them against the actual installed 379a5248 runtime before certifying fields.
- [ ] A07 — Complete missing method-map domains from upstream source and reproduce reported semantics/gaps: videoBg still extraction, animate return/modes, GIF timing, audio rate/pitch, video dispatch, path units and connector limitations.

Acceptance: Every authorable public runtime path has a disposition; another engineer can recreate the baseline from pinned inputs.

### B — Architecture, ownership and runtime boundaries

Dependencies: A. Deliverable: Approved ADRs and independently testable workspace adapters.

- [ ] B01 — Define shell/domain/compiler/browser-runtime/Node-runtime/execution/job/assets/persistence interfaces. Split the large WorkspaceApp component along real responsibilities without fragmenting trivial utilities.
- [ ] B02 — Choose adapters from actual supported runtime contracts. Document browser capability negotiation and explicit fallbacks; do not assume a preview package implements the future retained renderer.
- [ ] B03 — Approve ADRs for canonical schema, reversible source grammar, graph semantics, custom-code isolation, media hosting/durability, asset storage and resource/cost budgets.
- [ ] B04 — Enforce dependency direction and import boundaries. New workspace modules must not import legacy Studio components, state, styles, execution adapters or generated completeness ledgers.
- [ ] B05 — Separate application work from upstream portable-core/IR/browser/animation/package work. Record exact upstream capability/version blockers and removal criteria for temporary adapters.

- [ ] B06 — Approve one shared media-editor architecture: reusable Timeline and Frame Collection/Media Bin windows, central transport/timebase, typed frame/clip/audio model and Visual/Code/Graph synchronization.
- [ ] B07 — Assign each new timeline/drawing/style helper to application or reusable Apexify engine ownership. Version upstream additions explicitly and generate only real public API calls or declared helper code.

Acceptance: Browser code has no Node-native/Studio dependency; editor-specific behavior and engine behavior have clear owners.

### C — Canonical project schema, validation and transactions

Dependencies: A, B. Deliverable: Versioned portable project format with migrations and atomic commands.

- [ ] C01 — Define stable IDs and serializable types for documents, scenes, layers, groups/surfaces, layout, assets, graph, animation/media tracks, bindings, source mappings and export settings.
- [ ] C02 — Implement whitelist validation for schema versions, finite values, unions, mutually exclusive options, references, graph cycles and aggregate resource budgets. Project data must never evaluate code.
- [ ] C03 — Add validated atomic commands/transactions, revisions, deterministic serialization and semantic identities. Separate authoring state, view state and derived execution artifacts.
- [ ] C04 — Migrate foundation schema version 1 without dropping values. Preserve newer/opaque values safely or reject with an exportable recovery path; test corrupt, truncated and incompatible inputs.
- [ ] C05 — Define portable project/asset manifests, supported forward/backward compatibility, dangling-reference repair and transaction behavior for code/graph/visual edits.

- [ ] C06 — Define rational project/source timebases, integer timestamps/sample mappings, nominal/variable fps, half-open clip ranges, holds, deterministic seek/sample and quantization policies.
- [ ] C07 — Define first-class frame collections, independent snapshots/linked instances/local overrides, clips/tracks/keyframes/strokes/styles and explicit frame/clip/source/range editing scope.

Acceptance: Valid projects round-trip without semantic loss; rejected imports leave the last valid revision intact.

### D — Docking, window lifecycle and layout

Dependencies: B, C. Deliverable: Reliable desktop, tablet and narrow-screen panel behavior.

- [ ] D01 — Complete close/reopen/maximize/restore for all nine panels and both sidebars. Hidden split branches release space and remaining windows expand without inaccessible gaps.
- [ ] D02 — Move editor selection/scroll, graph viewport/selection, terminal draft/history, inspector state, media controls and preview playback outside panel mounts. Test state across repeated closure/remount.
- [ ] D03 — Implement pointer/touch/keyboard resizing with minimum sizes, accessible separators, clamped persisted weights, focus restoration and predictable maximize/restore behavior.
- [ ] D04 — Add approved layout presets and configurable panel docking/movement if retained in the product contract. Recover meaningful layouts after viewport/orientation/window-size changes.
- [ ] D05 — Test every panel hidden, focused-panel closure, rendering during closure/resize, corrupted layout storage, multi-tab layouts and reset. Permanent Panels and restore actions always remain available.

- [ ] D06 — Add independently dockable Timeline and Frame Collection/Media Bin windows while preserving the approved static layout and permanent recovery controls. New media windows reclaim/release space like existing panels.
- [ ] D07 — Preserve playhead, frame/clip selection, timeline zoom/scroll/range, waveform/inspector context and transport state outside panel mounts; retain accessible playback actions with Timeline hidden.

Acceptance: Closing/restoring any panel preserves its content and jobs; all panel combinations remain recoverable.

### E — Visual fidelity, responsive UX and accessibility

Dependencies: B, D. Deliverable: Consistent, inclusive production UI that preserves the approved reference.

- [ ] E01 — Extract scoped dark/neon tokens for surfaces, cyan/violet/yellow accents, typography, spacing, borders and motion. Preserve the accepted layout and remove root-style/custom-cursor conflicts.
- [ ] E02 — Finish empty/loading/error/disabled/selected/busy/success states, validation messages, tooltips, overflow, long labels, dense toolbars and discoverable advanced controls.
- [ ] E03 — Define and test desktop/tablet/mobile behavior at 1920x1080, 1440x900, 1024x768, 768x1024, 390x844 and 360x800, including zoom, orientation and actual touch/device use.
- [ ] E04 — Audit landmarks, names/roles, focus order, dialogs/menus, shortcuts, resize controls and keyboard/screen-reader alternatives for canvas and graph content.
- [ ] E05 — Meet applicable WCAG 2.2 AA contrast, visible focus, target-size, zoom/reflow and reduced-motion requirements. Retain reference comparisons plus manual and automated accessibility findings.

- [ ] E06 — Design and verify familiar nonlinear media-editing interactions for mouse/touch/keyboard, precise numeric alternatives and narrow screens; maintain the existing visual language without claiming all CapCut features.

Acceptance: No inaccessible core workflow, clipped critical action or unrecoverable window; applicable WCAG 2.2 AA criteria pass.

### F — Canvas, transforms and layout tools

Dependencies: C, D, L. Deliverable: Complete canvas authoring and predictable spatial editing.

- [ ] F01 — Cover CanvasConfig recursively: dimensions, positions, transparency, colors/gradients, patterns, background sources/layers, fit/alignment, renderer options, defaults and limits.
- [ ] F02 — Implement selection/multi-select/marquee, resize/rotate handles, transform origins, snapping/guides/grids/rulers, coordinate readout, zoom-to-fit and pan with keyboard equivalents.
- [ ] F03 — Add align/distribute, stack order, locking, visibility, duplicate, grouping and supported surface/layout editing with logical-coordinate and DPR correctness.
- [ ] F04 — Handle negative/off-canvas positions, rotated bounds, aspect constraints, extreme sizes and numeric-field limits. Group continuous drag/resize into one history command.
- [ ] F05 — Prove each option/transform combination across controls, model, code, graph, runtime and persistence; make validation and unsupported backend behavior explicit.

- [ ] F06 — Make the normal canvas edit the explicit selected composition/frame/clip at the playhead. Show edit scope and transform target, and prevent edits from leaking to unlinked frames or unrelated clips.

Acceptance: Editing coordinates/transforms match exported results; pan/zoom never mutates document geometry or resolution.

### G — Text, fonts and measurement

Dependencies: C, F, L. Deliverable: Faithful text authoring and reproducible font/measurement behavior.

- [ ] G01 — Cover createText and measureText recursively: font/loading/family/size/weight/style, fill/stroke, placement/baseline/alignment, spacing, wrapping, bounds and measurement results.
- [ ] G02 — Add direct text editing, supported rich/multi-run content, max-width/overflow and auto-fit controls, shadows/effects and structured style editors without silent content loss.
- [ ] G03 — Test multiline, punctuation, combining marks, emoji, CJK, Arabic/RTL and mixed-direction text using actual runtime shaping capabilities and declared limitations.
- [ ] G04 — Make font resolution reproducible in browser/export: uploaded/embedded/referenced fonts, licensing metadata, fallback warnings, loading, cancellation and resource cleanup.
- [ ] G05 — Compare metrics and generated-source results over sizes, rotation, opacity, wrapping and missing fonts; document real backend metric differences rather than assuming identical glyph pixels.

- [ ] G06 — Support styled timed text/captions and frame-local typography through the shared inspector, timeline and code/graph mappings; preserve nested/legacy precedence and actual text metrics.

Acceptance: Supported typography survives round trips; missing fonts/shaping produce actionable diagnostics.

### H — Images, shapes and effect stacks

Dependencies: C, F, L. Deliverable: Deep image/shape controls and nondestructive effects.

- [ ] H01 — Cover all createImage source/shape variants, placement, crop/fit/alignment, borders/radii, stroke/fill, opacity, transforms, compositing and nested option interactions.
- [ ] H02 — Expose every pinned public image utility: resize/crop/convert/compress, filters/effects, masks/blend, palette, collage/stitch and other discovered methods with valid structured controls.
- [ ] H03 — Implement ordered editable/reorderable/bypassable effect stacks, alpha/color policies, incompatible-combination validation and meaningful export-conversion warnings.
- [ ] H04 — Decode uploaded assets under byte/pixel/frame limits, retain originals and support replace/relink. Remote and SVG sources require explicit policy; never allow implicit arbitrary filesystem/network access.
- [ ] H05 — Validate defaults/unions/arrays/interactions and generated-source parity, including transparent inputs, EXIF orientation, high-resolution sources, masks and malformed files.

- [ ] H06 — Expose object/frame/clip/range-scoped filter/style/effect stacks with actual pre/post order, grouping/masks/warp and supported keyframing; preview and exports must respect identical scope.

Acceptance: Controls alter actual output; alpha, effect ordering and source data survive serialization and failure handling.

### I — Paths, vectors, pixels and hit detection

Dependencies: C, F, H. Deliverable: Precise path tools, bounded pixel operations and honest selection semantics.

- [ ] I01 — Cover every PathCommand variant, custom connectors, fill/stroke, dashes/caps/joins, gradients, shadows and transforms; represent the full supported command union.
- [ ] I02 — Build point/control-handle editing, add/remove/reorder/open/close, bezier/primitive tools, coordinate fields and keyboard equivalents with atomic history.
- [ ] I03 — Expose pixel read/write/manipulate operations through bounded region editors, actual data previews, explicit costs and nondestructive recovery where applicable.
- [ ] I04 — Connect runtime hit tests to transforms, clipping and visibility. Distinguish exact path/region detection from a bounding-box selection approximation.
- [ ] I05 — Add only runtime-supported SVG/vector import/export subsets, sanitize active content/external refs, and register future vector-engine requirements separately.

- [ ] I06 — Implement freehand doodle tools with captured points, deterministic smoothing/optional pressure conversion, brush style, stroke/point editing, nondestructive or explicit object erasing and one-command undo per gesture.
- [ ] I07 — Respect actual path2d.create/draw/custom APIs, native-object serialization limits and mixed angle units. Reproduce connector bezier/shadow/marker/singleLine caveats and fix upstream or expose truthful boundaries.

Acceptance: Edited geometry/detectors match runtime behavior and remain editable after save/code/graph round trips.

### J — Charts, data and interactions

Dependencies: C, F, G, L. Deliverable: All pinned chart families and their complete authoring/data contracts.

- [ ] J01 — Inventory bar, horizontal bar, line, pie, scatter, radar, polar area, comparison and combo APIs with every series/data union, dimensions, axes, labels, legends and styling option.
- [ ] J02 — Create bounded data/series editors with insert/edit/delete/reorder, labels/colors, scales/ranges/ticks/formatting, validation and local CSV/JSON import.
- [ ] J03 — Implement supported transitions, tooltips, legends, selection and data updates. Identify browser-only interaction separately from static export behavior.
- [ ] J04 — Compile charts and bindings to valid public APIs with source maps; handle zero/negative/null/empty and large bounded data according to actual runtime contracts.
- [ ] J05 — Prove results/updates/accessibility summaries, source equivalence and persistence across all chart families and meaningful option interactions.

Acceptance: Every current chart family has audited editing, real output and accurate browser/static-export differences.

### K — Scenes, components, templates and layout

Dependencies: C, F, G, H, L. Deliverable: Reusable nested composition and a verified preset/example catalogue.

- [ ] K01 — Expose SceneBuilder/renderScene with scene hierarchy, all layer variants, surfaces/backgrounds/order/bounds/options, immutable snapshots and public builder operations.
- [ ] K02 — Add complete badge/progressBar/avatar/card/watermark editors with defaults, nested options, geometry constraints and preserved component identity.
- [ ] K03 — Implement immutable template definitions/instances, placeholders, typed bindings, visibility, overrides, insertions and named refs; diagnose missing/cyclic/mistyped inputs.
- [ ] K04 — Provide runtime-supported flex/grid/layout authoring and constraints. Negotiate future Apex Style/compiler capabilities rather than assuming arbitrary CSS compatibility.
- [ ] K05 — Ship practical editable presets/examples across all supported domains with real public-v6 code/output, asset/font attribution, customization tests and runtime drift checks.

- [ ] K06 — Add a shared Style manager for colors, gradient stops/handles, patterns, typography, strokes/shadows and effect stacks with explicit reference/copy/local-override behavior and renderer-specific type translation.
- [ ] K07 — Reuse scenes/templates/components inside editable frame collections and clips with clear linked-source versus make-unique/local-override behavior; do not pretend raster imports regain editable original layers.

Acceptance: Instances preserve bindings/identity and every shipped example executes against the pinned runtime.

### L — Assets, fonts, references and files

Dependencies: C, U. Deliverable: Workspace-owned file/asset registry and portable inputs.

- [ ] L01 — Build upload/import/replace/relink/delete around stable IDs, content hashes, metadata, usage/dependency references, thumbnails and safe garbage collection.
- [ ] L02 — Handle image/font/GIF/audio/video/source inputs with MIME/signature validation, byte/dimension/duration quotas, progress, cancellation and actionable decode errors.
- [ ] L03 — Resolve named assets/values/palettes, escaped dollar refs and templates consistently with runtime defaults; provide dependency inspection and broken-reference repair.
- [ ] L04 — Export a portable bundle containing project, artwork/fonts, source, runtime/dependency metadata and usage instructions. Remove undeclared website-relative artwork dependencies.
- [ ] L05 — Define transactional IndexedDB/blob storage, quotas, cache lifetime, cross-tab ownership, import atomicity and account-free offline/local workflows where supported.

- [ ] L06 — Build frame-collection create/import/capture/video-extract, natural ordering, duplicate/insert/delete/reorder/range selection, per-frame holds/provenance and bounded lazy thumbnails.
- [ ] L07 — Track originals/proxies/waveforms/thumbnails and source timestamps by stable hashes; support range extraction and relinking without confusing proxy frame indices with original PTS.

Acceptance: Projects run outside the website with all declared inputs; broken/deleted assets cannot silently corrupt dependents.

### M — Code editing, reverse synchronization and execution

Dependencies: B, C, L, U. Deliverable: Usable code-first programming and explicit reversible/opaque source boundaries.

- [ ] M01 — Specify and implement an AST-based reversible source subset with source spans/comments/stable IDs, diagnostics and exact unsupported-range reporting.
- [ ] M02 — Connect Visual/Graph-to-Code and supported Code-to-Visual/Graph through validated transactions; preserve opaque programs and drafts, and explicitly resolve destructive overwrites.
- [ ] M03 — Provide JS/TS editing, pinned API types/completion, formatting/diagnostics, files/imports, source-linked errors and runnable project/source downloads with assets.
- [ ] M04 — Implement the approved isolated custom-code environment with virtual files, bounded logs/artifacts, import/network/filesystem policies, hard deadlines/cancellation and CPU/memory/process limits.
- [ ] M05 — Test loops, async programs, supported imports, syntax/type/runtime failures, hangs/escapes, reload/panel closure and unsupported reverse-sync. Keep freeform programs distinct from declarative rendering.

- [ ] M06 — Prove editable frame/clip/stroke/style/timing/keyframe mappings across Visual, supported Code and Graph. Emit runnable public APIs and declared helpers/assets; never generate fictional timeline functions.
- [ ] M07 — Represent callback-only/native operations as safe declarative equivalents or preserved opaque isolated code. Verify media return shapes, overloads/defaults and source pin rather than trusting audit tables alone.

Acceptance: Generated programs agree with visual execution; custom programs run only in approved isolation and unsupported edits are preserved.

### N — Editable typed graph and compilation

Dependencies: B, C, M. Deliverable: Meaningful node programming that drives actual execution.

- [ ] N01 — Define semantic node/port types for inputs, canvas, text/image/path/chart/component/surface, transforms/effects, media, outputs and runtime-only capabilities.
- [ ] N02 — Implement create/delete/duplicate/connect/disconnect, movement/grouping/selection, pan/zoom/fit, keyboard operation, port validation and saved graph positions.
- [ ] N03 — Validate cycles, dangling refs, incompatible ports, missing inputs and aggregate costs; compile deterministic dependencies, explicit paint order, branches/composites and source maps.
- [ ] N04 — Connect graph edits to shared project/code and real runtime execution. Preserve unsupported custom source as opaque nodes/boundaries rather than inventing editable semantics.
- [ ] N05 — Test branches/composites, shared subgraphs, ordering, disconnected nodes, re-execution/cancellation and persistence; add accessible outline and inspectable runtime diagnostics.

- [ ] N06 — Add typed temporal graph nodes/ports for frame collections, scene/time samples, clips, property curves, audio events/mix and encode sinks, with explicit duration/unit/dependency semantics.
- [ ] N07 — Synchronize graph timing/order/effect edits with the same timeline and selected-frame scope; separate computation wires from artwork connectors and reject invalid temporal cycles/port combinations.

Acceptance: Reconnect/create operations change the compiled render; paint order/branches are specified and tested.

### O — Unified animation and timeline

Dependencies: B, C, N, V. Deliverable: Shared live/export animation evaluator and timeline editing.

- [ ] O01 — Align duration/delay, from/to, property keyframes, easing, repeats/direction, transition modes, callbacks and interruption with the first-party animation contract.
- [ ] O02 — Build tracks/clips/keyframes, play/pause/stop/seek, timeline zoom/snapping/ranges, playhead time, layer visibility and animation inspectors.
- [ ] O03 — Use one evaluator for browser playback and deterministic server sampling; support applicable number/color/angle/transform/gradient/path interpolation with explicit discrete fallbacks.
- [ ] O04 — Handle supported enter/leave/show/hide/update/active/resize/layout transitions, reduced motion, hidden tabs and frame coalescing without dropping final updates.
- [ ] O05 — Prove fixed-time samples, easing endpoints, loops/reversal/interruption, rapid edits/resource disposal and preview-vs-GIF/video sampled results.

- [ ] O06 — Implement shared multitrack clip editing: insert/move/duplicate/delete, trim/split/ripple/gaps/snapping, source offsets, linked AV and validated speed/reverse/overlap semantics.
- [ ] O07 — Implement independent per-frame content/exposure editing with filmstrip/frame stepping/onion skin and explicit linked-instance/unlink/override behavior; preserve original editable sources when baking animation to frames.
- [ ] O08 — Unify transport, playhead, work range/loop and keyframe/property curves across frame/GIF, animation, video and audio workflows; audio remains precise time/sample based, not video-frame quantized.
- [ ] O09 — Define deterministic fractional-fps/variable-source-PTS mapping, random-access seek, stale-result suppression, GIF timing quantization and audio/video drift policy through one canonical clock.

Acceptance: Seeking a time reproduces export semantics; final states survive interruption and reduced-motion policies.

### P — GIF authoring and encoding

Dependencies: O, L, S, U. Deliverable: Actual editable GIF workflows under resource policy.

- [ ] P01 — Cover createGIF/animate/scene-to-GIF input modes and options: dimensions, delays/durations, loops, disposal, transparency, quantization, overlays and generated/streaming frames.
- [ ] P02 — Support composition sampling and imported frame sequences with insert/edit/remove/reorder, previews and explicit GIF timing-rounding diagnostics.
- [ ] P03 — Integrate encoding with bounded jobs, progress/cancel/deadline/retention and supported streaming; avoid unbounded in-memory frame arrays.
- [ ] P04 — Validate decoded frame count/dimensions/timing/loop/disposal/transparency and selected-frame semantics; test corrupt inputs, cancellation and memory cleanup.
- [ ] P05 — Download playable GIFs and portable sources, persist settings/history and show actual encoded metadata/size and runtime limits.

- [ ] P06 — Render editable frame collections and sampled animation into true GIFs with per-frame holds/order/disposal/alpha/overlays, normal-vs-generated mode exclusivity, effective 10ms timing and decoded artifact tests.

Acceptance: Decoded GIF frames/metadata reflect timeline edits with bounded encoding memory and real lifecycle events.

### Q — Audio synthesis, sequencing and mixing

Dependencies: C, L, S, U. Deliverable: Real procedural audio authoring, playback and waveform tools.

- [ ] Q01 — Cover synth/preset/sequence/mix/compose and every public processing API, including layers/events/partials, waveform/frequency, ADSR, modulation/filter, pan, sample/channels and deterministic seeds.
- [ ] Q02 — Create waveform/clip/sequence editors with playback/scrub/zoom, event timing, gain/fades, mute/solo and preset customization; derive waveforms from decoded output.
- [ ] Q03 — Enforce duration/sample/event/byte budgets and browser autoplay rules; release AudioContexts, buffers, URLs and workers on cancellation/replacement.
- [ ] Q04 — Integrate audio tracks into media exports with declared mixing/resampling/timing behavior, sync metadata, deterministic seeds and saved project settings.
- [ ] Q05 — Check WAV headers, channels/sample count/rate/duration, clipping/gain, seeded determinism, sequence timing and cancellation with appropriate numerical tolerances.

- [ ] Q06 — Implement audio-only and mixed-media track/event/waveform authoring with native sample offsets, real decoded waveform, layered synth/presets/envelopes and clip trim/split/gain/fade/pan/mix.
- [ ] Q07 — Expose truthful rate/speed versus pitch behavior for synth and WAV sources; explicitly decode unsupported import containers, preserve seeds/resampling and verify final mixed audio/video sync.

Acceptance: Output samples/headers/timing match controls and the waveform comes from rendered audio rather than a decorative graphic.

### R — Video editing, encoding and pipeline

Dependencies: O, Q, L, S, U, Y. Deliverable: Deployed, bounded FFmpeg-backed video workflows.

- [ ] R01 — Inventory all createVideo/videoPipeline/probe/extract/scene-to-video operations: frame creation, convert/trim, geometry/effects, text/watermarks, audio, merge/splice, speed/fades and advanced variants.
- [ ] R02 — Build clip/track/timeline/operation editors with actual probe data/thumbnails, trim ranges, overlays/sync and output container/codec/quality/fps/resolution validation.
- [ ] R03 — Package and integrity-check compatible FFmpeg/ffprobe binaries and licensing metadata; choose serverless vs workers using measured timeout/memory/disk/payload constraints.
- [ ] R04 — Connect progress/cancellation/deadlines to actual process events, terminate process trees, isolate temporary files/protocols/paths and reclaim abandoned runs.
- [ ] R05 — Use ffprobe/decoded samples to check codec/container/fps/resolution/duration/timestamps/overlays/audio/sync; test unavailable codecs, corrupt media, full disk and abrupt termination.

- [ ] R06 — Integrate video tracks, frame collections, timed titles/doodles, range effects/transitions and audio tracks through actual ordered videoPipeline/verified operation compilation, not arbitrary dispatch-field composition.
- [ ] R07 — Extract/capture/select source video frames with exact PTS/provenance, frame-accurate trim semantics and VFR/proxy mapping; treat canvas videoBg as one still frame.

Acceptance: Actual hosted jobs produce valid probed/decoded video and terminate/clean resources reliably on failure.

### S — Jobs, terminal, preview and exports

Dependencies: B, C, U. Deliverable: Coherent real execution/artifact lifecycle across every view.

- [ ] S01 — Define queued/admitted/running/cancelling/cancelled/completed/failed/expired states, immutable input snapshots, source revisions, job IDs and timestamped provenance.
- [ ] S02 — Implement bounded admission/concurrency/fairness/backpressure, idempotent submit/retry and cancellation races; add durable workers/storage only when workload needs them and distinguish local from distributed quotas.
- [ ] S03 — Separate live composition, selected historical job and custom-code output. Preview image/GIF/audio/video/text with actual metadata, playback/error states and stale-revision indicators.
- [ ] S04 — Export every applicable output mode and portable project/source bundle with actual MIME/signatures, names/codec/quality/color/alpha semantics and completed browser-download checks.
- [ ] S05 — Expand the documented command registry with help/history/completion, actual logs/errors/job IDs and cancellation; preserve console state across closure without implying a host OS shell.

- [ ] S06 — Export current frame/selected range/full sequence/GIF/audio/video plus portable image-sequence manifests/source/projects; keep original-quality export distinct from lower-resolution playback proxies.

Acceptance: Queued snapshots are immutable; historical artifacts stay tied to their revision; cancellation/retry cannot report false completion.

### T — Persistence, history and recovery

Dependencies: C, L, S. Deliverable: Account-free durable local editing and explicit failure recovery.

- [ ] T01 — Use transactional IndexedDB/blob project/asset storage and separate small layout preferences; implement autosave revisions and visible saved/unsaved/error state.
- [ ] T02 — Implement bounded command-based undo/redo across visual/code/graph/assets/media, gesture coalescing, transactional redo and measured history memory.
- [ ] T03 — Recover interrupted saves/crashes/reloads/offline edits/source drafts; detect cross-tab revision conflicts and never silently overwrite newer work.
- [ ] T04 — Test schema upgrade/downgrade, corrupt/truncated data, quota/storage exhaustion, deleted assets and interrupted import/export using safe backups.
- [ ] T05 — Define artifact retention, safe resource reclamation, portable backups, explicit reset/delete, recovery export and user-facing storage/privacy controls.

- [ ] T06 — Make media commands/history/recovery preserve frame link/unlink/override relationships, strokes/styles/clips/keyframes, rational time maps and closed/reopened media-panel context.

Acceptance: Close/reload/crash/quota cases preserve the last committed work and visibly report save failures.

### U — Security, isolation, privacy and abuse controls

Dependencies: A, B. Deliverable: Reviewed trust model and enforceable account-free execution/resource policy.

- [ ] U01 — Threat-model public unauthenticated rendering, uploads/fonts/SVG/media, projects/source, plugins/dependencies, job submission and artifact access; identify every trust boundary.
- [ ] U02 — Enforce signatures and bytes/pixels/frames/items/graph-depth/operations/audio-video-duration/memory/CPU/disk/process/log/concurrency limits before expensive execution.
- [ ] U03 — Choose and test isolation outside the application server for custom code: deny host secrets/environment and arbitrary filesystem/network/process access; constrain imports and virtual inputs/outputs with hard termination.
- [ ] U04 — Add account-free cross-instance admission/rate/cost limits, origin/CORS/CSRF policy, anonymous job ownership, unpredictable artifact access and expiry; login remains out of scope.
- [ ] U05 — Test traversal, SSRF/redirects, decompression bombs, active SVG, pollution, sandbox escapes/runaway loops, cancellation races and stale/private artifact access; define patch/dependency-review procedures.

- [ ] U06 — Bound frame collections, source decode, extraction/proxy/seek/encode work and waveform/cache/process/temp costs; test cancellation/abandoned work and treat callbacks as isolated programs.

Acceptance: Malicious concurrent work cannot escape isolation, expose private inputs/secrets or evade cross-instance admission.

### V — Retained rendering, performance and resource lifecycle

Dependencies: B, C. Deliverable: Measured local interactivity with bounded resources.

- [ ] V01 — Integrate the retained browser renderer when its contract is ready: persistent decoded resources, dirty-node invalidation, coalescing, DPR/resize and direct presentation. Track server-PNG preview as temporary fallback.
- [ ] V02 — Negotiate Worker/OffscreenCanvas/browser capabilities with tested fallback and cleanup ownership for ImageBitmap/VideoFrame/audio/URLs/resources on cancel/remount/dispose.
- [ ] V03 — Benchmark named static/interactive/media workloads and ratify device/host-specific latency/frame-time/memory/cache/bundle/export budgets before performance acceptance.
- [ ] V04 — Add content-addressed caches, bounded image/font/decode caches, incremental compilation and streaming/backpressure; measure cache behavior and prohibit unbounded frame retention.
- [ ] V05 — Run repeated edit/resize/play/render/cancel/close soak tests plus hidden-tab/offline/low-memory scenarios; profile long tasks/leaks and preserve final updates.

- [ ] V06 — Measure random-access seek/preview latency and AV drift under bounded frame/waveform caches; invalidate stale jobs and ensure final export uses originals rather than proxy quality.

Acceptance: Supported edits render directly in-browser with measured latency/frame budgets and no unbounded resource growth.

### W — Testing, parity and acceptance evidence

Dependencies: A, B, C. Deliverable: Workspace-owned CI proving complete user-to-runtime flows.

- [ ] W01 — Implement schema/transaction/property/contract suites for compilers, graph order/types, keyframes, migrations, history, quotas and state machines.
- [ ] W02 — Differentially execute visual/graph compilation and generated public-v6 programs; compare browser/Node semantics using explicit font/codec/image/numeric tolerances.
- [ ] W03 — Automate Chromium/Firefox/WebKit core flows, completed downloads, visual regressions/accessibility; supplement with manual keyboard/screen-reader and real touch/device checks.
- [ ] W04 — Test real API origin/validation/size/rate/admission, sandbox execution, malformed imports, timeout/cancel/retry races, persistence faults and cleanup under concurrent load.
- [ ] W05 — Add inventory-drift/import-boundary/bundle-purity/full-root-build/domain-regression/performance/release-evidence gates with exact commands, fixtures, SHAs, environments and artifacts.

- [ ] W06 — Execute AC01–AC12 in the media-authoring specification: image/style/doodle, frame-local edits, NLE video, audio-only, three-view sync, panel/reload recovery and real portable outputs.
- [ ] W07 — Add supplied-reference coverage and API/pin reconciliation checks, media/time/unit/return/dispatch/callback regression tests and known connector-gap reproductions; no audit-only field can be certified FULL.

Acceptance: Mandatory capability rows have executable evidence; mocks, inventory counts or green comments do not substitute for real output.

### X — Diagnostics, documentation and maintenance

Dependencies: A, B, S. Deliverable: Actionable errors, privacy-conscious observability and reliable help/runbooks.

- [ ] X01 — Standardize stable error codes with source/node/layer/job IDs, validation/capability/execution/infrastructure classification, user context and recovery/retry guidance.
- [ ] X02 — Add redacted metrics/traces for admission, queue, render, resource limits, cancel/timeout, asset decode, persistence and export failures; do not log private content by default.
- [ ] X03 — Publish accurate feature help, shortcuts, synchronization boundaries, local storage/backups, export/runtime requirements and declared backend differences.
- [ ] X04 — Provide contributor ownership maps, adapter contracts, architecture ADRs, pin-upgrade/drift procedures, dependency/license inventory and migration/deprecation policy.
- [ ] X05 — Keep deterministic diagnostics and optional future intelligence/AI separate from rendering; require explicit capability/privacy decisions for provider integration or data egress.

- [ ] X06 — Document workspace media modes, frame-versus-sample time, edit scope/linkage, style overrides, proxy quality, rate/pitch and actual library/callback limitations without claiming a complete CapCut clone.

Acceptance: Users can recover failures and maintainers can trace jobs without exposing private source/media/secrets.

### Y — Full-app integration, deployment and operations

Dependencies: A, B, U. Deliverable: Reproducible hosted integration with monitoring and rollback.

- [ ] Y01 — Test the real app root layout/providers/global CSS/cursor/middleware/headers/routing, direct /workspace entry and other affected routes; do not rely on an isolated fixture.
- [ ] Y02 — Verify native/module/artwork/font/binary tracing, architecture/libc, compressed payload size, cold start, Node compatibility and CPU/memory/timeout/temp-disk limits.
- [ ] Y03 — Separate preview/staging/production config; establish secrets/CSP/runtime and binary integrity plus approved isolated-code/media infrastructure without credentials in generated programs.
- [ ] Y04 — Add capability/readiness probes, deploy-time real smoke jobs, monitors/alerts, retention/orphan cleanup, cost ceilings and tested rollback/recovery procedures.
- [ ] Y05 — Run deployed create/edit/sync/graph/render/media/download/save/reopen and cross-origin failure flows; record exact source/runtime/deployment identities, URLs and supported devices/browsers.

- [ ] Y06 — Prove deployed image/frame/GIF/animation/audio/video edit-to-export flows, mixed-track sync, original/proxy mapping and cancellation/resource cleanup using the exact release candidate.

Acceptance: The actual target deployment runs representative jobs under measured host limits and can recover/roll back.

### Z — Release acceptance, priority and future handoff

Dependencies: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y. Deliverable: Reviewed production acceptance and maintainable release ownership.

- [ ] Z01 — Reconcile every task/capability against intended production scope. Fix current v6 gaps or explicitly revise claims; mandatory partial/experimental rows cannot be counted FULL.
- [ ] Z02 — Run all release gates on the exact candidate: full-app, parity, UI/browser/download, accessibility, security/isolation, performance/load/soak, deployed jobs and rollback.
- [ ] Z03 — Publish an immutable release report with source/runtime/native identities, environments, evidence/artifacts, approved differences, residual risks and operational owners.
- [ ] Z04 — Promote only the accepted candidate, run post-release smoke, observe error/cost/performance budgets and rehearse rollback using a preserved previous release.
- [ ] Z05 — Transfer maintenance ownership and track future-engine follow-ups with exact capability/version prerequisites. Keep the P0 program open until production acceptance is recorded.

- [ ] Z06 — Require the media-authoring contract, AC01–AC12, supplied-function coverage and new G14/G15 gates before accepting frame/media/three-view production completeness.

Acceptance: Every mandatory gate passes on the exact promoted candidate, with no unresolved security/data-loss/release-blocking defect.

## 7. Performance and resource policy

These are proposed targets, not achieved measurements. V03 must ratify exact reference devices/browsers/projects/hosting and then enforce budgets.

| Workload | Proposed target | Measurement |
| --- | --- | --- |
| 100 simple visible nodes, warmed resources, supported desktop | 60 Hz target, P95 frame work ≤16.7 ms | Median/P95/P99, dropped frames and long tasks |
| Common inspector/selection edit | P95 visible response ≤50 ms | Input-to-present latency with network disabled for supported local operations |
| Animation/export time sample | Deterministic requested timestamp; preserve final state | Sample equivalence and interruption endpoints |
| Repeated open/edit/run/cancel/close | Stable warmed resources under explicit cache ceilings | JS/native/worker/GPU where measurable, object URLs, temp files/processes |
| Overloaded public queue | Bounded, fair admission with actionable rejection/retry | Across-instance queue wait, resource/cost/fairness data |
| Client/native/deployment payload | Explicit limits ratified from baseline | Client JS, trace bytes, cold start, CPU/memory/disk/duration |

Current foundation bounds—2048 dimensions, 64 layers, 6 MB requests and two active data renders per process—are facts, not final production policy. Per-process caps do not constitute distributed quotas. Do not silently raise limits to conceal failures.

## 8. Implementation and acceptance protocol

For each PR: select task/capability IDs and owner; verify runtime pin/contracts; state concrete input/result behavior and failure cases; implement model/controls/compiler/adapters/code/persistence as applicable; add actual runtime/browser/cleanup evidence; run affected checks plus required integration gates; update board/ledger; review/merge; observe deployment when runtime behavior changes.

A production feature needs the complete applicable chain in section 3. Safe Node-only capabilities may run through an isolated job with explicit backend identity. Never represent a fake browser approximation as full Node parity.

Foundation deployment is allowed as an incomplete application. Full v6 workspace acceptance requires the mandatory scope and all release gates. Future engine-only extensions remain explicit versioned follow-ups. No completion percentage or fixed date is inferred from this plan; recursive inventory, benchmark and isolation/media decisions determine realistic sizing.

## 9. Immediate next package

Begin A01–A07, B01–B07, U01–U03 and W01 scaffolding, then C06/C07 before timeline controls. Deliver the recursive inventory, full-app baseline, reviewed architecture and trust/resource decisions. Establish schema/asset/security foundations before expanding controls. Review WIP selectively; its existence does not prove any advanced feature is production-ready.

See [capability matrix](CAPABILITY_MATRIX.md), [release gates](RELEASE_GATES.md), [specification alignment](SPECIFICATION_ALIGNMENT.md), [task board](TASKS.json), and the repository [P0 priority notice](../../WORKSPACE_PRODUCTION_PRIORITY.md).

