# DOC-4 — API Reference and Option Documentation Engine Completion Report

## Phase

DOC-4 — API Reference and Option Documentation Engine

## Status

**COMPLETE**

DOC-4 is implemented, merged, and post-merge verified on `main`.

- Implementation PR: #23 — `DOC-4: build exhaustive generated API reference engine`
- Exact validated implementation head: `2f42fc4fd447942240d1812582fc7712a2561dfa`
- Implementation merge commit: `9a6911fba5594e771437be1154646d196482c686`
- Apexify.js package source pin: `dbed9743353593eafae9a7b1c25312d7170a233b`
- Apexify.js package version: `6.0.0`
- Apexify.js package-runtime changes made by DOC-4: **NONE**
- DOC-5 started: **NO**
- Phase 15 started: **NO**

## Work completed

DOC-4 now provides a generated, verified API-reference architecture rather than a manually maintained API-page layer.

The documentation site consumes the pinned packed `apexify.js@6.0.0` consumer artifact, inspects its package/export surface and shipped TypeScript declarations, recursively extracts the public API/type/option graph, combines declaration-derived facts with explicitly validated semantic metadata, and emits normalized API-reference data used by routing, rendering, search, deep links, source links, and coverage verification.

The completed implementation includes:

- packed-artifact verification before extraction;
- export-map and shipped declaration analysis through the TypeScript compiler API;
- deterministic API manifest generation;
- stable symbol, member, overload, option, error, limit, type, and search identities;
- recursive nested option extraction with stable deep-link fragments;
- generated source links pinned to the exact Apexify.js package commit;
- server-first canonical API routes under `/api-reference`;
- symbol and member pages under `/api-reference/[package]/[...symbol]`;
- API signatures and overload navigation;
- parameter, return-value, nested-type, option, error, limit, source, example, and related-API presentation;
- API symbol/member/option integration into documentation search;
- preservation of the prior canonical documentation-title search contract;
- legacy `/docs/api` migration to the canonical API-reference surface;
- deterministic compact evidence committed to Git;
- large runtime manifest regeneration from the pinned package during clean installation rather than versioning the runtime manifest in Git;
- DOC-4-specific static, browser, accessibility, responsive, keyboard, deep-link, performance, bundle, and regression gates;
- inherited DOC-1, DOC-2, and DOC-3 verification inside the DOC-4 gate;
- clean production builds across the supported Node 22, 24, and 26 runtime matrix.

Final generated coverage on merged `main`:

- public exports: **217 / 217 documented**;
- public members: **93 / 93 documented**;
- recursive option paths: **17,233 / 17,233 documented**;
- representative `ApexPainter#createImage` option paths: **483**;
- signatures verified: **41**;
- resolved API types: **239**;
- documented representative errors: **3**;
- documented representative limits: **6**;
- missing exports: **0**;
- stale exports: **0**;
- missing option paths: **0**;
- stale option paths: **0**;
- signature mismatches: **0**;
- unresolved public types: **0**;
- runtime metadata coverage: **100%**;
- source-link coverage: **100%**;
- example-link coverage: **100%**.

## Problems discovered

DOC-4 exposed several real implementation, verification, lifecycle, and regression problems before closure:

1. Early verification contained assertions that described an assumed data shape rather than the actual normalized API contract.
2. The nested-option browser test incorrectly assumed a relevance filter must produce exactly one row, even though path/type/description matching can legitimately produce multiple relevant rows.
3. The signature-copy test assumed a TypeScript call signature should contain the method name even though the canonical signature payload intentionally stores the call signature itself.
4. Headless system clipboard behavior could hang rather than deterministically confirm the exact copied string.
5. Local `next start` emitted a 404 for the Vercel Speed Insights endpoint even though that endpoint exists only in the Vercel deployment environment.
6. Repeated browser navigation could return HTTP 304 from browser cache, making a fresh-route `200` assertion nondeterministic.
7. The generated runtime API manifest reached approximately **113.35 MB**, too large to treat as a normal Git-versioned generated artifact.
8. Generating that runtime manifest inside the timed production build double-counted extraction cost and distorted the build-regression budget.
9. Integrating thousands of API search records ahead of documentation-title matches caused the inherited DOC-1 `canvas` search result to be crowded out of the 30-result cap.
10. The DOC-4 push workflow can update deterministic compact evidence after a successful run, which means the evidence-complete branch tree can differ from the developer-authored tree that initially triggered pull-request checks.

## What went wrong

The dominant failure mode was not the public API extraction itself; it was verification and lifecycle assumptions around a much larger generated surface than the prior documentation architecture had handled.

