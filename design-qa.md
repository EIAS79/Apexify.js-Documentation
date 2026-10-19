# Independent workspace design QA — 2026-10-19

Final result: passed

Scope: the implemented desktop workspace foundation and its supported composition flows. This is a faithful reconstruction of the supplied direction, not a pixel-identical copy or a complete implementation of every illustrated media/editor feature.

## Visual truth and normalization

- Source: `docs/design/workspace/reference.png`, user-supplied 1536×1024 image.
- Browser route: `http://terminal.local:4173/workspace`.
- Final implementation: `docs/design/workspace/desktop.jpg`, 1363×936 pixels; CSS viewport 1363×936; devicePixelRatio 1.
- Source density is unspecified. For comparison it was proportionally resized to 1363×909, then aligned at the top with the 1363×936 implementation. The extra 27 px of implementation height is a viewport difference, not a spacing defect. The browser API did not expose viewport resizing. These comparisons cannot establish pixel identity.
- State: dark interface, reference preset, default panel layout, Terminal closed but recoverable, Canvas properties, completed real PNG job, no selected layer or open menu, no account controls.
- Full comparison: `docs/design/workspace/comparison.jpg`.
- Focused comparisons: `docs/design/workspace/header-canvas.jpg` and `docs/design/workspace/editors-output.jpg`. These compare actual source and browser pixels together, including typography, header mark, tools, dense editors, inspector, and output controls.

## Findings and iteration history

Iteration 1 (`docs/design/workspace/iteration-1.jpg`) found two actionable P2 differences: hero typography sat too low and the tools list hid project actions below the fold. The preset title was moved from y=240 to y=180, enlarged to 100 px, and the supporting text/CTA were raised accordingly. Tool row padding was reduced from 10 to 5 px, with smaller group/search gaps. Final captures show the corrected hero and visible Open project, Files, and Settings actions.

Earlier implementation checks also corrected clipped graph output by starting at 65% zoom, exposed close/maximize controls on the canvas and properties panel, matched rounded CTA stroke to fill, and made Fit canvas calculate its actual fit. A 390×844 CSS iframe check found that hiding the mobile Render text removed its accessible name; `aria-label="Render"` resolves it. Those corrections are present in the final browser state.

No actionable P0/P1/P2 visual finding remains within the reviewed foundation scope. Expected differences and residual coverage are explicit below.

## Required fidelity surfaces

- **Typography:** Arial/Helvetica UI typography and monospace CodeMirror retain the compact hierarchy. Real Apexify output uses DejaVu Sans for reproducibility. The raster mock's exact typeface is unavailable; its hero hierarchy, white/yellow treatment, and approximate scale are recreated. Actual code is valid v6 source and is longer than the illustrative mock.
- **Spacing/layout:** tools left, visual above code/graph, properties right, queue/preview/export below. The split system uses contained rectangular windows so closing panels genuinely reclaims space; the mock's output graph overhangs another region. Inspector fills its available column rather than floating above unused space. Graph scrolls for additional real layers. These are expected working-layout differences. All persistent desktop controls stay inside the viewport; measured document width is 1363 px.
- **Colors/tokens:** navy canvas/panels, cyan separators and selection, violet graph controls, yellow active navigation and brand suffix match the supplied direction. The implementation keeps restrained glows around controls so text remains legible; the raster mock has stronger atmospheric glow.
- **Image quality/assets:** generated crystal-lake art and transparent faceted A mark preserve subject, palette, and composition. Artwork is 1600×900 WebP; logo is a downsampled 96×96 transparent WebP. These are recreated assets, not exact extracted source pixels. Heroicons provide actual interface icons. Graph connections are exact canvas geometry for the model, not a raster imitation.
- **Copy/content:** Workspace replaces Studio and the navigation route is `/workspace`. No login/profile/dashboard. Inspector describes the actual image background and Node renderer instead of displaying unsupported toggles. Queue content reflects real jobs rather than simulated progress/MP4 timelines. Pending advanced tools show explicit status dialogs. Terminal is labelled as a workspace command console.

## Behavior and engineering checks

- Closing Code expanded Graph from approximately 399 to 855 CSS px. Reopening restored both panels. All nine panels could be closed and restored through the permanent controls.
- Keyboard resizing expanded Code from 450.125 to 467.109 CSS px. Terminal commands produced real composition information. Panel state, composition, and code drafts live outside window mounts.
- Canonical code data edits applied to the composition; inspector text edits appeared in generated code. Unsupported program edits showed the explicit synchronization boundary and remained unsynchronized when Code reopened.
- Live and queued output came from Apexify v6. The seven contract/runtime tests passed; generated public-v6 source produced byte-identical output to the server renderer.
- A browser PNG export completed; downloaded bytes were PNG, 1280×720, 1,526,662 bytes. Source-download completion remained unverified after incomplete cloud-browser downloads; program runtime parity was independently tested.
- New-route isolated type checking passed. Isolated Next production build passed, including type validation and route tracing. Full repository validation remains blocked by pre-existing Studio/vendor and old documentation-test type errors; old code was left untouched.
- Final application console check filtered to `terminal.local` returned no errors/warnings. Earlier unsupported-code errors were expected user-facing validation. Historical extension metadata errors belong to the browser extension, not the page.
- Responsive panel switching and mobile Render accessibility were checked in a 390×844 CSS iframe. A mobile screenshot attempt timed out; no physical-device or full mobile visual acceptance is claimed.

## Remaining work and polish

Dedicated media/path/component editors, arbitrary program execution, arbitrary graph authoring, and expanded preset content remain outside this foundation. Root-layout/global-style integration in the complete documentation app, production deployment, full keyboard/screen-reader auditing, and physical mobile tests remain pending. P3 refinement: a closer licensed font/asset match could reduce differences from the raster reference. These limitations do not change the reviewed desktop layout's result.

Implementation checklist: corrected P2 findings; repeated combined visual comparison; verified core interactions and PNG output; documented pending adapters and integration coverage. Preserve the earlier unrelated design reports below.

---

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
