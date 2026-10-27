# IMG-01 — Final strict-certification closure (Stage E)

**Historical Stage E snapshot. Superseded by [IMG01 Stage F remaining certification](IMG01_STAGE_F_REMAINING_CERTIFICATION.md): 300 FULL / 46 PARTIAL / 5 BLOCKED.**

**Repository:** `EIAS79/Apexify.js-Documentation`
**Isolated branch:** `codex/workspace-parallel-image`
**Accepted Stage C source:** `c6d7690238dcc0b3844ac804a6e2fedb80372c23`
**Source-equivalent recovered history (not authentic lost Image ancestry):** recovery checkpoint `53ec5f37e4a02fdbbc623f168a8840d3f63bb771`, Image fix `a8f071389487187b34c2cb9211039afb05652be0`, full per-option campaign `6a86a2e9be0fd75400e077a2456a25bc887a3083`. Exact final signed HEAD: recorded by `git rev-parse HEAD` and the separately verified recovery manifest.
**Engine pin:** `379a5248f09ed39c1b1734fe104b6bd73a77857f`, unchanged.

## Scope, outcome, and limits

Exactly **560** original source identities, reconciled in source order: **350 Image-specific**, **one painter-level security restriction**, **209 Canvas-owned exclusions**. Exactly **351 in-scope strict records**.

| Strict classification | Exact count |
|---|---:|
| FULL | **241** |
| PARTIAL | **105** |
| BLOCKED | **5** |

Of the **330 Stage A WORKSPACE_READY**, **241 are strict FULL** and **89 remain PARTIAL**. The **16 Stage A WORKSPACE_PARTIAL** remain PARTIAL. Four upstream native/authoring shadow options plus the painter-level `resolveAssetRefs?: boolean` are BLOCKED. **Global STUDIO-PARITY-17 FULL certification is NOT complete**; Stage A/B/C Image functionality remains eligible for controlled integration review with explicit reconstructed-Git provenance.

## Complete evidence execution

- **330/330** accepted Stage C pinned native/model/Graph/executable-Code cases, existing **121/121** native discriminant probes and 33-variant Code/native parity fixture reused where sufficient rather than repeated.
- **330/330** exact seeded option fixtures accepted; **330/330** invalid canonical field types rejected, **330/330** invalid generated-Code reconciliations rejected without corrupting the valid seed; **220/220** nonfinite numeric boundary cases rejected. Omission validity recorded individually.
- **330/330** READY paths exercised by real Chromium through CodeMirror fixture authoring and actual Inspector/Graph controls. **291** had successful per-path Inspector, applicable Graph, Undo/Redo, native preview, IndexedDB persistence/reload and Save project workflows.
- **291** browser-exported projects independently reimported into the native/model parity test, canonical Code→Visual round-tripped, SHA-256 assets checked and independently generated edited public-v6 Code executed to produce **byte-identical native PNGs**. No executable parity assertion failed.
- **241** full paths have demonstrated exact option-isolated, reproducible native pixel differences in the original or discriminating geometry fixture. Accepted JSON or unchanged PNG alone did **not** cause FULL promotion.
- **205/205** separate real visible Open project/file-picker imports passed against verified SHA-256 saved project JSON and a distinct preceding active project. Other eligible paths used inline real import proof in their lifecycle.
- **32** real campaign Chromium screenshots, plus earlier accepted 6-image Stage C and 4-image Stage D screenshot evidence.

Every FULL path has an individually addressable set of criterion IDs (`IMG01-FINAL-CRIT-<index>-<criterion>`). **4,097** criterion-level IDs were verified by `img01-final-strict-integrity.py` against source identity, path membership, native and Code proof flags, and artifact file SHA-256. All FULL records have no outstanding criteria; all remaining PARTIAL records retain exact outstanding criteria and explanatory reasons in the ledger.

## Exact remaining limitations

**89 READY paths remain strict PARTIAL:**

