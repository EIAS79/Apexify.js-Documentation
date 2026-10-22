# createGIF, GIF encoding and streaming frames — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createGIF(gifFrames?, options, painterOpts?)`

GIF creation from existing raster frames or generated frame callbacks, including memory-bounded `AsyncIterable` mode.

## Verified feature coverage

- Frames from buffer/file/data URL/remote URL
- Generated arrays or incremental async frame streams
- Repeat, delay, quantization quality and disposal
- Watermark and static text overlay
- Abort during generation/network/encoding

## Public types, nested properties and options

### `GIFOutputFormat`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"file" \| "base64" \| "attachment" \| "buffer"` |

### `GIFFrameSource`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `string \| Buffer \| Uint8Array \| URL` |

### `GIFDisposalMethod`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `0 \| 1 \| 2 \| 3` |

### `GIFInputFrame`

| Property / member | Type, accepted values or signature |
|---|---|
| `duration?` | `number (ms)` |
| `buffer?` | `GIFFrameSource (exactly one of buffer/background)` |
| `background?` | `GIFFrameSource` |
| `dispose?` | `GIFDisposalMethod` |
| `transparentColor?` | `number \| string \| null` |
| `watermark?` | `GIFWatermarkSpec` |

### `GIFEncodedFrame`

| Property / member | Type, accepted values or signature |
|---|---|
| `buffer` | `GIFFrameSource` |
| `duration?` | `number` |
| `dispose?` | `GIFDisposalMethod` |
| `transparentColor?` | `number \| string \| null` |
| `watermark?` | `GIFWatermarkSpec` |

### `GIFOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `outputFormat` | `GIFOutputFormat` |
| `outputFile?` | `string` |
| `attachmentName?` | `string` |
| `width?` | `number` |
| `height?` | `number` |
| `repeat?` | `number (-1 once; 0 forever; positive finite repeats)` |
| `quality?` | `number (1..30; default 10)` |
| `delay?` | `number (ms; default 100)` |
| `watermark?` | `GIFWatermarkSpec` |
| `transparentColor?` | `number \| string \| null` |
| `defaultDispose?` | `GIFDisposalMethod` |
| `textOverlay?` | `GIFTextOverlaySpec` |
| `skipResizeWhenDimensionsMatch?` | `boolean` |
| `onStart?` | `(frameCountHint:number,painter:unknown)=>Promise<GIFEncodedFrame[]\|AsyncIterable<GIFEncodedFrame>>` |
| `frameCount?` | `number` |
| `duration?` | `number (ms; generated mode)` |
| `onEnd?` | `(finalFrameBuffer:Buffer,painter:unknown)=>Promise<Buffer\|undefined>` |
| `signal?` | `AbortSignal` |

### `GIFWatermarkSpec`

| Property / member | Type, accepted values or signature |
|---|---|
| `enable?` | `boolean` |
| `url` | `GIFFrameSource` |
| `x?` | `number` |
| `y?` | `number` |
| `opacity?` | `number` |
| `width?` | `number` |
| `height?` | `number` |
| `scale?` | `number` |
| `margin?` | `number` |
| `position?` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right" \| "center"` |

### `GIFTextOverlaySpec`

| Property / member | Type, accepted values or signature |
|---|---|
| `inherits` | `Omit<TextProperties, "x"\|"y"> (all text fields)` |
| `x?` | `number (default 10)` |
| `y?` | `number (default 30)` |
| `fontColor?` | `string (legacy alias)` |

### `GIFAttachment`

| Property / member | Type, accepted values or signature |
|---|---|
| `attachment` | `Buffer` |
| `name` | `string` |
| `contentType` | `"image/gif"` |

### `GIFResults`

| Property / member | Type, accepted values or signature |
|---|---|
| `buffer?` | `Buffer` |
| `base64?` | `string` |
| `attachment?` | `GIFAttachment` |

## Execution behavior, defaults and constraints

Timing is rounded to GIF 10ms units. Exactly one of `buffer` or `background` must be present in a normal input frame. `onStart` generated mode is mutually exclusive with a nonempty frame list. Output shape depends on selected format; validate results before assuming Buffer. GIF sizes/frames aggregate cost are bounded by runtime limits.

## Source-of-truth files

- [`lib-next/types/gif.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/gif.ts)
- [`lib-next/gif/gif-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/gif/gif-creator.ts)
- [`lib-next/gif/gif-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/gif/gif-validation.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
