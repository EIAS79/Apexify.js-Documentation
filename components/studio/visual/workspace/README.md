# Studio workspace helper modules

Standalone, feature-owned helpers extracted from the editor entry point:

- `geometry.ts`: viewport and selection geometry
- `path-handles.ts`: path points and transformed handles
- `canvas-background.ts`: artboard background projection
- `browser-video-frame.ts`: browser-local video frame extraction

Keep UI orchestration in `VisualStudioPre4.tsx`. Preserve contract names, execution order, and the browser-local media boundary.