Several tests were initially too specific about representation instead of contract behavior. Browser automation also inherited environment-specific behavior from headless Chrome and local `next start` that had to be isolated without weakening failure detection. The generated-data architecture initially treated a very large normalized runtime manifest as if it should be committed like compact evidence, which would have produced an unacceptable repository artifact. Finally, broad API-search integration altered ranking pressure enough to violate the already-established DOC-1 navigation/search contract.

The exact-tree issue was procedural but important: a green workflow that subsequently commits evidence does not prove the newly produced tree. DOC-4 therefore needed a separate human-authored validation head after evidence generation so the complete PR matrix ran against the exact tree proposed for merge.

## How fixed

- Replaced representation-specific verifier assumptions with assertions against the normalized DOC-4 contract.
- Changed nested-option filtering verification to require meaningful narrowing plus exact target inclusion instead of cardinality `=== 1`.
- Verified the exact canonical signature string rather than requiring the owner/member name to be embedded in a call signature.
- Added an explicit post-write copy acknowledgement and injected a deterministic Clipboard API test double before hydration in browser verification; the production handler still writes the exact canonical signature payload.
- Captured failed HTTP response URLs and permitted only known local-only misses (`/favicon.ico` and `/_vercel/speed-insights/script.js`); JavaScript, CSS, API, route, and other unexpected resource failures remain hard failures.
- Disabled browser cache per audit page so route-state checks validate fresh HTTP `200` responses instead of cache revalidation `304` responses.
- Kept the large runtime manifest out of Git and versioned compact deterministic coverage/identity/inventory/signature/source/type evidence instead.
- Moved runtime-data generation to clean installation and changed production build startup to an `ensure-generated` guard, preventing extraction from being counted twice inside the measured build.
- Restored documentation-title search precedence with ranking `filename -> api -> folder -> content`, keeping API results integrated while preserving the inherited canonical docs search contract.
- Documented the evidence lifecycle and forced a human-authored validation commit after the generated evidence commit, then required DOC-1, DOC-2, DOC-3, DOC-4, and the full Node runtime matrix to pass on that exact SHA before merge.

## Not completed

The following work is intentionally not part of DOC-4 and was not started:

- DOC-5 executable example platform;
- later documentation pre-phase work after DOC-4;
- Phase 15 engine work;
- changes to the Apexify.js package runtime itself.

## Why

The pre-Phase-15 documentation roadmap defines DOC-4 as the API-reference and option-documentation engine. Executable example infrastructure and subsequent documentation phases have separate contracts and completion gates. Mixing them into DOC-4 would destroy phase-boundary evidence and make regression attribution unreliable.

The Apexify.js package was also intentionally treated as an immutable, pinned consumer dependency for this phase. DOC-4 documents the package surface; it does not alter that surface.

## Alternatives

The following alternatives were considered or implicitly tested and rejected:

- **Hand-authored API pages:** rejected because they cannot prove completeness or remain mechanically synchronized with the shipped declarations.
- **Commit the ~113 MB runtime manifest:** rejected because it is repository-hostile, duplicates derivable data, and creates unnecessary review/storage churn.
- **Suppress every browser 404:** rejected because that would hide real missing chunks, styles, API endpoints, or routes.
- **Accept cached 304 responses as equivalent to fresh route validation:** rejected because it weakens the route-status contract and leaves browser-state behavior nondeterministic.
- **Remove API records from documentation search:** rejected because search integration is a required DOC-4 feature.
- **Rank all API results ahead of existing documentation titles:** rejected because it regressed DOC-1 canonical search behavior.
- **Regenerate the runtime manifest inside every measured build:** rejected because it double-counts extraction and conflates generation cost with Next.js build cost.
- **Trust a green pre-evidence SHA after a workflow-created evidence commit:** rejected because checks must apply to the exact tree that will be merged.
- **Loosen coverage/performance/accessibility thresholds to achieve green CI:** rejected; defects were fixed instead.

## Components added

DOC-4 added the reusable API-reference component surface, including:

- `ApiMethodHeader`;
- `ApiSignature`;
- `OptionTable`;
- `OptionCard`;
- `TypeReference`;
- `TypeExplorer`;
- `ReturnValue`;
- `ErrorReference`;
- `LimitReference`;
- `RelatedApiGrid`;
- `SourceLink`;
- `EnumValueList`;
- `OverloadTabs`;
- signature-copy controls and option-filter interaction primitives.

## Components enhanced

