# DOC-12 Automated Integrity, Final Audit and Release Gate Report

## Status

**DOC-12 pre-merge release gate: PASS**

At the time this report is committed, DOC-12 is **PARTIAL — BLOCKED** only by the required final closure sequence: fresh CI on the report commit, merge of PR #38, and post-merge verification on `main`. Branch-only success is not treated as DOC-12 completion.

The authoritative source-controlled release command is:

```bash
npm run docs:verify:release
```

No Phase 15 work is included in this report or in DOC-12.

## Authoritative certification evidence

The successful certification run immediately preceding this report was:

- Documentation PR: **#38 — `DOC-12: final documentation integrity and release gate`**
- PR branch: `doc12-final-release-gate`
- Branch head: `1209131b262b3e91a28b185bd6f6008e047f80fa`
- GitHub Actions PR merge test SHA: `cef3139b03faee0e235259a94e2c8b0192d7d614`
- Workflow: **DOC-12 Final Documentation Release Gate**
- Workflow run: `35115589972`
- Job: `104860067602`
- Job conclusion: **SUCCESS**
- Evidence artifact: `docs-doc12-final-release-evidence`
- Artifact ID: `10455339384`
- Artifact ZIP SHA-256: `60c8f92084ce7227f739234c84121738974353b3879e5fb82b14f8038dee80b5`
- DOC-12 evidence files verified: **40**
- DOC-12 audit warnings: **0**
- DOC-12 release decision: **PASS**
- Quality scorecard: **9.74 / PASS**

Every generated DOC-12 evidence item is schema-versioned, source-SHA-bound, and included in the deterministic evidence index/checksum contract.

## Package identity and public-surface lock

The release gate packed and verified the current Apexify.js `main` candidate rather than assuming that the documentation pin was still representative.

| Item | Certified value |
| --- | --- |
| Package | `apexify.js@6.0.0` |
| Current package `main` commit | `2b64087a04411982067cc624031b3de6f663c530` |
| Packed artifact | `apexify.js-6.0.0.tgz` |
| Current package artifact SHA-256 | `57cde5f660cdb059859185dfd7ffbf7afd63160884031cb8597f8924c4245086` |
| Documentation package commit | `dbed9743353593eafae9a7b1c25312d7170a233b` |
| Documented artifact SHA-256 | `d4520e1f79b9061b187513929678f737440123b3b8988e6e23b97db12f9a3118` |
| Phase 14-P frozen commit | `5d9b71f185140d6c3477286b8fb111f293e52b48` |
| Current-main public surface matches documented artifact | **true** |

The candidate verifier passed export and declaration identity checks and executed the authoritative examples from the freshly packed candidate. The release therefore does not silently repin documentation and does not accept unverified package drift.

## Final integrity matrix

| Area | Result | Evidence summary |
| --- | --- | --- |
| Install/toolchain | **PASS** | Clean `npm ci`, Node 24, pinned npm toolchain |
| TypeScript | **PASS** | `npm run typecheck` completed successfully before browser certification and again in the release wrapper |
| Production build | **PASS** | `npm run build`; 466 static pages generated |
| DOC-1 through DOC-10 prerequisites | **PASS** | Entire prerequisite chain regenerated and verified in the authoritative run |
| Information architecture/routes | **PASS** | 136 routed pages; no required unresolved architecture gap |
| Legacy-only active features | **PASS** | `active_feature_legacy_only_count = 0` |
| API exports | **PASS** | 217/217 public exports documented; missing exports `0`; stale exports `0` |
| API members | **PASS** | 93 public members represented |
| Options | **PASS** | 17,233/17,233 option paths documented; missing/stale option paths `0` |
| Signatures/types/source links | **PASS** | Signature mismatches `0`; unresolved public types `0`; source-link coverage `1.0` |
| Examples | **PASS** | 4/4 authoritative examples verified; failed/stale/unverified `0` |
| Candidate example execution | **PASS** | 4/4 typechecked, compiled, executed, and output-verified |
| Search/discovery | **PASS** | Generated search/related-content verification passed |
| Future readiness | **PASS** | Required unresolved future gaps `0`; fixture leaks `0` |
| Client-JS boundary | **PASS** | Ordinary docs clientified routes `0`; editor imports outside interactive boundary `0` |
| Duplication | **PASS** | Exact normalized component duplicate groups `0` |
| Dead-code review | **PASS** | Heuristic candidate inventory retained for review; no release-blocking dead-code finding |
| Dependencies | **PASS** | Dependency-use audit completed; no release-blocking dependency finding |
| Source control | **PASS** | Accidental tracked generated/temp files `0` |
| Privacy/secrets | **PASS** | Secret-pattern findings `0` |
| Internal links/headings | **PASS** | Required internal link and heading integrity checks passed |
| External links | **PASS** | 14 inventoried; 5 controlled live checks; 9 syntax-only; hard failures `0`; transient `0` |
| Accessibility/mobile/reliability | **PASS** | DOC-11 browser matrix and inherited evidence rerun successfully; final-head DOC-5 WCAG 2.2 target-size defect documented and corrected below before merge |
| Lighthouse | **PASS** | DOC-11 reference matrix plus repeated DOC-12 standard-doc gate passed |
| Evidence integrity | **PASS** | 40 final artifacts, current source SHA, checksummed index, release verifier PASS |
| Future-phase documentation contract | **PASS** | Public behavior changes must update and verify docs in the same implementation phase |

