# IMG-01 — Stage F remaining-option certification

**Historical Stage F checkpoint — superseded by [Stage G strict certification](IMG01_STAGE_G_STRICT_CERTIFICATION.md): 316 FULL / 30 PARTIAL / 5 BLOCKED.**

**Repository:** `EIAS79/Apexify.js-Documentation`
**Isolated branch:** `codex/workspace-parallel-image`
**Accepted Image Stage E baseline:** `987cd31cffe20419b7d49f084ce8fc7f92897a27`
**Immutable pinned engine:** `379a5248f09ed39c1b1734fe104b6bd73a77857f`
**History:** valid source-equivalent recovered Git branch, **not** recovered original Image commit ancestry.

## Certified outcome

| Exact strict classification | Stage E baseline | Stage F |
|---|---:|---:|
| FULL | 241 | **300** |
| PARTIAL | 105 | **46** |
| BLOCKED | 5 | **5** |
| Total scoped paths | 351 | **351** |

**59 of the owner's 105 remaining PARTIAL paths became FULL with independently verified evidence.** Exactly 330 Stage A READY source identities were inspected in real Chromium; **300/330** now pass every applicable strict criterion. The **30 remaining READY paths** comprise **27 incomplete per-path browser lifecycles** plus three without demonstrable native pixel effects (`images.meshWarp.edgeMode`, `images.shape.sides` and `options.groupTransform.meshWarp.edgeMode`). The other **16** remain Stage A PARTIAL union-specific source contracts (seven conic start angles, seven repeat/reflect gradients and two blur-only radius fields). Four upstream shadow restrictions and one painter resolver security restriction remain BLOCKED. No unresolved option is misrepresented as certified.

## Implementation corrections

Image/Group Inspector now offers a **keyboard-accessible, validated hexadecimal editor** alongside the native OS color picker for seven previously inaccessible color leaves: Image box, image shadow, procedural shape, image stroke, Group box, Group shadow and Group stroke colors. Partial text entry is allowed in the field, but **only valid 6/8-digit hex** is committed to the canonical model; incomplete/invalid entry is discarded on blur. The color swatches still work; irrelevant solid-color controls remain hidden when gradient paint is selected. No shared Canvas/Text editor implementation was modified.

The rebuilt production Workspace (Chrome 155, real CDP mouse and keyboard events—not synthetic React state changes) passed all **7/7** affected Inspector, Graph, Undo/Redo, IndexedDB reload, real project export/reimport and native preview workflows. Static Inspector tests **2/2 passed**. TypeScript `tsc --noEmit` passed.

## Native discriminating campaign

The first residual native 55-path run demonstrated target-only native pixel changes for **48 paths** under valid geometry. Every passing native output was recreated via **independently executed public-v6 generated Code** and compared with **byte-identical PNG** output. The second contract-targeted retry used valid whole-object warp-handle variants and out-of-range mesh vertex geometry, recovering four further paths: **52/55 now have deterministic target-specific rendered pixel and independent Code parity evidence**.

The three remaining native cases are exact named paths above. Two mesh `edgeMode` cases did not show an effect under the tested extrapolation, and shape `sides` did not vary PNGs for the tested star parameters. This does **not** imply universal API inertness; these options need pinned upstream-engine behavioral review or additional effective geometry. No engine repin or unsupported fallback was made.

Independent Image browser/model/native/Code comparison now covers **303** READY paths with complete browser and project Code-lifecycle evidence. Stage F signer proves **300** of these meet every criterion, with **5,100 source-hashed criterion proof IDs** independently verified. The 351-record strict ledger retains missing proof gates and exact reasons on all PARTIAL/BLOCKED paths.

## Verification and release

- Source inventory checked against original **560 identities**; Image scope **351**, Canvas excluded **209**.
- **330/330** invalid Code-to-Visual mutations rejected; **220/220** non-finite numeric boundaries rejected; **330/330** seeded sources validated.
- **7/7** repaired color full Chromium lifecycles passed.
- **52/55** residual native target-only effect and generated-Code byte-for-byte PNG comparisons passed; three remain unproven.
- **205/205** earlier independent visible browser project-file imports passed; real user import also included in the seven new color workflows.
- Stage F fail-closed `img01-final-strict-signer.py` and `img01-final-strict-integrity.py` both PASSED with **300 FULL**, 5,100 criterion-level proof identifiers.
- **Next.js production build PASS**, 482 pages including `/workspace`; temporary CPU config and seven DOC-4 inputs restored with byte-matching hashes.
- Prior Stage E known shared `contracts.test.ts` expected-text mismatch remains owner-managed and unmodified.
- Source, native proof JSON, Chromium screenshots and signed evidence are local to the isolated worktree and its external recovery directory. **No push, merge, deployment, engine repin or change to original Image directory.**

## Remaining required actions to reach 330/330 READY and 351/351 scoped

Fix and verify the **27 exact incomplete Inspector/Graph/Undo/Redo/persistence/browser lifecycles**, including nested pixelate-filter region controls, mesh vertices, mask asset selectors, rounded-corner controls, grouped effects and the Group membership control. Investigate the three listed native behavior constraints with exact pinned-engine reference fixtures, and only promote if the complete edit and generated-Code/native effect contract is proven.

The 16 originally PARTIAL flattened union/discriminant fields require source-specific conditional semantics and native evidence; five upstream/security BLOCKED fields cannot truthfully be promoted within this Image-only lane without separately authorized upstream/security work.

## Proof artifacts

- `docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json` — 351 immutable source IDs and 300 FULL statuses, with 5,100 signed criterion IDs.
- `docs/workspace/IMG01_STRICT_FINAL_PROOF_REFERENCES.json` — 330 READY exact per-criterion flag maps and outstanding problems.
- `docs/workspace/IMG01_STRICT_ISOLATED_NATIVE_LIFECYCLE_330.json` — browser source, exported project and independent generated-Code/native PNG checks.
- `docs/workspace/IMG01_STRICT_RESIDUAL_NATIVE_55.json` — 55 native geometric discriminators and generated-Code parity proofs.
- `tests/workspace/image-strict-residual-native-55.test.ts` — reproducible contract-specific native fixture execution.
- `tests/workspace/browser-img01-full-path-campaign.cjs` — real Chromium option/Graph/history/IndexedDB/export/import checks.
- `tests/workspace/image-strict-inspector-surfaces-330.test.ts` — complete UI reachability and seven hex-authoring assertions.
- External evidence: `D:\ApexifyWorkspaceParallel\IMG01_RECOVERY_20261025`, including Stage F browser/log and build reports.

**Verdict:** Valid certified partial closure: **300 FULL / 46 PARTIAL / 5 BLOCKED**. The remaining PARTIAL and BLOCKED cases are explicitly **not** complete.
