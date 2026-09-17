# DOC-12 — Release and Future-Phase Documentation Contract

This file is the permanent handoff from the Documentation Architecture Pre-Phase to every later Apexify.js engineering phase. It does not start Phase 15 and it does not describe roadmap APIs as shipped.

## 1. Binding rule

Any later Apexify phase that **changes public behavior** must update and verify documentation in the **same implementation phase**. A package change is not release-complete merely because package CI is green.

Public-behavior changes include exports, signatures, options, defaults, errors, resource limits, runtime/package support, capability behavior, performance characteristics, security guidance, animation or interaction semantics, examples, migration behavior, package structure, or other user-observable contracts.

## 2. One documentation release gate

The authoritative documentation release verification entry point is:

```text
npm run docs:verify:release
```

The permanent GitHub Actions implementation is `.github/workflows/doc12-final-release-gate.yml`. It establishes fresh deterministic prerequisites, executes inherited DOC-1 through DOC-11 contracts, validates the current package candidate, performs the DOC-12 final audits, and verifies the checksummed evidence index.

A green partial phase workflow is not a substitute for this release gate.

## 3. Release-candidate boundary

The package and documentation repositories are separate. They therefore synchronize through immutable candidate identity, never through an implicit assumption that two mutable branches happen to match.

A release candidate is identified by all of:

```text
package repository
package commit
package version
packed artifact filename
packed artifact SHA-256
public export/declaration identity
```

For a candidate release, the package side is frozen first, packed, and checksummed. The docs gate consumes that exact artifact/commit as explicit input. It must not infer package truth from an unrelated local checkout.

The current DOC-12 gate additionally compares the live package `main` candidate against the documentation's pinned package artifact. If their public exports/declarations differ, documentation certification fails until the docs package pin, generated API reference, examples, search and release evidence are updated against the new candidate.

## 4. No circular repository wait

Use this sequence:

```text
Apexify candidate SHA
        ↓
package build + npm pack
        ↓
artifact + checksum
        ↓
documentation verification against candidate
        ↓
API / option / example / search / build / browser gates
        ↓
release approval
```

Do not create a workflow where package CI waits for an unstable docs branch while docs CI waits for an unstable package branch. The immutable candidate commit/artifact is the synchronization boundary.

## 5. Required documentation impact checklist

When a future phase changes a public feature, verify every applicable item. `NOT APPLICABLE` requires a reason and evidence; omission is not a pass.

1. **Package/runtime metadata** — package identity, supported runtime, stability and version are correct.
2. **Guide/concept documentation** — users can understand the feature and its intended usage.
3. **API reference** — every shipped public symbol/member is represented by generated package truth.
4. **Options** — every public option is represented.
5. **Defaults** — defaults are documented from authoritative metadata/behavior.
6. **Errors** — structured errors and meaningful failure modes are documented.
7. **Resource limits** — relevant limits, budgets and rejection behavior are documented.
8. **Runtime/capability behavior** — support, fallback and runtime differences are explicit.
9. **Performance** — material cost characteristics, budgets or measured guidance are updated when behavior changes.
10. **Security** — trust boundaries, validation, network/process/media implications and safe usage are updated when relevant.
11. **Animation/interaction semantics** — timing, transitions, interruption, interaction and reduced-motion behavior are documented when applicable.
12. **Executable example** — meaningful new public capability has a verified example when practical.
13. **Search/discovery** — the new or changed capability is present through the existing DOC-6 index/relationships.
14. **Migration/versioning** — breaking/deprecated/changed behavior has migration guidance when applicable.
15. **API/example verification** — generated reference and examples are verified against the exact release candidate artifact, not speculative source internals.

## 6. Future package onboarding

Future packages such as `@apexify/core`, `@apexify/node`, `@apexify/web`, `@apexify/react`, `@apexify/next`, `@apexify/plugin-sdk`, or optional packages must reuse the existing documentation architecture.

A new package must provide real package/runtime metadata, normalize generated API data into the existing reference contract, register examples through the existing example platform, rebuild the existing search system, and use the existing status/capability/runtime/navigation architecture. It must not create a second API site, second search engine, second example registry, or duplicate interactive workspace.

ROADMAP fixtures remain test-only until real packages exist. They cannot become CURRENT product claims merely because the docs architecture can render them.

## 7. Current versus future truth

Visible production navigation and reference content must describe shipped capabilities only. Future Web, React, Next.js, animation, diagnostics/intelligence and other Phase 15+ systems remain ROADMAP/PREVIEW only when supported by their actual implementation state.

The future-phase integration playbook remains `DOC10_FUTURE_PHASE_INTEGRATION_PLAYBOOK.md`; this DOC-12 contract adds release-blocking enforcement and candidate identity requirements.

## 8. Generated truth and freshness

Generation and verification are separate operations.

The release gate regenerates or checksum-verifies deterministic manifests before dependent checks. Maintainers must not patch expected JSON snapshots manually to make a gate pass. API/reference truth comes from packed package artifacts; examples come from repository-controlled sources plus packed-artifact execution; search comes from current normalized records; routes and redirects come from current content/manifests.

Large Lighthouse reports, screenshots, browser traces and logs may remain CI artifacts. Stable summary evidence is schema-versioned, source-SHA-bound and checksummed under `generated/docs-doc12/`.

## 9. Contributor reproduction

For ordinary documentation work, run the owning phase verifier during development. Before release or any later public-behavior phase closes, run the full release workflow. The release command intentionally fails if required browser/Lighthouse or explicit package-candidate evidence is missing; absence of a required gate is not green-by-omission.

If package and docs changes are being developed together, freeze the package candidate first, pass its tarball path and commit identity to the DOC-12 package-candidate verifier, then execute the complete documentation release gate.

## 10. External verification

DOC-11 deliberately distinguishes lab evidence from real-user field INP. DOC-12 must preserve that distinction. A release summary may be `EXTERNAL_VERIFICATION_PENDING` for genuine field-only evidence, but it may not fabricate field metrics or convert TBT into INP.

Repository/hosting settings that cannot be enforced from source code (for example, making a GitHub check required in branch protection) must be recorded as external operational verification rather than silently claimed as configured.
