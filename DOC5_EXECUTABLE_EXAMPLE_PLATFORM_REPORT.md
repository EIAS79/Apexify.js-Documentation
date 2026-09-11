# DOC-5 — Executable Example Platform Completion Report

## Phase

DOC-5 — Executable Example Platform

## Status

**COMPLETE**

DOC-5 is implemented, merged, and post-merge verified on `main`.

- Roadmap goal: make examples authoritative and testable.
- DOC-5 starting documentation SHA: `b7dfca98c2c227619f6b5360898248845846d83a`
- Exact validated implementation PR head: `16822b7c430eaedd32beddb585065296e6bb870d`
- Implementation PR: #25 — `DOC-5: complete executable example platform`
- Implementation merge commit: `698f7ec860f8e9cfd0fa99c6b620a1a3ce5b4240`
- Apexify.js package source pin: `dbed9743353593eafae9a7b1c25312d7170a233b`
- Apexify.js package version: `6.0.0`
- Phase 14-P frozen SHA: `5d9b71f185140d6c3477286b8fb111f293e52b48`
- Apexify.js package-runtime changes made by DOC-5: **NONE**
- DOC-6 started: **NO**
- Phase 15 started: **NO**

The roadmap completion gate is satisfied: representative Node examples build and execute against the packed package artifact and feed documentation, API reference relationships, canonical example pages, and Gallery from the same authoritative source.

## Work completed

DOC-5 replaces copy-pasted example ownership with a typed, deterministic, executable example platform.

The completed architecture provides:

- a typed example registry and schema;
- stable example IDs;
- repository-controlled authoritative source under `examples/node/**`;
- deterministic manifest generation;
- stable source hashing;
- validation of docs/API/source relationships;
- a packed-package consumer fixture;
- per-example TypeScript typechecking;
- per-example compilation and execution;
- output generation and verification;
- output provenance tied to source hash, package identity, packed-artifact digest, and output digest;
- bounded execution controls for repository-controlled examples;
- canonical example detail routes;
- reusable `ExecutableExample` and `CodePreview` components;
- safe registration of those components in the existing DOC-3 rich-MDX parser/renderer architecture;
- documentation pages consuming example IDs instead of owning duplicate executable source;
- reverse example relationships on DOC-4 API pages;
- verified-example Gallery integration;
- Gallery-to-canonical-example return links;
- difficulty and runtime metadata;
- generated example coverage and drift reports;
- a future browser-runner contract that remains explicitly unavailable until a real browser runtime ships;
- DOC-5-specific unit, structural, packed-runtime, browser, accessibility, responsive, keyboard, build, bundle, and regression gates;
- supported Node execution verification on Node 22, Node 24, and Node 26;
- an authoring/maintenance contract in `DOC5_EXECUTABLE_EXAMPLE_AUTHORING.md`.

The authoritative representative inventory is:

- `node.canvas.basic` — minimal;
- `node.chart.bar` — practical;
- `node.gif.basic` — advanced;
- `node.integration.report` — integration.

Merged coverage is complete:

- examples: **4**;
- verified: **4 / 4**;
- failed: **0**;
- stale: **0**;
- unverified: **0**;
- docs-linked: **4 / 4**;
- API-linked: **4 / 4**;
- Gallery-linked: **4 / 4**;
- examples with verified output: **4 / 4**;
- examples missing explanation: **0**.

Merged drift evidence reports all tracked drift classes empty:

- orphan sources: **0**;
- manifest entries without source: **0**;
- source files without manifest entries: **0**;
- missing docs example IDs: **0**;
- missing API example IDs: **0**;
- missing Gallery example IDs: **0**;
- stale outputs: **0**;
- unverified public examples: **0**.

### Packed artifact identity

The verification runner does not use a workspace link or local source shortcut as proof.

It packs and installs the pinned consumer dependency as:

- artifact: `apexify.js-6.0.0.tgz`;
- package version: `6.0.0`;
- package commit: `dbed9743353593eafae9a7b1c25312d7170a233b`;
- artifact SHA-256: `d4520e1f79b9061b187513929678f737440123b3b8988e6e23b97db12f9a3118`;
- installed location: isolated consumer `node_modules/apexify.js`;
- local source shortcut: **false**.

All four examples typecheck, compile, execute, and verify declared outputs against this packed artifact.

### Execution boundary

The runner executes **repository-controlled DOC-5 example sources only**. It is not a public arbitrary-code sandbox.

Implemented controls include:

