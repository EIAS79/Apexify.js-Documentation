# Apexify Studio Visual Authoring Contract

> Program: `STUDIO-VISUAL`
>
> Phase: `STUDIO-VISUAL-0`
>
> Status: ACTIVE — contract baseline
>
> Source of truth: `APEXIFY_STUDIO_VISUAL_AUTHORING_MASTER_PLAN.md`

## 1. Product terminology

The following terms are canonical for the Visual Studio program.

- **Code Studio / Code mode** — the existing Apexify.js code → runtime → preview workflow.
- **Visual Studio / Visual mode** — structured visual authoring that produces preview and generated code from one semantic project.
- **Visual Project** — the versioned saved semantic project represented by a `.apexstudio.json` document.
- **Visual Capability Matrix** — the generated classification of every current Studio-relevant public Apexify capability.
- **Studio Operation Plan** — an internal deterministic lowering of a normalized Visual Project into current public Apexify operations. It is not a public engine IR.
- **Preview adapter** — the route that executes the operation plan through real Apexify runtime behavior.
- **Code generator** — the deterministic emitter that converts the same operation plan into clean user-facing Apexify.js TypeScript.
- **Editor overlay** — non-content UI such as handles, guides, rulers, selections and snapping markers. Overlays are not an Apexify renderer.

## 2. Code/Visual mode contract

1. Code mode remains a first-class product and its execution behavior is not replaced by Visual mode.
2. Visual mode is additive and may reuse project/session, assets, diagnostics, history, runtime routing and artifact infrastructure.
3. Visual mode must not introduce a second shadow renderer for user content.
4. Switching modes must never mutate user code silently.
5. Generated Visual code is a derived artifact. Editing that code forks into Code mode; v1 does not promise round-trip Code → Visual synchronization.
6. A Visual Project remains the authoritative source while the user is in linked Visual mode.

## 3. One semantic source

The required flow is:

```text
Visual Project
  -> normalize + validate
  -> Studio Operation Plan
     -> real Apexify preview route
     -> deterministic Apexify.js code emitter
```

Preview and generated code may not consume separate semantic editor states.

## 4. Existing Studio infrastructure is authoritative input

The Visual program extends the existing declaration-driven Studio completeness system rather than replacing it.

Base evidence:

```text
scripts/studio/studio-completeness.ts
generated/studio/capability-matrix.json
scripts/studio/studio-proof-registry.ts
STUDIO_COMPLETENESS_CONTRACT.md
```

Visual Phase 0 derives its inventory from that committed base matrix. The base gate must pass before the Visual matrix is trusted.

## 5. Visual capability classifications

Every current Studio-relevant public capability must be classified as exactly one of:

- `visual-property`
- `visual-object`
- `visual-operation`
- `timeline-operation`
- `project-operation`
- `export-only`
- `hosted-runtime-exclusion`
- `not-applicable`

A generated row also records:

- editor section;
- control schema family;
- project-model field;
- preview runtime route;
- code-generation mapping;
- existing proof-case IDs;
- planned owning phase.

A `planned` control mapping is a contract only. It does **not** mean a UI control has shipped. A control may ship only when it changes real Apexify behavior.

## 6. Saved project format

The v1 saved project format is:

- file convention: `*.apexstudio.json`;
- format identifier: `apexify-studio-visual`;
- schema version: integer `1`;
- canonical schema: `schemas/studio/visual-project.v1.schema.json`.

The saved format is an editor/product format, not Apex Render Specification (ARS) and not engine IR.

Stable node IDs survive edits, reordering, code generation, undo/redo and reload.

## 7. Current Apexify 6.x vs future ARS

Current lowering:

```text
Visual Project -> Studio Operation Plan -> Apexify 6.x public calls
```

Future lowering may add:

```text
Visual Project -> ARS -> Apex compiler/runtime
```

ARS is a compilation target. It does not become the authoritative persisted Visual Studio project format without an explicit schema migration decision.

## 8. Generated-code contract

Generated code must:

- default to one clean TypeScript file;
- use public Apexify APIs;
- contain no Studio harness/runtime protocol internals;
- use deterministic names, formatting and property order;
- keep semantic assets/components/templates intact when the project uses them;
- be equivalent to the authoritative Visual Project for proof projects.

## 9. Development isolation

Every phase works outside `main`.

Phase 0 branch:

```text
studio-visual/v00-contract
```

Iteration order:

```text
edit
-> focused local/static validation
-> runtime/browser smoke where materially needed
-> fix
-> repeat
-> optional manual GitHub Actions only at a deliberate final verification point
```

Vercel is not the iterative debugger.

## 10. Phase-0 gate

STUDIO-VISUAL-0 cannot complete until:

- this contract and the master plan are committed;
- every current base capability has exactly one Visual classification;
- capability generation is deterministic;
- unclassified capability count is zero;
- the v1 project schema draft is committed;
- all ten Phase-0 open decisions are recorded;
- branch/CI/Vercel suppression policy is executable;
- the Visual Phase-0 verification workflow is green.


## 11. Phase-14 advanced operations contract

STUDIO-VISUAL-14 activates the existing **Advanced** Inspector, the feature-rail context panel, **Diagnostics**, and the top **Export** workflow. It does not create a competing permanent Operations dock.

Advanced project state is stored in the existing Visual Project `operations` and `outputs` collections.