- `DocsSidebarSearch` was enhanced to consume API search records and display API matches while preserving canonical documentation-title priority.
- Documentation-shell integration was extended for API-reference routes and responsive behavior.
- `CustomCursorGate` was adjusted so the API-reference surface participates correctly in the existing custom-cursor policy without breaking reduced-motion or responsive behavior.

## Components removed

No established documentation component was removed as part of DOC-4.

## Routes added/migrated

Added or formalized:

- `/api-reference`;
- `/api-reference/[package]/[...symbol]`;
- concrete static API symbol routes generated from the manifest;
- concrete API member routes generated from the manifest;
- `/api/docs/search` integration for API symbols, members, nested options, types, and errors.

Migrated:

- `/docs/api` now resolves to the canonical API-reference architecture rather than representing a competing API-documentation identity.

Unknown API members return a verified `404`.

## Content migrated

DOC-4 migrated API-reference responsibility away from manually maintained page fragments into generated declaration-backed records and canonical API routes.

It also added authoring/maintenance documentation explaining:

- the packed package as source of truth;
- explicit semantic metadata rules;
- default-state policy;
- errors and limits metadata;
- runtime metadata;
- examples and related APIs;
- coverage-failure remediation;
- runtime-manifest versus compact-evidence lifecycle;
- exact-tree validation requirements.

Existing guides/examples remain linked rather than duplicated into the API manifest.

## Tests added

DOC-4 added deterministic extractor and negative-drift tests covering:

- classes;
- functions;
- interfaces;
- types;
- overloads;
- recursive nested options;
- stable option fragments;
- missing/stale export coverage failures;
- missing/stale option coverage failures;
- signature mismatch detection;
- related-API identity validation;
- collision-safe representative option fragments.

Browser verification covers five states:

- desktop light: 1440×1000;
- tablet dark: 900×1000;
- mobile light: 390×844;
- narrow dark: 320×760;
- desktop dark with reduced motion: 1440×1000.

The browser gate verifies rendering, required component presence, nested option search, deep-link fragments, Type Explorer keyboard disclosure, exact signature copying, source pinning, integrated API search, overload keyboard switching, unknown-member 404 behavior, horizontal overflow, reduced-motion policy, console/page/network failures, and axe accessibility results.

## Verification

### Exact implementation-head verification

The exact evidence-complete implementation head `2f42fc4fd447942240d1812582fc7712a2561dfa` passed every required pull-request workflow before merge:

- DOC-1 Information Architecture — run `34483116105` — **SUCCESS**;
- DOC-2 Design System and Shell — run `34483115833` — **SUCCESS**;
- DOC-3 MDX Component Library — run `34483115871` — **SUCCESS**;
- DOC-4 API Reference Engine — run `34483115826` — **SUCCESS**;
- Documentation Runtime Build Gate — run `34483115983` — **SUCCESS**, including Node 22, Node 24, and Node 26.

PR #23 was merged only with `expected_head_sha=2f42fc4fd447942240d1812582fc7712a2561dfa`.

### Post-merge `main` verification

Implementation merge `9a6911fba5594e771437be1154646d196482c686` then passed every relevant workflow triggered on `main`:

- DOC-2 Design System and Shell — run `34483559025` — **SUCCESS**;
- DOC-3 MDX Component Library — run `34483559229` — **SUCCESS**;
- DOC-4 API Reference Engine — run `34483559175` — **SUCCESS**;
- Documentation Runtime Build Gate — run `34483559301` — **SUCCESS**.

Runtime build run `34483559301` passed independently on **Node 22, Node 24, and Node 26**.

The merged DOC-4 run also passed:

- deterministic install;
- packed-artifact inspection;
- deterministic manifest generation;
- DOC-4 extraction/coverage/component verification;
- inherited DOC-1/DOC-2/DOC-3 verification;
- existing documentation integrity;
- TypeScript typecheck;
- clean production build and measurement;
- five-state browser/keyboard/responsive/theme/axe verification;
- quantitative DOC-4 finalizer;
- evidence artifact upload.

Post-merge evidence artifact:

- run: `34483559175`;
- artifact ID: `10154752005`;
- artifact ZIP SHA-256: `7b8e771d2a0cf1f1608a06f5c0327817f14044b12e39ab86d34c90059ae08398`;
- uploaded size: **4,993,720 bytes**.

## Accessibility impact

Accessibility is improved and explicitly regression-gated.

