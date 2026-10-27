# Workspace Foundation Checkpoint — 2026-10-19

**Review status:** PARTIAL — supervisor review required. **Production:** NOT ACCEPTED.

This is an implementation-ready checkpoint and a record of findings, **not** an approval of the future media schema, a release-gate pass, or proof of installed Apexify runtime behavior.

## Repository source identities and evidence boundary

| Subject | Observed | Meaning |
| --- | --- | --- |
| Documentation GitHub `main` | `cec6e9d0931f2e5a88a10d016603f2b85e88f113` | Remote source commit inspected; **not** an installed working tree |
| Engine GitHub `main` | `cbeea053c2a973d4e867f8ca96e79546060dd62d` | Upstream tip; not equal to pinned site engine |
| Documentation `package.json` and lock root | `github:EIAS79/Apexify.js#379a5248f09ed39c1b1734fe104b6bd73a77857f` | Manifest/lock **declaration**, not proof installed artifact matches source |
| WIP branch | `codex/workspace-advanced-wip-20261019` at `209194cbe5d5b857c3aa7476127470cd5fae35bb` | Diverged: one commit ahead and six behind inspected `main`; **do not blindly cherry-pick** |
| Installed engine package | **NOT INSPECTED** | No full repository checkout and no `node_modules/apexify.js` available in the local sandbox |
| Hosting | Vercel project `prj_0LD8HS0Ba5RRlkHrNUsGarOWXCD5` | Project's deployment history connects to documentation repository |
| Remote changes | **NONE** | No commits, remote branches, pushes, PRs, releases, or deployments from this checkpoint |

`vercel.json` currently declares `git.deploymentEnabled` false for `*`, and true for `main` and `studio-preview`. Historical Vercel deployment records include a **CANCELED** deployment for a non-main work branch. Consequently, repository config alone is insufficient to guarantee zero preview jobs on push. Keep the overlay local pending an owner-controlled deployment-trigger verification/authorization.

## Implemented tooling, bounded scope

- `scripts/workspace/foundation-audit.mjs`: read-only audit of manifest and lock SHA declarations; records Node/TypeScript versions and Git identity (when a local checkout exists); hashes available installed package entrypoint independently; records all scanned Workspace TypeScript/JS files with content hashes; uses the TypeScript AST to inspect static import/export, `require` and literal dynamic imports; traces browser-reachable modules from client entrypoints; rejects detected legacy Studio and Node-native runtime imports into the browser graph; records actual `painter.method(...)` occurrences as **static call candidates only**; outputs an explicit audit JSON with `NOT_RUN`/`NOT_VERIFIED` production fields. Does not update the task ledger.
- `tests/workspace/foundation-audit.test.mjs`: five Node-native negative/positive tests for identity drift, absent installed artifacts, transitive Node import detection, disallowed Studio type-only imports, codegen template-literal false positives, and explicit parity incompleteness.

The script **does not** recursively audit the upstream public Apexify API, infer runtime defaults, prove browser bundle purity, validate behavior/output equivalence or certify the installed source commit. Its import graph is limited to syntactically imported local files in the three Workspace directories; bundler metaphile and package artifact checks remain mandatory before G02.

### How to run in a real development checkout

Place the script, test, and this note at their relative paths without replacing existing files. After a clean, pinned install:

```bash
node --test tests/workspace/foundation-audit.test.mjs
node scripts/workspace/foundation-audit.mjs --expected-pin 379a5248f09ed39c1b1734fe104b6bd73a77857f --output /tmp/apexify-workspace-foundation-audit.json
node --import tsx --test tests/workspace/contracts.test.ts tests/workspace/runtime.test.ts
npm run typecheck
npm run build
```

Review audit JSON and full build/test logs. The final four commands requiring a full checkout were **not executed** in this limited sandbox. The initial two commands were exercised against local fixtures only. Do not mark A01/W05 complete until the actual clean checkout and installed artifact have been independently verified.

## Source-backed baseline inventory

| Surface | Present in `main` | Key gap and consequence |
| --- | --- | --- |
| Authoring model | `features/apex-workspace/model.ts`: v1 document, background, layers (`text`, `shape`, `image`, `chart`), bounded validation | No canonical frame/track/clip/audio/media schema or migration/asset lifetime contract |
| Live code | `codegen.ts`: generated ApexPainter program and `parseSource` exact regeneration check | JSON composition literal only is reversible; arbitrary source remains opaque; no AST grammar |
| Graph | `components/Graph.tsx`: canvas-painted layer graph / select / run | Does not provide typed node graph or reversible graph editor |
| Browser preview | `client-render.ts`: POSTs JSON to `/api/workspace/render`, obtains Blob | Round-trip encoded PNG; not retained realtime browser renderer |
| Node renderer | `server/render.ts`: `ApexPainter.createCanvas`, `.createImage`, `.createText`, `.createChart` | Current real runtime scope limited to composition subset; pinned artifact not reproduced here |
| API route | `app/api/workspace/render/route.ts`: origin/content-type/body cap, two local jobs, abort/timeout | Only per-instance throttling; native operations may continue past cooperative abort; cannot claim isolation or cross-instance quotas |
| Tests | `tests/workspace/contracts.test.ts`, `runtime.test.ts` (foundation) | Seven tests exist; previous success reported by earlier baseline, **not rerun in this checkpoint** |
| Dock/UI | Nine-panel dark/neon shell | Must be preserved while adding genuine media semantics |

