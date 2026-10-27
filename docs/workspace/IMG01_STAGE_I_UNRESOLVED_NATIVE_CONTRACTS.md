# IMG-01 — Pinned native contract audit and upstream remediation proposal

**Engine pin:** `379a5248f09ed39c1b1734fe104b6bd73a77857f` (unchanged).
**Certification scope:** 351 Image-specific records from 560 original identities; 209 Canvas-owned identities excluded.
**Status:** This is a source-backed **limitation record**, not permission to promote incomplete paths.

## 1. Remaining READY path: `images.inherit`

The Image editor implements an Inspector toggle, canonical project/model storage, generated Code, typed Graph non-applicability, native preview, Undo/Redo, IndexedDB restoration, and real saved-project export/import. The final strict gate that remains false is **`nativePixelOutput`**.

In the installed, pinned Apexify v6 ESM implementation, `inherit` is referenced in image-*background* validation/paint (bundled `dist/esm/index.js` lines approximately 1947 and 2516) and `createCanvas` background-size inheritance (line approximately 3309). Inspection of the pinned runtime shows **no `createImage()` per-layer read of `images.inherit`**. Exact target-only Image-layer native comparisons and alternate geometry did not show a reproducible pixel difference. The browser control is therefore authorable but the presumed native behavior cannot be certified.

**Upstream proposal:** explicitly specify the semantic contract for `ImageProperties.inherit` and implement it in the `createImage` rendering path if supported (image intrinsic source dimensions relative to explicit width/height, precedence against fit/align, shape behavior, and grouped rendering). Add an upstream type-level and renderer test proving target-only changes on a rectangular, nonuniform source. If the option belongs only to canvas background, remove or deprecate it from Image declarations and reflect that as an explicit unsupported option rather than a silent no-op. **Requires independent engine maintainers' approval.** Do not repin or patch the engine in this Image Workspace lane.

## 2. Original 16 Stage A PARTIAL contracts

Each record retains its original immutable identity and status. Previous isolated `IMG01_STRICT_LIMITATIONS_CLOSURE.json` includes concrete executed probes and comparison hashes; the new 330 READY signer does **not** silently reclassify these original union-dependent records.

| Source option paths | Number | Native source contract and observed limitation |
|---|---:|---|
| `images.boxBackground.gradient.startAngle`; `images.shadow.gradient.startAngle`; `images.shape.gradient.startAngle`; `images.stroke.gradient.startAngle`; `options.groupTransform.boxBackground.gradient.startAngle`; `options.groupTransform.shadow.gradient.startAngle`; `options.groupTransform.stroke.gradient.startAngle` | 7 | Conic-only. Pinned `createGradientFill` in `dist/esm/index.js` ~line 556 reads `startAngle` into `ctx.createConicGradient`; previous exact conic 0°/180° fixtures did not show target-only changed pixels for the tested geometry. This **does not prove general native ineffectiveness**: verify asymmetric stop placement and coverage in each host painting context before promotion. |
| `images.boxBackground.gradient.repeat`; `images.shadow.gradient.repeat`; `images.shape.gradient.repeat`; `images.stroke.gradient.repeat`; `options.groupTransform.boxBackground.gradient.repeat`; `options.groupTransform.shadow.gradient.repeat`; `options.groupTransform.stroke.gradient.repeat` | 7 | Linear/radial-only. Pinned `createGradientFill` ~lines 514–554 applies `repeat` through `createRepeatingGradientPattern` for linear/radial; the conic branch does **not** read repeat. `no-repeat` and `repeat` / reflect native probes have mixed effective/inert cases across geometry. Require union-specific authoring and independent native parity for repeat/reflect in each paint host; do not claim repeat applies to conic. |
| `images.filters.radius`; `options.groupTransform.filters.radius` | 2 | `radius` belongs to the `gaussianBlur`, `motionBlur`, and `radialBlur` discriminant branches, not every filter. Previous native probes for these three blur types executed and showed pixel change. A **flattened union-wide** radius leaf cannot be universally FULL; certify separate discriminated cases rather than inventing a generic filter radius property. |

**Disposition:** these 16 original Stage A PARTIALs remain PARTIAL until each has a union-specific end-to-end authored, validated, exact native and generated-Code proof. No known Image-only authoring fix justifies overriding that gate at this checkpoint. The source implementation *does* consume conic startAngle, so its lack of observed effect in earlier symmetric fixture is a **fixture/output uncertainty**, not an asserted upstream no-op.

## 3. Remaining protected BLOCKED contracts

Four Image/Group shadow corner/side-geometry restrictions remain `BLOCKED_UPSTREAM` (native contexts not consistently discriminating); one privileged `resolveAssetRefs` painter option remains `BLOCKED_SECURITY`. Do not enable unrestricted asset resolvers or bypass content-addressed asset validation.

## 4. Reproduction and acceptance requirements

- Use pinned public `ApexPainter.createImage()` and exact source identities; change the target property alone.
- Use valid asymmetric RGBA and gradient fixtures with distinct stop colors and nondegenerate geometry; repeat across source/shape/group context.
- For conic `startAngle`, separately sample angle 0° and 180° with confirmed non-symmetric stop configuration and visible paint region.
- For linear/radial `repeat`, test `no-repeat`, `repeat`, `reflect` only where the public type permits; do not conflate conic with those modes.
- For each actual native effect, independently execute generated public-v6 Code, compare PNG/RGBA, verify control, Graph, model, Code reconciliation, undo/redo, reload, and project import/export.
- Require reproducible source hashes and fail-closed signer/integrity checks. No change to the pinned engine in this lane.

**Upstream issue title:** `createImage ImageProperties.inherit accepted/serialized but appears unconsumed by pinned native Image renderer`.
**Upstream issue target:** `EIAS79/Apexify.js`; prepare for owner review, **do not auto-file**.
