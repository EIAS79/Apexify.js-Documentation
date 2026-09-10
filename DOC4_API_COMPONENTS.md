# DOC-4 API Component Contracts

DOC-4 adds API-specific components on top of the DOC-2 design system and DOC-3 technical-content primitives. Static structure remains server rendered; stateful controls are isolated client islands.

| Component | Purpose | Data source | Boundary | Accessibility / responsive contract |
|---|---|---|---|---|
| `ApiMethodHeader` | Symbol/member identity, package, runtime, stability, source | `ApiManifest` | Server | Semantic heading, text status labels, wrapping badges |
| `ApiSignature` | Authoritative TypeScript signature | packed declaration → manifest | Client control inside server section | Focusable code, copy button, permalink |
| `OverloadTabs` | Switch declaration overloads | manifest overload records | Client (`SignatureControls`) | `tablist`/`tab`, arrows, selected state |
| `OptionTable` | Exhaustive option paths, types/defaults/values/runtime | manifest option tree | Client island for scoped search | Semantic headers, labelled search, accessible overflow |
| `OptionCard` | Mobile representation of same option records | same `OptionTable` data | Client island | Mobile reading order; no duplicate truth |
| `TypeReference` | Render/link normalized types | manifest type graph | Server | Links known public types; readable unions |
| `TypeExplorer` | Explore deeply nested type structure | manifest type graph | Client island | Native `details`, keyboard disclosure, nested hierarchy |
| `EnumValueList` | Enumerate exact literal values | manifest type/option data | Server | Text/code values, never color-only |
| `ReturnValue` | Return type and async/nullability semantics | packed declaration | Server | Structured section |
| `ErrorReference` | Verified error class/condition/resolution/runtime | explicit metadata bound to API IDs | Server | Definition-style labelled fields |
| `LimitReference` | Verified resource/runtime limits | explicit metadata + current runtime source | Server | Named value/unit/context/source |
| `RelatedApiGrid` | Companion/replacement API links | validated manifest relationships | Server | Real canonical links |
| `SourceLink` | Commit-pinned package source | declaration map + package commit | Server | Descriptive external link text |

## Stability

These components are **CURRENT for DOC-4**. They are not independent package APIs.

## Testing

`npm run docs:test:api` covers extraction fixtures, nested option recursion, stable deep-link generation and negative coverage fixtures. `npm run docs:verify:doc4` validates generated production data and architecture. The DOC-4 browser gate covers keyboard, mobile/tablet, light/dark, reduced motion, axe, option search/deep links, overload switching, copy, search integration and 404 behavior.
