# Scatter and correlation charts — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createChart("scatter", series, options?)`

XY scatter plots with optional trend/regression lines and configurable markers.

## Verified feature coverage

- XY point series and marker shapes
- Per-series opacity, gradients and radius
- Trend/correlation line fitting
- Auto weak-correlation flat mean line
- Independent axes and legend / grid

## Public types, nested properties and options

### `ScatterPoint`

| Property / member | Type, accepted values or signature |
|---|---|
| `x` | `number` |
| `y` | `number` |
| `label?` | `string` |

### `ScatterMarkerType`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"circle" \| "square" \| "diamond" \| "cross" \| "none"` |

### `ScatterSeries`

| Property / member | Type, accepted values or signature |
|---|---|
| `label` | `string` |
| `data` | `ScatterPoint[]` |
| `color?` | `string` |
| `gradient?` | `gradient` |
| `markerSize?` | `number` |
| `markerType?` | `ScatterMarkerType` |
| `opacity?` | `number` |
| `correlation?` | `ScatterCorrelationConfig` |

### `ScatterCorrelationConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `show?` | `boolean` |
| `type?` | `"auto" \| CorrelationType` |
| `flatThreshold?` | `number (default 0.15)` |
| `color?` | `string` |
| `lineWidth?` | `number` |
| `lineStyle?` | `LineStyle` |
| `degree?` | `number` |

### `ScatterChartOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `dimensions?` | `{width?:number;height?:number;padding?:{top?:number;right?:number;bottom?:number;left?:number}}` |
| `appearance?` | `ChartAppearanceExtended` |
| `axes.x?` | `AxisConfig` |
| `axes.y?` | `AxisConfig` |
| `labels.title?` | `{text?:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `legend?` | `includes shared Legend fields and fit, minWidth, width` |
| `grid?` | `{show?:boolean;color?:string;width?:number}` |
| `points?` | `{opacity?:number}` |
| `axisPaddingRatio?` | `number (default 0.06)` |

### `Legend (ScatterChartOptions.legend)`

| Property / member | Type, accepted values or signature |
|---|---|
| `show?` | `boolean` |
| `entries?` | `LegendEntry[]` |
| `position?` | `LegendPlacement \| string` |
| `spacing?` | `number` |
| `fontSize?` | `number` |
| `backgroundColor?` | `string` |
| `backgroundGradient?` | `gradient` |
| `borderColor?` | `string` |
| `textColor?` | `string` |
| `textGradient?` | `gradient` |
| `textStyle?` | `EnhancedTextStyle` |
| `padding?` | `number` |
| `maxWidth?` | `number` |
| `wrapText?` | `boolean` |
| `fit?` | `"content" \| "stretch"` |
| `minWidth?` | `number` |
| `width?` | `number` |

### `AxisConfig (imported line chart)`

| Property / member | Type, accepted values or signature |
|---|---|
| `label?` | `string` |
| `labelColor?` | `string` |
| `range?` | `{min?:number;max?:number;step?:number}` |
| `values?` | `number[]` |
| `showTickMarks?` | `boolean` |
| `showTickLabels?` | `boolean` |
| `color?` | `string` |
| `width?` | `number` |
| `tickFontSize?` | `number` |
| `valueSpacing?` | `number` |
| `baseline?` | `number` |
| `scale?` | `"linear" \| "log"` |
| `dateFormat?` | `string` |
| `dateTime?` | `boolean` |
| `arrowExtensionPastMaxTickPx?` | `number` |
| `arrowTipOffsetY?` | `number` |

## Execution behavior, defaults and constraints

`correlation.type:"auto"` compares Pearson |r| to `flatThreshold` and uses a horizontal mean line below threshold; otherwise uses linear fit. Polynomial regression supports `degree`.

## Source-of-truth files

- [`lib-next/chart/impl/scatterchart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/scatterchart.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)
- [`lib-next/chart/impl/linechart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/linechart.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
