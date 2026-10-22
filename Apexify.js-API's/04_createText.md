# createText and measureText — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `ApexPainter.createText(text, canvasBuffer, options?, painterOpts?) / measureText(text)`

Comprehensive typography, text measurement and effects. Preferred nested groups: `font`, `decorations`, `effects`, `layout`, `placement`, `fill`; legacy flat aliases remain in v6.

## Verified feature coverage

- Nested and legacy text styling with explicit precedence
- Rich font family/path/name/weight/style
- Glyph decorations and backgrounds
- Shadow, glow, stroke, outline, gradient fills
- Text wrapping, layout metrics and measurements
- Affine and perspective text transforms
- Arc/curved text with sweep, radius and layout modes
- Grouped text composition

## Public types, nested properties and options

### `TextProperties`

| Property / member | Type, accepted values or signature |
|---|---|
| `text` | `string` |
| `x` | `number` |
| `y` | `number` |
| `font?` | `{size?;family?;name?;path?;weight?;style?}` |
| `decorations?` | `TextDecorations` |
| `effects?` | `TextEffects` |
| `layout?` | `TextLayout` |
| `placement?` | `TextPlacement` |
| `fill?` | `TextFill` |
| `stroke?` | `TextStrokeStyle` |
| `textOnCurve?` | `TextCurveConfig` |
| `includeCharMetrics?` | `boolean` |
| `measurementCanvas?` | `{width?:number;height?:number}` |
| `fontSize?` | `number (deprecated: font.size)` |
| `fontFamily?` | `string (deprecated: font.family)` |
| `fontName?` | `string (deprecated: font.name)` |
| `fontPath?` | `string (deprecated: font.path)` |
| `bold?` | `boolean (deprecated)` |
| `italic?` | `boolean (deprecated)` |
| `underline?` | `TextLineDecoration (deprecated)` |
| `overline?` | `TextLineDecoration (deprecated)` |
| `strikethrough?` | `TextLineDecoration (deprecated)` |
| `highlight?` | `TextHighlightStyle (deprecated)` |
| `glow?` | `TextGlowStyle (deprecated)` |
| `shadow?` | `TextShadowStyle (deprecated)` |
| `lineHeight?` | `number (deprecated)` |
| `letterSpacing?` | `number (deprecated)` |
| `wordSpacing?` | `number (deprecated)` |
| `maxWidth?` | `number (deprecated)` |
| `maxHeight?` | `number (deprecated)` |
| `textAlign?` | `TextAlignMode (deprecated)` |
| `textBaseline?` | `TextBaselineMode (deprecated)` |
| `rotation?` | `number (deprecated)` |
| `scaleX?` | `number (deprecated)` |
| `scaleY?` | `number (deprecated)` |
| `skewX?` | `number (deprecated)` |
| `skewY?` | `number (deprecated)` |
| `color?` | `string (deprecated)` |
| `gradient?` | `gradient (deprecated)` |
| `opacity?` | `number (deprecated)` |
| `isBold?` | `boolean (legacy deprecated)` |
| `outlined?` | `boolean (legacy deprecated)` |

### `font nested`

| Property / member | Type, accepted values or signature |
|---|---|
| `size?` | `number` |
| `family?` | `string` |
| `name?` | `string` |
| `path?` | `string` |
| `weight?` | `number \| "normal" \| "bold" \| "bolder" \| "lighter" (numeric 100..900)` |
| `style?` | `"normal" \| "italic" \| "oblique"` |

### `TextDecorations`

| Property / member | Type, accepted values or signature |
|---|---|
| `underline?` | `TextLineDecoration` |
| `overline?` | `TextLineDecoration` |
| `strikethrough?` | `TextLineDecoration` |
| `bold?` | `boolean` |
| `italic?` | `boolean` |

### `TextLineDecoration`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `boolean \| {color?:string;gradient?:gradient;width?:number}` |

### `TextEffects`

| Property / member | Type, accepted values or signature |
|---|---|
| `highlight?` | `TextHighlightStyle` |
| `glow?` | `TextGlowStyle` |
| `shadow?` | `TextShadowStyle` |

### `TextHighlightStyle`

| Property / member | Type, accepted values or signature |
|---|---|
| `color?` | `string` |
| `gradient?` | `gradient` |
| `opacity?` | `number` |

### `TextGlowStyle`

| Property / member | Type, accepted values or signature |
|---|---|
| `color?` | `string` |
| `gradient?` | `gradient` |
| `intensity?` | `number` |
| `opacity?` | `number` |

### `TextShadowStyle`

| Property / member | Type, accepted values or signature |
|---|---|
| `color?` | `string` |
| `gradient?` | `gradient` |
| `offsetX?` | `number` |
| `offsetY?` | `number` |
| `blur?` | `number` |
| `opacity?` | `number` |

### `TextStrokeStyle`

| Property / member | Type, accepted values or signature |
|---|---|
| `color?` | `string` |
| `width?` | `number` |
| `gradient?` | `gradient` |
| `opacity?` | `number` |
| `style?` | `"solid" \| "dashed" \| "dotted" \| "groove" \| "ridge" \| "double"` |

### `TextLayout`

| Property / member | Type, accepted values or signature |
|---|---|
| `lineHeight?` | `number` |
| `letterSpacing?` | `number` |
| `wordSpacing?` | `number` |
| `maxWidth?` | `number` |
| `maxHeight?` | `number` |

### `TextPlacement`

