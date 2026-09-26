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
> - [x] STUDIO-7 GIF/animation/audio implementation complete: GIF result variants, animation frame collections, WAV metadata, full procedural-audio families, scene-to-GIF, media previews, and representative templates all use the real full-runtime path. Final execution proofs are deferred to the end-of-program validation pass.
> - [x] STUDIO-8 video implementation complete: pinned FFmpeg/ffprobe, narrowly mediated same-origin media subprocesses, createVideo/videoPipeline/probing/extraction/scene-video routing, video metadata/player UI, ordered frame collections, and representative templates are implemented. Final deployment/runtime proofs are deferred to the end-of-program validation pass.
> - [x] STUDIO-9 `@apexify/web` migration complete for Studio: the first-party browser runtime now lives in Apexify.js, Studio installs a commit-pinned integrity-checked source snapshot, browser runs call the package runtime/font manager directly, and the former local renderer is only a compatibility re-export. The broader Apexify.js Phase 20–25 retained/realtime program remains separate from this Studio migration.
> - [x] STUDIO-10 completeness gate implementation complete: declaration-driven routing coverage, nested public-handle inventory, per-capability proof status, representative option-family evidence, artifact-preview coverage, explicit contract exclusions, and a deterministic generated matrix are all implemented. Final browser/full-runtime execution/deployment validation remains intentionally deferred to the single end-of-program validation pass.
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
   |      - real @apexify/web package source
   |      - browser Canvas2D/image/chart/font execution
   |      - package capability inspection + lifecycle
   |
   +--> full Apexify runtime
          - same-origin isolated backend
          - real apexify.js package
          - native canvas/image stack
          - bounded temporary workspace
          - media-only FFmpeg/ffprobe proxy boundary for video
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

`lib/studio/browserPreview.ts` is now only a compatibility re-export. The browser renderer implementation is owned by `@apexify/web` in the Apexify.js repository and is installed into the documentation build as an integrity-checked commit-pinned source snapshot.

## 3. Non-goals

Studio does not need to reproduce a user's desktop filesystem.

Excluded from the Studio feature-completeness target:

- `save()` and `saveMultiple()` host persistence semantics;
- arbitrary writes to user-selected server paths;
- direct access to deployment secrets;
- credentialed third-party transfer helpers such as `painter.output.url()` (Imgur upload); Studio returns/downloads local artifacts instead;
- unrestricted host process / shell access.

Download/export of a produced Studio artifact is UI behavior, not Apexify filesystem persistence.

## 4. Security boundary

Public arbitrary JavaScript must never run in the documentation web process or an unsandboxed child process.

The full runtime path therefore has two modes:

1. **trusted-local development** — current explicitly enabled local runner;
2. **same-origin isolated execution** — production Studio requests stay on the documentation origin and are handed to a fresh restricted Deno subprocess.

No executor URL, API token, or browser credential is part of the Studio product architecture. The outer application route validates/orchestrates the run but does not evaluate Studio source. The isolated subprocess receives bounded filesystem/environment/FFI permissions, no arbitrary network permission, no general subprocess permission, a disposable workspace, and bounded CPU/memory/time/output. Video may execute only two immutable Studio-owned FFmpeg/ffprobe proxies.

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
- arbitrary outbound network and arbitrary subprocess execution are not granted; video receives only the two fixed Studio media proxies;
- full-runtime external media uses uploaded `studio://asset/<id>` files instead of general server egress;
- source, assets, stdout/stderr, output count, per-output bytes, aggregate output bytes, wall time, concurrency, and V8 heap are bounded;
- Linux `prlimit` CPU/address-space/file/process bounds are used when the host exposes them;
- every run uses a disposable workspace and cleanup occurs in `finally`;
- runtime/package identity remains traceable;
- host persistence APIs remain outside the Studio contract.

STUDIO-8 extends this boundary with a media-specific capability: Deno may execute only immutable Studio FFmpeg/ffprobe proxies, which constrain paths/protocols before forwarding to pinned binaries.

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

Phase-6 implementation no longer has an open coding item. Per the project execution policy, isolated-production execution proofs are deferred to the **final validation pass** rather than being run repeatedly during implementation. Those proofs remain deferred to the final end-to-end Studio validation pass.

