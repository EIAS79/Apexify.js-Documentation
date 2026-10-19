# Workspace Production Release Gates

**P0 — mandatory acceptance policy. Production acceptance: NOT ACCEPTED.** Foundation merge and complete product acceptance are different events. All gates here start NOT_RUN for the eventual production candidate; baseline checks do not close them.

| Gate | Required evidence | Pass condition |
| --- | --- | --- |
| G00 Scope/identity | Exact source/runtime/artifact hash, ledger and release scope | All required current-v6 paths have dispositions/owners; partial or experimental rows are not counted FULL |
| G01 Whole-app build | Clean install including hooks/generated manifests, root typecheck/build, trace/payload/regressions | Real application succeeds on supported toolchains without blanket exclusions or disabled gates |
| G02 Boundaries/bundles | Import analysis, production client dependency inspection and capabilities | No legacy Studio implementation or Node/native/provider leak into browser runtime |
| G03 Schema/state | Validator/property/transaction/migration/storage fixtures | Valid round trips; rejected/corrupt data cannot damage a valid revision; history/recovery works |
| G04 Deep parity | Recursive option/variant/interaction inventory, UI/graph/compiler/source differential tests | Every mandatory capability passes the full applicable chain; differences/defaults explicit |
| G05 UI/docking | Reference comparisons and complete panel lifecycle/resize/focus flows | Approved design preserved; no unrecoverable gaps/windows; state/jobs survive closure |
| G06 Browser/a11y/devices | Chromium/Firefox/WebKit, target viewports, actual touch/device, manual+automated accessibility | Core flows usable by keyboard/assistive tech; applicable WCAG 2.2 AA; no unapproved browser/device blocker |
| G07 Artifacts/downloads | Actual signatures/decodes/probes and completed browser downloads | Correct dimensions/timing/samples/codecs/alpha; portable source/projects execute with assets |
| G08 Jobs/execution | State machine, sandbox, timeout/cancel/retry/idempotency and multi-instance tests | Real events; bounded admitted work; no host eval, duplicate runaway work or false completion |
| G09 Security/privacy | Threat model, malicious fixtures, dependencies, sandbox and anonymous artifact access | No unresolved critical/high issue or unapproved boundary violation; no private-input/secret disclosure |
| G10 Performance/recovery | Ratified device/workload/host budgets, load/soak/fault/cleanup | Measured budgets pass; final state preserved; no unbounded memory/process/temp/blob growth or data loss |
| G11 Hosted operations | Deployment SHA/runtime identity, native/binary integrity, real deployed smoke and rollback | Target host actually runs representative jobs; monitor/cost/retention/cleanup/rollback work |
| G12 Docs/handoff | Help, matrix, ADRs, ownership, runbooks and limitations | Released claims match behavior; users/maintainers can reproduce, diagnose and recover |
| G13 Final acceptance | Immutable reviewed gate/evidence index, report and post-promotion smoke | Every mandatory gate passes on the exact promoted candidate; no release-blocking defect |
| G14 Shared editor and frame/media workflows | AC01–AC12 across actual Visual/Code/Graph/Timeline/Frame Collection workflows | Independent frame edits/link scope, doodles/styles, precise clip/keyframe/audio timing, three-view parity, closed-panel recovery and real original-quality exports all pass |
| G15 Supplied function/API fidelity | All 14 audit mappings reconciled with exact runtime pin; units/default/return/dispatch/callback and reported-gap tests | No audit-only option, wrong root method, implicit callback execution or unimplemented connector/media behavior claimed FULL; missing reference domains audited upstream |

All mandatory gates block production acceptance. A limitation requires an explicit product/scope decision and updated user-visible claims. Renaming a security/data-loss defect experimental is not a waiver. Deferring an existing v6 gap does not satisfy full-v6 coverage.

## Test layers

