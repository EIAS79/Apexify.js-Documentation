# Image utility operations (stitch, collage, compress, filters and masks) — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.image.*`

Programmatic image manipulation and analysis helpers operating on raster images/buffers or supported media sources.

## Verified feature coverage

- Stitch, collage (grid/masonry/carousel)
- Sharp-backed resize/format/compression
- Image filters, palette extraction and color analysis
- Color removal, source blend and gradient blend
- Color/alpha/grayscale masks and polygon-like crop
- Remote background removal requiring user-supplied API key

## Public types, nested properties and options

### `PainterImageUtils methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `stitchImages(images,options?)` | `Promise<Buffer>` |
| `createCollage(images,layout)` | `Promise<Buffer>` |
| `compress(image,options?)` | `Promise<Buffer>` |
| `extractPalette(image,options?)` | `Promise<Array<{color:string;percentage:number}>>` |
| `resize(resizeOptions)` | `Promise<Buffer>` |
| `imgConverter(source,newExtension)` | `Promise<Buffer>` |
| `effects(source,filters)` | `Promise<Buffer>` |
| `colorsFilter(source,filterColor,opacity?)` | `Promise<Buffer>` |
| `colorAnalysis(source)` | `Promise<Array<{color:string;frequency:string}>>` |
| `colorsRemover(source,colorToRemove)` | `Promise<Buffer>` |
| `removeBackground(imageURL,apiKey)` | `Promise<Buffer>` |
| `blend(layers,baseImageBuffer,defaultBlendMode?)` | `Promise<Buffer>` |
| `cropImage(options)` | `Promise<Buffer>` |
| `masking(source,maskSource,options?)` | `Promise<Buffer>` |
| `gradientBlend(source,options)` | `Promise<Buffer>` |
| `validHex(hexColor)` | `boolean` |

### `StitchOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `direction?` | `"horizontal" \| "vertical" \| "grid"` |
| `overlap?` | `number` |
| `blend?` | `boolean` |
| `spacing?` | `number` |

### `CollageLayout`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"grid" \| "masonry" \| "carousel"` |
| `columns?` | `number` |
| `rows?` | `number` |
| `spacing?` | `number` |
| `background?` | `string` |
| `borderRadius?` | `number` |

### `CompressionOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `quality?` | `number` |
| `format?` | `"jpeg" \| "webp" \| "avif"` |
| `maxWidth?` | `number` |
| `maxHeight?` | `number` |
| `progressive?` | `boolean` |

### `PaletteOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `count?` | `number` |
| `method?` | `"kmeans" \| "median-cut" \| "octree"` |
| `format?` | `"hex" \| "rgb" \| "hsl"` |

### `ResizeOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `imagePath` | `string \| Buffer` |
| `size?` | `{width?:number;height?:number}` |
| `maintainAspectRatio?` | `boolean` |
| `quality?` | `number` |
| `outputFormat?` | `"png" \| "jpeg"` |

### `MaskOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `type?` | `"alpha" \| "grayscale" \| "color"` |
| `threshold?` | `number` |
| `invert?` | `boolean` |
| `colorKey?` | `string` |

### `BlendOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `type?` | `"linear" \| "radial" \| "conic"` |
| `angle?` | `number` |
| `colors` | `Array<{stop:number;color:string}>` |
| `blendMode?` | `"multiply" \| "overlay" \| "screen" \| "darken" \| "lighten" \| "difference"` |
| `maskSource?` | `string \| Buffer \| PathLike \| Uint8Array` |

### `ImageBlendLayer`

| Property / member | Type, accepted values or signature |
|---|---|
| `image` | `string \| Buffer` |
| `blendMode` | `GlobalCompositeOperation` |
| `position?` | `{x:number;y:number}` |
| `opacity?` | `number` |

### `cropOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `coordinates` | `cropCoordinate[]` |
| `imageSource` | `string \| Buffer` |
| `crop` | `"inner" \| "outer"` |
| `radius` | `number \| "circular"` |

### `cropCoordinate`

| Property / member | Type, accepted values or signature |
|---|---|
| `from` | `{x:number;y:number}` |
| `to` | `{x:number;y:number}` |
| `tension?` | `number` |

### `colorsRemover color`

| Property / member | Type, accepted values or signature |
|---|---|
| `red` | `number` |
| `green` | `number` |
| `blue` | `number` |

## Execution behavior, defaults and constraints

Palette methods and compression format support are specific to their helper signatures. Image `effects()` accepts the 17 `ImageFilter.type` modes defined in `02_createImage.md`. `removeBackground` is an external-service integration; credentials must be user-provided. `CollageLayout.type:"custom"` is removed and not part of v6.

## Source-of-truth files

- [`lib-next/types/painter-image.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/painter-image.ts)
- [`lib-next/types/batch.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/batch.ts)
- [`lib-next/types/image.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/image.ts)
- [`lib-next/types/video.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/video.ts)
- [`lib-next/image/painter-image-utils.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/image/painter-image-utils.ts)
- [`lib-next/output/compression.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/output/compression.ts)
- [`lib-next/output/stitch.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/output/stitch.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