Deliverables:

- all raster APIs have an execution path;
- every chart family has an execution path;
- generated chart/image/text/canvas buffers can feed later Apexify operations without losing identity;
- scenes/templates/components/assets work end-to-end in the real runtime path;
- structured Phase-6 results are inspectable rather than misclassified as media.

### STUDIO-7 — GIF, animation, and audio

Status: **implementation complete**.

Delivered:

- GIF magic/MIME detection and animated-image playback;
- GIF metadata extraction for dimensions, frame count, byte size and aggregate frame delay;
- artifact collection for public `createGIF()` result shapes including Buffer, data URL/base64 media, attachment objects, `{ gif, static }` composites and temporary file output;
- `animate()` frame Buffer arrays are classified as ordered frame collections;
- extracted frame records carry collection id, sequence index/count and available frame/time metadata;
- Studio preview includes a selectable frame rail;
- `renderSceneToGIF()` routes through the real Apexify runtime;
- WAV output receives sample-rate, channel-count, bit-depth, duration and byte metadata;
- audio artifacts use the native browser audio player plus runtime metadata;
- the complete procedural audio surface routes through the real runtime: `presetNames`, `listPresets()`, `preset()`, `synth()`, `custom()`, `sequence()`, `compose()`, and `mix()`;
- `createAudio.save()` remains excluded as host persistence;
- representative Studio templates cover GIF creation, animation frames, scene-to-GIF, preset audio, synth/custom audio, and sequence/compose/mix audio.

There is no remaining STUDIO-7 implementation item. Runtime proof/quality verification is deferred to the final validation pass.

### STUDIO-8 — Video

Status: **implementation complete**.

Delivered:

- video artifacts are MIME-detected and use the native Studio video player;
- browser video metadata supplies dimensions/duration in the output inspector;
- pinned Linux FFmpeg/ffprobe binaries are installed at build time under `vendor/studio-ffmpeg/`;
- the server trace includes the media binaries and immutable proxy programs;
- Apexify video calls receive `APEXIFY_FFMPEG_PATH` / `APEXIFY_FFPROBE_PATH` values pointing only to Studio-owned media proxies;
- Deno receives no general subprocess permission: its `--allow-run` list contains only those two proxies;
- each run gets a trusted outer-process media capability outside Deno's readable/writable workspace;
- proxies constrain paths to the disposable run workspace, reject traversal/external protocols/policy overrides/filter-script injection, validate concat lists, inject a `file,pipe` protocol whitelist, use `shell:false`, and launch pinned media binaries with a minimal environment;
- full-runtime external video input uses uploaded `studio://asset/<id>` media rather than unrestricted server egress;
- file-producing video result objects preserve scalar metadata while generated media becomes the preview artifact;
- frame extraction results are collected as ordered frame sequences with frame number/time metadata;
- frame Buffer arrays are grouped only for frame-producing APIs rather than blindly grouping arbitrary Buffer collections;
- the planner routes top-level video methods and the `painter.video` facade to the real runtime;
- representative Studio templates cover `createVideo({ createFromFrames })`, `videoPipeline()` with text/procedural audio, `getVideoInfo()`, `extractMultipleFrames()`, and `renderSceneToVideoFrames()`;
- MP4/WebM preview, structured metadata inspection and frame browsing use the unified artifact system.

There is no remaining STUDIO-8 implementation item. Media-binary/runtime execution proof and representative operation verification are deferred to the final validation pass.

### STUDIO-9 — @apexify/web migration

Status: **complete for Studio**.

Delivered:

- a real first-party `@apexify/web` package source now exists under `packages/web` in the Apexify.js repository;
- the package has zero runtime npm dependencies and does not import Node/native Apexify runtime code;
- Studio pins the browser package to Apexify.js commit `c8f131e210fa7072ba4a91e6331fc9296bbc63e0`;
- `scripts/studio/install-apexify-web.mjs` downloads only the required package files and verifies their exact Git blob SHA-1 identities before installation;
- the generated package snapshot lives under `vendor/apexify-web/` and is excluded from source control;
- TypeScript and webpack resolve the package through the real `@apexify/web` package identity;
- Studio's browser path creates an `ApexifyWebRuntime`, delegates browser font registration to the package, and executes browser previews through the package runtime;
- the runtime exposes browser capability inspection for Canvas2D, OffscreenCanvas, ImageBitmap, FontFace, Web Audio, WebCodecs and DPR;
- uploaded `studio://asset/<id>` image sources remain supported by the package browser renderer;
- remote browser images continue to use browser-native fetch/CORS behavior and bounded preview limits rather than a hidden proxy;
- stable browser chart families remain on the package browser path;
- advanced scenes, GIF/audio/video, image utilities, plugins, host-sensitive work and other Node/native semantics continue to route automatically to the same-origin isolated full runtime;
- `lib/studio/browserPreview.ts` no longer owns renderer logic and exists only as a backwards-compatible re-export;
- Studio UI/status/provenance language identifies `@apexify/web` rather than the legacy “Live Canvas” implementation name.

This completes the **Studio migration boundary**. It does not claim that the wider Apexify.js Phase 20–25 retained-mode/realtime renderer, React adapter, Next adapter, generalized browser animation system, worker architecture, or WebCodecs program is complete; those are engine-program phases outside STUDIO-9.

### STUDIO-10 — Completeness gate

Status: **implementation complete**.

Delivered:

- `scripts/studio/studio-completeness.ts` reads the installed pinned Apexify.js declaration instead of relying on a hand-copied top-level API list;
- all public `ApexPainter` manipulation methods are classified as browser, full-runtime, host-persistence exclusion, external-service exclusion, or introspection;
- member-level inventory covers `createAudio`, image utilities, hit detection, Path2D, pixels, output conversion, assets, plugins and the video facade;
- component factories are inventoried for badge/progressBar/avatar/card/watermark `toLayers()`;
- returned/reachable public handles are inventoried rather than stopping at the top-level facade:
  - `SceneBuilder`;
  - `TemplateHandle`;
  - `VideoPipeline`;
  - `VideoCreator`;
  - `VideoOperations`;
  - video transcode/merge/overlay/audio/frame/structure/advanced operation services;
- every executable manipulation capability receives a deterministic proof status and one or more proof-case ids from `scripts/studio/studio-proof-registry.ts`;
- representative option-family evidence covers canvas backgrounds, image sources, typography, every chart family, scenes/builders/components, templates, image utilities, path/pixels/hit testing, procedural audio, video, and structured/non-raster results;
- proof cases reference existing Studio templates where useful and static runtime/collector evidence where a dedicated user-facing template would add noise;
- required artifact kinds are cross-checked against both the unified artifact contract and Studio preview implementation;
- invalid proof-template references, invalid proof-case references, empty option-family proofs, unrouted methods/facets, and capabilities without a proof mapping make the completeness result fail;
- `generated/studio/capability-matrix.json` is schema v2 and records:
  - package/runtime identity;
  - top-level routes;
  - facet members;
  - component members;
  - nested public surfaces;
  - per-capability proof status;
  - representative option-family proofs;
  - proof coverage counts/gaps;
  - explicit Studio exclusions;
  - final-validation state;
- host persistence remains explicitly excluded:
  - `save()`;
  - `saveMultiple()`;
  - `createAudio.save()`;
- `output.url()` is now explicitly excluded as a credentialed Imgur/network transfer API rather than being falsely counted as executable inside the no-secret/no-egress Studio runtime;
- the execution planner reports contract-excluded operations before execution, so users receive a deterministic Studio message instead of a credential/network failure;
- `npm run studio:completeness` regenerates the evidence;
- `npm run studio:completeness:check` verifies the evidence is current;
- `npm run studio:verify` is the dedicated Studio completeness gate.

Implementation completeness and runtime validation are deliberately separate. The matrix may report **implementation complete** while its `finalRuntimeValidation.status` remains `deferred`. Per the project execution policy, representative browser/full-runtime/media execution, deployment proof and end-to-end quality gates run once in the final validation pass rather than being repeatedly executed during phase implementation.

A release is incomplete when a new public render/manipulation capability is absent from routing, proof mapping, artifact handling or an explicit product-contract exclusion.

## 8. Current implementation boundary

At the start of this program:

- browser execution uses the pinned first-party `@apexify/web` package; the old `browserPreview.ts` implementation has been retired to a compatibility re-export;
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
