# TEXT-01 Final Strict UI & Lifecycle Certification

**Repository:** EIAS79/Apexify.js-Documentation
**Assigned isolated branch:** `codex/workspace-parallel-text-strict`
**Accepted parent:** `eb78e7c5c35cd39b7acc6f4b0c27b9562302e912`
**Pinned engine:** `379a5248f09ed39c1b1734fe104b6bd73a77857f`

## Final classifications

**440 FULL; 2 PARTIAL; 1 BLOCKED; 1 EXCLUDED = 444.** These counts refer to **certification evidence**, not implementation-readiness statuses. Source inventory: 399 `WORKSPACE_READY`, 43 `WORKSPACE_READY_RESULT`, 1 `BLOCKED_SECURITY`, 1 `MIGRATED_EQUIVALENT`. Exact path order, identity, model, and source classifications are retained. Original inventory SHA-256: `85e806402af2ae72184c460866e785fba5a04c275bfe0f5f09daac9cdceeaec7`.

**FULL authoring: 399/399.** All 399 have independent native behavior and generated-executable-Code parity (reused accepted campaign), schema validation, actual browser Inspector changes, Graph changes for 389 nested options (the 10 baseline layer controls have no duplicate Graph property editor), Undo/Redo, and exact canonical-model verification. All 399 also passed *actual* IndexedDB project storage and browser reload checks. Parameterized UI map, transaction records, failed attempts and passing retries are in `evidence/workspace-text/strict/ui-*.json` and logs. The prior 389/389 invalid-input tests remain authoritative. The current browser campaign also exercised insertion/removal/reordering of text runs and gradient stops. Selected effective native-render differences were additionally retested for bold, multiline lineHeight, maxHeight clipping and font weight. The five documented non-pixel fields are certified via measurement/selection semantics, not a fabricated pixel delta.

**FULL measurement results: 41/43.** Each observable native field was extracted from the real browser's `/api/workspace/text-metrics` result and validated by a 43-path JSON proof file; complete JSON is accessible in Inspector. Generated public Apexify.js Code still calls native `measureText()`. These fields are read-only outputs, not separate authoring controls. Grouped/multiline/character measurements were covered in the inherited pinned-native suite and new browser run.

### Open PARTIAL records (2)
- `measureText.TextMetrics.hangingBaseline` and `measureText.TextMetrics.ideographicBaseline`: the pinned declaration marks both as *optional numbers*; implementation forwards only finite values from the underlying `@napi-rs/canvas` `ctx.measureText()`. Both are absent in that native result. Omission complies with the declared contract; the correct strict disposition remains **PARTIAL / COMPLIANT_OPTIONAL_ABSENCE_UNOBSERVED** rather than fabricated FULL or a required-value defect.

### Newly FULL font paths (2)
- `createText.TextProperties.font.family` and `createText.TextProperties.font.name`: promoted only after verifying two installed and trusted-backend-registered fonts, **Arial** and **Courier New**, with distinct native glyph rasters and widths; nested `font.name` overrides `font.family`. Focused public generated-Code executions match native pixels, and both browser paths pass Inspector/Graph, Undo/Redo, IndexedDB, reload, exact generated semantics, PNG-preview difference and project JSON export/import. No arbitrary `font.path` is exposed. Font availability remains host-specific; another rendering host must install or register appropriate fonts to guarantee identical rendering.

### Purposeful exclusions
- `createText.TextProperties.font.path`: **BLOCKED** for security. No arbitrary font filesystem paths are exposed to the browser or metrics API.
- One deprecated flat-alias record: **EXCLUDED** from duplicate controls, while native alias fallback and nested-over-legacy precedence have prior test evidence (`NATIVE-LEGACY-PRECEDENCE-001`).

## Browser/native evidence provenance and scope

Each FULL record has a separate ordered ledger entry with native/Code IDs, control-event IDs, Undo/Redo, IndexedDB and reload IDs plus common route proofs where one shared mechanism handles all properties. Native pixel changes were observed per path in the earlier accepted campaign; a **shared** real Chromium transaction proves the Workspace native-PNG preview route and Code→Visual+PNG pipeline. This is **not** 399 independent Chromium image-diff screenshots and is **not** an independently implemented browser typography renderer. Font/browser pixel-identical output is expressly not claimed.

