# Workspace Frame theme and inspector refresh

Scope: UI/UX for existing canvas, text, and image authoring. The engine pin, render routes, project schema, code reconciliation, and image processing behavior are unchanged.

## Result

- Current Frame identity: canonical homepage/docs wordmark, charcoal surfaces, lime accents, matching light theme, and Frame Inter typography. Workspace and its portalled help share one scoped palette; the code editor follows the site theme preference.
- Four default panels prioritize Tools, Visual Canvas, Inspector, and Code. The inspector has more width. All nine panels still close, reopen, maximize, and resize. Saved layouts remain intact; **Panels → Reset layout** selects the new default.
- Design, Presets, and Assets use a single inspector view selector. Canvas uses collapsible sections rather than a second jump-navigation row. Typography is grouped by font, layout, paint, placement, effects, curve, runs/groups, and measurement.
- Shared fields provide click/touch and keyboard info buttons. Help describes effects, units, bounds, and relevant limitations; nested typography retains the parent context. Cards escape clipped panel content, reposition during scrolling/resizing, close with Escape/outside interaction, and return focus on Escape.
- Canvas, Text, and Image are the primary creation tools. Planned editors are under More Tools and labeled Planned. Existing Shape and Chart remain available without expansion. Selected-layer kind now updates the active creation tool.
- Image controls use readable labels and asset dimensions instead of presenting content hashes as the primary identifier.

## Verification

- `npm run typecheck` passed.
- 46 focused tests passed: text/canvas/image native rendering and code parity, image inspector mapping, model/domain/panel contracts, and the docs batch regression test. The batch test now uses TypeScript's public diagnostics API rather than an untyped internal property.
- Chromium interaction check covers theme colors and wordmark, default layout, help/focus/Escape, canvas-to-source download, text layout and native measurements, image upload/fit, theme switching, panel reopening, and the 390px mobile inspector. Real render and measurement endpoints are used.
- Refreshed image inspector mapping reports 321 conditionally reachable controls and 9 semantic/external containers that static SSR does not verify. This is a control-reachability check, not a new claim of complete runtime parity.
- Production compilation and TypeScript validation succeeded. The full site's prerender remains blocked at `/` by `[DOC-7] DOC-4 and DOC-5 package identities disagree`. The docs search generator also reports `[doc6] Gallery coverage mismatch`. Generated docs/API data from diagnostic attempts is excluded from this change.

Run the browser check against an existing server:

```sh
WORKSPACE_URL=http://127.0.0.1:4173 CHROME_PATH=/path/to/chrome \
  node tests/workspace/browser-frame-inspector.cjs
```

`WORKSPACE_TEST_START_SERVER=1` starts and closes an in-process Next development server. `PLAYWRIGHT_MODULE` can point to an external Playwright installation. On hosts that truncate large development JavaScript responses, `WORKSPACE_TEST_LOCAL_ASSETS=1` delivers the exact `.next/static` files through browser request fulfillment. It does not mock render/measurement APIs or alter application source. This option was required in the verification host, which intermittently served a 327,680-byte fragment of a 6,090,595-byte development chunk.

## Screenshots

- [Desktop, dark](../design/workspace/frame-refresh/desktop-dark.png)
- [Desktop, light](../design/workspace/frame-refresh/desktop-light.png)
- [Mobile inspector](../design/workspace/frame-refresh/mobile-inspector.png)

This refresh does not implement path/component editors, GIF/audio/video workflows, arbitrary code execution, or certify the entire Workspace production program.
