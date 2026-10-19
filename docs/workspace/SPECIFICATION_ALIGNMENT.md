# Specification Alignment and Scope Decisions

**AWP / P0.** This program is for the independent `/workspace`. It uses the supplied engine documents as architecture constraints and future dependencies. It does not re-use the legacy Studio implementation or treat historical completion claims as evidence.

The input files were supplied separately by the owner. [SOURCE_INPUTS.json](SOURCE_INPUTS.json) records exact content hashes for reproducible provenance. This plan is self-contained; those files are not build-time/runtime dependencies or claims that the proposed engine packages are published.

## Input-to-workstream map

| Supplied document | Requirement carried into the workspace plan | Workstreams |
| --- | --- | --- |
| 00_MASTER_PLAN_AND_EXECUTION_ORDER.md | Preserve the ApexPainter model; explicit portable/runtime boundaries; direct browser rendering; optional intelligence; phase ordering | A, B, M, V, X, Z |
| 01_PHASES_15_19_FOUNDATION.md | Package separation, portable model/IR/compiler/versioned specification and safe Node migration as upstream contracts | B, C, N, U, W |
| 02_PHASES_20_25_WEB_REALTIME_ANIMATION.md | Retained web rendering, incremental state, deterministic shared animation, layout and explicit React/Next boundaries | B, F, K, O, V, Y |
| 03_PHASES_26_31_RENDERING_DEPTH.md | Resource scheduling, typography, vectors, color, charts and browser-media capability negotiation | G, H, I, J, P, Q, R, V |
| 04_PHASES_32_36_PERFORMANCE_NATIVE_EXTENSIBILITY.md | Measured cache/stream/acceleration/native decisions and versioned extension contracts | B, S, U, V, W, X |
| 05_PHASES_37_40_INTELLIGENCE_DEVTOOLS.md | Diagnostics/profiling before optional AI, source mappings and useful developer tooling | M, N, V, X |
| 06_PHASES_41_43_DISTRIBUTED_RELIABILITY_FINAL.md | Cross-instance job/resource policy, recovery/soak/fault evidence and final release gates | S, T, U, V, W, Y, Z |
| 07_ENGINE_CONTRACTS_AND_STANDARDS.md | Dependency direction, validation/determinism/security/cleanup contracts and evidence-backed completion | B, C, U, V, W, Z |
| 08_FEATURE_COMPLETENESS_MATRIX.md | Full nested feature/variant coverage; truthful status vocabulary; no partial capability counted complete | A, all domains, W, Z |
| 09_MIGRATION_RELEASE_SEQUENCE.md | Staged migration, compatibility, reproducible package/runtime identity and evidence before promotion | A, C, W, Y, Z |
| 10_MASTER_EXECUTION_PROMPT_PHASES_15_43.md | End-to-end phase protocol and validation discipline; future-engine execution starts only when its prerequisites are actually satisfied | A, B, W, Z |
| 11_ANIMATION_AND_INTERACTION_SYSTEM_SPEC.md | One first-party evaluator, interpolation/easing/repeats/interruption, interactions/reduced motion and deterministic media sampling | F, J, O, P, R, V, W |
| 12_PACKAGE_AND_PURITY_ARCHITECTURE_SPEC.md | Pure portable/core/web dependencies and isolated Node/framework/assistant concerns | B, U, V, W, Y |
| 13_BROWSER_REALTIME_RENDERER_SPEC.md | Retained scene/resources, dirty updates/direct presentation, DPR/resize/worker lifecycle, capability and bundle tests | B, D, F, V, W, Y |
| 14_APEX_INTELLIGENCE_AND_AI_SPEC.md | Deterministic diagnostics first; AI optional, outside render hot path, no default private-content egress | U, V, X |
| APEXIFY_ADVANCED_ENGINE_MASTER_PLAN_PHASES_15_43.md | Combined roadmap context; keep individual phase/spec contracts coherent and upstream readiness explicit | A, B, Z |
| APEXIFY_STUDIO_DEEP_RUNTIME_PARITY_MASTER_PLAN (1).md | Retain the rigorous source-to-controls-to-code-to-output-to-persistence proof principle; do not import Studio architecture/code or inherit its completion ledger | A, all domains, M, N, T, W, Z |

