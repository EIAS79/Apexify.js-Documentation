# DOC-4 API Reference Authoring

The DOC-4 reference is generated from the **packed Apexify.js package surface** plus explicit, validated semantic metadata.

## Source of truth

Generated contract facts come from the installed packed `apexify.js` artifact produced by npm from the repository pin:

1. `package.json` export map;
2. shipped declaration entrypoints under `dist/declarations*`;
3. TypeScript compiler analysis of those declarations;
4. declaration maps for commit-pinned source locations.

Do not manually edit `generated/docs-doc4/*.json`. Run:

```bash
npm run docs:generate:doc4
npm run docs:verify:doc4
```

The UI, search records, route generation and coverage reports all consume the normalized manifest.

## Explicit semantic metadata

Semantics that TypeScript declarations cannot completely encode live in:

```text
lib/api-reference/metadata.ts
```

Metadata is keyed by stable API IDs:

```text
apexify.js::ApexPainter
apexify.js::ApexPainter#createImage
```

Option metadata is keyed by the member ID plus its exact extracted option path:

```text
apexify.js::ApexPainter#createImage::images.fit
apexify.js::ApexPainter#createImage::images.mask.mode
```

The extractor fails when explicit metadata points at a symbol/member/option that does not exist in the packed declaration. Generated declaration facts always win for export existence, signature, parameter type, option path and overload identity.

### Defaults

Only use `defaultState: "explicit"` when current implementation/source evidence establishes a concrete default. Use `runtime` for runtime-dependent defaults and `derived` for computed defaults. An optional option with no defined default stays `none`; never write `"undefined"` as a fake default.

### Errors and limits

Bind errors and limits to the exact stable member ID. Do not invent error codes or resource ceilings. Limit values in DOC-4 must be backed by current runtime configuration/source.

### Runtime

Current package runtime is Node 22/24/26. Do not mark Web, React or Next as current until those surfaces are actually exported.

### Examples and related APIs

DOC-4 links existing guides/examples; it does not execute them. DOC-5 owns the executable example platform. Related API IDs must resolve to current manifest symbols/members or verification fails.

## Fixing coverage failures

- `missing-export`: regenerate and ensure the stable public export is routed/indexed.
- `stale-export`: remove or explicitly reclassify historical metadata.
- `missing-option`: fix recursive extraction/metadata coverage; never hide the child under `{ ... }`.
- `stale-option`: update metadata to the actual packed option path.
- `signature-mismatch`: regenerate from the packed declaration; do not hand-edit signatures.
- `unknown-related`: bind to a current stable API ID.

The high-level integrity command is `npm run docs:verify:doc4`.
