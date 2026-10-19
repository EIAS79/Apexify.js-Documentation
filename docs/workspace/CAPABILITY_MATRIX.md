# Workspace Production Capability and Gap Matrix

**P0 — highest product priority. Baseline: PR #158, 2026-10-19.** This describes merged code; it excludes unvalidated WIP. No entire runtime domain is certified FULL.

PARTIAL means a real subset exists. NOT_STARTED means no dedicated merged authoring/execution flow exists. This index must be expanded recursively under A02/A04; method names and type counts alone do not establish parity.

| ID | Domain/public surface | Merged baseline | Required production completion | Workstream |
| --- | --- | --- | --- | --- |
| CAP-01 | createCanvas/backgrounds | PARTIAL: dimensions, color/linear gradient, transparency, uploaded/bundled image | All nested variants/defaults, patterns/layers, source/fit/alignment, validation and code parity | F |
| CAP-02 | createImage/shapes | PARTIAL: image, rectangle/circle, bounds/rotation/opacity/basic style | All source/shape variants, crop/fit, stroke/radius, transforms/compositing and interactions | H |
| CAP-03 | createText/measureText | PARTIAL: basic text/font/color/placement | Full typography/measurement, fonts, wrapping/auto-fit, styles/effects and multilingual behavior | G |
| CAP-04 | Chart APIs | PARTIAL: bar/pie | Every pinned family plus comparison/combo, full series/axes/legend options, data/bindings/interactions | J |
| CAP-05 | createScene/SceneBuilder/renderScene | NOT_STARTED | Hierarchy, all layer unions, surfaces, backgrounds, order, snapshots and builder operations | K |
| CAP-06 | Templates/layout/bindings | NOT_STARTED | Definition/instance, placeholders, refs, visibility, overrides/insertions, supported layout and diagnostics | K |
| CAP-07 | Component factories | NOT_STARTED | Badge/progressBar/avatar/card/watermark options, geometry, identity and scene fragments | K |
| CAP-08 | Assets/prepareForRender | PARTIAL: bundled/data-URL images | Named assets/values/palettes, resolution-default differences, dependency repair and manifests | L |
| CAP-09 | Path2D/custom paths | NOT_STARTED | Complete command unions/style/transforms/connectors and editable points/handles | I |
| CAP-10 | Pixels | NOT_STARTED | Region inspect/read/write/manipulate, true values, budgets and history | I |
| CAP-11 | Detect/hit testing | NOT_STARTED | Runtime path/region/distance semantics, transforms and precise selection | I |
| CAP-12 | Image utilities/effects | NOT_STARTED | All public helpers, masks/blend, effects, crop/resize/convert/compress/palette/collage/stitch | H |
| CAP-13 | GIF/animate/scene-to-GIF | NOT_STARTED | Frames/timeline, full options, streaming, overlays/disposal/transparency/timing and encoding proof | O, P |
| CAP-14 | Procedural audio | NOT_STARTED | Synth/presets/sequence/mix/compose/processing, all nested controls, waveform and real playback/export | Q |
| CAP-15 | Video/probe/extract/pipeline | NOT_STARTED | Complete public operation tree, clips/tracks/overlays/audio/geometry/encoding and deployed codec proof | R |
| CAP-16 | Batch/chain | NOT_STARTED | Operation variants, ordering/intermediate outputs, concurrency/cancel/failure policy and code parity | N, S |
| CAP-17 | Plugins/extensions | NOT_STARTED | Approved extension inspection/registration, schemas/version/capability contracts and isolation; no arbitrary host plugin load | B, U, X |
| CAP-18 | Output/toOutput/outPut/save/saveMultiple | PARTIAL: PNG, browser JPEG/WebP, JSON/source actions | Applicable output modes, actual MIME/alpha/color/quality semantics, virtual-file capture and portable bundles | S |
| CAP-19 | Realtime browser rendering | NOT_STARTED: server-PNG preview exists | Retained local surface, resources/dirty updates/DPR/worker lifecycle and explicit capability fallback | B, V |
| CAP-20 | Unified animation/interaction | NOT_STARTED | Shared evaluator, keyframes/transitions/easing/loops, reduced motion and deterministic media sampling | O |
| CAP-21 | Code authoring/execution | PARTIAL: generated program and canonical JSON apply | AST round trips, files/types/diagnostics, opaque-code preservation and approved isolated execution | M, U |
| CAP-22 | Graph authoring | PARTIAL: derived diagram/selection/render | Editable typed ports/nodes/dependencies, compiler/branches/cycles, saved graph and result parity | N |
| CAP-23 | Docking/UI | PARTIAL: nine panels plus responsive selector | Complete lifecycle/state/focus/touch/resize combinations, accessibility/responsive fidelity and restoration | D, E |
| CAP-24 | Jobs/preview/terminal | PARTIAL: static local jobs, actual PNGs, basic commands/logs | Media/code jobs, real lifecycle, durable execution when required, playback/artifact metadata | S |
| CAP-25 | Files/history/recovery | PARTIAL: local JSON/layout/draft, import/export, undo/redo | IndexedDB/assets, migrations, transactions, crash/quota/cross-tab recovery and portable backups | C, L, T |
| CAP-26 | Security/operations | PARTIAL: whitelist/body/origin/per-process caps | Threat model, sandbox, distributed admission, resource/cost/privacy controls and hosted proof | U, Y |
| CAP-27 | Quality evidence | PARTIAL: seven tests, isolated type/build and selected browser checks | Recursive parity, full-root CI, all-browser/a11y/device, adversarial/load/soak and release evidence | A, W, Z |
| CAP-28 | Presets/examples/catalogue | PARTIAL: one reference composition | Practical verified examples spanning domains, editable public code, output/artwork/font licenses and drift tests | K, X |
| CAP-29 | Editable frame collections | NOT_STARTED | Create/import/capture/extract, order/duplicate/holds, independent frame content and linked/override semantics, sequence manifests and timing | C, L, O, P |
| CAP-30 | Freehand doodles and authored lines | NOT_STARTED | Pointer/brush/stroke/eraser/point tools; serializable paths and proper connector API/units/gaps; frame-local editing | F, I, N |
| CAP-31 | Shared Style manager | NOT_STARTED: basic per-layer styling exists | Named color/gradient/pattern/text/stroke/effect styles, copy/link/local overrides, selected scope and correct cross-renderer translation | G, H, K |
| CAP-32 | Integrated multitrack media editor | NOT_STARTED | Dockable Timeline/Media Bin, clip/track/keyframe/frame/waveform editing, unified clock, Visual/Code/Graph parity and mixed-media exports | D, M, N, O, Q, R, S |

