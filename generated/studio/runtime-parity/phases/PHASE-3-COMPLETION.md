# STUDIO-PARITY-3 — createText + measureText Completion

Phase-0 inventory runtime: EIAS79/Apexify.js@a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a

Executed Studio package pin: EIAS79/Apexify.js@db96446ef51ede70febb03892d86b599483a4302 (6.0.0)

The Phase-3 proof executes the package actually installed by Apexify.js-Documentation. The createText/measureText public text contracts are unchanged across the inventory and installed pins verified during this rebuild.

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
- createText(TextProperties[]): one explicit text-batch group preserving layer order.
- painterOpts.resolveAssetRefs: Data control for single text and text batches.
- measureText(): complete VisualTextMetrics schema; browser values are explicitly approximation-only while pinned-runtime output is certified separately.
- Legacy flat aliases remain compatibility inputs and canonical nested controls win.

## Runtime / round-trip evidence

- scripts/studio/parity/phase3-text-runtime.ts proves single text, arrays, curved text, painter asset resolution, runtime metrics, Visual -> Code -> runtime byte equivalence, and stable Code -> Visual regeneration.
- scripts/studio/visual/phase6-text-fonts.test.ts owns UI, validation, batch lowering, painterOpts and reverse-sync regression cases.
- Runtime proof artifact: generated/studio/runtime-parity/phases/phase-3-text-runtime.json.

## Gate

**PASS — all 1,861 recursive records are explicitly closed with zero UNKNOWN/PARTIAL/MISSING/BLOCKED records.**
