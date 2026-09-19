# Apexify Studio Isolated Executor Protocol

> Status: ACTIVE CONTRACT — executor deployment not yet connected.

This document defines the server-to-server boundary used by Studio when a snippet requires the full Apexify.js runtime.

## Endpoint

`POST /v1/run`

The documentation application calls the executor through `STUDIO_EXECUTOR_URL`. If `STUDIO_EXECUTOR_TOKEN` is configured, the request includes:

```http
Authorization: Bearer <token>
```

The executor is not a public browser endpoint.

## Request

```json
{
  "protocolVersion": 1,
  "context": "studio",
  "lang": "ts",
  "code": "import { ApexPainter } from 'apexify.js'; ..."
}
```

Constraints:

- `protocolVersion` must be `1`;
- `context` must be `studio`;
- `lang` is `ts` or `js`;
- source size is bounded by the Studio resource contract.

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

## Recommended Vercel implementation

Vercel Sandbox is the preferred implementation for the current Vercel-hosted documentation site because it provides isolated Sandbox sessions rather than executing user code inside the Next.js function.

Recommended production flow:

```text
Next.js /api/gallery/run
        |
        v
isolated executor gateway
        |
        v
fresh Vercel Sandbox session
        |
        +-- Node 24
        +-- apexify.js pinned runtime
        +-- @napi-rs/canvas / fonts
        +-- FFmpeg + ffprobe
        +-- tsx
        |
        v
run wrapper -> artifact manifest
        |
        v
read bounded artifacts
        |
        v
stop sandbox
```

For latency and deterministic dependencies, build a reusable Sandbox snapshot containing the pinned Apexify runtime, FFmpeg/ffprobe, fonts, and runner dependencies. Each Studio request should start from that snapshot and still receive a fresh disposable session.

## Network policy

Apexify.js supports remote media URLs. The executor therefore needs outbound HTTPS, but it must not expose deployment-private networks or credentials.

Policy requirements:

- no injection of documentation-site secrets into executed code;
- block private/link-local/metadata targets;
- honor Apexify's own trusted-network policy;
- bound remote bytes, redirects, concurrency, and timeouts;
- if a stricter Sandbox domain allowlist is used, document which remote asset hosts are permitted.

## Package identity

The executor must report or log the Apexify.js package version/commit used for each run. The documentation package pin and executor snapshot must be advanced deliberately together; silent drift is not allowed.

## Host persistence

Studio does not expose Apexify host persistence APIs as a product capability. `save()`, `saveMultiple()`, and equivalent host-path persistence should be rejected by the Studio planner.

File-producing manipulation APIs such as video transcodes are different: they may write only inside the disposable execution workspace so Studio can collect the result as an artifact. Those files are deleted with the run environment after the response is built.
