# Templates, placeholders, conditional and layout composition — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createTemplate(definition, options?)`

Data-driven reusable immutable scene definitions. `TemplateHandle.toRenderInput` resolves placeholders and layout; `render` forwards the resolved scene to the scene renderer.

## Verified feature coverage

- Data placeholder replacement (`{{name}}`)
- Asset references (`$name`, `$palette.key`)
- Unique-id layer overrides and deterministic before/after insertion
- Layout resolution including flex/grid constraints implemented by resolver
- Visibility/conditional layer inclusion
- Immutable template definition on creation

## Public types, nested properties and options

### `TemplateData`

| Property / member | Type, accepted values or signature |
|---|---|
| `shape` | `Record<string,unknown>` |

### `TemplateSceneDefinition`

| Property / member | Type, accepted values or signature |
|---|---|
| `width` | `number` |
| `height` | `number` |
| `background?` | `SceneBackground` |
| `layers` | `TemplateLayerInput[]` |

### `TemplateLayerInput`

| Property / member | Type, accepted values or signature |
|---|---|
| `shape` | `Record<string,unknown> (runtime expects template layer definitions, including type and optional id/visible/layout attributes)` |

### `TemplateOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `resolveAssetRef?` | `(value:string)=>AssetValue` |

### `TemplateRenderOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `overrides?` | `Record<string,Record<string,unknown>>` |
| `insertions?` | `TemplateLayerInsertion[]` |

### `TemplateLayerInsertion`

| Property / member | Type, accepted values or signature |
|---|---|
| `targetId` | `string` |
| `position` | `"before" \| "after"` |
| `layers` | `TemplateLayerInput \| TemplateLayerInput[]` |

### `TemplateHandle public API`

| Property / member | Type, accepted values or signature |
|---|---|
| `toRenderInput(data,options?)` | `Promise<SceneRenderInput>` |
| `render(data,options?)` | `Promise<Buffer> (TemplateRenderOptions & SceneRenderOptions)` |

### `TemplateRenderHost`

| Property / member | Type, accepted values or signature |
|---|---|
| `renderScene(input,options?)` | `Promise<Buffer>` |
| `measureText(props)` | `Promise<TextMetrics>` |
| `assets.resolve(refPath)` | `AssetValue` |

### `PlaceholderResolveContext`

| Property / member | Type, accepted values or signature |
|---|---|
| `data` | `Record<string,unknown>` |

## Execution behavior, defaults and constraints

Placeholder and asset resolution are separate passes; placeholders resolve first. Duplicate/unknown layer IDs and invalid layout/scene data are validated. Template-specific free-form `TemplateLayerInput` is not statically strict, so the runtime resolver is authoritative for property behavior. `TemplateHandle.render()` passes `resolveAssetRefs:false` because the template already resolved references.

## Source-of-truth files

- [`lib-next/types/template.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/template.ts)
- [`lib-next/template/template-handle.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/template/template-handle.ts)
- [`lib-next/template/resolve-template.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/template/resolve-template.ts)
- [`lib-next/template/placeholders.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/template/placeholders.ts)
- [`lib-next/scene/scene-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/scene/scene-validation.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