1. **55** lack independently discriminating proof that the *targeted leaf alone* changes native output in the tested context. These include filter/distortion parameters, gradient pivots, shape geometry, clipping, grouped transforms, `images.borderPosition`, and `options.groupTransform.borderPosition`. This is **not proof the engine options are universally inert**. Promote only after correct pinned-contract union/geometry-specific assertions.
2. **34** lack an exact fully successful user-control/browser lifecycle. These include native HTML color pickers not automated by fabricated events, conditional filter-region values, some mask/mesh and grouped options. Their failures are preserved; the controls must be exercised through the visible UI.

**16 original PARTIAL paths** remain gated: seven conic start-angle cases, seven repeat/reflect cases and two filter-radius fields that only apply to the three blur discriminants, not all 17 filters.

**Four upstream Image/Group shadow side/corner restrictions** remain blocked. Individual-image vs grouped native behavior is not presumed equal. **One painter-level boolean `resolveAssetRefs` remains security-blocked**; do not expose arbitrary resolvers or untrusted remote media.

## Corrected implementation and browser acceptance defects

Preserved Stage B warp quadrilateral-versus-control-handle exclusivity and Stage D Image-only mutually exclusive solid/gradient paint controls for Shape, Image box and Group box. The production Chromium workflow verified actual UI controls, 1280px decoded native preview and real downloaded executable public-v6 Code. The asset-import workflow selects the actual Inspector Assets tab and uses Chrome's real file picker (not synthetic change). Browser acceptance waits for actual IndexedDB commits and naturalWidth > 0. Test harness fixes include focusing the real narrow number input instead of its spinner, unique fresh project downloads with SHA-256, discriminating union/geometry fixtures and real project re-import after a distinguishable prior document. Failed Chrome sessions were restarted in isolated Chrome profiles; no other lane worktree or browser profile was deliberately modified.

## Regression, build and recovery

**TypeScript:** `node node_modules/typescript/bin/tsc --noEmit` PASS (Stage E log `strict-final-typecheck.log`). New 330-path invalid-Code/native-Code suites PASS; prior focused Image regressions **11/11 PASS**. Prior complete Workspace regression: **385 passed, 1 failed (pre-existing fail-closed `contracts.test.ts` expected regex `/outside composition/` vs actual `outside the canonical composition`), 1 skipped**. Shared owner contract test/parser remain untouched.

**Production build:** The controlled one-worker Next.js production build on the *same application source* PASS, **482 pages** including `/workspace`, with original Next config and DOC-4 inputs restored. Stage E adds certification/tests and evidence, not new application runtime changes after this accepted build. Earlier Stage C/D browser tests and asset recovery proofs remain preserved.

**Recovery provenance:** Original broken `D:\ApexifyWorkspaceParallel\image` remains untouched; complete **25,502-file** immutable snapshot preserved. Both independent archive/patch replays matched the eight Stage C archived blobs. Original lost Image commit objects were unavailable; never claim historical equivalence. A final local Git bundle, replayable patch, changed-source archive, browser-evidence ZIP and SHA-256/CRC manifest are preserved *outside the checkout* after final commit. **No push, merge, deployment or engine repin.**

## Machine-readable deliverables

- `docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json` — exact 351-path signed ledger and all per-FULL evidence IDs/remaining criteria.
- `docs/workspace/IMG01_STRICT_FINAL_PROOF_REFERENCES.json` — all 330 source-indexed criterion flags and reasons for PARTIAL.
- `docs/workspace/IMG01_STRICT_ISOLATED_NATIVE_LIFECYCLE_330.json` — 330 independent browser-export/native/Code parity cases.
- `docs/workspace/IMG01_STRICT_VALIDATION_BOUNDARIES_330.json` — exact input-type, invalid Code, boundary and omission assertions.
- `scripts/workspace/img01-final-strict-signer.py` and `img01-final-strict-integrity.py` — fail-closed reproducible signer and source-integrity verifier.
- External browser artifacts: `D:\ApexifyWorkspaceParallel\IMG01_RECOVERY_20261025\strict-lifecycle-browser`, including immutable downloaded JSON, browser screenshots and 205 real import proofs.

**Final decision:** Recovered valid Image Git checkout and **241 genuinely certified FULL**. The remaining **89 READY / 16 previously PARTIAL / 5 BLOCKED** cannot truthfully be labeled FULL with the presently verified evidence. Controlled integration review may proceed; global strict 330/330 signoff remains open.
