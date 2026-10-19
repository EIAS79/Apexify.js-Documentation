# P0 — Highest Priority: Standalone Workspace Production

**Project roadmap priority: HIGHEST / P0.** Directed by the project owner on 2026-10-19. P0 denotes product-delivery priority, not incident severity or a completion claim.

The independent `/workspace` UI and working foundation are merged through [PR #158](https://github.com/EIAS79/Apexify.js-Documentation/pull/158). **Full production acceptance remains open.**

Start with:

1. [A–Z production master plan](docs/workspace/PRODUCTION_MASTER_PLAN.md): 26 workstreams, 170 tasks, dependencies and acceptance criteria.
2. [Capability and gap matrix](docs/workspace/CAPABILITY_MATRIX.md): current support versus required coverage.
3. [Release gates](docs/workspace/RELEASE_GATES.md): required evidence before production acceptance.
4. [Task board](docs/workspace/TASKS.json): machine-readable delivery status.
5. [Specification alignment](docs/workspace/SPECIFICATION_ALIGNMENT.md): constraints from supplied runtime/engine plans.

Execution requirements:

- Preserve the approved dark/neon reference and standalone workspace-owned files. Do not restart the UI or build on legacy Studio components/state/styles/executors.
- Every panel and sidebar closes/reopens/resizes independently; remaining windows reclaim space. Content, state and jobs survive panel closure.
- No login, profile, avatar, account system or dashboard requirement.
- Start with A/B/U and baseline testing: audit current runtime, architecture, schema and execution trust boundaries before expanding features.
- Deeply cover actual pinned v6 options and interactions. Controls must execute; code, graph, output and persistence must agree.
- Keep arbitrary code isolated outside the application server. Project JSON stays data-only.
- Update task/capability status and actual evidence together. Do not mark the workspace production-ready until mandatory release gates pass.

Unfinished advanced work is safely preserved on [codex/workspace-advanced-wip-20261019](https://github.com/EIAS79/Apexify.js-Documentation/tree/codex/workspace-advanced-wip-20261019). It is unvalidated reference code requiring selective review, correction and tests.


## Required authoring scope clarification

The [shared media/timeline contract](docs/workspace/MEDIA_TIMELINE_AND_AUTHORING_SPEC.md) is mandatory P0 scope: editable images/text/filters/layers/styles/templates; freehand doodles/lines; independent frame collections; a familiar multitrack timeline for GIF/animation/video/audio; and synchronized Visual, Code and Graph. Audio is time/sample-based. Follow the [function-reference mapping](docs/workspace/FUNCTION_REFERENCE_MAPPING.md), preserve real API boundaries and pass AC01–AC12 plus G14/G15. The program now contains 170 tasks, 32 capability rows and 16 release gates.
