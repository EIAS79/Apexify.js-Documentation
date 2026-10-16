# Gallery redesign: safe parallel QA + Work resume handoff

This directory is deliberately separate from gallery UI/runtime code. The QA
branch can be reviewed or cherry-picked after the paused Work session saves
its changes. **Do not overwrite Work's uncommitted edits.**

## Evidence and known state

From the user's screenshots of Work (not verified in GitHub):
- The chosen concept is #3, "Explore the possible", with **Use Cases,
  Explore, Templates, Examples**, a film stage and an editorial gallery.
- Work reported five actual Apexify.js-rendered templates, passing
  source/output checks, and an in-progress browser/build verification.
- Work reported fixing code-panel contrast and video duration, adding
  optional FFmpeg animation commands, and checking mobile.
- Work was still **before committing/merging**; no pushed branch, exact files
  or successful final CI was shown. Treat screenshots as a handoff, not as
  proof that the work has been saved outside its temporary workspace.

## First steps when Work usage becomes available

1. In the **original workspace**, inspect: pwd; git status --short;
   git branch --show-current; git log -1 --oneline; git remote -v.
2. Preserve uncommitted changes before cleaning, switching or pulling:
   create a backup branch; review changes for secrets/huge generated assets;
   commit all intended source/assets, and push that branch.
3. Report backup branch URL, commit SHA, changed files, exact test commands
   already run, and any failing checks. Do not rebuild the five templates
   before confirming their original sources and outputs are recoverable.
4. Compare the saved work with main only after the backup exists.
5. Integrate this QA directory independently if useful. Do not directly
   merge this draft PR into his active Work branch.

## Asset provenance and media verification

This zero-dependency Node script:
- Requires real source paths, except explicitly marked output-only showcases.
- Rejects unsafe traversal paths and outside-root symlinks.
- Rejects empty/oversized files and incorrect PNG/GIF/MP4 signatures.
- Validates PNG/GIF dimensions; uses system FFprobe for real MP4 video-stream,
  dimensions, and positive duration (requires FFprobe when MP4 is included).
- Computes streaming SHA-256 for all files.
- Enforces expected dimensions and optional minimum duration.
- Emits a machine-readable PASS/FAIL report; does not modify any assets.

Run regression tests:

    node --test scripts/gallery/qa/verify-assets.test.mjs

Create a manifest of the **actual** five gallery entries. The paths and
dimensions below are placeholders; do not treat them as existing repo files.

~~~json
{
  "templates": [
    {
      "id": "orbit-study",
      "source": "scripts/gallery/recipes/orbit-study.ts",
      "outputs": [
        {"path":"public/gallery/orbit-study.png","media":"image","width":1200,"height":630},
        {"path":"public/gallery/orbit-study.mp4","media":"video","width":1200,"height":630,"minDurationSeconds":2}
      ]
    },
    {
      "id": "film-only-showcase",
      "sourceKind": "showcase",
      "outputs": [
        {"path":"public/gallery/showcase.mp4","media":"video"}
      ]
    }
  ]
}
~~~

Run:

    node scripts/gallery/qa/verify-assets.mjs --manifest <actual-manifest.json> --report <report.json>

**Limitation:** This passes signature/geometry/metadata checks, not deep
image decoding, visual parity or source reproducibility. For source-backed
items, execute the advertised Apexify.js package/version, fonts and assets,
record the exact command, and compare regenerated output. If byte-for-byte
matches are unreasonable, document pixel/frame tolerance and the reason.

## Browser acceptance matrix for the resumed gallery

| Test | Acceptance |
|---|---|
| Viewport 1440 / 1024 / 768 / 390 / 320 | Desktop, tablet and narrow mobile work with no document horizontal overflow |
| Light / dark / system | Gallery and code contrast stay legible; 4.5:1 normal-text contrast target |
| Reduced motion | Final states and navigation remain functional |
| Keyboard | Tab focus; card Enter; dialog Escape; previous/next; focus returns on close |
| Use Cases / Explore / Templates / Examples | Every route/section contains genuine relevant examples |
| Search / filters | Real filtering, meaningful empty state, correct reset and selection |
| Five code-backed templates | Source matches real supported Apexify.js APIs; comments/imports are beginner-readable |
| PNG/GIF/MP4 outputs | Decodable, expected dimensions, correct file mapping |
| HTML video player | loadedmetadata succeeds; finite positive duration; seek and playback work |
| Copy / download | Complete selected source copied (imports/helpers included), not a misleading fragment |
| Studio transfer | Current edited source arrives in Studio without truncation |
| Modal sizing | Code pane and preview scroll independently at mobile sizes |
| Accessibility | No serious/critical axe defects; dialog accessible and focus managed |
| Build / tests | Typecheck, production build, existing docs gallery + Studio gates |
| Performance | Measure mobile load, output sizes, latency and frame behaviour |

Prior issues from Work require regression evidence:
**global theme made code text too pale**; **video duration could remain zero**.

Existing repository assets/tests to leverage rather than duplicate:
- scripts/docs/doc7-browser-verify.mjs — gallery, cross-viewport, axe.
- scripts/docs/doc8-browser-verify.mjs — Studio/browser integration.
- scripts/docs/doc7-performance-browser.mjs — Home/Gallery benchmarks.
- scripts/gallery/publish-peak-lab.mjs — existing Apexify output publish model.

Existing DOC-7 selectors may refer to the pre-redesign Gallery. Update those
assertions for intentional redesigns, without weakening core coverage.

## Recommended sequence

1. First back up and push Work's uncommitted changes.
2. Inventory all five source-backed templates and exact exports.
3. Run Node preflight, fix actual asset failures.
4. Run clean Apexify render/reproduction commands.
5. Complete mobile/light/dark/reduced-motion/video/code contrast checks.
6. Run typecheck and build, then relevant regression suites.
7. Collect screenshots and evidence; open Gallery PR for review.
8. Merge only after verification is complete.

## Isolation

Support branch: support/gallery-resume-qa-20261016 (draft PR).
All support changes are under scripts/gallery/qa.
Work can cherry-pick them later without replacing its CSS, components,
templates or generated artwork.


## Optional live browser smoke

This check requires a served local/preview site and the same puppeteer-core
tool used by existing documentation browser suites. Set CHROME_PATH to an
installed Chromium/Chrome executable and GALLERY_QA_URL to the site origin.

    CHROME_PATH=/path/to/chrome GALLERY_QA_URL=http://127.0.0.1:3000 \
      node scripts/gallery/qa/browser-smoke.mjs

Optional output variables: GALLERY_QA_REPORT=/tmp/gallery-browser.json and
GALLERY_QA_SCREENSHOT_DIR=/tmp/gallery-browser-shots.

The script probes the existing .apx-gallery-card-based UI. If Work replaces
those structural classnames, update selectors to the actual implemented
gallery before running. It checks desktop/tablet/mobile/narrow viewports,
inspector open/Escape/viewport bounds, source text presence where available,
real modal-video loadedmetadata/duration/dimensions, and page errors.

It does not replace axe, full interaction coverage, Studio transfer tests, or
a video seek/play test. The relevant additional checks remain in the table
above. A passing smoke test is not permission to merge without those gates.
