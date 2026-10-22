# Path2D shapes, bezier commands and custom connectors — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.path2d.create / draw / custom`

Creates Path2D drawing instructions, applies paths to raster canvases and renders custom line/connector specifications.

## Verified feature coverage

- Canvas Path2D and detailed move/line/curve/ellipse commands
- Polygon, rounded rectangle, star and arrow helpers
- Fill rules, gradients, stroke dashes, shadows and transforms
- Rich custom line connectors with markers/texture/arrows
- Scene path/customLines layers

## Public types, nested properties and options

### `PathCommand variants`

| Property / member | Type, accepted values or signature |
|---|---|
| `moveTo` | `{type:"moveTo";x:number;y:number}` |
| `lineTo` | `{type:"lineTo";x:number;y:number}` |
| `arc` | `{type:"arc";x:number;y:number;radius:number;startAngle:number;endAngle:number;counterclockwise?:boolean}` |
| `arcTo` | `{type:"arcTo";x1:number;y1:number;x2:number;y2:number;radius:number}` |
| `quadraticCurveTo` | `{type:"quadraticCurveTo";cpx:number;cpy:number;x:number;y:number}` |
| `bezierCurveTo` | `{type:"bezierCurveTo";cp1x:number;cp1y:number;cp2x:number;cp2y:number;x:number;y:number}` |
| `rect` | `{type:"rect";x:number;y:number;width:number;height:number}` |
| `ellipse` | `{type:"ellipse";x:number;y:number;radiusX:number;radiusY:number;rotation?:number;startAngle?:number;endAngle?:number;counterclockwise?:boolean}` |
| `closePath` | `{type:"closePath"}` |
| `circle` | `{type:"circle";x:number;y:number;radius:number}` |
| `roundedRect` | `{type:"roundedRect";x:number;y:number;width:number;height:number;radius:number\|{tl?:number;tr?:number;br?:number;bl?:number}}` |
| `polygon` | `{type:"polygon";points:Array<{x:number;y:number}>}` |
| `star` | `{type:"star";x:number;y:number;outerRadius:number;innerRadius:number;points:number}` |
| `arrow` | `{type:"arrow";x:number;y:number;length:number;angle:number;headLength?:number;headAngle?:number}` |

### `Path2DDrawOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `opacity?` | `number` |
| `globalCompositeOperation?` | `string` |
| `shadow?` | `{color?:string;gradient?:gradient;blur?:number;offsetX?:number;offsetY?:number}` |
| `gradientBounds?` | `{x:number;y:number;w:number;h:number}` |
| `stroke?` | `{color?:string;gradient?:gradient;width?:number;lineCap?:"butt"\|"round"\|"square";lineJoin?:"bevel"\|"round"\|"miter";miterLimit?:number;style?:"solid"\|"dashed"\|"dotted";dashArray?:number[];dashOffset?:number;opacity?:number}` |
| `fill?` | `{color?:string;gradient?:gradient;opacity?:number;rule?:"nonzero"\|"evenodd"}` |
| `transform?` | `{translateX?:number;translateY?:number;rotate?:number;scaleX?:number;scaleY?:number;originX?:number;originY?:number}` |

### `CustomOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `startCoordinates` | `{x:number;y:number}` |
| `endCoordinates` | `{x:number;y:number}` |
| `path?` | `{type:"smooth"\|"bezier"\|"catmull-rom";tension?:number;closed?:boolean}` |
| `arrow?` | `{start?:boolean;end?:boolean;size?:number;style?:"filled"\|"outline";color?:string}` |
| `markers?` | `Array<{position:number;shape:"circle"\|"square"\|"diamond"\|"arrow";size:number;color:string}>` |
| `lineStyle?` | `{width?:number;color?:string;gradient?:gradient;lineRadius?:number\|string;lineJoin?:"round"\|"bevel"\|"miter";lineCap?:"butt"\|"round"\|"square";singleLine?:boolean;lineDash?:{dashArray?:number[];offset?:number};pattern?:{type:"dots"\|"dashes"\|"custom";segments?:number[];offset?:number};texture?:string\|Buffer;stroke?:{color?:string;gradient?:gradient;width?:number;lineRadius?:number\|string;lineCap?:"butt"\|"round"\|"square"};shadow?:{offsetX?:number;offsetY?:number;blur?:number;color?:string;gradient?:gradient;lineRadius?:number\|string}}` |

### `Path2D facet API`

| Property / member | Type, accepted values or signature |
|---|---|
| `create(commands:PathCommand[])` | `Path2D` |
| `draw(canvasBuffer:CanvasResults\|Buffer,path:Path2D\|PathCommand[],options?:Path2DDrawOptions)` | `Promise<Buffer>` |
| `custom(options:CustomOptions\|CustomOptions[],buffer:CanvasResults\|Buffer)` | `Promise<Buffer>` |

## Execution behavior, defaults and constraints

`PathCommand` is a tagged union. `custom()` can generate connectors and styled paths from start/end geometry. The returned Path2D is Node-native and should not be treated as a browser-owned `Path2D` instance across a JSON transport boundary.

## Source-of-truth files

- [`lib-next/types/pathCommands.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/pathCommands.ts)
- [`lib-next/types/path2d-draw.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/path2d-draw.ts)
- [`lib-next/types/path.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/path.ts)
- [`lib-next/types/painter-facets.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/painter-facets.ts)
- [`lib-next/path/path2d-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/path/path2d-creator.ts)
- [`lib-next/path/custom-lines.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/path/custom-lines.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
