# Apexify.js 6.0.0 — Feature-by-feature source audit

- Source snapshot: [`cbeea053c2a973d4e867f8ca96e79546060dd62d`](https://github.com/EIAS79/Apexify.js/tree/cbeea053c2a973d4e867f8ca96e79546060dd62d) (main, October 15, 2026)
- Audit assembled: October 19, 2026
- Target: public Node `apexify.js` v6 API; `packages/web` is separately documented.
- Method: read public type definitions, façade signatures, implementation/validation paths and existing technical debt; this is static review, not a complete executed test matrix.
- Entries reflect declared properties and named variants, with domain-level runtime caveats.

[Public API method-to-file map](00_METHOD_MAP.md)

## Individual reference files

- [createCanvas](01_createCanvas.md) — `ApexPainter.createCanvas(config, painterOpts?)`
- [createImage](02_createImage.md) — `ApexPainter.createImage(images, canvasBuffer, options?, painterOpts?)`
- [Shared styles, gradients, patterns and colors](03_shared_styles_gradients_patterns.md) — `CanvasConfig / ImageProperties / TextProperties shared types`
- [createText and measureText](04_createText.md) — `ApexPainter.createText(text, canvasBuffer, options?, painterOpts?) / measureText(text)`
- [Charts — common appearance, axes, legends](05_chart_shared.md) — `painter.createChart / createComparisonChart / createComboChart`
- [Pie and donut charts](06_chart_pie_donut.md) — `painter.createChart("pie", slices, options?)`
- [Vertical bar, grouped, stacked, waterfall and lollipop](07_chart_bar.md) — `painter.createChart("bar", data, options?)`
- [Horizontal bar and grouped/stacked/lollipop](08_chart_horizontal_bar.md) — `painter.createChart("horizontalBar", data, options?)`
- [Line, spline, regression, error-bar and area charts](09_chart_line.md) — `painter.createChart("line", series, options?)`
- [Scatter and correlation charts](10_chart_scatter.md) — `painter.createChart("scatter", series, options?)`
- [Radar / spider charts](11_chart_radar.md) — `painter.createChart("radar", series, options?)`
- [Polar area charts](12_chart_polar_area.md) — `painter.createChart("polarArea", slices, options?)`
- [Combined bar + line chart](13_chart_combo.md) — `painter.createComboChart(options, painterOpts?)`
- [Two-chart comparison layouts](14_chart_comparison.md) — `painter.createComparisonChart(options, painterOpts?)`
- [Scenes, renderScene, SceneBuilder and scene export](15_scenes_scene_builder.md) — `painter.createScene / renderScene / validateSceneRenderInput / renderSceneToGIF / renderSceneToVideoFrames`
- [Templates, placeholders, conditional and layout composition](16_templates.md) — `painter.createTemplate(definition, options?)`
- [Built-in reusable scene components](17_components.md) — `painter.components.badge/progressBar/avatar/card/watermark.toLayers()`
- [AssetManager and named resource resolution](18_assets_references.md) — `painter.assets / painter.prepareForRender(value)`
- [createGIF, GIF encoding and streaming frames](19_createGIF.md) — `painter.createGIF(gifFrames?, options, painterOpts?)`
- [Frame-by-frame animation helper](20_animate.md) — `painter.animate(frames, defaultDuration, defaultWidth?, defaultHeight?, options?, painterOpts?)`
- [Procedural audio: presets, synthesis, sequencing and composition](21_audio_synthesis.md) — `painter.createAudio.*`
- [Video creation and FFmpeg operations](22_video_create_and_operations.md) — `painter.createVideo(options) / painter.video.operations / getVideoInfo / extract*`
- [VideoPipeline declarative layer operations](23_video_pipeline.md) — `painter.videoPipeline(source?, layers?)`
- [Timed rich video captions and transitions](24_video_text_overlays.md) — `VideoCreationOptions.addTextOverlay / VideoPipelineTextLayer.overlays`
- [Image utility operations (stitch, collage, compress, filters and masks)](25_image_utils.md) — `painter.image.*`
- [Path2D shapes, bezier commands and custom connectors](26_path2d.md) — `painter.path2d.create / draw / custom`
- [Pixel data inspection, writing and image mutation](27_pixels.md) — `painter.pixels.getData / setData / manipulate / getColor / setColor`
- [Hit detection and geometric distance tests](28_hit_detection.md) — `painter.detect.path / region / anyRegion / distance`
- [Batch, chain and bounded operation orchestration](29_batch_chain.md) — `painter.batch(operations, opts?) / painter.chain(operations, opts?)`
- [Output conversion, encoding, image save and upload](30_output_and_save.md) — `painter.toOutput / outPut / save / saveMultiple / output.*`
- [PluginHost and ApexPainter.use plugin integration](31_plugins.md) — `painter.use(plugin) / painter.plugins.*`
- [@apexify/web browser preview runtime and actual supported subset](32_browser_web_preview.md) — `createApexifyWebRuntime / renderApexifyWebPreview / registerApexifyWebFonts / getApexifyWebCapabilities`
- [Runtime configuration, errors, limits and media transport](33_runtime_security_limits.md) — `configureApexifyRuntime / resetApexifyRuntimeConfig / getDefaultApexifyRuntimeConfig`
- [VideoStack advanced direct-operation domains](34_video_stack_low_level.md) — `painter.video.operations.*`

## Cross-cutting design and known caveats

- The top-level npm entry exports `ApexPainter`, runtime config helpers, structured errors and types; most creators are accessed through the painter instance, not separate root exports.
- Scene `renderScene` resolves named `$refs` by default; imperative methods and `SceneBuilder.render` require opt-in.
- `createText` and `createImage` generally accept a `CanvasResults` object or PNG buffer and return an encoded PNG buffer, while scene rendering can paint directly onto one native context.
- Canvas, bitmap sources, scenes, animations, video and audio are bounded by runtime configuration; defaults are tabulated in the runtime file.
- `@apexify/web` currently provides a source-snippet preview subset; it is not full Node parity.
- The checked repository `docs/remaining-work.md` records hardening gaps for cross-origin redirect headers, unbounded pending remote requests, chain traversal and browser interpreter execution limits.

## Source integrity and completeness statement

This set is a public-contract property inventory rather than a byte-for-byte reproduction of every internal class. Each schema names the public TypeScript options and relevant nested shapes. Certain chart-implementation-specific axis/label schemas may require direct consultation of the linked implementation files for all rare subfields. Do not infer support for speculative rendering phases from the presence of a future roadmap.
