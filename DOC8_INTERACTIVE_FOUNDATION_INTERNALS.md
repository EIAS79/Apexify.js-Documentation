# DOC-8 Shared Interactive Foundation — Internals

DOC-8 replaces separate Studio/documentation interaction stacks with one shared primitive layer while keeping heavy client code route-local.

## Architecture

The shared foundation is composed from these modules:

| Concern | Shared module |
| --- | --- |
| Editor abstraction | `components/docs/playground/InteractiveCodeEditor.tsx` |
| Heavy CodeMirror implementation | `components/docs/playground/CodeMirrorEditor.tsx` |
| Preview/output state | `components/docs/playground/InteractivePreview.tsx` |
| Diagnostics | `components/docs/playground/DiagnosticsPanel.tsx` |
| Option controls | `components/docs/playground/OptionFields.tsx` |
| Workspace/split/stack layout | `components/docs/playground/InteractiveWorkspace.tsx` |
| Error recovery | `components/docs/playground/InteractiveErrorBoundary.tsx` |
| Session/reset/share | `lib/docs/playground/session.ts` |
| Execution contracts/resource model | `lib/docs/playground/contracts.ts` |
| Current server adapter | `lib/docs/playground/serverClientAdapter.ts` |

Studio consumes those primitives through `components/studio/CodeStudio.tsx`, `StudioOutputPanel.tsx`, `StudioResizableSplit.tsx`, and `lib/studio/studioStorage.ts`.

The representative documentation surface consumes them through `components/docs/playground/VerifiedExamplePlayground.tsx` on the dedicated `/docs/node/canvas` route. `node.canvas.basic` remains the authoritative DOC-5 example/output source.

## Editor boundary and lazy loading

`CodeMirrorEditor.tsx` is the only owner of the heavy CodeMirror imports. `InteractiveCodeEditor.tsx` uses a client-only dynamic boundary, so sharing the editor API does not force the editor implementation into every documentation route.

The interactive Canvas route is separated from the ordinary catch-all documentation route. Navigation that would otherwise prefetch heavy Studio/Canvas/product route chunks is explicitly isolated where required. The DOC-8 browser bundle gate verifies that `/docs/getting-started`, `/`, and closed `/gallery` do not inherit the interactive editor payload.

## Preview and diagnostics

`InteractivePreview` models explicit preview states (`idle`, `loading`, `ready`, `error`, `unsupported`, `stale`, `resetting`) and truthful output provenance. Current Node documentation uses verified/static output; the current Studio adapter can use controlled server-backed output only in trusted local development.

`DiagnosticsPanel` renders the shared `InteractiveDiagnostic` model with severity, source, optional line/column/code, and optional help text. Consumers should adapt errors into this model rather than inventing a separate diagnostics view.

## Workspace behavior

`InteractiveWorkspace` provides the shared responsive layout. Desktop uses a split workspace with a keyboard/pointer-operable separator. Narrow/mobile layouts stack the editor and output rather than compressing the desktop split. The component supports both controlled and internal split ratios so keyboard resizing works for Studio and documentation consumers.

## Session model

`InteractiveSession` is schema version 1 and contains source, language, runtime, options, optional selected file, and lightweight layout state. Serialization is bounded by the shared 64 KiB share-state limit. Studio's richer multi-buffer state is encoded inside the versioned shared session contract, while legacy share payloads remain readable through a compatibility fallback.

Reset creates a fresh deterministic state from the initial structured value. Reset must clear stale execution/output state in the consumer.

## Execution abstraction

`ExecutionAdapter` supports three truthful modes:

- `verified-static` — authoritative/pre-generated output without executing edited source;
- `server-backed` — current controlled Node execution for explicit trusted-local development;
- `future-browser` — contract category only.

`WebRuntimeAdapter` is also contract-only. DOC-8 does not import, implement, or claim a current `@apexify/web` runtime.

## Error recovery

Shared editor/preview regions are wrapped with `InteractiveErrorBoundary`, providing a bounded retry path instead of allowing a heavy editor failure to crash the whole documentation or Studio surface.

## Compatibility layers

Existing Studio/Gallery component names remain where useful as thin adapters so previous consumers are not broken. `GallerySnippetEditor` delegates to the shared editor. `StudioResizableSplit` delegates to the shared workspace. `StudioOutputPanel` delegates preview and diagnostics rendering to the shared primitives.

The DOC-5 `CodeGroup` presentation contract is intentionally preserved; DOC-8 adds the representative interactive playground without replacing the established copy/source behavior.

## Generated architecture evidence

The deterministic artifacts under `generated/docs-doc8/` record the shared primitive graph, client/lazy boundaries, and execution-security boundary. `scripts/docs/doc8-verify.ts` checks that Studio and the representative documentation surface actually consume the same modules and that no speculative browser runtime or public arbitrary execution is introduced.
