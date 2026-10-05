# STUDIO-PARITY-3 — createText + measureText Rebuild Execution Board

Runtime truth: `EIAS79/Apexify.js@a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a`

## Baseline

Phase-0 text-domain inventory:

| Surface | Recursive records | Inputs | Outputs | Unique input paths | Unique output paths |
|---|---:|---:|---:|---:|---:|
| `ApexPainter.createText` | 1,205 | 1,204 | 1 | 700 | 1 |
| `ApexPainter.measureText` | 656 | 625 | 31 | 358 | 31 |
| **Total** | **1,861** | **1,829** | **32** | — | — |

Current Phase-0 state:
- 2 public surfaces: `PARTIAL`
- 1,861 recursive records: `UNKNOWN`
- 21 createText union variants and 20 measureText union variants detected by the Phase-0 inventory
- Legacy/deprecated compatibility is part of the public contract and must be classified explicitly

## Runtime families to close

### createText
- [ ] single `TextProperties` and `TextProperties[]` semantics
- [ ] `canvasBuffer` ownership and chaining semantics
- [ ] fourth-argument `painterOpts.resolveAssetRefs`
- [ ] text/content source forms
- [ ] nested `font` object: family, name/path identity, size, weight, style and runtime font resolution
- [ ] uploaded Studio font identity and generated canonical source
- [ ] `layout`: line height, letter spacing, word spacing, wrapping and max dimensions
- [ ] `placement`: position, alignment, baseline, rotation and related transform semantics
- [ ] `fill`: solid color, opacity and gradients
- [ ] stroke
- [ ] decorations: bold/italic/underline/overline/strikethrough and structured decoration options
- [ ] effects: shadow, glow, highlight and all nested runtime options
- [ ] text-on-curve / `TextCurveConfig`
- [ ] array/batch ordering and per-item identity
- [ ] canonical defaults and omission semantics
- [ ] runtime resource limits, validation and failure behavior
- [ ] supported legacy aliases as `DEPRECATED-COMPAT`, never silently dropped

### measureText
- [ ] complete recursive `textProps` input parity
- [ ] fourth-argument/runtime asset reference semantics where public
- [ ] all 31 output records modeled and classified explicitly
- [ ] measurement result schema exposed truthfully where visually useful
- [ ] createText/measureText shared text-property semantics stay structurally aligned
- [ ] browser/full-runtime differences are explicit

## Known legacy aliases to reconcile

The runtime inventory reports compatibility aliases including:
- `fontFamily` → `font.family`
- `fontName` → `font.name`
- `fontPath` → `font.path`
- `fontSize` → `font.size`
- `bold` / `italic` → `decorations.*`
- `color` / `opacity` / `gradient` → `fill.*`
- `letterSpacing` / `wordSpacing` / `lineHeight` / `maxWidth` / `maxHeight` → `layout.*`
- `rotation` / `textAlign` / `textBaseline` → `placement.*`
- `shadow` / `glow` / `highlight` → `effects.*`
- `underline` / `overline` / `strikethrough` compatibility forms
- `textOnCurve` compatibility semantics

## Workstreams

- [ ] Build deterministic Phase-3 ledger/finalizer from the Phase-0 1,861-record inventory
- [ ] Audit pinned runtime implementation + text validation before changing Studio behavior
- [ ] Replace broad text capability claims with per-record evidence
- [ ] Consolidate selected-text authoring into one authoritative typed inspector
- [ ] Ensure the left Text rail is insertion/library-only
- [ ] Remove raw/untyped fallback editing for public text options
- [ ] Complete VisualProject model for the runtime text contract
- [ ] Align Studio validation with pinned runtime rules/defaults/resource limits
- [ ] Make compiler/codegen emit canonical `createText()` source
- [ ] Implement canonical Code → Visual reconstruction for reversible text semantics
- [ ] Add `measureText()` representation and result proof without faking unsupported visual authoring
- [ ] Prove undo/redo, autosave, persistence and project export/import
- [ ] Add pinned-runtime equivalence fixtures
- [ ] Add browser/full-runtime proof and controlled Vercel Studio checkpoint
- [ ] Generate Phase-3 completion report with zero unexplained records

## Hard rules

- No `FULL` status without model + control + validation + preview + codegen + reverse-sync/persistence evidence where authorable.
- Runtime implementation and validation source beat old Studio behavior.
- Deprecated aliases remain explicit compatibility evidence; canonical controls prefer modern nested fields.
- Do not solve parity with a raw JSON textarea.
- Do not conflate `createText(TextProperties[])` semantics with unrelated grouping behavior.
- Do not claim measurement parity unless all public result fields are accounted for.
- No merge until pinned-runtime certification and the deployed Studio checkpoint are green.

## Gate

Phase 3 is complete only when:
- all 1,861 Phase-0 recursive records have explicit evidence/status;
- no unexplained `UNKNOWN`, `PARTIAL`, `MISSING` or `BLOCKED` records remain;
- representative Visual → Code → pinned runtime artifacts/results are equivalent;
- reversible canonical code updates reconstruct Visual state;
- persistence/undo/export evidence is green;
- browser/full-runtime differences are explicit;
- dedicated Phase-3 certification is green;
- controlled `studio-preview` smoke verification is green.

