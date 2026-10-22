# Two-chart comparison layouts — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createComparisonChart(options, painterOpts?)`

Composes exactly two independent supported charts into a combined output canvas.

## Verified feature coverage

- Independent chart types within one comparison
- Side-by-side or stacked orientation
- Per-subchart title, global title, spacing
- Common output background and dimensions

## Public types, nested properties and options

### `ComparisonLayout`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"sideBySide" \| "topBottom"` |

### `ComparisonChartType`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"pie" \| "donut" \| "bar" \| "horizontalBar" \| "line" \| "scatter" \| "radar" \| "polarArea"` |

### `ComparisonChartConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `ComparisonChartType` |
| `data` | `ComparisonChartData` |
| `options` | `IndividualChartOptions` |
| `title?` | `{text:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `barType?` | `"standard" \| "grouped" \| "stacked" \| "lollipop" \| "waterfall"` |
| `lineStyle?` | `LineStyle` |
| `lineSmoothness?` | `"none" \| "bezier" \| "spline"` |

### `ComparisonChartOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `dimensions?` | `{width?:number;height?:number;padding?:{top?:number;right?:number;bottom?:number;left?:number}}` |
| `layout?` | `"sideBySide" \| "topBottom"` |
| `spacing?` | `number` |
| `appearance?` | `ChartAppearanceExtended` |
| `generalTitle?` | `{text:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `chart1` | `ComparisonChartConfig` |
| `chart2` | `ComparisonChartConfig` |

## Execution behavior, defaults and constraints

Each chart must carry a valid data/options pair for its declared type. The comparison object is not a generic arbitrary-N chart dashboard.

## Source-of-truth files

- [`lib-next/chart/impl/comparisonchart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/comparisonchart.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
