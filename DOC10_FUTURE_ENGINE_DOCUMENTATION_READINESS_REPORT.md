# DOC-10 — Future Engine Documentation Readiness

## Status

`PARTIAL — BLOCKED`

Implementation is present on `doc10-future-engine-readiness`. The architecture has been changed only where the DOC-10 fixtures exposed generic deficiencies. PR CI, same-runner baseline comparison, merge, and post-merge verification are still required before this report may state `COMPLETE`.

## Source authority

Primary authority: `APEXIFY_DOCUMENTATION_ARCHITECTURE_PRE_PHASE_ROADMAP.md` and the DOC-10 master execution prompt. DOC-10 is an architecture simulation/readiness phase only. It does not ship future engine functionality.

## Repository identities

- Phase 14-P frozen SHA: `5d9b71f185140d6c3477286b8fb111f293e52b48`
- package main SHA at DOC-10 start: `2b64087a04411982067cc624031b3de6f663c530`
- package version: `6.0.0`
- DOC-0 merge SHA: `573b592942327d451661cd55d50fd237630eb5cf`
- DOC-1 merge SHA: `c3d0799b8fb67fd7c86d48aceaa8c88e5e3d649f`
- DOC-2 merge SHA: `6ae3234b3de0e303c0a762f5394ea568c9be2c44`
- DOC-3 merge SHA: `b5ab2bcf96f68f2bc574c64b512228734c8ccbe6`
- DOC-4 implementation merge SHA: `9a6911fba5594e771437be1154646d196482c686`
- DOC-5 implementation merge SHA: `698f7ec860f8e9cfd0fa99c6b620a1a3ce5b4240`
- DOC-6 merge SHA: `96c4c9ef418fc3ea30a391c89037cc9744d7fdc0`
- DOC-7 implementation merge SHA: `1e013019a3768f10d1fd9bfc6de5d7879d5e63e7`
- DOC-8 implementation merge SHA: `4d8d5fef2064211ddd1788b4b7373730a71d1d8b`
- DOC-9 implementation merge SHA: `ae2eb52e3b69f416fb5a3362d17b6b57ce952b89`
- DOC-9 completion-record merge / DOC-10 base SHA: `8a8702aaa110e0a5b633ab91d78fa2e8e51b1e12`
- DOC-10 branch: `doc10-future-engine-readiness`
- DOC-10 branch SHA at this revision: `4a973a3312ebddfbdfe00eff39ceeb9d206dce3c`
- DOC-10 merge SHA: pending
- final docs main SHA: pending

No Phase 15 branch or implementation PR was found at DOC-10 start.

## Starting readiness architecture

The DOC-0→DOC-9 platform already provided validated page metadata, intent-driven routes/navigation, generated DOC-4 API reference, DOC-5 examples, DOC-6 search/filtering, DOC-8 shared interactive primitives, and DOC-9 full current-content migration. Several future-facing enum values and a Web runtime contract already existed, but simulation exposed narrow generic gaps described below.

## Fixture policy

All future-readiness data lives under `fixtures/docs-future/` or generated DOC-10 evidence. Every future record is explicitly fixture-only, non-publishable, and ROADMAP/TEST-ONLY. Fixture package versions use `0.0.0-fixture`; fixture diagnostics use the unmistakable `FIXTURE-APX-*` prefix.

No nonexistent package is installed or imported.

## Fixture isolation

Production DOC-1, DOC-4, DOC-5 and DOC-6 generated data plus homepage catalog data are scanned for fixture-only identifiers. The internal route `/__docs-fixtures/future-readiness` is `noindex`, is not added to current navigation/search, and is separately checked against production sitemap/search in browser CI.

## Simulated package matrix

The isolated fixtures cover:

- `@apexify/core`
- `@apexify/node`
- `@apexify/web`
- `@apexify/react`
- `@apexify/next`

All are ROADMAP test identities only. They are not install instructions or package-availability claims.

## Simulated runtime matrix

The fixture architecture covers Node, Web, React, Next Server, Next Client and Shared runtime identities. DOC-1 gains a generic `shared` runtime value so shared-specification content can be represented without abusing Node or Web identities.

## Versioning readiness

Fixture version-shaped records cover stable/preview/historical concepts internally. The `VersionSelector` readiness surface remains deliberately disabled. No public fake version choices are activated.

