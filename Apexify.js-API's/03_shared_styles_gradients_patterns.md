# Shared styles, gradients, patterns and colors — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `CanvasConfig / ImageProperties / TextProperties shared types`

Type aliases reused throughout canvas, image, path, chart, text and composition APIs. Exact accepted values depend on the consuming renderer.

## Verified feature coverage

- Cross-domain gradients including stops, rotations and repeated painting
- Ten-plus procedural pattern modes
- Stroke and shadow composition
- Image placement fit and alignment
- GlobalCompositeOperation blending options

## Public types, nested properties and options

### `OutputFormat`

| Property / member | Type, accepted values or signature |
|---|---|
| `type?` | `"buffer" \| "url" \| "blob" \| "base64" \| "dataURL" \| "arraybuffer"` |

### `FitMode`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"fill" \| "contain" \| "cover"` |

### `AlignMode`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"center" \| "top" \| "bottom" \| "left" \| "right" \| "top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` |

### `borderPosition`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"all" \| "top" \| "left" \| "right" \| "bottom" \| "top-left" \| "top-right" \| "bottom-left" \| "bottom-right" \| string` |

### `StrokeOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `color?` | `string` |
| `gradient?` | `gradient` |
| `width?` | `number` |
| `position?` | `number` |
| `blur?` | `number` |
| `opacity?` | `number` |
| `borderRadius?` | `number \| "circular"` |
| `borderPosition?` | `borderPosition` |
| `roundedCorners?` | `borderPosition` |
| `style?` | `"solid" \| "dashed" \| "dotted" \| "groove" \| "ridge" \| "double"` |

### `ShadowOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `color?` | `string` |
| `gradient?` | `gradient` |
| `offsetX?` | `number` |
| `offsetY?` | `number` |
| `blur?` | `number` |
| `opacity?` | `number` |
| `borderRadius?` | `number \| "circular"` |
| `roundedCorners?` | `borderPosition` |
| `borderPosition?` | `borderPosition (deprecated)` |

### `BoxBackground`

| Property / member | Type, accepted values or signature |
|---|---|
| `color?` | `string` |
| `gradient?` | `gradient` |

### `gradient (linear)`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"linear"` |
| `startX?` | `number` |
| `startY?` | `number` |
| `endX?` | `number` |
| `endY?` | `number` |
| `rotate?` | `number` |
| `pivotX?` | `number` |
| `pivotY?` | `number` |
| `repeat?` | `"repeat" \| "reflect" \| "no-repeat"` |
| `colors` | `GradientStop[]` |

### `gradient (radial)`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"radial"` |
| `startX?` | `number` |
| `startY?` | `number` |
| `startRadius?` | `number` |
| `endX?` | `number` |
| `endY?` | `number` |
| `endRadius?` | `number` |
| `rotate?` | `number` |
| `pivotX?` | `number` |
| `pivotY?` | `number` |
| `repeat?` | `"repeat" \| "reflect" \| "no-repeat"` |
| `colors` | `GradientStop[]` |

### `gradient (conic)`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"conic"` |
| `centerX?` | `number` |
| `centerY?` | `number` |
| `startAngle?` | `number` |
| `rotate?` | `number` |
| `pivotX?` | `number` |
| `pivotY?` | `number` |
| `colors` | `GradientStop[]` |

### `GradientStop`

| Property / member | Type, accepted values or signature |
|---|---|
| `stop` | `number` |
| `color` | `string` |

### `PatternOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"grid" \| "dots" \| "diagonal" \| "stripes" \| "waves" \| "crosses" \| "hexagons" \| "checkerboard" \| "diamonds" \| "triangles" \| "stars" \| "polka" \| "custom"` |
| `color?` | `string` |
| `secondaryColor?` | `string` |
| `opacity?` | `number` |
| `size?` | `number` |
| `spacing?` | `number` |
| `rotation?` | `number` |
| `customPatternImage?` | `string` |
| `repeat?` | `"repeat" \| "repeat-x" \| "repeat-y" \| "no-repeat"` |
| `scale?` | `number` |
| `offsetX?` | `number` |
| `offsetY?` | `number` |
| `blendMode?` | `GlobalCompositeOperation` |
| `gradient?` | `GradientConfig` |

### `GradientConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"linear" \| "radial" \| "conic"` |
| `startX?` | `number` |
| `startY?` | `number` |
| `endX?` | `number` |
| `endY?` | `number` |
| `startRadius?` | `number` |
| `endRadius?` | `number` |
| `angle?` | `number` |
| `centerX?` | `number` |
| `centerY?` | `number` |
| `startAngle?` | `number` |
| `repeat?` | `"repeat" \| "reflect" \| "no-repeat"` |
| `colors` | `Array<{stop:number;color:string}>` |

### `RenderPatternStackOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `stackedInLayer?` | `boolean` |

## Execution behavior, defaults and constraints

`gradient` (used by canvas/text/image) and `GradientConfig` (used by some utilities) are distinct public structures. Do not assume each renderer consumes every field equally. Pattern background blend fallback differs between root `patternBg` and `bgLayers` usage.

## Source-of-truth files

- [`lib-next/types/common.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/common.ts)
- [`lib-next/types/gradient.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/gradient.ts)
- [`lib-next/types/pattern.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/pattern.ts)
- [`lib-next/render/gradient-fill.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/render/gradient-fill.ts)
- [`lib-next/canvas/pattern-renderer.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/canvas/pattern-renderer.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
