# VideoStack advanced direct-operation domains — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.video.operations.*`

Public `painter.video` retains the advanced VideoStack, exposing a categorized VideoOperations surface. These low-level calls operate on video sources with explicit options and common VideoRunControls.

## Verified feature coverage

- Categorized FFmpeg operation classes
- Video metadata/probe/frame APIs
- Fine-grained manipulation without createVideo dispatcher
- Common process controls, temp-file management and cancel handling

## Public types, nested properties and options

### `VideoStack`

| Property / member | Type, accepted values or signature |
|---|---|
| `creator` | `VideoCreator` |
| `operations` | `VideoOperations` |
| `getVideoInfo(source,skipFfmpegCheck?)` | `normalized ffprobe metadata` |
| `videoPipeline(source?,initialLayers?)` | `VideoPipeline` |
| `extractFrames(source,options)` | `interval frames` |
| `extractAllFrames(source,options?)` | `all frame descriptors` |
| `extractFrameAtTime(source,time,format?,quality?)` | `PNG/JPEG Buffer` |
| `extractFrameByNumber(source,frameNumber,format?,quality?)` | `PNG/JPEG Buffer` |
| `extractMultipleFrames(source,times,format?,quality?)` | `Buffer[]` |

### `VideoOperations methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `runtime` | `VideoOperationRuntime` |
| `transcode` | `TranscodeOperations` |
| `merge` | `MergeOperations` |
| `overlays` | `OverlayOperations` |
| `audio` | `AudioOperations` |
| `frames` | `FrameOperations` |
| `structure` | `StructureOperations` |
| `advanced` | `AdvancedVideoOperations` |
| `getInfo(source,controls?)` | `video info` |
| `codec(source,controls?)` | `codec string` |
| `create(options)` | `Promise<unknown> (dispatcher)` |
| `describeOperation(options)` | `string` |

### `TranscodeOperations methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `convert(source,options,controls?)` | `video conversion` |
| `trim(source,{startTime,endTime,outputPath,mode?},controls?)` | `video cut` |
| `extractAudio(source,{outputPath,format?,bitrate?},controls?)` | `audio file` |
| `speed(source,{speed,outputPath},controls?)` | `speed adjust` |
| `effects(source,{filters,outputPath},controls?)` | `filters` |
| `rotate(source,{angle?,flip?,outputPath},controls?)` | `geometric rotation` |
| `crop(source,{x,y,width,height,outputPath},controls?)` | `crop` |
| `compress(source,{outputPath,quality?,targetSize?,maxBitrate?},controls?)` | `compress` |
| `fade(source,{fadeIn?,fadeOut?,outputPath},controls?)` | `transition fading` |
| `reverse(source,outputPath,controls?)` | `reverse video` |
| `removeAudio(source,outputPath,controls?)` | `strip audio` |
| `mute(source,{outputPath,ranges?},controls?)` | `mute intervals` |
| `adjustVolume(source,{outputPath,volume?,ranges?},controls?)` | `volume changes` |
| `normalizeAudio(source,{targetLevel?,method?,outputPath},controls?)` | `normalization` |
| `colorCorrect(source,{brightness?,contrast?,saturation?,hue?,temperature?,outputPath},controls?)` | `color grading` |

### `Merge / Overlay / Audio / Structure methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `merge.merge(options,controls?)` | `merge videos` |
| `merge.splitScreen(options,controls?)` | `side-by-side/top-bottom/grid` |
| `overlays.watermark(source,options,controls?)` | `watermark image` |
| `overlays.pictureInPicture(source,options,controls?)` | `picture-in-picture` |
| `overlays.text(source,VideoTextOverlayOperation,controls?)` | `timed captions` |
| `overlays.deprecatedText(source,options,controls?)` | `deprecated text` |
| `overlays.deprecatedAnimatedText(source,options,controls?)` | `deprecated animation` |
| `audio.mix(source,MixAudioOperation,controls?)` | `audio overlays` |
| `structure.replaceSegment(source,options,controls?)` | `region replacement` |

### `FrameOperations methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `extractOne(source,{time?,frame?,width?,height?,outputFormat?,quality?},controls?)` | `Promise<{buffer:Buffer;canvas:{width:number;height:number}}>` |
| `extractTimes(source,times,{outputFormat?,quality?}?,controls?)` | `Promise<Buffer[]>` |
| `extractInterval(source,{interval,frameSelection?,outputFormat?,quality?,outputDirectory?},controls?)` | `Promise<Array<{source:string;isRemote:boolean}>>` |
| `extractAll(source,{outputFormat?,outputDirectory?,quality?,prefix?,startTime?,endTime?}?,controls?)` | `Promise<Array<{source:string;frameNumber:number;time:number}>>` |
| `thumbnail(source,{count?,grid?,width?,height?,outputFormat?,quality?},controls?)` | `Promise<CanvasResults>` |
| `preview(source,{count?,outputDirectory?,outputFormat?,quality?},controls?)` | `Promise<Array<{source:string;frameNumber:number;time:number}>>` |
| `createFromFrames({frames,outputPath,fps?,format?,quality?,bitrate?,resolution?},controls?)` | `video encode` |

### `AdvancedVideoOperations methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `loop(source,{outputPath,smooth?},controls?)` | `create repeated video` |
| `detectScenes(source,{threshold?,outputPath?},controls?)` | `detect scene boundaries` |
| `stabilize(source,{outputPath,smoothing?},controls?)` | `FFmpeg vidstab (experimental)` |
| `freezeFrame(source,{time,duration,outputPath},controls?)` | `hold single frame` |
| `exportPreset(source,{preset,outputPath},controls?)` | `optimized export` |
| `applyLUT(source,{lutPath,intensity?,outputPath},controls?)` | `FFmpeg lut3d (experimental)` |
| `transition(source,{type,duration,direction?,secondVideo?,outputPath},controls?)` | `transition effect` |

### `VideoRunControls`

| Property / member | Type, accepted values or signature |
|---|---|
| `signal?` | `AbortSignal` |
| `timeoutMs?` | `number` |
| `overwrite?` | `boolean` |
| `onProgress?` | `(progress:{percent:number;time:number;speed:number})=>void` |

## Execution behavior, defaults and constraints

The lower-level `operations` member is available from `painter.video` but is not a separate npm root export. It is trusted Node functionality and is not a browser implementation. The `createVideo` high-level option schema is documented in `22_video_create_and_operations.md`. Different low-level operations return different result shapes; always refer to linked implementation functions for the exact result on paths not statically declared as explicit types.

## Source-of-truth files

- [`lib-next/video/video-stack.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-stack.ts)
- [`lib-next/video/video-operations.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-operations.ts)
- [`lib-next/video/operations/transcode.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/operations/transcode.ts)
- [`lib-next/video/operations/merge.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/operations/merge.ts)
- [`lib-next/video/operations/frames.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/operations/frames.ts)
- [`lib-next/video/operations/overlays.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/operations/overlays.ts)
- [`lib-next/video/operations/audio.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/operations/audio.ts)
- [`lib-next/video/operations/structure.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/operations/structure.ts)
- [`lib-next/video/operations/advanced.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/operations/advanced.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
