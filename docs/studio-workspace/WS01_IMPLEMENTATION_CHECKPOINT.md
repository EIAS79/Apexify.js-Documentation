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
