# Studio source audit — 2026-10-17

**Scope:** read-only audit performed after Gallery/API work. **No Studio source files were changed.**
Audited GitHub source: main at 01d0761839b551f9208c6ef62293c97b8c67b98f.
This is a code/manifest audit, not an end-to-end signed-off browser or isolated media-run validation.

## Findings by priority

### P0 — deep runtime parity is not demonstrated

The committed STUDIO-PARITY-0 report at
generated/studio/runtime-parity/gap-summary.json identifies:

- runtime under audit: a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a;
- installed runtime pin **at that report's creation**: db96446ef51ede70febb03892d86b599483a4302;
- a pin mismatch, explicitly identified as PARITY-RUNTIME-PIN-DRIFT;
- 226 inventoried public surfaces and 69,501 recursive records;
- 0 FULL surfaces at the baseline;
- 68,247 UNKNOWN records, 167 PARTIAL, 206 MISSING, 968 RUNTIME-ONLY
  among the report's combined status counts.

**These are historical baseline numbers, not a fresh assessment of current
Apexify.js.** Main currently pins 379a5248f09ed39c1b1734fe104b6bd73a77857f
in package.json and isolatedNodeExecutor.ts. Regenerate the current deep
inventory and compare against actual browser/Node behavior before claiming
full Studio parity. The parity check script intentionally prohibits promoting
legacy classifications to FULL without evidence.

### P1 — full runtime proof must include deployed isolation

app/api/gallery/run/route.ts exposes the local trusted runner only when
NODE_ENV is not production and ENABLE_LOCAL_APEXIFY_CODE_RUN=true. Production
selects a same-origin isolated path when capabilities exist.
lib/studio/runtime/isolatedNodeExecutor.ts contains a restricted Deno design,
a single active-run concurrency limit, a 256 MB V8 heap budget and typed
artifact handling.

This is a **promising architecture**, not proof that every deployed platform
preserves sandbox isolation. Required live probes:
- no filesystem read beyond explicitly materialized assets/workspace;
- no arbitrary network, host shell or unrestricted FFmpeg arguments;
- CPU/time/output quotas enforced on malicious loops and oversized media;
- rejected commands leave no worker/temp resource behind;
- capability-disabled environment shows a clear unavailable state;
- multiple simultaneous users cannot bypass singleton/resource admission.
Never enable the trusted-local execution flag on production.

### P1 — Visual ↔ Code parity and persisted state require regression evidence

StudioShell mounts Code Studio and lazily visits Visual Studio. Both share a
StudioSharedSessionProvider. VisualStudio.tsx provides a crash boundary and a
selective Visual autosave reset; this is good defensive design.

Still require real cross-runtime checks for:
- nested authorable CanvasConfig/image/text/chart/scene options;
- Visual edit -> generated Apexify.js -> exact runtime render;
- safe reversible code edit -> Visual reconciliation -> equivalent regeneration;
- unsupported source must display an explicit sync boundary, not silently drop;
- undo/redo, autosave/recovery, import/export and asset persistence after refresh;
- no node-only dependencies in browser preview bundle.

Use the STUDIO-PARITY master plan as the acceptance contract; do not equate
UI field presence with runtime capability or result equivalence.

### P1 — Gallery -> Studio handoff boundary

FieldInspector sends source through STUDIO_INCOMING_SNIPPET_KEY and only exposes
Open in Studio when the source endpoint labels the item studio-eligible.
Validate with multi-page advanced recipes, language switches and large source.
The receiving Code Studio must preserve all imports/assets/auxiliary files or
explicitly warn when a recipe is project-level and not independently runnable.

The original five self-contained Motion Field .mjs recipes should stay distinct
from multi-output Peak Lab project recipes.

### P2 — dependency advisory triage

One observed Vercel install log reported **17 npm audit advisories**
(1 low, 2 moderate, 13 high, 1 critical). This is not a verified exploit of
Studio; inventory affected packages, reachable code and patched versions.
Do not blindly execute npm audit fix --force against pinned media runtimes.

## Recommended verification sequence

1. Reconcile the Gallery branch with latest main while preserving Studio fixes.
2. Re-generate Studio parity baseline with the actual installed current runtime.
3. Execute Studio Visual/code round-trips and representative media workloads
   on a Vercel preview (Node/Chrome and production Deno/FFmpeg availability).
4. Exercise dangerous-input isolation and resource-budget tests.
5. Test keyboard, responsive panels and WCAG contrast in Code and Visual modes.
6. Run current studio:visual:verify, studio:parity:check, runtime fixture tests,
   TypeScript/build checks and source-backed output equivalence where applicable.
7. Treat unresolved PARTIAL/MISSING/UNKNOWN paths as release limitations.

**Audit disposition:** Documentation/Gallery release can proceed independently
if its own gates pass. Studio should not be labeled “complete parity” or
“fully production proven” from the current historic parity report.
