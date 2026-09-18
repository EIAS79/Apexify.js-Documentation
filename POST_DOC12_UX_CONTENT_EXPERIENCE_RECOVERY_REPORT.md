# POST-DOC-12 UX, Content & Experience Recovery Report

## Program

**Program:** POST-DOC-12 — Documentation UX, Navigation & Interactive Example Recovery  
**Scope:** corrective documentation work after DOC-12; this is not DOC-13 and does not start Apexify.js Phase 15.  
**Status:** **PRE-MERGE CLOSURE** — implementation and source-controlled recovery work are complete; final CI, PR merge, merge SHA recording, and post-merge `main` verification remain to be recorded before this report may say COMPLETE.

## Repository identities

- Documentation repository: `EIAS79/Apexify.js-Documentation`
- Recovery branch: `post-doc12-ux-recovery`
- Recovery PR: #39 — https://github.com/EIAS79/Apexify.js-Documentation/pull/39
- DOC-12 recovery baseline: `da397597e3fd9c8dca497bff58a21c3883b63a9a`
- Earlier DOC-12 merge reference: `d4c7389ddaf1e288ddf6c05d49d7b660c974fd7c`
- Apexify.js package repository: `EIAS79/Apexify.js`
- Verified package commit: `2b64087a04411982067cc624031b3de6f663c530`
- Verified package version: `apexify.js@6.0.0`
- Recovery candidate immediately before this report commit: `7b06d80ad4e32152103937bb414d82d71ded4b6e`

## Legacy visual source

Historical homepage reference:

- Commit: `46b7eb1712fcb1456c23eca9b2077d6f4e51f25d`
- Role: **visual/UX reference only**
- Architecture restored wholesale: **NO**

The recovery intentionally reuses visual direction, hierarchy, atmosphere, Studio-first emphasis, code/output composition, and asymmetric presentation cues without restoring the legacy client-heavy homepage architecture or old routing/content systems.

## Problems before recovery

The post-DOC-12 documentation architecture was technically strong but the user experience regressed in several visible areas:

1. The homepage became more generic and card-heavy than the stronger legacy presentation.
2. Documentation navigation exposed too much content at once and did not communicate a true engine/section/feature/page hierarchy.
3. Sidebar metadata repeated too much information and increased visual density.
4. Markdown/GFM tables did not consistently flow through the shared semantic DOC-3 table primitive.
5. Several migrated MDX sources contained formatting defects such as literal escaped newlines or malformed inline formatting.
6. The representative interactive example needed a clearer code/output workbench with truthful Node execution boundaries and Studio handoff.
7. The old DOC-8 browser verifier assumed the representative playground was eagerly mounted, conflicting with the recovered deferred workbench architecture.
8. DOC-9 generated navigation evidence flattened only top-level navigation items and therefore disagreed with the new hierarchical navigation model.
9. A DOC-12 mobile Lighthouse run narrowly missed the LCP budget because of mobile docs rendering/compositing cost.
10. Recovery browser evidence initially targeted a route that was not actually table-heavy, then later checked the Studio hash after Studio had intentionally consumed it.

## Changes delivered

### Homepage recovery

`components/home/ProductHome.tsx` was rebuilt toward the stronger legacy visual direction while keeping the current data model and current package truth.

Recovered characteristics include:

- “Draw anything. From a script.” hero hierarchy;
- aurora/radial atmosphere;
- Studio-first primary CTA;
- verified DOC-5 source/output window;
- asymmetric capability bento rhythm;
- task-oriented feature tracks instead of a uniform wall of cards;
- asymmetric verified-output gallery wall;
- compact current-package footer;
- explicit roadmap labeling for future engine work.

The homepage remains a server component and continues to use `ProductExperienceModel`; the legacy Framer Motion homepage stack was not restored.

### Homepage comparison decisions

| Area | Decision | Recovery implementation |
| --- | --- | --- |
| Hero composition/headline | RESTORE VISUALLY | Legacy scale/rhythm rebuilt over current product data |
| Global navigation | KEEP CURRENT | Current routing/status truth retained |
| Typography/spacing | MERGE | Dramatic hierarchy combined with current tokens/accessibility |
| Backgrounds/gradients | RESTORE VISUALLY | Token-driven aurora/radial atmosphere |
| Uniform giant-card layout | REMOVE | Replaced by bento and track-based composition |
| Capability presentation | REDESIGN | Asymmetric DOC-4-backed capability layout |
| Code/output demo | MERGE | Legacy terminal feel + DOC-5 verified source/output |
| Animations | KEEP CURRENT | No legacy client animation stack; reduced-motion preserved |
| Primary CTA | RESTORE VISUALLY | Studio primary, docs secondary |
| Gallery preview | RESTORE VISUALLY | Asymmetric verified media wall |
| Footer | MERGE | Compact visual rhythm with current package truth |

