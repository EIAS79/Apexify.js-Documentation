# VideoPipeline declarative layer operations — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.videoPipeline(source?, layers?)`

Declarative ordered FFmpeg editing plan. Layer kinds include source, trim, splice, text and audio. Existing IDs replace layers except text/audio overlays and tracks append by default unless `replace:true` is passed.

## Verified feature coverage

- Identified editable media layers
- Source/trim/splice/text/audio compositing
- Procedural presets and sequences mixed into video
- Track timing, pitch, fades, volume and pan
- Snapshot format version and render preset
- Returns actual operation execution plan and pass count

## Public types, nested properties and options

### `VideoPipelineLayerBase`

| Property / member | Type, accepted values or signature |
|---|---|
| `id?` | `string` |

### `VideoPipelineSourceLayer`

| Property / member | Type, accepted values or signature |
|---|---|
| `kind` | `"source"` |
| `source` | `string \| Buffer` |
| `id?` | `string` |

### `VideoPipelineTrimLayer`

| Property / member | Type, accepted values or signature |
|---|---|
| `kind` | `"trim"` |
| `startTime` | `number` |
| `endTime` | `number` |
| `id?` | `string` |

### `VideoPipelineSpliceLayer`

| Property / member | Type, accepted values or signature |
|---|---|
| `kind` | `"splice"` |
| `targetStartTime` | `number` |
| `targetEndTime` | `number` |
| `replacementVideo?` | `string \| Buffer` |
| `replacementStartTime?` | `number` |
| `replacementDuration?` | `number` |
| `replacementFrames?` | `Array<string\|Buffer>` |
| `replacementFps?` | `number` |
| `durationPolicy?` | `"fit" \| "trim" \| "preserve"` |
| `id?` | `string` |

### `VideoPipelineTextLayer`

| Property / member | Type, accepted values or signature |
|---|---|
| `kind` | `"text"` |
| `overlays` | `VideoTextOverlayClip[]` |
| `id?` | `string` |

### `VideoPipelineAudioLayer`

| Property / member | Type, accepted values or signature |
|---|---|
| `kind` | `"audio"` |
| `tracks` | `VideoPipelineAudioTrack[]` |
| `keepOriginalAudio?` | `boolean` |
| `originalVolume?` | `number` |
| `originalSpeed?` | `number` |
| `originalPitchSemitones?` | `number` |
| `durationPolicy?` | `"video" \| "shortest" \| "longest"` |
| `id?` | `string` |

### `Audio track type=file`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"file"` |
| `source` | `string \| Buffer` |
| `startTime` | `number` |
| `duration?` | `number` |
| `sourceStart?` | `number` |
| `volume?` | `number` |
| `speed?` | `number` |
| `pitchSemitones?` | `number` |
| `pan?` | `number` |
| `fadeIn?` | `number` |
| `fadeOut?` | `number` |

### `Audio track type=preset`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"preset"` |
| `preset` | `SynthPresetName` |
| `startTime` | `number` |
| `gain?` | `number` |
| `volume?` | `number` |
| `transpose?` | `number` |

### `Audio track type=synth`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"synth"` |
| `sound` | `SynthSoundOptions` |
| `startTime` | `number` |
| `gain?` | `number` |

### `Audio track type=sequence`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"sequence"` |
| `events` | `SynthSequenceEvent[]` |
| `startTime` | `number` |
| `tail?` | `number` |
| `masterGain?` | `number` |

### `Audio track type=wav`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"wav"` |
| `wav` | `Buffer` |
| `startTime` | `number` |
| `volume?` | `number` |

### `VideoPipelineSnapshot`

| Property / member | Type, accepted values or signature |
|---|---|
| `version?` | `1` |
| `layers` | `VideoPipelineLayer[]` |

### `VideoPipelineRenderOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `outputPath` | `string` |
| `preset?` | `"export" \| "preview"` |
| `signal?` | `AbortSignal` |
| `timeoutMs?` | `number` |
| `overwrite?` | `boolean` |
| `onProgress?` | `(progress:{percent:number;time:number;speed:number})=>void` |

### `VideoPipelineRenderResult`

| Property / member | Type, accepted values or signature |
|---|---|
| `outputPath` | `string` |
| `success` | `boolean` |
| `passes` | `number` |
| `executionPlan` | `string[]` |

### `VideoPipeline class methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `getLayers()` | `VideoPipelineLayer[]` |
| `toJSON()` | `VideoPipelineSnapshot` |
| `static fromJSON(operations,snapshot)` | `VideoPipeline` |
| `canUndo() / canRedo()` | `boolean` |
| `undo() / redo()` | `boolean` |
| `pushLayer(layer,{replace?}?)` | `this` |
| `source(source,id?)` | `this` |
| `trim(startTime,endTime,id?)` | `this` |
| `splice(options,id?)` | `this` |
| `text(overlays,id?)` | `this (same-id text appends by default)` |
| `audio(tracks,options?,id?)` | `this (same-id audio appends by default)` |
| `removeLayer(id)` | `this` |
| `clearLayers(kind?)` | `this` |
| `render(options)` | `Promise<VideoPipelineRenderResult>` |

## Execution behavior, defaults and constraints

The current pipeline parses its layers into an execution plan with source, optional trim, time-sorted splices, text overlays, then audio tracks. It is not an arbitrary timeline with full concurrent scene graph compositing. Recording `executionPlan` helps the workspace display actual jobs. `VideoPipeline` also has undo/redo (bounded to 256 history snapshots) and JSON serialization.

## Source-of-truth files

- [`lib-next/types/video-pipeline.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/video-pipeline.ts)
- [`lib-next/video/video-pipeline-builder.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-pipeline-builder.ts)
- [`lib-next/video/video-pipeline-render.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-pipeline-render.ts)
- [`lib-next/video/video-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-validation.ts)
- [`lib-next/video/video-phase8-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-phase8-validation.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