New proof and logs:
- Inspector, Graph, Undo/Redo: `ui-matrix-{0-80,80-160,160-240,240-320,320-399,389-399}.json` and explicit 4 single-path retries.
- IndexedDB + reload: `ui-lifecycle-{0-50,50-100,100-150,150-200,200-250,250-300,300-350,350-399,374-389}.json`. Fifteen group-transform lifecycle paths initially failed when `isGrouped` was disabled; rerun with valid grouping precondition **15/15 passed**. No production defect.
- `ui-array-mutations.json`: text runs insert/reorder/remove, gradient colors stop insert/reorder/remove.
- `ui-43-measurement-results.json` and `ui-measurement-browser-corrected.log`: all 43 read-only field identities checked in real Chromium; 41 observed.
- `ui-export-import-browser-success.log`: actual project JSON download/import, CodeMirror generated Code edit, successful Code→Visual apply, server-native PNG.
- `native-effective-edge.json`: fonts tested with a pair of names and got identical native result; bold, lineHeight, maxHeight, weight output difference proven.
- `ui-final-certification.log`: machine-readable 444 path reconciliation and proof gates.
- Accepted `accepted-native-suite.log`: 15/15; `live-api-smoke.log`: streamed 80 KB cap, input limits, 2 concurrency slots, same-origin, font path denial, native metrics/PNG.
- Existing Code/native and 389 validation shard logs remain unchanged, reusable and linked at each FULL row.

Global TypeScript failures are the five **pre-existing Canvas S13 test errors**, not new TEXT-01 errors. The Text implementation, engine pin and the bounded metrics endpoint were not modified in this pass.

## Version-control recovery

A temporary Git directory backing the previously clean linked worktree was unexpectedly removed by Windows Temp cleanup. The original pointer was saved under evidence and a **new dedicated isolated Git object store** reconstructed from the Stage A, contract and strict verification bundles plus upstream history. The strict working files were never reset or overwritten during Git recovery. Only this Text worktree was reattached; no unrelated worktree was repaired or modified. The original accepted commit and recovery bundles are preserved; stage the final evidence on the assigned Text branch only.

## Remaining closure requirements

Both requested font probes now demonstrate genuinely different registered/system glyphs and metrics, so the two font paths are FULL. Only the two optional baseline measurement outputs remain PARTIAL. If the underlying Canvas provider exposes those optional metrics in the future, rerun result extraction only. **No engine repin, Git push, merge, deployment, or unrelated Canvas/Image edits were made.**

## Historical machine-readable consistency correction (previous checkpoint, 25 October 2026)

The 444-record ledger was reconciled against its existing authoritative proof objects after the final UI campaign. **At this earlier checkpoint, the totals were 438 FULL / 4 PARTIAL / 1 BLOCKED / 1 EXCLUDED.** All 438 FULL records now carry `fullCertificationGate: "PASS: ..."` rather than the obsolete `OPEN:` warning. The 397 FULL authoring records now report separately the **387 individually tested Inspector + Graph controls** and **10 individually tested Inspector baseline controls with no separate Graph editor**. Per-option native, Code, history, IndexedDB, reload, and effect evidence remains attached. `browser.perPathInspectorGraphUI` references the actual per-path UI transaction ID, while the server-native PNG preview is explicitly identified as **shared verified browser infrastructure**, not a per-path screenshot or independent browser renderer. The 41 FULL read-only `TextMetrics` records retain `NOT_SEPARATE_INPUT`, correctly distinguishing result extraction from editable controls.

At that earlier checkpoint, the four PARTIAL records were `font.family`, `font.name`, `hangingBaseline`, and `ideographicBaseline`. The font paths have subsequently been promoted by the targeted evidence below; optional result fields remain PARTIAL. The `font.path` security block and canonical legacy-alias exclusion were not changed. Original inventory identities, ordinal positions, canonical model, source status, native pin, and complete proof objects were preserved.

- SHA-256 before correction: `81807c8703828aaa7a67d97a6006b7dc501ad0745ed290c8135b5472d1b95881`
- SHA-256 after correction: `d68473dc0656eb7b59107ed24a82a665373286a855e73d37d0f225eeb00304ba`
- Original pinned inventory SHA-256: `85e806402af2ae72184c460866e785fba5a04c275bfe0f5f09daac9cdceeaec7`
- Machine-readable reconciliation: `evidence/workspace-text/strict/ledger-consistency-reconciliation.json`
- Integrity checks: `evidence/workspace-text/strict/ledger-consistency-integrity.log`, **6/6 PASS**, including deliberate `OPEN:` / `UNPROVEN_FOR_THIS_INVENTORY_PATH` negative cases.

