# Combined original-engine Workspace — verified integration

## Provenance and scope

- Protected accepted Canvas S18 source tree: `6e72ad07ef46196dda20f6e69dde9096eb2cfc63`, **preserved**, not reset or overwritten.
- Image authoritative source: `5493e23bfef9855abdd04f2b8f352ec894c93951` (329 FULL / 17 PARTIAL / 5 BLOCKED; 351 Image identities from 560 original records).
- Text final certification: `c185642728a47d47fccd2df51b80ce6a06276218` (440 FULL / 2 PARTIAL / 1 BLOCKED / 1 EXCLUDED).
- Canvas S18 ledger: 167 FULL / 8 PARTIAL_CERTIFICATION / 6 BLOCKED_UPSTREAM / 26 BLOCKED_SECURITY / 1 NOT_APPLICABLE.
- Pinned native engine `379a5248f09ed39c1b1734fe104b6bd73a77857f` unchanged; protected `@apexify/web` source unchanged; no S20/S21 engine candidate incorporated.
- Existing prepared integration candidate was first preserved as `D:\ApexifyWorkspaceIntegration\audit\IMG329_TEXT440_CANDIDATE_PRESERVATION\existing_candidate_before_new_final_image.zip` (SHA-256 `64246ee6113fc5893bc8c765bd16bff00d69ec92a4f13ad372b55632a44ffbdf`) and left untouched. A new separate worktree was based on the protected baseline.
- Historical Studio routes stay inactive; no video decoding, production deployment, merge, or GitHub push.

## Exact implementation reconciliation

**One previously existing production-source file changed:** `features/apex-workspace/components/ImageOptionsEditor.tsx`.

- Preserved the Image Stage G hex color editor for both Image and grouped stroke, shadow, and picker controls.
- Kept conditional solid-versus-gradient controls with native-proof semantics, SHA-verified upload/asset choices, Group mask, distortions, effects, and Graph option editing.
- Retained the prepared candidate's **pixelate-only integer region rounding**, so unrelated filters with x/y parameters remain capable of fractional values; independently verified in the real browser.
- Added the final Image Stage H Group mesh initialization: a native-valid 1×1 rectangular grid with four `controlPoints`, bilinear interpolation and transparent edge mode, instead of incomplete `{gridX:1,gridY:1}`.
- Did not replace protected shared model, Code generator, canvas runtime, text runtime, Graph, Inspector, asset store, or `vendor/apexify-web` source files.

The complete final Text `c185642^…c185642` delta brought forward certification/tests/evidence, **not an outdated shared Text runtime tree**. Ported final Image ledger, source-hashed evidence registry, 330 READY validation and browser/native tests, and failure-closed integrity tooling. The authoritative original Image signature is preserved in the integration relocation manifest; 46 historical proof payloads are mirrored by content hash, and 48 registry locations were rewritten to portable, self-contained relative references with **unchanged proof IDs and SHA-256 assertions**. `.gitattributes` protects those Image proof bytes from Windows LF/CRLF conversion.

**DOC-4:** Original seven tracked baseline files preserved with independent SHA-256 backup and post-production-build re-verification. Five *additional* generated manifests used by `npm run verify:pin` are included, without replacing those seven.

## Tests actually executed on integrated source

| Validation | Result | Evidence log under `D:\ApexifyWorkspaceIntegration\audit` |
|---|---|---|
| Full Workspace test runner (independent clean checkout, 59 `.test.ts` / `.test.mjs` files) | **2,040 total; 2,039 passed; 0 failed; 1 skipped** | `combined-full-workspace-clean.log` |
| Canvas S18 strict integrity, boundaries, WebP security and native cases | **254 passed, 0 failed** | `combined-canvas-s18.log` |
| Image 329-FULL strict ledger and 5,593 complete criterion references | **PASS**, independently in integrated and fresh checkout | `combined-image-integrity3.log` |
| Text strict integrity | **8/8 passed**, 440 FULL | `combined-text-integrity.log` |
| Integrated Image fixture/codegen validation | **330 valid; 330 invalid rejected; 220 numeric boundaries rejected; 0 missing parents** | `combined-validation-contract.log` |
| Combined Text font/native generated public Code and Inspector checks | **PASS** in independent full suite and targeted browser run | `combined-full-workspace-clean.log`; `combined-text-font-browser-1-2.log` |
| Text item font family/name browser Graph and history | **2/2 PASS** | `combined-text-item-font-browser-189-190.log` |
| Real Chromium Image upload, masks, Graph, Undo/Redo, IndexedDB, reload and project export | **PASS**, 6 screenshots | `combined-browser-image-upload.log` |
| Real Chromium hex color and pixelate integer-edit / CodeMirror synchronization | **PASS**, 2 screenshots and verified IndexedDB integer | `combined-browser-hex-pixelate.log` |
| Mixed Canvas/Image/Text Chromium acceptance | **PASS**, 6 steps / 5 screenshots / 0 failures | `combined-browser-mixed.log` |
| Explicit Code-to-Visual fail-closed tests (custom executable suffix, malformed composition, valid baseline) | **4/4 passed** | `combined-code-visual-failclosed.log` |
| TypeScript `tsc --noEmit` | **PASS** | `combined-typecheck2.log` |
| Normal `npm run verify:pin` | **PASS**, package, lockfile, generated manifest all agree | `combined-engine-pin2.log` |
| Production `npm run build` | **PASS**, 482 pages, including `/workspace` | `combined-production-build.log` |

The broad Workspace run was executed against an independent clean worktree at the integrated implementation commit, **not** inherited from the interrupted isolated Image run. The Image native test can regenerate reports, so the broad test ran in its own disposable checkout; the committed 329-FULL proof ledger remained untouched.

The production build reported an outdated Browserslist dataset notice. It was **non-fatal** and no dependency was silently repinned.

## Remaining limits — fail closed

- Image: `images.inherit` has no demonstrated Image-layer native effect; seven conic-angle, seven gradient-repeat, and two discriminated filter-radius paths remain conditional; four shadow-side/corner upstream restrictions and privileged `resolveAssetRefs` remain BLOCKED.
- Text: two optional `measureText.TextMetrics` baselines remain PARTIAL; one font path BLOCKED, one option EXCLUDED by the source contract. Do not inflate to 444 FULL.
- Canvas: retain the exact S18 ledger, including 8 PARTIAL, 6 upstream-blocked, 26 security-blocked, 1 not-applicable; never infer FULL from WORKSPACE_READY alone.
- Engine: preserve pinned native commit and security restrictions; don't install Canvas S20/S21 local tarball. Historical `/studio` routes require separate product and security approval.
- Browser evidence is grounded in the local Windows Chrome, native preview, actual IndexedDB, and project export files. It does not establish untested external deployments.

## Recovery

The final local recovery package must contain the complete Git bundle, committed source ZIP, portable binary patch based at `6e72ad07`, evidence/log archive, exact independent SHA-256 manifest, original Image source package reference and source/proof provenance. The original prepared candidate snapshot above remains separately preserved; no original checkout is cleaned, reset, or overwritten.
