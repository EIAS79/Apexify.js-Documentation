# DOC-9 implementation review notes

This file records the implementation-review scope for the DOC-9 branch. It is evidence-only and does not replace the mandatory final report.

## Branch boundary

- Base: `a1e7a6ddca0b7c0e7193b4dceb56e7cd900862f3`
- Phase: DOC-9 only
- DOC-10, DOC-11, DOC-12, and Apexify.js Phase 15 are explicitly excluded.

## Required review before merge

- Full live MDX source inventory has one migration disposition per source.
- Existing DOC-1 authored canonical routes are preserved.
- Active legacy-only feature count is machine-verified as zero.
- Handwritten legacy API reference is not promoted as competing current truth; DOC-4 remains authoritative.
- Historical 5.4.5 hotfix content is archived into changelog context rather than indexed as current documentation.
- Routed/search content emits canonical links rather than `/docs#...` links.
- Legacy fragment compatibility still maps old inbound identities to canonical destinations.
- Navigation contains every active canonical page exactly once.
- Search is regenerated from the fully migrated routed corpus.
- DOC-1 through DOC-8 regression gates execute before merge.
- Production build and browser/search smoke pass.
- No dependency changes and no package runtime changes are introduced by DOC-9.
