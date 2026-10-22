# Vertical bar, grouped, stacked, waterfall and lollipop — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createChart("bar", data, options?)`

Continuous-X vertical bar chart. Unlike a categorical-only chart, `BarChartData` declares required `xStart` and `xEnd` positions.

## Verified feature coverage

- Standard value bars
- Grouped/stacked per-bar segments
- Waterfall cumulative visualization and initial value
- Lollipop stems and end dots
- Continuous numeric-axis ranges with data positioning
- Per-bar and per-segment gradient/shadow/stroke

## Public types, nested properties and options

### `BarChartType`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"standard" \| "grouped" \| "stacked" \| "waterfall" \| "lollipop"` |

### `BarChartData`

| Property / member | Type, accepted values or signature |
|---|---|
| `label` | `string` |
| `value?` | `number` |
| `values?` | `BarSegment[]` |
| `xStart` | `number` |
| `xEnd` | `number` |
| `color?` | `string` |
| `gradient?` | `gradient` |
| `labelColor?` | `string` |
| `labelPosition?` | `"top" \| "left" \| "right" \| "inside" \| "bottom"` |
| `valueColor?` | `string` |
| `showValue?` | `boolean` |
| `opacity?` | `number` |
| `shadow?` | `{color?:string;offsetX?:number;offsetY?:number;blur?:number}` |
| `stroke?` | `{color?:string;width?:number;gradient?:gradient}` |

### `BarSegment`

| Property / member | Type, accepted values or signature |
|---|---|
| `value` | `number` |
| `color?` | `string` |
| `gradient?` | `gradient` |
| `label?` | `string` |
| `valueColor?` | `string` |
| `showValue?` | `boolean` |
| `opacity?` | `number` |
| `shadow?` | `{color?:string;offsetX?:number;offsetY?:number;blur?:number}` |
| `stroke?` | `{color?:string;width?:number;gradient?:gradient}` |

### `AxisConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `label?` | `string` |
| `labelColor?` | `string` |
| `range?` | `{min?:number;max?:number;step?:number}` |
| `values?` | `number[]` |
| `color?` | `string` |
| `width?` | `number` |
| `tickFontSize?` | `number` |
| `valueSpacing?` | `number` |

### `BarChartOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `type?` | `BarChartType` |
| `waterfall.initialValue?` | `number` |
| `dimensions?` | `{width?:number;height?:number;padding?:{top?:number;right?:number;bottom?:number;left?:number}}` |
| `appearance?` | `ChartAppearanceExtended` |
| `axes.x?` | `AxisConfig` |
| `axes.y?` | `AxisConfig & {baseline?:number}` |
| `labels.title?` | `{text?:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.barLabelDefaults?` | `{show?:boolean;defaultPosition?:"top"\|"left"\|"right"\|"inside"\|"bottom";fontSize?:number;defaultColor?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.valueLabelDefaults?` | `{show?:boolean;fontSize?:number;defaultColor?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `legend?` | `see LegendEntry + ChartLegend common; no fit/minWidth/width in this variant` |
| `grid?` | `{show?:boolean;color?:string;width?:number}` |
| `bars?` | `{spacing?:number;minWidth?:number;groupSpacing?:number;segmentSpacing?:number;lineWidth?:number;dotSize?:number;opacity?:number;shadow?:BarSegment.shadow;stroke?:BarSegment.stroke}` |

### `Legend (BarChartOptions.legend)`

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

## Execution behavior, defaults and constraints

Bar xStart/xEnd are required in the TypeScript data model even if a given chart layout might be interpreted categorically. `dimensions.width` should be explicit in fixed-size layouts; otherwise width may be inferred from the X range.

## Source-of-truth files

- [`lib-next/chart/impl/barchart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/barchart.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)
- [`lib-next/chart/chart-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-validation.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
