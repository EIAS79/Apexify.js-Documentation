# Apexify Studio — Full Execution System Plan

> Status: ACTIVE — implementation started
>
> Current checkpoint:
> - [x] STUDIO-0 contract / capability planner
> - [x] STUDIO-1 artifact protocol and image/GIF/audio/video/text/JSON preview foundation
> - [x] STUDIO-2 automatic runtime selection in the Studio UI
> - [x] STUDIO-3 trusted-local full-runtime artifact runner foundation; intentional video block removed
> - [x] STUDIO-4 same-origin isolated runtime complete: no external executor URL/token, no browser credential, one disposable restricted Deno subprocess per full-runtime run, pinned Apexify runtime, bounded resources, no arbitrary network/subprocess permission, and direct same-origin orchestration from /api/gallery/run.
> - [x] STUDIO-5 virtual assets complete: image/audio/video/font uploads, persistent IndexedDB asset storage, metadata/thumbnail UX, stable `studio://asset/<id>` references, cursor insertion, automatic browser/full-runtime font registration, browser bitmap resolution, and isolated-runtime materialization
> - [x] STUDIO-6 raster/chart/scene parity implementation complete: all Phase-6 families have an execution route, buffer identity is preserved through the real runtime, structured/non-raster results are collected safely, and representative Studio templates cover scenes/components/assets/templates, image utilities, path/pixels/detect, batch/chain, plus chart-buffer reuse. Isolated production execution proof is intentionally deferred to the final validation pass and STUDIO-4 deployment.
> - [~] STUDIO-7 GIF/animation/audio in progress: media-aware artifact collection and playable GIF/audio templates are implemented; isolated-runtime execution proofs remain
> - [~] STUDIO-8 video in progress: video/frame artifact discovery and an MP4 Studio template are implemented; production FFmpeg execution still depends on STUDIO-4
> - [ ] STUDIO-9 real `@apexify/web` migration when that package/runtime ships
> - [~] STUDIO-10 completeness matrix now covers top-level ApexPainter methods plus audio/image/detect/path/pixels/output/assets/plugins/video facet members and component factories; per-capability execution proofs remain
>
> Goal: make Studio an online Apexify.js coding and media-manipulation environment. A user writes normal Apexify.js code, presses **Run**, and Studio executes the required Apexify feature with the correct runtime and previews the result. Host-side persistence APIs such as `save()` / `saveMultiple()` are not part of the Studio execution target.

## 1. Product contract

Studio is not a four-method canvas demo and it is not a source-code visualizer.

The completion rule is:

> Every public Apexify.js API that creates, transforms, composes, measures, analyzes, animates, extracts, mixes, or renders media must have an executable Studio path and an appropriate preview/inspection surface.

The user does not choose Browser vs Node for normal use. Runtime routing is an implementation detail.

## 2. Runtime architecture

```text
editor source
   |
   v
capability analyzer
   |
   +--> browser-direct runtime
   |      - current Live Canvas compatibility renderer
   |      - replaced by @apexify/web as the browser engine lands
   |
   +--> full Apexify runtime
          - same-origin isolated backend
          - real apexify.js package
          - native canvas/image stack
          - bounded temporary workspace
          - video subprocess work remains owned by STUDIO-8
   |
   v
unified artifact protocol
   |
   +--> image / GIF preview
   +--> audio player
   +--> video player
   +--> frame collection
   +--> JSON / metadata inspector
   +--> text / diagnostics
```

The current `browserPreview.ts` is compatibility infrastructure only. It must not become a second implementation of the complete Apexify.js API.

## 3. Non-goals

Studio does not need to reproduce a user's desktop filesystem.

Excluded from the Studio feature-completeness target:

- `save()` and `saveMultiple()` host persistence semantics;
- arbitrary writes to user-selected server paths;
- direct access to deployment secrets;
- unrestricted host process / shell access.

Download/export of a produced Studio artifact is UI behavior, not Apexify filesystem persistence.

## 4. Security boundary

Public arbitrary JavaScript must never run in the documentation web process or an unsandboxed child process.

The full runtime path therefore has two modes:

1. **trusted-local development** — current explicitly enabled local runner;
2. **same-origin isolated execution** — production Studio requests stay on the documentation origin and are handed to a fresh restricted Deno subprocess.

