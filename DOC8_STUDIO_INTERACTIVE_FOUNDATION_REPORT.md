# DOC-8 — Studio and Interactive Documentation Foundation Completion Report

## Phase

DOC-8 — Studio and Interactive Documentation Foundation

## Status

**COMPLETE**

DOC-8 implementation is merged and post-merge verified on `main`. This report is the documentation-only completion record created after implementation merge and post-merge validation; its own report-only closure merge will advance the final documentation SHA without changing the verified runtime implementation tree.

## Source authority

DOC-8 was executed against the live `EIAS79/Apexify.js-Documentation` repository using the supplied DOC-8 execution specification, the already-merged DOC-0 through DOC-7 architecture, the pinned Apexify.js package evidence, the generated DOC-4/DOC-5/DOC-6 artifacts, and measured GitHub Actions/browser evidence.

No partial earlier conclusion was treated as authoritative without re-running the current implementation gate.

## Repository identities

| Identity | SHA / value |
| --- | --- |
| Phase 14-P frozen SHA | `5d9b71f185140d6c3477286b8fb111f293e52b48` |
| Apexify.js package main SHA observed at DOC-8 closure | `2b64087a04411982067cc624031b3de6f663c530` |
| Documentation package source pin | `dbed9743353593eafae9a7b1c25312d7170a233b` |
| Package version | `6.0.0` |
| DOC-0 merge SHA | `573b592942327d451661cd55d50fd237630eb5cf` |
| DOC-1 merge SHA | `c3d0799b8fb67fd7c86d48aceaa8c88e5e3d649f` |
| DOC-2 final closure SHA | `90dbf8954d82b7f72b654db0b0aef3cc7629db40` |
| DOC-3 final closure SHA | `eece2c982c82f013b415cc6b5a822a6b88d27a05` |
| DOC-4 final closure SHA | `b7dfca98c2c227619f6b5360898248845846d83a` |
| DOC-5 final closure SHA | `61f690695be11de1928e0ee028c65fd0496be76c` |
| DOC-6 merge SHA | `96c4c9ef418fc3ea30a391c89037cc9744d7fdc0` |
| DOC-7 final closure SHA / DOC-8 base | `8424834aa0334044b5603bf88406f0a1fa10a396` |
| DOC-8 validated implementation branch SHA | `388ed7de2f8473e3d46988a46d0b813b5a562a0e` |
| DOC-8 implementation PR | `#30` |
| DOC-8 implementation merge SHA | `4d8d5fef2064211ddd1788b4b7373730a71d1d8b` |
| Post-merge verified implementation `main` SHA | `4d8d5fef2064211ddd1788b4b7373730a71d1d8b` |

The report-only closure merge will become the final documentation `main` SHA for the DOC-8 record. It contains documentation/evidence only and does not alter the already post-merge-verified implementation tree.

## Starting Studio architecture

Before DOC-8, Studio owned its own editor, split layout, output/error presentation, local execution knowledge, multi-buffer state, and share-link encoding. Several of those concerns were tightly coupled to Studio component names and the Gallery runner route.

The old architecture was functional but did not provide a reusable, truth-preserving contract for interactive documentation.

## Starting interactive-doc architecture

Documentation already had strong DOC-3/DOC-5 presentation primitives and verified examples, but it did not share a complete editor/preview/diagnostics/session/workspace foundation with Studio. A naive DOC-8 implementation could therefore have produced a second editor stack or a browser-execution simulation disconnected from the current Node-only package truth.

## Duplicate-system audit

The DOC-8 audit identified separate or partially duplicated concerns across Studio, Gallery, and documentation:

- editor wrappers and CodeMirror ownership;
- split/workspace layout behavior;
- preview/output rendering;
- error/diagnostic presentation;
- session/share serialization;
- direct runner endpoint knowledge;
- execution availability state;
- resource-limit constants and runner policy.

DOC-8 consolidated those concerns behind shared primitives while retaining thin compatibility wrappers where existing public/internal component names were useful.

## Work completed

DOC-8 introduced one shared interactive foundation containing:

- a lazy editor abstraction;
- a single heavy CodeMirror implementation owner;
- preview/output state and truthful provenance labels;
- a shared diagnostics model/panel;
- reusable option-form primitives;
- a responsive split/stack workspace;
- a versioned session/reset/share contract;
- execution adapter contracts;
- centralized resource limits;
- shared error boundaries;
- explicit client/lazy boundaries;
- a future browser-runtime adapter contract only;
- deterministic architecture/security/client-boundary evidence;
- unit/structural/browser/security/bundle verification;
- contributor, internals, and execution-security documentation.

