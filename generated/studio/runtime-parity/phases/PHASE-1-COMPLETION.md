# STUDIO-PARITY-1 — createCanvas Completion Report

> Deterministic evidence closure generated from the Phase-0 recursive Canvas inventory.

## Status

- Phase: `STUDIO-PARITY-1`
- Domain: `createCanvas`
- Status: **COMPLETE**
- Runtime SHA: `a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a`
- Runtime package version: `6.0.0`

## Recursive accounting

| Measure | Count |
|---|---:|
| Public surface | 1 |
| Recursive records | 595 |
| Input records | 298 |
| Output records | 297 |
| Unique input paths | 217 |
| `FULL` | 295 |
| `DEPRECATED-COMPAT` | 3 |
| `RUNTIME-ONLY` | 297 |
| `UNKNOWN` | 0 |
| `PARTIAL` | 0 |
| `MISSING` | 0 |
| `BLOCKED` | 0 |

The 298 input records close as **295 FULL + 3 DEPRECATED-COMPAT**. The 297 output records close as **RUNTIME-ONLY** because `CanvasResults` is observable runtime result data, not Studio authoring input.

## Deprecated compatibility

- `canvas.shadow.borderPosition` — deprecated alias of `roundedCorners`; preserved and migrated explicitly.
- `canvas.videoBg.autoplay` — accepted compatibility flag; still-frame background means no rendering effect.
- `canvas.videoBg.loop` — accepted compatibility flag; still-frame background means no rendering effect.

## Final gap closed

- `painterOpts.resolveAssetRefs` is now modeled at `document.canvasPainterOpts.resolveAssetRefs`, exposed in Advanced, passed through preview execution, emitted as the trailing `createCanvas` argument, reconciled from literal code, and verified against the pinned runtime asset registry.

## Runtime/Studio proofs

- Canvas regression suite: validation, resource limits, defaults, gradients/patterns, layer variants, deprecated compatibility, UI coverage.
- Pinned runtime proof: Studio operation-plan preview and generated Apexify.js source are byte-equivalent.
- Reverse proof: generated canonical Canvas source reconciles to the same VisualProject and regenerates stably.
- Asset-ref proof: `$name` Canvas values resolve through `painter.assets` only when the trailing option opts in.
- Runtime edge proof: Studio no longer rejects stroke/shadow numeric values accepted by pinned Apexify.js.

## Gates

- [x] `pinnedRuntimeMatchesBaseline`
- [x] `oneCreateCanvasSurface`
- [x] `exactRecordAccounting`
- [x] `authorableInputsComplete`
- [x] `deprecatedCoverage`
- [x] `painterOptsOwned`
- [x] `runtimeOutputsExplicit`
- [x] `noUnexplainedStatuses`
- [x] `noUnknown`
- [x] `noPartial`
- [x] `noMissing`
- [x] `noBlocked`
- [x] `complete`

## Remaining cross-phase responsibility

- Browser/full-runtime capability negotiation remains owned by **STUDIO-PARITY-16**. Phase 1 proves the complete Canvas authoring contract against the pinned authoritative runtime and preserves explicit compatibility boundaries.
- Cross-domain asset authoring UX remains reusable infrastructure for later domains, but the createCanvas trailing asset-resolution option itself is complete here.

## Next phase

Proceed to **STUDIO-PARITY-2 — createImage + image/shape composition** only after this report remains green in CI.