## RuntimeNavigator readiness

Equivalent topic records can switch among Node/Web/React/Next fixture destinations using semantic topic identity. Missing equivalents return an explicit unavailable state and never fabricate a route.

## PackageNavigator readiness

Equivalent topic records can switch among package identities where mappings exist. Missing package equivalence is unavailable rather than guessed.

## Support matrix readiness

`AvailabilityMatrix` provides semantic row/column headers and explicit supported/unsupported/partial/capability-gated/roadmap/unknown labels. Capability requirements are structured data, not color-only presentation.

## Capability metadata readiness

DOC-1 page metadata now normalizes `capabilities[]`. DOC-4 options can carry `capabilityIds[]` and `limitIds[]`. Fixture capability records contain status, runtime, package, fallback, detection, related API and related docs metadata. `CapabilityBadge` and `AvailabilityMatrix` consume those structures.

## Future API route readiness

DOC-4 API routing has been separated into pure multi-manifest helpers. Current production still supplies exactly one `apexify.js` manifest. A future package adapter can add normalized manifests without creating a second router or reference renderer.

## Scoped package route behavior

Scoped names are represented as one reversible percent-encoded route segment in the DOC-10 route contract. The pure routing matrix tests known package/symbol/member resolution and explicit unknown-package/unknown-symbol misses.

## OptionTable readiness

DOC-4 `OptionTable` remains the reference component. It now surfaces capability requirements and searches capability identifiers in addition to existing path/type/value text.

## Nested option readiness

The fixture tree covers nested structures including `render.backend.preference`, worker configuration, capability-dependent WebGPU metadata, animation duration/easing/deprecation and layout mode.

## Runtime-specific option readiness

Fixture options carry Node/Web/Shared runtime metadata. Runtime applicability is data-driven in the same API option model rather than prose-only branching.

## Layout documentation readiness

Layout uses existing concept/guide/page kinds, `/docs/engine/...` routing, API option structures, examples, support metadata, search records and the shared playground shell. No layout-specific docs platform is introduced.

## Animation documentation readiness

Animation fixture topics cover concepts, easing, keyframe/transition-shaped metadata, interruption/server-export route slots, options, runtime applicability and search/navigation relationships. No animation engine is implemented.

## Animation playground shell

The internal fixture reuses DOC-8 `InteractiveWorkspace` and `DiagnosticsPanel`, with timeline/reduced-motion/control placeholders. `AnimationRuntimeAdapter` is a contract only. There is no renderer or engine implementation.

## Browser documentation readiness

Web topics fit existing docs routes, schema, search, API, examples, capabilities and navigation. The package/runtime addition is metadata/adapters rather than a separate documentation center implementation.

## Browser playground shell

The fixture shell reuses DOC-8 editor/preview/diagnostic/options/workspace slots and explicitly states that no renderer is active.

## Browser runtime adapter contract

The existing DOC-8 `WebRuntimeAdapter` remains the future execution boundary. DOC-10 does not fake retained rendering or substitute server-generated images as native browser evidence.

## React documentation readiness

React package/runtime metadata fits the existing page architecture. JSX/example metadata is represented through DOC-5 fixture examples, while props/options remain DOC-4 structures.

## React reference readiness

Future React component/type records normalize into the same DOC-4 manifest and renderer. No second props-table/reference engine is added.

## React example architecture

DOC-5 runtime metadata is generalized to represent React examples, and source validation is parameterized by runtime-specific authoritative roots. Current Node defaults remain unchanged.

## Next.js documentation readiness

Next uses existing guide/reference/example architecture with explicit `next-server` and `next-client` runtime identities.

## Next server/client separation

Fixture metadata keeps server/client records distinct. The future verifier adapter is responsible for real boundary/build verification; DOC-10 does not execute nonexistent Next packages.

## Diagnostics readiness

Fixture diagnostic records contain code, class, meaning, trigger, evidence fields, recommended fix, runtime and related API. Codes are unmistakably fake.

## Diagnostic route/search integration

Diagnostic fixture records use the existing `/docs/errors/...` content route pattern and DOC-6 `diagnostic` search kind. Existing `DiagnosticsPanel`, `ErrorReference` and related API systems remain the intended consumers.

