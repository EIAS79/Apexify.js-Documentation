# Apexify Studio Same-Origin Runtime

> Status: ACTIVE IMPLEMENTATION

Studio full-runtime execution is an internal same-origin backend concern. The browser never receives an executor URL, API token, or server credential.

## Request path

```text
Studio browser
      |
      | same-origin POST
      v
/api/gallery/run
      |
      | direct in-process orchestration only
      v
fresh restricted Deno subprocess
      |
      v
real pinned apexify.js
      |
      v
bounded artifact manifest
      |
      v
Studio output panel
```

There is no external executor API in the product architecture.

## Isolation boundary

The Next.js route validates the request and creates one disposable workspace. User code is then executed in a fresh Deno subprocess with an explicit permission set.

The isolated process receives:

- read access only to the disposable run workspace, installed dependencies, and system font directories;
- write access only to the disposable run workspace;
- environment access only to non-secret Studio runtime paths;
- FFI access only to the installed `@napi-rs` native addon directory;
- no network permission;
- no subprocess permission;
- no prompt escalation.

The outer route does not evaluate Studio source.

## Why network is disabled in the full runtime

Browser-direct Studio already handles normal HTTP(S) image sources for the APIs it can execute.

The same-origin full runtime deliberately has no arbitrary outbound network permission because user code must not be able to access deployment-private services or metadata endpoints.

For full-runtime operations that need an external image/audio/video/font:

1. upload it through Studio Assets;
2. use its stable `studio://asset/<id>` reference.

This keeps media available without giving arbitrary executed code network access.

## Resource bounds

The runtime applies:

- bounded source length;
- bounded uploaded asset count, per-file bytes, and aggregate bytes;
- one active full-runtime execution per server instance;
- hard wall-clock timeout;
- V8 heap limit;
- Linux `prlimit` CPU/address-space/file/process limits when the host exposes `/usr/bin/prlimit`;
- bounded stdout/stderr;
- bounded artifact count, per-artifact bytes, and aggregate output bytes;
- unconditional workspace cleanup.

Apexify's own renderer/resource limits remain active inside the sandbox.

## Package identity

The full runtime is pinned to:

```text
github:EIAS79/Apexify.js#dbed9743353593eafae9a7b1c25312d7170a233b
```

The Deno isolation binary is installed at build time under:

```text
vendor/studio-deno/
```

and is included in the server trace for `/api/gallery/run`.

## Studio assets

Uploaded assets are:

- stored client-side in IndexedDB;
- sent only with an execution that needs the full runtime;
- materialized only inside that execution's temporary workspace;
- rewritten from `studio://asset/<id>` to the temporary local path;
- deleted with the workspace after the run.

Uploaded font files are registered before user code executes.

## Host persistence

Host persistence remains outside the Studio product contract:

- `save()`
- `saveMultiple()`
- equivalent caller-selected host paths

Studio returns artifacts to the browser instead.

## Video

The same-origin Deno sandbox intentionally has no child-process permission. That means production FFmpeg execution is **not** smuggled through STUDIO-4.

Video execution belongs to STUDIO-8's media implementation, where the browser/WebCodecs/WASM path can be completed without opening a general-purpose server subprocess capability to user code.
