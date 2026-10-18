# Apexify Workspace Studio — planning and migration hub

**Current active program:** WORKSPACE-STUDIO (WS), 2026-10-18. This replaces the previously separate Code/Visual Studio execution roadmaps. This is a planning and safe legacy-preservation change, **not** the completed new Studio.

## Read in order

1. [MASTER PLAN](./WORKSPACE_STUDIO_MASTER_PLAN.md) — exactly what the unified product is, data/model/source/runtime/security/features/release principles.
2. [SOURCE AUDIT & CAPABILITY TRUTH](./SOURCE_AUDIT_AND_CAPABILITY_TRUTH.md) — verified code locations, limits, unresolved coverage, precise proof required for real engine claims.
3. [UX / RESPONSIVE / SCROLL SPEC](./UX_RESPONSIVE_INTERACTION_SPEC.md) — the approved canvas-first UI, focus-mode switches, collapsible panels, responsive sizing and scroll/focus behavior.
4. [EXECUTION ROADMAP & RELEASE GATES](./EXECUTION_ROADMAP_AND_RELEASE_GATES.md) — WS-00..WS-16 with dependencies, tasks, gates, tests, staged production/rollback.
5. [Existing Studio code audit](../audits/STUDIO_SOURCE_AUDIT_2026-10-17.md) — an earlier source review; historical parity caveats still apply.

## Legacy / production routes

- /studio — remains original StudioShell / Code+Visual product until new workspace is verified and explicitly promoted.
- /studio/legacy/code — preserved original Code Studio, default opening in Code mode.
- /studio/legacy/visual — preserved original Visual Studio, default opening in Visual mode.
- Future /studio/workspace — **not built or released yet**; new design implemented here behind a flag, then promoted to /studio at WS-15.
- No legacy saved project, browser storage key, executor or asset file is deleted by the planning stage.

## Plan lifecycle and supersession ledger

| Existing plan or evidence | Effective status | Preservation action |
|---|---|---|
| APEXIFY_STUDIO_VISUAL_AUTHORING_MASTER_PLAN.md | **SUPERSEDED/HISTORICAL** as active work schedule | status header updated; implementation source/test references retained, no STUDIO-VISUAL-16+ restart |
| STUDIO_FULL_APEXIFY_EXECUTION_PLAN.md | **SUPERSEDED/HISTORICAL** as new roadmap | status header updated; backend guarantees still required |
| STUDIO_VISUAL_CONTRACT.md | **LEGACY MIGRATION REFERENCE**, no longer controlling roadmap | core technical invariants preserved until proven new equivalence |
| STUDIO_VISUAL_DECISIONS.md | **HISTORICAL DECISION RECORD** | VisualProject schema, codegen and asset portability decisions remain migration inputs |
| STUDIO_COMPLETENESS_CONTRACT.md | **TECHNICAL REFERENCE** | public route classification must be rechecked under actual current pin |
| STUDIO_SAME_ORIGIN_RUNTIME.md | **CURRENT SECURITY REFERENCE** until replaced by proven stronger equivalent | same-origin Deno isolation/FFmpeg mediation must not be weakened |
| generated/studio/runtime-parity/BASELINE.md and gap-summary.json | **HISTORICAL BASELINE** | known stale runtime pin; do not claim live FULL/UNKNOWN numbers |
| generated/studio/runtime-parity/phases/PHASE-2-PLAN.md | **SUPERSEDED REBUILD BOARD**, completed historical phase evidence retained | do not restart separate workstream; migrate outstanding valid gaps into WS-10 |
| generated/studio/runtime-parity/phases/PHASE-3-PLAN.md | **SUPERSEDED REBUILD BOARD**, completion report preserved | same; compare open PR #140/#142 before reuse |
| User-supplied APEXIFY_STUDIO_DEEP_RUNTIME_PARITY_MASTER_PLAN.md (not tracked in this repo at audit date) | **HISTORICAL PARITY DESIGN INPUT** | principles incorporated in WS-00/WS-10; not treated as new parallel active program |
| Apexify.js engine Phases 15–43 | **NOT SUPERSEDED** by this Studio work | independent engine roadmap unaffected |

**Meaning of “stop previous plan”:** do not schedule additional feature implementation against the superseded Studio master plans. Keep their code/tests/proofs and all unmerged branches. No claim is made that independent active work sessions, GitHub PRs or CI jobs were forcibly stopped; coordinate and reassign before implementing overlapping code.

## Decisions locked for initial implementation

1. One project, three switchable authoring projections (Visual, Code, Graph).
2. Real Apexify.js methods and pinned package runtime, with explicit Code-only cases.
3. Existing Visual and Code routes preserved for rollback.
4. One optional drawer and inspector, one primary editor, bottom queue/timeline collapsed by default.
5. Charcoal/lime editorial website tokens; restrained lavender/cyan/amber; dark/light/accessibility.
6. Scroll and responsive behavior tested from 320px up through large desktop, with internal region scrolling.
7. No automatic Code→Graph rewrite of arbitrary JS or pretending future engine features have shipped.
8. New project storage and migration is non-destructive; no cloud persistence claim until built.
9. Queue is real Studio orchestration only where backend supports it; no fake progress.
10. Release through isolated feature route, CI, media/runtime proof, staged preview, rollback and explicit promotion.

## Next action

**Start WS-00** with exact current dependency SHA validation, recursive runtime option inventory and a reconciliation review of open Studio PRs and existing saved-format migrations. WS-01 responsive shell should not claim feature completeness. Do not alter production /studio UX yet.