- disposable consumer fixture;
- per-example working/output directories;
- packed artifact installation;
- sanitized execution environment;
- `NODE_ENV=test`;
- no inherited common secret-bearing environment variables;
- execution timeout;
- stdio cap;
- output-file-count limit;
- output-byte limit;
- output path-containment checks;
- fixture cleanup.

DOC-5 intentionally does not claim operating-system network denial. Current examples require no network I/O, but the security description is limited to controls that are actually implemented.

## Problems discovered

DOC-5 exposed real implementation and verification defects during completion:

1. The first workflow definition used a matrix expression inside a YAML flow-map form that GitHub Actions did not parse into jobs reliably.
2. Extending the shared registered MDX component surface changed deterministic DOC-3 evidence, so inherited verification rejected stale prior-phase artifacts.
3. A renderer refactor compressed the existing switch shape enough that the DOC-3 structural verifier could no longer prove required component wiring.
4. `ExecutableExample` and `CodePreview` were initially wired into the renderer without also being added to the parser's registered-component contract, which could have left those tags inert as Markdown.
5. Replacing a copied representative Canvas snippet with an authoritative executable example removed the last DOC-3 representative `CodeGroup` proof and correctly failed the inherited DOC-3 gate.
6. TypeScript found `width`/`height` access on an output expectation union without sufficient narrowing.
7. Project `ProcessEnv` typing required explicit `NODE_ENV`, while two sanitized/minimal environment objects omitted it from their static type shape.
8. The early browser verifier collected console errors without making them hard failures and only rejected serious/critical axe violations, which was weaker than the intended completion contract.
9. The first Gallery integration was naturally one-directional: examples fed Gallery, but Gallery needed an explicit canonical return path to prove the product relationship in both directions.
10. Successful branch CI generated and committed deterministic evidence after the developer-authored commit, so the evidence-complete tree required a separate human-authored exact-head validation step before merge.

## What went wrong

The main failure class was integration-contract drift rather than example runtime correctness.

The packed-package runner proved the representative examples early, but DOC-5 touches several pre-existing documentation systems simultaneously: DOC-3 MDX registration, DOC-4 API relationships, Gallery presentation, deterministic evidence, and responsive browser behavior. Several early changes were semantically correct at runtime while failing structural or evidence contracts established by prior phases.

The verification layer also needed to be stricter than the initial draft. A browser gate that records console failures without failing, or accepts lower-severity WCAG violations, cannot serve as a final completion gate. Likewise, a green CI run that subsequently commits generated evidence proves the pre-evidence tree, not necessarily the exact tree proposed for merge.

## How fixed

- Rewrote the GitHub Actions matrix configuration using block YAML syntax.
- Made DOC-5 regenerate affected DOC-3 evidence before invoking the inherited DOC-4 → DOC-3 → DOC-2 → DOC-1 chain.
- Versioned affected DOC-1/DOC-3 deterministic evidence together with DOC-5 evidence where appropriate.
- Restored the explicit renderer switch structure required by the DOC-3 wiring contract and added only the DOC-5 cases.
- Registered `ExecutableExample` and `CodePreview` in the parser contract as well as the renderer/export surfaces.
- Added DOC-5 structural assertions so parser/renderer registration cannot silently diverge.
- Preserved the DOC-3 `CodeGroup` representative proof with a non-authoritative comparison/consumption snippet while keeping the real executable source single-source under `examples/node/**`.
- Narrowed output metadata access before reading PNG/GIF dimensions.
- Added explicit `NODE_ENV: 'test'` to controlled process environments and typed minimal install environments correctly.
- Strengthened browser verification to hard-fail on unexpected console/page/HTTP errors, all targeted axe violations, horizontal overflow, reduced-motion failure, and keyboard-interaction failure.
- Added keyboard verification for code copy, multi-file tabs, and GIF disclosure.
- Added explicit Gallery-to-canonical-example linkage while retaining manifest-derived code and preview data.
- Required a human-authored exact PR head after the workflow-generated evidence commit and validated all PR workflows against that exact SHA before merge.

No failure was waived by loosening the completion criteria.

## Not completed

The following work is intentionally outside DOC-5 and was not started:

- DOC-6 search, discovery, and cross-linking redesign;
- later documentation pre-phase phases;
- a real browser example runtime;
- future `@apexify/web` execution support;
- Phase 15 Apexify.js engine work;
- changes to the Apexify.js package runtime.

The existing pre-DOC-5 Gallery snippets also remain legacy Gallery content. They are not retroactively labeled as packed-package-verified DOC-5 examples.