## Repeated standard-document Lighthouse certification

The DOC-12 gate ran `/docs/getting-started` three times for mobile and desktop and gates on the median without weakening the DOC-11 thresholds.

### Mobile

- Performance samples: `0.99`, `0.98`, `0.98`
- Performance median: **0.98**
- Accessibility median: **1.00**
- Best Practices median: **1.00**
- SEO median: **1.00**
- LCP samples: `2114.38 ms`, `2352.35 ms`, `2358.90 ms`
- LCP median: **2352.35 ms** (`< 2500 ms`)
- CLS median: **0** (`< 0.1`)

### Desktop

- Performance median: **1.00**
- Accessibility median: **1.00**
- Best Practices median: **1.00**
- SEO median: **1.00**
- LCP samples: `538.28 ms`, `563.60 ms`, `527.68 ms`
- LCP median: **538.28 ms** (`< 2500 ms`)
- CLS median: **0** (`< 0.1`)

The DOC-11 reference Lighthouse matrix also passed. Non-standard representative surfaces remain evidence, not a substitution for the standard-doc hard gate.

## Real failure and correction history

DOC-12 did not pass on its first implementation attempts. The following failures were encountered and corrected; none are hidden from the certification record.

### 1. Explicit `.ts` imports broke the release verifier

`doc12-package-candidate-verify.ts` originally imported local TypeScript files with explicit `.ts` extensions, producing TS5097 under the documentation TypeScript configuration.

**Correction:** changed local imports to extensionless module specifiers. This removed the TypeScript contract failure without changing compiler policy.

### 2. Nested package checkout contaminated documentation typechecking

The workflow checks out Apexify.js under `_doc12-package-main`. The documentation `tsc --noEmit` initially traversed package-side test/source files and produced package-specific resolution failures.

**Correction:** `_doc12-package-main` was explicitly excluded from the documentation TypeScript project. The package candidate continues to be independently built, packed, and verified by the release workflow.

### 3. Lighthouse runner variance exposed the hard LCP boundary

An earlier DOC-12 attempt failed the DOC-11 reference Lighthouse step with a mobile docs LCP sample of approximately `2643 ms`, above the unchanged `<2500 ms` requirement. A rerun passed the inherited DOC-11 step, but a later authoritative DOC-12 release verification still observed a repeated mobile median of `2510.98 ms`, approximately `10.98 ms` above the gate.

**Correction:** the threshold was **not** weakened. Root-level/style delivery was tightened so separate render-blocking CSS requests were collapsed into the intended CSS dependency graph. The final three-run mobile median is **2352.35 ms**, below the original hard threshold.

### 4. Legacy `/docs` page violated the server-first client-route audit

The final release audit correctly identified `app/docs/page.tsx` as an ordinary docs route implemented as a large hash-driven client page, even though the modern routed documentation architecture and the isolated legacy redirect compatibility component were already present.

**Correction:** `/docs` was converted to a minimal server-rendered compatibility entry. Legacy fragment migration remains isolated in `LegacyDocsRedirectIsland`; normal canonical documentation pages remain server-first. Final audit result: `clientifiedOrdinaryRoutes = []`.

### 5. Final authoritative verifier initially stopped after otherwise-green browser stages

Before the corrections above, the release workflow reached the final `Authoritative DOC-12 release verification` step and failed even though DOC-11 evidence and browser stages were green. This was treated as a real release failure, not bypassed.

**Correction:** the exact failing assertions were isolated, corrected, and the complete authoritative workflow was rerun from a clean install. Final result:

- `[DOC-12 package candidate] PASS`
- `[DOC-12 external links] PASS`
- `[DOC-11 evidence] PASS files=13`
- `[DOC-12 audit] PASS ... evidence=40 warnings=0`
- `[DOC-12 release verify] PASS ... artifacts=40`