## Resource-limit readiness

DOC-4 already owns `LimitReference`; future-shaped options can link `limitIds[]` and future manifests can supply limit records. DOC-10 does not invent product limit values.

## Search readiness

An isolated fixture index uses the real DOC-6 `SearchRecord`, tokenization, ranking and filtering code. Required queries cover package, future API symbol, capability, diagnostic, Next and React fixture terms. Fixture records never enter the production index.

## Navigation scalability

The DOC-9 taxonomy is extended with empty Core/Web/React/Next/Engine/Capabilities/Errors groups. Empty future groups do not appear for current users. Future pages therefore scope naturally instead of falling into one giant Node sidebar.

## Future example architecture

DOC-5 keeps one manifest/registry. Runtime/schema validation is generalized for Web/React/Next/Shared fixtures while default production validation still requires `apexify.js` and `examples/node/**`.

## Interactive architecture

Browser and animation readiness reuse DOC-8 `InteractiveWorkspace`, diagnostics and option slots. Future execution is supplied through adapters, not another editor/workspace.

## Future-readiness matrix

`generated/docs-doc10/future-readiness-matrix.json` covers every required domain and the required columns: metadata, routing, navigation, search, API reference, options, examples, support matrix, interactive shell, diagnostics, status semantics, runtime/package switching and adapters.

The generator fails if any required cell is `GAP`.

## Architecture gaps discovered

1. **Schema gap** — no `shared` runtime and no structured page capabilities. Fixed by extending the existing DOC-1 schema.
2. **API manifest gap** — runtime targets were Node-version-only and the manifest router assumed one package. Fixed by generic runtime targets and multi-manifest pure routing helpers.
3. **Example manifest gap** — schema/validation were Node-only. Fixed by generic runtime metadata and configurable authoritative roots while preserving current strict defaults.
4. **Navigation gap** — future scopes would fall into the Node group. Fixed with empty taxonomy slots that materialize only when actual pages exist.
5. **Interactive adapter gap** — Web adapter existed but animation playback had no contract. Fixed with `AnimationRuntimeAdapter`; no engine code added.

## Unresolved required architecture gaps

Expected generated gate: `0`. Final proof pending CI.

## Adapter inventory

The fixture inventory records contracts for:

- `FutureApiManifestAdapter`
- `WebRuntimeAdapter`
- `AnimationRuntimeAdapter`
- `ReactExampleVerifier`
- `NextFixtureVerifier`
- `DiagnosticManifestAdapter`
- `CapabilityManifestAdapter`

Each records inputs, outputs, consumer, future owner and why no architecture rewrite is required.

## Fixture leak verification

Static leak checks cover production docs manifest, API manifest, example manifest, search records and homepage catalog. Browser CI additionally verifies homepage, current docs, Gallery, API landing, production search and sitemap.

Final result pending CI.

## Production-truth verification

Future fixtures are never classified `CURRENT`, never exposed as install commands, never added to Gallery, never used as production API/search data, and never represented as a working runtime. Browser/animation previews explicitly state that no renderer is active.

## Tests added

DOC-10 tests cover fixture isolation, future-shaped frontmatter, navigation scoping, multi-package API routing, scoped package encoding, nested/capability/runtime/deprecation options, future example validation, runtime/package switching, capability/diagnostic records, and production manifest leak detection.

## Accessibility impact

New fixture UI uses semantic tables, labels, explicit non-color availability text, the existing keyboard-resizable DOC-8 workspace, and existing diagnostic live-region behavior. Runtime axe verification pending CI.

## Responsive verification

The fixture reuses DOC-8 responsive stacking and table overflow patterns. Desktop/tablet/mobile browser verification pending CI.

## Keyboard verification

The browser gate exercises the inherited workspace separator and fixture controls. Pending CI.

## Theme verification

Fixture surfaces use existing DOC-2 CSS variables/tokens; light/dark browser passes pending CI.

## Reduced-motion verification

The fixture exposes an explicit reduced-motion simulation control and browser CI runs with `prefers-reduced-motion: reduce`. Pending CI.

## Performance impact

No future runtime dependency is added. Generic architecture additions are metadata/contracts/components only. Same-runner current-vs-base build and browser transfer measurement pending CI.