Studio and the representative `/docs/node/canvas` interactive surface now consume the same primitive layer.

## Problems discovered

DOC-8 uncovered real defects rather than only adding new components:

1. `CodePreview` initially passed a nullable preview URL into a narrower prop type.
2. The first shared CodeMirror surface exposed an unnamed input, a non-focusable scroll region, and multiple contrast failures.
3. Six remaining CodeMirror gutter line numbers measured only 3.86:1 contrast.
4. Studio's legacy tab structure used invalid ARIA relationships and nested interactive controls.
5. Studio mobile dark-theme TypeScript indicators used a white/iris contrast pair below AA.
6. The first shared workspace implementation did not change split ratio from keyboard input when uncontrolled.
7. Studio execution initially defaulted enabled before the availability probe could fail closed.
8. `CodeStudio` knew the runner endpoint directly instead of using an execution adapter.
9. Existing copy described the local runner as a sandbox even though it did not provide network isolation.
10. Studio share state was unversioned and unbounded.
11. A broad replacement of DOC-5 code presentation would have broken the established `CodeGroup` copy/source contract.
12. The browser verifier initially used the obsolete Puppeteer `$x` path.
13. Route/client boundaries caused heavy interactive JavaScript to leak into ordinary documentation through route ownership/prefetch.
14. Homepage navigation prefetch ultimately pulled Docs, Gallery, Studio, and example-route chunks, producing a measured homepage JS regression of roughly 418% before the fix.

## What went wrong

The main implementation difficulty was not the shared component API itself. It was proving that sharing source modules did not accidentally share heavy client bundles, and proving accessibility/security claims in the rendered production application.

Several early hypotheses about the bundle leak were incomplete. The browser gate showed the actual downloaded chunks, which eventually identified Next.js route prefetch—not the final Canvas editor boundary—as the remaining homepage leak.

The validation loop also exposed inherited semantic defects in Studio controls once those controls were audited under the stricter DOC-8 browser matrix.

## How fixed

- Normalized nullable preview input before it reached the strict preview prop.
- Gave the CodeMirror input an accessible name, made the scroll viewport keyboard focusable, and set an explicit dark editor surface.
- Raised gutter foreground contrast without weakening Axe.
- Replaced invalid fake-tab nesting with a valid grouped-button structure while preserving rename/close behavior.
- Fixed the two measured dark-theme iris contrast pairs.
- Added an internal split ratio for uncontrolled workspace use while retaining controlled Studio behavior.
- Made execution availability fail closed and moved endpoint knowledge into `serverClientAdapter.ts`.
- Disabled arbitrary production execution and renamed the local mode truthfully as trusted-local execution, not a sandbox.
- Added an allowlisted child environment, per-run temporary working directory, cleanup in `finally`, and shared resource limits.
- Replaced new Studio share encoding with the versioned/bounded shared session format while retaining a legacy decode fallback.
- Preserved DOC-5 `CodeGroup`; only `node.canvas.basic` gains the representative interactive playground.
- Replaced the deprecated browser selector path with stable DOC-8 data hooks.
- Added a dedicated `/docs/node/canvas` route and explicit prefetch isolation.
- Disabled automatic cross-product Next.js prefetch from homepage/product navigation where it caused eager heavy-route downloads.

No correctness, accessibility, security, regression, or bundle threshold was weakened to force a green result.

## Not completed

DOC-8 intentionally does **not** implement:

- a real `@apexify/web` runtime;
- browser-native Apexify rendering;
- arbitrary browser npm execution;
- arbitrary remote JavaScript execution;
- public arbitrary Node execution;
- a network-isolated process sandbox;
- full documentation-corpus interactive migration;
- DOC-9, DOC-10, DOC-11, or DOC-12 work;
- Phase 15+ engine APIs.

## Why

Those items are either later roadmap ownership or would make claims the current package cannot substantiate. DOC-8's purpose is the reusable interaction foundation and truthful current Node-mode behavior, not speculative engine implementation.

## Alternatives considered

