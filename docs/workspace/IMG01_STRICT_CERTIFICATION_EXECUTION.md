# IMG-01 strict createImage certification — executed scope and remaining gate

**Repo:** EIAS79/Apexify.js-Documentation. **Branch:** `codex/workspace-parallel-image`. **Accepted before campaign:** `949605b13aaf344867bd8a8b2c5fda5c0a104f5d`. **Pinned engine:** `379a5248f09ed39c1b1734fe104b6bd73a77857f`.

## Identity/strict status reconciliation

`docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json` matches 560 exact source inventory identities: 350 image/group paths + 1 painter-level boolean; 209 Canvas-owned paths excluded from this domain. **FULL 0; PARTIAL 346; BLOCKED 5.** The 330 accepted Stage A WORKSPACE_READY paths are **not** transformed into strict FULL by presumption. The strict release gate remains **NOT PASSED** under STUDIO-PARITY-17. Every path has a stable identity, declared type, runtime source, Stage A status, strict reason, evidence IDs, applicable criteria and outstanding criteria. There are 45 discriminant/union probes.

## Executed evidence and commands

- `node --test tests/workspace/image-strict-native-probes.test.mjs`: **121/121 native calls executed**, zero rejected. Includes 10 shapes, 17 filters, six distortions (warp handles and projective quad separately), alpha/luminance/inverse masks, clip, mesh, effects, ordered filters, gradients, seven gradient contexts, four shadow cases, native arrays/group transform and 28 direct field-option calls. Raw PNG hashes, effect comparisons and failures at `IMG01_STRICT_NATIVE_PROBES.json`. `IMG01-STRICT-NATIVE-BATCH`.
- `npx tsx --test tests/workspace/image-editor-implementation.test.ts tests/workspace/canvas-authoring.test.ts tests/workspace/canvas-image-layout-s13.test.ts tests/workspace/canvas-image-inherit-s14.test.ts tests/workspace/canvas-union-certification-s13.test.ts`: **37/37 passed**. `IMG01-STRICT-REGRESSION`.
- `npx tsx --test tests/workspace/image-strict-visual-code-parity.test.ts`: **1/1 passed**. Exactly one generated public-v6 executable Code composition includes all 10 shapes, 17 filters and six distortions; native Image arguments and generated Code produced byte-identical output PNG. `IMG01-STRICT-VISUAL-CODE-33`.
- `npm run typecheck`: **passed**, including new code parity test. `IMG01-STRICT-TYPECHECK`.
- Fresh Chrome 155 (isolated CDP profiles): representative Inspector/shape/filter/Graph/Undo/Redo browser acceptance **passed**, five screenshots in `img01-strict-chromium/`; separate warp-mode switch/Undo/Redo **passed**, two screenshots. **Caveats:** representative browser reload returned preview width 0 at its check; warp preview width was 0 when checked. Do not count either check as full raster-persistence proof. `IMG01-STRICT-BROWSER-EDITOR`, `IMG01-STRICT-BROWSER-WARP`.
- Fresh asset browser rerun **failed**: Image tool/picker failed to expose the expected `.aw-assets input[type=file]`; rerun exited abnormally. This is unresolved; accepted Stage A verified asset/mask/IndexedDB browser evidence was preserved and reverified, not falsely replaced. `IMG01-STAGEA-ASSET-BROWSER`.
- `npm run docs:generate:doc4` + `npm run build`: first build attempts reached compilation/static page generation but failed from Windows worker V8 out-of-memory. After stopping **only our strict-isolated Chrome processes**, ran controlled build with a temporary `experimental.cpus:1` in `next.config.js`; **build exit 0, 482 pages**, `/workspace` present. The exact original `next.config.js` and DOC-4 generation inputs were restored. `IMG01-STRICT-PROD-BUILD`, log `img01-strict-build-singleworker.log`.

## Implemented safely supported defect fix

Pinned image validator rejects type `warp` with both `points` (quad) and `controlPoints` (handle deformations). The Stage A Inspector could create this invalid combination. Updated `image-options.ts` fail-closed validation, `ImageOptionsEditor.tsx` mutually exclusive Quad / Control handles modes and at least one handle in handle mode; updated existing regression, new pinned-native warp probe and real Chromium mode-switch evidence. No runtime pin changes, no other lane edits.

## Remaining source-backed limitations and status protection

- **16 Stage A partial leaf identities:** seven conic `gradient.startAngle` paths (pinned implementation passes argument but tested rendered output 0 vs 180 identical in tested contexts); seven linear/radial `gradient.repeat`/reflect paths (context/geometry-dependent behavior, not universally effective; conic excluded); two flattened `ImageFilter.radius` paths (meaningful only for the three blur discriminants). None has a strictly complete leaf proof chain.
- **Four Stage A shadow side/corner paths:** grouped-transform `shadow.borderPosition` and `shadow.roundedCorners` produced identical raster outputs for all-vs-top-left comparisons in the fixture; individual image shadow variants produced **different** pixels. **Do not incorrectly say all four are native-inert.** The shared Inspector currently intentionally disables side/corner controls and the full authoring/geometry chain is not certified. Strict status remains blocked pending safe domain-specific resolution; no falsely working group control was added.
- **One painter-level option:** `resolveAssetRefs?: boolean`, not callback. It remains deliberately blocked from Workspace untrusted authoring. Only SHA-256-verified local image and mask bytes are accepted; no arbitrary URL, privileged registry or filesystem expansion.
- **330 other Stage A READY identities:** native family/variant proof alone does not satisfy *per-leaf* live Inspector option changes, Graph option edits, Code-to-Visual reversibility, undo/redo, IndexedDB and import/export, and browser output equivalence. All absent proofs are enumerated for each ledger record. FULL count must remain zero until all applicable STUDIO-PARITY-17 checks have direct evidence.

## Integration recommendation

Functional IMG-01 Stage A remains accepted and may enter **controlled cross-lane integration** under the previously documented shared-file layer-order/asset/codegen safeguards. **Strict per-option certification is not passed.** Neither this report nor the machine ledger asserts a FULL signoff or combined Workspace integration acceptance.

Evidence/recovery root on connected Windows: `C:\Users\khali\Documents\Apexify-IMG01-recovery`. All new strict browser screenshots/logs are in `img01-strict-chromium`; existing original Stage A artifacts remain unchanged.
