# TEXT-01 — parallel Workspace typography integration handoff

## Isolation and pinned contract

- Branch: `codex/workspace-parallel-text`
- Worktree: `D:\\ApexifyWorkspaceParallel\\text`
- Baseline: `3fc0a8bc93e22ec21b28d92ccfb00fe70da2a1fd`
- Installed `apexify.js@6.0.0` git reference: `379a5248f09ed39c1b1734fe104b6bd73a77857f`
- Dev/test port: `38498`
- **No push, merge, deployment, engine repin or dependency upgrade.**
- Strict post-integration exhaustive certification is **not** claimed.

## Implementation

Native text API authoring is in `features/apex-workspace/domain/text.ts` and shared recursively typed controls in `features/apex-workspace/components/TextOptionsEditor.tsx`. Canonical `textSettings` is validated by `model.ts` and persisted through the existing project history. Inspector and Graph both edit the same validated composition; selection and layers continue through existing Workspace infrastructure. Graph edits are checked through real browser Graph → Inspector and undo/redo smoke.

The `server/render.ts` adapter calls the real `ApexPainter.createText` single/array overload with grouped options, not a Canvas2D mock. `codegen.ts` creates corresponding public Apexify.js calls from canonical composition, and emits a guarded native `measureText` call when the metrics option is enabled. `/api/workspace/text-metrics` validates project input and calls the pinned engine's real `measureText` for each text run. The endpoint bounds input to 80 KB, total measured characters to 12,000, and active requests to 2; it rejects external origins and arbitrary `font.path`.

The recursive inspector/graph controls support nested font options (except font.path), layout/wrap constraints, alignment/baseline, fill/gradient variants, CSS color choices (hex/named/rgb/hsl), stroke, line decorations, shadow/glow/highlight, rotation/scale/skew/perspective, curved text, measureText metadata and text arrays. Arrays offer add/edit/remove/reorder; ordered gradient stops preserve ordered stop positions when reordering their colors. Existing editor geometry and undo/redo remain authoritative.

## Focused verification

| Check | Result | Reproduce |
| --- | --- | --- |
| Native text option model + invalid cases + Unicode | PASS | `npx tsx --test tests/workspace/text-authoring.test.ts` |
| Real pinned text rendering + measured values + byte-backed PNG changes | PASS | Same focused test suite, 8/8 |
| Native group, array, curved, gradient and perspective text | PASS | Same focused test suite |
| Generated ApexPainter JS executed to an actual PNG | PASS | Same focused test suite |
| Production Next.js build | PASS | `npm run build`, `/workspace` and text metrics route compiled |
| Live API measurements (two runs), PNG output, font-path and origin rejection | PASS | `node tests/workspace/text-api-smoke.mjs` with server port 38498 |
| Real Chromium Inspector/Graph editing, Undo/Redo and reload | PASS | `node tests/workspace/text-browser.cjs` with server port 38498 |
| Full repository `npm run typecheck` | BLOCKED BY BASELINE | Existing 5 errors in `canvas-image-layout-s13.test.ts` / `canvas-union-certification-s13.test.ts` outside TEXT-01 scope |

Genuine Chromium screenshots:

- `evidence/workspace-text/01-native-typography-inspector.png`
- `evidence/workspace-text/02-typed-graph-with-text-editor.png`
- `evidence/workspace-text/03-persisted-text-after-reload.png`

The browser test reads/changes a real selected text layer, invokes real native measurements, edits the shared typed Graph representation, verifies Inspector sees the Graph mutation, exercises Undo and Redo, reloads and confirms persistence.

## Integration map

Merge/cherry-pick only this branch's commit after other parallel engineers stabilize their changes. Text-specific domain/component files have no required shared ownership. Shared-file touch points are `model.ts`, `codegen.ts`, `server/render.ts`, `components/Inspector.tsx`, `components/Graph.tsx`, and `workspace.css`; resolve conflicts at those exact text branches instead of overriding other engineers' canvas/image work. Preserve the `textSettings` optional field in the discriminated text layer and its validator; do not revert to the basic font-size-only renderer or generator. The TextMetrics endpoint is a separate additive route.

The existing `transactCanvasViaV2` document bridge in WorkspaceApp is deliberately retained. Generated Code reconciliation still limits reversible authoring to the canonical composition declaration. Existing generic layer ordering/history/preview/export UI is intentionally reused, not forked.

Inventory: `TEXT_OPTION_INVENTORY_TEXT01.json` (444 indexed nested authoring/return routes, **442 authoring/result integration-ready**, 1 security block, 1 legacy alias record). `TEXT_WORKSPACE_READY_TEXT01.md` records boundaries; WORKSPACE_READY is **implementation status**, not individually certified output equivalence.

## Genuine blockers and limitations

1. `TextProperties.font.path` is an engine capability but **not** a safe browser authoring field: accepting arbitrary local paths would turn Workspace into a file-reading endpoint. A curated licensed upload/register-font workflow would be a separate resource-managed feature.
2. Font families that are unavailable on the host rely on native fallback. The pinned Node and browser font engines do **not** have proven pixel-identical output, and no external font is downloaded or installed by Workspace.
3. Per-run metrics do not represent a synthetic post-transform aggregate box for grouped text; the UI exposes raw native metrics and can set a selected layer's editor bounds from the primary measurement.
4. The pinned `createText` interface does not declare automatic font fitting. No fabricated fit API is provided.
5. Arbitrary hand-edited JS outside the reversible composition block remains Code-only, with the existing explicit desynchronization warning.
6. Strict per-option API certification and browser/Node output-difference tolerance remain for the separate final certification program, not TEXT-01.
7. Full repository typecheck remains blocked by **five existing unrelated canvas test type errors** (see log outside branch: `D:\\ApexifyWorkspaceParallel\\text-typecheck-final.log`), although the production Next build passed.

## Handoff checks after cherry-pick

- Check no duplicate `TextOptionsEditor` or second text model source has been introduced by another branch.
- Confirm textSettings survives any parallel `WorkspaceLayer` schema/model replacement.
- Re-run the eight focused tests, native API smoke, real Chromium test and production build on the integrated branch.
- Resolve the unrelated baseline typecheck failures in their owning canvas test branch rather than silently suppressing TypeScript errors.
- Run the planned exhaustive, per-path engine/UI/codegen/artifact equivalence certification after all branches integrate.
