# IMG-01 — Stage G certification, native contracts and browser closure

**Historical Stage G checkpoint — superseded by [Stage H strict certification](IMG01_STAGE_H_STRICT_CERTIFICATION.md): 329 FULL / 17 PARTIAL / 5 BLOCKED.**

**Repository:** `EIAS79/Apexify.js-Documentation`
**Branch:** `codex/workspace-parallel-image` (isolated, source-equivalent recovered Git history).
**Accepted Stage F HEAD:** `994835b8db6869508693c65891dd3c27b679e854`.
**Pinned engine unchanged:** `379a5248f09ed39c1b1734fe104b6bd73a77857f`.
**Original damaged Image directory and its 25,502-file snapshot:** preserved, not overwritten.

## Stage G certification results

| Certificate | Stage E | Stage F | Stage G |
|---|---:|---:|---:|
| FULL | 241 | 300 | **316** |
| PARTIAL | 105 | 46 | **30** |
| BLOCKED | 5 | 5 | **5** |
| In-scope Image records | 351 | 351 | 351 |

Original inventory: **560 source identities**, including **209 Canvas-owned identities excluded** from Image certification. Of **330 Stage A WORKSPACE_READY**, **316 (95.76%) are FULL** and **14 remain PARTIAL**. The 16 previously PARTIAL union-specific source contracts also remain PARTIAL. Five upstream/security cases are BLOCKED.

### Newly finished source and UX

**Pixelate filter native integer regions:** The Image-only ordered filter editor previously allowed fractional `pixelate x/y/width/height` values, triggering native-preview failures. These fields now use integer steps and rounded committed values. **Eight complete real production Chrome 155 Inspector, Graph, Undo/Redo, IndexedDB reload, project export/import browser lifecycles passed**, both individual Image and grouped Image options. New static authoring regression passed.

**Mesh & effects browser harness correctness:** Real interactive browser tests now select actual **zero-indexed Vertex 0 X**, scope first-row mesh Y, correctly select Group chromatic-aberration and Group film grain *intensity number inputs* rather than same-name checkboxes, and detect fresh Chrome downloads that overwrite existing filenames by real modification timestamps. First-row mesh coordinates and grouped effect intensity passed all exact browser lifecycle gates. The polygon point Y path is also complete.

**Shape `sides` native semantics:** Pinned engine applies `shape.sides` to procedural polygons **without explicit points**, but uses five points for star shapes. An exact polygon-native fixture (not a star) demonstrated deterministic target-only changed pixels with independently executed generated public-v6 Code **byte-identical PNG parity**, permitting strict FULL promotion.

### Verified execution

- Original accepted Stage C 330/330 native/model/Graph/Code cases, and 121 native probes reused without unnecessary repetition.
- 330/330 valid source fixtures, 330/330 invalid Code rejection, 220/220 invalid numeric bounds rejection.
- **318 browser/project Code lifecycle and executable output parity cases** after new retries; **316 exact ready options strict FULL**.
- **53/55** discriminating native residual cases now exhibit target-only native pixel change with independently executed generated Apexify.js Code **byte-identical PNG results**; the two mesh edge-mode cases remain unproven.
- **205/205** separately validated real saved-project file-picker imports retained, plus inline real import for newer cases.
- Stage G signer/integrity both PASS with **316 FULL** and **5,372 source-hashed individual criterion proof IDs**.
- TypeScript passed; controlled Next.js production build **PASS**, **482 pages** including `/workspace`; temporary worker config and all seven DOC-4 files restored with hash equality.
- Prior shared-owner `contracts.test.ts` wording-only assertion mismatch remains unchanged and out of Image scope.

### Exact still-open READY paths (14)

- **Two pinned-engine edge-mode rendering gaps:** `images.meshWarp.edgeMode` and `options.groupTransform.meshWarp.edgeMode`. Pinned mesh raster source samples use in-range UV coordinates, so examined valid edge modes had identical output. No fake effect classification or engine repin.
- **Twelve incomplete UI/browser lifecycles:** `images.inherit`; `images.mask.source`; `images.shadow.borderRadius`; `images.shape.fill`; `images.stroke.borderPosition`; `images.stroke.roundedCorners`; `options.groupTransform.mask`; `options.groupTransform.mask.source`; `options.groupTransform.meshWarp`; `options.groupTransform.stroke.borderPosition`; `options.groupTransform.stroke.roundedCorners`; `options.isGrouped`. Each has preserved missing exact criteria and last test error in the ledger.

**Additionally:** 16 Stage A PARTIAL paths remain: seven conic start-angle contexts, seven gradient repeat/reflect contexts and two blur-only filter radius contracts. Four upstream shadow restrictions and one privileged painter asset-resolver option remain BLOCKED; they cannot be certified FULL without genuinely resolving their contracts and security restrictions.

### Authoritative artifacts

- `docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json` — all 351 path statuses and 5,372 verified per-FULL criterion proof IDs.
- `docs/workspace/IMG01_STRICT_FINAL_PROOF_REFERENCES.json` — every READY path's exact criteria and outstanding defects.
- `docs/workspace/IMG01_STRICT_ISOLATED_NATIVE_LIFECYCLE_330.json` — 330 paths, real exports and native/Code parity.
- `docs/workspace/IMG01_STRICT_RESIDUAL_NATIVE_55.json` — 55 native discriminants and exact generated Code parity.
- `scripts/workspace/img01-final-strict-signer.py` — fail-closed **idempotent** source-indexed signer.
- `scripts/workspace/img01-final-strict-integrity.py` — verifies exact inventory, pinned engine, all FULL proof hashes and residual rendered/Code witness.
- External logs/screenshots/real JSON saved projects: `D:\ApexifyWorkspaceParallel\IMG01_RECOVERY_20261025`.

**Integration verdict:** Certified **316 FULL**, preserved **30 PARTIAL / 5 BLOCKED**, and global strict FULL gate remains OPEN. Valid recovered Image branch eligible for controlled integration review. No push, merge, deployment, engine repin or Canvas/Text worktree modifications.
