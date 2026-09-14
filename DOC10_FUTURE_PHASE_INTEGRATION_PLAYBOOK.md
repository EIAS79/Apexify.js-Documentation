# DOC-10 — Future Phase Documentation Integration Playbook

This playbook describes how a future Apexify.js engine phase should extend the documentation platform after DOC-10. It is architecture guidance only; it does not announce or activate future packages.

## Truth boundary

Future work must begin from real package/runtime artifacts. DOC-10 fixtures under `fixtures/docs-future/` are TEST-ONLY architecture inputs and must never be copied into current product claims, install commands, Gallery examples, production API manifests, production search, sitemap, navigation, or homepage capability claims.

## Standard future-phase sequence

1. Register package/runtime metadata using the existing DOC-1 schema.
2. Normalize generated API data into the existing DOC-4 `ApiManifest` contract.
3. Add or update guides/concepts in the existing content system.
4. Supply exact option/default/runtime/capability/limit metadata from real implementation evidence.
5. Register examples through DOC-5; add a verifier adapter for a new runtime rather than a second example platform.
6. Supply capability/limit/diagnostic records through adapters where the runtime exposes authoritative data.
7. Rebuild DOC-6 search from normalized records.
8. If interactive, connect a runtime adapter to the DOC-8 `InteractiveWorkspace`; do not create another editor/workspace.
9. Run the owning phase verification plus all inherited documentation regressions.

## Adding a package

For a future package such as `@apexify/web`:

- add the real package identity only when the package artifact exists;
- supply runtime metadata and compatibility relationships;
- create an API manifest input/adapter that produces DOC-4 normalized records;
- add guides and examples using existing routes/content/example registries;
- connect a browser runtime adapter only when the real runtime exists;
- keep scoped package routing through the existing API route renderer and package-route encoding contract.

A new package must not require a second API site, router, search engine, example registry, or status system.

## Adding a runtime

- extend runtime metadata only when implementation evidence exists;
- map equivalent topics for `RuntimeNavigator` where equivalence is real;
- leave missing equivalents unavailable rather than fabricating routes;
- use runtime metadata to drive badges, search/filtering, examples, support matrices, options, and diagnostics;
- do not expose fake runtime choices in current production UI.

## Adding capability metadata

- ingest authoritative capability data through `CapabilityManifestAdapter` or equivalent;
- attach capability IDs to pages/options/support relations;
- render with `CapabilityBadge` / `AvailabilityMatrix` equivalents;
- keep detection in the runtime adapter, not duplicated prose;
- record fallback and related API/docs relationships.

## Adding API data

- normalize generated package data into `ApiManifest`;
- use `apiSymbolByRouteFromManifests` / `allApiRouteParamsFromManifests` route architecture;
- use existing `ApiMethodHeader`, `ApiSignature`, `OptionTable`, `TypeExplorer`, `ErrorReference`, `LimitReference`, and `RelatedApiGrid` components;
- do not hand-maintain a second reference database.

## Adding examples for a new runtime

- register the example in the DOC-5 schema with runtime/framework/package metadata;
- configure an authoritative source root for that runtime;
- implement a verifier adapter appropriate to the real runtime (browser, React, Next server/client, animation, etc.);
- preserve the same manifest/registry and provenance rules;
- do not publish fixture code or unverified future examples in Gallery.

## Adding diagnostics

- ingest an authoritative diagnostic source/manifest;
- normalize diagnostic code, class, meaning, trigger, evidence fields, recommended fix, runtime, and related API;
- feed normalized records into the existing search/reference/deep-link architecture;
- reuse `DiagnosticsPanel`, `ErrorReference`, and related API components;
- do not create another diagnostic website/search system.

## Adding browser interaction

When a real browser runtime ships:

- implement `WebRuntimeAdapter` against the actual runtime;
- verify mount, render, update, interaction, diagnostics, reset, dispose, cleanup, and capability reporting in a real browser;
- connect it to `InteractiveWorkspace`;
- browser examples must render directly with the browser runtime, not server-render an image and display it as fake browser evidence.

## Adding animation interaction

When the real animation system ships:

- implement `AnimationRuntimeAdapter` against the actual engine;
- bind duration/delay/easing/repeat/playback/property/pause/seek state through the existing workspace/options/diagnostics slots;
- preserve reduced-motion behavior;
- do not create a shadow renderer or a second editor/workspace.

## React integration

A real React adapter should provide:

- package/API manifest data for components/types;
- props through the existing API option/reference structures;
- JSX/examples through DOC-5 with `framework: react` and browser runtime metadata;
- events/style/state/refs/controllers as normal reference metadata and guides;
- a verifier adapter for real React examples.

No second props/reference engine is expected.

## Next.js integration

Maintain explicit `next-server` and `next-client` runtime identities. Examples and guides must not mix server-only imports with client-only runtime APIs. A real Next verifier should validate production build/runtime boundaries while preserving the same DOC-5 registry.

## Version activation

The version selector remains inactive until multiple real documentation versions exist. When that condition is met, activate the prepared version metadata/switching architecture using actual version data. Never expose fixture `vNext` or historical choices as current product versions.

## Required invariant

A future phase is integrated correctly when it adds **content, metadata, generated-source adapters, and runtime/verifier adapters** while reusing the current routing, content, navigation, reference, option, example, search, diagnostics, status, support-matrix, and interactive-workspace architectures.
