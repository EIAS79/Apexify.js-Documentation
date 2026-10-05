# STUDIO-PARITY-2 — createImage Completion Report

> Deterministic evidence closure generated from the Phase-0 recursive image inventory.

## Status

- Phase: `STUDIO-PARITY-2`
- Surface: `ApexPainter.createImage`
- Status: **COMPLETE**
- Runtime SHA: `a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a`
- Runtime version: `6.0.0`

## Recursive accounting

| Measure | Count |
|---|---:|
| Public surfaces | 1 |
| Recursive records | 680 |
| Input records | 679 |
| Unique input paths | 494 |
| Runtime output records | 1 |
| `FULL` | 676 |
| `DEPRECATED-COMPAT` | 3 |
| `RUNTIME-ONLY` | 1 |
| `UNKNOWN` | 0 |
| `PARTIAL` | 0 |
| `MISSING` | 0 |
| `BLOCKED` | 0 |

The 679 input records close as **676 FULL + 3 DEPRECATED-COMPAT**. The returned Buffer closes as **RUNTIME-ONLY**.

## Rebuild outcome

- Deleted the old scattered selected-image inspector implementation.
- Added one typed `VisualImageInspector` for image/shape layers and one `VisualImageBatchInspector` for `ImageProperties[]` calls.
- Left Images/Shapes rails are insertion/library surfaces only.
- Added all six distortion variants, warp handles, interpolation/edge modes and modern/legacy mesh grids.
- Added fourth-argument `painterOpts.resolveAssetRefs` ownership.
- Added true `createImage(ImageProperties[])` lowering and reverse sync.
- Preserved the semantic distinction between array batching and `isGrouped` temporary grouped rendering.
- Removed raw JSON as the primary path to public createImage options.

## Deprecated compatibility

- `images.shadow.borderPosition`
- `images[].shadow.borderPosition`
- `options.groupTransform.shadow.borderPosition`

All remain compatibility aliases; `roundedCorners` is preferred.

## Gates

- [x] `pinnedRuntimeMatchesBaseline`
- [x] `oneCreateImageSurface`
- [x] `exactRecordAccounting`
- [x] `userInputsComplete`
- [x] `canvasBufferOwned`
- [x] `arrayOwned`
- [x] `optionsOwned`
- [x] `painterOptsOwned`
- [x] `deprecatedCoverage`
- [x] `runtimeOutputsExplicit`
- [x] `noUnexplainedStatuses`
- [x] `noUnknown`
- [x] `noPartial`
- [x] `noMissing`
- [x] `noBlocked`
- [x] `complete`

## Certification

Phase completion additionally requires the dedicated certification workflow to pass the fast image suite, pinned runtime proof, deterministic ledger check and parity TypeScript check.

## Next phase

Proceed to **STUDIO-PARITY-3** only after this report and certification remain green.