## Sidebar architecture

The live documentation tree is generated from the canonical documentation page model through `lib/docs/navigation.ts`.

No second content database or second navigation manifest was created.

The navigation model now supports:

- engine nodes;
- section nodes;
- feature-family nodes;
- page nodes;
- recursive children;
- compact tags;
- current stability/runtime/package ownership;
- navigation-only nodes where required;
- recursive flattening for pager/coverage verification;
- hierarchy-aware breadcrumbs.

The desktop sidebar and mobile navigation drawer consume the same navigation model.

## Documentation tree

The current public hierarchy is organized around:

- Start
- Engines
  - Node
    - Getting Started
    - Guides
    - Recipes
    - Features
      - Canvas
      - Images
      - Text
      - Charts
      - GIF
      - Video
      - other current feature families when present
    - Advanced
    - Performance
    - Security
    - Troubleshooting
    - API Reference
- Architecture
- Migration

Active ancestors automatically expand. Disclosure state is session-persisted, while the active path is always re-opened so persistence cannot hide the current page.

Future runtime groups remain absent from normal current navigation until real pages exist.

## Engine handling

The Node hierarchy is built through a reusable `buildEngineTree` path rather than a hard-coded one-off sidebar database.

Current Node ownership is explicitly:

- package: `apexify.js`
- runtime: `node`
- stability: `CURRENT`

Future Web/React/Next/engine scopes are not shown as shipped current content.

## Navigation tags

Compact navigation tags are supported for:

- FEATURE
- GUIDE
- RECIPE
- API
- ADVANCED
- PERF
- SECURITY
- HELP
- PREVIEW
- EXPERIMENTAL
- ROADMAP
- DEPRECATED

Tags are intentionally compact and do not recreate the previous repetitive per-link package/runtime/status metadata block.

## Density and search

The sidebar was compacted by:

- reducing redundant metadata;
- using a real disclosure hierarchy;
- tightening tree spacing while preserving 44×44 touch targets;
- compacting the sidebar search surface;
- keeping active-state visibility and focus styles;
- preserving desktop/mobile parity.

## Table issues and fixes

### Before

Migrated routed Markdown used a private table renderer, so GFM tables did not consistently reuse the shared DOC-3 table primitive.

The first recovery browser check also targeted `/docs/node/canvas/backgrounds-primary`, which was not a valid table-heavy route.

### After

Native MDX and migrated routed Markdown now reuse the same semantic table components:

- `Table`
- `TableHead`
- `TableBody`
- `TableRow`
- `TableHeader`
- `TableCell`

The table contract provides:

- native table semantics;
- explicit keyboard-focusable horizontal scroll region;
- responsive overflow;
- sticky header;
- sticky first column;
- mobile sizing;
- semantic browser verification.

The recovery browser matrix now tests the real table-heavy canonical route:

`/docs/node/video-ffmpeg/metadata-and-frames`

## MDX issues and fixes

The DOC-9 content lint was extended to detect additional migrated-content defects, including:

- literal escaped newlines outside code;
- unbalanced fenced blocks;
- malformed inline-code/formatting cases retained by the broader DOC-9 lint rules.

Small source repairs were made only where required. No destructive bulk content rewrite was introduced.

The full canonical migrated corpus remains governed by DOC-9 migration and search/navigation integrity checks.

## ExampleWorkbench architecture

The representative interactive documentation surface is the recovered `ExampleWorkbench`, exposed through the compatibility `VerifiedExamplePlayground` export.

Supported view modes:

- TypeScript
- Preview
- Both

Supported controls:

- Copy code
- Reset
- Open in Studio

The workbench intentionally does **not** expose a fake browser “Run” action for Node code.

It reuses the existing DOC-8 primitives:

- editor;
- preview;
- diagnostics;
- resizable workspace;
- error boundary;
- session model.

## Workbench provenance

Representative example:

- route: `/docs/node/canvas`
- example ID: `node.canvas.basic`
- authoritative source: DOC-5 example manifest
- verified output: DOC-5 repository-controlled output
- preview truth: verified output, not locally executed browser output

Local source edits do not rewrite verification evidence.

## Deferred editor / bundle behavior

The workbench is collapsed by default.

The heavy editor/workspace implementation is dynamically imported only after the user activates **Show code & preview**.

The DOC-8 browser verifier now explicitly verifies:

1. collapsed surface exists;
2. editor is not mounted before activation;
3. activation works;
4. editor/preview/diagnostics/workspace appear afterward;
5. keyboard resizing works;
6. accessibility remains clean;
7. ordinary routes do not eagerly mount the editor;
8. route JS regression budgets remain enforced.

## Studio integration

The recovery reuses the existing DOC-8 Studio share-session model:

- `encodeShareLink`
- `decodeShareLink`
- `#snippet=` transport
- `bootstrapStudio`

No second Studio session model was created.

The workbench sends the current TypeScript source through the existing encoded snippet transport.

Studio intentionally consumes the hash during bootstrap and removes it with `history.replaceState` after decoding. The final recovery browser verifier therefore checks the actual contract: navigation reaches `/studio` and the encoded workbench source is loaded into the Studio editor.

## Accessibility

Recovery validation covers:

- axe serious/critical violations;
- focus visibility;
- semantic disclosures;
- keyboard disclosure toggle;
- keyboard workbench tab activation;
- keyboard splitter resize/reset;
- semantic table focus/scroll region;
- minimum touch targets;
- mobile navigation;
- Studio and API representative routes.

No accessibility blocker remains in the recovered implementation.

## Keyboard verification

Verified interactions include:

- sidebar disclosure via Enter;
- workbench tab activation via keyboard;
- workspace separator ArrowLeft/ArrowRight resize;
- separator reset;
- focusable semantic table wrapper;
- standard button/link focus behavior.

## Responsive verification

Representative browser coverage includes:

- homepage desktop light;
- homepage desktop dark;
- homepage mobile;
- docs desktop;
- docs tablet;
- docs mobile;
- table-heavy desktop;
- API reference;
- gallery;
- Studio;
- collapsed/expanded workbench.

Horizontal-overflow checks are included in runtime evidence.

## Theme verification

Light, dark, and system theme resolution are included in the recovery browser matrix.

System-theme behavior is checked against emulated OS preference.

## Reduced motion

The sidebar disclosure transition is disabled under `prefers-reduced-motion: reduce`.

The broader DOC-8 browser matrix also verifies reduced-motion behavior on interactive primitives.

## Performance and bundle behavior

Performance work includes:

- server-first homepage retention;
- collapsed/deferred workbench editor bundle;
- no editor primitive on ordinary routes;
- mobile docs removal of expensive backdrop/filter compositing on the critical paint path;
- removal of the decorative fixed grid on small docs viewports;
- route JS transfer regression checks through DOC-8;
- DOC-11 Lighthouse matrix;
- repeated DOC-12 standard-doc Lighthouse gate.

The earlier mobile DOC-12 LCP miss of approximately 2514 ms against a strict <2500 ms budget was eliminated without weakening the threshold.

## Test and CI coverage

Recovery work is covered by:

- DOC-1 Information Architecture
- DOC-2 Design System and Shell
- DOC-3 MDX Component Library
- DOC-4 API Reference Engine
- DOC-5 Executable Example Platform
- DOC-6 Search Discovery
- DOC-7 Homepage Gallery Product
- DOC-8 Studio Interactive Foundation
- DOC-9 full content migration
- DOC-10 Future Engine Documentation Readiness
- DOC-11 Production Hardening
- DOC-12 Final Documentation Release Gate
- Documentation Runtime Build Gate
- POST-DOC-12 UX Recovery

Important recovered regressions already closed include:

- DOC-9 generated navigation coverage now recursively uses `flattenDocumentationNavigation`;
- DOC-8 now understands the collapsed/deferred workbench and passes its full browser/accessibility/bundle matrix;
- semantic table browser verification targets an actual table-heavy route;
- routed GFM tables reuse the shared semantic table primitive;
- DOC-12 Lighthouse/LCP gate is green on the recovered implementation;
- Studio handoff verification follows the real consume-and-load behavior instead of requiring the hash to remain after bootstrap.

## DOC-12 regression status

