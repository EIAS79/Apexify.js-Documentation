# Apexify.js v6 — createCanvas pinned-runtime upstream defect proposals

Target package: Apexify.js 6.0.0, locked at `379a5248f09ed39c1b1734fe104b6bd73a77857f`. Reproduction lives in `tests/workspace/pinned-engine-contract-s10.test.ts` and runs against the **installed pinned public** `ApexPainter.createCanvas`, not current engine main.

## Procedural pattern repeat (confirmed unused for procedural types)

For root `patternBg.type='stripes'`, changing `repeat` among `repeat`, `repeat-x`, `repeat-y`, `no-repeat` produces exactly identical decoded RGBA at 96×64 with nonuniform stripes, size 9, spacing 13 and rotation 13. This is not an incorrect wait or flat-color sampling.

Source-map evidence, installed `dist/cjs/index.cjs.map`, `lib-next/canvas/pattern-renderer.ts`:
- lines 78–115 dispatch to procedural implementations with no repeat-mode handling.
- lines 382–413: `renderCustomPattern` reads `repeat` and actually branches on modes.
- contrast `lib-next/canvas/background-renderer.ts` lines 210–217, 288: asset-backed `BackgroundLayer.type='pattern'` uses `ctx.createPattern(img, repeat)`. Direct pinned API confirms those modes produce different images.

Proposed **engine-only, owner-approved** fix: specify how `repeat` should apply to procedural geometries (some render across entire viewport, so repeat may have no semantic meaning unless rendered as bounded tiles), then implement consistent finite tile-generation or explicitly scope/restrict `repeat` to `custom` patterns. Avoid silently claiming all procedural repeat variants work. Add pixel assertions against baseline and per-mode with offsets, rotations, transparent edges and resource caps. No engine package changes made in this checkpoint.

## Pattern GradientConfig.angle (confirmed accepted but unused)

For a dots pattern using `PatternOptions.gradient={type:'linear',startX:0,startY:0,endX:96,endY:48,colors:[...]}`, `angle` values 0/30/45/90/180 produce exactly identical decoded RGBA at 96×64. In contrast, root `CanvasConfig.gradientBg.rotate=55` changes decoded PNG pixels.

Source-map evidence, installed `dist/cjs/index.cjs.map`:
- `lib-next/canvas/pattern-renderer.ts` lines 130–140 passes `patternOptions.gradient` directly to `createGradientFill`.
- `lib-next/render/gradient-fill.ts` lines 53–72 destructures **`rotate`**, `pivotX`, `pivotY`, **not `angle`**, in linear gradient geometry. The public `GradientConfig` in `dist/declarations/types/common.d.ts` declares **`angle`**, not `rotate`. The runtime silently ignores the declared `angle` field.

Proposed **engine-only, owner-approved** fix: normalize the public `GradientConfig.angle` to the internal geometry rotation in the pattern-gradient call path without confusing it with the root `gradient` type. Specify angle unit as degrees; `createGradientFill`'s rotatePoint and conic angle conversion use degrees. Preserve explicitly provided start/end coordinates, test defaults and conflicts, and compare pixel geometry for 0/45/90/180. Avoid changing a stable public `CanvasGradient` contract. No engine repository writes, pushes or dependency repins.

## Other observed effects

For single opaque solid canvases, changing shadow/zoom/borderPosition alone may produce identical output due to clipping or uniform fills. These cases have **not** been established as upstream defects. Require a discriminating fixture (nonuniform background, transparency, border/stroke, separated shadow footprint) before classifying them.

## Safety

The Workspace retains safe image-tile repeat through immutable SHA256 assets, while untrusted external URLs/native video remain disabled. Ineffective procedural-repeat and GradientConfig.angle settings stay marked upstream-blocked, not FULL.