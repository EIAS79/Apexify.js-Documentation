# Pinned Studio FFmpeg runtime

`npm ci` installs a verified FFmpeg/FFprobe pair for Linux x64 or arm64. The exact release, architecture-specific GitHub URLs, archive sizes, and SHA-256 hashes live in `scripts/studio/ffmpeg-runtime.json`.

## Why this changed

The former FFmpeg 6.0.1 installer depended on a single `johnvansickle.com` archive. Production installation repeatedly failed before TLS negotiation finished, aborting `postinstall` and preventing the documentation site and workspace theme from deploying.

The installer now uses the fixed `v6.1` release of [ffbinaries-prebuilt](https://github.com/ffbinaries/ffbinaries-prebuilt/releases/tag/v6.1). The release publisher identifies its Linux binaries as repackaged John Van Sickle static builds. This is an explicit paired runtime upgrade from 6.0.1 to 6.1, not an unversioned mirror fallback. SHA-256 pins were calculated from all four release assets during the repair; the older release's GitHub metadata does not supply SHA-256 digests.

## Installation contract

- HTTPS downloads stream to disk and must match the exact pinned byte count and SHA-256 before extraction. Changed or oversized artifacts fail immediately. Partial files are removed.
- Transient network failures, HTTP 429, and HTTP 5xx get at most three attempts with bounded backoff. Each attempt has a 45-second total deadline across redirects and body transfer. HTTPS redirects are capped at five. TLS verification stays enabled.
- Only the named `ffmpeg` or `ffprobe` ZIP entry is extracted. ELF architecture is checked, and native binaries must execute and report the expected version.
- Both binaries are staged and compressed before replacing `vendor/studio-ffmpeg`. Failed preparation preserves the previous directory and fails the build. The completed directory contains `ffmpeg.gz`, `ffprobe.gz`, and `runtime.json`.
- Cached gzip files are reused only when their version, architecture, source pins, and content hashes match. Old unmarked pairs and corrupted caches are reinstalled.
- Serverless tracing continues to include `vendor/studio-ffmpeg`. Runtime hydration uses the manifest version in its `/tmp` cache key so an old 6.0.1 executable cannot mask the new pair.
- The existing local-CI system-binary fallback and unsupported-platform behavior are retained. Production Vercel installation requires the pinned bundled pair.

## Verification

```sh
npm run test:studio-runtime
node --import tsx --test scripts/studio/media-proxy-contract.test.ts
```

The first command runs downloader/install failure tests, installs the actual pinned pair if needed, hydrates both gzip files, and verifies H.264/AAC MP4, GIF, PCM WAV, and FFprobe metadata. It requires Linux x64/arm64 and network access on a cold installation. A dedicated GitHub workflow runs it on changes to these installer files.

The repair also checked both architecture archives, cache reuse, and corrupted-cache replacement. Native encode/probe smoke tests ran on x64; arm64 validation checked archive pins, ELF architecture, compression, and cache behavior, without claiming native arm64 execution.

When updating the runtime, review all four assets and refresh the manifest pins together, then run the native smoke checks and a complete Vercel preview build. The source release and upstream licensing obligations remain applicable; this script does not change the binaries' license.
