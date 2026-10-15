# Frame documentation design QA

Status: passed for the implemented documentation layout.

## Scope and comparison

Implements the accepted Chapter Atlas / Build Desk hybrid: a wide reading area, charcoal/lime palette, compact lilac sculpture, chapter links and source/output views. Compared the reference and browser implementation side by side in [comparison](docs/design/frame-docs/comparison.jpg). Captures: [overview](docs/design/frame-docs/overview.jpg), [workbench](docs/design/frame-docs/workbench.jpg).

Intentional differences: existing verified titles and article content remain authoritative; the sculpture is smaller to preserve reading space; the editor loads on request. Node output stays explicitly labelled as verified output, not live browser execution.

## Verification

- Production build passed, including type checking and 481 generated pages.
- Three recursive-navigation tests passed: deep trails, package isolation with retained structural ancestors, and deriving selector entries from actual linked documentation.
- Desktop browser: no page overflow (1353px client and scroll widths); all images loaded; active Canvas branch expanded, could be collapsed and reopened; active leaf contrast corrected.
- Scoped createCanvas search returned 30 results including API members, headings and guides. Global search remains available in the header.
- Canvas workbench loaded on request with Both selected and source/output visible.
- Dark/light theme switched correctly; light logo contrast corrected.
- On-this-page drawer opened; selecting the overview navigated to its existing canonical anchor and closed the dialog.
- Mobile 390x844 CSS viewport: responsive header, article and horizontal chapters rendered; navigation drawer opened with the recursive Canvas branch and scoped search. This is a browser viewport check, not a physical-device test.
- Motion is limited to short entrance/disclosure transitions and disabled by reduced-motion CSS.

## Package architecture

Package choices come from the documentation manifest. Core, web, React, Next and other architecture targets without documentation are identified as planned, not fabricated destinations. Scope filtering supports recursive branches and preserves ancestors while excluding unrelated package links. Existing routes, heading IDs and backend search contracts remain intact.

## Environment

The latest main-branch branding commit was integrated before publication; the docs header now uses its canonical v2 logo. The captured layout predates that asset-only substitution.

Local generated manifests, dependencies and temporary preview helpers are excluded from the commit. Existing Browserslist notices are non-blocking. The API extraction setup notes from the homepage audit below still apply.

---

# Frame homepage design QA

Status: passed for the implemented homepage. Production deployment is not part of this change.

## Scope and visual reference

Implements the user's selected concept 3: charcoal canvas, lime typography, chrome/lilac APX artwork, a filmstrip, connected chapter navigation, a creative workspace and showcase films.

Compared the selected concept and a full-page browser capture side by side in one image. See [comparison](docs/design/frame-home/comparison.jpg), [desktop](docs/design/frame-home/desktop.jpg), [full page](docs/design/frame-home/full-page.jpg) and [mobile viewport](docs/design/frame-home/mobile.jpg).

The visual hierarchy, palette, hero composition and workspace structure match the chosen direction. Intentional differences: real Spectrum and Orbit films replace fictional gallery projects; workspace controls switch actual preview/source content and link to the existing Studio; an API directory and final install CTA complete the page. The APX artwork is labelled concept artwork, not a claimed library render. The hero animation is a camera motion study, not a live 3D renderer.

## Verified

- Production browser preview at 1363 × 936: readable hero, loaded images, no horizontal overflow (document width 1353px).
- Responsive iframe viewport at 390 × 844: legible headline and CTAs, stacked content, accessible menu; no horizontal overflow (content width 380px). This is a CSS viewport check, not a physical-device test.
- Timeline: playback, pause, thumbnail seeking, and a native keyboard-operable range input. Selecting frame 4 updates the accessible position to 3 seconds.
- Global motion control disables playback; system reduced-motion preference is handled in both CSS and JavaScript. Animation timers stop offscreen and when the document is hidden.
- Workspace: Charts selection and Source/Preview toggles update the pressed states and content; Composition restores the concept preview.
- Spectrum film opens in a native modal dialog; Escape closes it. Body scrolling is restored.
- Mobile menu opens, Escape closes it and returns focus to its trigger.
- Chapter links and Back to top navigate the document. All images loaded successfully.
- TypeScript: `npm run typecheck` passed.
- Production: `node node_modules/next/dist/bin/next build` passed, generating 481 pages. Homepage first-load JavaScript: 94.9 kB, including 7.25 kB route code. No new animation dependencies.

## Environment notes

The existing dependency postinstall could not reach raw.githubusercontent.com. The pinned web-adapter source was restored through the GitHub connector and verified against its exact blob hashes. The ignored API manifest was regenerated locally using `node --import tsx scripts/docs/doc4-extract.ts`; the tsx CLI's IPC listener is unavailable in this environment. These setup artifacts and preview helpers are excluded from the change.

The development preview initially served an invalid main-app chunk. Final browser checks used the successfully built production server; no application errors were observed after that switch. Browser-extension metadata errors were unrelated to the application. Existing outdated Browserslist notices remain build warnings.

## Remaining coverage

Physical iOS/Android behavior, automated accessibility scoring, live deployment and the existing server-side Studio render service were not tested by this homepage change. Copy-to-clipboard has success and failure feedback; clipboard permissions vary by host. These do not block the reviewed homepage implementation.
