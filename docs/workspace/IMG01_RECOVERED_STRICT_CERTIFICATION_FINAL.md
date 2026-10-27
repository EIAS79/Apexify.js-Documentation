# IMG-01 — Final Source Recovery and Strict Certification Report

**Certification:** STUDIO-PARITY-2, 14, 15, 16 and 17; Image lane only.
**Source repository:** `EIAS79/Apexify.js-Documentation`. **Local branch:** `codex/workspace-parallel-image`.
**Accepted Stage C source:** `c6d7690238dcc0b3844ac804a6e2fedb80372c23`. **Execution pin:** `379a5248f09ed39c1b1734fe104b6bd73a77857f` (unchanged).
**Reconstruction checkpoint:** `53ec5f37e4a02fdbbc623f168a8840d3f63bb771`. **Final certification commit:** see `git rev-parse HEAD` in the recovered checkout and external SHA-256 recovery manifest.

## 1. Git recovered safely — precise provenance

The original directory `D:\ApexifyWorkspaceParallel\image` has a dangling `.git` pointer into a deleted Windows TEMP checkout. **It was neither repaired in place nor reset, cleaned, reinitialized, overwritten or modified.**

- Snapshot: `D:\ApexifyWorkspaceParallel\IMG01_RECOVERY_20261025\original_image_immutable_snapshot`. Robocopy preserved **25,502 files, 1.336 GB, zero failed copies**; the broken `.git` text is preserved as evidence.
- Isolated checkout: `D:\ApexifyWorkspaceParallel\IMG01_RECOVERY_20261025\image_reconstructed_checkout`. Actual usable Git object database cloned from a local authenticated upstream Git store at ancestor `10510ca5b6b030e20a22ba0b2ca0926560a2c0ab`. Stage C source restored on a separate `codex/workspace-parallel-image` branch and committed as `53ec5f37e4a02fdbbc623f168a8840d3f63bb771`.
- **Important history distinction:** The authentic *Image-specific* commits `949605b`, `6f8bb3c`, `c6d7690` do **not** exist in the accessible Git objects or remote Image branch. Thus the reconstructed branch contains an authentic upstream base and **new source-equivalent recovery commits**, **not the original lost Image ancestry**. Do not misidentify a new commit hash as an original historical Image commit.
- **Accepted source validation:** 8/8 Stage C archived Git blobs verified exactly against the recovery Git index (using `git show :path`). Both independently replayed archives (`original-baseline-for-verification.zip` and `img01-full-source.zip` with their appropriate three-patch sequences) reproduced 8/8 exact Stage C archived blobs with all patch applications succeeding. A 1,029-file replay comparison showed 1,028 files identical and **one expected separate published-API reconciliation document update** (`IMG01_API_RECONCILIATION_AND_INTEGRATION.md`) present in the preserved accepted snapshot but absent from the earlier chain.
- Eight upstream-base-only files were **moved to a separate archive**, not discarded, because they did not belong to the original Image source snapshot.
- Verified recovery checkpoint Git bundle: `img01-restored-checkpoint.git.bundle`, SHA-256 `8AC8C63E96C1C5BF122C76BF47707C9A8BC6B323B523EAA1E68A154B89BD4A87`. `git bundle verify` passed.

## 2. Reconciled 560 identities and strict statuses

Source inventory remains **560 exact identities** in original order: **350 Image-specific**, **1 painter-level asset option**, and **209 Canvas-owned inputs excluded from this Image lane**. Stage A readiness remains 330 WORKSPACE_READY, 16 WORKSPACE_PARTIAL, 4 UPSTREAM_BLOCKED and 1 SECURITY_RESTRICTED.

| Strict certificate | Paths |
|---|---:|
| FULL | **0** |
| PARTIAL | **346** |
| BLOCKED | **5** |
| **Total in scope** | **351** |

Machine-readable `docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json` retains every path's status, precise evidence IDs and applicable/outstanding criteria. `docs/workspace/IMG01_RECOVERY_CERTIFICATION_EVIDENCE.json` summarizes the recovered campaign; original Stage C 330-path source/model/Graph/code execution matrix (`IMG01_READY_OPTION_MATRIX.json`) is preserved **330/330 passed**. Prior 121 native variant probes and 33-variant direct/native executable-Code parity are reused unchanged.

**Honest FULL rule:** Conditional SSR controls or generic Chromium editing do **not** prove each option's actual browser mutation, Graph parity, undo, IndexedDB reload, project round-trip, validation boundaries and native effect. No unsupported FULL status was promoted.

## 3. New per-path evidence and actual defect correction

**Inspector surface mapping, all 330 READY paths:** `IMG01_STRICT_INSPECTOR_SURFACE_330.json`, test `image-strict-inspector-surfaces-330.test.ts`: 321 Image/Group-editor conditional option surfaces reachable across shapes, filters, gradients, distortion unions and paint modes; 9 external layer/source/geometry/group membership paths not certified by that nested-editor surface test. Each path has a traceable `IMG01-D-INSPECTOR-330#<path>` proof ID; this evidence is *static conditional UI reachability*, not a browser-verified edit.

