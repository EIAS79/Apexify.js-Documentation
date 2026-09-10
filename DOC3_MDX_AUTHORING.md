# DOC-3 MDX component authoring

DOC-3 adds a registered technical-content layer to routed documentation. Authors can combine ordinary Markdown with approved component tags in `content/docs/**/*.mdx`; no custom page component is required.

## Security and parsing contract

Only names in `DOC3_REGISTERED_COMPONENTS` are interpreted as rich documentation components. Quoted attributes are strings. Brace attributes must contain valid JSON. Arbitrary JavaScript expressions, imports, function calls, spreads, `eval`, and `new Function` are not evaluated by the routed documentation renderer.

```mdx
<Callout tone="warning" title="Primary fill rule">
Use only one primary fill.
</Callout>

<FeatureMatrix rows={[{"feature":"opacity","status":"0 through 1","note":"Validated"}]} />
```

## Component families

The required DOC-3 library contains Callout, Steps, Tabs, Details, CodeBlockV2, CodeGroup, InstallCommand, CodeDiff, ComparisonTable, FeatureMatrix, AvailabilityMatrix, DecisionGuide, ArchitectureDiagram, BeforeAfter, OutputPreview, ExampleCard, ExampleSteps, Prerequisites, NextSteps, CapabilityBadge, and image/video/audio/SVG result components.

Compatibility names `Alert`, `Dropdown`, `CodeSwitcher`, and `CodeBlock` remain accepted. They delegate to or reuse the DOC-3 primitives rather than forming a second design system.

## Authoring rules

Use ordinary Markdown for prose, lists, headings, links, and simple tables. Use rich components when the content has a reusable semantic structure. Keep JSON data small enough to remain readable; large generated reference datasets belong to later API/reference phases rather than DOC-3. Interactive behavior must remain inside approved client islands such as Tabs and code controls.

The representative DOC-3 proof pages are `/docs/node/canvas` and `/docs/node/canvas/size-and-coordinates`.