No executor URL, API token, or browser credential is part of the Studio product architecture. The outer application route validates/orchestrates the run but does not evaluate Studio source. The isolated subprocess receives bounded filesystem/environment/FFI permissions, no arbitrary network permission, no subprocess permission, a disposable workspace, and bounded CPU/memory/time/output.

## 5. Unified artifact protocol

Every execution returns zero or more typed artifacts:

```text
image
gif
audio
video
json
text
binary
```

Each artifact has stable identity, name, MIME type, optional base64 payload or text payload, and optional metadata.

Multiple outputs are first-class. Frame extraction and batch operations must not be flattened into one fake image result.

## 6. Capability inventory

### Raster and composition

- createCanvas
- createImage
- createText
- measureText
- renderScene
- createScene / SceneBuilder
- nested surfaces
- patterns / gradients / noise / strokes / shadows / transforms
- remote images and Studio-provided assets

### Charts

- pie
- bar
- horizontalBar
- line
- scatter
- radar
- polarArea
- comparison charts
- combo charts
- chart buffers reused by createImage / scenes

### Images and geometry

- image utilities: resize, crop, filters/effects, blend, mask, gradient, collage, stitch, palette, conversion/compression
- path2d and custom lines
- pixel APIs
- hit detection

### Reuse / composition systems

- assets and $refs
- prepareForRender
- components
- templates
- plugins that are compatible with the selected isolated runtime
- batch / chain

### Motion and media

- createGIF
- animate
- renderSceneToGIF
- createAudio preset/synth/custom/sequence/compose/mix
- createVideo
- videoPipeline
- video metadata/probing
- frame extraction
- renderSceneToVideoFrames

## 7. Ordered implementation phases

### STUDIO-0 — Contract and inventory

Deliverables:

- this plan;
- explicit Studio capability inventory;
- automatic execution planner;
- no new feature may be called “Studio supported” without an execution path and preview path.

### STUDIO-1 — Unified artifacts and media preview

Deliverables:

- multi-artifact execution protocol;
- MIME detection;
- image/GIF/audio/video/text/JSON preview surfaces;
- current image output remains backward compatible;
- run history still records visual thumbnails when available.

### STUDIO-2 — Automatic runtime routing

Deliverables:

- remove normal Browser/Node decision from the user workflow;
- planner routes browser-compatible source to browser direct execution;
- planner routes advanced/full-runtime APIs to the full executor;
- unsupported-operation warnings are not accepted for APIs that have a full-runtime path.

### STUDIO-3 — Full local Apexify runner

Deliverables:

- trusted-local runner accepts the complete Apexify manipulation surface;
- audio buffers, GIFs, frame arrays, metadata, and file-producing video operations can be returned as artifacts;
- Studio runner no longer intentionally blocks video APIs;
- still explicitly local/trusted only.

### STUDIO-4 — Same-origin isolated runtime

Status: **complete**.

Delivered:

- Studio uses only the existing same-origin `/api/gallery/run` request path;
- no `STUDIO_EXECUTOR_URL`, no `STUDIO_EXECUTOR_TOKEN`, no external executor API, and no browser-visible runtime credential;
- production full-runtime runs are orchestrated directly by the documentation backend;
- every full-runtime execution starts a fresh restricted Deno subprocess rather than evaluating user code in the Next.js process;
- the Deno binary is installed at build time and included in the server trace;
- Apexify is pinned to the documentation's authoritative package commit;
- the subprocess receives read access only to the disposable workspace, installed dependencies, and system fonts;
- write access is restricted to the disposable workspace;
- environment access is restricted to non-secret Studio runtime paths;
- FFI access is restricted to the installed `@napi-rs` native addon directory;
- arbitrary outbound network and arbitrary subprocess execution are not granted;
- full-runtime external media uses uploaded `studio://asset/<id>` files instead of general server egress;
- source, assets, stdout/stderr, output count, per-output bytes, aggregate output bytes, wall time, concurrency, and V8 heap are bounded;
- Linux `prlimit` CPU/address-space/file/process bounds are used when the host exposes them;
- every run uses a disposable workspace and cleanup occurs in `finally`;
- runtime/package identity remains traceable;
- host persistence APIs remain outside the Studio contract.

