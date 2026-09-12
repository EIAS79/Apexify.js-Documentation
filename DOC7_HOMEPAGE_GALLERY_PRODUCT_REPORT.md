# DOC-7 — Homepage, Gallery and Product Experience Upgrade Completion Report

## Phase

DOC-7 — Homepage, Gallery and Product Experience Upgrade

## Status

**COMPLETE**

DOC-7 is implemented, validated, and merged on `main`. This report records the implementation evidence before the report-only closure merge.

- DOC-7 starting documentation SHA: `46b7eb1712fcb1456c23eca9b2077d6f4e51f25d`
- Final validated implementation source SHA: `92838e5b2e882747303bb37fd42dfdbfacff91a5`
- Implementation PR: #28 — `DOC-7 — Homepage, Gallery and Product Experience Upgrade`
- Implementation merge commit: `1e013019a3768f10d1fd9bfc6de5d7879d5e63e7`
- Green exact-head DOC-7 validation: workflow run ID `34700066276`
- Green exact-head DOC-1 browser regression validation: workflow run ID `34700066299`
- DOC-7 evidence artifact ID: `10299977425`
- DOC-7 evidence artifact SHA-256: `3bb1bc0cbbad62eb270a942157fa3eef11fd21de7cc70a5085d91c3bf1ec2b4f`
- Apexify.js package source pin: `dbed9743353593eafae9a7b1c25312d7170a233b`
- Apexify.js package version: `6.0.0`
- Phase 14-P frozen SHA: `5d9b71f185140d6c3477286b8fb111f293e52b48`
- Apexify.js package-runtime changes made by DOC-7: **NONE**
- DOC-8 started: **NO**
- Phase 15 started: **NO**

The DOC-7 completion gate is satisfied. The public homepage and Gallery now present current package truth, verified executable evidence, explicit roadmap boundaries, provenance-aware Gallery behavior, responsive/theme-safe interactions, and a production browser accessibility contract without weakening the established verification thresholds.

## Product truth and homepage outcome

DOC-7 replaced the previous fully client-heavy homepage with a server-first product surface driven by existing authoritative documentation artifacts.

The completed homepage:

- derives package version, commit and installation evidence from the current generated package/documentation truth;
- presents **9 CURRENT capabilities** backed by the current package/API evidence;
- presents **7 ROADMAP capabilities** explicitly as roadmap work rather than current functionality;
- resolves current capability links against the DOC-4 `ApexPainter` API manifest;
- sources code/output proof from DOC-5 verified executable examples instead of copied marketing snippets;
- exposes **4 verified Gallery/example proofs** from repository-controlled DOC-5 evidence;
- removes stale package-version marketing copy;
- removes unverified numerical benchmark/performance claims from public DOC-7 copy;
- preserves canonical package/source/install linkage;
- provides an accessible install-command copy interaction;
- preserves responsive, theme and reduced-motion behavior.

The final DOC-7 truth verifier reports:

- package: `apexify.js@6.0.0`;
- current capabilities: **9**;
- roadmap capabilities: **7**;
- verified Gallery examples: **4**;
- validated public claims: **18**;
- result: **PASS**.

## Gallery product outcome

DOC-7 upgrades the Gallery from a visually curated page into a product surface with explicit evidence provenance.

The completed Gallery:

- removes stale `v5.4.5` package copy;
- distinguishes **DOC-5 verified executable examples** from **legacy curated Gallery** content;
- adds evidence/provenance filtering;
- adds runtime filtering;
- preserves feature/category filtering;
- supports combined filtering with a real empty state and reset path;
- exposes verified-example provenance visibly;
- retains canonical links from verified Gallery items to their DOC-5 example pages;
- indexes title, stable ID, provenance and DOC-5 feature metadata for Gallery search;
- preserves stable item IDs and hash/modal navigation;
- keeps Studio described as an authoring surface rather than falsely treating every legacy Gallery card as execution proof;
- provides accessible filter, search and sort controls across narrow/mobile layouts.

