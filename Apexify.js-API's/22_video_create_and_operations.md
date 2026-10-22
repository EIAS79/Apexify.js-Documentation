# Video creation and FFmpeg operations — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createVideo(options) / painter.video.operations / getVideoInfo / extract*`

FFmpeg/ffprobe-backed Node video operations. `createVideo` is an operation-dispatch object with source and optional operation fields; its result is `Promise<SceneToVideoResult>`.

## Verified feature coverage

- FFmpeg transcode/codec/format/pixel format options
- Frame capture, contact sheets and thumbnail extraction
- Trim, merge, replace, split screen, overlays and transitions
- Speed, rotation, cropping, freeze, loops, effects and LUT
- Audio track extraction, mixing, levels, fades and normalization
- Preview/export presets and FFmpeg progress/cancellation
- Structured ffprobe stream and container metadata

## Public types, nested properties and options

### `VideoSource / format / quality / fit`

| Property / member | Type, accepted values or signature |
|---|---|
| `VideoSource` | `string \| Buffer` |
| `VideoOutputFormat` | `"mp4" \| "webm" \| "avi" \| "mov" \| "mkv"` |
| `VideoQuality` | `"low" \| "medium" \| "high" \| "ultra"` |
| `VideoFit` | `"contain" \| "cover" \| "stretch"` |
| `VideoAudioPolicy` | `"preserve" \| "first" \| "mix" \| "none"` |

### `VideoOperationControls`

| Property / member | Type, accepted values or signature |
|---|---|
| `signal?` | `AbortSignal` |
| `timeoutMs?` | `number` |
| `overwrite?` | `boolean (default true for compatibility)` |
| `onProgress?` | `(progress:{percent:number;time:number;speed:number})=>void` |

### `VideoCreationOptions core`

