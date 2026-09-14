# DOC-9 — Content Reorganization and Full Reference Migration

## Status

`PARTIAL — BLOCKED`

The implementation is on `doc9-full-content-migration`; the remaining blocker at this report revision is execution of the DOC-9 pull-request CI gate and post-merge verification. This report must be updated before any `COMPLETE` claim.

## Source authority

Primary authority: `APEXIFY_DOCUMENTATION_ARCHITECTURE_PRE_PHASE_ROADMAP.md`, especially the DOC-9 migration, taxonomy, route, search, API/example, completeness, integrity, and reporting requirements.

## Repository identities

- Phase 14-P frozen implementation SHA: `5d9b71f185140d6c3477286b8fb111f293e52b48`
- package main SHA at DOC-9 start: `2b64087a04411982067cc624031b3de6f663c530`
- documented/pinned package SHA: `dbed9743353593eafae9a7b1c25312d7170a233b`
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
- DOC-9 base SHA: `a1e7a6ddca0b7c0e7193b4dceb56e7cd900862f3`
- DOC-9 branch: `doc9-full-content-migration`
- DOC-9 branch SHA: recorded from the PR head at final verification
- DOC-9 merge SHA: pending
- final docs main SHA: pending

Phase 15 was not started. The package main commit remains the Phase 14-P merge line; DOC-9 does not mutate the package runtime.

## Starting corpus inventory

DOC-1 evidence at DOC-9 start reported **3 managed canonical pages and 145 legacy fallback pages**. The live `content/docs` tree remains the migration source corpus. `scripts/docs/doc9-generate.ts` re-enumerates the tree at execution time rather than trusting the historical count.

## Classification summary

The generated `classification-summary.json` is authoritative for exact final counts. Policy:

- existing validated frontmatter pages: `keep`
- active legacy prose promoted into modern canonical routing: `move`
- handwritten `04-api-reference/**` sources: `merge` into DOC-4 generated reference truth
- `05-internals/01-5.4.5-remote-image-hotfix.mdx`: `archive`
- no automatic deletion is performed
- `rewrite`, `split`, and `delete` are only used when evidence justifies them; DOC-9 does not fabricate classifications merely to exercise every state

The generator fails if source coverage is not 100%, if an active migration target is missing, if an active source is not routed, or if canonical routes collide.

## Migration architecture

DOC-9 adds one deterministic migration model in `lib/docs/doc9-migration.ts`. It is the single source for source disposition, canonical route synthesis, page kind/category, feature identity, legacy hash identity, and migration rationale.

`lib/docs/content.ts` now validates both explicit authored frontmatter and DOC-9 migration metadata through the existing DOC-1 schema. Legacy prose is preserved; migration does not perform a generic AI rewrite.

`lib/docs/navigation.ts` is now taxonomy/intent driven instead of enumerating three hand-maintained routed pages. Every active canonical documentation page must be represented exactly once.

## Migration manifest

`generated/docs-doc9/migration-manifest.json` contains one record per live MDX source with classification, target route(s), feature identity, redirect requirement, preservation state, rationale, and verification status.

Coverage gate: `migration records / source records = 100%`.

## Route/metadata mapping

`generated/docs-doc9/route-map.json` is the complete old source/hash to canonical target map. Canonical active content is organized under Start, Recipes, Node guides, Advanced, Architecture/Migration, plus DOC-4 generated API reference.

## Legacy compatibility

`lib/docs/doc9-legacy-client.ts` extends browser-side legacy fragment resolution for the migrated corpus. `lib/docs/legacy-routing.ts` preserves the browser-only fragment rule and canonicalizes legacy identities while retaining deep-heading forwarding (`?h=...`). Handwritten API reference identities resolve to the generated API reference surface; historical hotfix identity resolves to current migration/changelog context.

## Content preservation

No source is deleted in this implementation. `content-preservation.json`, `archive-inventory.json`, and `deletion-inventory.json` make preservation/deletion policy reviewable. Any later deletion must be added as an explicit audited migration record.

## Start docs migration

Start-here and beginner-guide content receives canonical `/docs/start/...` routes, except the existing `/docs/getting-started` page whose authored DOC-1 route remains authoritative.

## Beginner-guide migration

Beginner material is typed as tutorials/troubleshooting according to intent rather than preserved as one monolithic hash-only entry.

## Recipe migration

Recipe content is routed beneath `/docs/recipes/...`; dedicated recipe assets use the `recipe` page kind while overview/concept material remains guide content.

## Feature-guide migration

Feature-guide domains are routed beneath `/docs/node/...` with current `apexify.js` / Node runtime metadata. Feature identities are derived from the actual current corpus, not future Phase 15 package plans.

## Advanced-doc migration

Current advanced material moves under `/docs/advanced/...`, with security/performance/resource-governance and migration material classified by page intent.

## Internals migration

Current internals overview is exposed as architecture context. The 5.4.5 remote-image hotfix is explicitly archived/historical rather than presented as current package behavior.

