# Combined bar + line chart — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createComboChart(options, painterOpts?)`

Composite chart over a common X-axis with a primary Y-axis for bars and optional secondary Y-axis for lines.

## Verified feature coverage

- Bar-plus-line rendering in one plot
- Dual Y axes with automatic coloring
- Grouped/stacked bar modes
- Shared X coordinate system
- Separate style/opacity groups and configurable legend

## Public types, nested properties and options

### `ComboLineSeries`

| Property / member | Type, accepted values or signature |
|---|---|
| `inherits` | `LineSeries (all LineSeries properties)` |
| `yAxis?` | `"primary" \| "secondary" (default secondary)` |
| `opacity?` | `number` |

### `ComboChartOpacity`

| Property / member | Type, accepted values or signature |
|---|---|
| `bars?` | `number` |
| `lines?` | `number` |
| `grid?` | `number` |
| `primaryAxis?` | `number` |
| `secondaryAxis?` | `number` |
| `xAxis?` | `number` |
| `chartTitle?` | `number` |
| `legend?` | `number` |
| `barLabels?` | `number` |
| `valueLabels?` | `number` |
| `pointLabels?` | `number` |

### `ComboChartOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `bars` | `BarChartData[]` |
| `lines` | `ComboLineSeries[]` |
| `barsType?` | `"standard" \| "grouped" \| "stacked"` |
| `dimensions?` | `{width?:number;height?:number;padding?:{top?:number;right?:number;bottom?:number;left?:number}}` |
| `appearance?` | `ChartAppearanceExtended` |
| `axes.x?` | `AxisConfig` |
| `axes.y?` | `AxisConfig (primary left)` |
| `axes.ySecondary?` | `AxisConfig (right)` |
| `opacity?` | `ComboChartOpacity` |
| `labels.title?` | `{text?:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.barLabelDefaults?` | `{show?:boolean;fontSize?:number;defaultPosition?:"top"\|"left"\|"right"\|"inside"\|"bottom"}` |
| `labels.valueLabelDefaults?` | `{show?:boolean;fontSize?:number;defaultColor?:string}` |
| `labels.pointLabelDefaults?` | `{show?:boolean;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle;position?:"top"\|"bottom"\|"left"\|"right"}` |
| `legend?` | `includes shared Legend fields and fit, minWidth, width` |
| `grid?` | `{show?:boolean;color?:string;width?:number}` |
| `barStyle?` | `{minWidth?:number;groupSpacing?:number;opacity?:number;shadow?:BarChartData.shadow;stroke?:BarChartData.stroke}` |
| `secondaryYAxis?` | `{show?:boolean}` |

### `Legend (ComboChartOptions.legend)`

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

### `Underlying bar and line types`

| Property / member | Type, accepted values or signature |
|---|---|
| `bars[]` | `BarChartData (see 07_chart_bar)` |
| `lines[]` | `LineSeries + optional yAxis (see 09_chart_line)` |

## Execution behavior, defaults and constraints

Bars always use primary Y; lines default to secondary. If no line targets secondary, its visibility behavior changes. `barsType` only matters when bars contain `values`.

## Source-of-truth files

- [`lib-next/chart/impl/combochart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/combochart.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
