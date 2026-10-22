# Output conversion, encoding, image save and upload — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.toOutput / outPut / save / saveMultiple / output.*`

Encoding buffers into developer-selected forms, saving to disk, and optional explicit Imgur uploads.

## Verified feature coverage

- Encoded PNG Buffer output
- Data URLs, bare base64, Blobs and ArrayBuffers
- Save to custom directory with naming policies
- Convert between supported image format targets
- Opt-in external image URL upload

## Public types, nested properties and options

### `OutputFormat`

| Property / member | Type, accepted values or signature |
|---|---|
| `type?` | `"buffer" \| "url" \| "blob" \| "base64" \| "dataURL" \| "arraybuffer"` |

### `SaveOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `directory?` | `string` |
| `filename?` | `string` |
| `format?` | `"png" \| "jpg" \| "jpeg" \| "webp" \| "avif" \| "gif"` |
| `quality?` | `number` |
| `createDirectory?` | `boolean` |
| `naming?` | `"timestamp" \| "counter" \| "custom"` |
| `counterStart?` | `number` |
| `prefix?` | `string` |
| `suffix?` | `string` |
| `overwrite?` | `boolean` |

### `SaveResult`

| Property / member | Type, accepted values or signature |
|---|---|
| `path` | `string` |
| `filename` | `string` |
| `size` | `number` |
| `format` | `string` |

### `PainterOutput methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `dataURL(buffer:Buffer\|Uint8Array)` | `string` |
| `base64(buffer:Buffer\|Uint8Array)` | `string` |
| `blob(buffer:Buffer\|Uint8Array)` | `Blob` |
| `arrayBuffer(buffer:Buffer)` | `ArrayBuffer` |
| `url(buffer:Buffer,credentials?:Partial<PainterImgurCredentials>)` | `Promise<string>` |

### `PainterImgurCredentials`

| Property / member | Type, accepted values or signature |
|---|---|
| `clientId` | `string` |
| `clientSecret` | `string` |
| `accessToken` | `string` |
| `refreshToken` | `string` |

### `Painter direct output methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `toOutput(results:Buffer)` | `Promise<Buffer\|string\|Blob\|ArrayBuffer>` |
| `outPut(results:Buffer)` | `deprecated alias for toOutput` |
| `save(buffer:Buffer,options?:SaveOptions)` | `Promise<SaveResult>` |
| `saveMultiple(buffers:Buffer[],options?:SaveOptions)` | `Promise<SaveResult[]>` |

## Execution behavior, defaults and constraints

The painter constructor output format controls `toOutput()`; low-level helpers under `painter.output` are explicit. `outPut()` is deprecated. Imgur credentials are never bundled. Filesystem output is a trusted Node action: workspace users must not be allowed to target arbitrary server paths.

## Source-of-truth files

- [`lib-next/types/output.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/output.ts)
- [`lib-next/types/common.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/common.ts)
- [`lib-next/types/painter-facets.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/painter-facets.ts)
- [`lib-next/output/save-buffer.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/output/save-buffer.ts)
- [`lib-next/output/buffer-encoding.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/output/buffer-encoding.ts)
- [`lib-next/output/output-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/output/output-validation.ts)
- [`lib-next/output/upload-imgur.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/output/upload-imgur.ts)
- [`lib-next/apex-painter/creates/output-save.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/creates/output-save.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