## Why

The roadmap defines DOC-5 specifically as the executable example platform. DOC-6 owns the larger search/discovery architecture, while future browser execution depends on a real shipped browser runtime rather than a Node-based emulation.

Keeping these boundaries explicit prevents speculative capability claims and preserves phase-by-phase evidence attribution.

The Apexify.js package remains an immutable pinned consumer dependency for DOC-5. The purpose of this phase is to prove examples against the package artifact, not modify the package to make examples pass.

## Alternatives

The following alternatives were rejected:

- **Copy executable examples into MDX pages:** rejected because docs and executable source would drift.
- **Maintain separate Gallery snippets for DOC-5 examples:** rejected because Gallery must consume the authoritative example manifest/source.
- **Use the repository/workspace package source directly:** rejected because that would not prove behavior of the packed consumer artifact.
- **Treat output existence as sufficient:** rejected; outputs are format/semantic verified and bound to provenance.
- **Mark examples verified manually:** rejected; verification state must derive from execution evidence and matching source/package identity.
- **Expose arbitrary public code execution as the DOC-5 runner:** rejected; the CI runner is intentionally repository-controlled and bounded.
- **Claim operating-system network sandboxing:** rejected because DOC-5 does not implement that control.
- **Simulate browser support with Node shims:** rejected because the roadmap requires a future browser-runner contract, not fictional runtime support.
- **Bypass inherited DOC-3 evidence failures:** rejected; affected prior-phase evidence was regenerated and revalidated instead.
- **Remove the DOC-3 `CodeGroup` proof:** rejected; the pre-existing component-library completion contract remains binding.
- **Accept only severe/critical axe failures:** rejected in favor of the stricter zero-violation DOC-5 browser gate.
- **Trust pre-evidence CI after a bot evidence commit:** rejected; the exact evidence-complete human head was revalidated before merge.

## Components added

DOC-5 added reusable example presentation components:

- `components/examples/ExecutableExample.tsx`;
- `components/examples/CodePreview.tsx`.

It also added the supporting example architecture:

- `lib/examples/schema.ts`;
- `lib/examples/definitions.ts`;
- `lib/examples/validation.ts`;
- `lib/examples/hash.ts`;
- `lib/examples/manifest.ts`;
- `lib/examples/contract.ts`;
- `lib/examples/browser-runner-contract.ts`;
- `lib/gallery/docs/doc5GalleryAdapter.ts`.

## Components enhanced

The following existing surfaces were enhanced without creating competing systems:

- `RouteDocsMarkdown` now renders DOC-5 example components through the established rich-MDX path.
- DOC-3 rich parser registration was extended for the two DOC-5 components.
- The MDX component barrel/registry exports the new example components.
- DOC-4 API symbol/member pages now expose verified related examples using validated API IDs.
- Gallery registry/helper/type integration now accepts verified DOC-5 manifest entries.
- Canvas guide/reference content now demonstrates authoritative example consumption while preserving DOC-3 component proofs.

## Components removed

No established documentation component was removed by DOC-5.

DOC-5 intentionally reuses the existing DOC-2/DOC-3 documentation shell and code presentation primitives instead of adding a competing documentation renderer.

## Routes added/migrated

Added:

- `/examples/[id]` as the canonical example-detail route.

The production build statically generates the four representative routes:

- `/examples/node.canvas.basic`;
- `/examples/node.chart.bar`;
- `/examples/node.gif.basic`;
- `/examples/node.integration.report`.

Unknown example IDs are verified to return `404`.

Existing documentation, API reference, and Gallery routes were integrated rather than replaced.

## Content migrated

The Canvas documentation was migrated away from owning a duplicate full executable example and now consumes the authoritative example by stable ID.

DOC-5 also introduced generated/verified relationships so the same example identity can appear in:

- documentation;
- API reference pages;
- Gallery;
- canonical example detail pages.

Gallery receives code and verified preview outputs from the DOC-5 manifest, and its DOC-5 entries expose a canonical example-page return path.

`DOC5_EXECUTABLE_EXAMPLE_AUTHORING.md` documents the ongoing authoring, verification, provenance, security, integration, and phase-boundary contract.

## Tests added

DOC-5 adds 13 deterministic Node tests across `doc5.test.ts` and `doc5-runner.test.ts`.

They cover:

