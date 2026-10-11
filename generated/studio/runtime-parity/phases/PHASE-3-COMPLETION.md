# STUDIO-PARITY-3 — createText + measureText Completion

Phase-0 inventory runtime: EIAS79/Apexify.js@a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a

Executed Studio package pin: EIAS79/Apexify.js@379a5248f09ed39c1b1734fe104b6bd73a77857f (6.0.0)

The Phase-3 runtime proof executes the upgraded Apexify.js package. Phase-0 historical inventory predates advanced createText CreateTextOptions; its 1,861 record classifications must not be interpreted as per-leaf certification of the expanded public API.

## Closure

| Metric | Count |
|---|---:|
| Public surfaces | 2 |
| Recursive records | 1861 |
| Input records | 1829 |
| Output records | 32 |
| FULL | 1739 |
| DEPRECATED-COMPAT | 90 |
| RUNTIME-ONLY | 32 |
| UNKNOWN | 0 |
| PARTIAL | 0 |
| MISSING | 0 |
| BLOCKED | 0 |

## Authoritative Studio ownership

- Left Text rail: insertion presets, system-font library and uploaded-font library only.
- Right inspector: Transform / Style / Effects / Data / Advanced through VisualTextInspector.
- createText(TextProperties[]): an ordered text batch, optionally rendered as one isolated group with call-level transforms.
- CreateTextOptions: isGrouped, groupTransform, group perspective/affine/opacity/blend and per-text perspective/affine; current runtime fixtures verify both transformation scopes.
- painterOpts.resolveAssetRefs: Data control for single text and text batches.
- measureText(): complete VisualTextMetrics schema; browser values are explicitly approximation-only while pinned-runtime output is certified separately.
- Legacy flat aliases remain compatibility inputs and canonical nested controls win.

## Runtime / round-trip evidence

- scripts/studio/parity/phase3-text-runtime.ts proves five fixtures: modern text, arrays, curved text, per-text perspective/font controls, and grouped transforms with asset options; also runtime metrics, Visual -> Code -> runtime byte equivalence, and Code -> Visual regeneration.
- scripts/studio/visual/phase6-text-fonts.test.ts owns UI, validation, batch lowering, painterOpts and reverse-sync regression cases.
- Runtime proof artifact: generated/studio/runtime-parity/phases/phase-3-text-runtime.json.

## Gate

**HISTORICAL INVENTORY CLASSIFICATION PASS — 1,861 previously inventoried records classified. This is not proof of every current API leaf; refer to version-specific rendering/round-trip tests for new options.**
