# WS-00: legacy Code and Visual data preservation

> Status: SOURCE AUDIT ONLY; no browser migration has been verified.
> Existing Studio data and code remain untouched.

## Storage inventory

| Surface | Storage identity | Source evidence | Migration policy |
|---|---|---|---|
| Code buffers / prefs | localStorage apexify-studio-v2 | studioConfig.ts and studioStorage.ts, PersistedStudio buffers (id,name,ts,js), activeBufferId, lang, layout, autoRun, splitRatio | Copy entire raw record first, retain both code languages and file names |
| Earlier Code | localStorage apexify-studio-v1 | studioStorage.ts only imports legacy format when v2 buffers are unavailable | Preserve v1 as recovery, never delete automatically |
| Run history | localStorage apexify-studio-history-v1 | studioStorage.ts stores up to 8 entries including optional data URL thumbnails | Preserve original chronology and exact run provenance |
| Docs/Gallery handoff | localStorage apexify-studio-incoming | consumeIncomingSnippet() removes key when reading it | Never call destructive reader during migration discovery |
| Last mode | localStorage apexify-studio-mode-v1 | StudioShell.tsx persists code/visual mode only for nonlegacy route | User preference only, not document content |
| Visual project files | .apexstudio.json format apexify-studio-visual schema version 1 | visual/model.ts and visual/persistence.ts normalize and validate | Preserve raw source bytes before parsing, backup unknown nodes/fields |
| Visual autosave | localStorage apexify-visual-autosave-v2 | visual/hardening.ts Phase17 envelope v2 | Treat as separate recovery candidate, not guaranteed latest export |
| Session assets | IndexedDB apexify-studio-assets-v1 store assets key session-assets | runtime/assets.ts, shared session | Keep IDs, original bytes, metadata and studio://asset/ references |
| Admission limits | 12 count, 8 MiB per file, 24 MiB total | STUDIO_ASSET_LIMITS | Do not raise limits without quota/performance tests |

## Required migration transaction

1. Discover read-only: snapshot every known storage key and IndexDB record before using any reader that consumes data.
2. Export immutable backups and report source identity, hash and schema. Missing data remains missing; do not invent projects.
3. Validate Code v1/v2 buffers, Visual v1 objects, autosave v2 envelope and asset references individually; report unsupported imports.
4. Dry-run and preview WorkspaceProject conversion; never convert arbitrary JS into a graph destructively.
5. Write to an independent new namespace, verify checksums and exact source bytes; only then offer to switch the active project.
6. Keep all legacy storage and the original legacy UI routes for rollback. No silent deletion, reset or last-writer-wins conflict.

## Failure cases to test in WS-02

- Empty/malformed persisted JSON, interrupted autosave, orphaned assets, stale render metadata, tabs saving concurrently.
- Quota limit, blocked IndexedDB/localStorage, nonrepresentable JS, unsafe file paths and missing imported dependency.
- Visual and Code snapshots with identical names but different IDs; idempotent re-import and rollback.
- Responsive project recovery on phone/tablet and offline condition.

## Remaining WS-00 gate

Exact envelope shape and browser behavior have not been executed here. Unit and browser fixtures, type/schema mapping and migration proof remain required before production cutover.
