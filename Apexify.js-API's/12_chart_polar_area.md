# Polar area charts — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createChart("polarArea", slices, options?)`

Polar area charts with value-scaled sector radius or area and optional donut-like center.

## Verified feature coverage

- Polar sectors with configurable radius
- Area-proportional scaling via square root of value ratio
- Center hole, angular start, gradients
- Value formatting, labels and legend

## Public types, nested properties and options

### `PolarAreaSlice`

| Property / member | Type, accepted values or signature |
|---|---|
| `label` | `string` |
| `value` | `number` |
| `color?` | `string` |
| `gradient?` | `gradient` |
| `opacity?` | `number` |

### `PolarAreaChartOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `dimensions?` | `{width?:number;height?:number;padding?:{top?:number;right?:number;bottom?:number;left?:number}}` |
| `appearance?` | `ChartAppearanceExtended` |
| `scale?` | `"radius" \| "area" (default radius)` |
| `polar.innerRadiusRatio?` | `number` |
| `polar.labelBandRatio?` | `number (default 0.18)` |
| `polar.sliceStrokeWidth?` | `number` |
| `polar.sliceStrokeColor?` | `string` |
| `polar.startAngleDeg?` | `number (default -90)` |
| `polar.opacity?` | `number` |
| `labels.title?` | `{text?:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.showValues?` | `boolean (default false)` |
| `labels.valueFormat?` | `(value:number,fraction:number)=>string` |
| `labels.sliceLabelFontSize?` | `number` |
| `labels.sliceLabelColor?` | `string` |
| `legend?` | `includes shared Legend fields and fit, minWidth, width` |

### `Legend (PolarAreaChartOptions.legend)`

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

`scale:"area"` is different from the default linear-radius mapping. The public `PolarAreaSlice` only has `label`, `value`, optional `color`, `gradient`, and `opacity`.

## Source-of-truth files

- [`lib-next/chart/impl/polarareachart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/polarareachart.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
