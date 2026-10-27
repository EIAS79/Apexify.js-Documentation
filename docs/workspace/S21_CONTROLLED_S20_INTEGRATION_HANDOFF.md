# S21 — Controlled S20 engine integration — owner handoff

**Scope:** Isolated Workspace candidate only. The owner approved installation/testing of exactly S20 commit `9fe8b95f372efdadcd5ebdab1e9f6333413187c6`; no authorization to push, merge into main, alter the original Workspace pin, deploy, or activate video decoding.

## Immutable starting points

- Original integration: `D:\ApexifyWorkspaceIntegration\CanvasImageText`, HEAD `6e72ad07ef46196dda20f6e69dde9096eb2cfc63`, tree `8bf003e32af2b291e5303f37a15cc0e3441fec85`. Seven preexisting generated DOC-4 files were dirty; their original exact contents and original `package-lock.json` and `package.json` are SHA256 backed up at `audit/S21_S20_CONTROLLED_INTEGRATION/S21_ORIGINAL_DIRTY7_VERIFIED_SNAPSHOT.zip`.
- Original pinned native engine: `379a5248f09ed39c1b1734fe104b6bd73a77857f`. Preserved S18 strict ledger: `CREATE_CANVAS_STRICT_CERTIFICATION_S18.json` 167/208 FULL; no edits.
- S20 source repository candidate: `D:\ApexifyCanvasEngineSafeSubsetS20Isolated`, clean HEAD `9fe8b95f372efdadcd5ebdab1e9f6333413187c6`. SHA256 verified exact `apexify.js-6.0.0.tgz`: `007f24a6c5b923ce8668dd5a7e9e4a51cabe924a14f5607357b79f9431c7dae1`. Its npm SRI is pinned in the *separate* candidate lockfile. Independently checked installed ESM/CJS bytes against tarball and sha-512 SRI. No unsafe local compiled files swapped into original checkout.
- Pinned browser-only `@apexify/web` vendor source preserved exactly: Git tree `73287e7ee0dc4901418673f13c9a6c4b431ab4e7`. A separate source verifier passed. This runtime is distinct from the Node S20 candidate and must **not** be described as repinned.
- Isolated baseline checkout `D:\ApexifyWorkspaceIntegration\S21_S20_ISOLATED_BASELINE`, cloned at original integration commit. Isolated S20 candidate checkout `D:\ApexifyWorkspaceIntegration\S21_S20_ISOLATED_CANDIDATE`, branch `codex/canvas-s20-controlled-integration-s21`.

## Native scope, backwards compatibility, UI and Graph

- `canvas.patternBg.repeat`: installed S20 native renderer honors repeat, repeat-x, repeat-y and no-repeat for all 12 procedural patterns. Clip period = min(max(size+spacing,1),max(viewportWidth,viewportHeight)) before transforms. Omitted/repeat default stays pixel-identical. Inspector `Pattern repeat` and Graph `Graph root repeat` edited in real Chromium with different native-preview hashes.
- `canvas.bgLayers.pattern.repeat`: identical native procedural repeat behavior within ordered `presetPattern` layers; stable node IDs/Graph topology preserved. Inspector `Layer 1 repeat` and Graph `Graph layer 1 repeat` edited and native pixels differ.
- `canvas.shadow.borderRadius`: explicit finite nonnegative numeric (or circular) shadow radius overrides owning Canvas radius; omitted value inherits. Numeric/circular/inherited editor control is enabled only in candidate, also exposed in typed Graph. Correct negative boundary and real native pixels checked.
- `canvas.shadow.borderPosition`: deprecated alias fallback is now meaningful (roundedCorners > shadow borderPosition > inherited root position > all); omitted property backward compatible. Inspector and Graph edits with native-pixel differences, history, persisted JSON, browser output and code parity independently verified. **Despite functional proof, this property remains strictly PARTIAL** under the user's explicit earlier policy not to mark deprecated options as FULL. Its compatibility is documented; it is not rebranded as modern authoring.

## Verification and regression gates

1. Pinned baseline: `verify:pin` PASS, `typecheck` PASS, pre-S20 mixed/S18 native 1,173/1,173 PASS, original production build PASS 482 static pages.
2. S20 installed package provenance: exact `git` engine SHA, npm tarball SHA256, lockfile relative local package reference/SRI and exact installed ESM and CJS bytes PASS. Vendor browser package Git tree PASS.
3. Four discriminating native rendering fixtures with generated *independently executable public API* Code/raw-RGBA equality, Code-to-Visual parse, canonical v2 transaction, typed Graph projection/mutations: 4/4 PASS.
4. Real Chromium: 4/4 paths edited through Inspector and Graph, both changed real native preview RGBA; Undo/Redo, IDB revisions, browser-exported source/JSON, project reload and 5 initial screenshots PASS. Source replay: browser Code native RGBA 4/4 PASS, each exported at 1280x720. Chromium fail-closed recovery UI from deliberately corrupted saved project, import of real exported valid JSON and rehydration: PASS.
5. Input/default/security/12-pattern union values: 7/7 tests PASS.
6. Installed S20 cross-domain Chart (all four repeat modes distinct, omitted repeat unchanged), Image shadow first-overload default and alias precedence, Text plus Canvas compositing: 3/3 PASS.
7. **Original pinned S9 behavioral assertion had to be migrated**: it required `no-repeat` to produce no raster change; that is false under approved S20. The original failure log is preserved. The only S9 test assertion changed in the isolated candidate is the new positive pixel-effect assertion, rerun 7/7 PASS. This is an intentional new behavior, not an unrelated regression; keep audit trace.
8. Full serial 52-file Workspace suite, separate S18 original 43-path native rerun, final TypeScript, controlled candidate production build and all-208 ledger integrity must be green before the release note/ledger may claim closure. Logs in `D:\ApexifyWorkspaceIntegration\audit\S21_S20_CONTROLLED_INTEGRATION`.

## Candidate-only certification policy

Original 208 option identities/index order and all original S18 evidence unchanged. Upon verified final gate clearance, **3 modern paths qualify for FULL**, increasing candidate-only strict totals from 167 to 170. The deprecated `canvas.shadow.borderPosition` has exact behavior verified in real browser and native Code but remains `PARTIAL_CERTIFICATION` as previously explicitly required by the owner.

Candidate-only expected strict totals: FULL 170, PARTIAL_CERTIFICATION 7, BLOCKED_UPSTREAM 4, BLOCKED_SECURITY 26, NOT_APPLICABLE 1. No remaining conic angle, customBg filter-radius, videoBg or painter-option status is promoted. This status applies only to the **isolated S20 package candidate**; it does not reclassify the untouched production-pinned S18 ledger.

## Remaining release gates and restrictions

The separate Studio historical 56 failures were previously reported as a release blocker and are not hidden here. Production Next.js G09 security NO-GO and the explicit prohibition on video decoding remain. Owner must authorize all future merges, remote push, permanent pin update, and deployment separately. S19 speculative gradient-angle implementation is not included in S20 package, and cannot be introduced through the pinned browser source.
