# Apexify.js Workspace — Canvas + Image + Text integration report

**Date:** 2026-10-25
**Current status:** Pinned browser package restored; Workspace regression, typecheck, production build, real Chromium, and independent clean-checkout build PASS. The unrelated historical Studio suite still has 56 red tests caused by unavailable old sources; global Studio release remains unapproved. Historical build-blocker evidence is preserved below.
**Repository:** EIAS79/Apexify.js-Documentation
**Integration branch:** codex/workspace-integration-canvas-image-text
**Checkout:** D:\ApexifyWorkspaceIntegration\CanvasImageText
**Audit:** D:\ApexifyWorkspaceIntegration\audit
**Push / main merge / deployment:** NONE.

## 1. Source provenance

| Domain | Historical accepted commit | Verified source |
|---|---|---|
| Canvas S18 | 472ee4e598091139f2191619ad517ac6338b3b5a | Complete tracked-source recovery ZIP from D:\ApexifyCanvasS15IntegrationAudit_764cd972_20261022\S18 |
| Image Stage C | c6d7690238dcc0b3844ac804a6e2fedb80372c23 | Stage C source, patch and evidence archives; source-equivalent reconstruction at D:\ApexifyWorkspaceParallel\IMG01_RECOVERY_20261025\image_reconstructed_checkout |
| Text strict | 193d51d9c5cf147b77d1bd3da4e4b9e86c602786 | Clean branch HEAD 39f2f9772a5dca36ed392c44566a40421a4c978b including later strict-ledger correction |

The Image reconstruction is **not falsely presented as an authenticated recovered original Stage C Git object**: the original Image .git file refers to deleted temporary metadata. Primary Canvas, Image patch/source/evidence, and Text bundle SHA-256 hashes all matched the source handoff. Original engineer worktrees were not reset, cleaned or overwritten.

## 2. Integration branch and commit

Baseline: Text corrected HEAD 39f2f9772a5dca36ed392c44566a40421a4c978b. Initial implementation local commit: 87d2427170b684d40f98d08203ae0a1f437e9ac3. This report and the mixed Chromium test are added in a subsequent local documentation commit. Record definitive final HEAD in the recovery manifest.

## 3. Complete shared-file matrix

The full per-file three-way source hash and conflict matrix is saved at:
- audit\file-integration-matrix.json
- audit\file-integration-matrix.md
- audit\integration-source-map.json
- audit\features__apex-workspace__*.diff

These retain source ownership, change classification, three hash columns and concrete shared-file diffs.

| Shared responsibility | Reconciled behavior |
|---|---|
| model.ts | Canvas extras, Image options/groups, Text settings and strict validators |
| WorkspaceApp.tsx | S17 Canvas discrete history, verified Image upload and existing Text coordination |
| Inspector.tsx | Canvas nested controls, Image editor/masks/groups, TextOptionsEditor |
| Graph.tsx | Canvas root compositing/filters, Image typed mask/source/group ports, Text authoring |
| canvas-graph.ts | Canvas root blend edit and Image graph projection without separate state |
| codegen.ts | Public-v6 Canvas, Image arrays/groups/masks and nested Text runs/metrics |
| server/render.ts | Real ordered Canvas→Image→Text native output, image transforms and Text arguments |
| asset-store.ts | S18 correct WebP RIFF/WEBP signature, SHA256 validated imported assets |
| Tools.tsx | Stage C verified bounded local image import |
| Canvas editors/helpers | S18 gradient, pattern, shadow, bounded image filters |
| Image-specific modules | Stage C image-options, image-runtime and ImageOptionsEditor |
| Text-specific modules | Preserve strict Text editor, domain/text and metrics endpoint |
| Visual/asset persistence | Preserve real server-native PNG previews, IndexedDB and CodeMirror |

## 4. Capabilities preserved