**34 discriminating native raster fixtures:** `IMG01_DISCRIMINATING_RASTER_34.json`, test `image-strict-discriminating-raster-34.test.ts`. All 34 previously equal raster cases executed; **31 changed** under effective geometry (opacity, transparent backing, mask half-planes, multi-filter distortion, gradients with rotated pivots). Three remain unchanged in tested native fixtures: `images.borderPosition`, `images.inherit`, `options.groupTransform.borderPosition`. No ineffective path is FULL.

**Safely fixable native-inert UI defect:** The pinned runtime gives solid paint no visual effect while a shape/box gradient is active. Previously Image/Group editors let users edit that no-op solid color. Updated **only** `features/apex-workspace/components/ImageOptionsEditor.tsx` to make shape, image box and group box solid color and gradient controls mutually exclusive, with solid color restored on returning to solid mode. Test `image-paint-mode-certification.test.ts` independently proves native byte equality with gradient and confirms no inert UI color control appears when gradient is selected. Shared Canvas/Text/other-lane source files were not edited for this fix.

## 4. Real production Chromium and independently executable downloaded Code

Chrome 155 and real UI interaction (`Input.dispatchMouseEvent`, no fake `change` events) on rebuilt production `/workspace`: `tests/workspace/browser-image-gradient-paint-modes.cjs` **PASS — 6 steps, 4 screenshots**, evidence at `D:\ApexifyWorkspaceParallel\IMG01_RECOVERY_20261025\browser-gradient-proof-final\image-gradient-browser-proof.json` and `01-shape-solid.png` to `04-box-back-to-solid.png`. Native preview 1280px throughout. Real download button generated `downloads/main.ts`, 8,387 bytes, SHA-256 `306F9C6661D7E7FC961F1F0852B2654BBED7F2C3C7279BEDF7E6796A4BA6C2E0`. Executed the downloaded source against pinned runtime to produce `downloaded-code-output.png`, 1,218,807 bytes, SHA-256 `355A58073C721221884330056A44A38E1A97BCBEA4EC518537B47980E9E0AD6B`. Separate Stage C production browser workflow remains **12/12** with 6 screenshots verifying SHA-256 asset import, masks, Graph, Undo/Redo, IndexedDB, project export/reimport.

## 5. Prior PARTIAL / BLOCKED preserved

- 7 conic `gradient.startAngle`: native accepts values but prior 0°/180° fixtures showed identical PNGs; not promoted.
- 7 gradient repeat/reflect contexts: discriminant/geometry dependent; do not call universally effective.
- 2 image filter radius paths: valid for three blur discriminants, not all 17 filters.
- 4 upstream shadow side/corner paths: individual-image vs grouped native effects differ; group-specific native inertness in tested scenarios persists. Preserve UPSTREAM blocks.
- `painterOpts.resolveAssetRefs?: boolean`: restricted from untrusted workspace authoring (NOT a callback); accept only bounded, SHA-256 verified local media. Preserve SECURITY block.

Machine-readable upstream proof `docs/workspace/IMG01_STRICT_LIMITATIONS_CLOSURE.json` remains unchanged.

## 6. Regression / build

- New focused Image tests plus accepted Image tests: **11/11 passed** (`image-recovery-focused-regressions.log`). The new raster and Inspector tests were rerun again individually and passed.
- All Workspace `*.test.ts` suite in sequential order to avoid Windows spawn failure: **387 tests; 385 passed, 1 failed, 1 skipped** (`image-recovery-full-workspace-suite.log`). Sole failing assertion **pre-existed** on accepted Image source: `tests/workspace/contracts.test.ts` expects regex `/outside composition/`, but `parseSource` correctly rejects unsafe external statements with `Edits outside the canonical composition ... cannot be reconciled`. Shared test/source intentionally not changed in Image lane; owner/integration should correct expectation without weakening fail-closed behavior. The 330-case heavy Stage C matrix is opt-in and skipped in this routine suite because its archived completed 330/330 evidence was explicitly reused.
- TypeScript `node node_modules/typescript/bin/tsc --noEmit`: **passed** after all new test files corrected (`image-recovery-typecheck.log`).
- Production build (`node node_modules/next/dist/bin/next build` with temporary `experimental.cpus:1`): **PASS**, 482 pages including `/workspace`, `recovery-stageD-production-build-final.log`. DOC-4 prerequisites regenerated from pinned engine (232 exports / 93 members / 19,066 total option paths / 560 representative); generated output archived outside the checkout. The original `next.config.js` and 7 originally present DOC-4 generated files were restored with hash verification.

## 7. Signoff and exact remaining certification

**Source recovery: complete as a valid isolated source-equivalent Git branch, not original historical Image ancestry.** Functional Image Stage A/B/C work and the newly corrected paint authoring are **eligible for a controlled cross-lane integration review** conditional on provenance and the integration owner reconciling reconstructed Git history.

**Strict STUDIO-PARITY-17 FULL gate remains OPEN (0 FULL).** Direct *per-leaf* Inspector and applicable Graph mutation, effective native pixel or correct semantic assertions for each union/discriminant, invalid input boundaries, Undo/Redo, IndexedDB, project import/export and actual browser lifecycle proof must still be acquired for remaining authorable options; 321 static conditional controls and 330 native/model/Code passes alone do not legally imply FULL. Three paths retain unchanged raster fixtures, and 16 previous PARTIAL plus five upstream/security blocks remain explicit.

No push, merge, deploy, engine repin, or modification of the damaged original Image directory, Canvas/Text branches or other engineering worktrees occurred.