| Property / member | Type, accepted values or signature |
|---|---|
| `source` | `string \| Buffer` |
| `getInfo?` | `boolean` |
| `detectFormat?` | `boolean` |
| `extractFrame?` | `{time?:number;frame?:number;width?:number;height?:number;outputFormat?:"jpg"\|"png";quality?:number}` |
| `extractFrames?` | `{times?:number[];interval?:number;frameSelection?:{start?:number;end?:number};outputFormat?:"jpg"\|"png";quality?:number;outputDirectory?:string}` |
| `extractAllFrames?` | `{outputFormat?:"jpg"\|"png";outputDirectory?:string;quality?:number;prefix?:string;startTime?:number;endTime?:number}` |
| `generateThumbnail?` | `{count?:number;grid?:{cols:number;rows:number};width?:number;height?:number;outputFormat?:"jpg"\|"png";quality?:number}` |
| `convert?` | `{outputPath:string;format?:VideoOutputFormat;videoCodec?:"libx264"\|"libx265"\|"libvpx-vp9"\|"libaom-av1"\|"copy";audioCodec?:"aac"\|"libopus"\|"libvorbis"\|"mp3"\|"copy"\|"none";pixelFormat?:"yuv420p"\|"yuv422p"\|"yuv444p"\|"rgba";quality?:VideoQuality;bitrate?:number;fps?:number;resolution?:{width?:number;height?:number;fit?:VideoFit}}` |
| `trim?` | `{startTime:number;endTime:number;outputPath:string;mode?:"accurate"\|"copy"}` |
| `extractAudio?` | `{outputPath:string;format?:"mp3"\|"wav"\|"aac"\|"ogg";bitrate?:number}` |
| `addWatermark?` | `{watermarkPath:VideoSource;position?:"top-left"\|"top-right"\|"bottom-left"\|"bottom-right"\|"center";opacity?:number;size?:{width?:number;height?:number;fit?:VideoFit};marginX?:number;marginY?:number;startTime?:number;endTime?:number;outputPath:string}` |
| `changeSpeed?` | `{speed:number;outputPath:string}` |
| `generatePreview?` | `{count?:number;outputDirectory?:string;outputFormat?:"jpg"\|"png";quality?:number}` |
| `applyEffects?` | `{filters:Array<{type:"blur"\|"brightness"\|"contrast"\|"saturation"\|"grayscale"\|"sepia"\|"invert"\|"sharpen"\|"noise";intensity?:number;value?:number}>;outputPath:string}` |
| `merge?` | `{videos:VideoSource[];outputPath:string;mode?:"sequential"\|"side-by-side"\|"grid";direction?:"horizontal"\|"vertical";grid?:VideoGrid;audioPolicy?:VideoAudioPolicy}` |
| `replaceSegment?` | `{replacementVideo?:VideoSource;replacementStartTime?:number;replacementDuration?:number;replacementFrames?:VideoSource[];replacementFps?:number;targetStartTime:number;targetEndTime:number;durationPolicy?:"fit"\|"trim"\|"preserve";outputPath:string}` |
| `rotate?` | `{angle?:90\|180\|270;flip?:"horizontal"\|"vertical"\|"both";outputPath:string}` |
| `crop?` | `{x:number;y:number;width:number;height:number;outputPath:string}` |
| `compress?` | `{outputPath:string;quality?:VideoQuality;targetSize?:number;maxBitrate?:number}` |
| `addText?` | `{text:string;position?:string;fontSize?:number;fontColor?:string;backgroundColor?:string;startTime?:number;endTime?:number;outputPath:string} (deprecated)` |
| `addFade?` | `{fadeIn?:number;fadeOut?:number;outputPath:string}` |
| `reverse?` | `{outputPath:string}` |
| `createLoop?` | `{outputPath:string;smooth?:boolean}` |
| `batch?` | `{videos:Array<{source:VideoSource;operations:Record<string,unknown>}>;outputDirectory:string} (experimental)` |
| `detectScenes?` | `{threshold?:number;outputPath?:string}` |
| `stabilize?` | `{outputPath:string;smoothing?:number} (experimental FFmpeg vidstab)` |
| `colorCorrect?` | `{brightness?:number;contrast?:number;saturation?:number;hue?:number;temperature?:number;outputPath:string}` |
| `pictureInPicture?` | `{overlayVideo:VideoSource;position?:"top-left"\|"top-right"\|"bottom-left"\|"bottom-right"\|"center";size?:{width?:number;height?:number;fit?:VideoFit};opacity?:number;outputPath:string}` |
| `splitScreen?` | `{videos:VideoSource[];layout?:"side-by-side"\|"top-bottom"\|"grid";grid?:VideoGrid;audioPolicy?:VideoAudioPolicy;outputPath:string}` |
| `createTimeLapse?` | `{speed?:number;outputPath:string}` |
| `removeAudio?` | `{outputPath:string}` |
| `mixAudio?` | `MixAudioOperation` |
| `mute?` | `{outputPath:string;ranges?:Array<{start:number;end:number}>}` |
| `adjustVolume?` | `{outputPath:string;volume?:number;ranges?:Array<{start:number;end:number;volume:number;speed?:number;pitchSemitones?:number}>}` |
| `createFromFrames?` | `{frames:VideoSource[];outputPath:string;fps?:number;format?:VideoOutputFormat;quality?:VideoQuality;bitrate?:number;resolution?:{width?:number;height?:number;fit?:VideoFit}}` |
| `freezeFrame?` | `{time:number;duration:number;outputPath:string}` |
| `exportPreset?` | `{preset:"youtube"\|"instagram"\|"tiktok"\|"twitter"\|"facebook"\|"4k"\|"1080p"\|"720p"\|"mobile"\|"web";outputPath:string}` |
| `normalizeAudio?` | `{targetLevel?:number;method?:"peak"\|"rms"\|"lufs";outputPath:string}` |
| `applyLUT?` | `{lutPath:string;intensity?:number;outputPath:string} (experimental FFmpeg lut3d)` |
| `addTransition?` | `{type:"fade"\|"wipe"\|"slide"\|"zoom"\|"rotate"\|"dissolve"\|"blur"\|"circle"\|"pixelize";duration:number;direction?:"left"\|"right"\|"up"\|"down"\|"in"\|"out";secondVideo?:VideoSource;outputPath:string}` |
| `addTextOverlay?` | `VideoTextOverlayOperation` |
| `addAnimatedText?` | `{text:string;animation?:"fadeIn"\|"fadeOut"\|"slideIn"\|"slideOut"\|"typewriter"\|"bounce"\|"zoom"\|"rotate";startTime:number;endTime:number;position?:{x:number;y:number}\|string;fontSize?:number;fontColor?:string;fontPath?:string;fontName?:string;fontFamily?:string;backgroundColor?:string;outputPath:string} (deprecated)` |
| `controls?` | `inherited VideoOperationControls: signal, timeoutMs, overwrite, onProgress` |

