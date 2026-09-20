# DOC-8 Execution and Security Boundary

This document records the current execution boundary for Apexify Studio. The product now has two execution paths: browser-direct `@apexify/web` for supported lightweight operations, and a same-origin isolated server runtime for the full Apexify.js feature set.

## Public production behavior

User-authored Studio source **can execute in production**, but only inside the same-origin isolated runtime.

Production mode:

- runtime: pinned Deno permission-isolated child process;
- Apexify package: pinned installed `apexify.js` runtime;
- native canvas: explicitly scoped FFI access;
- system information: only the CPU capability required by the native canvas loader;
- network access: disabled;
- subprocess access: disabled except the fixed FFmpeg/ffprobe media proxies;
- filesystem writes: limited to the per-run temporary workspace;
- package installation: disabled;
- arbitrary host-file imports: disabled;
- remote script execution: disabled.

This is deliberately described as an **isolated runtime**, not as unrestricted host execution.

## Trusted-local development mode

Trusted local development remains available only when both conditions are true:

`NODE_ENV !== 'production'`

and:

`ENABLE_LOCAL_APEXIFY_CODE_RUN=true`

Trusted-local mode is not the public isolation boundary and may have the ambient capabilities of the developer machine.

## Trust model

- Repository-controlled verified examples remain authoritative documentation evidence.
- User-edited Studio source is untrusted input and is executed only through the production permission boundary.
- Studio project files are materialized into the disposable run workspace and relative imports may only resolve to those bounded files.
- Uploaded Studio assets are materialized into the same disposable workspace under explicit count/size limits.
- Share-state data remains user-controlled and must not contain secrets.

## Environment

The production child receives a constructed allowlisted environment. Application secrets and unrelated deployment variables are not inherited.

The runtime receives only the keys required for execution, controlled artifact paths, the Deno cache path, and—when media is used—the fixed FFmpeg/ffprobe proxy paths and capability id.

## Filesystem

Each isolated run receives a fresh temporary directory.

Allowed writes are restricted to that run directory. Generated artifacts are copied into the controlled artifact directory and returned through the Studio artifact manifest. Cleanup runs recursively in `finally`.

The runtime does not expose a persistent user filesystem and does not dynamically install packages.

## Network

Production isolated execution has no Deno `--allow-net` permission. Arbitrary outbound networking from submitted Studio code is therefore denied by the runtime.

Trusted-local mode remains separate and may have ambient developer-host networking.

## Child processes and media

Production code does not receive unrestricted `--allow-run`.

Video operations are routed only through fixed same-origin FFmpeg/ffprobe proxy executables. The proxy validates the media capability, keeps paths inside the run workspace, and restricts FFmpeg protocol access.

## Native canvas and system permissions

The native canvas binding receives FFI access scoped to the installed `@napi-rs` canvas runtime.

The Deno system capability is restricted to `cpus`, which is required by the native loader's platform detection. The Studio runtime does not receive unrestricted system access.

## Multi-file projects and multi-output previews

Studio supports bounded sibling project files. The active tab is the entry source; other open tabs are materialized as sibling files and can be imported with relative imports such as `./helpers.ts`.

A single run may return multiple previewable artifacts. The server manifest and client preview strip support image, GIF, audio, video, JSON, text, frame collections, and binary artifacts.

## Central resource limits

All execution/share ceilings are defined in `DOC8_RESOURCE_LIMITS` in `lib/docs/playground/contracts.ts`:

| Limit | Value | Purpose |
| --- | ---: | --- |
| Execution time | 55,000 ms | Bound one isolated run |
| Source characters | 280,000 | Bound submitted entry source |
| Per-artifact output | 32 MiB | Bound one returned artifact |
| Total output | 64 MiB | Bound all artifacts from one run |
| Process buffer | 20 MiB | Bound captured process output |
| Share state | 64 KiB | Bound URL/share payloads |
| Maximum outputs | 24 | Bound multi-preview multiplicity |

Workspace files and uploaded assets have their own additional limits.

## Cleanup and failure behavior

Execution failures are converted into structured Studio diagnostics. Temporary workspaces and media capability files are removed in `finally` on success, error, and timeout paths.

The UI does not silently fall back from a full-runtime request to a weaker renderer. If the isolated runtime is unavailable, Studio reports that state explicitly.

## Browser-direct runtime

Studio also uses the pinned `@apexify/web` runtime for browser-direct operations that do not require the full Node/native Apexify stack.

The execution planner chooses browser-direct or full-runtime execution automatically from the source capabilities. Scene, template, assets, components, GIF, audio, video, batch, plugins, image utilities, pixel/path/detection utilities, and other full-runtime families route to the isolated server runtime.

## Verification

`scripts/docs/doc8-verify.ts`, `scripts/docs/doc8.test.ts`, and `scripts/docs/doc8-browser-verify.mjs` verify this boundary.

The production browser gate now requires:

- `/api/gallery/run` to report `same-origin-isolated` availability;
- bounded multi-file project execution;
- multiple returned artifacts;
- Scene + components + named assets execution;
- GIF generation;
- MP4 generation through the fixed media runtime;
- arbitrary network access from submitted code to be denied.

Deterministic evidence is recorded in `generated/docs-doc8/security-boundary.json`.
