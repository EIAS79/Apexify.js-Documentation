# DOC-8 Interactive Foundation — Contributor Guide

This guide documents the contributor contract for the shared Studio and interactive-documentation foundation introduced by DOC-8.

## Use the shared primitives

Interactive surfaces must compose the shared modules under `components/docs/playground` and `lib/docs/playground` rather than creating a second editor, preview, diagnostics, session, or execution stack.

- Editor boundary: `components/docs/playground/InteractiveCodeEditor.tsx`
- Heavy CodeMirror implementation: `components/docs/playground/CodeMirrorEditor.tsx`
- Preview: `components/docs/playground/InteractivePreview.tsx`
- Diagnostics: `components/docs/playground/DiagnosticsPanel.tsx`
- Workspace/layout: `components/docs/playground/InteractiveWorkspace.tsx`
- Option fields: `components/docs/playground/OptionFields.tsx`
- Error boundary: `components/docs/playground/InteractiveErrorBoundary.tsx`
- Session/reset/share helpers: `lib/docs/playground/session.ts`
- Execution contracts and limits: `lib/docs/playground/contracts.ts`
- Current Node server adapter: `lib/docs/playground/serverClientAdapter.ts`

Do not import `@uiw/react-codemirror` or CodeMirror language packages from a new consumer. `CodeMirrorEditor.tsx` is the single heavy-editor import owner and `InteractiveCodeEditor.tsx` is the lazy client boundary.

## Adding an interactive documentation example

Use an authoritative DOC-5 example when current Apexify.js output is required. For Node-only functionality, the documentation surface should present verified/pre-generated output and label it truthfully. Do not fabricate browser-native Apexify execution.

The DOC-8 representative implementation is `node.canvas.basic` on `/docs/node/canvas`. It uses the same editor, preview, diagnostics, workspace, and session contracts as Studio while preserving the original DOC-5 `CodeGroup` copy/source contract.

Keep migrations narrow. Full-corpus interactive migration belongs to later documentation work, not DOC-8.

## Session, reset, and share state

Create state through the shared `InteractiveSession` schema. Share state is schema-versioned and bounded by `DOC8_RESOURCE_LIMITS.shareStateBytes`. Reset must restore a fresh deterministic copy of the initial structured state and must not leave stale output or diagnostics.

Do not place secrets, tokens, credentials, private source, or environment data into share state. Treat share links as user-visible/public data.

## Execution rules

Production arbitrary code execution is disabled. The current server-backed adapter is available only for explicit trusted-local development opt-in. It is not a security sandbox.

Do not add:

- arbitrary remote JavaScript execution;
- arbitrary npm/package installation;
- a browser-side shadow renderer;
- a fake `@apexify/web` implementation;
- future Phase 15 APIs as if they were current.

The future `WebRuntimeAdapter` in `lib/docs/playground/contracts.ts` is a contract only.

## Bundle discipline

Heavy editor code must stay lazy. Ordinary documentation, the homepage, and the closed Gallery state must not download Studio/editor chunks through eager imports or route prefetch. When linking from ordinary product/documentation surfaces to heavy interactive routes, preserve this isolation deliberately.

## Accessibility and interaction

New consumers must preserve:

- keyboard access to controls and workspace resizing;
- accessible names for editor and controls;
- valid ARIA structure;
- desktop split and mobile stacked layouts;
- light/dark/system theme behavior;
- reduced-motion behavior;
- no horizontal overflow at narrow widths.

Do not suppress Axe rules or relax contrast thresholds to obtain a pass.

## Verification before merge

Run the DOC-8 deterministic/unit/structural checks, TypeScript, production build, browser/accessibility/responsive/keyboard/security/bundle gate, and prior DOC regressions. The dedicated workflow is `.github/workflows/doc8-studio-interactive-foundation.yml`.

A DOC-8-derived change is not ready if it reintroduces duplicate primitives, eager CodeMirror, public arbitrary execution, false sandbox claims, or ordinary-route bundle leakage.
