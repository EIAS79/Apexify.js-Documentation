# Built-in reusable scene components — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.components.badge/progressBar/avatar/card/watermark.toLayers()`

Five reusable primitive component factories. Each returns `SceneLayer[]` rather than a persistent UI component instance.

## Verified feature coverage

- Badges with measured text
- Progress bars and optional labels
- Circular avatars with optional rings
- Background cards with title/body
- Watermark text placement

## Public types, nested properties and options

### `BadgeToLayersOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `text` | `string` |
| `x` | `number` |
| `y` | `number` |
| `paddingX?` | `number` |
| `paddingY?` | `number` |
| `radius?` | `number` |
| `background?` | `string` |
| `color?` | `string` |
| `fontSize?` | `number` |

### `ProgressBarToLayersOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `x` | `number` |
| `y` | `number` |
| `width` | `number` |
| `height` | `number` |
| `value` | `number` |
| `max?` | `number` |
| `background?` | `string` |
| `fill?` | `string` |
| `radius?` | `number` |
| `showLabel?` | `boolean` |
| `labelColor?` | `string` |

### `AvatarToLayersOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `source` | `string \| Buffer` |
| `x` | `number` |
| `y` | `number` |
| `size` | `number` |
| `borderColor?` | `string` |
| `borderWidth?` | `number` |

### `CardToLayersOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `x` | `number` |
| `y` | `number` |
| `width` | `number` |
| `height` | `number` |
| `radius?` | `number` |
| `background?` | `string` |
| `borderColor?` | `string` |
| `borderWidth?` | `number` |
| `title?` | `string` |
| `titleFontSize?` | `number` |
| `titleColor?` | `string` |
| `body?` | `string` |
| `bodyFontSize?` | `number` |
| `bodyColor?` | `string` |
| `padding?` | `number` |

### `WatermarkToLayersOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `text` | `string` |
| `position?` | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left" \| "center"` |
| `fontSize?` | `number` |
| `color?` | `string` |
| `margin?` | `number` |
| `canvasWidth` | `number` |
| `canvasHeight` | `number` |

### `Component factory API`

| Property / member | Type, accepted values or signature |
|---|---|
| `badge.toLayers(options)` | `SceneLayer[]` |
| `progressBar.toLayers(options)` | `SceneLayer[]` |
| `avatar.toLayers(options)` | `SceneLayer[]` |
| `card.toLayers(options)` | `SceneLayer[]` |
| `watermark.toLayers(options)` | `SceneLayer[]` |

## Execution behavior, defaults and constraints

These layer factories are **static render helpers**, not React widgets with lifecycle, state or input events. Add their return arrays to a `SceneBuilder` or scene input.

## Source-of-truth files

- [`lib-next/types/components.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/components.ts)
- [`lib-next/components/painter-components.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/components/painter-components.ts)
- [`lib-next/components/badge.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/components/badge.ts)
- [`lib-next/components/progress-bar.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/components/progress-bar.ts)
- [`lib-next/components/avatar.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/components/avatar.ts)
- [`lib-next/components/card.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/components/card.ts)
- [`lib-next/components/watermark.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/components/watermark.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
