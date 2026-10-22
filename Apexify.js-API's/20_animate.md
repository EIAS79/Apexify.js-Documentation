# Frame-by-frame animation helper — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.animate(frames, defaultDuration, defaultWidth?, defaultHeight?, options?, painterOpts?)`

Creates sequential PNG buffers from Frame configurations and optionally streams a GIF to disk.

## Verified feature coverage

- Sequential rasterization of frame definitions
- Gradient/pattern/source backgrounds
- Frame-level transforms
- Optional custom native context callback
- Progress hooks and cancellation
- Optional streaming GIF file

## Public types, nested properties and options

### `Frame`

| Property / member | Type, accepted values or signature |
|---|---|
| `backgroundColor?` | `string` |
| `gradient?` | `GradientConfig` |
| `pattern?` | `{source:string;repeat?:"repeat"\|"repeat-x"\|"repeat-y"\|"no-repeat"}` |
| `source?` | `string` |
| `blendMode?` | `GlobalCompositeOperation` |
| `transformations?` | `{scaleX?:number;scaleY?:number;rotate?:number;translateX?:number;translateY?:number}` |
| `duration?` | `number` |
| `width?` | `number` |
| `height?` | `number` |
| `onDrawCustom?` | `(ctx:SKRSContext2D,canvas:Canvas)=>void` |

### `AnimateOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `gif?` | `boolean` |
| `gifPath?` | `string` |
| `onStart?` | `()=>void` |
| `onFrame?` | `(index:number)=>void` |
| `onEnd?` | `()=>void` |
| `signal?` | `AbortSignal` |

### `Arguments and returns`

| Property / member | Type, accepted values or signature |
|---|---|
| `frames` | `Frame[]` |
| `defaultDuration` | `number` |
| `defaultWidth?` | `number (default 800)` |
| `defaultHeight?` | `number (default 600)` |
| `options?` | `AnimateOptions` |
| `painterOpts?` | `PainterAssetRefsOptions` |
| `result` | `Promise<Buffer[]\|undefined>` |

## Execution behavior, defaults and constraints

This API generates frames; it is **not** a browser `requestAnimationFrame` timeline, retained animation graph or event-driven scene player. When GIF mode is enabled, frame dimensions are required to match the configured GIF size.

## Source-of-truth files

- [`lib-next/types/gif.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/gif.ts)
- [`lib-next/gif/animate-frames.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/gif/animate-frames.ts)
- [`lib-next/gif/gif-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/gif/gif-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