The DOC-7 Gallery tests pass all four core data/behavior contracts:

1. stable IDs are unique and verified items retain canonical DOC-5 provenance;
2. runtime/evidence filters are real data filters and reset correctly;
3. combined feature/evidence filtering has a real empty state and recovery path;
4. Gallery search indexes the required product/provenance metadata.

## Search compatibility repairs required by DOC-7 regression verification

DOC-7's inherited regression workflows exposed two search-contract regressions that had to be corrected before closure.

The final implementation:

- restores the compatibility `href` field in `/api/docs/search` responses as an alias of the canonical search href, preserving the DOC-4 browser contract while retaining the DOC-6 schema;
- guarantees that a direct canonical documentation-title match remains visible in the bounded global result set, so a query such as `canvas` still exposes `/docs/node/canvas` after DOC-6 expanded the index to thousands of API/heading records;
- preserves the highest-ranked result rather than replacing server relevance ordering;
- does not weaken runtime/package/content filters;
- classifies only same-origin `/api/docs/search` requests cancelled with exact `net::ERR_ABORTED` as expected AbortController cancellations in the DOC-1 browser verifier;
- keeps every other request failure, HTTP failure, console error and page error fatal.

The repaired DOC-1 standalone workflow then completed **SUCCESS** on exact implementation SHA `92838e5b2e882747303bb37fd42dfdbfacff91a5`, including its production build and desktop/mobile browser search/navigation smoke.

DOC-4's nested-option browser search contract also passed after the compatibility repair, including canonical deep-link navigation. DOC-2's browser/responsive interaction checks remained passing. Their older standalone historical performance finalizers use fixed prior-phase baselines and are not substituted for DOC-7's required same-runner base-vs-final measurement.

## Browser, responsive, theme and accessibility evidence

The exact-head DOC-7 browser suite is **PASS**.

It audits both `/` and `/gallery` in six states:

1. desktop light;
2. desktop system theme;
3. tablet dark;
4. mobile light;
5. narrow dark;
6. reduced-motion system theme.

That is **12 production route/state audits** in the final run.

Every final route audit reports:

- HTTP status: **200**;
- Axe violations: **0**;
- serious/critical Axe violations: **0**;
- horizontal overflow: **false**.

The browser suite also verifies:

- homepage canonical metadata;
- homepage and Gallery skip links/main landmarks;
- current and roadmap product status presentation;
- complete current-capability/API linkage;
- verified-example strip completeness;
- install command copy behavior;
- absence of stale `v5.4.5` copy;
- Gallery provenance explanation;
- Gallery runtime/evidence controls;
- Gallery search trigger/dialog;
- keyboard activation of runtime/evidence filters;
- search dialog open/close behavior;
- canonical DOC-5 example linkage from Gallery modal state;
- theme behavior;
- reduced-motion behavior;
- full-page screenshots for all 12 route/state combinations.

Keyboard evidence reports:

- install copy: **PASS**;
- combined runtime/evidence filtering: **PASS**;
- Gallery search dialog: **PASS**;
- canonical example linkage: **PASS**.

No Axe rule was disabled and no serious/critical threshold was relaxed.

## Accessibility defects discovered and fixed

The strict browser matrix found real product defects during DOC-7 implementation. They were fixed at their actual foreground/background or control semantics rather than hidden by changing the gate.

The discovered defects included:

- light-theme Gallery microcopy using `--text-muted` below AA contrast;
- amber and success Gallery badges using white text below AA contrast;
- light-theme magenta micro-labels below AA contrast;
- dark/system homepage tertiary text below AA contrast on elevated cards;
- dark ROADMAP iris foreground below AA contrast;
- a dark Gallery iris category badge with white text below AA contrast;
- a mobile Gallery sort button whose visible text was hidden at the narrow breakpoint and therefore lacked an accessible name;
- a mobile light Gallery count chip measuring below AA contrast.