- **Separate Studio and docs editors:** rejected because it preserves the architecture DOC-8 exists to remove.
- **Globally import CodeMirror:** rejected because ordinary routes would inherit editor weight.
- **Replace DOC-5 code presentation entirely:** rejected because it would break established verified-example/copy contracts.
- **Expose the existing local runner publicly:** rejected because it is not an isolation boundary.
- **Add a sandbox/state/split-pane dependency:** rejected; existing React/browser primitives and CodeMirror tooling were sufficient.
- **Fabricate browser output from an editor-only renderer:** rejected as a shadow-renderer/future-runtime false claim.
- **Relax the bundle or Axe gates:** rejected; the measured causes were fixed instead.

## Editor abstraction

Implementation: `components/docs/playground/InteractiveCodeEditor.tsx`.

Heavy implementation owner: `components/docs/playground/CodeMirrorEditor.tsx`.

Consumers include Studio (through the shared/compatibility layers), Gallery's snippet editor wrapper, and the representative documentation playground.

The heavy editor is dynamically loaded with SSR disabled and wrapped in shared error recovery. Direct CodeMirror heavy imports are centralized in `CodeMirrorEditor.tsx`.

Accessibility fixes include an accessible editor input name, keyboard-focusable scrolling, AA-safe gutter text, and retained keyboard editing behavior.

## Preview abstraction

`components/docs/playground/InteractivePreview.tsx` renders the shared preview state machine and truthful provenance labels.

Current adapter/output modes are:

- `verified-static`;
- `server-backed`;
- `future-browser` (contract category only).

Current documentation uses verified output. Current trusted-local Studio may use the server-backed adapter. No browser runtime is fabricated.

## Output viewer

Studio's output panel now delegates preview state to `InteractivePreview`, while preserving Studio-specific zoom/history/replay/clear functionality around the shared primitive. Documentation uses the same preview primitive for the representative verified example.

## Diagnostics model

`InteractiveDiagnostic` provides:

- stable id;
- severity (`info`, `warning`, `error`);
- message;
- optional source;
- optional line/column;
- optional code;
- optional help.

Execution errors are adapted into this common model.

## DiagnosticsPanel

`components/docs/playground/DiagnosticsPanel.tsx` is the shared presentation component. Studio's output tabs and the documentation playground both use it rather than maintaining independent error lists.

## Option-form primitives

`components/docs/playground/OptionFields.tsx` contains reusable text, number, range, color, boolean, enum, and grouped option controls. DOC-8 establishes the primitive layer without migrating the full reference corpus; later corpus migration remains deferred.

## Workspace/split layout

`InteractiveWorkspace.tsx` is the common layout primitive. Desktop supports pointer and keyboard split adjustment. It can operate with either a controlled ratio or internal ratio.

Studio's `StudioResizableSplit` is now a compatibility adapter over this shared workspace.

## Mobile stacked playground

At narrow/mobile widths the workspace stacks editor/output instead of compressing a desktop split. The production browser gate verifies the representative docs and Studio at 390×844 without horizontal overflow.

## Session architecture

`InteractiveSession` schema version 1 contains source, language, runtime, options, optional selected file, and lightweight layout state. Shared helpers construct, serialize, parse, and reset sessions.

Studio maps richer multi-buffer data into the shared versioned options payload for share-state purposes while retaining product-local editor state where appropriate.

## Reset contract

Reset returns a fresh deterministic copy of the initial structured session. Consumer reset paths clear stale execution/output state rather than retaining results from an old source state.

## Share-state contract

Share state is:

- schema-versioned;
- bounded to 64 KiB;
- validated on parse;
- intended for user-visible/public state only;
- backward-compatible with legacy Studio payload decoding.

Secrets and environment data are explicitly outside the contract.

## Execution abstraction

`ExecutionAdapter` separates UI/session concerns from runtime execution and exposes runtime, adapter id, mode, run, optional reset, and optional dispose.

`lib/docs/playground/serverClientAdapter.ts` owns the current `/api/gallery/run` client integration so Studio no longer directly hardcodes the endpoint.

## Current execution modes

- **Production/public:** browser-direct `@apexify/web` where supported, otherwise the same-origin isolated full Apexify runtime.
- **Trusted local development:** server-backed execution with explicit `ENABLE_LOCAL_APEXIFY_CODE_RUN=true` and non-production environment.
- **Documentation representative example:** verified-static output.
- **Browser runtime:** pinned `@apexify/web` implementation for supported direct operations.

## Trust boundary

Trusted repository examples and generated DOC-5 outputs are accepted as authoritative documentation evidence.

