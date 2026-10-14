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