Every authored advanced operation has one linked-code classification:

- `reversible` — canonical Visual state can be reconstructed exactly from the Phase-14 source marker;
- `normalized` — source is accepted and normalized to the canonical Visual representation;
- `code-only` — exported code is preserved, but hosted Studio Preview does not pretend the operation is locally available.

The Phase-14 runtime surfaces are:

- `ApexPainter.batch()`;
- `ApexPainter.chain()`;
- `ApexPainter.prepareForRender()`;
- `ApexPainter.use()`;
- compatible `painter.plugins` registry/install/remove operations;
- local output conversion through `painter.output.dataURL/base64/blob/arrayBuffer`;
- configured output conversion through `toOutput()`;
- normalized legacy `outPut()` compatibility.

The hosted Studio exclusions remain explicit and non-authorable:

- `ApexPainter.save()`;
- `ApexPainter.saveMultiple()`;
- `ApexPainter.createAudio.save()`;
- `ApexPainter.output.url()`.

Host-filesystem persistence and credentialed third-party transfer must never be represented by fake Visual controls.

Package-backed plugin imports are `code-only`: they are emitted in exported TypeScript but skipped by hosted Studio Preview unless that package is part of the controlled Studio runtime. Inline plugins and registry API configuration remain previewable.

GitHub Actions in this repository are manual-only during active phase implementation. They may be invoked deliberately for a later final verification pass; ordinary pushes, PRs, and merges do not require or trigger them.

## 12. Phase-15 export and round-trip contract

STUDIO-VISUAL-15 hardens the existing Generate Code modal, top Export menu and linked bottom Code editor. It does not add a second permanent export/code dock.

Generated-code contract:

- linked Visual code may carry private semantic markers required for exact reconstruction;
- normal user-facing Copy/Download/Code Studio handoff strips those opaque markers;
- exported source is canonically formatted, uses public Apexify APIs, and is checked for Studio-runtime protocol leakage;
- compact provenance is opt-in and does not appear in normal generated code;
- single-file TypeScript remains the default.

Project export contract:

- optional project export is a deterministic ZIP bundle;
- the canonical entry is `src/index.ts`;
- portable asset export writes stable sanitized files under `./assets/` and rewrites `studio://asset/<id>` references;
- round-trip-manifest mode may preserve base64 assets and Studio references explicitly for archival/re-import workflows;
- omit-assets mode is explicit and emits a warning;
- the bundle may include the existing validated `*.apexstudio.json` project source;
- the bundle may include `package.json` and `tsconfig.json` scaffolding;
- `apexify-studio.export.json` records deterministic project/source/file hashes and export warnings;
- the default generated-code view remains one file; optional project export does not silently change the linked editor into a multi-file editor.

Linked-code round-trip and conflicts:

- parser-backed recognized edits reconcile to Visual state;
- marker-backed generated domains reconstruct exact canonical state;
- edits that cannot be safely reversed must return a conflict and must never be silently discarded or applied partially;
- conflict recovery is explicit: restore canonical Visual code or fork the edited clean source into Code Studio;
- arbitrary imperative JavaScript remains outside the Code → Visual guarantee.

The Phase-15 gate covers every deterministic authoring generation from Phases 4–14, canonical regeneration stability, project serialization, asset strategies, generated-code syntax, deterministic bundle output, and the conflict/recovery UI contract.

## 13. Phase-16 mechanical feature-completeness contract

STUDIO-VISUAL-16 closes the gap between a capability being *classified* and being mechanically evidenced as implemented in Visual Studio.

Authoritative Phase-16 evidence:

```text
lib/studio/visual/feature-completeness.ts
scripts/studio/visual/phase16-proof-projects.ts
scripts/studio/visual/phase16-feature-completeness.ts
scripts/studio/visual/phase16-feature-completeness.test.ts
generated/studio/phase16-feature-completeness.json
generated/studio/phase16-feature-completeness.md
```

The generated report is derived from the current Visual capability matrix plus the declaration-driven DOC-4 option inventory. It may not replace those upstream inventories with a manually maintained list.

The Phase-16 gate fails when any authorable capability lacks:

- an implemented capability state;
- a permanent product-surface home;
- a control or Advanced-schema mapping;
- a Visual Project field;
- generated-code mapping;
- a hosted Preview runtime route;
- proof-case evidence;
- an owning phase with repository-backed control/codegen/Preview/regression files;
- reverse-sync classification and reconciliation regression evidence.

Option completeness is evaluated by option family. Every authorable option family must map to either first-class Visual controls or an explicit Advanced schema. Hosted exclusions and non-authoring/introspection rows remain explicit rather than being converted into fake controls.

Reverse-sync evidence follows the shipped contracts:

- parser-backed Phase 4–8 domains are `reversible`;
- marker/semantic Phase 9–13 domains are canonical/normalized;
- Phase-14 advanced operations use their existing `reversible | normalized | code-only` contract;
- hosted exclusions are excluded from authoring and Preview.

Representative Phase-16 proof projects must cover every authorable domain and must produce both canonical user-facing Apexify.js code and Preview code. Canonical generated source must reconcile back into its Visual Project without semantic drift.

GitHub Actions remain manual-only. The Studio Visual workflow generates the Phase-16 JSON/Markdown report as a short-lived verification artifact before running the consolidated Visual verification command.
