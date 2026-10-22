# Pie and donut charts — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createChart("pie", slices, options?)`

One pie/donut series with configurable slice fills, value labels, gradients, legends and title.

## Verified feature coverage

- Pie and donut geometry
- Per-slice color/gradient/opacity/stroke/shadow
- Per-slice vs global label controls
- Standard or connected legends
- Custom percentage/value formatting callback

## Public types, nested properties and options

### `PieSlice`

| Property / member | Type, accepted values or signature |
|---|---|
| `label` | `string` |
| `value` | `number` |
| `color?` | `string` |
| `gradient?` | `gradient` |
| `showValue?` | `boolean` |
| `showLabel?` | `boolean` |
| `valueLabel?` | `string` |
| `opacity?` | `number` |
| `shadow?` | `{color?:string;offsetX?:number;offsetY?:number;blur?:number}` |
| `stroke?` | `{color?:string;width?:number;gradient?:gradient}` |

### `PieChartOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `dimensions?` | `{width?:number;height?:number;padding?:{top?:number;right?:number;bottom?:number;left?:number}}` |
| `appearance?` | `ChartAppearanceExtended` |
| `type?` | `"pie" \| "donut"` |
| `donutInnerRadius?` | `number` |
| `labels.title?` | `{text?:string;fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.sliceLabels?` | `{fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.valueLabels?` | `{fontSize?:number;color?:string;gradient?:gradient;textStyle?:EnhancedTextStyle}` |
| `labels.showValues?` | `boolean` |
| `labels.showLabels?` | `boolean` |
| `labels.valueFormat?` | `(value:number, percentage:number)=>string` |
| `legends.standard?` | `StandardLegendConfig` |
| `legends.connected?` | `ConnectedLegendConfig` |
| `slices.opacity?` | `number` |
| `slices.shadow?` | `{color?:string;offsetX?:number;offsetY?:number;blur?:number}` |
| `slices.stroke?` | `{color?:string;width?:number;gradient?:gradient}` |

## Execution behavior, defaults and constraints

`type:"donut"` is an option of the `"pie"` chart family. A data item’s `showValue`/`showLabel` and styling can override chart defaults where implemented.

## Example (API-oriented)

```ts
const png = await painter.createChart('pie', [{label:'A',value:40,color:'#22c55e'},{label:'B',value:60,color:'#6366f1'}], {type:'donut', donutInnerRadius:60, labels:{showValues:true}});
```

## Source-of-truth files

- [`lib-next/types/chart-pie.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/chart-pie.ts)
- [`lib-next/chart/impl/piechart.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/impl/piechart.ts)
- [`lib-next/chart/chart-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/chart/chart-creator.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