This was a **metadata/proof-consistency correction only**. The 399-path native, generated-Code, browser, and lifecycle campaigns were not rerun; no implementation or engine change was necessary.

## Supervisor A — final four-path closure investigation (25 October 2026)

**Latest disposition: 440 FULL, 2 PARTIAL, 1 BLOCKED_SECURITY, 1 EXCLUDED = 444 original records.** The two newly FULL authoring records are `TEXT01-STRICT-0002` (`font.family`) and `TEXT01-STRICT-0003` (`font.name`). The two still-PARTIAL optional outputs are `TEXT01-STRICT-0410` (`hangingBaseline`) and `TEXT01-STRICT-0411` (`ideographicBaseline`). No other record classification was changed.

Pinned engine source (`node_modules/apexify.js/dist/esm/index.js`, locked to `379a5248f09ed39c1b1734fe104b6bd73a77857f`): `resolveTextFontIdentity()` uses `font.name` before `font.family`, and defaults to Arial only if both are absent; `setupTextFont()` sets the resolved family on Canvas. The former DejaVu Sans/Serif effective-output test had no evidence those families were installed or registered on the Windows host. The new targeted experiment uses two actual system-provided fonts, Arial and Courier New, and additionally registers the same two sources under explicit aliases with trusted server-only `GlobalFonts.registerFromPath()`. It does not enable `font.path` in Workspace or API requests.

**Native result:** Both font paths show distinct actual RGBA glyph pixels; example width for the same sample text is 835.15 px with Arial versus 936.15 px with Courier New (the Workspace-generated composition sample independently measured approximately 859.19 vs 936.15 px). The pinned engine correctly respects `font.name` precedence over an opposing `font.family`. Exact registered-font source hashes, output pixel hashes and metric measurements appear in `evidence/workspace-text/strict/final-four/font-native-registration-and-optional-metrics.json`.

**Generated public-v6 Code:** Both font paths independently generate executable code for both Arial and Courier New, preserve exact nested semantic font values via Code-to-Visual parse round trip, and produce pixel-identical output to their native composition counterparts. Evidence IDs `NATIVE-FOUR-FONT-FAMILY-CODE` and `NATIVE-FOUR-FONT-NAME-CODE`, recorded in `font-generated-code-equivalence.json`.

**Real Chromium and Workspace lifecycle:** `UI-FOUR-FONT-FAMILY-001` and `UI-FOUR-FONT-NAME-001` each passed actual Inspector = Arial, Graph = Courier New, native PNG preview changed, Undo = Arial, Redo = Courier New, indexedDB = Courier New, reload = Courier New, project JSON export = Courier New, project JSON import = Courier New and generated source contains the exact selected font. A clean browser profile was required to avoid persisted `font.name` masking `font.family`, consistent with the engine's real precedence rule. Evidence `font-browser-targeted.json`. This proves native PNG browser preview output and does not claim a separate browser-native typography renderer.

**Optional baseline investigation:** `TextMetrics` declarations have `hangingBaseline?: number` and `ideographicBaseline?: number`. `metricFields()` copies either field only if the underlying `@napi-rs/canvas` `ctx.measureText()` field is a *finite number*. Direct native observations found neither field, while other optional metrics (`alphabeticBaseline`, `emHeightAscent`, `emHeightDescent`) are available. This is a **compliant optional absence**, not evidence of an upstream breach or a required-field bug. Keep these records PARTIAL with `COMPLIANT_OPTIONAL_ABSENCE_UNOBSERVED`; never invent numeric values or separate input controls. If optional values are required by a future specification, file a separate upstream request to the Canvas/engine maintainers to supply finite numeric baseline metrics where supported, with explicit platform coverage. Do not repin without authorization. Source and finite-only forwarding references are in `engine-contract-audit.json`.

The rendered font choice remains dependent on the target host having the requested fonts installed or trusted-backend registered; unsupported font names can still fall back. No font binaries are included in the certification artifacts. This targeted investigation added no application engine, UI, metrics API or security implementation changes, and did not repeat any completed 399-path campaign.

**Authoritative targeted ledger hash (SHA-256):** `342e7c54e2425ba24e4bd365d6f99a6db2445a3088bad3090cc0b276fd5359ef`. The original inventory hash remains `85e806402af2ae72184c460866e785fba5a04c275bfe0f5f09daac9cdceeaec7`.
