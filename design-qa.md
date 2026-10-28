# Balanced Workspace design QA — 2026-10-28

Scope: selected concept 1 applied to the existing `/workspace`, with working native Canvas/Text/Image controls. This is UI acceptance, not complete Workspace production certification.

## Visual truth and normalization

- Selected source: `/workspace/scratch/680f87c72b7c/generated_images/exec-afacae94-bf3a-4477-927f-d069a2ba94e9.png`, 1837×856 pixels. Review copy: `docs/design/workspace/balanced/selected-concept.jpg`.
- Implementation: real Next `/workspace`, loaded through the cloud browser. The browser exposes a fixed 1363×936 screenshot viewport, so a temporary iframe rendered the app at exactly 1837×856 CSS px and scaled it uniformly by 0.72 for capture. The app region was cropped to 1323×617 pixels. Source was resized to the same dimensions. No UI was recreated or overlaid in the harness.
- Implementation capture: `docs/design/workspace/balanced/desktop-final.jpg`. CSS viewport 1837×856, browser DPR 1, capture scale 0.72. Temporary viewport harness files are excluded from the change.
- State: dark theme; existing Hero composition and its real source; no selected layer; Background category; Cover/Center/100%/0px preserves the original artwork; completed native PNG job; Code and Queue tabs active; inspector scrollTop 0.
- Full-view comparison: `docs/design/workspace/balanced/comparison-final.jpg`. Focused comparisons: `comparison-inspector.jpg` and `comparison-editors.jpg`. Source and implementation pixels are together in each comparison input.
- Responsive evidence: `mobile-final.jpg` and `mobile-help.jpg`, real app in a 390×844 CSS viewport, DPR 1. This checks responsive Chromium behavior, not physical mobile hardware.

## Findings and comparison history

1. Initial implementation was blocked: the right inspector hid Fit/Alignment/Opacity/Blur in advanced sections; the native graph opened on a clipped output node; legacy purple cards and magenta scrollbars leaked through; code type was too small. Evidence: `comparison-before.jpg` and `desktop-before.jpg` (with the earlier live screenshot observations recorded in the task).
2. Fixed the graph viewport and compact node cards; contained React Flow theme variables and scrollbars; increased readable editor text; replaced glyph icons with the existing icon library; preserved inactive tab contents and accessible panel controls.
3. The first full/focused comparison still found a material inspector gap. Brought image Fit, Alignment, Opacity, and Blur directly into Background and wired them to validated project fields, the native renderer, generated code, and v1/v2 migration. New native tests show real pixel differences and exact generated-program parity. Reordered Background layers and Pattern & noise below those controls.
4. Corrected an intermediate screenshot that had auto-scrolled after keyboard testing. Reopened the app and verified inspector scrollTop 0 before the final capture. Final full and focused comparisons show the expected panel composition, category strip, controls, spacing, and charcoal/yellow branding. No actionable P0/P1/P2 visual findings remain.

## Required fidelity surfaces

- **Fonts/typography:** local Frame Inter, matching the homepage; compact regular labels and stronger selected tabs. Code uses a monospace face with usable line height. Small UI text remains readable at its actual CSS size. A few labels are slightly more compact than the mock (P3).
- **Spacing/layout:** same left tools, large upper-center Canvas, Code/Terminal beside Graph, bottom result tabs, and full-height right inspector. Pane splitters, 10px panel corners, consistent field spacing, and scrolling keep controls reachable. The inspector is independently scrollable on mobile.
- **Colors/tokens:** `#111111` base, `#191919` panels, white/muted text, `#F7FF00` primary/selected states. No blue accent is used for app chrome. Code syntax and original project artwork retain their meaningful colors. Light theme uses readable contrast; gutter contrast is tested in both themes.
- **Assets/image quality:** exact `/brand/apexify-lockup-v2.avif` homepage logo; existing crystal artwork; native PNG output; Heroicons for UI and graph nodes. No rasterized interface, redraw of the wordmark, or fabricated graph artwork.
- **Copy/content:** actual project title/text/code and typed graph are preserved. The mock's invented marketing composition, glow/color-grade graph nodes, and sample program are not implemented as fictional functionality. Planned media tools remain labeled and grouped separately.

## Browser interaction evidence

Verified in the cloud browser: native PNG rendering; canvas-width edit reflected in generated code and a decoded 1200×720 PNG; Undo; text content/font editing; native measurement (677.04×67.20px for the test text); Terminal `inspect`/`clear`; Code/Terminal switching; keyboard arrow tab activation; Queue thumbnail opens Preview; all four Canvas categories; desktop and mobile Fit help; live background Fit and Blur edits. Mobile help bounds were left 12/right 296/top 521/bottom 691, with Escape removing the note and returning focus.

Browser console was checked. A truncated development chunk caused a SyntaxError before the preview wrapper was fixed to buffer/compress static development assets; that error did not recur after recovery. An unrelated browser-extension metadata error remains outside app code. React Flow's attribution warning was addressed by keeping its attribution visible.

## Test and release limits

- TypeScript passed; 117 focused tests passed. New background-control cases verify actual native pixels and generated-program byte equality, including a procedural-overlay case. Dock tests verify active/fallback tab visibility while preserving mounted content.
- The file chooser completed after a long browser-tool delay, but this HTTP preview lacks Web Crypto, so image import cannot complete here. The UI now explains that uploads require HTTPS or localhost. Existing upload validation and native image parity pass; a fresh HTTPS end-to-end upload remains a release follow-up. No substitute or mocked image API was used.
- Updated standalone browser scripts were not executed in this iteration; browser interaction used the cloud browser.
- Full-site production prerender/search checks have pre-existing documentation-generation blockers. This change is not merged or deployed and does not certify unimplemented media/path/component editors.

## Implementation checklist

- [x] Apply selected composition to the existing workspace.
- [x] Reuse canonical logo and bright homepage accent.
- [x] Group editor/output tabs and preserve native functionality.
- [x] Show real image-background controls with contextual help.
- [x] Verify native model/source/render parity and responsive help.
- [x] Recompare final source and rendered screenshots at the same app viewport.

## Follow-up polish

P3: graph port labels can use further density tuning at narrow desktop widths; actual typed nodes are deliberately retained rather than replaced by the mock's invented nodes. Physical-device touch QA and HTTPS image-upload verification remain release checks.

final result: passed