| Property / member | Type, accepted values or signature |
|---|---|
| `textAlign?` | `"left" \| "center" \| "right" \| "start" \| "end"` |
| `textBaseline?` | `"alphabetic" \| "bottom" \| "hanging" \| "ideographic" \| "middle" \| "top"` |
| `rotation?` | `number` |
| `scaleX?` | `number` |
| `scaleY?` | `number` |
| `skewX?` | `number (strict -90..90)` |
| `skewY?` | `number (strict -90..90)` |
| `perspective?` | `TextPerspectiveOptions` |

### `TextPerspectiveOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `points` | `[Point,Point,Point,Point] (TL,TR,BR,BL)` |
| `interpolation?` | `"nearest" \| "bilinear" \| "bicubic"` |
| `edgeMode?` | `"transparent" \| "clamp" \| "wrap" \| "mirror"` |

### `TextFill`

| Property / member | Type, accepted values or signature |
|---|---|
| `color?` | `string` |
| `gradient?` | `gradient` |
| `opacity?` | `number` |

### `TextCurveConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `sweepAngle` | `number` |
| `radius?` | `number` |
| `up?` | `boolean` |
| `layoutMode?` | `"fit" \| "clamp" \| "override"` |
| `baselineOffset?` | `number` |
| `startAngleDeg?` | `number` |

### `TextGroupTransformOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `rotation?` | `number` |
| `translateX?` | `number` |
| `translateY?` | `number` |
| `scaleX?` | `number` |
| `scaleY?` | `number` |
| `skewX?` | `number` |
| `skewY?` | `number` |
| `pivotX?` | `number` |
| `pivotY?` | `number` |
| `opacity?` | `number` |
| `blendMode?` | `GlobalCompositeOperation` |
| `perspective?` | `TextPerspectiveOptions` |

### `CreateTextOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `isGrouped?` | `boolean` |
| `groupTransform?` | `TextGroupTransformOptions` |

### `TextFontWeight`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `number \| "normal" \| "bold" \| "bolder" \| "lighter"` |

### `TextFontStyle`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"normal" \| "italic" \| "oblique"` |

### `TextAlignMode`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"left" \| "center" \| "right" \| "start" \| "end"` |

### `TextBaselineMode`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"alphabetic" \| "bottom" \| "hanging" \| "ideographic" \| "middle" \| "top"` |

### `CurvedTextLayoutMode`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"fit" \| "clamp" \| "override"` |

### `CircularArcLayoutOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `sweepDegrees` | `number` |
| `radius?` | `number` |
| `up` | `boolean` |
| `layoutMode?` | `CurvedTextLayoutMode` |
| `baselineOffset?` | `number` |
| `startAngleDeg?` | `number` |

### `GlyphArcPlacement`

| Property / member | Type, accepted values or signature |
|---|---|
| `grapheme` | `string` |
| `x` | `number` |
| `y` | `number` |
| `rotationRad` | `number` |
| `resolvedRadius` | `number` |
| `resolvedSweepRad` | `number` |

### `TextObject (deprecated)`

| Property / member | Type, accepted values or signature |
|---|---|
| `inherits` | `TextProperties (no additional properties)` |

### `TextMetrics`

| Property / member | Type, accepted values or signature |
|---|---|
| `width` | `number` |
| `actualBoundingBoxAscent` | `number` |
| `actualBoundingBoxDescent` | `number` |
| `actualBoundingBoxLeft` | `number` |
| `actualBoundingBoxRight` | `number` |
| `fontBoundingBoxAscent` | `number` |
| `fontBoundingBoxDescent` | `number` |
| `alphabeticBaseline?` | `number` |
| `emHeightAscent?` | `number` |
| `emHeightDescent?` | `number` |
| `hangingBaseline?` | `number` |
| `ideographicBaseline?` | `number` |
| `height` | `number` |
| `lineHeight` | `number` |
| `baseline` | `number` |
| `top` | `number` |
| `bottom` | `number` |
| `centerX` | `number` |
| `centerY` | `number` |
| `lines?` | `Array<{text:string;width:number;height:number;metrics:Omit<TextMetrics,...>}>` |
| `totalHeight?` | `number` |
| `lineCount?` | `number` |
| `charWidths?` | `number[]` |
| `charPositions?` | `Array<{x:number;width:number}>` |

## Execution behavior, defaults and constraints

When nested and corresponding flat legacy property are both specified, the nested value wins. `textOnCurve.layoutMode`: `fit` derives radius from text width and sweep; `clamp` enforces no crowding (default); `override` retains chosen radius and expands sweep as required. `createText` returns PNG bytes; `measureText` returns `TextMetrics`. Third-argument overload is ambiguous: a `CreateTextOptions` with `isGrouped`/`groupTransform` is interpreted differently from a trailing `PainterAssetRefsOptions`.

## Example (API-oriented)

```ts
const png = await painter.createText({
 text:'Apexify', x:480, y:240,
 font:{size:72,family:'Arial',weight:700},
 fill:{color:'#fff',opacity:1},
 placement:{textAlign:'center',textBaseline:'middle',rotation:-4},
 effects:{shadow:{color:'#0008',offsetY:8,blur:16}},
 layout:{letterSpacing:2},
},base);
```

## Source-of-truth files

- [`lib-next/types/text.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/text.ts)
- [`lib-next/apex-painter/main.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/main.ts)
- [`lib-next/text/text-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/text/text-creator.ts)
- [`lib-next/text/text-style.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/text/text-style.ts)
- [`lib-next/text/text-layout.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/text/text-layout.ts)
- [`lib-next/text/enhanced-text-renderer.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/text/enhanced-text-renderer.ts)
- [`lib-next/text/text-curved.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/text/text-curved.ts)
- [`lib-next/text/text-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/text/text-validation.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