## Bundle impact

CI compares JS transfer for ordinary docs, a representative API page and Studio against exact DOC-10 base `8a8702...`; the fixture-only route is measured separately. Pending CI.

## Build impact

CI builds candidate and exact base on the same runner and records wall-clock comparison. Pending CI.

## Dependency changes

None.

## DOC-1 regression

Pending `npm run docs:verify:doc10`, which inherits the complete DOC-9 chain.

## DOC-2 regression

Pending inherited regression chain.

## DOC-3 regression

Pending inherited regression chain.

## DOC-4 regression

Pending inherited regression chain and future API fixture tests.

## DOC-5 regression

Pending inherited regression chain and future example fixture tests.

## DOC-6 regression

Pending inherited regression chain and isolated fixture-search tests.

## DOC-7 regression

Pending inherited regression chain; fixture capabilities must not alter current homepage/Gallery truth.

## DOC-8 regression

Pending inherited regression chain; fixture shells reuse DOC-8 primitives without replacing them.

## DOC-9 regression

Pending inherited migration/content regression chain.

## Problems discovered

The current platform was already future-oriented but still encoded several assumptions from the first shipped package: single-package API loading, Node-only example validation, Node-oriented navigation fallback, and no generic capability page field. Those assumptions would have forced ad hoc future-package branches if left unchanged.

## What went wrong

The prior phases correctly optimized for the real `apexify.js` 6.0.0 product. DOC-10 is the first phase whose purpose is to stress those contracts with deliberately different package/runtime shapes, so assumptions that were previously valid became visible as future-readiness gaps.

## How fixed

Each discovered deficiency was fixed at the generic architecture boundary. No future runtime behavior was implemented and no current source-of-truth data was replaced with fixtures.

## Not completed

At this report revision:

- DOC-10 PR has not yet been opened.
- CI has not yet executed the new phase gate.
- same-runner base/candidate build and browser measurements are pending.
- deterministic generated DOC-10 evidence has not yet been inspected from CI.
- merge and post-merge verification are pending.

## Why

The report is intentionally created before PR execution so failures are recorded rather than hidden. Status remains `PARTIAL — BLOCKED` until evidence exists.

## Alternatives considered

- Adding future packages directly to production manifests: rejected as a truth leak.
- Building a second API router/reference site: rejected; DOC-4 is generalized instead.
- Building separate React props tables: rejected; DOC-4 option/reference structures are reused.
- Building a second browser/animation editor: rejected; DOC-8 workspace is reused.
- Implementing fake Web/animation runtimes to make demos look functional: prohibited and rejected.

## Generated evidence

`generated/docs-doc10/` is produced by `npm run docs:generate:doc10` and checked deterministically with `--check`. It includes identity, fixture policy/packages/runtimes/API/examples/capabilities/diagnostics, readiness matrix, gap report, switchers, version readiness, support matrix, option readiness, API routes, browser/animation shells, search/navigation/capability/diagnostic readiness, fixture leak checks, accessibility/responsive/theme structure, bundle/build comparison, production regression, dependency audit, prior-phase context, adapter inventory and index.

## Remaining risks

The primary remaining risk is implementation/test integration: existing generated pipelines may contain hidden assumptions that only CI/typecheck/build will expose. Any such failure must be fixed generically before DOC-10 can close.

## Deferred roadmap ownership

Explicitly not implemented here:

- actual Phase 15–43 engine implementation;
- actual `@apexify/web` runtime;
- actual React adapter;
- actual Next adapter;
- actual animation engine;
- actual diagnostics runtime/system;
- actual capability detection;
- DOC-11 final accessibility/SEO/performance/reliability hardening;
- DOC-12 final release/integrity certification.

## Final diff review

Pending after CI fixes. Final review must verify no future package is marked current, no fixture API/search/example/sitemap/navigation/homepage leak exists, no fake install/version/benchmark/runtime appears, no second router/search/example/playground system was added, and no DOC-11/12 or Phase 15 work entered the diff.

## PR state

Pending.

## Merge state

Not merged.

## Post-merge verification

Not run.

## Documentation architecture score

Provisional future-readiness architecture score: **9.3/10**. This score is deliberately provisional until CI, same-runner measurement, merge and post-merge evidence are complete.
