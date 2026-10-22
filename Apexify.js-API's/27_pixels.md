# Pixel data inspection, writing and image mutation — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.pixels.getData / setData / manipulate / getColor / setColor`

Pixel-oriented access to raster bytes with optional rectangular regions, color operations and custom per-pixel processors.

## Verified feature coverage

- ROI pixel readback
- Overwrite image data and dirty subrect
- Predefined color manipulation filters
- Custom per-pixel RGBA processing
- Individual pixel retrieval and assignment

## Public types, nested properties and options

### `PixelData`

| Property / member | Type, accepted values or signature |
|---|---|
| `data` | `Uint8ClampedArray` |
| `width` | `number` |
| `height` | `number` |
| `colorSpace?` | `"srgb" \| "display-p3" \| "rec2020"` |

### `PixelManipulationOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `processor?` | `(r:number,g:number,b:number,a:number,x:number,y:number)=>[number,number,number,number]` |
| `region?` | `{x:number;y:number;width:number;height:number}` |
| `filter?` | `"grayscale" \| "invert" \| "sepia" \| "brightness" \| "contrast" \| "saturate"` |
| `intensity?` | `number` |

### `PainterPixels methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `getData(canvasBuffer,options?)` | `Promise<PixelData>` |
| `getData.options?` | `{x?:number;y?:number;width?:number;height?:number}` |
| `setData(canvasBuffer,pixelData,options?)` | `Promise<Buffer>` |
| `setData.options?` | `{x?:number;y?:number;dirtyX?:number;dirtyY?:number;dirtyWidth?:number;dirtyHeight?:number}` |
| `manipulate(canvasBuffer,options)` | `Promise<Buffer>` |
| `getColor(canvasBuffer,x,y)` | `Promise<{r:number;g:number;b:number;a:number}>` |
| `setColor(canvasBuffer,x,y,color)` | `Promise<Buffer>` |
| `setColor.color` | `{r:number;g:number;b:number;a?:number}` |

## Execution behavior, defaults and constraints

Custom `processor` callbacks execute inside the trusted Node runtime and should not be serialized as arbitrary untrusted code. The browser preview separately interprets only a supported subset of callbacks. For large inputs, pixel readback and per-pixel manipulation can incur high memory/CPU costs.

## Source-of-truth files

- [`lib-next/types/pixels.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/pixels.ts)
- [`lib-next/types/painter-facets.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/painter-facets.ts)
- [`lib-next/pixels/pixel-data-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/pixels/pixel-data-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