The recovery preserves DOC-0 through DOC-12 architecture rather than replacing it.

The current recovery work does not:

- introduce a second navigation database;
- introduce a second example registry;
- introduce a second Studio session model;
- restore the old legacy documentation architecture;
- implement future `@apexify/web` runtime behavior;
- start Apexify.js Phase 15.

## Final diff review

Reviewed against baseline `da397597e3fd9c8dca497bff58a21c3883b63a9a`.

Pre-report candidate state:

- 61 commits ahead;
- 0 commits behind;
- 29 changed files;
- no package dependency changes;
- obsolete `RouteDocChrome`, `RouteDocSidebar`, and `RouteDocsFrame` removed;
- live routed docs use `DocsShell`;
- DOC-1 generated rendering evidence points at the surviving sidebar/mobile/search islands;
- table rendering is unified;
- navigation remains canonical-page-derived;
- no duplicate workbench/session/registry system found;
- no Phase-15 implementation leakage found.

No source-controlled regression requiring another architectural rewrite was found during the final review.

## Problems encountered and how they were fixed

### Flat/generated navigation evidence mismatch

**Problem:** DOC-9 generated coverage flattened only top-level group items.  
**Fix:** generated evidence now uses the same recursive `flattenDocumentationNavigation` helper as the live architecture.

### DOC-8 eager-playground assumption

**Problem:** browser verification waited for the expanded playground even though the recovered workbench is deliberately collapsed/deferred.  
**Fix:** verify collapsed state first, assert editor absence, activate, then run all shared primitive/accessibility/performance checks.

### Table browser false target

**Problem:** recovery browser test used a route without a semantic GFM table.  
**Fix:** use a canonical table-heavy video metadata route and keep the semantic wrapper requirement strict.

### Routed Markdown table divergence

**Problem:** migrated routed Markdown had its own table implementation.  
**Fix:** route it through the shared DOC-3 semantic table primitives.

### Mobile docs LCP

**Problem:** DOC-12 mobile docs LCP narrowly exceeded the fixed budget.  
**Fix:** reduce small-screen compositing/paint cost without loosening the threshold.

### Studio handoff verifier

**Problem:** recovery verification required `#snippet=` to remain after Studio bootstrap, but Studio correctly consumes and removes the hash after decoding.  
**Fix:** verify the stronger user-visible contract: Studio opens and the encoded workbench source is loaded into the Studio editor.

## Screenshots and generated evidence

Recovery CI generates screenshots including:

- `homepage-desktop-light.png`
- `homepage-desktop-dark.png`
- `homepage-mobile.png`
- `docs-tree-active.png`
- `docs-tablet.png`
- `docs-mobile.png`
- `table-heavy-desktop.png`
- `api-reference.png`
- `workbench-collapsed.png`
- `workbench-expanded.png`
- `gallery.png`
- `studio.png`

Generated evidence also includes:

- accessibility;
- keyboard;
- responsive;
- theme;
- reduced motion;
- bundle comparison;
- performance comparison;
- browser regression;
- navigation tree and coverage;
- navigation tags;
- future-engine visibility;
- table audit;
- MDX formatting audit;
- workbench inventory/provenance;
- Studio linkage;
- regression invariants.

## Not completed at this pre-merge checkpoint

The following items are intentionally not marked complete until they actually happen:

1. final candidate CI after this report commit;
2. PR #39 transition from draft to ready;
3. merge of PR #39;
4. recording the real merge SHA;
5. post-merge `main` verification;
6. final update of this report from PRE-MERGE CLOSURE to COMPLETE.

## Remaining risks

No known source-controlled functional blocker remains in scope.

Residual operational risks are the normal ones covered by CI and production monitoring:

- performance variance on shared CI hardware;
- future content additions bypassing hierarchy conventions unless existing checks are retained;
- future interactive features accidentally loading editor bundles eagerly unless DOC-8/recovery regressions remain enabled;
- future visual changes drifting from the recovered hierarchy unless screenshot review remains part of release practice.

## Final PR / merge / post-merge verification

- PR: #39 — https://github.com/EIAS79/Apexify.js-Documentation/pull/39
- PR state at report creation: draft/open
- Merge SHA: **PENDING**
- Post-merge `main` verification: **PENDING**
- Phase 15 started by this recovery: **NO**

This section must be updated with the actual GitHub merge SHA and final `main` verification results before this report is marked COMPLETE.
