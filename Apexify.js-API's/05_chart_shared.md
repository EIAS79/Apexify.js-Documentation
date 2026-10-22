# Charts — common appearance, axes, legends — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createChart / createComparisonChart / createComboChart`

Cross-cutting options inherited or duplicated across all supported chart families. Chart-specific files cover the seven chart kinds and two composite builders.

## Verified feature coverage

- Typed chart dataset variants
- Shared background / borders / labels
- Legends including gradients, wrapping and measured positioning
- Per-chart-axis grid/tick controls
- Multi-format charts drawn to output PNG buffers

## Public types, nested properties and options

### `ChartType`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"pie" \| "bar" \| "horizontalBar" \| "line" \| "scatter" \| "radar" \| "polarArea"` |

### `ChartAppearanceExtended`

| Property / member | Type, accepted values or signature |
|---|---|
| `backgroundColor?` | `string` |
| `backgroundGradient?` | `gradient` |
| `backgroundImage?` | `string` |
| `customBg?` | `CanvasConfig["customBg"]` |
| `bgLayers?` | `BackgroundLayer[]` |
| `patternBg?` | `PatternOptions` |
| `noiseBg?` | `{intensity?:number}` |
| `blur?` | `number` |
| `axisColor?` | `string` |
| `axisWidth?` | `number` |
| `arrowSize?` | `number` |
| `yAxisArrowExtensionPastMaxTickPx?` | `number` |
| `yAxisArrowTipOffsetY?` | `number` |
| `borderRadius?` | `number` |
| `borderWidth?` | `number` |
| `borderColor?` | `string` |

### `EnhancedTextStyle`

| Property / member | Type, accepted values or signature |
|---|---|
| `fontPath?` | `string` |
| `fontName?` | `string` |
| `fontFamily?` | `string` |
| `fontSize?` | `number` |
| `bold?` | `boolean` |
| `italic?` | `boolean` |
| `shadow?` | `{color?:string;offsetX?:number;offsetY?:number;blur?:number;opacity?:number}` |
| `stroke?` | `{color?:string;width?:number;gradient?:gradient}` |
| `glow?` | `{color?:string;intensity?:number;opacity?:number}` |

### `LegendEntry`

| Property / member | Type, accepted values or signature |
|---|---|
| `color?` | `string` |
| `gradient?` | `gradient` |
| `label` | `string` |

### `LegendPlacement`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"top" \| "bottom" \| "left" \| "right" \| "top-left" \| "top-right" \| "bottom-left" \| "bottom-right" \| "right-top" \| "right-bottom" \| "left-top" \| "left-bottom"` |

### `StandardLegendConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `show?` | `boolean` |
| `position?` | `LegendPlacement \| string` |
| `fontSize?` | `number` |
| `backgroundColor?` | `string` |
| `backgroundGradient?` | `gradient` |
| `borderColor?` | `string` |
| `textColor?` | `string` |
| `textGradient?` | `gradient` |
| `textStyle?` | `EnhancedTextStyle` |
| `spacing?` | `number` |
| `padding?` | `number` |
| `maxWidth?` | `number` |
| `wrapText?` | `boolean` |

### `ConnectedLegendConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `show?` | `boolean` |
| `fontSize?` | `number` |
| `backgroundColor?` | `string` |
| `backgroundGradient?` | `gradient` |
| `borderColor?` | `string` |
| `textColor?` | `string` |
| `textGradient?` | `gradient` |
| `textStyle?` | `EnhancedTextStyle` |
| `lineColor?` | `string` |
| `lineGradient?` | `gradient` |
| `lineWidth?` | `number` |
| `padding?` | `number` |
| `maxWidth?` | `number` |
| `wrapText?` | `boolean` |

### `ChartDimensions common pattern`

| Property / member | Type, accepted values or signature |
|---|---|
| `width?` | `number` |
| `height?` | `number` |
| `padding?` | `{top?:number;right?:number;bottom?:number;left?:number}` |

## Execution behavior, defaults and constraints

Public `createChart(chartType, data, options?, painterOpts?)` has a generic type relationship between each chart type and its corresponding data/options. `createComparisonChart` and `createComboChart` are separate methods, not `createChart` type strings.

## Source-of-truth files

- [`lib-next/types/chart-common.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/chart-common.ts)
- [`lib-next/types/chart-pie.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/chart-pie.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)
- [`lib-next/chart/chart-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-validation.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
