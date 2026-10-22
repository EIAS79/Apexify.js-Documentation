# Runtime configuration, errors, limits and media transport — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `configureApexifyRuntime / resetApexifyRuntimeConfig / getDefaultApexifyRuntimeConfig`

Process-wide policy controls for safe remote media acquisition, rendering budgets, cache, FFmpeg execution and diagnostics.

## Verified feature coverage

- Centralized global configuration policy
- Canvas/image/scene/GIF/audio/video resource budgets
- SSRF restrictions and DNS/IP validation
- Pinned network lookup, redirect revalidation, streamed byte ceilings
- Bounded active remote requests and TTL/LRU image cache
- FFmpeg process timeout/cancellation and output limits
- Structured error hierarchy and diagnostics callbacks

## Public types, nested properties and options

### `RenderLimits (all default numbers)`

| Property / member | Type, accepted values or signature |
|---|---|
| `maxCanvasDimension` | `number (default 16,384)` |
| `maxTotalPixels` | `number (default 67,108,864)` |
| `maxCollectionItems` | `number (default 2,048)` |
| `maxBackgroundLayers` | `number (default 128)` |
| `maxFiltersPerOperation` | `number (default 64)` |
| `maxSceneLayers` | `number (default 2,000)` |
| `maxSceneTotalPixels` | `number (default 268,435,456)` |
| `maxNestedSurfaces` | `number (default 64)` |
| `maxSceneDepth` | `number (default 32)` |
| `maxSceneImages` | `number (default 2,000)` |
| `maxSceneTextLayers` | `number (default 1,000)` |
| `maxSceneCharts` | `number (default 256)` |
| `maxTextLength` | `number (default 1,000,000)` |
| `maxRemoteAssets` | `number (default 128)` |
| `maxRemoteImageBytes` | `number (default 33,554,432)` |
| `maxRemoteVideoBytes` | `number (default 536,870,912)` |
| `maxImageSourceBytes` | `number (default 67,108,864)` |
| `maxDecodedImagePixels` | `number (default 67,108,864)` |
| `maxDecodedImageFrames` | `number (default 128)` |
| `maxSvgElements` | `number (default 10,000)` |
| `maxGifFrames` | `number (default 1,000)` |
| `maxGifDimension` | `number (default 4,096)` |
| `maxGifResourceCost` | `number (default 268,435,456)` |
| `maxAudioDurationSeconds` | `number (default 600)` |
| `maxAudioSampleRate` | `number (default 192,000)` |
| `maxAudioChannels` | `number (default 2)` |
| `maxAudioEvents` | `number (default 20,000)` |
| `maxAudioLayers` | `number (default 1,024)` |
| `maxAudioPartials` | `number (default 4,096)` |
| `maxAudioBytes` | `number (default 268,435,456)` |
| `maxVideoDurationSeconds` | `number (default 14,400)` |
| `maxVideoFps` | `number (default 240)` |
| `maxVideoBitrateKbps` | `number (default 200,000)` |
| `maxVideoOverlays` | `number (default 256)` |
| `maxVideoMergeInputs` | `number (default 32)` |
| `maxVideoExtractedFrames` | `number (default 2,000)` |
| `maxVideoAudioTracks` | `number (default 64)` |
| `maxVideoPipelineLayers` | `number (default 256)` |
| `maxBatchOperations` | `number (default 256)` |
| `maxBatchConcurrency` | `number (default 4)` |
| `maxConcurrentRemoteFetches` | `number (default 8)` |

### `NetworkRuntimeConfig defaults`

| Property / member | Type, accepted values or signature |
|---|---|
| `allowedProtocols` | `readonly ("http:" \| "https:")[] (default both)` |
| `timeoutMs` | `number (default 15000)` |
| `maxRedirects` | `number (default 5)` |
| `retryAttempts` | `number (default 3)` |
| `retryBaseDelayMs` | `number (default 200)` |
| `retryMaxDelayMs` | `number (default 3000)` |
| `retryJitterRatio` | `number (default 0.2)` |
| `honorRetryAfter` | `boolean (default true)` |
| `trustedNetworkAccess` | `boolean (default false)` |
| `allowedHosts` | `readonly string[] (default empty)` |
| `userAgent` | `string (default "Apexify.js/6")` |

### `CacheRuntimeConfig defaults`

| Property / member | Type, accepted values or signature |
|---|---|
| `enabled` | `boolean (true)` |
| `ttlMs` | `number (300000)` |
| `maxEntries` | `number (128)` |
| `maxBytes` | `number (134217728)` |