- representative definition validity;
- stable/unique IDs;
- invalid runtime/difficulty/output metadata;
- missing source/docs/API relationships;
- source-hash stability and content sensitivity;
- browser-runner future-contract behavior;
- authoritative source placement;
- secret-environment non-inheritance;
- controlled-process success/failure capture;
- timeout handling;
- output path traversal rejection;
- PNG/GIF metadata verification;
- semantic JSON output verification;
- per-example output isolation.

The full packed runner additionally typechecks, compiles, executes, and verifies all four real representative examples.

Browser verification covers five responsive/theme states:

- desktop light;
- tablet dark;
- mobile light;
- 320px-class narrow dark;
- desktop dark with reduced motion.

It verifies:

- HTTP status and canonical URL;
- zero targeted axe violations;
- no horizontal overflow;
- reduced-motion behavior;
- no unexpected console/page/resource failures;
- code-copy keyboard operation;
- multi-file tab keyboard operation;
- GIF disclosure keyboard operation;
- documentation linkage;
- API linkage;
- Gallery linkage;
- unknown-example 404 behavior.

## Verification

### Authoritative branch verification

Branch run `34543115353` proved the complete DOC-5 pipeline before the final human exact-head validation step.

It passed:

- packed `apexify.js@6.0.0` installation;
- all four example typechecks/compiles/executions;
- deterministic manifest generation;
- 13 / 13 DOC-5 tests;
- DOC-5 structural/linkage verification;
- inherited DOC-4 → DOC-3 → DOC-2 → DOC-1 verification;
- existing documentation integrity;
- TypeScript;
- clean production build;
- five-state browser/accessibility/keyboard verification;
- quantitative finalizer;
- evidence upload;
- supported packed-example execution on Node 22 and Node 26 in addition to the main Node 24 pipeline.

Branch evidence artifact:

- artifact ID: `10178076665`;
- digest: `sha256:ec7934572e8a7392d4a559f23e910d64e2d2d6e05499d05b5835fd2e4c2c037a`;
- size: **37,044 bytes**.

The successful workflow-generated evidence commit was:

`eea09748790755ec5c355b9879bd9aeb9fcc771a`

A human-authored maintenance-contract commit then produced the exact evidence-complete PR head:

`16822b7c430eaedd32beddb585065296e6bb870d`

### Exact implementation-head PR verification

The exact PR head `16822b7c430eaedd32beddb585065296e6bb870d` passed every pull-request workflow triggered for DOC-5:

- DOC-1 Information Architecture — run `34543660802` — **SUCCESS**;
- DOC-2 Design System and Shell — run `34543660620` — **SUCCESS**;
- DOC-3 MDX Component Library — run `34543660560` — **SUCCESS**;
- DOC-4 API Reference Engine — run `34543660629` — **SUCCESS**;
- DOC-5 Executable Example Platform — run `34543660673` — **SUCCESS**;
- Documentation Runtime Build Gate — run `34543660773` — **SUCCESS**.

The DOC-5 PR run also passed packed example execution on Node 22, Node 24, and Node 26.

PR #25 was merged with an expected-head lock on exactly `16822b7c430eaedd32beddb585065296e6bb870d`.

### Post-merge `main` verification

Implementation merge SHA:

`698f7ec860f8e9cfd0fa99c6b620a1a3ce5b4240`

The merge was confirmed as current `main` before post-merge conclusions were accepted.

Relevant `main` push workflows all passed:

- Documentation Runtime Build Gate — run `34544698812` — **SUCCESS**;
- DOC-2 Design System and Shell — run `34544698871` — **SUCCESS**;
- DOC-3 MDX Component Library — run `34544698873` — **SUCCESS**;
- DOC-4 API Reference Engine — run `34544698869` — **SUCCESS**;
- DOC-5 Executable Example Platform — run `34544698911` — **SUCCESS**.

The runtime build gate passed Node 22, Node 24, and Node 26. The DOC-5 post-merge run also passed packed-example execution on Node 22, Node 24, and Node 26.

DOC-5 post-merge evidence artifact:

- run: `34544698911`;
- artifact ID: `10178631442`;
- digest: `sha256:c8f080c25cee1e32ae09524b7efc94f8d52c2b3a757a305acdbd924f25df369d`;
- size: **37,052 bytes**.

Merged finalizer status: **PASS**, failures: `[]`.

## Accessibility impact

Accessibility is positively affected and regression-gated.

The example detail surface reuses accessible documentation/code primitives and adds explicit keyboard verification for its interactive controls.

Merged browser evidence confirms across all five tested responsive/theme states:

- axe violations: **0**;
- horizontal overflow: **false**;
- reduced-motion behavior: **PASS**;
- code-copy keyboard interaction: **PASS**;
- multi-file tab keyboard interaction: **PASS**;
- GIF disclosure keyboard interaction: **PASS**.

Unexpected console/page/resource failures remain hard failures, with only the known local Vercel Speed Insights 404 treated as an expected local-environment miss.

## Performance impact

DOC-5 does not introduce a material clean-build regression.

Merged `main` measurement from run `34544698911`:

- DOC-4 post-merge clean-build baseline: **41,767.966 ms**;
- DOC-5 merged clean build: **39,293.854 ms**;
- measured delta: **-5.92%**;
- allowed build-wall regression: **+35%**.

The quantitative finalizer passed.

The earlier branch measurement was **42,513.082 ms** (**+1.78%**) and also passed, showing the phase remains within budget across independent clean CI builds.

## Bundle impact

Merged DOC-5 measurement:

- example route manifest JS: **998,910 bytes**;
- documentation route manifest JS: **1,001,146 bytes**;
- Gallery manifest JS: **1,966,560 bytes**;
- generated DOC-5 example manifest: **19,261 bytes**;
- example-route configured ceiling: **1,500,000 bytes**;
- manifest configured ceiling: **2,000,000 bytes**.

The finalizer passed all configured bundle/manifest thresholds.

Next.js reported approximately **334 kB First Load JS** for `/examples/[id]`. DOC-5 does not add a second editor/runtime bundle to the example page; it reuses established documentation/code components and server-generated manifest data.

## SEO/link impact

- Every representative example has a stable canonical identity under `/examples/<id>`.
- The browser gate verifies the canonical example URL.
- Documentation links to stable example IDs rather than fragile copied code ownership.
- DOC-4 API pages expose reverse links to verified examples through validated API IDs.
- Gallery entries expose canonical example-page return paths.
- Unknown example IDs return `404`, avoiding accidental indexable ghost pages.
- Existing documentation canonical routes and legacy DOC-1 link contracts continue to pass inherited verification.

## Dependency changes

DOC-5 added **no production dependency** and **no persistent CI dependency** according to the generated dependency audit.

The implementation uses Node core plus the repository's existing TypeScript/`tsx` toolchain. Browser audit packages are installed ephemerally in CI and are not added as DOC-5 production dependencies.

The existing locked dependency graph still reports npm audit advisories during CI installation. DOC-5 did not add the dependencies responsible for those advisories, but the repository-wide dependency-security state remains a maintenance concern outside the DOC-5 feature contract.

## Remaining risk

Remaining risks are bounded and do not invalidate the DOC-5 completion gate:

1. **Future browser runtime:** only the contract exists. Browser example execution must remain unavailable until an actual shipped browser runtime can be verified securely.
2. **OS-level network isolation:** DOC-5 does not claim it. If future examples require stronger hostile-code isolation, a materially stronger sandbox architecture will be required.
3. **Repository-controlled execution trust:** the current runner is appropriate for reviewed repository examples, not untrusted user code.
4. **Dependency advisories:** the repository's existing dependency graph reports npm audit findings and should be handled through the appropriate dependency/security maintenance process.
5. **Stable example IDs:** IDs are now linkable product identities; future renames require compatibility handling.
6. **Generated evidence lifecycle:** future phases that extend shared MDX/example contracts must continue regenerating affected deterministic evidence before inherited gates.

There is no known DOC-5 completion blocker remaining.

## Documentation architecture score

**9.8 / 10 — DOC-5 scope only.**

This score is not a claim that the entire documentation pre-phase program is 9.8/10 complete. It evaluates the DOC-5 architecture against its own roadmap contract.

Reasons for the score:

- authoritative single-source executable examples: complete;
- packed-package consumer proof: complete;
- deterministic manifest/provenance model: complete;
- docs/API/Gallery/canonical-page integration: complete;
- runtime/difficulty metadata: complete;
- output verification: complete;
- drift/coverage reporting: complete;
- exact-head and post-merge CI proof: complete;
- accessibility/responsive/keyboard gates: complete;
- performance/bundle budgets: passing;
- dependency additions: none;
- security claims: bounded to implemented controls;
- future browser support: correctly represented as contract-only rather than falsely implemented.

The remaining 0.2 reflects intentionally unimplemented future-runtime/sandbox capabilities and repository-wide dependency maintenance concerns, neither of which belongs to the DOC-5 completion gate.

---

DOC-5 completion gate: **SATISFIED**.

DOC-6: **NOT STARTED**.

Phase 15: **NOT STARTED**.
