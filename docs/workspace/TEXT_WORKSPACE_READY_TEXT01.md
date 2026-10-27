# TEXT-01 Workspace Text and Measurement Readiness

Baseline: `3fc0a8bc93e22ec21b28d92ccfb00fe70da2a1fd`. Pinned engine: `379a5248f09ed39c1b1734fe104b6bd73a77857f`.

## Scope and declaration

- API-derived path records: **444**.
- **442** authoring/result routes implemented with generic schema UI, native render adapter and code synchronization; strict per-leaf visual certification is **not complete**.
- **1** intentionally excluded path: `font.path` because it would give a browser user arbitrary Node filesystem access. Existing engine/browser font fallback is platform-dependent.
- Legacy top-level aliases map to preferred nested v6 fields; they do not receive duplicate controls.
- Text content includes Unicode and newlines. Text arrays provide create/edit/remove/reorder. Gradient stops provide create/edit/remove/reorder within ordered offsets. Perspective point tuples have exactly four points; they may be edited/reordered but not resized.
- Text selection box `width/height` are editor geometry. Use native `layout.maxWidth/maxHeight` for typography constraints. The pinned API does not declare automatic font fitting; the editor can size selection geometry from native measurements instead.
- Browser preview is the existing Workspace server-native PNG path, **not** a claimed direct retained browser text renderer. Pixel-identical fonts across browsers/Node are not guaranteed.
- No executable font paths, remote font downloads, unsafe code execution or external font licensing assumptions are introduced.

## Workspace wiring

model.ts validates the full persisted nested textSettings. TextOptionsEditor.tsx is shared by Inspector and Graph. server/render.ts passes native ApexPainter.createText single/array overloads and group options. codegen.ts generates equivalent public calls and metrics. /api/workspace/text-metrics calls actual painter.measureText, enforcing same-origin, body and concurrency limits. Existing history, draft/recovery, project storage, PNG export and live preview consume the canonical model.

## Evidence required before strict certification

Every path requires individual validation/default evidence, typed Graph port-level semantics, native vs generated artifact comparison, browser direct-font assessment, timeout/invalid cases, and screenshot provenance. This parallel branch is **Workspace implementation-ready** only; it does not assert final engine parity certification.

## Remaining limitations

- Arbitrary local font.path is blocked for security; selecting a family does not install it.
- Explicit font installation and licensing workflows are not provided.
- Browser/native text layout can diverge according to available fonts/shaping backends.
- Runtime measureText returns per-run text measurements, not a synthetic aggregate of grouped text array items or final transformed group geometry.
- Code → Visual accepts canonical composition mutations only; arbitrary edited JavaScript remains explicitly non-reversible.
- The legacy WorkspaceLayer model has a fixed 64-layer cap, 32 additional text items cap, and a 3 MB persistence limit.

See TEXT_OPTION_INVENTORY_TEXT01.json for every path, authoring surface and status.
