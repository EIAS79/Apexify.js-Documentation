# S22 — Create Canvas native completeness and controlled Workspace integration

## Scope and provenance

- Isolated Workspace branch: `codex/createcanvas-workspace-remediation-s22`, forked from accepted S21 `410387c55d118696e1105f879fbde448249c7b29`.
- Isolated local native engine commit: `eea149fccb3c5d98b9a9497834313950946dacdb`, forked from S20 `9fe8b95f372efdadcd5ebdab1e9f6333413187c6`.
- Reviewable GitHub native engine commit: `b6ca97cfc675b16a52c2c7b5d0ff881b87b911be`, at `https://github.com/EIAS79/Apexify.js/tree/codex/createcanvas-native-remediation-s22`. GitHub contains the original remotely accepted branding state and the isolated approved S20/S22 native changes; the local S20 parent is not used as a publicly installable SHA.
- Candidate `package.json` and lock pin `github:EIAS79/Apexify.js#b6ca97cfc675b16a52c2c7b5d0ff881b87b911be`. Normal npm installation, DOC-4 extraction, generated docs, DOC-5 executable examples, DOC-7 consistency and production build were verified against this exact published SHA.
- Protected accepted Workspace `CanvasImageText` stays at `6e72ad07ef46196dda20f6e69dde9096eb2cfc63`; seven previously dirty generated source files and package files match the original S21 audit hashes. Protected S21 branch and S20 engine checkout remain at their original heads. No merge, deploy, or change to accepted production pin was performed.

## Native remedies and evidence

The strict Canvas option-path registry remains exactly **208 paths** (identical option IDs and index ordering to S21). **Nine paths were promoted to FULL** using native raster, executable generated-Code RGBA parity, typed/canonical Graph and Code validation, precise Inspector/Graph Chromium changes, Undo/Redo, export, and persisted IndexedDB reload:

1. `canvas.gradientBg.startAngle`
2. `canvas.patternBg.gradient.startAngle`
3. `canvas.bgLayers.pattern.gradient.startAngle`
4. `canvas.shadow.gradient.startAngle`
5. `canvas.stroke.gradient.startAngle`
6. `canvas.patternBg.gradient.angle`
7. `canvas.bgLayers.pattern.gradient.angle`
8. `canvas.shadow.gradient.repeat`
9. `canvas.customBg.filters.radius`

Strict S22 summary: **179 FULL, 2 PARTIAL_CERTIFICATION, 0 BLOCKED_UPSTREAM, 26 BLOCKED_SECURITY, 1 NOT_APPLICABLE**. Verified registry: `docs/workspace/CREATE_CANVAS_STRICT_CERTIFICATION_S22.json`; compact matrix `docs/workspace/CREATE_CANVAS_COVERAGE_S22.json`. Inherited S21 ledger stays intact and immutable.

The following **two partial paths remain intentionally below FULL**:

- `canvas.blendMode`: A root Canvas painted on a newly allocated surface has no pre-existing external destination to blend against. No contrived visual effect or broader API assertion is used to promote it. Existing per-background-layer blend modes are separate independently effective paths.
- `canvas.shadow.borderPosition`: Deprecated historical alias, recognized for backward compatibility with `roundedCorners` precedence, not an independent modern native authoring control.

The **26 video/media security-blocked paths remain blocked**; no unsafe video source execution, remote URL access, decoder bypass, or network fetch is introduced. `painterOpts.resolveAssetRefs` remains NOT_APPLICABLE.

## Tested surfaces and release gates

- Native engine `npm run build`, native S22 regression (10/10), and original unit and compatibility tests passed.
- Workspace nine-path native, Code, Graph, and filter-radius tests passed (10/10); native installed cross-domain Image/Text/Canvas tests passed.
- Real Chromium: 9/9 new S22 paths passed Inspector+Graph native pixel changes, undo/redo, exported project and executable code, and persistence after reload; inherited S21 four-path Chromium regression passed (4/4). Original browser scripts and JSON/screenshots are retained in the external S22 audit directory.
- Strict S22 ledger invariant tests passed (3/3), including exact SHA, no promotions outside the nine documented paths, immutable 26 blocked security paths and two retained partial paths.
- Original S12 pixel geometry tests were updated only where they required the previously inert `startAngle` or `PatternGradient.angle` to remain NO-OP. Shared image-filter compatibility was preserved separately from the stricter Canvas filter `radius` validator.
- DOC-5 four examples were independently typechecked and executed against the packaged installed S22 engine (4/4 verified), with exact new SHA provenance.
- `npm run verify:pin` and DOC-7 package/source/identity consistency passed. `npm run build` passed with the new exact engine SHA and 482 generated static pages; homepage, Gallery, documentation, examples, and Workspace compiled.
- Complete serialized Workspace regression, including the strict S22 integrity test, is archived in `audit/S22_CANVAS_FINAL_COMPLETENESS/S22_FINAL_56_FILES_EXACT_GITHUB_PIN.txt`. The terminal marker confirms `S22_WORKSPACE_SERIAL_DONE pass=56 fail=0` on the exact GitHub pinned engine.

## Control boundaries

The following are **not** changed or implicitly approved: inherited Studio/Web runtime's separate legacy pin, current deployed site, remote default branches, existing Gallery selected design or layout, 26 security-blocked video paths, the deprecated shadow alias as a first-class feature, or the root-blend API semantics. The S22 candidate is a separately reviewable implementation; merge and deployment are owner-controlled release decisions.

## Audit location (authorized Windows workstation)

`D:\ApexifyWorkspaceIntegration\audit\S22_CANVAS_FINAL_COMPLETENESS`

This location contains native snapshots, test logs, browser reports/screenshots and exported Code artifacts, exact package-pin and production-build results, isolated-start manifest, pre-GitHub tarball archive, and preserved original generated evidence. See the S22 recovery manifest for hashes and replay instructions.
