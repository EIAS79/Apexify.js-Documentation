# Apexify.js v6 aware Studio code generation

## What the optimizer understands

The optimizer lives in \`apexify-v6-optimizer.ts\`. It operates on a validated Studio operation plan, not on untrusted source text or regular-expression rewrites. It runs only for native / autosynced output; the preview path retains the original composition plan.

- \`painter.createImage(ImageProperties[], base)\`: draw multiple image and shape layers in array order. Filters, effects, masks, geometry and placement are already expressed in each \`ImageProperties\` object.
- \`painter.createText(TextProperties[], base)\`: draw ordered text objects with rich nested typography / effects on the same canvas.
- \`painter.batch()\` creates separate outputs from each operation, and must **not** replace a layer compositing pipeline.
- Explicit group transforms, call-level options, asset resolution, image preprocessing and analysis are semantically different operations, and are retained.
- Interleaved image/text layers are barriers. Moving images ahead of text changes occlusion and is not permitted.
- Generated buffers referenced again later are barriers; removing those intermediate results would invalidate dependent layers.
- The renderer's collection limit must be respected; auto-batches are capped at 32 entries for predictable code size.

## Two-way code sync invariant

An automatic batch uses a compact \`apexify-v6:auto-batch\` source marker with the original node IDs. The reverse compiler uses it to keep each visual element independent while allowing literal property edits. This marker is distinct from an intentionally authored image/text batch group. Never discard the marker unless intentionally converting to a grouped authoring structure. The reverse compiler rejects array-size changes with stale metadata to avoid silent layer loss.

## Avoid false transformations

\`painter.image.effects(source, filters)\` operates on the original source before placement. \`ImageProperties.filters\` operates in the raster layer pipeline, after source scaling/fit and with pre/post order relative to distortion and masking. These are not generally equivalent. Do **not** fuse source preprocessing into createImage filters without a documented, proven-safe case and pixel-parity tests.

## Further improvements

A full v6 semantic optimizer may share repeated value literals and produce named arrays only after the source parser supports variable bindings in both directions. The current version intentionally leaves inline literal arrays reversible and independently editable.
