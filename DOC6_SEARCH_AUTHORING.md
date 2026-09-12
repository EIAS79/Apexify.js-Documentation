# DOC-6 Search, Discovery and Cross-Linking — Maintainer Guide

DOC-6 search is a **consumer of authoritative documentation data**, not another place to document APIs or examples.

## Source ownership

Search records are generated from the existing authoritative sources:

- DOC-1 documentation/navigation/redirect manifests plus the MDX source files referenced by the redirect manifest;
- DOC-4 generated API manifest for symbols, members, nested options, types, and real current errors;
- DOC-5 generated example manifest;
- the first-party Gallery documentation registry, with DOC-5 Gallery items canonicalized back to their verified example records.

Do not hand-edit `generated/docs-doc6/*.json`.

## Commands

```bash
npm run docs:search:build
npm run docs:search:verify
npm run docs:search:coverage
npm run docs:search:relevance
npm run docs:search:related
npm run docs:test:search
npm run docs:verify:doc6
```

CI additionally runs the clean build/performance measurement and browser/accessibility/keyboard gates.

## Adding searchable documentation

Add or change metadata in the source that owns it. For documentation pages, use DOC-1 frontmatter fields such as `title`, `description`, `keywords`, `apiSymbols`, `related`, `package`, `runtime`, and `stability`. DOC-6 indexes the referenced MDX body at build time; no request performs a filesystem scan.

Do not create a search-only copy of a guide just to improve ranking. Improve the authoritative page metadata or, for established user vocabulary, add a narrowly justified synonym to `lib/search/aliases.ts`.

## Adding APIs/options/types/errors

Do not add them to DOC-6 manually. Update the package/declaration/explicit DOC-4 metadata path so DOC-4 regenerates the API manifest. DOC-6 consumes those stable IDs and canonical deep links. Error-code lookup only exists for codes present in the current generated API manifest; never invent future diagnostics to satisfy search tests.

## Adding examples and Gallery entries

Verified examples are owned by DOC-5. When `gallery.enabled` is true, DOC-6 adds Gallery discovery terms to that example but keeps the example route canonical, preventing duplicate result identities.

Legacy Gallery cards remain searchable from `lib/gallery/docs/galleryRegistry.ts` until later controlled migration. They navigate to the existing Gallery deep-link contract.

## Ranking contract

Ranking is deterministic. Exact API symbols and error codes win over prose, followed by exact titles/options/types/aliases, title prefixes, option/type matches, headings, goals, keywords, body terms, token matches, and bounded fuzzy fallback. Stability penalties ensure current records beat roadmap/deprecated records when relevance is otherwise equivalent.

Fuzzy matching must never outrank an exact symbol or option. New ranking rules require a regression test.

## Filters and versioning

Runtime, package, content-type, and stability filter values are derived from actual indexed records. Do not expose future package families as if shipped. The record schema contains version metadata for future multi-version support, but DOC-6 does not create fake historical versions or fake selectors.

## Related content

Related content is deterministic and explainable. Explicit DOC-1 `related` metadata receives the highest weight. Inference may use shared package, runtime, domain, keywords, and API/example linkage. Self-links, duplicate targets, and CURRENT → ROADMAP/REMOVED recommendations are rejected.

## Privacy

Recent queries exist only in browser `localStorage`. DOC-6 adds no analytics service, remote search service, search telemetry, or AI dependency.
