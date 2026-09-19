# Apexify Studio isolated executor

This service implements `STUDIO-4` for the documentation Studio.

## Isolation model

Each request starts a fresh **Deno subprocess** with:

- an empty, per-run temporary workspace;
- no inherited application secrets;
- filesystem read access limited to the run workspace, executor dependencies, and system fonts/certificates;
- filesystem write access limited to the run workspace;
- environment access limited to non-secret Apexify/runtime path variables;
- subprocess permission limited to the pinned FFmpeg and ffprobe executables;
- FFI permission limited to the installed `@napi-rs` native addon directory;
- network permission limited to the explicit `STUDIO_EXECUTOR_ALLOWED_HOSTS` HTTPS allowlist;
- V8 heap bound plus mandatory Linux `prlimit` address-space/CPU/file/process bounds;
- a hard wall-clock timeout, bounded stdout/stderr, bounded input assets, and bounded output artifacts.

The outer Node service never evaluates Studio source. It validates/authenticates the request, materializes the disposable workspace, starts the restricted Deno process, collects the artifact manifest, and deletes the workspace.

## Environment

Required:

- `STUDIO_EXECUTOR_TOKEN` — bearer token shared only with the documentation server route.

Recommended:

- `STUDIO_EXECUTOR_ALLOWED_HOSTS=raw.githubusercontent.com:443,images.unsplash.com:443`
- `STUDIO_EXECUTOR_CONCURRENCY=1`
- `STUDIO_EXECUTOR_ADDRESS_SPACE_BYTES=2147483648`
- `STUDIO_EXECUTOR_PLUGIN_ALLOWLIST=` — comma-separated package names that are already installed in the executor and may be imported by Studio code
- `STUDIO_DENO_VERSION=2.4.5`

If no network hosts are configured, the isolated run has no network permission. Uploaded `studio://asset/<id>` media still works.

## Render

Build command:

```bash
cd studio-executor && npm install && npm run bootstrap
```

Start command:

```bash
cd studio-executor && npm start
```

The documentation deployment then needs:

- `STUDIO_EXECUTOR_URL=https://<executor-host>`
- `STUDIO_EXECUTOR_TOKEN=<same bearer token>`

No Studio source or asset is persisted after the request completes.
