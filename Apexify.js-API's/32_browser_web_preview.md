# @apexify/web browser preview runtime and actual supported subset — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `createApexifyWebRuntime / renderApexifyWebPreview / registerApexifyWebFonts / getApexifyWebCapabilities`

Existing browser-specific source package, **not part of the root npm package exports** at the audited commit. It extracts Apexify-style method calls from source, safely interprets a supported expression subset and paints into Canvas2D before encoding a PNG data URL.

## Verified feature coverage

- Actual browser Canvas2D rendered preview
- Supported parser/interpreter for selected painter-style calls
- Charts, shapes, text, path and selected pixel/detect operations
- Web font registration and capabilities query
- Virtual in-memory Studio assets
- Warning reporting for unsupported Node-only calls

## Public types, nested properties and options

### `ApexifyWebCapabilities`

| Property / member | Type, accepted values or signature |
|---|---|
| `runtime` | `"@apexify/web"` |
| `directCanvas2D` | `boolean` |
| `offscreenCanvas` | `boolean` |
| `imageBitmap` | `boolean` |
| `fontFace` | `boolean` |
| `webAudio` | `boolean` |
| `webCodecs` | `boolean` |
| `devicePixelRatio` | `number` |

### `ApexifyWebFontRegistration`

| Property / member | Type, accepted values or signature |
|---|---|
| `name` | `string` |
| `family` | `string` |
| `ok` | `boolean` |
| `error?` | `string` |

### `WebVirtualAsset`

| Property / member | Type, accepted values or signature |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `mime` | `string` |
| `size` | `number` |
| `base64` | `string` |
| `metadata?` | `{width?:number;height?:number;duration?:number}` |

### `WebStudioPreviewBounds`

| Property / member | Type, accepted values or signature |
|---|---|
| `x` | `number` |
| `y` | `number` |
| `width` | `number` |
| `height` | `number` |

### `WebStudioPreviewResult success`

| Property / member | Type, accepted values or signature |
|---|---|
| `ok` | `true` |
| `dataUrl` | `string` |
| `mime` | `"image/png"` |
| `width` | `number` |
| `height` | `number` |
| `renderBounds` | `WebStudioPreviewBounds` |
| `elapsedMs` | `number` |
| `supportedApis` | `string[]` |
| `warnings` | `string[]` |
| `results?` | `Record<string,Jsonish>` |

### `WebStudioPreviewResult failure`

| Property / member | Type, accepted values or signature |
|---|---|
| `ok` | `false` |
| `elapsedMs` | `number` |
| `error` | `string` |
| `supportedApis` | `string[]` |

### `Supported preview methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `createCanvas` | `supported subset` |
| `createText` | `supported subset` |
| `createImage` | `supported subset` |
| `createChart` | `supported subset` |
| `createComparisonChart` | `supported subset` |
| `createComboChart` | `supported subset` |
| `path2d.create` | `supported subset` |
| `path2d.draw` | `supported subset` |
| `path2d.custom` | `supported subset` |
| `pixels.manipulate` | `supported subset` |
| `pixels.getColor` | `supported subset` |
| `pixels.setColor` | `supported subset` |
| `pixels.getData` | `supported subset` |
| `detect.path` | `supported subset` |
| `detect.region` | `supported subset` |
| `detect.anyRegion` | `supported subset` |
| `detect.distance` | `supported subset` |

### `Explicitly unsupported by preview`

| Property / member | Type, accepted values or signature |
|---|---|
| `createScene` | `not executed` |
| `renderScene` | `not executed` |
| `createTemplate` | `not executed` |
| `createGIF` | `not executed` |
| `animate` | `not executed` |
| `createVideo` | `not executed` |
| `videoPipeline` | `not executed` |
| `createAudio` | `not executed` |
| `batch` | `not executed` |
| `chain` | `not executed` |

### `Web runtime methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `capabilities()` | `ApexifyWebCapabilities` |
| `registerFonts(assets)` | `Promise<ApexifyWebFontRegistration[]>` |
| `renderStudioSource(source,assets?)` | `Promise<WebStudioPreviewResult>` |
| `reset()` | `void (currently only active-state check)` |
| `dispose()` | `void (marks disposed)` |
| `createApexifyWebRuntime()` | `ApexifyWebRuntime` |

### `Web preview limits (implementation constants)`

| Property / member | Type, accepted values or signature |
|---|---|
| `output dimensions` | `4096×4096 and 12,000,000 pixels` |
| `remote image maximum` | `8 MiB` |
| `remote image pixels` | `12,000,000` |
| `remote image count` | `8` |
| `remote image timeout` | `8000 ms` |

## Execution behavior, defaults and constraints

**Not full browser engine parity:** no retained tree/incremental dirty renderer is verified. The preview uses source method-call extraction (`extractCalls`) and renders a PNG data URL. `reset()` is currently a no-op apart from lifecycle checking. The interpreter has outstanding operation/iteration/regex limits and prototype-object hardening gaps according to source and `docs/remaining-work.md`. Root CI does not typecheck packages/web.

## Implementation notes and audit findings

Do not use this preview as the sole proof that Node execution will produce a pixel-identical image. Treat unsupported calls and partial expression evaluation as explicit preview limitations.

## Source-of-truth files

- [`packages/web/package.json`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/packages/web/package.json)
- [`packages/web/src/index.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/packages/web/src/index.ts)
- [`packages/web/src/studio-preview.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/packages/web/src/studio-preview.ts)
- [`packages/web/src/safe-preview-expression.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/packages/web/src/safe-preview-expression.ts)
- [`packages/web/README.md`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/packages/web/README.md)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
