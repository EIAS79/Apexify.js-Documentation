# Balanced Workspace implementation

The user selected concept 1 after requesting a redesign of the existing multi-window workspace. This implementation keeps the current project, native editors, and canonical homepage logo. It does not introduce a separate application.

## Result

- Charcoal `#191919` panels, `#111111` base, bright `#F7FF00` selected/primary states, and the homepage AVIF wordmark. Old blue/purple chrome and magenta scrollbars no longer leak into Workspace or React Flow. The existing light theme remains available.
- Canvas occupies the upper center; Code and Terminal share an editor tab group beside Visual Graph. Queue, Preview, and Export share the bottom tab group. The right inspector spans the full workspace height. Tab content remains mounted when inactive. Selecting a queued image opens its Preview tab.
- Canvas opens fitted to the entire composition and recomputes its fit when panels resize. Select, drag, pan, zoom, maximize, close, and restore remain available.
- Properties, Presets, and Assets form the top inspector tabs. Canvas has four keyboard-accessible categories: Layout, Background, Effects, Advanced. Related gradients, background layers, patterns, native image controls, and effects are grouped within them.
- Fit, Alignment, Image Opacity, and Image Blur are visible in the main image-background view. Validated optional background fields preserve these values through generated source, project import/export, and the canonical v2 projection. The native server and generated program apply the same public image options. Base-image blur plus pattern/noise overlays is explicitly rejected because the native primary-background path has different blur semantics.
- Shared info buttons explain effects and bounds, open outside clipped windows, reposition on scroll, support touch/keyboard, and return focus after Escape. Text and Image retain their existing advanced grouped controls and schemas.
- The typed graph from #170 remains real and editable. Its initial viewport shows the Background → Canvas → Output path. Detailed node controls open inside the graph window; nodes use the existing icon library and palette.
- Layout storage is version 2. Earlier geometry resets once to this selected arrangement; saved compositions and source drafts remain intact. All nine panel types remain available through Panels.
- The existing Next development preview accepts the preview service's flags and buffers/compresses large static development assets. Production still uses the normal Next build/start commands.

## Verification

- `npm run typecheck`: passed.
- 117 focused Node tests: passed. These cover native Text/Canvas/Image rendering, generated program byte parity, image inspector reachability, graph transactions, project migrations, contracts, accessible gutter contrast in both themes, and grouped dock visibility/state.
- New background tests demonstrate actual pixel changes for Fit, Alignment, Opacity, and Blur, plus an image with procedural overlays. Every case matches generated Node output byte for byte.
- Cloud browser: native PNG rendering, canvas width → generated source → 1200×720 decoded PNG, Undo, text content/font editing and native text measurement, terminal commands, grouped tab switching, queue-thumbnail → Preview selection, all four Canvas categories, live background fit/blur controls, and desktop/mobile field help.
- A 390×844 CSS iframe viewport verified mobile inspector navigation, controls, and help bounds (left 12, right 296, top 521, bottom 691). This is responsive desktop-Chromium coverage, not physical-device testing.
- The HTTP preview cannot import image files because browser Web Crypto is unavailable outside a secure context. The UI now explains the HTTPS/localhost requirement instead of exposing an undefined `digest` error. Import validation and native rendering are covered by the focused tests; a fresh end-to-end HTTPS upload remains a release follow-up.
- Standalone browser scripts were updated to the new navigation but not executed in this iteration; browser checks used the cloud browser.

## Design QA and limitations

See root `design-qa.md` and `docs/design/workspace/balanced/`. The selected mock contains invented project text, code, graph nodes, and crop behavior. The implementation preserves the real Hero composition, its actual program and typed graph, and the complete artboard.

Full-site production acceptance remains outside this UI pass. Earlier full-site compilation/type validation succeeded, but prerender was blocked by DOC-4/DOC-5 package-identity disagreement and search generation reported Gallery coverage mismatch. No production deployment or merge is claimed. Path, component, audio, video, and GIF editors remain unimplemented.