## Binding decisions and conflict handling

1. **Current owner direction controls product scope.** The fresh `/workspace` remains separate from `/studio` and `/studio/workspace`; no login/profile/account/dashboard UI is introduced. Preserve the accepted reference design and existing working foundation.
2. **Implementation is authoritative for current capability.** Verify the exact pinned runtime artifact and source/validators/types/tests before exposing controls. Source, installed artifact and npm tags are different identities.
3. **Historical Studio parity is a method, not a code dependency.** Rebuild the capability ledger and adapters for this workspace. Do not copy broad old completeness claims, state shapes, styles or execution assumptions.
4. **Server-PNG preview is an incomplete fallback.** Its existing operation does not satisfy retained browser realtime requirements. V01 and the appropriate upstream renderer contract must replace the interaction hot path before realtime support is FULL.
5. **Editor UI dependencies are not portable engine dependencies.** React/Next/editor libraries in this application do not authorize dependency leakage into core/web engine packages; browser bundles must exclude Node-native execution.
6. **Custom code and declarative data are separate trust boundaries.** Never eval JSON/expressions or untrusted programs in the app server. Choose isolation via ADR and prove its limits; a worker proposal or process wrapper alone does not establish a secure full-Node runtime.
7. **Code reversal has a defined grammar.** Arbitrary programs remain preserved when they cannot become visual nodes. Supported compositions must round-trip; unsupported ranges must not be silently dropped.
8. **Animation semantics are shared.** Do not build incompatible chart/GIF/video/React timeline systems. Adapt the engine evaluator and expose capability/version limitations.
9. **Media dependency reality stays explicit.** FFmpeg/native codecs may remain behind approved Node execution. No fake zero-dependency or codec-independence claim is permitted.
10. **Production claims require production evidence.** Domain completeness needs the entire applicable execution/code/graph/persistence chain. Isolated fixtures and feedback bots do not prove the whole deployed application.
11. **Future capability tracks stay versioned.** AI, GPU/HDR/native and distributed extensions need explicit upstream APIs, readiness, compatibility, privacy/resource decisions and tests. They are not silently added to current v6 support.
12. **Scope/priority does not waive quality.** P0 means highest roadmap focus. It does not bypass security/data-loss gates, authorize unrelated infrastructure spending or justify destructive changes to existing work.

Record unresolved conflicts as task blockers/ADRs with an owner, actual runtime evidence and a concrete decision. Never hide them by weakening validation or changing support labels.


## Owner-supplied function references and media-editor clarification

The 2026-10-19 clarification adds fourteen source-audit documents covering canvas/image/shared styles/text/scenes/templates/GIF/animate/audio/video/paths/connectors plus index and method map. See [FUNCTION_REFERENCE_MAPPING.md](FUNCTION_REFERENCE_MAPPING.md) for each input, task binding and caveat, and SOURCE_INPUTS.json for all 31 input hashes.

The owner requires real editing in Visual, Code and Graph and a timeline-oriented workflow for GIF, animation, video and audio. [MEDIA_TIMELINE_AND_AUTHORING_SPEC.md](MEDIA_TIMELINE_AND_AUTHORING_SPEC.md) defines editable frame collections, doodles/styles, multitrack clips/keyframes, precise audio time/sample behavior, shared selection/scope, source/export fidelity and AC01–AC12. This extends the original plan's broad timeline descriptions into mandatory workflows, adding 40 tasks and G14/G15 while keeping the approved layout and standalone/no-login boundaries.

The newly supplied audit SHA `cbeea053c2a973d4e867f8ca96e79546060dd62d` differs from the actual pinned runtime `379a5248f09ed39c1b1734fe104b6bd73a77857f`. This plan does not update the pin or certify the audit as runtime proof. A06/A07 must reconcile behavior first. Reported ignored connector shadows, degenerate two-point smoothing/bezier, angle units, animate return modes, videoBg still behavior, audio speed/pitch and video dispatch semantics are explicit verification targets, not assumed newly fixed features.