## Changelog migration

The existing changelog source maps to `/docs/migration/changelog`, separating historical change records from current API reference truth.

## Guide/reference separation

The legacy handwritten `content/docs/04-api-reference/**` corpus is not promoted as a second active reference database. It is classified `merge`, preserved for audit/content-loss review, removed from active routed/search truth, and mapped to DOC-4 generated reference.

Guide pages remain responsible for explanation/workflow. DOC-4 remains responsible for exact export/signature/options/default truth.

## API-reference extraction

DOC-4 evidence at DOC-9 start reports 217/217 public exports covered, 17,233 option paths covered with zero missing option paths, and zero signature mismatches. DOC-9 consumes those guarantees rather than copying tables into a new handwritten database.

## Example migration

DOC-5 remains authoritative. `example-content-migration.json` records canonical page/example relationships without creating a second example store.

## Output migration

No unverified replacement output is fabricated. Existing DOC-5 output provenance remains authoritative.

## Error documentation

Feature completeness derives error-related evidence from current migrated prose and DOC-4 coverage; missing semantics are marked `PARTIAL`, not invented.

## Limit documentation

Limits are marked evidence-first. DOC-9 does not invent global byte/dimension/frame/concurrency limits to force a green matrix.

## Runtime/package correctness

Migrated current pages are explicitly `package: apexify.js`, `runtime: [node]`, `stability: CURRENT`, `since: 6.0.0`. Future Web/React/Next/animation packages are not represented as shipped.

## Stability/deprecation correctness

Historical 5.4.5 hotfix material is archived. Generated API stability/deprecation truth remains DOC-4-owned.

## Architecture/current-vs-roadmap content

DOC-9 documents current Node package behavior only. No Phase 15 multi-runtime implementation is introduced or documented as current.

## Feature completeness matrix

`feature-completeness-matrix.json` is generated from current feature-linked canonical pages plus DOC-4/DOC-5 evidence. Columns include package, runtime, guide, API reference, options, examples, errors, limits, performance, security, animation, migration, verified version, and status.

`PARTIAL` is retained where evidence is incomplete; the generator never converts missing evidence into a fictional `COMPLETE` state.

## Legacy-only active features

Hard gate: `active_feature_legacy_only_count == 0`.

`legacy-only-features.json` is machine generated and the CI job exits non-zero if the count is not zero.

## Orphan-content audit

The generator fails on unclassified sources, missing active targets, active sources without canonical routed pages, or duplicate canonical routes.

## Duplicate-content audit

Canonical-route duplication fails generation. Semantic text similarity is not used to auto-delete material; candidate review remains manual.

## Archive inventory

Historical 5.4.5 hotfix content is retained with explicit archive rationale and a current-context destination.

## Delete inventory

No content is deleted in this implementation. The deletion inventory therefore starts empty rather than inventing deletion rationale.

## Navigation impact

Navigation changes from a 3-page manual manifest to intent-driven groups covering the full canonical active corpus. Breadcrumbs and pager continue consuming the shared navigation model.

## Search impact

All canonical active migrated pages default to search enabled. Manual legacy API and archive sources are excluded from active page loading/search so they do not compete with generated current truth.

## Internal-link impact

Legacy fragments continue through compatibility canonicalization. Existing canonical routed content remains server/static by default.

## Redirect impact

Legacy browser fragments are mapped client-side because URL fragments are never sent in HTTP requests. DOC-9 extends that mapping without attempting impossible server-side fragment redirects.

## Heading/anchor impact

Existing MDX bodies and headings are preserved during route promotion. Legacy `?h=heading-id` forwarding remains supported by the compatibility resolver.

## Components used/enhanced

DOC-9 reuses DOC-1 content/schema/navigation, DOC-3 rendering/components, DOC-4 API reference, DOC-5 examples, DOC-6 discovery, and DOC-8 interaction foundation. No parallel component or interactive-editor system is added.

## Routes added/migrated

Exact final route count is generated in `canonical-routes.json`. The starting managed-route baseline is 3; DOC-9 promotes the active non-API/non-archive corpus from hash-only fallback to canonical `/docs/...` routes.

## Content migrated

The generator records domain counts from the live corpus. Migration covers start, beginner/tutorial, recipes, feature guides, advanced, internals, changelog/migration and legacy API disposition.

## Tests added

The DOC-9 CI gate performs generation integrity checks, zero-legacy-only-feature verification, orphan checks, the existing DOC-1→DOC-6 regression chain, TypeScript checking, production build, browser/search smoke, and evidence upload.

## Accessibility impact

No new content renderer is introduced. Existing heading extraction and DOC-2/DOC-3 semantics remain in use. Representative migration smoke remains a CI/post-merge gate before final status can change.

## Responsive impact

No DOC-2 shell redesign is performed. Full-corpus navigation exercises the existing responsive shell; CI/browser smoke is required before closure.

## Performance impact

