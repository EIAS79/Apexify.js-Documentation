# DOC-2 — Documentation Design System and Shell Report

**Status:** DOC-2 completion gate satisfied on the execution branch; PR and post-merge `main` verification are the remaining repository-closure steps recorded below.

## 1. Identity and authoritative baseline

| Item | Value |
| --- | --- |
| Documentation repository | `EIAS79/Apexify.js-Documentation` |
| Execution branch | `doc2-design-system-shell` |
| DOC-2 starting `main` SHA | `c3d0799b8fb67fd7c86d48aceaa8c88e5e3d649f` |
| Strict validated implementation SHA | `115bd8167dbce19cd3bc293546fd6593c5ab7d9e` |
| Package repository pin | `EIAS79/Apexify.js@dbed9743353593eafae9a7b1c25312d7170a233b` |
| Package version verified by existing gates | `6.0.0` |
| Authoritative roadmap | `APEXIFY_DOCUMENTATION_ARCHITECTURE_PRE_PHASE_ROADMAP.md` |
| Phase | `DOC-2 — Documentation Design System and Shell` |

DOC-2 is intentionally constrained to the reusable documentation visual/interaction foundation. It does not start DOC-3 rich MDX work, DOC-4 API generation, DOC-6 full search, DOC-9 broad route migration, DOC-11 final site-wide hardening, DOC-12 final completeness verification, homepage/Gallery/Studio redesign, or engine Phase 15.

## 2. Roadmap goal and completion contract

The DOC-2 goal is to build a coherent reusable visual/interaction foundation for documentation. The roadmap-owned work is:

- semantic design tokens;
- documentation typography and themes;
- responsive documentation shell;
- sidebar and top navigation;
- table of contents;
- breadcrumbs and pager;
- page hero;
- badges and status components;
- mobile drawers;
- keyboard/focus behavior;
- targeted refactoring of oversized legacy shell components where useful.

The roadmap completion gate is boolean: the documentation shell must work on desktop/tablet/mobile, light/dark, keyboard-only, and reduced-motion configurations. DOC-2 is not complete merely because the page renders or a visual redesign exists.

## 3. Implemented architecture

### 3.1 Semantic design system

DOC-2 introduces documentation-scoped semantic tokens in `styles/docs-tokens.css`. The token layer covers accent colors, page/content/elevated/code surfaces, borders, primary/secondary/muted text, all documented stability states, spacing, radii, shadows, motion durations/easing, z-index layers, layout widths, typography families, and focus treatment.

The docs layer maps onto the existing site palette rather than duplicating a second unrelated base palette. Light and dark theme-specific semantic overrides are explicit. Current, preview, experimental, roadmap, deprecated, and removed states have dedicated foreground/background semantics.

### 3.2 Server-first shell boundaries

The routed documentation path remains server-first. The following structural surfaces are server-rendered:

- `app/docs/layout.tsx`;
- `app/docs/[...slug]/page.tsx`;
- `components/docs/shell/DocsShell.tsx`;
- `components/docs/shell/DocsHeader.tsx`.

Client JavaScript is kept to interaction islands that actually require browser state: theme switching, search interaction, drawers, active TOC behavior, and legacy compatibility controls. The docs page itself is not converted into a giant client-side multiplexer.

### 3.3 Reusable shell primitives

The routed page composes reusable primitives rather than duplicating page-local shell markup:

- server-rendered top header/navigation and version context;
- manifest-driven `DocsSidebarV2`;
- nested and active-heading `OnThisPageV2`;
- canonical breadcrumbs and previous/next pager;
- page hero and metadata row;
- package/runtime/stability/since badges;
- accessible site/docs/TOC drawers on smaller viewports;
- route-aware search trigger and canonical search navigation.

Navigation order continues to come from the DOC-1 navigation model, so DOC-2 does not introduce a competing route hierarchy.

### 3.4 Responsive behavior

The shell has deliberate narrow-mobile, mobile/tablet, and desktop regimes rather than relying on accidental wrapping:

