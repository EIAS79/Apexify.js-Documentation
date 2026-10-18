# WS-01 — Adaptive shell implementation checkpoint

> Status: IN PROGRESS — isolated compatibility shell, not a completed unified Studio.
> Preview flag: APEX_WORKSPACE_STUDIO_PREVIEW=1.
> Production /studio and both /studio/legacy/* routes remain unchanged.

## Implemented in this checkpoint

- New gated /studio/workspace route with robots noindex; 404 when disabled.
- Scope-specific charcoal/lime style consistent with Frame Docs and Motion Field Gallery; no global theme overrides.
- Collapsible icon rail and a single contextual drawer. X, Escape and mobile outside click close the drawer and reclaim width.
- Real template collection from STUDIO_TEMPLATES, transferred into the existing Code Studio via shared code-handoff state.
- Real Code buffer names (read-only) and shared IndexedDB asset metadata. These are not presented as a new cloud project system.
- Switches between the existing Code and Visual editors within one shared StudioSharedSessionProvider.
- Graph button disabled and labeled future WS-06; no simulated rendering/queue progress, fake imports or new API calls.

## Production-like browser acceptance

- [GitHub Actions WS-01 Preview](https://github.com/EIAS79/Apexify.js-Documentation/actions/runs/39099879430): build and browser tests PASS.
- 1440 × 900, 820 × 1180, 390 × 844, 320 × 568 browser navigation, drawer toggling, Visual activation, Code switch, asset panel.
- At all four widths the document-level overflow measured 0 pixels in this test.
- CI screenshots retained as workflow artifacts. They are a structural automation record, not substitute for a signed visual usability review.

## Important limitations

- Existing Code and Visual still retain their internal toolbars/panel arrangements. Their controller and inspector extraction into the unified workspace is WS-04/05, not completed by this new shell.
- WorkspaceProject (WS-02) and immutable revision snapshot (WS-03) are not implemented. Do not describe this as unified multi-project authoring yet.
- Graph, Render Queue, rich timeline/media workstation and bidirectional arbitrary source editing are NOT implemented in the new shell.
- The preview is disabled in production by default; requiring the flag prevents premature release. Never enable globally without review.
- Need browser screenshot inspection, real touch-device interactions, focus restore, panel dimensions at extreme zoom, accessibility color contrast and keyboard matrix before WS-01 completion.

## Next WS-01 engineering sequence

1. Review captured screenshots across widths; identify duplicated existing editor chrome and unexpected horizontal/vertical nested scrolling.
2. Extract a true reusable Code editor pane and Visual canvas frame without changing their execution, history, saved keys or behavior.
3. Replace temporary compatibility controls with correctly wired project-aware UI once WS-02/03 contracts are available; keep the existing legacy fallbacks.
4. Implement and test dock/inspector sizing, fit-to-canvas, focus management, panel layout persistence per breakpoint and light/contrast theme.
5. Browser-verify responsive visual quality, keyboard-only and WCAG AA, real assets/source/preview, and migration failure cases.

WS-01 stays IN PROGRESS until the UI works as a cohesive application, not merely a shell around preserved editors.


## WS-01 closeout (2026-10-18) — adaptive shell foundation

**Phase gate disposition: PASS for the isolated responsive shell**, not a certification that WS-02..WS-10 integrated feature work is complete. See [WS-01 final browser run](https://github.com/EIAS79/Apexify.js-Documentation/actions/runs/39115054137).

- All eight tested 320/390/768/820/1024/1280/1440/1920 CSS-pixel screens pass production build, real Code/Visual mount, panel close, honest disabled Graph state, keyboard resize, real session inspector/output dock, palette switch, 0 document-level horizontal overflow.
- Captured **both initial Visual and Code** screenshots at all eight sizes and reviewed representative desktop/mobile images. Blank Visual canvas now contains a no-fake-art onboarding overlay; compact Code defaults to editor-only without changing persisted legacy layout.
- Collapsible left drawer, right inspector and bottom results/diagnostics/history dock have independently scrollable contents, pointer + arrow-key resizers, Escape dismiss, mobile focus containment, focus return and safe per-Workspace layout preferences.
- Legacy Visual internal layer/inspector/dock controls remain working but default to canvas-first collapsed controls in the new Workspace only. Duplicate embedded logo/mode tabs are hidden only inside the new route.
- Docs/Gallery charcoal/lime and restrained lavender/teal applied via **route-scoped** variables; dark/light shell themes supported, reduced-motion CSS present.
- Existing /studio, /studio/legacy/code and /studio/legacy/visual remain unchanged. New /studio/workspace remains opt-in via APEX_WORKSPACE_STUDIO_PREVIEW=1, no production cutover.

**Explicit future integration ownership**: WorkspaceProject and true shared file/model authority WS-02/03; editable Visual inspectors WS-04; Code editor project integration WS-05; actual Graph compiler WS-06; project/templates/assets integration WS-07; media, timeline and durable queues WS-08/09; exhaustive runtime parity WS-10; full WCAG/performance/stress and 200%/400% zoom certification WS-11. These are **not** included in the WS-01 phase acceptance.

The acceptance review verified the eight automated viewports, keyboard/panel behavior and screenshots. This does not claim all actual device classes, screen readers or high-zoom accessibility are fully certified.