### `VideoGrid (inline option shape)`

| Property / member | Type, accepted values or signature |
|---|---|
| `cols?` | `number` |
| `rows?` | `number` |
| `cellWidth?` | `number` |
| `cellHeight?` | `number` |
| `gap?` | `number` |
| `background?` | `string` |

### `MixAudioOverlayClip`

| Property / member | Type, accepted values or signature |
|---|---|
| `source` | `VideoSource` |
| `startTime` | `number` |
| `duration?` | `number` |
| `sourceStart?` | `number` |
| `volume?` | `number` |
| `speed?` | `number` |
| `pitchSemitones?` | `number` |
| `pan?` | `number (-1..1)` |
| `fadeIn?` | `number` |
| `fadeOut?` | `number` |

### `MixAudioOperation`

| Property / member | Type, accepted values or signature |
|---|---|
| `outputPath` | `string` |
| `overlays` | `MixAudioOverlayClip[]` |
| `keepOriginalAudio?` | `boolean` |
| `originalVolume?` | `number` |
| `originalSpeed?` | `number` |
| `originalPitchSemitones?` | `number` |
| `durationPolicy?` | `"video" \| "shortest" \| "longest"` |

### `ExtractFramesOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `outputDirectory?` | `string` |
| `interval` | `number` |
| `outputFormat?` | `"jpg" \| "png"` |
| `frameSelection?` | `{start?:number;end?:number}` |
| `watermark?` | `string` |

### `VideoProbeMetadata`

| Property / member | Type, accepted values or signature |
|---|---|
| `duration` | `number` |
| `width` | `number` |
| `height` | `number` |
| `fps` | `number` |
| `bitrate` | `number` |
| `format` | `string (alias container)` |
| `container` | `string` |
| `containerLongName?` | `string` |
| `codec` | `string` |
| `pixelFormat?` | `string` |
| `audio` | `boolean` |
| `audioCodec?` | `string` |
| `audioStreams` | `number` |
| `streams` | `VideoProbeStream[]` |
| `size?` | `number` |

### `VideoProbeStream`

| Property / member | Type, accepted values or signature |
|---|---|
| `index` | `number` |
| `type` | `"video" \| "audio" \| "subtitle" \| "data" \| "attachment" \| "unknown"` |
| `codec` | `string` |
| `codecLongName?` | `string` |
| `profile?` | `string` |
| `width?` | `number` |
| `height?` | `number` |
| `fps?` | `number` |
| `bitrate?` | `number` |
| `pixelFormat?` | `string` |
| `sampleRate?` | `number` |
| `channels?` | `number` |
| `channelLayout?` | `string` |
| `duration?` | `number` |

### `Public video helper methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `getVideoInfo(source,skipFfmpegCheck?)` | `Promise<VideoProbeMetadata>` |
| `extractFrames(source,options)` | `promise result (see VideoStack implementation)` |
| `extractAllFrames(source,options?)` | `promise result` |
| `extractFrameAtTime(source,time,format?,quality?)` | `Promise<Buffer>` |
| `extractFrameByNumber(source,frameNumber,format?,quality?)` | `Promise<Buffer>` |
| `extractMultipleFrames(source,times,format?,quality?)` | `Promise<Buffer[]>` |
| `videoPipeline(source?,initialLayers?)` | `VideoPipeline` |
| `video` | `VideoStack (creator, operations)` |

## Execution behavior, defaults and constraints

Operations use an argv-only FFmpeg/ffprobe process runner with shell disabled, bounded output, timeout, abort and temporary workspace control. FFmpeg/ffprobe must be separately installed and discoverable. Some operations are marked experimental or deprecated in source. A `VideoCreationOptions` object is a dispatch format; do not assume all nested operations are executed together or arbitrarily composable. For complex ordered editing use `videoPipeline`.

## Implementation notes and audit findings

**Security boundary:** Structured API input is validated, but passing untrusted project paths, remote media URLs or output locations into a trusted Node process still requires application-level file authorization and per-job isolation.

## Source-of-truth files

- [`lib-next/video/video-options.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-options.ts)
- [`lib-next/types/video.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/video.ts)
- [`lib-next/video/video-stack.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-stack.ts)
- [`lib-next/video/video-operations.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-operations.ts)
- [`lib-next/video/video-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-creator.ts)
- [`lib-next/video/video-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-validation.ts)
- [`lib-next/video/process-runner.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/process-runner.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
