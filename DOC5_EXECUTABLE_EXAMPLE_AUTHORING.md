# DOC-5 Executable Example Authoring Contract

## Purpose

DOC-5 makes documentation examples an executable, versioned product surface. Repository-controlled source files under `examples/node/` are the authoritative source for code shown in documentation, canonical example pages, and DOC-5 Gallery cards. Verification status is derived from packed-package execution evidence; it is never asserted by hand.

This document defines the maintenance contract for adding or changing DOC-5 examples. It does not start DOC-6 and does not expand the runtime surface beyond the current Node package.

## Authoritative source model

Each DOC-5 example has a stable ID declared in `lib/examples/definitions.ts` and one or more source files under `examples/node/<example>/`. The manifest generator reads those files verbatim, normalizes line endings, hashes them, and embeds the same source payload into `generated/docs-doc5/example-manifest.json`.

Consumers must resolve examples through the generated manifest. Do not copy a full executable example into MDX, API metadata, Gallery metadata, or a bespoke page component. Supporting fragments may still be used for explanation, but they are not authoritative executable examples and must not be presented as independently verified code.

Stable IDs use the Node namespace and remain linkable through `/examples/<id>`. Renaming an ID is a compatibility change because docs, API reference pages, Gallery deep links, generated evidence, and external links may depend on it.

## Definition requirements

A definition must provide the fields required by the typed DOC-5 schema, including a unique stable ID, title/summary, runtime/difficulty, features, source files and entrypoint, prerequisites/explanation, expected outputs, related documentation paths, related DOC-4 API IDs, Gallery policy, and bounded verification settings.

Definitions are rejected when IDs collide, source files are missing, runtime/difficulty/output metadata is invalid, linked documentation does not exist, or linked API IDs are absent from the generated DOC-4 API manifest.

## Packed-package verification boundary

`npm run docs:examples:verify` is the authoritative execution gate. The runner packs the installed pinned `apexify.js` dependency into a real `.tgz`, installs that artifact into a disposable consumer, confirms package identity, copies repository-controlled DOC-5 sources into isolated cases, typechecks/compiles/executes each case, verifies outputs, records provenance, publishes only declared verified output assets, and removes the disposable fixture.

A local source link or workspace shortcut is not an acceptable substitute. `generated/docs-doc5/package-artifact.json` must continue to record `localSourceShortcut: false`.

## Execution security contract

The DOC-5 CI runner executes repository-controlled example code only. It is not a public arbitrary-code sandbox. Execution receives a sanitized environment with the explicit output directory, `NODE_ENV=test`, and minimal platform/path variables. Common secret-bearing variables are not inherited. Per-example execution uses time, stdio, output-count, output-byte, and path-containment limits.

DOC-5 does **not** claim operating-system network denial. Current representative examples do not require network access, but the isolation statement is limited to controls actually implemented. The existing Gallery/Studio code-run endpoint is a separate surface and is not used as DOC-5 proof.

## Output verification and provenance

Expected outputs are declared in the example definition. Verification supports format-aware PNG/GIF metadata checks plus semantic JSON and exact-text checks where configured. Output traversal is rejected.

A public preview is copied to `public/example-outputs/<id>/...` only after success. Provenance binds every result to stable ID, authoritative source hash, package version, package commit, packed artifact SHA-256, output path/SHA-256, and verification mode.

If source hash or package identity no longer matches provenance, the generated manifest must classify the example as stale/not-run rather than verified. Gallery exposure is restricted to currently verified DOC-5 records.

## Docs, API reference, Gallery, and canonical pages

The canonical page is `/examples/<id>` and is generated from the DOC-5 manifest. Documentation MDX references stable IDs through `ExecutableExample` or `CodePreview`, extending the existing safe DOC-3 registered-component parser rather than introducing another MDX engine.

DOC-4 API pages resolve reverse relationships with `getExamplesForApiId`. Gallery obtains DOC-5 cards through `lib/gallery/docs/doc5GalleryAdapter.ts`; source, preview media, verification state, and canonical return links derive from the same generated manifest. Existing pre-DOC-5 Gallery snippets remain legacy content and are not retroactively classified as packed-package-verified DOC-5 examples.

## Adding or changing an example

Create/edit source under `examples/node/`, update the typed definition and output contract, add only real docs/API relationships, execute the packed-package verifier, regenerate the manifest, run DOC-5 tests/verification, run inherited DOC-4→DOC-3→DOC-2→DOC-1 regressions, typecheck/build, run browser/accessibility/linkage verification, and commit deterministic evidence/public outputs only after success. CI repeats packed examples on Node 22, 24, and 26; any supported-runtime failure blocks completion.

## Browser runtime boundary

`BrowserExampleRunner` is a forward contract only. Current DOC-5 examples target the shipped Node package. Browser execution must remain unavailable until a real shipped browser runtime exists and can be executed through a secure bounded browser runner. Do not emulate browser support with Node shims or claim future `@apexify/web` functionality exists before it ships.

## Primary commands

```bash
npm run docs:examples:manifest
npm run docs:examples:validate
npm run docs:examples:verify
npm run docs:test:examples
npm run docs:verify:doc5
npm run docs:measure:doc5
npm run docs:browser:doc5
npm run docs:finalize:doc5
```

`npm run docs:verify:doc5` deliberately refreshes affected DOC-3 evidence before the inherited DOC-4/3/2/1 regression chain because DOC-5 extends the shared registered-component surface.

## Phase boundary

DOC-5 ends at the executable example platform, its integrations, evidence, and closure report. DOC-6 search redesign and Phase 15 engine work are outside this phase and remain unstarted until DOC-5 closure is complete.