**Canvas S18:** 167 strict FULL among 208 original inventory records; eight PARTIAL, six BLOCKED_UPSTREAM, 26 BLOCKED_SECURITY video backgrounds, one NOT_APPLICABLE. Canvas nested gradients/patterns, compositing, backgrounds, native filters, S17 history and S18 WebP signature retained.

**Image Stage C:** 10 shapes, 17 filters, 6 distortions, warp quad/control exclusivity, clipping/masks/group transforms, verified local assets, Graph/Inspector, native rendering and Code. 330 Image-specific READY paths retain native/model/Code evidence, but their complete individual strict UI proof chain is still pending. Do not describe them as all strictly FULL.

**Text:** accepted 438 FULL/444 inventory records, four PARTIAL (font.family, font.name, hangingBaseline, ideographicBaseline), one security-blocked font.path and one excluded legacy alias. Recent metadata correction preserved.

Other independent Chart/Paths/Media lanes and the advanced Phase 15–43 engine roadmap were not merged.

## 5. Implementation corrections

Unified three-domain model validation and shared components; preserved Image mask/group handling within Canvas S18 Graph and runtime; carried Text multi-run arguments/measurement into generated executable Code; enforced S18 WebP magic and bounded filters; reconciled fail-closed Code rejection wording; corrected eight legacy Canvas test typing errors without relaxing production validation.

## 6. Native and generated Code equivalence

**PASS.** New tests/workspace/mixed-domain-integration.test.ts creates a real gradient Canvas, content-addressed masked/grouped image composition and multi-run styled Text. It runs both real server/render.ts and independently executable generated public ApexPainter code, asserting **byte-identical native PNGs**. Canonical Code parsing and normalized project JSON roundtrip also pass.

## 7. Inspector and Graph evidence

**PASS in tested scenarios.** Image mask/group/source Graph edges, Canvas root blend reducer, Text settings and canonical Code appear in the same normalized model. Live Chromium edited actual Text Inspector and Canvas S18 Graph control with a verified masked Image present; native preview updated. Unsupported executable source edits are rejected rather than silently applied to Visual.

## 8. Undo/Redo and IndexedDB

**PASS.** Mixed Chromium flow performs consecutive Text and Canvas changes, Undo twice and Redo twice, then reloads the application. Both values and the imported image persist. Image acceptance also verified Graph Undo/Redo, persisted mask, fit and asset.

## 9. Project import/export

**PASS in tested scenarios.** Image Chromium exported real project JSON with verified SHA256 image/mask/Graph settings. image-strict-project-recovery.test.ts checks re-import, immutable asset and canonical Code. Mixed native regression tests JSON roundtrip. Live mixed browser reloads all three domains from IndexedDB.

## 10. Real Chromium results and screenshots

**Image Stage C:** 12 steps, zero failures, six PNG screenshots. Results: audit\chromium-image-stagec\real-asset-acceptance.json.

**Combined Canvas+Image+Text:** six steps, zero failures, five PNG screenshots. Results: audit\chromium-mixed-domains\mixed-domains-acceptance.json.

Both tests used actual Chrome CDP, actual integrated /workspace route at http://127.0.0.1:38497/workspace, Next.js dev server, and real Apexify.js native-render API; no simulated image output. See both folders for screenshot files.

## 11. Security regressions

**PASS in covered cases.** Fail-closed remote/file image and mask sources, content-addressed SHA integrity, malformed Image unions, S18 WebP RIFF validation, restrictive Code-to-Visual reconciliation, and bounded native asset handling. No unsafe video/FFmpeg/network privilege or unrelated engine changes introduced.

## 12. Full automated Workspace regression

