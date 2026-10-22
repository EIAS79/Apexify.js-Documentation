# AssetManager and named resource resolution — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.assets / painter.prepareForRender(value)`

Named image/font/palette/general values, supporting `$ref` and dotted `$palette.primary` lookup.

## Verified feature coverage

- Named reusable sources, palettes and values
- Dotted-path lookup for nested values
- Explicit duplicate registration/replacement handling
- Cycle and unsafe-key guards
- Opt-in resolution in imperative APIs; on by default in renderScene

## Public types, nested properties and options

### `AssetScalar`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `string \| number \| boolean \| null \| Buffer` |

### `AssetValue`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `AssetScalar \| readonly AssetValue[] \| {readonly [key:string]:AssetValue}` |

### `AssetKind`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"image" \| "font" \| "palette" \| "value"` |

### `AssetRegistrationInfo`

| Property / member | Type, accepted values or signature |
|---|---|
| `name` | `string` |
| `kind` | `AssetKind` |

### `PainterAssetRefsOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `resolveAssetRefs?` | `boolean` |

### `AssetManager API (read implementation)`

| Property / member | Type, accepted values or signature |
|---|---|
| `loadImage(name,source)` | `register image bytes/source` |
| `loadFont(name,source)` | `register named font` |
| `loadPalette(name,colors)` | `register palette dictionary` |
| `loadValue(name,value)` | `this` |
| `replaceImage(id,source)` | `this` |
| `replaceFont(id,fontPath)` | `this` |
| `replacePalette(name,colors)` | `this` |
| `replaceValue(name,value)` | `this` |
| `unregisterImage(id)` | `this` |
| `unregisterFont(id)` | `this` |
| `unregisterPalette(name)` | `this` |
| `has(name)` | `boolean` |
| `delete(name)` | `boolean` |
| `clear()` | `this` |
| `list()` | `AssetRegistrationInfo[]` |
| `resolve(refPath)` | `AssetValue` |

### `prepareForRender<T>`

| Property / member | Type, accepted values or signature |
|---|---|
| `value` | `T (deeply resolves registered string references; returns T)` |
| `escape` | `"$$" for literal dollar sign` |

## Execution behavior, defaults and constraints

Asset references are not automatically substituted in every method. `SceneBuilder.render()` defaults resolution **off**, whereas `painter.renderScene()` defaults **on**. Registry names and nested path segments reject `__proto__`, `prototype`, `constructor` in source validation.

## Source-of-truth files

- [`lib-next/assets/asset-manager.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/assets/asset-manager.ts)
- [`lib-next/assets/asset-strings.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/assets/asset-strings.ts)
- [`lib-next/assets/resolve-scene-assets.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/assets/resolve-scene-assets.ts)
- [`lib-next/types/assets.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/assets.ts)
- [`lib-next/types/painter-resolve.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/painter-resolve.ts)
- [`lib-next/apex-painter/main.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/main.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