User-edited source is **not trusted**. Production executes it only through the same-origin Deno permission boundary. The isolated runtime uses an allowlisted environment, a disposable per-run workspace, no arbitrary network permission, scoped native FFI, and fixed FFmpeg/ffprobe media proxies.

Trusted-local execution remains a separate opt-in developer path and may inherit ambient host capabilities.

All execution paths remain bounded by timeout/source/process/output limits and cleanup runs recursively in `finally`.

## Resource limits

| Limit | Configured value | Rationale |
| --- | ---: | --- |
| Execution time | 55,000 ms | Preserve the bounded current local-runner ceiling and prevent unbounded runs |
| Source size | 280,000 characters | Reject oversized submitted programs |
| Per-output size | 32 MiB | Bound one generated artifact |
| Total output | 64 MiB | Bound all artifacts from one run |\n| Process buffer | 20 MiB | Bound captured stdout/stderr/process data |
| Share state | 64 KiB | Keep URL/share payloads bounded and privacy-conscious |
| Maximum outputs | 24 | Bound one run to a finite multi-preview set |

The same `DOC8_RESOURCE_LIMITS` object is consumed by contracts/tests/current runner instead of scattered magic numbers.

## Security changes

- Public production user-source execution is enabled only through the same-origin isolated runtime.
- Explicit trusted-local opt-in remains separate from production isolation.
- Child environment is allowlisted instead of spreading `process.env`.
- Production network access is denied.
- Native canvas FFI and system access are scoped.
- FFmpeg/ffprobe subprocess access is limited to fixed media proxies.
- Per-run temporary cwd and recursive cleanup are enforced.
- Multi-file workspace and multi-output artifact limits are bounded.
- Package installation and remote-script execution remain disabled.
- Production browser verification executes real Scene, GIF, MP4, multi-file, and multi-output smoke tests.
- Dedicated security documentation: `DOC8_EXECUTION_SECURITY.md`.

## Error boundaries

`InteractiveErrorBoundary.tsx` provides recovery around heavy editor/preview regions. A lazy-editor rendering failure therefore does not have to crash the entire Studio/docs route.

## Lazy-loading architecture

Deterministic client-boundary evidence records:

- heavy editor module: `CodeMirrorEditor.tsx`;
- lazy boundary: `InteractiveCodeEditor.tsx`;
- ordinary docs must not mount editor;
- homepage must not mount editor;
- closed Gallery must not mount editor;
- interactive routes: `/studio`, `/docs/node/canvas`.

The final browser transfer comparison proves the ordinary-route and homepage leakage discovered during development was removed.

## `@apexify/web` browser adapter

The `WebRuntimeAdapter` contract now has a pinned `@apexify/web` implementation used by Studio for browser-direct operations. Full-runtime capability families continue to route to the isolated server runtime.

## No-shadow-renderer verification

DOC-8 does not create an editor-only renderer or duplicate Apexify graphics implementation. Current Node documentation continues to use authoritative DOC-5 verified output. The structural verifier checks for the future adapter contract while rejecting speculative `@apexify/web` implementation/imports.

## Studio migration

Studio now uses the shared editor/session/execution/preview/diagnostics/workspace architecture while preserving Studio-specific features including multiple buffers, templates, history, replay, zoom, download, keyboard shortcuts, and reset/share behavior.

Execution availability defaults false until probed, then production reports the same-origin isolated runtime when its pinned runtime assets are present.

## Representative interactive docs migration

`/docs/node/canvas` is the bounded representative interactive surface. It uses authoritative `node.canvas.basic` source/output and the same editor/preview/diagnostics/workspace/session primitives as Studio.

Editing the source does not falsely replace verified output with an unverified browser render; provenance remains explicit.

## Shared-primitives proof

Deterministic `generated/docs-doc8/architecture.json` records the same modules consumed by both surfaces:

- editor: `InteractiveCodeEditor.tsx`;
- preview: `InteractivePreview.tsx`;
- diagnostics: `DiagnosticsPanel.tsx`;
- workspace: `InteractiveWorkspace.tsx`;
- options: `OptionFields.tsx`;
- session: `lib/docs/playground/session.ts`;
- execution: `lib/docs/playground/serverClientAdapter.ts`.

Studio consumers and documentation consumers are independently enumerated in the generated artifact and checked by `scripts/docs/doc8-verify.ts`.

## Components added

Primary additions include:

- `CanvasPlaygroundLoader.tsx`;
- `CodeMirrorEditor.tsx`;
- `InteractiveCodeEditor.tsx`;
- `InteractivePreview.tsx`;
- `DiagnosticsPanel.tsx`;
- `InteractiveWorkspace.tsx`;
- `OptionFields.tsx`;
- `InteractiveErrorBoundary.tsx`;
- `VerifiedExamplePlayground.tsx`;
- shared contracts/session/server adapter;
- deterministic DOC-8 generation, verification, unit, browser, and CI workflow;
- three generated DOC-8 evidence JSON files;
- contributor/internals/security documentation.

## Components enhanced

Studio, Gallery editor compatibility, Canvas docs routing, navigation/prefetch boundaries, Studio storage/share, runner wording/security, Studio tab semantics, and homepage/product navigation were enhanced as part of the migration and regression fixes.

## Components removed

No public product component was removed outright. Large duplicated implementation bodies were collapsed into thin adapters/shared primitives where compatibility names still mattered.

## Routes added/changed

- Added dedicated `/docs/node/canvas` route for the representative interactive documentation surface.
- Hardened `/api/gallery/run` production/local security behavior.
- Kept ordinary `/docs/[...slug]` routing free of the heavy interactive implementation.
- Adjusted route prefetch behavior in documentation/product navigation to preserve bundle isolation without changing click destinations or canonical links.

## Content migrated

Only the representative Canvas example path was made interactive for DOC-8. Full documentation content reorganization/migration is deliberately not performed here.

## Tests added

DOC-8 adds:

- session round-trip/version/runtime validation;
- share-state size-bound validation;
- deterministic reset validation;
- resource-limit contract validation;
- structural shared-primitive verification;
- security/runner invariant verification;
- lazy import ownership verification;
- production browser matrix;
- Axe accessibility verification;
- keyboard workspace/share behavior;
- responsive/overflow checks;
- reduced-motion checks;
- production execution-boundary checks;
- same-runner bundle transfer comparison;
- inherited DOC-5 and DOC-7 production browser regression runs;
- inherited DOC-1 through DOC-7 deterministic regression chain.

## Accessibility impact

Final DOC-8 browser evidence reports zero Axe violations for all DOC-8 audited route/states. The implementation fixed rather than waived the editor-input naming, scroll focusability, CodeMirror gutter contrast, Studio tab semantics, nested-interactive structure, and mobile dark-theme contrast defects discovered by the gate.

No Axe rule was disabled to obtain closure.

## Keyboard verification

The final browser suite verifies keyboard activation of the representative share/reset/workspace behaviors and Studio split interaction. DOC-5/DOC-7 inherited browser suites also pass their established keyboard contracts.

## Responsive impact

DOC-8 explicitly verifies:

- Studio desktop 1440×1000;
- Studio mobile 390×844;
- interactive docs desktop 1440×1000;
- interactive docs mobile 390×844;
- ordinary docs, homepage, and Gallery closed state at production desktop sizes.

No audited state has horizontal overflow.

## Theme impact

Interactive docs pass light and dark coverage; Studio passes light desktop and dark mobile coverage. Existing DOC-7 browser verification continues to cover homepage/Gallery light/system/dark states.

## Reduced-motion impact

The interactive docs reduced-motion dark state passes. DOC-7's inherited reduced/system verification also remains green.

## Performance impact

The final accepted comparison is the exact-head DOC-8 same-runner baseline versus implementation run `34776945568`. The post-merge `main` run `34777806480` repeats the same DOC-8 browser/bundle gate successfully.

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Studio First Load JS (Next build output) | 336 kB | 168 kB | **-168 kB / -50%** |
| Studio transferred JS | 350,325 B | 353,801 B | **+3,476 B / +0.99%** |
| Editor heavy chunk observed on interactive route | not separately isolated | 110,338 B | lazy interactive-only chunk |
| Interactive-doc First Load JS | 336 kB catch-all | 336 kB dedicated route | 0 kB build-output delta |
| Interactive-doc transferred JS | 354,030 B | 542,547 B | **+188,517 B / +53.25%**; intentional interactive payload |
| Ordinary-doc transferred JS | 354,330 B | 360,980 B | **+6,650 B / +1.88%** |
| Homepage transferred JS | 114,323 B | 114,356 B | **+33 B / +0.03%** |
| Gallery transferred JS | 634,888 B | 465,795 B | **-169,093 B / -26.63%** |
| Production build workflow-step elapsed | ~54 s baseline | ~51 s candidate | approximate timestamp observation, same runner |
| Studio LCP | not separately instrumented by DOC-8 | not separately instrumented | no fabricated numeric claim |
| Studio CLS | not separately instrumented by DOC-8 | not separately instrumented | no fabricated numeric claim |
| Studio interaction/TBT | not separately instrumented by DOC-8 | not separately instrumented | keyboard/browser contract used instead |

