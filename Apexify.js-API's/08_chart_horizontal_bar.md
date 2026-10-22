# Horizontal bar and grouped/stacked/lollipop — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createChart("horizontalBar", data, options?)`

Horizontal bar family with row extents, optional numeric x/y positions and segment styles.

## Verified feature coverage

- Four horizontal bar rendering modes
- Independent x/y axis configuration
- Row labels, value labels, custom ticks/grid line styles
- Custom line width, dot radius, rounding and opacity
- Grouped and stacked segments

## Public types, nested properties and options

### `HorizontalBarChartType`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"standard" \| "grouped" \| "stacked" \| "lollipop"` |

### `HorizontalBarSegment`

| Property / member | Type, accepted values or signature |
|---|---|
| `value` | `number` |
| `color?` | `string` |
| `gradient?` | `gradient` |
| `label?` | `string` |
| `valueColor?` | `string` |
| `showValue?` | `boolean` |
| `opacity?` | `number` |

### `HorizontalBarChartData`

| Property / member | Type, accepted values or signature |
|---|---|
| `label` | `string` |
| `value?` | `number` |
| `values?` | `HorizontalBarSegment[]` |
| `xStart?` | `number` |
| `xEnd?` | `number` |
| `yStart?` | `number` |
| `yEnd?` | `number` |
| `color?` | `string` |
| `gradient?` | `gradient` |
| `labelColor?` | `string` |
| `labelPosition?` | `"top" \| "left" \| "right" \| "inside" \| "bottom"` |
| `valueColor?` | `string` |
| `showValue?` | `boolean` |
| `opacity?` | `number` |

### `HorizontalAxisConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `label?` | `string` |
| `labelColor?` | `string` |
| `range?` | `{min?:number;max?:number;step?:number}` |
| `values?` | `number[]` |
| `color?` | `string` |
| `width?` | `number` |
| `tickFontSize?` | `number` |
| `tickColor?` | `string` |
| `valueSpacing?` | `number` |

### `HorizontalBarChartOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `type?` | `HorizontalBarChartType` |
| `dimensions?` | `{width?:number;height?:number;padding?:{top?:number;right?:number;bottom?:number;left?:number}}` |
| `appearance?` | `ChartAppearanceExtended` |
| `axes.x?` | `HorizontalAxisConfig & {baseline?:number}` |
| `axes.y?` | `HorizontalAxisConfig` |
| `labels.title?` | `{text?:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.barLabelDefaults?` | `{show?:boolean;defaultPosition?:"top"\|"left"\|"right"\|"inside"\|"bottom";fontSize?:number;defaultColor?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.valueLabelDefaults?` | `{show?:boolean;fontSize?:number;defaultColor?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `legend?` | `see nested legend fields below` |
| `grid?` | `{show?:boolean;color?:string;width?:number;lineWidth?:number;style?:"solid"\|"dashed"\|"dotted"}` |
| `bars?` | `{spacing?:number;minHeight?:number;groupSpacing?:number;segmentSpacing?:number;lineWidth?:number;dotSize?:number;borderRadius?:number;opacity?:number}` |

### `Legend (HorizontalBarChartOptions.legend)`

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

Each horizontal segment has an independent opacity. Vertical bar shadow/stroke fields are not part of the horizontal data interfaces.

## Source-of-truth files

- [`lib-next/chart/impl/horizontalbarchart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/horizontalbarchart.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