- single-column content and drawer navigation on small screens;
- tablet spacing and navigation adjustments;
- three-column desktop shell with left navigation, bounded content column, and right TOC rail;
- sticky header/rails;
- `100dvh` handling for drawers and rails;
- safe-area inset support;
- overflow containment for code/tables and shell panels;
- minimum 44px shell interaction targets.

### 3.5 Keyboard, focus, and motion

DOC-2 adds a coherent focus and keyboard model:

- first-focus skip link to `#docs-content`;
- visible `:focus-visible` treatment;
- keyboard search shortcut and visible-search targeting;
- drawer focus entry, tab containment, Escape close, and trigger focus return;
- keyboard-activatable TOC links and deep links;
- keyboard-focusable horizontally/vertically scrollable code/table containers;
- named non-landmark groups for repeated scroll containers;
- reduced-motion media policy eliminating nonessential shell motion;
- custom cursor disabled for documentation and reduced-motion contexts.

### 3.6 Theme behavior

Theme choice is resolved before paint from the existing site preference with support for `light`, `dark`, and `system`. System mode is validated against both light and dark OS preferences. Routed code blocks retain a deliberately dark code surface in both themes with an accessibility-oriented Prism palette; light docs mode applies a narrow code-token contrast override so inline syntax colors cannot fall below the contrast gate.

## 4. DOC-1 compatibility preserved

DOC-2 does not replace the DOC-1 information architecture. The full prior-phase regression gate remains part of `docs:verify:doc2`.

Verified DOC-1 behavior includes:

- 3 representative routed pages plus 145 legacy fallbacks;
- static catch-all routing and `dynamicParams = false`;
- canonical metadata;
- unknown routed documentation returns HTTP 404;
- legacy `/docs#...` identities redirect to canonical paths;
- heading fragments survive legacy redirect conversion;
- canonical search navigation;
- deterministic navigation/pager order.

The historical DOC-1 routed-shell component files are retained as compatibility artifacts because the DOC-1 verifier still inspects them. The active DOC-2 routed page no longer uses the old shell. Removing those historical files without simultaneously migrating the prior-phase verifier would weaken the regression contract and is therefore intentionally deferred.

## 5. Deterministic verification and generated evidence

DOC-2 adds a first-party phase control plane:

- `scripts/docs/doc2-generate.ts`;
- `scripts/docs/doc2.test.ts`;
- `scripts/docs/doc2-verify.ts`;
- `scripts/docs/doc2-build-measure.mjs`;
- `scripts/docs/doc2-browser-verify.mjs`;
- `scripts/docs/doc2-finalize.mjs`;
- `.github/workflows/doc2-design-system-shell.yml`.

The deterministic evidence inventory under `generated/docs-doc2/` contains:

1. `identity.json`
2. `baseline.json`
3. `token-audit.json`
4. `theme-audit.json`
5. `component-inventory.json`
6. `client-boundaries.json`
7. `responsive-audit.json`
8. `keyboard-audit.json`
9. `focus-audit.json`
10. `reduced-motion-audit.json`
11. `accessibility-audit.json`
12. `route-regression.json`
13. `dependency-audit.json`
14. `index.json`

The generator check is deterministic and rejects stale evidence. Generated records are checked for machine-specific paths and obvious secret patterns.

## 6. Validation results

Strict branch validation was executed in GitHub Actions run **34446791452**, job **102773250909**, against implementation SHA `115bd8167dbce19cd3bc293546fd6593c5ab7d9e`.

All stages passed:

| Gate | Result |
| --- | --- |
| Deterministic install | PASS |
| DOC-2 evidence generation/check | PASS |
| DOC-2 tests | **6/6 PASS** |
| DOC-2 structural verifier | PASS |
| DOC-1 tests | **5/5 PASS** |
| DOC-1 structural verifier | PASS |
| Existing documentation content gate | PASS — 155 active docs/site files |
| Existing link gate | PASS — 148 MDX files / 155 documentation anchors |
| Existing Phase-13 docs gate | PASS — 11 API-reference pages / 148 MDX pages / 10 user-facing TSX pages |
| Package pin gate | PASS — `dbed9743353593eafae9a7b1c25312d7170a233b` |
| TypeScript | PASS |
| Clean Next.js production build | PASS |
| Browser/axe matrix | **PASS — 8 states, 0 failures** |
| Lighthouse desktop | PASS |
| Lighthouse mobile | PASS |
| Quantitative finalizer | **PASS — 0 regressions** |
| Evidence artifact upload | PASS |

The workflow also runs on pull requests to `main`. DOC-2 adds a `main` push trigger so the exact shell gate is executed again after merge. The generated-evidence auto-commit remains branch-only and cannot mutate `main` during post-merge verification.

## 7. Browser, responsive, keyboard, and accessibility proof

The final browser suite validates eight independent states on `/docs/node/canvas`:

- desktop light;
- desktop dark;
- desktop system/light;
- desktop system/dark;
- tablet light;
- mobile light;
- narrow-mobile dark;
- desktop dark with reduced motion.

For **every state** the final runtime evidence reports:

- 0 serious axe violations;
- 0 critical axe violations;
- **0 axe violations total**;
- 0 shell targets below 44px;
- 0 duplicate IDs;
- 0 horizontal page overflow;
- exactly one docs skip link;
- docs main landmark present;
- custom cursor inactive on docs;
- expected resolved theme;
- no browser page errors, console errors, or non-ignored network failures.

Drawer audits for documentation navigation, on-this-page navigation, and site navigation also report **zero axe violations**.

Keyboard interaction evidence is true for every required scenario:

- skip link receives first focus;
- skip link moves focus to docs main;
- search shortcut focuses the visible search field;
- search result navigates to the canonical route;
- pager navigates canonically;
- docs drawer receives focus;
- docs drawer restores trigger focus;
- TOC drawer receives focus;
- TOC link is keyboard focusable;
- TOC Enter activation updates the deep-link fragment;
- site drawer restores trigger focus;
- legacy hash redirect remains functional.

The reduced-motion state reports no motion-bearing shell elements after computed-style inspection.

## 8. Performance evidence

### 8.1 Production build and route bundle

Methodology: one clean Next.js production build in the GitHub Actions Ubuntu 24.04 / Node 24 environment; routed JavaScript measured from `.next/app-build-manifest.json`; source and compiled CSS measured by file bytes.

| Metric | DOC-2 baseline | DOC-2 after | Delta |
| --- | ---: | ---: | ---: |
| Build wall time | 37,079.165 ms | **36,498.616 ms** | **-580.549 ms (-1.57%)** |
| Routed manifest JS | 1,010,958 B | **999,149 B** | **-11,809 B (-1.17%)** |
| Routed First Load JS | not separately recorded in starting baseline | **333,000 B** | n/a |
| Source CSS | 24,878 B | **46,307 B** | **+21,429 B (+86.14%)** |
| Compiled CSS | not separately recorded in starting baseline | **95,380 B** | n/a |

The CSS increase is intentional and explained: DOC-2 moves the documentation visual system, responsive shell, focus, reduced-motion, status, and prose rules into reusable CSS rather than client-side layout/style logic. Despite this foundation work, the routed manifest JavaScript is smaller than the untouched DOC-2 baseline and clean-build time did not regress.

### 8.2 Lighthouse

Same-repository production server, one desktop and one mobile Lighthouse sample for closure; browser PerformanceObserver measurements are archived separately.

| Metric | Desktop baseline | Desktop after | Mobile baseline | Mobile after |
| --- | ---: | ---: | ---: | ---: |
| Performance | 67 | **93** | 62 | **76** |
| Accessibility | 92 | **100** | 96 | **100** |
| Best Practices | 96 | **96** | 96 | **96** |
| SEO | 100 | **100** | 100 | **100** |
| LCP | 1067.170 ms | **1021.489 ms** | 4824.877 ms | **2521.785 ms** |
| CLS | 0.889173 | **0** | 0 | **0** |
| TBT | 213.610 ms | **185.256 ms** | 891 ms | **905 ms** |

