# IMG-01 — Stage H strict source and browser certification

**Repository:** `EIAS79/Apexify.js-Documentation`
**Worktree/branch:** `D:\ApexifyWorkspaceParallel\IMG01_RECOVERY_20261025\image_reconstructed_checkout` / `codex/workspace-parallel-image`
**Accepted Stage G HEAD:** `4856b211e496568b3f2a1f6295b9f28c40f835b6`
**Unchanged pinned engine:** `379a5248f09ed39c1b1734fe104b6bd73a77857f`
**Integrity status:** PASSED, source-equivalent recovered branch; no recovered original Image ancestry.

## Fail-closed outcome

| Strict status | Stage E baseline | Stage G | Stage H |
|---|---:|---:|---:|
| FULL | 241 | 316 | **329** |
| PARTIAL | 105 | 30 | **17** |
| BLOCKED | 5 | 5 | **5** |
| Total Image scoped | 351 | 351 | 351 |

Exactly **88 of the owner's original 105 PARTIAL paths** now have independently verified FULL proof. The original source inventory has **560 identities**, of which **209 Canvas-owned** are not Image certification targets. **329/330 previously READY** Image paths have every applicable exact criterion signed; **1/330 remains PARTIAL** (`images.inherit`). No evidence gate has been bypassed to promote a path.

## Stage H verified fixes

- **Real verified image-mask source uploads.** Browser-file-picker input uses the original independently SHA-verified embedded PNG bytes, via the Image Inspector's real upload control, then verifies mask source changes, Inspector/Graph/history, IndexedDB reload and real project export/reimport. Source provenance and content-addressing are preserved, without mock upload events.
- **Image Group mesh enabling creates a valid grid.** The Group mesh toggle formerly produced an incomplete `{gridX:1,gridY:1}` native object; the editor now creates four rectangular `controlPoints` with explicit bilinear interpolation and transparent edge mode. Chrome production visual output, Graph, history, reload and file export/reimport passed.
- **Actual layer identity selection.** Duplicate layer names previously caused the browser test to edit the second image but inspect the first. Browser automation now selects by immutable layer ID.
- **Falsy/absent canonical values.** Inspector/Graph history tests now correctly handle `false`, `0` and `undefined` as meaningful changed values, and record an explicit absent-option proof marker before real file-picker recovery.
- **Selector and native edge discrimination.** Keyboard-operated enum changes and `bicubic` mesh boundary sampling enabled exact reproducible edge-mode effects under their correct native context; independent output PNG and generated Code were checked.
- **Native mask/stroke discriminatory geometry.** 118×95 content-addressed textured image and genuinely different alpha masks proved mask source and grouped-mask target changes. Rounded-corner stroke contexts were strengthened without changing an unrelated option.

## Independent validation

- All **330/330** READY identities have complete real-Chromium path-lifecycle evidence: option Inspector edit, Graph or documented non-applicability, preview, Undo/Redo, durable IndexedDB reload, exported project and visible real file picker import.
- All **330/330** available native/model/Code lifecycle proofs have **zero generated public v6 Code/native PNG parity failures** after bounded executable reprobes.
- Updated strict signer and independent integrity check: **PASS**, **329 FULL, 17 PARTIAL, 5 BLOCKED**, **5,593 individual source-hashed criterion proof identifiers**.
- **Next.js production build PASS** with 482 generated pages including `/workspace`; TypeScript `--noEmit` PASS. Temporary single-worker build config and seven DOC-4 generated-input files were restored byte-for-byte.
- Existing unrelated Workspace shared `contracts.test.ts` assertion-message mismatch is not altered by this isolated Image branch.

## Exact limitations retained

**Only READY path still PARTIAL:** `images.inherit`. The pinned v6 engine implements image background `inherit` for canvas background rendering but did not demonstrate target-only native differences in Image-layer contexts. The conditional strict native pixel gate remains FALSE.

**16 original Stage A PARTIAL contracts:** Seven conic gradient `startAngle` paths with no demonstrated rendered effect; seven linear/radial-only gradient `repeat`/reflect paths requiring discriminant-specific native evidence; two blur-filter-only `filters.radius` contracts. They cannot become FULL by generic UI coverage.

**5 BLOCKED options:** Four upstream rounded/grouped shadow geometry contracts and one privileged painter-level asset resolver restriction. The upstream/security constraints are preserved; no repin, unsafe fallback or fabricated pixel effects.

## Source and evidence

- `docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json`: 351 immutable source identity statuses with 329 signed FULL paths.
- `docs/workspace/IMG01_STRICT_FINAL_PROOF_REFERENCES.json`: 330 indexed browser/native/Code criterion proofs and exact unmet gates.
- `docs/workspace/IMG01_STRICT_ISOLATED_NATIVE_LIFECYCLE_330.json`, `IMG01_STRICT_RESIDUAL_NATIVE_55.json`: exact native pixel hashes and executable generated-Code parity.
- `scripts/workspace/img01-final-strict-signer.py`, `img01-final-strict-integrity.py`: independently re-runnable fail-closed signer and verification.
- External real browser proofs, downloaded project assets, PNGs, logs and build reports: `D:\ApexifyWorkspaceParallel\IMG01_RECOVERY_20261025`.

**Result:** 329 FULL certified. Global 351/351 FULL certification is **not** passed. No push, merge, deploy, engine repin, reset, clean or alteration of shared Canvas/Text branch or historical recovery snapshots.
