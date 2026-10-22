# createCanvas — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `ApexPainter.createCanvas(config, painterOpts?)`

Creates an encoded raster canvas (`Promise<CanvasResults>`). Background can be transparent, color, gradient, procedural pattern, source image, a single extracted video frame, or a stack of mixed background layers.

## Verified feature coverage

- Native Canvas2D-backed raster creation and PNG buffer output
- Mixed sequential background layers
- Photo/remote/file/video-frame backgrounds
- Gradients, noise, built-in repeating patterns, transparency
- Rotation, zoom, opacity, blur, stroke and shadow
- Canvas inheritance from background image/video frame

## Public types, nested properties and options

### `CanvasConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `width?` | `number` |
| `height?` | `number` |
| `x?` | `number` |
| `y?` | `number` |
| `customBg?` | `CanvasCustomBackground` |
| `videoBg?` | `CanvasVideoBackground` |
| `colorBg?` | `string` |
| `gradientBg?` | `gradient` |
| `patternBg?` | `PatternOptions` |
| `noiseBg?` | `{ intensity?: number }` |
| `transparentBase?` | `boolean` |
| `bgLayers?` | `BackgroundLayer[]` |
| `blendMode?` | `GlobalCompositeOperation` |
| `opacity?` | `number` |
| `blur?` | `number` |
| `rotation?` | `number` |
| `borderRadius?` | `number \| "circular"` |
| `borderPosition?` | `borderPosition` |
| `zoom?` | `{ scale?: number; centerX?: number; centerY?: number }` |
| `stroke?` | `StrokeOptions` |
| `shadow?` | `ShadowOptions` |

### `CanvasImageBackgroundOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `inherit?` | `boolean` |
| `fit?` | `"fill" \| "contain" \| "cover"` |
| `align?` | `AlignMode` |
| `filters?` | `ImageFilter[]` |
| `opacity?` | `number` |

### `CanvasCustomBackground`

| Property / member | Type, accepted values or signature |
|---|---|
| `source` | `string` |
| `inherit?` | `boolean` |
| `fit?` | `FitMode` |
| `align?` | `AlignMode` |
| `filters?` | `ImageFilter[]` |
| `opacity?` | `number` |

### `CanvasVideoBackground`

| Property / member | Type, accepted values or signature |
|---|---|
| `source` | `string \| Buffer` |
| `frame?` | `number (1-based; exclusive of time)` |
| `time?` | `number (seconds; exclusive of frame)` |
| `format?` | `"jpg" \| "png"` |
| `quality?` | `number (1..31)` |
| `loop?` | `boolean (deprecated; still frame)` |
| `autoplay?` | `boolean (deprecated; still frame)` |
| `inherit?` | `boolean` |
| `fit?` | `FitMode` |
| `align?` | `AlignMode` |
| `filters?` | `ImageFilter[]` |
| `opacity?` | `number` |

### `BackgroundLayer variants`

| Property / member | Type, accepted values or signature |
|---|---|
| `color` | `{ type:"color"; value:string; opacity?:number; blendMode?:GlobalCompositeOperation }` |
| `gradient` | `{ type:"gradient"; value:gradient; opacity?:number; blendMode?:GlobalCompositeOperation }` |
| `image` | `{ type:"image"; source:string; opacity?:number; fit?:"fill"\|"contain"\|"cover"; align?:BackgroundImageAlign; blendMode?:GlobalCompositeOperation }` |
| `pattern` | `{ type:"pattern"; source:string; repeat?:"repeat"\|"repeat-x"\|"repeat-y"\|"no-repeat"; opacity?:number; blendMode?:GlobalCompositeOperation }` |
| `presetPattern` | `{ type:"presetPattern"; pattern:PatternOptions; opacity?:number; blendMode?:GlobalCompositeOperation }` |
| `noise` | `{ type:"noise"; intensity?:number; blendMode?:GlobalCompositeOperation }` |

### `CanvasResults`

| Property / member | Type, accepted values or signature |
|---|---|
| `buffer` | `Buffer` |
| `canvas` | `CanvasConfig` |

### `PainterAssetRefsOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `resolveAssetRefs?` | `boolean (default false)` |

## Execution behavior, defaults and constraints

Canvas validates configuration before allocating; decoded media is checked against centralized pixel/dimension budgets. `videoBg` extracts **one still frame**, not a playable/video-loop surface. `customBg.inherit` and `videoBg.inherit` can determine final dimensions. Asset references require `{resolveAssetRefs:true}` or `prepareForRender`. Shape/style contracts are detailed in `03_shared_styles_gradients_patterns.md`.

## Example (API-oriented)

```ts
import { ApexPainter } from 'apexify.js';
const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960, height: 540,
  gradientBg: {type:'linear', colors:[{stop:0,color:'#0f172a'},{stop:1,color:'#334155'}]},
  bgLayers:[{type:'noise',intensity:0.03}],
  borderRadius:20,
});
const png: Buffer = canvas.buffer;
```

## Source-of-truth files

- [`lib-next/apex-painter/main.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/main.ts)
- [`lib-next/apex-painter/creates/canvas-create.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/creates/canvas-create.ts)
- [`lib-next/canvas/canvas-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/canvas/canvas-creator.ts)
- [`lib-next/canvas/canvas-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/canvas/canvas-validation.ts)
- [`lib-next/types/canvas.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/canvas.ts)
- [`lib-next/types/common.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/common.ts)
- [`lib-next/types/pattern.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/pattern.ts)
- [`lib-next/types/gradient.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/gradient.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