### `FfmpegRuntimeConfig defaults`

| Property / member | Type, accepted values or signature |
|---|---|
| `ffmpegPath?` | `string` |
| `ffprobePath?` | `string` |
| `processTimeoutMs` | `number (300000)` |
| `probeTimeoutMs` | `number (5000)` |
| `maxStdoutBytes` | `number (10485760)` |
| `maxStderrBytes` | `number (31457280)` |

### `TempRuntimeConfig defaults`

| Property / member | Type, accepted values or signature |
|---|---|
| `rootDirectory?` | `string` |
| `retainFiles` | `boolean (false)` |

### `DiagnosticsEvent`

| Property / member | Type, accepted values or signature |
|---|---|
| `level` | `"debug" \| "info" \| "warn" \| "error"` |
| `code` | `string` |
| `message` | `string` |
| `details?` | `Readonly<Record<string,unknown>>` |

### `DiagnosticsRuntimeConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `handler?` | `(event:DiagnosticsEvent)=>void` |

### `ApexifyRuntimeConfig`

| Property / member | Type, accepted values or signature |
|---|---|
| `network` | `NetworkRuntimeConfig` |
| `limits` | `RenderLimits` |
| `cache` | `CacheRuntimeConfig` |
| `ffmpeg` | `FfmpegRuntimeConfig` |
| `temp` | `TempRuntimeConfig` |
| `diagnostics` | `DiagnosticsRuntimeConfig` |

### `ApexifyRuntimeConfigInput`

| Property / member | Type, accepted values or signature |
|---|---|
| `network?` | `Partial<NetworkRuntimeConfig>` |
| `limits?` | `Partial<RenderLimits>` |
| `cache?` | `Partial<CacheRuntimeConfig>` |
| `ffmpeg?` | `Partial<FfmpegRuntimeConfig>` |
| `temp?` | `Partial<TempRuntimeConfig>` |
| `diagnostics?` | `DiagnosticsRuntimeConfig` |

### `Exported error types`

| Property / member | Type, accepted values or signature |
|---|---|
| `ApexifyError` | `base (code,details,cause)` |
| `ApexifyInputError` | `invalid input` |
| `ApexifyConfigError` | `invalid runtime config` |
| `ApexifyResourceLimitError` | `limit exceeded` |
| `ApexifyRemoteFetchError` | `network/remote response` |
| `ApexifyDecodeError` | `media decoding/rendering` |
| `ApexifyProcessError` | `process failure` |
| `ApexifyExternalServiceError` | `third-party services` |
| `ApexifyAssetError` | `missing/conflicting assets` |
| `ApexifyPluginError` | `plugin lifecycle` |

### `Public runtime helpers`

| Property / member | Type, accepted values or signature |
|---|---|
| `configureApexifyRuntime(partialConfig)` | `Readonly<ApexifyRuntimeConfig>` |
| `resetApexifyRuntimeConfig()` | `Readonly<ApexifyRuntimeConfig>` |
| `getDefaultApexifyRuntimeConfig()` | `Readonly<ApexifyRuntimeConfig>` |
| `resolveApexifyRuntimeConfig(input?)` | `Readonly<ApexifyRuntimeConfig>` |
| `DEFAULT_APEXIFY_RUNTIME_CONFIG` | `Readonly<ApexifyRuntimeConfig>` |

## Execution behavior, defaults and constraints

**Verified hardening debt:** on main, cross-origin redirects can preserve caller headers; remote queue waiters have no hard size bound; chain method traversal accepts arbitrary dot-separated properties; Web interpreter budgets and object-key safety are incomplete. Node runtime policy rejects private/localhost IPs by default unless trusted access and allowlisted hosts are configured. This is not a fully tenant-isolated service sandbox.

## Example (API-oriented)

```ts
import { configureApexifyRuntime } from 'apexify.js';
configureApexifyRuntime({limits:{maxCanvasDimension:4096,maxTotalPixels:12_000_000},network:{timeoutMs:10_000}});
```

## Source-of-truth files

- [`lib-next/runtime/config.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/runtime/config.ts)
- [`lib-next/runtime/limits.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/runtime/limits.ts)
- [`lib-next/runtime/errors.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/runtime/errors.ts)
- [`lib-next/media/source.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/media/source.ts)
- [`lib-next/media/network-policy.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/media/network-policy.ts)
- [`lib-next/media/remote-fetch.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/media/remote-fetch.ts)
- [`lib-next/media/cache.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/media/cache.ts)
- [`docs/remaining-work.md`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/docs/remaining-work.md)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