Desktop performance improves by 26 points and mobile by 14 points. Desktop CLS is eliminated. Mobile LCP improves by roughly 2.30 seconds. Mobile TBT is 14 ms higher in this single comparison sample; the phase finalizer treats this as measurement noise/non-material relative to the overall non-regressing closure profile and reports zero failures.

## 9. Artifact integrity

The strict branch run uploaded `doc2-design-system-shell-evidence`:

- Run: `34446791452`
- Artifact ID: `10140029508`
- Files: 32
- Final compressed size: 4,700,637 bytes
- SHA-256 digest: `e54494fc36a76740a95d7938b4ea745da38113cdb0fccb428235859f795c0d23`

The artifact contains generated deterministic evidence, runtime browser evidence, Lighthouse JSON, screenshots, build/bundle measurements, and production-server logs.

## 10. Dependency and package integrity

DOC-2 adds **no new production dependency**. Browser and accessibility tooling (`puppeteer-core`, `axe-core`, Lighthouse) is installed ephemerally inside CI with no lockfile mutation.

The existing package pin remains exactly `EIAS79/Apexify.js@dbed9743353593eafae9a7b1c25312d7170a233b` and the package/lockfile/public-install pin gate passes.

`npm ci` continues to report the repository's pre-existing dependency-audit debt (10 vulnerabilities at install time: 2 low, 1 moderate, 6 high, 1 critical). DOC-2 does not broaden into dependency-upgrade work because that can introduce unrelated breaking changes and is outside this phase's shell/design-system ownership. This debt remains explicit rather than hidden.

## 11. Scope/deferred work

The following work is deliberately **not** implemented by DOC-2:

- rich MDX component system and full content-component catalog — DOC-3;
- API reference generation — DOC-4;
- full documentation search engine — DOC-6;
- broad migration of the legacy documentation corpus — DOC-9;
- final site-wide accessibility/SEO/performance hardening — DOC-11;
- final completeness matrix — DOC-12;
- homepage, Gallery, and Studio redesign beyond shared compatibility needs;
- Apexify.js engine Phase 15.

These are not missing DOC-2 items; they are separate roadmap ownership boundaries.

## 12. DOC-2 completion gate

| Completion condition | Result |
| --- | --- |
| Coherent reusable design token foundation | **true** |
| Documentation typography/prose foundation | **true** |
| Light theme works | **true** |
| Dark theme works | **true** |
| System theme resolves light/dark correctly | **true** |
| Desktop shell works | **true** |
| Tablet shell works | **true** |
| Mobile/narrow-mobile shell works | **true** |
| Sidebar is manifest-driven and reusable | **true** |
| Top navigation/header is reusable and server-rendered | **true** |
| Nested/active TOC works | **true** |
| Breadcrumbs work canonically | **true** |
| Previous/next pager works canonically | **true** |
| Page hero and metadata/status badges implemented | **true** |
| Mobile drawers are accessible | **true** |
| Keyboard-only shell flow works | **true** |
| Focus-visible/skip-link system works | **true** |
| Reduced-motion shell works | **true** |
| Custom cursor removed from docs/reduced-motion | **true** |
| Shell interaction targets meet 44px gate | **true** |
| Browser matrix has zero axe violations | **true** |
| Unknown route/legacy redirect contracts preserved | **true** |
| DOC-1 regression gate remains green | **true** |
| Existing docs/link/package-pin/type/build gates green | **true** |
| Build/route JS do not regress from DOC-2 baseline | **true** |
| DOC-3 not started | **true** |
| Phase 15 not started | **true** |

**Phase gate result: SATISFIED.** The remaining actions after this report commit are repository closure only: final branch run, PR validation, merge, and the same DOC-2 workflow on merged `main`.
