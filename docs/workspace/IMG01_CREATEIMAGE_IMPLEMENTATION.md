# IMG-01 — Pinned createImage Workspace lane

**Baseline:** `3fc0a8bc93e22ec21b28d92ccfb00fe70da2a1fd`
**Branch/worktree:** `codex/workspace-parallel-image` / `D:\ApexifyWorkspaceParallel\image`
**Pinned engine:** `apexify.js#379a5248f09ed39c1b1734fe104b6bd73a77857f`
**Scope:** real public-v6 `ApexPainter.createImage(images, canvasBuffer, options?)` authoring, not the separate `painter.image.*` utility/FFmpeg domain. No dependency repin, remote publication or merge.

## Exact pinned declaration path inventory and readiness

The machine-readable, individually classified option inventory is **[CREATEIMAGE_WORKSPACE_READINESS_IMG01.json](./CREATEIMAGE_WORKSPACE_READINESS_IMG01.json)**. It was produced from the pinned package's generated DOC-4 `option-inventory.json`, not an older image audit.

| Classification | Exact option paths |
| --- | ---: |
| **WORKSPACE_READY** (bounded functional authoring; **not** strict per-path native certification) | **330** |
| WORKSPACE_PARTIAL | 16 |
| WORKSPACE_BLOCKED_UPSTREAM | 4 |
| WORKSPACE_BLOCKED_SECURITY | 1 |
| WORKSPACE_NOT_APPLICABLE | 209 |
| **Total pinned public method option identities** | **560** |

Of 560 published option paths, 350 belong to the image declaration itself (`images.*`, `options.*`). Another 209 describe input `canvasBuffer`/CanvasResults subproperties from the separate `createCanvas` lane, and 1 represents the unsafe `painterOpts.resolveAssetRefs` callback. The declared image input has **10** shape variants, **17** filter variants and **6** distortion variants; their enabled ranges are narrower than untrusted native inputs.

Readiness means the field has a bounded authoring path through the actual canonical document, Inspector/Graph, validated real Apexify native render and generated Code (or uses a tested shared nested editor). It does **not** claim every combination or gradient/shadow edge case has strict independent pixel certification.

**16 PARTIAL paths:** nested native gradient conic `startAngle` or `repeat` (including the known `reflect` weakness), and optional `ImageFilter.radius` beyond blur-family filters; safely retained, not certified for every discriminant. **4 upstream-blocked paths:** image/group-shadow `roundedCorners` and deprecated `borderPosition`, whose S14 pinned-v6 raster probes did not demonstrate meaningful pixel effects; shared Inspector controls deliberately preserve these as disabled. **1 security-blocked path:** arbitrary `painterOpts.resolveAssetRefs` callback. See individual path-specific reasons in the JSON ledger.

## Implemented end-to-end paths

1. **Sources:** trusted bundled artwork; verified SHA-256 `asset:` PNG, JPEG and WebP imports with MIME/size/pixel checks and immutable references; compatibility when reopening older bounded v1 data-URI documents. Every new generic Inspector/image upload now uses the verified SHA-256 asset pipeline (2 MB cap). Unrestricted URLs, paths, SVG and native decoder privileges remain prohibited.
2. **Shapes and placement:** all ten pinned shapes; x/y, width/height, rotation, opacity, intrinsic/inherit, fit, nine alignments, shape fill/color/gradient, polygon point editing, shape geometries and radii. Existing Visual selection and drag continue using real layer geometry.
3. **Native painting:** blur, blend/compositing, borders, radius, stroke (including gradients), shadow (including gradients), box paint (solid/gradient), filter order/intensity, and eight-slot reorderable filters with supported parameter fields.
4. **Advanced editing:** SHA-verified alpha/luminance/inverse masks; polygon clipping with ordered point add/edit/remove/reorder; perspective/warp/bulge/pinch/twirl/wave distortions and control-point handles; mesh grids up to 8×8 with editable vertices/interpolation/edge modes; vignette, lens flare, chromatic aberration and film grain.
5. **Groups:** named, persisted groups with native `isGrouped:true`/`groupTransform`: scale, translation, pivot, rotation, alpha, blur, blending, radius/border, filters, mask, clip, distortions, mesh, paint and effects. For meaningful deterministic paint order, **consecutive image/shape members** are grouped into one native invocation; interleaved text/chart or nonadjacent runs are kept in visual order and not silently reordered.
6. **Canonical integration:** existing document validator, IndexedDB persistence, Undo/Redo, native server render, downloadable public-v6 Code, typed derived Graph nodes/ports/connections and verified project asset transport. No user-authored JS evaluation in the rendering route.

## Targeted implementation evidence

- `npm run typecheck` passed on the full source after restored dependencies.
- `npx tsx --test tests/workspace/image-editor-implementation.test.ts tests/workspace/canvas-authoring.test.ts`: **8 passed, 0 failed** on the pinned native engine before the final radius/group-gradient coverage extension.
- Native runtime smoke ran **10/10 shape variants** successfully on the actual ApexPainter `createImage` function.
- Byte-exact PNG match between the Workspace native composition and generated Node-v6 source was observed in the image test.
- Chrome **155**, real `http://127.0.0.1:38497/workspace`: shape add, filter add, native 1280px preview, Undo, Redo, Graph editor presence and IndexedDB reload all passed. Five original shape/filter screenshots and additional uploaded-asset/mask captures, with Chromium acceptance JSON files are in `C:\Users\khali\Documents\Apexify-IMG01-recovery`.

**Strict per-path certification is intentionally deferred.** There are no claims that blocked pinned runtime behavior is fixed, nor that separate `painter.image.*` utilities or video/GIF editor lanes are delivered here.

## Shared-file integration footprint

The lane intentionally changed `features/apex-workspace/model.ts`, `codegen.ts`, `server/render.ts`, `canvas-graph.ts`, `components/Inspector.tsx`, `components/Graph.tsx`, `components/Tools.tsx` and `WorkspaceApp.tsx`; new domain files isolate most image functionality. Two S13 canvas test files have narrowly scoped preexisting TypeScript error repairs. **Supervisor #15's evolving createCanvas files and source checkout were not modified.** During branch integration, review overlaps in the six shared Workspace files and preserve the S14 canvas implementation plus the latest Supervisor #15 changes; do not wholesale overwrite them.

## Security / integration caveats

- The 2 MB per-asset/total asset budget, up-to-8 assets, SHA-256 integrity, 12 million decoded pixel cap, 3 MB durable-project and 6 MB render-transport budgets are inherited unchanged.
- No remote fetch, SSRF, arbitrary filesystem input or code-executing callback was authorized.
- A separate remote checkout disappearance was detected after the first development pass. Files were reconstructed from tool history into the original branch, locally committed, and backed up into an independently CRC-verified Git archive/patch under `C:\Users\khali\Documents\Apexify-IMG01-recovery`.
- The first controlled `next build` compiled successfully but stopped at page-data collection because the baseline DOC-4 manifest was absent. After running the existing pinned `docs:generate:doc4`, the complete `npm run build` **passed**, including TypeScript, 482 static pages and the `/workspace` route. The initial missing-data prerequisite was not an image-specific compile error.