Migration is metadata/routing driven and does not globally import interactive components. Build/bundle impact is recorded separately; DOC-11 final performance hardening is not pulled into DOC-9.

## Build impact

`build-comparison.json` records route-count change from the 3 managed / 145 fallback baseline to the generated final canonical route count. Production build result is pending PR CI at this revision.

## Bundle impact

No heavy component is introduced globally by DOC-9. Final bundle verification remains pending PR CI at this revision.

## SEO/link impact

Active content gains canonical route identities. Handwritten API duplicates do not become equally current/indexable reference pages.

## Dependency changes

None.

## DOC-1 regression

Pending DOC-9 CI. The workflow refreshes DOC-1 generated manifests against the fully migrated corpus before running the existing regression chain.

## DOC-2 regression

Pending DOC-9 CI through the established chained verification/build contracts.

## DOC-3 regression

Pending DOC-9 CI through the established chained verification/build contracts.

## DOC-4 regression

Pending DOC-9 CI; public export/options/signature coverage remains authoritative.

## DOC-5 regression

Pending DOC-9 CI; authoritative example verification remains unchanged.

## DOC-6 regression

Pending DOC-9 CI; search generation/verification is rerun against the expanded canonical corpus.

## DOC-7 regression

No DOC-7 product-surface implementation is replaced. Production build and link/search relationships are the DOC-9 regression surface; final outcome pending CI.

## DOC-8 regression

No standalone editor/viewer is introduced. Existing shared interactive primitives remain untouched; final build outcome pending CI.

## Problems discovered

The key live discrepancy was architectural: DOC-1 intentionally migrated only a representative 3-page slice, leaving 145 pages as legacy fallback. DOC-9 therefore had to convert the fallback state itself rather than merely move a few files.

The legacy `04-api-reference` directory also represented a duplicate handwritten reference risk after DOC-4. Promoting it directly would violate the one-source-of-truth rule.

## What went wrong

Historical navigation and content loading treated frontmatter presence as the boundary between canonical and legacy content. That was appropriate for DOC-1 but would permanently strand most current documentation if retained through DOC-9.

## How fixed

A deterministic migration layer now supplies validated metadata for unmigrated active prose, excludes superseded manual API truth from active routing, archives historical hotfix detail, generates auditable disposition/evidence for every source, and expands navigation/search inputs from the canonical page set.

## Not completed

At this report revision:

- DOC-9 PR CI has not yet completed.
- final generated CI evidence has not yet been inspected.
- PR has not yet merged.
- post-merge main CI/evidence verification has not yet run.

## Why

Those operations occur after the implementation branch/report is present and the pull request is opened.

## Alternatives considered

1. Add literal frontmatter to ~145 files in one blind codemod. Rejected because it creates mass noisy edits and higher technical-content loss risk.
2. Keep legacy fallback and add a separate route database. Rejected because it creates a second source of truth.
3. Promote handwritten API pages as canonical `/docs` references. Rejected because DOC-4 is already the authoritative generated API system.

## Generated evidence

`generated/docs-doc9/` is produced by `npx tsx scripts/docs/doc9-generate.ts` and archived by `.github/workflows/doc9.yml`. It includes identity, inventory, migration manifest, classification summary, route/alias maps, preservation, canonical routes, active feature inventory, completeness matrix, legacy-only report, API/example/changelog migration, archive/delete inventories, duplicate/orphan audits, navigation/search coverage, redirect verification, content lint handoff, accessibility/responsive/build/bundle placeholders updated by CI context, prior-phase regression context, and index.

## Remaining risks

- Existing prose that contains exact contract fragments still requires ongoing DOC-4 drift discipline; DOC-9 avoids promoting the dedicated handwritten API tree but does not destructively rewrite every explanatory code fragment.
- Very large navigation coverage can expose shell ergonomics issues; DOC-2 behavior must be observed in CI/browser smoke and later DOC-11 owns final global hardening.
- Package main and docs pinned package SHA are distinct identities under the established synchronization policy; technical claims remain pinned to the documented 6.0.0 package artifact rather than silently following package main.

## Deferred roadmap ownership

- DOC-10: future-engine documentation readiness simulation — **not started**.
- DOC-11: final accessibility/SEO/performance/reliability hardening — **not started**.
- DOC-12: final release/integrity certification — **not started**.
- Phase 15+: **not started**.

## Final diff review

Required before merge: inspect all DOC-9 branch changes for unclassified sources, broken canonical routes, accidental `/docs#` additions, handwritten API duplication, copied authoritative examples, fake defaults/errors/limits, future APIs represented as current, duplicate canonical pages, invalid metadata, clientification and dependency changes.

## PR state

Pending creation at this report revision.

## Merge state

Not merged.

## Post-merge verification

Not run.

## Documentation architecture score

Provisional DOC-9 architecture score: **9.2/10** for the implemented migration architecture, reduced from a higher score because CI/post-merge proof is not yet available. This is not the future DOC-12 final product score.
