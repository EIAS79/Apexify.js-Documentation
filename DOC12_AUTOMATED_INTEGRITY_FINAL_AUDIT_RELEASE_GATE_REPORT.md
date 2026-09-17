# DOC-12 Automated Integrity, Final Audit and Release Gate Report

## Status

**COMPLETE WITH EXTERNAL VERIFICATION PENDING**

DOC-12 source-controlled implementation, final audits, permanent release gate, PR merge, and post-merge `main` certification are complete. PR #38 was merged and the authoritative DOC-12 workflow passed on the resulting `main` merge commit.

The only remaining items are explicitly external verification boundaries that CI cannot manufacture:

- real-user field INP;
- operational repository configuration requiring the DOC-12 check through branch protection/rulesets.

No source-controlled failure is converted into a pass by those external items. No Phase 15 work is included or started.

The permanent authoritative command is:

```bash
npm run docs:verify:release
```

## Final merged certification

PR #38 — `DOC-12: final documentation integrity and release gate` — was merged after the final PR head was green.

The first post-merge authoritative certification completed on:

- merged `main` SHA: `d4c7389ddaf1e288ddf6c05d49d7b660c974fd7c`
- DOC-12 workflow run: `35193106305`
- workflow: **DOC-12 Final Documentation Release Gate**
- result: **SUCCESS**
- evidence artifact: `docs-doc12-final-release-evidence`
- artifact ID: `10485645774`
- artifact digest: `sha256:b375205b57a64427eac17aa0c08a8aa5061b3f14a670ba9976cfadc539795613`
- evidence `sourceSha`: `d4c7389ddaf1e288ddf6c05d49d7b660c974fd7c`
- release decision: **PASS**
- quality scorecard: **9.74 / PASS**
- DOC-12 audit warnings: **0**
- release-decision failures: **0**

All 12 GitHub Actions workflows triggered for that merged SHA completed successfully, including the runtime build gate and DOC-1 through DOC-12 workflows. Vercel also completed successfully for the merged SHA.

This report revision is itself source-controlled. Because changing the report creates a later `main` commit, the permanent DOC-12 workflow must also remain green on that final report commit. The final certified `main` SHA is recorded at closure after that CI run; no further source change is required merely to self-reference the commit hash.

## Package identity and public-surface lock

The release gate builds and packs the current Apexify.js `main` candidate and verifies its public surface instead of assuming that the older documentation package pin remains representative.

| Item | Certified value |
| --- | --- |
| Package | `apexify.js@6.0.0` |
| Package `main` commit | `2b64087a04411982067cc624031b3de6f663c530` |
| Packed artifact | `apexify.js-6.0.0.tgz` |
| Artifact SHA-256 | `57cde5f660cdb059859185dfd7ffbf7afd63160884031cb8597f8924c4245086` |
| Export identity | **PASS** |
| Reachable declaration identity | **PASS** |
| Reachable declaration SHA-256 | `6ed6b9c695e4ac3c6809407acee433f1d0dcf27d481ff445de18df21e5e12590` |
| Reachable declaration files | `170` |
| Authoritative candidate examples | `4/4 PASS` |

The candidate verifier typechecks, compiles, executes, and output-verifies the authoritative examples against the freshly packed candidate.

## Final integrity matrix

| Area | Result | Final evidence |
| --- | --- | --- |
| Clean install/toolchain | **PASS** | deterministic `npm ci`, Node 24, pinned npm |
| TypeScript | **PASS** | pre-browser typecheck and authoritative release wrapper |
| Production build | **PASS** | production build completed |
| DOC-1 through DOC-10 prerequisites | **PASS** | regenerated and verified in the authoritative run |
| Information architecture | **PASS** | no required unresolved architecture gap |
| Active legacy-only features | **PASS** | `legacyOnlyCount = 0` |
| API exports | **PASS** | `217/217`; missing `0`; stale `0` |
| API members | **PASS** | `93` public members represented |
| Options | **PASS** | `17,233/17,233`; missing `0`; stale `0` |
| Signatures/types/source links | **PASS** | signature mismatches `0`; unresolved public types `0`; source-link coverage `1.0` |
| Examples | **PASS** | `4/4`; failed/stale/unverified `0` |
| Candidate example execution | **PASS** | `4/4` typechecked, compiled, executed, output-verified |
| Search/discovery | **PASS** | generated search and related-content verification passed |
| Future readiness | **PASS** | future-phase contract passed; public behavior must update docs in the same implementation phase |
| Client-JS boundary | **PASS** | server-first docs contract preserved |
| Duplication | **PASS** | exact normalized component duplicate groups `0` |
| Dependencies/dead code | **PASS** | no release-blocking finding |
| Source control | **PASS** | accidental tracked generated/temp files `0` |
| Privacy/secrets | **PASS** | no release-blocking secret finding |
| Internal links/headings | **PASS** | required integrity gates passed |
| External links | **PASS** | `14` inventoried; hard failures `0`; transient `0` |
| Accessibility/mobile/reliability | **PASS** | DOC-11 browser/accessibility/mobile/reliability rerun passed |
| Lighthouse | **PASS** | DOC-11 matrix + repeated DOC-12 standard-doc gate passed |
| Evidence integrity | **PASS** | schema-versioned, SHA-bound, checksummed evidence index |
| Final release verifier | **PASS** | authoritative DOC-12 release verification succeeded |

## Post-merge Lighthouse certification

The DOC-12 gate reran `/docs/getting-started` three times for mobile and desktop without weakening the inherited DOC-11 thresholds.

### Mobile

