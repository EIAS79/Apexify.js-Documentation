# Apexify Studio — Full Execution System Plan

> Status: ACTIVE — implementation started
>
> Current checkpoint:
> - [x] STUDIO-0 contract / capability planner
> - [x] STUDIO-1 artifact protocol and image/GIF/audio/video/text/JSON preview foundation
> - [x] STUDIO-2 automatic runtime selection in the Studio UI
> - [x] STUDIO-3 trusted-local full-runtime artifact runner foundation; intentional video block removed
> - [~] STUDIO-4 production isolated executor integration boundary (`STUDIO_EXECUTOR_URL`) is implemented; an isolated executor deployment/snapshot is still required before production full-runtime execution is enabled
> - [ ] STUDIO-5 virtual uploaded assets
> - [ ] STUDIO-6 full raster/chart/scene parity
> - [ ] STUDIO-7 GIF/animation/audio completion
> - [ ] STUDIO-8 video completion
> - [ ] STUDIO-9 real `@apexify/web` migration when that package/runtime ships
> - [ ] STUDIO-10 generated completeness gate
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
          - isolated executor
          - real apexify.js package
          - native canvas/image stack
          - FFmpeg/ffprobe when required
          - bounded temporary workspace
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
2. **isolated-remote execution** — production executor configured by `STUDIO_EXECUTOR_URL`.

The production executor must provide real isolation, bounded CPU/memory/time/output, a temporary workspace, restricted environment, and explicit network policy. A normal Vercel/Next child process is not considered isolation.

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

### STUDIO-4 — Production isolated executor

Deliverables:

- `STUDIO_EXECUTOR_URL` gateway;
- authenticated server-to-server calls;
- disposable isolated execution environments;
- Apexify package pinned to the documentation's authoritative package commit;
- FFmpeg/ffprobe;
- bounded workspace, CPU, memory, duration, network, and output.

No production full-runtime claim before this phase is deployed.

### STUDIO-5 — Virtual Studio assets

Deliverables:

- upload image/audio/video/font assets into a per-session virtual workspace;
- stable asset identifiers;
- URL assets;
- no dependency on caller filesystem paths;
- previews and re-runs reuse bounded assets.

### STUDIO-6 — Complete raster/chart/scene parity

Deliverables:

- all raster APIs execute;
- every chart family executes;
- generated chart/image/text buffers can feed later Apexify operations without losing identity;
- scenes/templates/components/assets work end-to-end.

### STUDIO-7 — GIF, animation, and audio

Deliverables:

- GIF playback;
- frame-sequence inspection;
- procedural audio playback;
- audio composition/mix output;
- deterministic diagnostics and limits.

### STUDIO-8 — Video

Deliverables:

- FFmpeg-backed video operations through isolated runtime;
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

Generate a Studio support matrix from the authoritative Apexify.js public surface.

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