Video/FFmpeg execution is intentionally not exposed through this general-purpose server sandbox. That media path remains owned by STUDIO-8 so video can be implemented without giving arbitrary Studio code a server subprocess capability.

### STUDIO-5 — Virtual Studio assets

Status: **complete**.

Delivered:

- image, audio, video, and font uploads in a session asset shelf;
- full-shelf drag/drop handling;
- bounded asset count, per-file bytes, and aggregate bytes;
- stable `studio://asset/<id>` references;
- one-click insertion of asset references directly at the editor cursor;
- image thumbnails plus captured image/video dimensions and audio/video duration where the browser can read metadata;
- IndexedDB persistence so uploaded assets survive normal page reloads without bloating localStorage/share links;
- browser-direct `createImage()`, `createCanvas().customBg`, bitmap `bgLayers`, and pattern layers resolve uploaded image assets without a network hop;
- browser-direct text rendering automatically registers uploaded font assets under a deterministic family derived from the filename;
- the asset shelf exposes/copies/inserts the exact font family developers should use in `font.family`;
- trusted-local and same-origin isolated full runtimes materialize assets only inside the disposable run workspace;
- the full-runtime wrapper automatically registers uploaded font files before user code executes;
- the same-origin isolated runtime receives the same bounded asset protocol and never depends on caller filesystem paths;
- asset bytes are deliberately excluded from Studio share links and ordinary localStorage state.

The virtual-asset reference model is now complete. Future media-specific waveform/timeline UI belongs to STUDIO-7/8 rather than this phase.

### STUDIO-6 — Complete raster/chart/scene parity

Status: **implementation complete**.

Delivered:

- full-runtime facet detection does not depend on the local variable being named `painter`;
- planner comment scanning preserves quoted `https://` media URLs instead of truncating the source at `//`;
- host-persistence rejection follows aliased `new ApexPainter()` instances;
- generated canvas/image/text buffers reused later as media sources route to the real full runtime so buffer identity is preserved;
- generated chart buffers remain browser-direct where Live Canvas has explicit assignment-identity mapping;
- every stable `createChart()` family has a browser execution path, while comparison/combo charts route to the real full runtime;
- scenes, SceneBuilder, nested surfaces, templates, components, named assets / `$refs`, `prepareForRender`, image utilities, Path2D, pixels, hit detection, batch, chain, output conversion, and compatible plugins route to the real Apexify runtime;
- the trusted-local full runtime exposes already-installed project dependencies inside the disposable execution workspace, allowing compatible plugin/helper imports without permitting runtime package installation;
- full-runtime artifact collection handles Buffer, typed arrays, ArrayBuffer, Blob, data URLs, generated files, scalar/JSON results, CanvasResults-like objects, multi-buffer arrays, metadata objects, and mixed visual + structured outputs;
- non-media arrays such as palettes, color-analysis results, asset listings, hit-test records, and component layer definitions remain structured JSON instead of being exploded into many fake artifacts;
- generated raster/media buffers receive MIME-aware filenames when the format is recognizable;
- Studio ships representative Phase-6 templates for:
  - SceneBuilder + nested surfaces + components + named assets;
  - templates + placeholders + named assets;
  - Path2D + pixels + hit detection;
  - image utilities + palette extraction;
  - batch + chain;
  - chart-buffer reuse inside `createImage()`.

Phase-6 implementation no longer has an open coding item. Per the project execution policy, isolated-production execution proofs are deferred to the **final validation pass** rather than being run repeatedly during implementation. Those proofs also depend on STUDIO-4's isolated executor being deployed.

Deliverables:

- all raster APIs have an execution path;
- every chart family has an execution path;
- generated chart/image/text/canvas buffers can feed later Apexify operations without losing identity;
- scenes/templates/components/assets work end-to-end in the real runtime path;
- structured Phase-6 results are inspectable rather than misclassified as media.

### STUDIO-7 — GIF, animation, and audio

Status: **in progress**.

Delivered:

- full-runtime artifact collection accepts Buffer, Uint8Array, ArrayBuffer, Blob, data URLs, arrays and nested result objects;
- GIF buffers are MIME-detected and use the animated image preview;
- WAV/audio buffers are MIME-detected and use the Studio audio player;
- frame arrays are emitted as multiple artifacts rather than flattened into one image;
- Studio includes real `createGIF()` and procedural `createAudio.preset()` templates.

Remaining:

- production execution proof through the isolated executor;
- representative `animate()`, audio `synth/custom/sequence/compose/mix`, and scene-to-GIF proofs;
- close any output metadata/diagnostic gaps found by those runs.

Deliverables:

- GIF playback;
- frame-sequence inspection;
- procedural audio playback;
- audio composition/mix output;
- deterministic diagnostics and limits.

### STUDIO-8 — Video

Status: **in progress, blocked on production isolation for final execution**.

Delivered:

- video artifacts are MIME-detected and use the native Studio video player;
- file-producing results with `outputPath` are collected automatically;
- frame extraction records with `source`, frame number and time now resolve to real frame artifacts while preserving metadata;
- duplicate file discovery is suppressed;
- Studio includes a real `createVideo({ createFromFrames })` MP4 template;
- JSON-returning video inspection APIs already land in the structured text/JSON preview path.

Remaining:

- implement the production video engine without granting the general-purpose same-origin sandbox arbitrary subprocess permission;
- execute `createVideo`, `videoPipeline`, metadata/probing, extraction, and scene-to-video representative cases through that media-specific path;
- verify MP4/WebM playback and bounded multi-frame output in production.

Deliverables:

- production video operations through the dedicated STUDIO-8 media path;
- MP4/WebM preview;
- frame extraction previews;
- metadata inspector;
- video pipeline support;
- scene-to-video workflows.

### STUDIO-9 — @apexify/web migration

As the browser-native renderer from the Apexify.js phases lands:

- replace browser source interpretation with the real browser package;
- use Canvas2D/OffscreenCanvas/ImageBitmap/FontFace/Web Audio/WebCodecs per the Browser Realtime Renderer specification;
- keep the full isolated runtime only for features that truly require Node/native/FFmpeg semantics.

### STUDIO-10 — Completeness gate

Status: **foundation implemented**.

Current implementation:

- `scripts/studio/studio-completeness.ts` reads the installed, pinned Apexify.js declaration rather than a hand-copied API list;
- it inventories public `ApexPainter` methods and top-level facets;
- every public manipulation method must be classified as browser-direct or full-runtime;
- `save()` / `saveMultiple()` are explicitly classified as host-persistence exclusions rather than silently omitted;
- the generated evidence is `generated/studio/capability-matrix.json`;
- `npm run studio:completeness` regenerates it and `npm run studio:completeness:check` verifies it on demand;
- this is intentionally not wired into the legacy documentation CI chain yet.

Additional coverage now implemented:

- member-level inventory for `createAudio`, image utilities, hit detection, Path2D, pixels, output conversion, named assets, plugins, and the video stack;
- component factory inventory for badge/progressBar/avatar/card/watermark `toLayers` surfaces;
- `createAudio.save()` is explicitly classified as a host-persistence exclusion.

Remaining:

- attach execution-proof status per capability and representative option family after the isolated executor is deployed;
- expand the generated matrix further if Apexify.js exposes new nested public classes beneath existing facets.

A release is incomplete when a new render/manipulation API is public in Apexify.js but absent from Studio capability routing, execution, or output handling.

## 8. Current implementation boundary

At the start of this program:

- browser execution supports a useful subset through `browserPreview.ts`;
- trusted-local execution exists but historically only accepted PNG/GIF and intentionally blocked video;
- production arbitrary execution is disabled;
- output UI is image-centric.

STUDIO-0 through STUDIO-3 are the first implementation batch.

## 9. Definition of done

The final Studio must satisfy all of the following:

1. one normal **Run** action;
2. automatic runtime selection;
3. real Apexify semantics rather than hand-emulated behavior wherever a real runtime is available;
4. no “unsupported” result for an Apexify manipulation feature covered by the full runtime;
5. correct media-specific preview;
6. multi-output support;
7. no host filesystem persistence requirement;
8. production arbitrary execution only inside a real isolation boundary;
9. package/runtime version traceability;
10. generated completeness evidence against the public Apexify.js API.
