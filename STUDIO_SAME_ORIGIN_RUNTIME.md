# Apexify Studio Same-Origin Runtime

> Status: COMPLETE IMPLEMENTATION — final validation deferred

Studio full-runtime execution is an internal same-origin backend concern. The browser never receives an executor URL, API token, or server credential.

## Request path

```text
Studio browser
      |
      | same-origin POST
      v
/api/gallery/run
      |
      | direct orchestration
      v
fresh restricted Deno subprocess
      |
      +--> raster / GIF / audio / scene work
      |
      +--> two fixed media proxy executables
               |
               v
          pinned FFmpeg / ffprobe
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
- no general network permission;
- no general subprocess permission;
- no prompt escalation.

The outer route does not evaluate Studio source.

## Video subprocess mediation

Apexify's Node video engine legitimately needs FFmpeg and ffprobe. Studio does not grant user code unrestricted process execution.

At build time Studio installs a pinned FFmpeg/ffprobe pair under `vendor/studio-ffmpeg/`.

For a video-capable run the trusted outer backend creates a short-lived capability file outside the Deno-readable workspace. Deno may execute only:

- `scripts/studio/ffmpeg-proxy`
- `scripts/studio/ffprobe-proxy`

Those proxies:

- resolve only the trusted per-run capability;
- forward only to the pinned FFmpeg/ffprobe pair;
- use `shell:false`;
- force cwd to the disposable run workspace;
- reject NULs, traversal, external absolute paths, protocol-policy overrides, filter-script files, and external/network protocols;
- validate concat-demuxer lists;
- inject a `file,pipe` protocol whitelist for inputs;
- launch the media binaries with a minimal environment;
- forward termination signals.

User code therefore gets video support without a general host process bridge.

## Network policy

Browser-direct Studio may fetch normal HTTP(S) images for APIs supported by @apexify/web.

The same-origin full runtime has no arbitrary outbound network permission. Full-runtime external image/audio/video/font input uses uploaded Studio Assets and `studio://asset/<id>`.

## Resource bounds

The runtime applies bounded source length, uploaded asset limits, one active full-runtime execution per server instance, a hard wall-clock timeout, a V8 heap limit, Linux `prlimit` CPU/address-space/file/process limits when available, bounded stdout/stderr, bounded artifact count and bytes, and unconditional workspace/capability cleanup.

## Package and media identity

Apexify.js is pinned to:

```text
github:EIAS79/Apexify.js#dbed9743353593eafae9a7b1c25312d7170a233b
```

The Deno runtime is installed as a gzip-compressed deployment payload under `vendor/studio-deno/`. The pinned FFmpeg/ffprobe pair is likewise stored compressed under `vendor/studio-ffmpeg/`. The serverless route hydrates only the executable binaries it needs into writable `/tmp` storage on first use and reuses them for the lifetime of the warm instance. Required runtime/proxy files are included in the server trace for `/api/gallery/run`, while native optional packages are traced only for the deployment architecture.

## Host persistence

Host persistence remains outside the Studio contract: `save()`, `saveMultiple()`, `createAudio.save()`, and caller-selected host paths. GIF/video APIs may use files inside the disposable workspace; Studio returns them as artifacts and deletes the workspace.
