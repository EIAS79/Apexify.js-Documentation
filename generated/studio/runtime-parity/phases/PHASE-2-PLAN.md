# STUDIO-PARITY-2 — createImage Rebuild Execution Board

Runtime truth: `EIAS79/Apexify.js@a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a`

## Baseline
- Public surface: `ApexPainter.createImage`
- Phase-0 recursive records: **680**
- Input records: **679**
- Output records: **1**
- Unique input paths: **494**
- Current Phase-0 status: **680 UNKNOWN**, surface **PARTIAL**

## Rebuild policy
The pre-Phase-2 image editor is treated as a migration source, not architecture to preserve. Runtime semantics win over existing Studio behavior.

## Workstreams
- [ ] Runtime model parity: all ImageProperties / CreateImageOptions / painterOpts leaves
- [ ] Complete source model: URL/path, Studio asset refs, generated buffers, shapes
- [ ] Complete distortion: perspective/warp/bulge/pinch/twirl/wave + control handles + sampling
- [ ] Complete mesh warp: grid + modern/legacy control grids + sampling
- [ ] Filters/effects/mask/clip/stroke/shadow/box background
- [ ] Shape geometry and gradients
- [ ] Fourth argument: painterOpts.resolveAssetRefs
- [ ] True ImageProperties[] grouped createImage lowering
- [ ] CreateImageOptions.isGrouped / groupTransform
- [ ] One coherent selected-image inspector; left rail becomes insertion/library only
- [ ] Canonical Visual -> Code -> Visual reconciliation
- [ ] Pinned-runtime preview/code byte-equivalence fixtures
- [ ] 680-record Phase-2 evidence ledger with zero unexplained records

## UX structure
1. Source
2. Layout
3. Shape
4. Appearance
5. Filters
6. Mask & clip
7. Distortion
8. Mesh warp
9. Effects
10. Stroke / shadow / box background
11. Group composition
12. Runtime / asset references
13. Image utility stack (separate image.* API family, clearly labeled)

## Hard rules
- No JSON textarea as the primary way to reach public createImage options.
- No image property may be split across unrelated left/right editing surfaces.
- Left Images/Shapes rail is insertion/library only.
- All selected-image createImage authoring lives in one inspector component.
- No Studio-only validation stricter than the pinned runtime unless explicitly documented as editor safety.
- No FULL status without model + control + validation + preview + codegen + reverse-sync + persistence proof.
