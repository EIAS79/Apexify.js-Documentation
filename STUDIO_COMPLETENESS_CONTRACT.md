# Apexify Studio Completeness Contract

> STUDIO-10 implementation contract

Studio completeness is declaration-driven. It is not determined by a manually maintained marketing list.

## Source of truth

The completeness generator reads the installed pinned `apexify.js` declaration and inventories the public Studio-relevant surface.

It covers:

- public `ApexPainter` manipulation methods;
- top-level facades;
- nested facade methods;
- component factories;
- returned public handles such as `SceneBuilder`, `TemplateHandle` and `VideoPipeline`;
- reachable video operation services exposed through `painter.video`.

The generated evidence is:

```text
generated/studio/capability-matrix.json
```

Schema version 2 records routing, proof coverage, option-family evidence, exclusions and final-validation state.

## Route classifications

A capability is classified as one of:

- `browser` — handled directly by the pinned first-party `@apexify/web` runtime;
- `full-runtime` — handled by the same-origin isolated Apexify.js runtime;
- `host-persistence` — explicitly outside Studio because it writes to caller-selected host paths;
- `external-service` — explicitly outside Studio because it requires credentialed third-party transfer/network access;
- `introspection` — a readable handle/property rather than a manipulation operation.

A new public manipulation method with no route makes the generated matrix incomplete.

## Explicit contract exclusions

These APIs are not silently ignored:

- `ApexPainter.save()`;
- `ApexPainter.saveMultiple()`;
- `ApexPainter.createAudio.save()`;
- `ApexPainter.output.url()`.

The first three are host-filesystem persistence. `output.url()` is an Imgur upload helper that requires third-party credentials and network egress. Studio keeps credentials out of the browser/runtime product contract and returns local artifacts for download instead.

## Capability proof model

`scripts/studio/studio-proof-registry.ts` defines proof cases.

Every executable manipulation capability must map to at least one proof case. Proof cases record:

- runtime route;
- relevant Studio template ids where appropriate;
- representative option families;
- expected artifact kinds;
- static implementation evidence;
- final execution-validation state.

A capability without a proof mapping makes STUDIO-10 incomplete.

The registry intentionally groups equivalent capabilities. For example, all `SceneBuilder` mutation methods share the scene-builder proof case, while the complete procedural-audio surface shares the audio proof case.

## Representative option families

The gate separately records representative coverage for:

- canvas backgrounds/effects;
- image source classes;
- text styles/fonts;
- all stable chart families plus comparison/combo;
- scene layers, nested surfaces, builders and components;
- template placeholders/assets/overrides/insertions;
- image utility families;
- Path2D/pixel/hit-detection families;
- procedural audio families;
- video creation, pipelines, extraction and deep operation services;
- structured/non-raster result forms.

Option-family proof records must reference valid proof cases and contain non-empty coverage.

## Artifact proof

Every artifact kind required by proof cases is cross-checked against:

1. the unified interactive artifact contract; and
2. the Studio artifact preview implementation.

The current required set is:

```text
image
gif
audio
video
json
text
binary
```

Missing protocol or preview support makes completeness fail.

## Nested public surfaces

STUDIO-10 inventories public handles beneath the top-level painter so they cannot silently escape coverage:

```text
SceneBuilder
TemplateHandle
VideoPipeline
VideoCreator
VideoOperations
VideoOperations.transcode
VideoOperations.merge
VideoOperations.overlays
VideoOperations.audio
VideoOperations.frames
VideoOperations.structure
VideoOperations.advanced
```

If the pinned Apexify.js package exposes an additional Studio-relevant nested public service, it must be added to the nested inventory and proof registry.

## Commands

Regenerate evidence:

```bash
npm run studio:completeness
```

Check that the committed evidence exactly matches the pinned package/runtime surface:

```bash
npm run studio:completeness:check
```

Dedicated Studio gate:

```bash
npm run studio:verify
```

## Implementation completeness vs final validation

STUDIO-10 separates two states.

**Implementation completeness** means:

- no public manipulation route is missing;
- no required proof mapping is missing;
- proof-template references are valid;
- representative option-family evidence is structurally complete;
- all required artifact kinds exist in the contract and preview;
- exclusions are explicit.

**Final runtime validation** means representative browser, isolated Node, GIF/audio/video, media-proxy and deployed-runtime executions have actually been run in the final validation pass.

The project policy defers those expensive end-to-end gates until the end. Therefore a matrix may correctly report:

```json
{
  "implementationComplete": true,
  "finalRuntimeValidation": {
    "status": "deferred"
  }
}
```

That is not a claim that deployment validation already ran. It means STUDIO-10 implementation is complete and the final verification pass remains pending.