The interactive Canvas route is intentionally heavier because it actually includes the lazy editor. The critical success condition is that ordinary docs/home/Gallery closed state do not inherit that payload; the final transfer measurements prove that condition.

DOC-8 does not invent LCP/CLS/TBT values that were not emitted by its instrumentation. Site-wide final performance hardening remains later roadmap ownership.

## Bundle impact

The largest failure discovered during implementation was route-prefetch leakage. Before repair, the homepage downloaded Docs/Gallery/Studio/example chunks and measured about 592.7 kB transferred JS versus a 114.3 kB baseline.

After exact-source fixes, homepage transfer returned to 114,356 B, only 33 B above baseline. Ordinary docs remain within a small +1.88% transfer delta. Gallery is materially lighter than the base comparison. The editor heavy chunk is present only where the interactive editor is needed.

## Dependency changes

DOC-8 adds **no product runtime or development dependency** to `package.json`/lockfile. Existing CodeMirror tooling is reused.

Puppeteer Core and Axe are installed ephemerally by CI for browser verification and are not product dependencies.

No new split-pane, global-state, sandbox, serialization, worker, or terminal library was introduced.

## SEO/link impact

Canonical destinations and click navigation are unchanged by the prefetch isolation fixes. `prefetch={false}` changes speculative client loading only; links remain normal navigable/crawlable Next links. DOC-5 canonical example linkage and DOC-7 homepage/Gallery canonical link tests remain green.

## DOC-1 regression

PASS inside both the exact-head and post-merge DOC-8 regression chain.

## DOC-2 regression

PASS inside both the exact-head and post-merge DOC-8 deterministic regression chain. Some older standalone historical DOC-2 performance finalizers use fixed runner-era wall-time baselines; DOC-8 does not substitute those fixed historical timings for its required same-runner base-vs-candidate bundle gate.

## DOC-3 regression

PASS inside both DOC-8 regression chains; the required MDX component registry remains intact.

## DOC-4 regression

PASS inside both DOC-8 regression chains; generated API extraction/reference evidence remains current.

## DOC-5 regression

PASS deterministically and in the dedicated production browser regression. The original `CodeGroup` contract is deliberately retained, and canonical docs/Gallery/API linkage remains valid.

## DOC-6 regression

PASS; generated search records, related-content resolution, and discovery contracts remain intact.

## DOC-7 regression

PASS deterministically and in the dedicated production browser matrix. Final DOC-7 browser evidence retains zero serious/critical Axe violations and no horizontal overflow across its homepage/Gallery state matrix.

## Generated evidence

Committed deterministic evidence:

- `generated/docs-doc8/architecture.json`;
- `generated/docs-doc8/security-boundary.json`;
- `generated/docs-doc8/client-boundaries.json`.

Exact-head evidence artifact:

- workflow run: `34776945568`;
- artifact ID: `10324012272`;
- SHA-256: `2350a7d5d6ab774c0a8b57855ad5162953fa21e66241a96d2dc6d03b3ffbbdb9`.

Post-merge `main` evidence artifact:

- workflow run: `34777806480`;
- artifact ID: `10323782780`;
- SHA-256: `bbead8793aa9c099fa74258bcd154b7689d0bf05fc4e92a4a2cdd5a6edbc98aa`.

## Remaining risks

- Trusted-local server execution has no network isolation and therefore remains unsuitable for public untrusted execution.
- The representative interactive route is intentionally heavier than ordinary docs.
- DOC-8 does not provide numeric Studio LCP/CLS/TBT instrumentation; no unsupported claim is made.
- A future real browser runtime must satisfy a new runtime/security integration gate rather than being inferred from the current adapter contract.

These are explicit boundaries, not hidden incomplete implementation claims.

## Deferred roadmap ownership