- performance samples: `0.99`, `0.98`, `0.98`
- performance median: **0.98**
- accessibility median: **1.00**
- best-practices median: **1.00**
- SEO median: **1.00**
- LCP samples: `1962.79 ms`, `2356.50 ms`, `2338.26 ms`
- LCP median: **2338.26 ms** (`< 2500 ms`)
- CLS median: **0** (`< 0.1`)

### Desktop

- performance median: **1.00**
- accessibility median: **1.00**
- best-practices median: **1.00**
- SEO median: **1.00**
- LCP samples: `523.72 ms`, `564.61 ms`, `529.90 ms`
- LCP median: **529.90 ms** (`< 2500 ms`)
- CLS median: **0** (`< 0.1`)

The hard `<2500 ms` LCP requirement was never weakened. Lighthouse TBT remains a lab diagnostic and is not relabeled as field INP.

## Real failure and correction history

DOC-12 did not pass on the first implementation attempts. The failures and corrections are retained here rather than erased from the certification history.

### 1. Explicit `.ts` imports broke TypeScript verification

`doc12-package-candidate-verify.ts` originally used explicit `.ts` extensions and triggered TS5097 under the documentation TypeScript configuration.

**Correction:** local imports were converted to extensionless module specifiers. Compiler policy was not weakened.

### 2. Nested package checkout contaminated documentation typechecking

The package candidate checkout under `_doc12-package-main` was initially traversed by documentation `tsc --noEmit`.

**Correction:** `_doc12-package-main` was excluded from the documentation TypeScript project while remaining independently built, packed, and verified by DOC-12.

### 3. Full declaration-tree digest produced a false public-surface drift failure

The initial package comparison hashed every emitted declaration file, including declarations not reachable from the package's exported type entrypoints.

**Correction:** declaration identity was changed to the declarations reachable from exported type entrypoints. The candidate and documented public declaration surfaces then matched. This narrows the check to the actual public contract rather than accepting drift.

### 4. Mobile Lighthouse exposed the real LCP boundary

Multiple independent mobile `/docs/getting-started` runs landed around `2.63–2.66 s`, above the unchanged `<2500 ms` gate. A later repeated median also reached approximately `2510.98 ms`.

**Correction:** the render path was optimized rather than weakening the threshold. Work included moving the primary article earlier in DOM order, removing duplicate initial mobile navigation serialization through a dedicated mobile drawer, and consolidating the documentation CSS dependency graph. Post-merge median LCP is **2338.26 ms**.

### 5. DOC-2 source contracts needed adjustment after the mobile navigation refactor

The mobile drawer moved from `DocsShell.tsx` into `MobileDocsNavigationDrawer.tsx`, while the DOC-2 source contract still searched only `DocsShell.tsx` for the drawer search identifier.

**Correction:** the DOC-2 verification was updated to validate the shell and the dedicated mobile drawer at their new ownership boundaries. The full DOC-2 gate then passed.

### 6. Legacy `/docs` violated the server-first client-route audit

The old `/docs` compatibility page remained a large client page even after the modern routed documentation architecture existed.

**Correction:** `/docs` became a minimal server-rendered compatibility entry and legacy fragment migration remained isolated in `LegacyDocsRedirectIsland`.

### 7. Final authoritative release verification initially failed after otherwise-green browser stages

The final verifier exposed remaining contract failures after upstream browser stages had passed.

**Correction:** the exact assertions were fixed and the entire release workflow was rerun cleanly rather than bypassing the authoritative verifier.

### 8. Fresh final-head CI exposed a real WCAG 2.2 target-size defect

DOC-5 and DOC-8 both reproduced an axe `target-size` failure for the example-detail `Gallery` breadcrumb. Initial styling corrected desktop geometry but mobile remained partially obscured because the `/examples` route lacked the documentation header/shell prerequisites assumed by the sticky mobile controls.

**Correction:** `app/examples/layout.tsx` now owns the same documentation shell prerequisites as the API-reference surface, including the real `DocsHeader`. The axe WCAG 2.2 rule, threshold, and browser states were not disabled or filtered. Fresh final-head CI passed DOC-5, DOC-8, DOC-11, DOC-12, runtime build, and the remaining documentation workflows before PR #38 was merged.

## External verification boundary

### Real-user field INP

State: **EXTERNAL_VERIFICATION_PENDING**

Reason: lab Lighthouse cannot fabricate real-user field INP. TBT is retained only as a lab diagnostic.

### Required-check branch protection/ruleset

State: **EXTERNAL_VERIFICATION_PENDING**

Reason: the repository contains the permanent DOC-12 workflow and source contract, but whether repository administration requires that check is an operational setting outside the source-controlled evidence contract unless separately verified with sufficient repository-administration visibility.

These external items are why the allowed final status is **COMPLETE WITH EXTERNAL VERIFICATION PENDING**, rather than plain `COMPLETE`.

## Permanent future-phase contract

DOC-12 establishes the permanent rule:

> Any later Apexify phase that changes public behavior must update and verify documentation in the same implementation phase.

Future phases must reuse the documentation architecture rather than creating duplicate API, search, example, or Studio systems. Future fixtures remain test-only until backed by implemented public behavior.

## Closure

- implementation: **complete**
- deterministic evidence generation: **complete**
- authoritative release command: **complete and passing**
- PR #38: **merged**
- post-merge `main` certification: **passed**
- source-controlled blockers: **none**
- external verification items: **field INP and branch/ruleset requirement only**
- Phase 15: **not started**

Final allowed DOC-12 status: **COMPLETE WITH EXTERNAL VERIFICATION PENDING**.
