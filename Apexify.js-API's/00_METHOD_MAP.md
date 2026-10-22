# Apexify.js public API → individual audit files

Checked Node `ApexPainter` façade and supporting public domains in `main` at `cbeea053` (October 15, 2026).

| Public entry / domain | Audit file(s) |
|---|---|
| `Constructor and output format` | [03_shared_styles_gradients_patterns.md](./03_shared_styles_gradients_patterns.md) |
| `createCanvas` | [01_createCanvas.md](./01_createCanvas.md) |
| `createImage` | [02_createImage.md](./02_createImage.md) |
| `createText` | [04_createText.md](./04_createText.md) |
| `measureText` | [04_createText.md](./04_createText.md) |
| `createChart` | [05_chart_shared.md](./05_chart_shared.md), [06_chart_pie_donut.md](./06_chart_pie_donut.md), [07_chart_bar.md](./07_chart_bar.md), [08_chart_horizontal_bar.md](./08_chart_horizontal_bar.md), [09_chart_line.md](./09_chart_line.md), [10_chart_scatter.md](./10_chart_scatter.md), [11_chart_radar.md](./11_chart_radar.md), [12_chart_polar_area.md](./12_chart_polar_area.md) |
| `createComparisonChart` | [14_chart_comparison.md](./14_chart_comparison.md) |
| `createComboChart` | [13_chart_combo.md](./13_chart_combo.md) |
| `createScene` | [15_scenes_scene_builder.md](./15_scenes_scene_builder.md) |
| `renderScene` | [15_scenes_scene_builder.md](./15_scenes_scene_builder.md) |
| `validateSceneRenderInput` | [15_scenes_scene_builder.md](./15_scenes_scene_builder.md) |
| `renderSceneToGIF` | [15_scenes_scene_builder.md](./15_scenes_scene_builder.md), [19_createGIF.md](./19_createGIF.md) |
| `renderSceneToVideoFrames` | [15_scenes_scene_builder.md](./15_scenes_scene_builder.md), [22_video_create_and_operations.md](./22_video_create_and_operations.md) |
| `createTemplate` | [16_templates.md](./16_templates.md) |
| `components` | [17_components.md](./17_components.md) |
| `assets` | [18_assets_references.md](./18_assets_references.md) |
| `prepareForRender` | [18_assets_references.md](./18_assets_references.md) |
| `createGIF` | [19_createGIF.md](./19_createGIF.md) |
| `animate` | [20_animate.md](./20_animate.md) |
| `createAudio` | [21_audio_synthesis.md](./21_audio_synthesis.md) |
| `createVideo` | [22_video_create_and_operations.md](./22_video_create_and_operations.md) |
| `videoPipeline` | [23_video_pipeline.md](./23_video_pipeline.md) |
| `video` | [34_video_stack_low_level.md](./34_video_stack_low_level.md) |
| `getVideoInfo` | [22_video_create_and_operations.md](./22_video_create_and_operations.md) |
| `extractFrames` | [22_video_create_and_operations.md](./22_video_create_and_operations.md) |
| `extractAllFrames` | [22_video_create_and_operations.md](./22_video_create_and_operations.md) |
| `extractFrameAtTime` | [22_video_create_and_operations.md](./22_video_create_and_operations.md) |
| `extractFrameByNumber` | [22_video_create_and_operations.md](./22_video_create_and_operations.md) |
| `extractMultipleFrames` | [22_video_create_and_operations.md](./22_video_create_and_operations.md) |
| `image (image utilities)` | [25_image_utils.md](./25_image_utils.md) |
| `path2d` | [26_path2d.md](./26_path2d.md) |
| `pixels` | [27_pixels.md](./27_pixels.md) |
| `detect` | [28_hit_detection.md](./28_hit_detection.md) |
| `batch` | [29_batch_chain.md](./29_batch_chain.md) |
| `chain` | [29_batch_chain.md](./29_batch_chain.md) |
| `toOutput` | [30_output_and_save.md](./30_output_and_save.md) |
| `outPut (deprecated)` | [30_output_and_save.md](./30_output_and_save.md) |
| `output` | [30_output_and_save.md](./30_output_and_save.md) |
| `save` | [30_output_and_save.md](./30_output_and_save.md) |
| `saveMultiple` | [30_output_and_save.md](./30_output_and_save.md) |
| `use(plugin)` | [31_plugins.md](./31_plugins.md) |
| `plugins` | [31_plugins.md](./31_plugins.md) |
| `@apexify/web` | [32_browser_web_preview.md](./32_browser_web_preview.md) |
| `configureApexifyRuntime` | [33_runtime_security_limits.md](./33_runtime_security_limits.md) |
| `getDefaultApexifyRuntimeConfig` | [33_runtime_security_limits.md](./33_runtime_security_limits.md) |
| `resolveApexifyRuntimeConfig` | [33_runtime_security_limits.md](./33_runtime_security_limits.md) |
| `resetApexifyRuntimeConfig` | [33_runtime_security_limits.md](./33_runtime_security_limits.md) |

## Audit scope and exclusions

- The Node root API is exposed through `ApexPainter` and runtime helpers. Most internals are deliberately not separate package exports.
- Browser `@apexify/web` lives under `packages/web` and is a subset preview; it is not shipped through the Node root package exports.
- A source-declared option is not proof of browser parity or full rendering fidelity.
- Types for chart implementations are defined in `lib-next/chart/impl/*` and are linked from each chart file.
- This is a **static source audit**. No CI, code execution, benchmark, browser parity run, exploit validation, or live FFmpeg/media renders were performed during this creation.