**2,007 discovered; 2,006 PASS; zero FAIL; one SKIP.** Executed with tsx --test --test-concurrency=2 over 49 tests/workspace/*.test.ts files. Exit code 0. Evidence: audit\workspace-all-tests.log.

Focused mixed native + recovery + Code rejection rerun: **8/8 PASS**. Evidence: audit\mixed-and-regression.log.

## 13. TypeScript and production build

**BLOCKED:** After correcting all eight stale Canvas test-typing issues, npm run typecheck reports one remaining TS2307 at lib/studio/browserPreview.ts:7:8: cannot resolve @apexify/web. This module is neither installed nor declared as a dependency in the current checkout.

**BLOCKED:** npm run build passed Next.js production source compilation but failed during TypeScript validity checking at the same missing module. Evidence: audit\typecheck-after-test-fixes.log and audit\integrated-production-build.log.

No type stub, fabricated package, or unapproved engine upgrade has been used to conceal this blocker.

## 14. Engine pin

**PASS.** npm run verify:pin confirms package.json, lockfile, generated doc4 manifest all agree on **379a5248f09ed39c1b1734fe104b6bd73a77857f**. The first attempt required generating the absent doc4 manifest in the isolated checkout; re-run passed. Evidence: audit\verify-pin-after-doc4.log.

## 15. Recovery package

See audit\recovery for final tracked-source ZIP, baseline-to-integration patch and independently hashed audit/evidence archive plus SHA-256 verification manifest. The package must be verified against the final branch HEAD before use. Uncommitted environment-only generated doc4 artifacts are not source changes.

## 16. Strict certification outstanding

Canvas eight partial, six upstream blocked, 26 restricted video, one not applicable; Image 330 READY not individually strict FULL; Text four partial, one security blocked, one excluded. These states are not magically upgraded by combined integration tests.

## 17. Later S19 engine approval

Candidate **3bca54de95e578face6cfd7af8c57ea422b384b6** remains on separate engine remediation branch. Changing pin or adjusting native public semantics needs explicit owner approval and its own regression/verification campaign. No S19 work is installed here.

## 18. Merge/PR recommendation

**INTEGRATION INCOMPLETE — BLOCKED. Do not merge, push or deploy.** Three-domain functional composition, 2,006 unit/integration regressions, 12 Image Chromium checks and six mixed-browser checks all pass. The repository-wide TypeScript and Next production build remain red because the independent Studio browser module dependency is absent. Resolve the actual authorized @apexify/web runtime/package contract, rerun the full typecheck/build and browser smoke, and only then consider a PR. Do not hide the failure with an inert stub.

---

## 2026-10-25 FINAL BUILD UNBLOCK — updated integration checkpoint

This newer section supersedes the historical unresolved-build status in sections 13, 14 and 18 above. Do not erase the prior failed-build evidence.

### A. Baseline and source protection

- Original integration HEAD: 138cd8be6342c0a3d2da473ffb12a030f00921e1
- Original integration Git tree: f4c78e1c0fffc0b7a20fbe502600143f057b4ce2
- All seven originally modified/untracked DOC-4 outputs individually SHA-256 backed up to D:\ApexifyWorkspaceIntegration\audit\build-unblock-20261025\doc4-generated-backup. Subsequent build left their original hashes unchanged.
- Two tracked files: generated/docs-doc4/identity.json and index.json. Five untracked reproducible manifest/search/export/option/type-graph outputs. None staged or discarded.
- The full Workspace regression appended to an existing tracked Text JSONL evidence shard. Its post-run bytes were backed up to audit before the original tracked bytes were restored; the seven DOC-4 files were not altered.

### B. Exact @apexify/web provenance

- Pinned engine repository: EIAS79/Apexify.js
- Pinned engine commit: 379a5248f09ed39c1b1734fe104b6bd73a77857f
- Git subtree: packages/web
- Exact Git tree: 73287e7ee0dc4901418673f13c9a6c4b431ab4e7
- Six tracked browser-package files: README.md, package.json, tsconfig.json, src/index.ts, src/studio-preview.ts, src/safe-preview-expression.ts
- Each file was individually checked using Git blob IDs against that exact pinned historical commit, then copied byte for byte to vendor/apexify-web, and SHA-256 verified after copying.
- No changes under packages/web between S19 candidate HEAD and the pinned engine commit. No S19 package changes or updated apexify.js pin were introduced.
- The existing Next webpack alias and tsconfig path alias already resolve @apexify/web to vendor/apexify-web/src/index.ts.
- The original scripts/studio/install-apexify-web.mjs would remove the vendor directory and download only four source files from an older commit. It has been changed into a non-destructive offline verifier, checking all six blob hashes, the complete pinned subtree hash, and exact filenames.
- .gitignore was updated so the six files are committed and available from a clean checkout; the other Studio Deno/FFmpeg vendor directories remain ignored.
- Pinned package declares license MIT. No license notice, package manifest or source contents were changed.

### C. Browser runtime security and API isolation

The browser bundle statically includes exactly the three local source modules under vendor/apexify-web/src. It does not bundle apexify.js native/Node server code, sharp, filesystem modules, or the Workspace native server renderer. renderApexifyWebPreview, WebStudioPreviewResult and WebVirtualAsset remain the pinned package's own exports. The browser renderer uses a bounded safe preview-expression resolver rather than eval/new Function.

Remote image handling requests CORS with credentials omitted, an 8 MiB response-size limit, a 12-million-pixel decoded-image limit, a maximum of eight remote layers per createImage call and an eight-second abort timeout. The package retains its explicit unsupported-API partition. A successful browser security test is not a claim of formal security proof; remote responses may be buffered before the post-fetch size check.

**Important architecture boundary:** Studio browser-direct preview remains separate from the Workspace /api/workspace/render server-native ApexPainter PNG renderer. No Workspace renderer substitution occurred.

### D. Original failed build versus new successful build

**Historical blocked build:** audit/integrated-production-build.log and audit/typecheck-after-test-fixes.log showed TS2307 from lib/studio/browserPreview.ts (missing @apexify/web); production source compiled but type validation failed.

**New verified build:** audit/build-unblock-20261025/typecheck-1.log and production-build-1.log show:
- npm run typecheck: PASS, zero errors
- npm run build: PASS, optimized production compilation, type validation, 482 static pages, page optimization and build traces.
- npm run verify:pin: PASS; package.json, lockfile and generated manifest agree on 379a5248f09ed39c1b1734fe104b6bd73a77857f
- Pinned browser-source postinstall verifier: PASS, no downloading or rewriting.

### E. Workspace, mixed-native, Studio and real browser evidence

- Full Workspace tsx suite: 2,007 tests, 2,006 PASS, zero FAIL, one SKIP. Log: audit/build-unblock-20261025/workspace-full.log.
- Existing mixed native Canvas/Image/Text + generated executable Code pixel-parity test: included in the passing Workspace suite. It renders a real pinned native PNG and separately runs generated code, asserting byte-for-byte parity, canonical JSON and typed Graph.
- Newly added pinned web security/source suite: 4/4 PASS. Log: audit/build-unblock-20261025/web-source-security-final.log.
- Newly added actual pinned @apexify/web Chromium test: 7/7 PASS with genuine Canvas2D PNG screenshot, safe-expression inert side-effect test, explicit unsupported createGIF warning, oversized Canvas rejection, virtual assets and missing-asset refusal/warning. JSON/screenshot at audit/build-unblock-20261025/chromium-pinned-browser-runtime.
- Full production-hosted Image Stage C Chromium acceptance: 12/12 steps PASS, 6 screenshots, actual SHA256 file-picker upload, mask, Graph, Undo/Redo, IndexedDB, project JSON export. Directory: audit/build-unblock-20261025/chromium-image-production.
- Full production-hosted mixed Canvas+Image+Text Chromium acceptance: 6/6 steps PASS, 5 screenshots, native server PNG, Inspector+Graph edits, cross-domain Undo/Redo and persisted reload. Directory: audit/build-unblock-20261025/chromium-mixed-production.

### F. Separate historical Studio-suite failures — do not conceal

For completeness, the broad 29-file scripts/studio/*.test.ts legacy suite was run. It reports **278 tests: 220 PASS, 56 FAIL, two SKIP** (audit/build-unblock-20261025/studio-tests.log). Multiple failures rely on historical files absent already at the original accepted integration commit, including:
- components/studio/visual/VisualStudioPre4.tsx
- components/studio/visual/VisualStudio.tsx
- app/studio/page.tsx
- APEXIFY_STUDIO_VISUAL_AUTHORING_MASTER_PLAN.md

Git inspection confirmed missing historical file paths already absent from baseline commit 138cd8b. This legacy Studio source tree and phase-plan mismatch is independent of the pinned web dependency fix. No mock components or files were fabricated to suppress these failures. Therefore **global Studio historical test certification remains red** despite full Workspace/Next production build and targeted browser runtime checks passing.

### G. Strict option classifications remain unchanged

Canvas S18: 167 strict FULL of 208, eight PARTIAL, six BLOCKED_UPSTREAM, 26 BLOCKED_SECURITY video backgrounds, one NOT_APPLICABLE.
Image Stage C: 330 Image-specific READY paths retain their prior evidence; they are NOT promoted to individually strictly FULL by this merge.
Text strict: 438 FULL of 444, four PARTIAL, one BLOCKED_SECURITY, one EXCLUDED legacy alias.

### H. Release decision

**Pinned-browser build blocker RESOLVED.** Canvas+Image+Text Workspace functionality, TypeScript, production build, pinned package provenance and targeted real Chromium integration gates PASS. **Do not imply the unrelated historical Studio suite has passed.** No push, merge to main, deploy, native engine repin, or S19 import is authorized. The final local commit and independently SHA-256-verified recovery package are documented separately under the latest audit/recovery manifest.

### I. Final Windows clean-checkout gate and byte-for-byte source policy

The first clean clone of commit `83b22f69af96a2bd18b01bec449dc58084fb3050` exposed CRLF conversion of the pinned `README.md`, correctly rejected by the non-destructive Git blob verifier. Commit `6e949cb3fd8543cf25be43a7a5764c2d1c0fb01b` added `.gitattributes` with `/vendor/apexify-web/** -text` to preserve exact pinned bytes on Windows. The subsequent fresh clone at `D:\ApexifyWorkspaceIntegration\clean-checkout-pinned-web-6e949cb` independently verified every pinned browser file and the complete tree `73287e7ee0dc4901418673f13c9a6c4b431ab4e7`.

An intentionally script-disabled `npm ci --ignore-scripts` installed dependencies but could not generate the pinned native `apexify.js/dist/declarations/index.d.ts` needed by DOC-4. This is a lifecycle limitation, **not** a browser-runtime regression. Rerunning normal `npm ci --prefer-offline --no-audit --no-fund` succeeded, installed 292 packages, built the pinned native engine declarations, passed the offline vendor verifier during postinstall, and generated DOC-1, DOC-2, DOC-4, DOC-5 and DOC-6 artifacts.

From that independently installed checkout, `npm run typecheck` **PASS**, `npm run verify:pin` **PASS**, and `npm run build` **PASS** with 482 static pages. The output is preserved under `audit/build-unblock-20261025/clean-npm-ci-normal.log`, `clean-typecheck.log`, `clean-pin.log` and `clean-production-build.log`. The original integration's seven pre-existing generated DOC-4 file hashes remain unchanged and backed up. A DOC-only status update after the clean build does not alter this tested source runtime.

The full 29-file legacy Studio suite is still separate and red (220 pass, 56 fail, 2 skip). Its historical missing components and master-plan files were confirmed absent from baseline `138cd8be6342c0a3d2da473ffb12a030f00921e1`; they have not been reconstructed or masked. Owner review is needed before approving global Studio release, even though the **Canvas + Image + Text build unblock is verified**.