| Layer | Required subjects | Evidence |
| --- | --- | --- |
| Unit/property | Schema, commands/history, graph order/types, interpolation, migrations/quotas | Boundary/invalid cases and meaningful invariants |
| Runtime/contract | Pinned public APIs, nested defaults/unions/interactions, media and limits | Real result/artifact and precise fixture/runtime identity |
| Differential | Visual/graph compilation vs generated source; browser vs Node | Same-backend byte equality or justified semantic/numeric/image/font/codec tolerances |
| API/integration | Origin/body/limits/admission/storage/sandbox/artifact/binary packaging | Real service behavior, concurrent failures and cleanup |
| Browser | Create/edit/sync/graph/run/export/save/reopen and panel lifecycle | Browser/version/viewport, actual UI state/result and completed downloads |
| Design/accessibility | Reference/responsive, contrast/focus, keyboard/screen-reader/touch | Manual+automated findings and captures |
| Security/fault | Host escape, SSRF/path/media bombs/active SVG, full storage/disk/offline/abrupt termination | Input, containment/rejection, cleanup and privacy evidence |
| Load/soak | Edit/play/resize/render/cancel/reload under overload | Ratified budgets, resource plateau, fairness and costs |
| Deployment | Actual root build, traced resources, cold/warm jobs and rollback | Source/runtime/native/deployment IDs and URLs |

## Per-format artifact verification

- PNG/JPEG/WebP: MIME/signature, decode, dimensions, transparency, quality/color semantics and unsupported browser-encoding failures.
- GIF: frame count/dimensions, loop/disposal/transparency, rounded timing, sampled-frame semantics and streaming memory behavior.
- WAV/audio: RIFF/WAVE metadata, sample rate/channels/count/duration, gain/clipping/sequence alignment, deterministic seeds and real playback.
- Video: ffprobe codec/container/fps/duration/resolution/audio, sampled decoded frames, overlays/timestamps/audio sync and process/temp cleanup.
- Source/project: completed download, valid schema and asset/font manifest, declared runtime/dependencies and independent execution; no undeclared website-relative artwork.
- Every format: immutable job/source revision, safe filenames, anonymous access isolation, expiry/retention, failure and cancellation races.

## CI/tooling deliverables

Suggested future commands: `workspace:inventory`, `workspace:test`, `workspace:parity`, `workspace:security`, `workspace:media`, `workspace:browser`, `workspace:a11y`, `workspace:boundaries`, `workspace:performance`, `workspace:verify`. These are W01–W05 deliverables, not existing commands introduced by this planning change.

Keep root `npm run typecheck`, `npm run build` and relevant regressions. Fast affected checks run per PR; domain/source/output tests accompany implementation. Pin upgrades re-run inventory/defaults/generated programs/affected domains. Expensive cross-browser/a11y/security/media/load/soak jobs run nightly and on release candidates. Every mandatory gate runs for release acceptance. Failed, unavailable, skipped and passed are distinct states. A preview feedback bot is not a technical gate.

## Evidence manifest

Proposed destination: `docs/workspace/releases/<release-id>/`. Reports/manifest must contain source/runtime/artifact/binary/compiler/schema identities; UTC timestamp; host/device/browser/toolchain/flags/deployment URL; gate/task/capability IDs; fixtures/seeds/assets/fonts; exact commands and outcomes; artifact hashes/metadata/captures/traces; tolerances; cancellation/cleanup/performance/cost results; finding severity/owner/remediation/scope approvals and residual limitations.

Keep private source/media/secrets out of evidence. Reuse old evidence only with a documented unchanged execution boundary. Changes to pins, schema/compiler/renderer, isolation, dependencies or deployment require affected gates again.

## Go / no-go

Go only when every mandatory gate passes, the deployed artifact matches the tested candidate, claims are accurate, no release blocker remains, operational ownership is explicit and rollback/post-release smoke are ready.

No-go if any required evidence is missing/failed, the candidate changed after tests, custom code escapes, recovery loses work, output/downloads are unverified, costs/resources are unbounded or unsupported capability rows are claimed FULL.

The owner approves scope and release acceptance; P0 priority never bypasses technical gates or authorizes unlimited spending.


## Additional mandatory acceptance contract

G14 covers all twelve cases in [MEDIA_TIMELINE_AND_AUTHORING_SPEC.md](MEDIA_TIMELINE_AND_AUTHORING_SPEC.md). Include fractional fps and variable source PTS, GIF quantization, sample-accurate audio/resampling, independent versus linked frame scope, seek cancellation/stale-response suppression, proxy/original quality, frame collection manifests and edit/reload/undo across all views.

G15 uses [FUNCTION_REFERENCE_MAPPING.md](FUNCTION_REFERENCE_MAPPING.md). The supplied audits are static and use a different runtime SHA from the site's package pin; reconcile and execute targeted tests rather than treating audit headings as successful execution. Public API signatures and native callback boundaries remain authoritative.

Both gates begin NOT_RUN. This documentation change does not implement or pass them.
