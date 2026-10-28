# Independent Apexify workspace

> **P0 production program:** the foundation is merged; production completion remains open. Follow the [A–Z master plan](../../docs/workspace/PRODUCTION_MASTER_PLAN.md), [capability matrix](../../docs/workspace/CAPABILITY_MATRIX.md) and [release gates](../../docs/workspace/RELEASE_GATES.md).

The new App Router page is `/workspace`. Its files live in `app/workspace`, `app/api/workspace`, `features/apex-workspace`, and `public/workspace`. It imports no Studio components, state, styles, routes, execution adapters, or `@apexify/web` package. It has no authentication, profile, dashboard, or account requirement.

## Current behavior

- Workspace uses the canonical homepage wordmark, charcoal surfaces, and the bright `#F7FF00` accent from the supplied homepage reference. The site theme preference also controls Workspace and its code editor.
- The selected Balanced Workspace layout places Canvas above Code/Terminal and Visual Graph, with Render Queue/Preview/Output & Export in a bottom tab group. Tools stay left; Properties stays right. All nine panels remain closeable, reopenable, resizable, and maximizable. Inactive tabs stay mounted to preserve editor state.
- Layout metadata is version 2. Old v1 geometry resets to the selected layout; composition data and source drafts are untouched. **Panels → Reset layout** restores this arrangement later.
- Properties/Presets/Assets use one tab strip. Canvas uses Layout/Background/Effects/Advanced, with native gradient, pattern, image, and ordered-layer controls grouped inside those categories. Typography and image options use collapsible groups.
- Background image Fit, Alignment, Opacity, and Blur are visible directly in Background. They use validated optional background fields, native rendering, generated code, and the v1/v2 projection. Blur must be zero when combining the base image with pattern/noise overlays. Imported custom-background controls retain their existing native semantics.
- Info buttons explain controls, units, effects, and limits. Help supports click/touch, Escape, keyboard focus, and narrow screens; cards appear outside clipped panel content.
- The Create group prioritizes Canvas, Text, and Image. Other tools are under More Tools; editors not implemented are marked Planned. This refresh does not implement media, path, or component editors.

- Nine managed panels, including two tab groups: tools, visual canvas, properties, code, graph, terminal, render queue, preview, and output/export. Close, reopen, maximize, reset, and resize them. Hidden branches disappear from the split tree and adjacent windows reclaim the space. The header can restore panels even when every panel is closed.
- One versioned composition drives visual selection and dragging, the inspector, generated code, the graph, live renders, and render jobs. History supports undo/redo. Project, layout, and unsynchronized code drafts persist locally; JSON project downloads provide a portable backup.
- Canvas backgrounds support color, gradient, and uploaded/bundled images. Text, rectangle/circle shapes, image layers, bar charts, and pie charts have real Apexify rendering. PNG/JPEG/WebP image upload is limited to 2 MB per file.
- CodeMirror edits the generated Node program. Editing its JSON `composition` literal and applying it updates all views. Edits outside that supported program are retained and downloadable, but cannot be applied or executed on the server. This is an explicit synchronization boundary.
- The graph represents the actual ordered composition. Its nodes select the corresponding layers; Run Graph submits a real render. It is a derived composition graph, not an arbitrary node-program editor.
- Render Queue snapshots compositions and runs jobs sequentially, with real completion, duration, output size, cancellation, and errors. Selecting an older job changes Preview and Export while preserving the live canvas. Live preview uses the same Node renderer.
- Export supports PNG, browser-encoded JPEG/WebP, project JSON, and the generated source. Source programs expect the bundled artwork at `public/workspace/assets/crystal-lake.webp`; uploaded images are embedded as data URLs.
- Terminal runs documented workspace commands (`help`, `render`, `inspect`, `undo`, `redo`, `clear`, `panels`, `reset-layout`, `export`). It is not an OS shell or arbitrary JavaScript executor.
- On narrow screens, a panel selector presents one window at a time. The desktop split layout remains recoverable.

## Deliberately pending

The image references more capabilities than this first implementation exposes. Dedicated path/component editors, GIF timelines, audio waveforms, video pipelines, arbitrary code execution, arbitrary graph editing, and a larger preset catalogue are not implemented. Their tools explain the current status. This is a functioning workspace foundation, not a claim of complete Apexify feature coverage.

Future adapters should extend this workspace-owned model and public v6 renderer. They should not import the legacy Studio. Executing custom code needs a separate isolation design; media jobs need a dedicated execution adapter and lifecycle. These are implementation follow-ups, not assertions about an official library roadmap.

## Runtime and boundaries

Uses the repository's existing `apexify.js` Git dependency pinned at `b6ca97cfc675b16a52c2c7b5d0ff881b87b911be` (v6 source). The Frame refresh leaves this engine pin unchanged. The renderer uses public `ApexPainter` APIs, including `createCanvas`, `createImage`, `createText`, and `createChart`.

`POST /api/workspace/render` accepts validated composition JSON, never user code. Validation rebuilds a whitelist model, rejects arbitrary URLs/files/SVG, limits dimensions to 2048, limits layer count to 64, and bounds request bodies to 6 MB. The route uses Node, caps active renders at two per process, checks origin, and observes request cancellation and a 25-second render deadline between operations. This concurrency bound is local to an instance, not a distributed quota. Native rendering operations already in progress are not forcibly terminated.

## Validation

From the documentation repository root with its pinned runtime installed and built:

```sh
node --import tsx --test tests/workspace/contracts.test.ts tests/workspace/runtime.test.ts
npx tsc --noEmit --incremental false --skipLibCheck --jsx preserve --target es2020 --module esnext --moduleResolution bundler --esModuleInterop --lib dom,dom.iterable,esnext features/apex-workspace/WorkspaceApp.tsx features/apex-workspace/server/render.ts
```

The runtime test executes generated source in Node and compares the resulting PNG byte for byte with the server renderer, covering opacity, rotation, hidden layers, bar/pie charts, and a changed background. Temporary test directories are removed in `finally`.

An isolated Next 14 production fixture containing these exact new routes/components/assets passed compilation, type checking, static generation, and tracing. `/workspace` is 175 kB route JavaScript / 262 kB first load; the API trace includes the artwork and native renderer. The full existing documentation app was not validated end to end: its baseline type check has existing Studio/vendor and documentation-test errors. No old files were changed to work around those errors. Root layout/global-style integration and production deployment remain to be checked in the complete app environment.

Browser checks covered rendering, canonical code edits, visual-to-code updates, unsupported code rejection, panel close/reopen, all-panels-closed recovery, keyboard resizing, terminal commands, and a completed 1280×720 PNG download. Source download completion could not be verified in the cloud browser. A 390×844 iframe CSS viewport verified responsive panel switching and mobile accessible labels; physical mobile testing is pending.

See the workspace entry in the root `design-qa.md` and `docs/design/workspace` for reference comparisons and browser evidence. Generated crystal artwork and the transparent header mark are implementation assets inspired by the supplied image.


## Selected layout verification (2026-10-28)

TypeScript and 117 focused tests passed, including native background-control pixel changes, generated-program byte parity, project migration, dock-group visibility/state, and dark/light gutter contrast. Cloud-browser checks covered native rendering, text measurement, canvas-to-code edits, tabs, field help, both desktop and a 390×844 CSS viewport. See the current root `design-qa.md` for evidence and the HTTP-preview image-upload limitation. Browser scripts were updated for the new tab organization; this iteration used the cloud browser instead of executing those standalone browser scripts.

This change remains in a draft PR. It is not a deployment or complete Workspace runtime-parity certification; full-site release checks still depend on the existing documentation generation issues.