- Required API controls expose semantic labels and states.
- Type disclosure is keyboard operable.
- Overload tabs are keyboard switchable.
- Signature copy exposes a post-action state.
- Source links identify external navigation.
- Responsive layouts are verified at desktop, tablet, mobile, and 320 px narrow width.
- Horizontal overflow is forbidden by the browser gate.
- Reduced-motion behavior is verified explicitly.
- axe runs against WCAG 2.0 A/AA, WCAG 2.1 A/AA, and WCAG 2.2 AA tags across the tested states.
- Final merged browser run completed with zero blocking axe violations.

## Performance impact

Merged `main` DOC-4 finalizer, run `34483559175`:

- DOC-3 clean-build baseline: **36,359.386 ms**;
- DOC-4 clean production build: **41,767.966 ms**;
- build delta: **+14.88%**;
- allowed build-regression budget: **+35%**;
- extraction time: **6,567.417 ms**;
- extraction budget: **30,000 ms**;
- DOC-4 API route JS versus routed DOC-3 baseline: **-65.29%**.

The finalizer passed all performance gates.

## Bundle impact

Merged `main` final measurement:

- API index routed JS: **339,297 bytes**;
- representative complex API route JS: **347,458 bytes**;
- complex API route budget: **1,400,000 bytes**;
- signature client island: **36,665 bytes**;
- option-search client island: **36,665 bytes**;
- Type Explorer client island: **36,665 bytes**;
- per-island budget: **250,000 bytes**;
- API-specific CSS: **5,102 bytes**;
- runtime generated manifest: **113,351,826 bytes**;
- generated search data: **13,676,974 bytes**.

The large manifest/search data are server/build-time generated artifacts and are not committed as giant source-control blobs. Compact deterministic evidence is versioned instead.

The built route report showed approximately **103 kB First Load JS** for `/api-reference/[package]/[...symbol]` and **101 kB** for `/api-reference`.

## SEO/link impact

- Canonical API URLs are emitted under `/api-reference/apexify.js/...`.
- Legacy `/docs/api` no longer competes as a second canonical API identity.
- API metadata provides canonical URLs and appropriate indexing behavior by stability state.
- Source links are pinned to the exact Apexify.js commit rather than a moving branch.
- Related APIs and examples use validated identities/links.
- Nested option search results deep-link directly to stable option fragments.
- Unknown API member routes are verified as HTTP `404`.
- Existing documentation links and anchors continue to pass the inherited integrity scans.

## Dependency changes

The pinned production dependency remains:

- `apexify.js` at `dbed9743353593eafae9a7b1c25312d7170a233b`, version `6.0.0`.

DOC-4 did not modify the Apexify.js package repository or advance its package pin.

Browser/a11y audit tooling (`puppeteer-core` and `axe-core`) is installed ephemerally in CI rather than promoted to persistent application dependencies for the DOC-4 gate.

The existing locked documentation dependency graph emits npm audit warnings during CI; DOC-4 did not treat unrelated dependency-upgrade work as part of its API-reference phase. Those warnings remain a separate maintenance/security task and are not evidence of a DOC-4 functional coverage failure.

## Remaining risk

DOC-4 has no known completion-gate failure, but non-zero operational risk remains:

- The runtime manifest is large (~113 MB) and must be regenerated from the pinned declaration surface on clean installation. This is intentional but makes declaration/extractor efficiency important as the API grows.
- The generated search index is also substantial (~13.7 MB); later documentation-search work should monitor indexing/query strategy as the package surface expands.
- CI build wall time varies by runner. The authoritative merged run is inside budget at +14.88%, but the quantitative gate must remain enabled to catch future regressions.
- Local `next start` cannot serve Vercel Speed Insights. The browser verifier therefore permits only the exact local telemetry endpoint (and favicon) while preserving hard failure for unexpected resource errors.
- A future Apexify.js package pin or declaration change can alter exports, members, signatures, types, or option paths. DOC-4 intentionally fails deterministic coverage when that drift is not reflected in regenerated evidence/metadata.
- The existing documentation dependency graph has npm audit findings that require separate security maintenance.

None of these risks invalidate the DOC-4 completion gate; each is either explicitly regression-gated or outside the phase boundary.

## Documentation architecture score

**9.5 / 10**

DOC-4 establishes a strong generated source-of-truth boundary, exhaustive machine-checked public API/option coverage, stable canonical routes and deep links, reusable API-reference primitives, exact source pinning, integrated search, deterministic evidence, inherited regression protection, accessibility verification, and quantitative performance/bundle gates.

The score is not 10/10 because the current declaration-derived runtime manifest and search dataset are large enough to deserve future optimization, and the documentation dependency graph still has separate maintenance/security debt. Those issues do not block DOC-4, but they are concrete constraints that should remain visible rather than being hidden by a perfect score.
