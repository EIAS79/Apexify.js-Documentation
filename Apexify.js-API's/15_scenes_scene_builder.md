# Scenes, renderScene, SceneBuilder and scene export — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createScene / renderScene / validateSceneRenderInput / renderSceneToGIF / renderSceneToVideoFrames`

Layer-ordered declarative composition with nested offscreen surfaces, charts, images, text and paths. Root scenes produce a PNG Buffer; scene-to-GIF/video hooks bridge into media output.

## Verified feature coverage

- Stable bottom-to-top draw-order layer stack
- Nested child surfaces with placement, transforms and alpha
- Charts render into scene via intermediate decoded raster
- Synchronous builder mutation and isolated snapshots
- Optional named `$ref` lookup
- Mandatory scene validation and scene/global resource bounds
- Scene export bridges to GIF and video frame rendering

## Public types, nested properties and options

### `SceneRenderInput`

| Property / member | Type, accepted values or signature |
|---|---|
| `width` | `number` |
| `height` | `number` |
| `background?` | `SceneBackground (CanvasConfig minus width,height)` |
| `layers` | `SceneLayer[]` |

### `SceneLayer image`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"image"` |
| `images` | `ImageProperties \| ImageProperties[]` |
| `options?` | `CreateImageOptions` |

### `SceneLayer text`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"text"` |
| `texts` | `TextProperties \| TextProperties[]` |
| `options?` | `CreateTextOptions` |

### `SceneLayer path`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"path"` |
| `path` | `PathCommand[] \| unknown` |
| `options?` | `Path2DDrawOptions` |

### `SceneLayer imageBuffer`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"imageBuffer"` |
| `buffer` | `Buffer` |
| `x` | `number` |
| `y` | `number` |
| `width?` | `number` |
| `height?` | `number` |
| `globalAlpha?` | `number` |
| `globalCompositeOperation?` | `GlobalCompositeOperation` |

### `SceneLayer chart`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"chart"` |
| `chartType` | `"pie" \| "bar" \| "horizontalBar" \| "line" \| "scatter" \| "radar" \| "polarArea"` |
| `data` | `unknown` |
| `options?` | `unknown` |
| `x` | `number` |
| `y` | `number` |
| `width?` | `number` |
| `height?` | `number` |
| `opacity?` | `number` |

### `SceneLayer chartComparison`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"chartComparison"` |
| `options` | `unknown (ComparisonChartOptions)` |
| `x` | `number` |
| `y` | `number` |
| `width?` | `number` |
| `height?` | `number` |
| `opacity?` | `number` |

### `SceneLayer chartCombo`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"chartCombo"` |
| `options` | `unknown (ComboChartOptions)` |
| `x` | `number` |
| `y` | `number` |
| `width?` | `number` |
| `height?` | `number` |
| `opacity?` | `number` |

### `SceneLayer customLines`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"customLines"` |
| `lines` | `CustomOptions \| CustomOptions[]` |

### `SceneLayer surface`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"surface"` |
| `placement` | `SceneSurfacePlacement` |
| `background?` | `SceneBackground` |
| `layers` | `SceneLayer[]` |

### `SceneSurfacePlacement`

| Property / member | Type, accepted values or signature |
|---|---|
| `x` | `number` |
| `y` | `number` |
| `width` | `number` |
| `height` | `number` |
| `opacity?` | `number` |
| `rotation?` | `number` |
| `scaleX?` | `number` |
| `scaleY?` | `number` |
| `globalCompositeOperation?` | `GlobalCompositeOperation` |

### `SceneRenderOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `validate?` | `boolean (deprecated; ignored: validation is mandatory)` |
| `maxSurfaceDepth?` | `number` |
| `resolveAssetRefs?` | `boolean (default true for painter.renderScene; default false for SceneBuilder.render)` |

### `SceneBuilder public API`

| Property / member | Type, accepted values or signature |
|---|---|
| `setBackground(background)` | `this` |
| `clearBackground()` | `this` |
| `addLayer(layer)` | `this` |
| `addLayers(layers)` | `this` |
| `replaceLayers(layers)` | `this` |
| `replaceLayer(index,layer)` | `this` |
| `clearLayers()` | `this` |
| `insertLayer(index,layer)` | `this` |
| `insertLayers(index,layers)` | `this` |
| `insertBefore(index,layer)` | `this` |
| `insertAfter(index,layer)` | `this` |
| `removeLayer(index)` | `this` |
| `moveLayer(fromIndex,toIndex)` | `this` |
| `layerCount` | `number` |
| `toRenderInput()` | `SceneRenderInput (isolated snapshot)` |
| `render(options?)` | `Promise<Buffer>` |

### `renderSceneToGIF input`

| Property / member | Type, accepted values or signature |
|---|---|
| `scene` | `SceneRenderInput` |
| `gif.options` | `GIFOptions` |
| `gif.gifFrames?` | `SceneGifInputFrame[]` |
| `gif.prependComposedRaster?` | `boolean` |
| `gif.composedFrameDuration?` | `number` |
| `gif.composedFrameRepeat?` | `number` |
| `gif.sceneRender?` | `SceneRenderOptions` |

### `renderSceneToVideoFrames input`

| Property / member | Type, accepted values or signature |
|---|---|
| `scene` | `SceneRenderInput` |
| `video.options` | `VideoCreationOptions` |
| `video.prependComposedToFrames?` | `boolean` |
| `video.framesWithRepeats?` | `SceneVideoFrameSlot[]` |
| `video.sceneRender?` | `SceneRenderOptions` |

## Execution behavior, defaults and constraints

`renderScene()` validates before painting even when deprecated `{validate:false}` is passed. Root and child canvases stay native until root PNG encoding; chart layers first render to PNG and are decoded. `createScene` returns a builder with copy-on-ingress; `toRenderInput()` clones. Nested surfaces are not a generic retained/event-capable DOM graph.

## Example (API-oriented)

```ts
const scene = painter.createScene(640, 360)
  .setBackground({colorBg:'#101827'})
  .addLayer({type:'text',texts:{text:'Hello',x:40,y:120,font:{size:56},fill:{color:'#fff'}}});
const png = await scene.render();
```

## Source-of-truth files

- [`lib-next/types/scene.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/scene.ts)
- [`lib-next/scene/scene-builder.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/scene/scene-builder.ts)
- [`lib-next/scene/scene-creator.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/scene/scene-creator.ts)
- [`lib-next/scene/scene-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/scene/scene-validation.ts)
- [`lib-next/scene/gif-scene.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/scene/gif-scene.ts)
- [`lib-next/scene/render-scene-to-video.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/scene/render-scene-to-video.ts)
- [`lib-next/apex-painter/main.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/main.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