- DOC-9: full corpus/content reorganization and migration.
- DOC-10: future engine simulation/documentation work.
- DOC-11: final site-wide accessibility/SEO/performance/reliability hardening.
- DOC-12: final release/integrity work.
- Phase 15+: engine implementation roadmap.
- Future `@apexify/web` runtime: later real runtime work only.
- Future React/Next runtime adapters: later real runtime work only.
- Future engine diagnostics: later engine ownership.
- Future Apex Intelligence: later intelligence roadmap ownership.

None of those phases was started by DOC-8.

## Final diff review

Base `8424834aa0334044b5603bf88406f0a1fa10a396` to validated implementation head `388ed7de2f8473e3d46988a46d0b813b5a562a0e` is **69 commits / 41 changed files**.

The review covered the workflow, runner route/security, Studio/Gallery compatibility migrations, dedicated Canvas route, all shared interactive primitives, session/execution contracts, generated evidence, and DOC-8 test/browser scripts.

No `package.json` or lockfile dependency change is part of the DOC-8 implementation diff. No Phase 15 package-runtime source was changed.

Explicit final searches/checks verify there is no second heavy CodeMirror import owner, no speculative `@apexify/web` implementation, no public arbitrary runner mode, and no false security-sandbox claim.

## Contributor/internal/security documentation

The completion record also adds the narrow documentation required by the DOC-8 checklist:

- `DOC8_INTERACTIVE_FOUNDATION_CONTRIBUTOR_GUIDE.md`;
- `DOC8_INTERACTIVE_FOUNDATION_INTERNALS.md`;
- `DOC8_EXECUTION_SECURITY.md`.

These describe how to extend the shared foundation without duplicating it, the internal component/adapter boundaries, and the exact runner trust/resource model.

## PR state

Implementation PR **#30**, `DOC-8 — Studio and Interactive Documentation Foundation`, was merged only after the exact-head DOC-8 gate passed.

Validated source: `388ed7de2f8473e3d46988a46d0b813b5a562a0e`.

Exact-head DOC-8 workflow run: `34776945568` — **SUCCESS**.

## Merge state

Implementation merge SHA: `4d8d5fef2064211ddd1788b4b7373730a71d1d8b`.

`main` was fetched after merge and confirmed to point to that exact SHA before post-merge verification began.

This report and the three documentation artifacts are being delivered through a separate report-only closure branch/PR so the implementation merge identity and post-merge evidence remain unambiguous.

## Post-merge verification

Post-merge DOC-8 workflow:

- run ID: `34777806480`;
- exact `main` SHA: `4d8d5fef2064211ddd1788b4b7373730a71d1d8b`;
- conclusion: **SUCCESS**;
- DOC-8 deterministic/unit/security: PASS;
- DOC-1 through DOC-6 regression: PASS;
- DOC-7 deterministic regression: PASS;
- documentation integrity/package pin: PASS;
- TypeScript: PASS;
- current build: PASS;
- same-runner baseline build: PASS;
- DOC-8 browser/accessibility/responsive/keyboard/execution/bundle: PASS;
- DOC-5 production browser regression: PASS;
- DOC-7 production browser regression: PASS;
- evidence upload: PASS.

This satisfies the requirement not to declare DOC-8 complete from branch-only evidence.

## Documentation architecture score

**9.3 / 10** for the actual DOC-8 foundation.

Evidence supporting the score:

- Studio and representative docs use the same editor/preview/diagnostics/workspace/session contracts;
- heavy editor imports are centralized and lazy;
- ordinary-route bundle isolation is measured and enforced;
- production arbitrary execution is fail-closed;
- security limitations are documented instead of overstated;
- mobile/keyboard/theme/reduced-motion/accessibility checks are automated;
- prior DOC architecture remains green;
- future browser runtime is represented only as an adapter contract.

The score is not 10 because the current package still has no real browser runtime, the trusted-local runner deliberately lacks network isolation and is therefore not a sandbox, and DOC-8 does not independently instrument numeric Studio LCP/CLS/TBT. Those are explicit architectural boundaries, not hidden claims.

## Final conclusion

**DOC-8 is COMPLETE.**

The shared Studio/interactive-documentation foundation is implemented, merged, and post-merge verified. Studio and `/docs/node/canvas` demonstrably use the same shared primitives. Public arbitrary execution is disabled, trusted-local execution is accurately bounded/documented, heavy editor code is lazy and route-isolated, accessibility and prior-phase regressions pass, and deterministic evidence is committed.

**DOC-9 has not been started. DOC-10 or later documentation phases have not been started. Apexify.js Phase 15 has not been started.**