These findings are based on the inspected `main` files, not on executing the full app.

## WIP branch review: disposition

The inspected WIP contains `media-model.ts`, `MediaEditor.tsx`, `server/media.ts`, `server/ffmpeg.ts` and `AdvancedLayerEditor.tsx`, plus other editor changes. **No WIP source has been ported.**

- `media-model.ts` models a single layer tween using floating-second `duration`, `fps`, and a frame count; there is no rational timebase, shared playback evaluator, timestamped clips, independent frame snapshots, or sample-time audio. Do not adopt as the canonical C06/C07 model.
- `MediaEditor.tsx` previews via repeated `/api/workspace/render` PNG calls and plays via `setInterval`, so it does not satisfy retained-mode animation/time evaluation. Its decoded waveform code is a useful idea but needs ownership, cancellation, signal lifetime and resource tests.
- `server/media.ts` collects all video-frame PNG buffers in memory before encoding; time/resource/cancellation bounds require separate review before reuse. Media output signatures, timeline equivalence and real failure tests are absent in this checkpoint.
- `server/ffmpeg.ts` uses an unversioned shared temporary binary extraction path. Security, binary integrity, concurrency and deployment portability must be established before use.
- `AdvancedLayerEditor.tsx` contains useful path editing interaction concepts, but normalized path geometry, serializable path commands and Apexify native API conformance are not yet proved.

A05 remains incomplete because the full branch has not undergone per-file test review and runtime verification.

## Architecture decision records — **proposed, not approved**

### ADR-AWP-01: canonical application ownership

**Proposal:** keep independent authoring schema, view state, commands/history and persistence owned in `features/apex-workspace`, separate from Node renderer, browser preview and generated source. An editor project is portable JSON; it cannot contain live native canvas/video/audio objects, executable closures or instance-owned resource handles. Existing schema v1 imports require explicit migration before schema v2.

**Decision still required:** document stable IDs and project revisions; atomic transactions; opaque fields/forward-version policy; resource budgets; whether asset source snapshots live in IndexedDB, server storage or explicit portable manifests; recovery after quota/corruption.

### ADR-AWP-02: time and media semantics

**Proposal:** derive media time from a single rational project clock with integer timestamps and explicit conversions to source PTS and audio samples. Use half-open intervals `[start,end)`, explicit quantization, finite segment ranges and deterministic sampling. The same evaluator drives preview, graph, source and export; independently authored frame collections have source-sharing/override semantics rather than merely a GIF frame count.

**Not decided:** exact clock tick frequency/type (number-safe vs BigInt/string serialization), canonical non-integer-fps representation, variable-fps source import contract, rounding strategy for GIF centiseconds vs sample frames, edit-scope ownership, ripple semantics, audio resampler policy. Do not implement production timeline controls until B06/C06/C07 decisions and tests are approved.

### ADR-AWP-03: code execution and runtime isolation

**Proposal:** keep data-only current render route; do not add `eval`, Node `vm`, unrestricted worker threads, or full-Node source execution in the Next process. Dedicated custom-code jobs need a separately authorized resource-bounded execution service. Static import review is only a first perimeter, **not a sandbox**.

**Not decided:** isolation provider, VM/container hardening, blocked syscalls/network/filesystem, credentials, tenants and rate limits, host process termination, executable import allowlist, artifact retention. U01/U03 must provide threat evidence and owner authorization before arbitrary code is enabled.

### ADR-AWP-04: engine boundary and renderer

**Proposal:** Node adapters use verified public methods from the **currently pinned** source; browser realtime must use separately available, verified `@apexify/web` semantics, or an explicitly labeled application-owned interim browser renderer. No client imports from `apexify.js` Node facade. Any future engine update requires pin proposal, compatibility tests and explicit owner release decision.

**Not decided:** browser package readiness and performance/feature fallbacks, font/image parity tolerances, operation capability registry and precise upstream feature ownership.

## Threat inventory seed (U01)

Current exposed boundaries to test: `POST /api/workspace/render` on anonymous Next server; JSON/body/chunk timeouts; data URLs and image decode bombs; native bitmap/image/chart output limits; malicious/custom code; browser Blob/object URL ownership; imported project schema and local storage; future audio/video decode/FFmpeg/resource/process restrictions; unauthenticated artifacts; cross-instance rate controls; signed asset storage and secret redaction.

No claim of complete threat modeling, sandbox containment or safe public scaling is made by this seed.

## Mandatory follow-up package

1. Run audit and existing Workspace regression tests in an actual clean checkout. Record toolchain, installed package hash, Node source pin correlation, baseline typecheck and production build logs (A01/A03/W01).
2. Expand static API usage inventory into recursive public type/default/validator/variant traversal and actual v6 runtime tests; initialize a reviewable support/mapping ledger without claiming FULL (A02/A04/A06/A07).
3. Ratify B01–B07 interface and media/asset/timebase ADRs with the supervisor; implement deterministic schema/clock tests only after the semantic contract is approved (B01–B07/C01/C06/C07).
4. Use reproducible real repo/import/bundle data to extend boundary tests to production client bundles; validate security controls against real malformed requests (B04/U01/U02/W04/W05).

**No `TASKS.json` update:** groundwork is **partial and local**, not fully merged and production verified. All 16 release gates remain NOT_RUN.
