# createImage — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `ApexPainter.createImage(images, canvasBuffer, options?, painterOpts?)`

Raster images and built-in vector-like shapes drawn onto an existing canvas. Supports single layer, array of layers and grouped transforms; returns `Promise<Buffer>`.

## Verified feature coverage

- Draw single or array image and shape layers
- Geometric placement and transforms
- Raster filtering before/after composition
- Masking, clip paths and color effects
- Perspective, free warp, bulge/pinch/twirl/wave and mesh warp
- Grouped transforms and parent-level blend/opacity

## Public types, nested properties and options

### `ImageProperties`

| Property / member | Type, accepted values or signature |
|---|---|
| `source` | `string \| Buffer \| ShapeType` |
| `x` | `number` |
| `y` | `number` |
| `width?` | `number` |
| `height?` | `number` |
| `inherit?` | `boolean` |
| `fit?` | `"fill" \| "contain" \| "cover"` |
| `align?` | `AlignMode` |
| `rotation?` | `number` |
| `opacity?` | `number` |
| `blur?` | `number` |
| `blendMode?` | `GlobalCompositeOperation` |
| `borderRadius?` | `number \| "circular"` |
| `borderPosition?` | `string` |
| `filters?` | `ImageFilter[]` |
| `filterIntensity?` | `number` |
| `filterOrder?` | `"pre" \| "post"` |
| `mask?` | `{ source:string\|Buffer; mode?:"alpha"\|"luminance"\|"inverse" }` |
| `clipPath?` | `Array<{x:number;y:number}>` |
| `distortion?` | `ImageDistortionOptions` |
| `meshWarp?` | `ImageMeshWarpOptions` |
| `effects?` | `{ vignette?:{intensity:number;size:number}; lensFlare?:{x:number;y:number;intensity:number}; chromaticAberration?:{intensity:number}; filmGrain?:{intensity:number} }` |
| `shape?` | `ShapeProperties` |
| `shadow?` | `ShadowOptions` |
| `stroke?` | `StrokeOptions` |
| `boxBackground?` | `{color?:string;gradient?:gradient}` |

### `ShapeType`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"rectangle" \| "square" \| "circle" \| "triangle" \| "trapezium" \| "star" \| "heart" \| "polygon" \| "arc" \| "pieSlice"` |

### `ShapeProperties`

| Property / member | Type, accepted values or signature |
|---|---|
| `fill?` | `boolean` |
| `color?` | `string` |
| `gradient?` | `gradient` |
| `points?` | `Array<{x:number;y:number}>` |
| `radius?` | `number` |
| `sides?` | `number` |
| `innerRadius?` | `number` |
| `outerRadius?` | `number` |
| `startAngle?` | `number` |
| `endAngle?` | `number` |
| `centerX?` | `number` |
| `centerY?` | `number` |

### `ImageFilter`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"gaussianBlur" \| "motionBlur" \| "radialBlur" \| "sharpen" \| "noise" \| "grain" \| "edgeDetection" \| "emboss" \| "invert" \| "grayscale" \| "sepia" \| "pixelate" \| "brightness" \| "contrast" \| "saturation" \| "hueShift" \| "posterize"` |
| `intensity?` | `number` |
| `radius?` | `number` |
| `angle?` | `number` |
| `centerX?` | `number` |
| `centerY?` | `number` |
| `value?` | `number` |
| `levels?` | `number` |
| `size?` | `number` |
| `x?` | `number (optional pixelate region)` |
| `y?` | `number` |
| `width?` | `number` |
| `height?` | `number` |

### `ImageDistortionOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"perspective" \| "warp" \| "bulge" \| "pinch" \| "twirl" \| "wave"` |
| `points?` | `Array<{x:number;y:number}> (ordered TL,TR,BR,BL for quad)` |
| `controlPoints?` | `ImageWarpControlPoint[]` |
| `intensity?` | `number` |
| `centerX?` | `number` |
| `centerY?` | `number` |
| `radius?` | `number` |
| `angle?` | `number` |
| `amplitudeX?` | `number` |
| `amplitudeY?` | `number` |
| `wavelengthX?` | `number` |
| `wavelengthY?` | `number` |
| `phaseX?` | `number` |
| `phaseY?` | `number` |
| `interpolation?` | `"nearest" \| "bilinear" \| "bicubic"` |
| `edgeMode?` | `"transparent" \| "clamp" \| "wrap" \| "mirror"` |

