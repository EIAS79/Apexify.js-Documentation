# Motion Field gallery templates

The five complete recipes live in `public/gallery/motion-field/source`. These are the exact files served by the gallery's source viewer and download links, not illustrative snippets. They use the repository's pinned Apexify.js runtime and DejaVu fonts, without external image services or generated artwork.

- Orbit study: projected orbital ribbons, gradient sphere, animated satellite.
- Signal flow: layered paths sampled from sine waves; looping phase.
- Launch card: editable headline, subtitle, caption and accent.
- Data pulse: six illustrative values rendered as dimensional bars.
- Prism type: repeating geometric panels and editorial typography.

Run a source file with Node 22+ to save its PNG beside the source. The two motion recipes accept `--animate` to render 48 frames at 12 fps and encode a four-second MP4 (FFmpeg required on PATH). MP4 output is padded by one row for yuv420p compatibility; the PNG remains 1200 × 675. The displayed WebP is an optimized derivative of that PNG. The original PNG download is byte-identical to a repeated render in the verified environment.

## Publish and verify

From the repository root:

```sh
node scripts/gallery/render-motion-field.mjs
node scripts/gallery/render-motion-field.mjs --check
node --import tsx --test scripts/gallery/motion-field/catalog.test.ts
```

Publishing renders each recipe twice and requires deterministic PNG bytes, saves the actual PNG, generates WebP previews, encodes the two videos, and writes SHA-256 source/output/video records in `lib/gallery/motion-field/render-proof.json`. The check mode rerenders and checks the committed proof, without replacing artifacts. Posters for existing showcase films and GIFs are extracted from their actual media.

Runtime install command for standalone users:

```sh
npm install github:EIAS79/Apexify.js#379a5248f09ed39c1b1734fe104b6bd73a77857f dejavu-fonts-ttf@2.37.3
```

Native renderer versions/platform differences can affect PNG encoding. Keep the exact runtime and font package for matching geometry and typography. The gallery does not run Node recipes in the browser. Its source endpoint only returns published catalog text; arbitrary paths and execution are not accepted.
