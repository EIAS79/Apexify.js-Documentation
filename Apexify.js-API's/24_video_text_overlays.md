# Timed rich video captions and transitions — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `VideoCreationOptions.addTextOverlay / VideoPipelineTextLayer.overlays`

Timed text overlay clips reuse the rich TextProperties style contract and add timeline and transition fields.

## Verified feature coverage

- Timed styled captions
- Enter and exit preset transitions
- Optional custom FFmpeg position/alpha/scale expressions
- Text styling parity with createText and typography engine
- Per-overlay alpha independent of glyph fill opacity

## Public types, nested properties and options

### `VideoTextTransitionPreset`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"none" \| "fade" \| "fadeIn" \| "fadeOut" \| "slideIn" \| "slideOut" \| "slideLeft" \| "slideRight" \| "slideUp" \| "slideDown" \| "zoomIn" \| "zoomOut" \| "bounce" \| "typewriter"` |

### `VideoTextTransition`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `VideoTextTransitionPreset` |
| `duration?` | `number (seconds; default 0.35)` |
| `custom?` | `{x?:string;y?:string;alpha?:string;scale?:string} (advanced FFmpeg expressions)` |

### `VideoTextOverlayClip`

| Property / member | Type, accepted values or signature |
|---|---|
| `inherits` | `all TextProperties options (see 04_createText)` |
| `startTime` | `number` |
| `endTime` | `number` |
| `transitionIn?` | `VideoTextTransition` |
| `transitionOut?` | `VideoTextTransition` |
| `overlayOpacity?` | `number (0..1; default 1)` |

### `VideoTextOverlayOperation`

| Property / member | Type, accepted values or signature |
|---|---|
| `overlays` | `VideoTextOverlayClip[]` |
| `outputPath` | `string` |

### `VideoTextOverlayStyle`

| Property / member | Type, accepted values or signature |
|---|---|
| `shape` | `Omit<VideoTextOverlayClip,"startTime"\|"endTime"\|"transitionIn"\|"transitionOut"\|"overlayOpacity">` |

## Execution behavior, defaults and constraints

Custom transition expressions are an advanced FFmpeg expression boundary, not general JavaScript. A multi-user app should validate or constrain user-supplied expression syntax and job resources.

## Source-of-truth files

- [`lib-next/types/video-text.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/video-text.ts)
- [`lib-next/video/render-video-text-layer.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/render-video-text-layer.ts)
- [`lib-next/video/video-text-overlay-apply.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-text-overlay-apply.ts)
- [`lib-next/video/video-text-overlay-filters.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/video/video-text-overlay-filters.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