### `ImageInterpolationMode`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"nearest" \| "bilinear" \| "bicubic"` |

### `ImageEdgeMode`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"transparent" \| "clamp" \| "wrap" \| "mirror"` |

### `ImageWarpFalloff`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"linear" \| "smooth" \| "gaussian"` |

### `ImageWarpControlPoint`

| Property / member | Type, accepted values or signature |
|---|---|
| `from` | `{x:number;y:number}` |
| `to` | `{x:number;y:number}` |
| `radius?` | `number` |
| `strength?` | `number` |
| `falloff?` | `"linear" \| "smooth" \| "gaussian"` |

### `ImageMeshWarpOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `gridX?` | `number` |
| `gridY?` | `number` |
| `controlPoints?` | `Array<Array<{x:number;y:number}>>` |
| `interpolation?` | `ImageInterpolationMode` |
| `edgeMode?` | `ImageEdgeMode` |

### `GroupTransformOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `rotation?` | `number` |
| `translateX?` | `number` |
| `translateY?` | `number` |
| `scaleX?` | `number` |
| `scaleY?` | `number` |
| `pivotX?` | `number` |
| `pivotY?` | `number` |
| `opacity?` | `number` |
| `blur?` | `number` |
| `blendMode?` | `GlobalCompositeOperation` |
| `borderRadius?` | `number \| "circular"` |
| `borderPosition?` | `borderPosition` |
| `filters?` | `ImageFilter[]` |
| `filterIntensity?` | `number` |
| `filterOrder?` | `"pre" \| "post"` |
| `mask?` | `{source:string\|Buffer;mode?:"alpha"\|"luminance"\|"inverse"}` |
| `clipPath?` | `Array<{x:number;y:number}>` |
| `distortion?` | `ImageDistortionOptions` |
| `meshWarp?` | `ImageMeshWarpOptions` |
| `effects?` | `{vignette?;lensFlare?;chromaticAberration?;filmGrain?} (same nested shapes as ImageProperties.effects)` |
| `shadow?` | `ShadowOptions` |
| `stroke?` | `StrokeOptions` |
| `boxBackground?` | `BoxBackground` |

### `CreateImageOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `isGrouped?` | `boolean` |
| `groupTransform?` | `GroupTransformOptions` |

### `PainterAssetRefsOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `resolveAssetRefs?` | `boolean (default false)` |

## Execution behavior, defaults and constraints

`source`, `x`, `y` are required; `createImage` accepts `CanvasResults | Buffer` as the target. Both inputs and processing are validated. Outputs are re-encoded raster bytes, so repeated imperative edits should be benchmarked against `renderScene` for complex projects. Full image utility methods have a separate file.

## Example (API-oriented)

```ts
const base = await painter.createCanvas({ width: 800, height: 500, colorBg: '#09090b' });
const png = await painter.createImage([
 { source: 'rectangle', x: 40, y: 40, width: 300, height: 160, shape: { color: '#6366f1' } },
 { source: 'star', x: 430, y: 60, width: 140, height: 140, shape: { color: '#f59e0b' }, rotation: -10 },
], base);
```

## Source-of-truth files

- [`lib-next/apex-painter/main.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/main.ts)
- [`lib-next/apex-painter/creates/image-text-create.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/creates/image-text-create.ts)
- [`lib-next/image/image-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/image/image-creator.ts)
- [`lib-next/image/image-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/image/image-validation.ts)
- [`lib-next/image/image-raster-pipeline.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/image/image-raster-pipeline.ts)
- [`lib-next/image/image-warp.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/image/image-warp.ts)
- [`lib-next/types/image.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/image.ts)
- [`lib-next/types/common.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/common.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
