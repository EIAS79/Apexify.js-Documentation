# DOC-8 Execution and Security Boundary

This document records the security model for DOC-8 interactive execution. It is intentionally conservative: the current Apexify.js package is Node/server-oriented, so DOC-8 does not fabricate browser-native execution or expose arbitrary public code execution.

## Public production behavior

`/api/gallery/run` does **not** execute arbitrary submitted code in production. Production mode reports execution as unavailable and rejects execution requests with HTTP 503.

Public arbitrary JavaScript execution: **disabled**.

Remote script execution: **disabled**.

Arbitrary npm/package installation: **disabled**.

## Trusted-local development mode

Current server-backed execution is a development tool only. It requires both a non-production environment and explicit opt-in:

`ENABLE_LOCAL_APEXIFY_CODE_RUN=true`

This mode is **not a security sandbox**. It is intended only for trusted local development input.

## Trust model

- Repository-controlled verified examples are trusted inputs for deterministic documentation evidence.
- User-edited source must be treated as untrusted for public deployment and therefore is not executed publicly.
- Share-state data is user-controlled and must not contain secrets.
- Browser/native future runtimes are not present in DOC-8; the `WebRuntimeAdapter` is a contract only.

## Environment

The local child process receives a constructed allowlisted environment rather than inheriting `process.env`. The route supplies only the small set of values required for local execution, including development mode, package/module resolution, controlled output/error locations, and platform path values where necessary.

Common application secrets and unrelated host environment values are not copied into the child environment.

## Filesystem

Each local run receives a per-run temporary working directory. Generated output is constrained to the controlled run location. Cleanup runs recursively in `finally`, including failure/timeout paths.

The runner does not provide a persistent user filesystem and does not install packages dynamically.

## Network

Network isolation is **not implemented** for trusted-local execution. The child process may have the ambient network access of the local host/process environment.

For that reason this mode must not be called a sandbox and must not be enabled as a public arbitrary-code service.

## Child processes and timeout

The current runner uses a bounded child-process execution path with a central timeout. Public production execution is disabled; trusted-local use remains responsible for the limitations of host-level process isolation.

## Central resource limits

All DOC-8 execution/share ceilings are defined in `DOC8_RESOURCE_LIMITS` in `lib/docs/playground/contracts.ts`:

| Limit | Value | Purpose |
| --- | ---: | --- |
| Execution time | 55,000 ms | Bound local process duration |
| Source characters | 280,000 | Reject oversized submitted source |
| Output bytes | 26,214,400 (25 MiB) | Bound generated output |
| Process buffer bytes | 20,971,520 (20 MiB) | Bound captured process output |
| Share-state bytes | 65,536 (64 KiB) | Bound URL/share payloads |
| Maximum outputs | 1 | Bound per-run output multiplicity |

The UI/session contracts and current Node runner reference this shared limit model instead of maintaining independent magic numbers.

## Cleanup and failure behavior

Execution failures are adapted into structured shared diagnostics. Temporary working directories are removed recursively in `finally`. Unsupported/disabled execution is reported as such rather than falling back to unsafe execution.

The interactive editor and preview also use error boundaries so client rendering failures have a recovery path without changing the server execution trust boundary.

## Future browser adapter

DOC-8 defines a future `WebRuntimeAdapter` interface so later work can integrate a real browser runtime without replacing the shared editor/preview/diagnostics/session architecture.

The interface does **not** mean `@apexify/web` exists or ships today. DOC-8 contains no fake browser renderer, no shadow renderer, and no future runtime import.

## Verification

`scripts/docs/doc8-verify.ts`, `scripts/docs/doc8.test.ts`, and `scripts/docs/doc8-browser-verify.mjs` verify the static/runtime boundary. The production browser test confirms execution availability is false and that a POST is rejected with HTTP 503. Deterministic evidence is recorded in `generated/docs-doc8/security-boundary.json`.

Any future change that enables public arbitrary execution must introduce genuine isolation and a new security review; it cannot inherit the trusted-local DOC-8 mode and relabel it as a sandbox.
