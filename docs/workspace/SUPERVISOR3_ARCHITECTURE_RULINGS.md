# Supervisor Directive #3 — Approved ADR contract addendum
Status: ADR-01, ADR-03, ADR-04, ADR-05 approved. ADR-02 approved with corrections. Portable domain modules are initial, not release-ready.

- Canonical schemaVersion 2 semantic project owns stable IDs, revision, scenes/layers/assets/styles/frames/tracks/clips/keyframes/vector paths and bounded exports. View state and jobs remain separate. Active WorkspaceApp still uses v1.
- BigInt authoritative: signed decimal-string ticks and rational timebases, bounded to 256 bits. 1/70560000 is optional, not a global clock; original signed PTS/timebase is retained separately. FPS, frame indices, PTS, sample indices/rates remain distinct.
- Half-open [start,end) ranges; strictly interior split; sample-accurate source offsets across split/trim; no implicit audio snapping.
- Explicit exact/floor/ceil/trunc/nearest-even conversion; GIF cumulative nearest-even centisecond rounding. Positive source duration mandatory; minimum encoded delay 1cs by default and zero rounded delays fail unless minDelay=0 explicitly permitted.
- Existing v1 validation underlies migration; invalid/future JSON preserves old project and raw recoverable input. Lossless toV1 is blocked if v2-only media records exist.
- Browser realtime preview and isolated Node outputs separate; arbitrary user scripts cannot run in Next host; Git push/PR/Vercel deployment disallowed.
- Unsupported: complete graph, media audio/video execution, native exports, retained-browser parity, durable crash recovery. Do not mark capabilities FULL.
- Required future verification: golden visual/Code/Graph/export parity; migration from real saved docs; media resource budgets; source frame/clip/audio VFR; browser bundler and isolation validation.
