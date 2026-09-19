# Apexify Studio Isolated Executor Protocol

> Status: ACTIVE CONTRACT — isolated executor implementation added; production activation requires the documentation deployment to provide the executor URL/token.

This document defines the server-to-server boundary used by Studio when a snippet requires the full Apexify.js runtime.

## Endpoint

`POST /v1/run`

The documentation application calls the executor through `STUDIO_EXECUTOR_URL`. `STUDIO_EXECUTOR_TOKEN` is mandatory; the request includes:

```http
Authorization: Bearer <token>
```

The executor is not a public browser endpoint. The documentation route fails closed and reports the full runtime unavailable unless **both** the executor URL and bearer token are configured.

## Request

```json
{
  "protocolVersion": 1,
  "context": "studio",
  "lang": "ts",
  "code": "import { ApexPainter } from 'apexify.js'; ...",
  "assets": [
    {
      "id": "c9f7...",
      "name": "photo.png",
      "mime": "image/png",
      "size": 124833,
      "base64": "..."
    }
  ]
}
```

Constraints:

- `protocolVersion` must be `1`;
- `context` must be `studio`;
- `lang` is `ts` or `js`;
- source size is bounded by the Studio resource contract;
- `assets` is optional and contains the bounded per-session virtual files referenced from code as `studio://asset/<id>`;
- the executor must materialize asset bytes only inside the disposable run workspace and resolve those references before execution;
- asset count, per-asset bytes, and aggregate asset bytes must be enforced again by the executor rather than trusting the gateway.

## Success response

```json
{
  "ok": true,
  "runtime": "isolated-remote",
  "elapsedMs": 248,
  "primaryArtifactId": "artifact-1",
  "outputs": [
    {
      "id": "artifact-1",
      "name": "result.png",
      "kind": "image",
      "mime": "image/png",
      "base64": "..."
    }
  ]
}
```

Artifact kinds are:

- `image`
- `gif`
- `audio`
- `video`
- `json`
- `text`
- `binary`

Text/JSON artifacts may use `text` instead of `base64`.

## Failure response

```json
{
  "ok": false,
  "error": "human-readable execution error",
  "stderr": "optional bounded stderr",
  "elapsedMs": 93,
  "exitCode": 1
}
```

## Required isolation

The executor must not run arbitrary Studio code in the documentation application's process, a normal serverless child process, or a shared long-lived worker without per-run isolation.

Every execution requires:

1. disposable isolated environment;
2. bounded wall time;
3. bounded CPU and memory;
4. bounded stdout/stderr;
5. bounded artifact count, per-artifact bytes, and aggregate output bytes;
6. a disposable workspace;
7. no inherited application secrets;
8. explicit outbound network policy;
9. cleanup/termination even after failure or timeout;
10. pinned Apexify.js runtime identity.

## Implemented production executor

The repository contains a dedicated `studio-executor/` service. It does **not** evaluate Studio source in the documentation process.

Production flow:

```text
documentation /api/gallery/run
        |
        | Bearer-authenticated server request
        v
studio-executor
        |
        +-- validate request / assets / limits
        +-- create one disposable run workspace
        +-- start one fresh restricted Deno process
        |
        v
real pinned apexify.js runtime
        |
        +-- @napi-rs/canvas
        +-- registered bundled/uploaded fonts
        +-- pinned FFmpeg + ffprobe binaries
        +-- explicit filesystem/env/run/FFI/network permissions
        |
        v
artifact manifest -> bounded response
        |
        v
delete run workspace
```

The outer executor is a small Node service. The user program runs in a **fresh Deno subprocess** with an explicit permission set. Deno provides the per-run filesystem/environment/subprocess/network boundary while Apexify itself remains the real package implementation.

The executor additionally applies:

- a wall-clock timeout;
- V8 heap bound;
- Linux `prlimit` address-space / CPU / file-descriptor / process bounds when available;
- one disposable workspace per run;
- no inherited application environment;
- bounded stdout/stderr;
- bounded source, asset bytes, artifact count, per-artifact bytes, and aggregate output bytes;
- pinned Apexify runtime identity in responses;
- mandatory bearer authentication.

The Render blueprint is `render.yaml`. The executor can also be hosted by another Node-capable service as long as the same process-level restrictions remain available.

## Network policy

Remote media is **deny-by-default** at the execution boundary.

The isolated process only receives `--allow-net` entries from `STUDIO_EXECUTOR_ALLOWED_HOSTS`. Configure explicit HTTPS host/port pairs, for example:

```text
raw.githubusercontent.com:443,images.unsplash.com:443
```

This is intentionally stricter than giving arbitrary Studio code unrestricted egress.

Apexify's own remote-media network policy still runs inside that boundary and continues to reject private/link-local/metadata targets and enforce its byte/redirect/concurrency/timeout limits.

For media on a host that is not in the executor allowlist, upload the file through Studio and use its `studio://asset/<id>` reference.

## Package identity

The executor must report or log the Apexify.js package version/commit used for each run. The documentation package pin and executor snapshot must be advanced deliberately together; silent drift is not allowed.

## Host persistence

Studio does not expose Apexify host persistence APIs as a product capability. `save()`, `saveMultiple()`, and equivalent host-path persistence should be rejected by the Studio planner.

File-producing manipulation APIs such as video transcodes are different: they may write only inside the disposable execution workspace so Studio can collect the result as an artifact. Those files are deleted with the run environment after the response is built.
