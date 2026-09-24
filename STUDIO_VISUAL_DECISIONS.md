# Apexify Studio Visual — Phase 0 Decision Log

> Branch: `studio-visual/v00-contract`
>
> Scope: decisions required by section 46 of the Visual Authoring Master Plan.

## SV0-DEC-001 — VisualProject naming and versioning

**Decision:** the persisted format is named **Apexify Studio Visual Project**. Files use `*.apexstudio.json`, contain `format: "apexify-studio-visual"`, and begin at `schemaVersion: 1`.

Schema changes that invalidate saved files require an explicit migration path. Editor implementation versions are not used as schema versions.

## SV0-DEC-002 — Apexify 6.x operation plan vs future ARS

**Decision:** `VisualProject` remains the authoritative editor/save model. For Apexify 6.x it lowers to a private Studio Operation Plan and current public Apexify calls. Future ARS is an optional compiler target beneath the Visual Project; ARS/Render IR is not stored as the authoritative project format.

## SV0-DEC-003 — Canvas groups and scenes

**Decision:** ordinary canvas/group composition lowers to sequential public Apexify operations by default. An explicit Scene node, SceneBuilder operation, component/template semantic, or behavior that requires scene identity lowers through scene APIs. Pure editor grouping does not force SceneBuilder output.

This avoids noisy generated code while preserving scene semantics when they are real.

## SV0-DEC-004 — Code formatting engine

**Decision:** generated code uses one small deterministic first-party formatter/emitter shared by browser and build/test paths. Visual Studio will not require a full third-party formatter in the browser. CI validates stable snapshots and TypeScript syntax.

## SV0-DEC-005 — Export asset path convention

**Decision:** exported projects place externalized assets under `./assets/` using stable sanitized file names. Internal `studio://asset/<id>` references remain an editor/runtime concern and must not leak into normal exported user code when a portable asset path can be emitted.

## SV0-DEC-006 — Vercel branch suppression

**Decision:** `vercel.json` owns an `ignoreCommand` that executes `scripts/studio/visual/vercel-ignore-build.mjs`. The command exits 0 for `studio-visual/*` branches (skip deployment) and exits 1 for `main`/other branches (continue deployment). Missing branch metadata fails open and continues the build.

## SV0-DEC-007 — Optional generated-project code splitting

**Decision:** the Generated Code view remains single-file whenever technically possible. Project export may split only when explicitly requested or when generated source exceeds 250 KiB UTF-8 or a single externalizable literal/data payload exceeds 64 KiB. Splitting must preserve a single-file view when technically possible.

Thresholds are codegen policy, not saved-schema semantics, and may be tuned with evidence.

## SV0-DEC-008 — Manual editing of generated code

**Decision:** v1 is Visual → Code, not bidirectional round-trip editing. Editing generated code creates/forks a Code Studio buffer and breaks the live Visual link after explicit user action. Visual state is never silently rewritten from edited source.

## SV0-DEC-009 — Future animation controls

**Decision:** a visual animation control is shown only when the pinned/current Apexify capability inventory identifies a supported stable runtime capability. Roadmap-only Phase 15+ animation APIs remain hidden from current Visual Studio controls until their package/API status is current and verified.

## SV0-DEC-010 — Plugin-provided visual controls

**Decision:** Visual Studio v1 does not expose an unrestricted plugin UI-extension API. Existing plugin operations are classified in the capability matrix and may be represented in Advanced tooling, but custom visual control injection is deferred until a versioned, sandboxed extension contract is designed.

This prevents plugins from bypassing project validation, code generation, history, or runtime safety.

## SV15-DEC-011 — Linked generated-code reconciliation and conflict recovery

**Decision:** Phase 15 revises **SV0-DEC-008** for the generated subset that Studio can prove reversible. The linked bottom Code surface may reconcile recognized deterministic edits back into the Visual Project. This does not expand the product promise to arbitrary JavaScript → Visual reconstruction.

The compatibility boundary is explicit:

- parser-backed canonical output from Phases 4–8 continues to accept the recognized literal/API subset and updates Visual state;
- marker-backed semantic output from Phases 9–14 reconstructs the complete saved Visual state exactly when its generated body is canonical;
- an edit to marker-backed generated code that Studio cannot reverse safely becomes a **linked-code conflict** instead of being silently ignored;
- a conflict offers two explicit recovery paths: **Restore canonical Visual code** or **Fork edit to Code Studio**;
- normal Copy/Download/Code Studio handoff strips opaque Studio semantic markers;
- optional compact provenance metadata may be added to exported code only when the user explicitly enables it.

The Visual Project remains authoritative while the buffer is linked. A fork into Code Studio is independent code and no longer claims live Visual synchronization.

## Decision status

All ten Phase-0 questions remain resolved. Phase 15 adds the explicit revision above for generated linked-code behavior; arbitrary JavaScript → Visual remains out of scope. Later phases may revise a decision only through a new logged decision with migration/compatibility impact.
