# TEXT-01 — Strict per-path execution report (24 October 2026)

## Disposition
Strict certification: **OPEN / NOT ACCEPTED**. This is an isolated TEXT-01 report, not combined Workspace acceptance.

Authoritative accepted implementation HEAD: `0268866063c602a5ba708004f6e4c8789a8cb8b3`. Pinned engine: `379a5248f09ed39c1b1734fe104b6bd73a77857f`. Worktree: `D:\ApexifyWorkspaceParallel\text-strict-20261023`. Branch: `codex/workspace-parallel-text-strict`. No engine repin, push, merge or deployment.

## Authoritative 444-record reconciliation
Read directly from `docs/workspace/TEXT_OPTION_INVENTORY_TEXT01.json`, SHA-256 `85e806402af2ae72184c460866e785fba5a04c275bfe0f5f09daac9cdceeaec7`.
All 444 identities match in order and model/status against accepted inventory reconstruction, triple SHA-256 `cb57070d8656f1556b63214555e24ba8bbe8b2b8a3a9fdb5b919965e7e63f2ca`. Omitted: 0. Duplicate: 0. Drift: 0. Source statuses: 399 WORKSPACE_READY, 43 WORKSPACE_READY_RESULT, 1 BLOCKED_SECURITY, 1 MIGRATED_EQUIVALENT. Significant enum variants and numeric/named weight branches exercised by parameterized native and Code cases.

## Final strict disposition
**0 FULL / 442 PARTIAL / 1 BLOCKED / 1 EXCLUDED**. The 442 PARTIAL records are implemented authoring/result routes without the complete *individual* Inspector/Graph/lifecycle Chromium proof chain. They are not 442 implementation failures.
- `font.path`: BLOCKED, intentionally excluded from client/server Workspace APIs to prevent arbitrary filesystem access; native engine support is not an authorization to expose it.
- Deprecated flat aliases: EXCLUDED *as duplicate authoring controls*, but support remains through canonical nested fields. Pinned-native nested-over-flat precedence passes `NATIVE-LEGACY-PRECEDENCE-001`.
- Native SVG/browser text rendering: not claimed. Visual preview is the server-native PNG. Font availability can differ among hosts.
- 381 of 399 authoring paths caused a PNG pixel change against the baseline. Other paths may be no-op at selected/default values or measurement/editor-only; do not misclassify these without effect-specific comparison.

## Fresh tests and exact evidence
- Accepted native Stage A contract/stream security regressions: **15 passed, 0 failed**: `evidence/workspace-text/strict/accepted-native-suite.log`.
- Parameterized native probes, 8/8 shards passed: `probe-0-of-8-rerun2.log`, `probe-{1..7}-of-8.log`. **399/399 authoring records exercised**, including 389 nested specification leaves + 10 legacy/base geometry paths. Per-path log refs and SHA-256 are in the 444-ledger. All significant enum, boolean decoration and font-weight variants covered.
- Executable generated-source tests: **8/8 final shards passed**, including retry of shard 2: `code-parity-{0,1}-of-8.log`, `code-parity-2-of-8-retry-final.log`, and `code-parity-{3..7}-of-8-resume.log`. **399/399 authoring paths** had generated JavaScript executed with native PNG pixel-equivalence. There were graphics-memory crashes in superseded attempts.
- Negative canonical input validation: **8/8 shards passed**, `validation-{0..7}-of-8.log`. **389/389 schema leaves** have targeted invalid-input rejection IDs `VALIDATION-0001` etc.; the baseline 10 paths retain Stage A validation/native checks.
- Live metrics API smoke: `live-api-smoke.log`: native two-run metrics; blocked `font.path`; cross-origin/fetch-site; 80 KB streamed body cap without Content-Length; malformed JSON; 12,000-character limit; failure slot release; native PNG export.
- Real Chromium: `live-chromium-rerun.log`, `01-native-typography-inspector.png`, `02-typed-graph-with-text-editor.png`, `03-persisted-text-after-reload.png`. UI numeric weight 350; curve sweep 120; integer measurement canvas 256; native metrics; Graph→Inspector change; undo/redo; reload persistence all PASS. Screenshots SHA-256 recorded in ledger.
- TextMetrics: 43 recorded result identities, 41 with at least one observed native property. `hangingBaseline` and `ideographicBaseline` are **not present** in measurements under default, multiline/char, curved, nor additional explicit hanging/ideographic placement tests; independent evidence `native-baseline-fields.log`. Do not synthesize those values.
- Build: Controlled Next.js 14.2.35 **production build passed** in `production-build-single-worker-3072.log` after Windows host-memory contention prevented earlier attempts. Single-worker test configuration restored to original SHA-256 `B85E32A5DEA14AA88CC5C32ABAF3DF6B3D7D4F8C23D279F2BE8E789667C4CAD6`.
- TypeScript: `typecheck-final.log` has **exactly 5 known unrelated Canvas S13 test errors**, no new TEXT-01 errors. Typecheck global gate remains red.
- Older test-probe attempts: **43 failures, 43 superseded by passing evidence, zero unresolved**. Initial fixture mistakes and memory-pressure retries preserved for audit; they are not 43 production defects.

## Remaining strict-certification gates
1. A browser-native renderer is not independently proven; server-generated PNG preview is the supported contract.
2. Execute automated per-path Inspector and Graph edits with validation boundaries and persistent recovery for **all 399** authoring paths, including add/remove/reorder for arrays, gradient stops and text runs; compare each edit to native output and compiled source, not just stored settings.
3. For measurement results, classify the 2 native-absent fields against pinned engine API contract and report applicable absence independently; no synthetic values.
4. Demonstrate all relevant per-option undo/redo, Code→Visual mutation/reload, export effective deltas in a real browser; current Chromium pass is representative.
5. Restore the unrelated Canvas S13 TypeScript failures only under their owning lane, not TEXT-01.

The authoritative machine-readable result is `docs/workspace/TEXT01_STRICT_CERTIFICATION_444.json`. The ledger gives each path its inventory identity/order/status, classification, native evidence IDs and hashes, generated-source parity IDs and hashes, negative validation evidence, metrics observations, and remaining FULL gate.