The final implementation applies scoped DOC-7 accessibility foregrounds and explicit control naming. Decorative brand gradients are retained where they remain non-semantic or contrast-safe. Global design-system thresholds were not weakened.

## Performance and production-build evidence

DOC-7 uses a same-runner baseline comparison against the DOC-7 starting SHA `46b7eb1712fcb1456c23eca9b2077d6f4e51f25d`. Both baseline and final production builds ran on the same CI worker in the successful validation run.

### Final build measurements

| Metric | Baseline | Final | Delta |
| --- | ---: | ---: | ---: |
| Build wall time | 36,164.080 ms | 35,206.044 ms | **-2.65%** |
| Homepage first-load JS | 557,749 B | 361,151 B | **-35.25%** |
| Gallery first-load JS | 1,966,605 B | 1,973,412 B | **+0.35%** |
| CSS | 98,874 B | 97,252 B | **-1.64%** |
| Public image bytes | 19,409,359 B | 19,409,359 B | 0% |
| Public media bytes | 4,752,661 B | 4,752,661 B | 0% |

The browser performance comparison reports these additional deltas:

- homepage JS transfer: **-1.57%**;
- Gallery JS transfer: **-1.96%**;
- homepage LCP: **-80.99%**;
- Gallery LCP: **-14.14%**;
- homepage CLS delta: **0**;
- Gallery CLS delta: **0**;
- Gallery interaction proxy: **+4.70%**;
- homepage request count: **-11.90%**;
- Gallery request count: **-6.52%**.

The enforced targets remained:

- LCP: **<= 2,500 ms**;
- CLS: **<= 0.1**;
- interaction proxy: **<= 200 ms**.

Performance failures: **0**.

No DOC-7 performance threshold was loosened to obtain a pass.

## Regression evidence

The successful exact-head DOC-7 workflow reran and passed:

- DOC-7 truth, claim, architecture and Gallery-data verification;
- DOC-1 through DOC-6 deterministic regression verification;
- existing documentation integrity;
- TypeScript typecheck;
- clean current production build;
- clean DOC-7 baseline production build on the same runner;
- production browser/axe/responsive/theme/reduced-motion/keyboard verification;
- base-vs-final performance comparison;
- evidence upload.

The inherited deterministic chain reports:

- DOC-6: **19,071** generated search records, PASS;
- DOC-5: **4** verified packed-package examples, PASS;
- DOC-4: **217 exports**, **93 members**, **17,233 option paths**, **483 representative option paths**, PASS;
- DOC-3: **24 required components** implemented/routed, PASS;
- DOC-2: **14 evidence files**, **3 routed navigation items**, PASS;
- DOC-1: **3 routed pages**, **145 legacy fallbacks**, PASS.

Existing documentation integrity also passed:

- **154** active documentation/site files scanned;
- **148** MDX files and **155** documentation anchors checked;
- Phase 13 documentation verification: **11 API-reference pages**, **148 MDX pages**, **9 user-facing TSX pages**;
- package identity/pin verification: PASS for `dbed9743353593eafae9a7b1c25312d7170a233b`.

## Implementation problems discovered during DOC-7

DOC-7 exposed several real weaknesses while being completed:

1. The Gallery still presented stale package-version copy and mixed verified and legacy examples without a provenance contract.
2. The old homepage architecture carried unnecessary client-side weight and mixed product marketing with evidence boundaries.
3. Several display-gradient and accent foreground/background pairs failed strict WCAG contrast checks in light and dark themes.
4. Mobile Gallery sort controls lost their accessible name when the visual label was hidden by the breakpoint.
5. Expanded DOC-6 search ranking could push the canonical Canvas documentation page outside the first bounded result set for a direct `canvas` query.
6. The DOC-4 browser contract still consumed a compatibility `href` field that the newer DOC-6 endpoint no longer emitted.
7. The DOC-1 browser verifier treated expected AbortController cancellation of superseded search requests as network failure.
8. Earlier visual guesses about contrast locations were insufficient; exact Axe target/HTML/failure diagnostics were needed to identify the true nodes deterministically.
9. Older DOC-2/DOC-4 standalone performance finalizers still compare against fixed historical runner measurements, so DOC-7 required a same-runner baseline methodology to distinguish current product regressions from CI timing/bundle-baseline drift.