## Mandatory media authoring contract

The [shared media/timeline specification](MEDIA_TIMELINE_AND_AUTHORING_SPEC.md) defines the actual editor requirements and AC01–AC12. The [function-reference map](FUNCTION_REFERENCE_MAPPING.md) binds all supplied audits, current pin differences and source-level caveats. A settings modal, generated code alone, derived graph or sample GIF is insufficient for CAP-29–CAP-32.

## Recursive ledger contract

Each leaf/variant/interaction record must carry: stable ID; runtime commit/artifact/API/source and option path; types/defaults/constraints/conflicts; model path; UI control/structured editor; graph node/port or explicit reason; browser/Node/export support; emitter and reversible/opaque source behavior; schema/migration/history evidence; runtime/parity/browser/failure/resource tests; support status, owner and blockers.

Every collection supports applicable create/edit/remove/reorder. A field stored in JSON but ignored by rendering is PARTIAL. A generated code path with no source/runtime equivalence proof is PARTIAL. An unavailable browser feature must declare its isolated Node export route or unsupported boundary.

## Per-capability completion checklist

- Runtime defaults/validation/limits and union/array/interaction cases verified.
- Controls and data model implement real behavior, not a disabled toggle or simulated result.
- Visual, graph, generated program and executed results preserve supported semantics.
- Backends and export capability differences are documented and visible.
- Source/project downloads run outside this website with declared dependencies/assets/fonts.
- Reversible updates synchronize; unsupported edits remain intact and explicitly opaque.
- Save/load/migrate/undo/redo/panel-close/recovery preserve the option.
- Error/cancel/timeout/limits/cleanup paths run against actual work and artifacts.

## Future-engine dependencies

Portable core/IR/compiler/ARS, retained web rendering, framework adapters, Apex Style/layout, unified animation, advanced scheduling/typography/vector/color, cache/stream/acceleration, SDK, diagnostics/intelligence/AI and distributed rendering remain upstream capability tracks. Link each required adapter to its actual implemented API/version and tests. Do not invent unpublished imports or equate an existing preview adapter with the planned retained engine. Optional HDR/WebGPU/native/distributed/AI work needs explicit scope, compatibility, privacy and evidence decisions.

