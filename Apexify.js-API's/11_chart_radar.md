# Radar / spider charts — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createChart("radar", series, options?)`

Radial polygon charts with shared category spokes, grid levels and optional fill.

## Verified feature coverage

- Many-series radar polygons
- Categories and radial numeric range
- Grid rings and axis text placement
- Gradient polygon fill and stroke
- Per-vertex dots and opacity
- Standard legends and title

## Public types, nested properties and options

### `RadarSeries`

| Property / member | Type, accepted values or signature |
|---|---|
| `label` | `string` |
| `values` | `number[] (length matches radar.categories)` |
| `color?` | `string` |
| `stroke?` | `string` |
| `gradient?` | `gradient` |
| `fillOpacity?` | `number` |
| `lineWidth?` | `number` |
| `opacity?` | `number` |

### `RadarChartOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `dimensions?` | `{width?:number;height?:number;padding?:{top?:number;right?:number;bottom?:number;left?:number}}` |
| `appearance?` | `ChartAppearanceExtended` |
| `radar.categories` | `string[]` |
| `radar.maxValue?` | `number (default max(series)*1.05)` |
| `radar.gridLevels?` | `number (nice-step default)` |
| `radar.labelMarginRatio?` | `number (default 0.12)` |
| `radar.fill?` | `boolean (default true)` |
| `radar.showPoints?` | `boolean (default false)` |
| `radar.pointRadius?` | `number` |
| `radar.gridColor?` | `string` |
| `radar.gridWidth?` | `number` |
| `radar.axisLabelFontSize?` | `number` |
| `radar.axisLabelColor?` | `string` |
| `radar.opacity?` | `number` |
| `labels.title?` | `{text?:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `legend?` | `includes shared Legend fields and fit, minWidth, width` |

### `Legend (RadarChartOptions.legend)`

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

RadarSeries.values should match category count (source-declared contract).

## Source-of-truth files

- [`lib-next/chart/impl/radarchart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/radarchart.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