## How the problems were fixed

- Rebuilt the homepage as a server-first evidence-driven product surface.
- Removed obsolete homepage client stack and stale public copy.
- Bound CURRENT product claims to generated DOC-4/DOC-5/package evidence and labelled future work ROADMAP.
- Added verified/legacy provenance and runtime/evidence filtering to Gallery.
- Added a permanent DOC-7 browser/axe harness with exact failing target diagnostics.
- Fixed each measured contrast pair with scoped semantic foregrounds rather than weakening Axe rules.
- Added an explicit accessible name to the narrow/mobile sort control.
- Raised the mobile count foreground to an AA-safe semantic token.
- Restored the search endpoint `href` compatibility alias while retaining canonicalHref.
- Guaranteed bounded search keeps a direct canonical documentation-title match visible.
- Updated DOC-1 browser verification to ignore only intentional same-origin aborted search requests while keeping all genuine network failures fatal.
- Measured DOC-7 base and final builds on the same runner and preserved all declared performance targets.

No correctness, claim-truth, accessibility, browser, regression or DOC-7 performance threshold was loosened to force closure.

## Dependencies and runtime boundaries

DOC-7 makes no Apexify.js package-runtime change.

Puppeteer Core and Axe are installed ephemerally inside CI browser-audit work and are not introduced as product runtime dependencies.

DOC-7 does not make speculative future packages current. Browser, React, Next, retained realtime, engine-native animation, vector and intelligence work remain labelled as roadmap unless backed by current package evidence.

## Not completed by DOC-7

The following work is intentionally outside DOC-7 and remains untouched:

- DOC-8 and all later documentation pre-phase tasks;
- DOC-9 migration work;
- DOC-10 future simulation;
- DOC-11 / DOC-12 work;
- Phase 15 and all later Apexify.js engine roadmap work;
- speculative package-runtime implementation for future browser/realtime/AI/vector capabilities.

## Why the boundary remains strict

DOC-7 owns the homepage, Gallery and public product-experience upgrade on top of the already completed documentation architecture. DOC-8 and later documentation work remain separate phases, while Phase 15 begins later engine work.

Keeping those boundaries separate ensures the DOC-7 green gate proves only what was actually implemented and prevents public product claims from depending on unfinished future engine work.

## Final verification record

Exact-head implementation validation:

- workflow: `DOC-7 Homepage Gallery Product`;
- run ID: `34700066276`;
- validated source SHA: `92838e5b2e882747303bb37fd42dfdbfacff91a5`;
- merge-ref validated by the run: `af16aa5104327e7064bceb53aa0ffe7af34be723`;
- result: **PASS**;
- browser/axe: **PASS**;
- same-runner performance: **PASS**;
- inherited DOC-1 through DOC-6 deterministic regression: **PASS**;
- evidence artifact ID: `10299977425`.

Additional inherited browser verification:

- DOC-1 run ID: `34700066299`;
- result: **PASS** including production build and desktop/mobile browser smoke.

Implementation merge:

- PR: **#28**;
- merge commit: `1e013019a3768f10d1fd9bfc6de5d7879d5e63e7`;
- merge tree contains validated source SHA `92838e5b2e882747303bb37fd42dfdbfacff91a5` as its implementation parent;
- `main` was verified at the implementation merge commit after merge.

No push-triggered workflow attached to the implementation merge SHA; therefore the exact-head green run plus the verified merge tree are the authoritative implementation verification record.

## Final boundary statement

DOC-7 is complete. The homepage/Gallery/product-experience work is implemented and merged, all DOC-7 gates pass on the exact source SHA, the implementation merge is present on `main`, and the completion record contains the measured evidence.

**DOC-8 has not been started. Phase 15 has not been started.**
