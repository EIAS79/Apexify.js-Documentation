# Line, spline, regression, error-bar and area charts — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createChart("line", series, options?)`

Line and area chart with numeric coordinates, multiple series, per-point markers, interpolations, error bars and fitted correlations.

## Verified feature coverage

- Multiple continuous numeric-coordinate series
- Straight, stepped and smoothed paths
- Markers and per-point labels
- Positive/negative error bars
- Area filling above/below/between curves
- Optional fitted correlation/regression
- Numeric, log and date-formatted axes

## Public types, nested properties and options

### `LineStyle`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"solid" \| "dashed" \| "dotted" \| "dashdot" \| "longdash" \| "shortdash" \| "dashdotdot" \| "step" \| "stepline"` |

### `MarkerType`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"circle" \| "square" \| "triangle" \| "diamond" \| "cross" \| "none"` |

### `LineDataPoint`

| Property / member | Type, accepted values or signature |
|---|---|
| `x` | `number` |
| `y` | `number` |
| `label?` | `string` |
| `markerColor?` | `string` |
| `showMarker?` | `boolean` |
| `errorBar?` | `ErrorBarConfig` |

### `ErrorBarConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `positive?` | `number` |
| `negative?` | `number` |
| `color?` | `string` |
| `width?` | `number` |
| `capSize?` | `number` |
| `show?` | `boolean` |

### `AreaConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `type?` | `"none" \| "below" \| "above" \| "between" \| "around"` |
| `color?` | `string` |
| `opacity?` | `number` |
| `secondLine?` | `LineSeries` |
| `upperBound?` | `number[]` |
| `lowerBound?` | `number[]` |
| `show?` | `boolean` |
| `toValue?` | `number` |
| `showAreaSize?` | `boolean` |
| `areaSizeColor?` | `string` |

### `LineSeries`

| Property / member | Type, accepted values or signature |
|---|---|
| `label` | `string` |
| `data` | `LineDataPoint[]` |
| `color?` | `string` |
| `gradient?` | `gradient` |
| `lineWidth?` | `number` |
| `lineStyle?` | `LineStyle` |
| `smoothness?` | `SmoothnessType ("none" \| "bezier" \| "spline")` |
| `smoothnessTension?` | `number (0..1; default ~0.35 in renderer)` |
| `showLine?` | `boolean` |
| `errorBar?` | `{show?:boolean;color?:string;width?:number;capSize?:number}` |
| `area?` | `AreaConfig` |
| `correlation?` | `{type?:CorrelationType;degree?:number;color?:string;lineWidth?:number;lineStyle?:LineStyle;show?:boolean}` |
| `marker?` | `{type?:MarkerType;size?:number;color?:string;show?:boolean;filled?:boolean}` |
| `opacity?` | `number` |

### `AxisConfig`

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

### `LineChartOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `dimensions?` | `{width?:number;height?:number;padding?:{top?:number;right?:number;bottom?:number;left?:number}}` |
| `appearance?` | `ChartAppearanceExtended` |
| `axes.x?` | `AxisConfig` |
| `axes.y?` | `AxisConfig` |
| `labels.title?` | `{text?:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.pointLabelDefaults?` | `{show?:boolean;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle;position?:"top"\|"bottom"\|"left"\|"right"}` |
| `legend?` | `includes shared Legend fields and fit, minWidth, width` |
| `grid?` | `{show?:boolean;color?:string;width?:number}` |
| `lines?` | `{opacity?:number}` |

### `Legend (LineChartOptions.legend)`

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

## Execution behavior, defaults and constraints

For `area.type:"between"`, the second line / upper-lower boundaries must align with the host X coordinates. Line opacity is a multiplier across line, area, markers, error bars and correlations; a series value overrides the chart-level default.

## Source-of-truth files

- [`lib-next/chart/impl/linechart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/linechart.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
