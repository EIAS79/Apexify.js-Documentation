# Hit detection and geometric distance tests — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.detect.path / region / anyRegion / distance`

Geometry helper APIs to test points against configured geometric regions or paths. Results are returned as structured hit/distance records.

## Verified feature coverage

- Hit-test circles/rectangles/ellipses/polygons/paths
- Custom predicate hit regions
- Stroke-inclusive hit tolerance
- First-hit identification for region collections
- Distance-to-region calculation

## Public types, nested properties and options

### `RegionType`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"rect" \| "circle" \| "ellipse" \| "polygon" \| "path" \| "custom"` |

### `RectRegion`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"rect"` |
| `x` | `number` |
| `y` | `number` |
| `width` | `number` |
| `height` | `number` |

### `CircleRegion`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"circle"` |
| `x` | `number` |
| `y` | `number` |
| `radius` | `number` |

### `EllipseRegion`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"ellipse"` |
| `x` | `number` |
| `y` | `number` |
| `radiusX` | `number` |
| `radiusY` | `number` |
| `rotation?` | `number` |

### `PolygonRegion`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"polygon"` |
| `points` | `Array<{x:number;y:number}>` |

### `PathRegion`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"path"` |
| `path` | `Path2D \| PathCommand[]` |
| `fillRule?` | `CanvasFillRule` |

### `CustomRegion`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"custom"` |
| `check` | `(x:number,y:number)=>boolean` |

### `HitDetectionOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `includeStroke?` | `boolean` |
| `strokeWidth?` | `number` |
| `tolerance?` | `number` |
| `region?` | `HitRegion` |
| `fillRule?` | `CanvasFillRule` |

### `HitDetectionResult`

| Property / member | Type, accepted values or signature |
|---|---|
| `hit` | `boolean` |
| `distance?` | `number` |
| `hitType?` | `"fill" \| "stroke" \| "outside"` |
| `hitRegion?` | `string \| number` |

### `PainterHitDetect methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `path(path,x,y,options?)` | `Promise<HitDetectionResult>` |
| `region(region,x,y,options?)` | `Promise<HitDetectionResult>` |
| `anyRegion(regions,x,y,options?)` | `Promise<HitDetectionResult>` |
| `distance(region,x,y)` | `Promise<number>` |

## Execution behavior, defaults and constraints

Hit testing is a geometry utility, **not** a complete interaction/event system. There is no retained element-to-listener binding or browser pointer-event dispatch in this API.

## Source-of-truth files

- [`lib-next/types/hit-detection.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/hit-detection.ts)
- [`lib-next/types/painter-facets.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/painter-facets.ts)
- [`lib-next/pixels/hit-detection-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/pixels/hit-detection-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