### 6. Fresh final-head CI exposed an inherited WCAG 2.2 target-size defect

After this report was first committed at `11432ea4308006532b221d2a2e74946a2180726a`, the required fresh final-head CI exposed a reproducible accessibility failure in the inherited DOC-5 example browser regression. Both the DOC-5 workflow and DOC-8's DOC-5 regression step initially reported:

`desktop-light axe [{"id":"target-size","impact":"serious","nodes":1}]`

All DOC-5 package execution, manifest, documentation integrity, TypeScript, production build, and other DOC-8 browser/accessibility checks passed. Reproduction in the independent DOC-8 workflow established that this was not a one-off runner fluctuation.

The candidate undersized target was the example-detail `Gallery` breadcrumb link rendered under `.apx-api-breadcrumbs`; existing code-copy, Studio, disclosure, and example-footer controls already meet the 44px interaction contract.

An initial correction added a 44px breadcrumb target rule to `docs-api.css`. Fresh DOC-5 CI still failed because `/examples/[id]` does not load that API-reference stylesheet. Import tracing confirmed that the root route graph loads `app/site.css`, which includes `docs-examples.css`, while `docs-api.css` is owned by the API-reference route. The breadcrumb rule was then moved into `styles/docs-examples.css`, which corrected the desktop target geometry.

To remove ambiguity from any later accessibility failure, `scripts/docs/doc5-browser-verify.mjs` was also strengthened so axe failures retain each offending node's selector, HTML and failure summary instead of collapsing evidence to a node count.

That diagnostic exposed the remaining failure precisely on `mobile-light`:

- selector: `a[href$="gallery"]`
- element: `<a href="/gallery">Gallery</a>`
- usable visible space: `62.5px × 13px`
- safe clickable-space diameter: `22px` instead of at least `24px`
- axe classification: the target was **partially obscured**, not merely intrinsically too small.

The root cause was the `/examples` route shell contract. `DocsShell`'s mobile control bar is sticky at `top: var(--apx-header-height)`. Canonical `/docs` and `/api-reference` surfaces provide a real `DocsHeader` occupying that reserved height; `/examples` had no route layout/header. Once the missing shell/component styles were loaded, the sticky mobile bar shifted down by the reserved header offset while retaining its original flow position and overlapped the first content row, partially covering the `Gallery` breadcrumb.

**Final correction:** `app/examples/layout.tsx` now owns the same documentation shell prerequisites as the API-reference surface: `docs.css`, reusable component/API styles, the `.apx-doc-root` wrapper, skip link, background layer, and `DocsHeader`. This makes the sticky mobile offset correspond to a real header instead of overlapping content. The route-style dependency gap and the obscured mobile target are fixed at their architectural boundary. The axe rule, WCAG 2.2 tag set, target-size threshold, and browser states were **not** disabled, filtered, or weakened. This correction must pass the new final-head CI before merge.

## DOC-11 inherited external verification boundary

The source-controlled release gate remains explicit about what lab CI can and cannot prove.

### Real-user field INP

State: **EXTERNAL_VERIFICATION_PENDING**

Reason: Lighthouse lab certification does not fabricate real-user field INP. TBT remains a lab diagnostic and is not relabeled as INP.

### Required-check branch protection

State in generated evidence: **EXTERNAL_VERIFICATION_PENDING**

Reason: the repository contains the permanent DOC-12 gate, but requiring that check through repository branch/ruleset configuration is an operational repository setting rather than a source-controlled fact. This report does not falsely claim that setting without separate verification.

These items do not weaken or convert any source-controlled failure into a pass; they are explicitly classified external verification items.

## Permanent release/future-phase contract

DOC-12 establishes the permanent rule:

> Any later Apexify phase that changes public behavior must update and verify documentation in the same implementation phase.

Future work must reuse the documentation architecture rather than creating duplicate API, search, example, or Studio systems; future fixtures remain test-only until backed by implemented public behavior.

## Release decision at report creation

The automated release decision is **PASS** and all source-controlled DOC-12 certification evidence is green. The report itself does **not** mark DOC-12 complete yet because the roadmap requires a green final report commit, merge, and post-merge `main` verification.

Required closure after this report commit:

1. run fresh CI on the report commit and require all inherited/documentation/runtime/DOC-12 checks to be green;
2. merge PR #38 only while the final head is green and mergeable;
3. run the authoritative DOC-12 gate on the resulting `main` commit;
4. record the final `main` SHA and the allowed final DOC-12 status;
5. stop after DOC-12 — do not start Phase 15.
