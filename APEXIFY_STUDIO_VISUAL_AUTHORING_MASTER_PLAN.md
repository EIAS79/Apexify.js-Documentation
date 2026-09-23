# Apexify Studio — Visual Authoring / Preview → Code Master Plan

> **Program ID:** `STUDIO-VISUAL`
>
> **Status:** ACTIVE MASTER PLAN — STUDIO-VISUAL-0 PRODUCTION VERIFIED; STUDIO-VISUAL-1 PRODUCTION VERIFIED; STUDIO-VISUAL-2 MAIN MERGED; STUDIO-VISUAL-3 PRODUCTION VERIFIED; STUDIO-VISUAL-PRE-4 MAIN MERGED; STUDIO-VISUAL-4 MAIN MERGED; STUDIO-VISUAL-5 MAIN MERGED; STUDIO-VISUAL-6 MAIN MERGED; STUDIO-VISUAL-7 MAIN MERGED; STUDIO-VISUAL-8 MAIN MERGED; STUDIO-VISUAL-9 COMPLETE; STUDIO-VISUAL-10 NEXT
>
> **Product:** Apexify.js Documentation Studio
>
> **Primary repositories:**
> - `EIAS79/Apexify.js`
> - `EIAS79/Apexify.js-Documentation`
>
> **Current package baseline:** Apexify.js 6.x Studio execution architecture
>
> **Core objective:** extend Studio from **Code → Preview** into a true visual authoring environment where users can construct Apexify compositions visually and generate clean, idiomatic Apexify.js code from the composition.
>
> **Execution policy:** implementation is performed phase-by-phase outside `main`; each phase is locally/CI verified before one phase-completion merge/commit reaches `main`. Vercel must never be used as the iterative debugger.

---

# 0. Executive definition

Today Studio primarily behaves like:

```text
Apexify.js code
    ↓
Run
    ↓
Apexify runtime
    ↓
Preview / media artifact / diagnostics
```

The new visual authoring mode adds the reverse creation workflow:

```text
Visual authoring actions
    ↓
Structured Studio Visual Project
    ↓
Studio Visual Compiler
    ├──→ real Apexify runtime preview
    └──→ clean Apexify.js code generator
```

The user will be able to switch Studio type:

```text
Studio
├── Code
│   └── existing code → runtime → preview workflow
└── Visual
    └── editor → structured project → preview + generated code
```

The phrase **Preview → Code** in this plan does **not** mean computer vision, screenshot OCR, or trying to reverse-engineer arbitrary pixels into code.

It means:

1. the user visually creates a composition;
2. the preview is a rendering of that structured composition;
3. Studio retains the semantic objects used to create it;
4. Studio deterministically emits the corresponding Apexify.js calls.

The preview and code therefore come from the same source model.

---

# 1. Non-negotiable product rules

## 1.1 Real Apexify only

Visual Studio must never maintain an editor-only shadow renderer that imitates Apexify.

The editor may draw non-content UI overlays such as:

- selection rectangles;
- resize handles;
- rotation handles;
- rulers;
- guides;
- snapping indicators;
- drag ghost outlines;
- timeline controls.

But the actual user composition must be rendered by a real Apexify execution path:

- `@apexify/web` for browser-capable realtime rendering;
- the existing isolated full Apexify runtime for native/server/media operations.

## 1.2 Preview and code share one semantic model

There must never be:

```text
Visual editor state A → preview
Visual editor state B → generated code
```

There is one normalized Visual Project.

Both preview execution and code generation consume that project.

## 1.3 All public authorable Apexify features are covered

No public option may silently disappear because the visual editor did not implement a control for it.

A generated **Visual Capability Matrix** must map current Apexify public APIs/options to one of:

```text
visual-property
visual-object
visual-operation
timeline-operation
project-operation
export-only
hosted-runtime-exclusion
not-applicable
```

Every public capability must have an explicit classification.

For every capability that can logically be authored visually, the matrix must identify:

- editor section;
- control schema;
- project-model field;
- preview runtime route;
- code generator mapping;
- test/proof case.

CI fails when a new public Apexify option appears without a Visual Studio classification.

## 1.4 No fake controls

A UI control may only ship when changing it produces real Apexify behavior.

Do not create decorative controls that are ignored by the runtime.

## 1.5 One-file code by default

Generated code must favor a single clean TypeScript file.

Do **not** split ordinary compositions into artificial helper pages/files.

Multi-file generation is allowed only when one of these conditions is true:

- binary/local assets need their own files;
- the user explicitly requests project export;
- a very large dataset is cleaner as a separate data module;
- a reusable user-created component/subcomposition is intentionally extracted;
- media timeline data is too large to remain readable inline;
- a hard editor/file-size safety boundary requires splitting.

Even when project export uses multiple files, Studio must always offer a **single-file generated-code view** where technically possible.

## 1.6 Generated code is user code, not harness code

Generated code must look like documentation-quality Apexify code:

```ts
import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  // normal readable Apexify.js operations
}

return await main();
```

It must not expose:

- Studio execution wrappers;
- capability trackers;
- test harnesses;
- internal worker protocols;
- artifact collectors;
- internal runtime proxies;
- hidden coverage machinery.

## 1.7 Deterministic code generation

For the same normalized project and generator version:

```text
same project → same generated source
```

Stable formatting, naming, property order and helper decisions are required.

## 1.8 Visual mode must not break Code mode

The current Code Studio remains a first-class product.

Visual Studio is added alongside it, not by rewriting the existing editor into a visual-only application.

---

# 2. Current Studio baseline to preserve

The existing Studio already contains valuable infrastructure that this program must reuse:

- multi-buffer code editor;
- code execution planner;
- browser/full-runtime routing;
- same-origin isolated full runtime;
- image/GIF/audio/video/text/JSON artifact protocol;
- multi-artifact preview;
- diagnostics;
- run history;
- asset shelf;
- uploaded image/audio/video/font assets;
- `studio://asset/<id>` references;
- multi-file source execution;
- Linux/Docker/GitHub smoke-test infrastructure;
- capability/completeness registry.

The Visual program builds on these systems rather than creating parallel replacements.

---

# 3. Product surface

## 3.1 Studio type switch

Top-level Studio control:

```text
[ Code ] [ Visual ]
```

Optional future aliases:

```text
Code Studio
Visual Studio
```

The selected type is stored per Studio session/project.

## 3.2 Shared surfaces between modes

Both Code and Visual mode share:

- project/session identity;
- asset library;
- preview/artifact panel;
- diagnostics;
- run history;
- runtime capability information;
- output/download actions;
- project persistence;
- sharing metadata where safe.

## 3.3 Visual Studio workspace layout

Desktop target:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Studio / project / mode switch / undo / redo / zoom / run/export │
├────────────┬───────────────────────────────┬───────────────────────┤
│ Tools      │                               │ Inspector             │
│            │        Visual viewport        │                       │
│ Insert     │                               │ Properties            │
│ Assets     │                               │ Appearance            │
│ Layers     │                               │ Effects               │
│ Components │                               │ Data                  │
│ Media      │                               │ Advanced              │
│            │                               │                       │
├────────────┴───────────────────────────────┴───────────────────────┤
│ Timeline / animation / audio / video — appears when applicable    │
├────────────────────────────────────────────────────────────────────┤
│ Preview / Generated Code / Diagnostics / Outputs                  │
└────────────────────────────────────────────────────────────────────┘
```

Responsive layout may collapse side panels into drawers, but the conceptual structure remains stable.

---

# 4. Core architecture

## 4.1 Data flow

```text
Pointer / form / keyboard / asset actions
                 ↓
          Visual Project Store
                 ↓
          Normalize + validate
                 ↓
         Studio Operation Plan
             ↙         ↘
      Preview adapter   Code generator
           ↓                 ↓
   real Apexify runtime   clean TypeScript
           ↓
        artifact
```

The **Studio Operation Plan** is not a public engine IR and is not a renderer.

It is an internal deterministic description of the public Apexify calls required to materialize the current project.

## 4.2 Future ARS integration

The longer-term Apexify architecture introduces the Apex Render Specification (ARS), compiler and retained browser runtime.

Visual Studio must be designed so the project model can later lower into ARS without changing the user-facing editor model.

Migration path:

```text
Current
Visual Project → Studio Operation Plan → Apexify 6.x calls

Future
Visual Project → ARS → Apex compiler/runtime
                   └→ source/code emitter
```

Do not expose unstable engine IR directly as the saved Visual Studio project format.

---

# 5. Visual Project model

## 5.1 Project-level structure

Conceptual model:

```ts
type VisualProject = {
  schemaVersion: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  document: VisualDocument;
  assets: VisualAssetRef[];
  palettes: VisualPalette[];
  variables: VisualVariable[];
  timelines: VisualTimeline[];
  outputs: VisualOutputPreset[];

  codegen: VisualCodegenSettings;
  editor: VisualEditorState;
};
```

Editor-only state such as currently selected node must be separated from semantic render state when practical.

## 5.2 Document

```ts
type VisualDocument = {
  width: number;
  height: number;
  pixelRatioPolicy?: ...;
  background: ...;
  rootNodeIds: string[];
  nodes: Record<string, VisualNode>;
};
```

## 5.3 Node identity

Every node receives a stable ID.

IDs survive:

- drag/reposition;
- property changes;
- layer reordering;
- code regeneration;
- undo/redo;
- save/reload.

Do not use array index as semantic identity.

## 5.4 Visual node families

At minimum:

```text
Canvas/root
Group
Surface/nested surface
Image
Shape
Text
Chart
Path
Freehand/Doodle
Pixel operation
Component
Template instance
Scene
GIF composition
Audio composition
Video composition
Generated buffer/reference
```

Not every family renders identically; they share the editor/layer identity model.

## 5.5 Transform model

Common transform metadata where meaningful:

```text
x
y
width
height
scaleX
scaleY
rotation
anchor/pivot
opacity
visibility
locked
z-order
```

The visual compiler lowers these properties to the appropriate Apexify public API for each node type.

Do not force a universal property into generated code when the target Apexify API does not support that semantic directly.

---

# 6. Layer system

## 6.1 Required layer actions

Users must be able to:

- select one layer;
- multi-select layers;
- rename;
- duplicate;
- delete;
- lock/unlock;
- show/hide;
- drag to reorder;
- move forward/backward;
- send to front/back;
- group/ungroup where semantic composition allows it;
- collapse/expand nested groups;
- copy/paste;
- cut/paste;
- inspect source feature used by the layer.

## 6.2 Layer tree

The layer tree reflects semantic nesting, not only draw order.

Example:

```text
Document
├── Background
├── Hero group
│   ├── Photo
│   ├── Gradient overlay
│   └── Heading
├── Sales chart
├── Doodle annotation
└── Footer
```

## 6.3 Visibility

Hidden layers remain in project state and generated code may either:

- emit `visible: false` when supported; or
- omit the operation with a generated comment/metadata path when omission is the correct Apexify semantic.

The strategy must be deterministic.

## 6.4 Lock state

Lock is primarily editor state unless the Apexify runtime itself has an equivalent semantic.

Do not emit fake `locked` properties into Apexify calls.

---

# 7. Viewport and direct manipulation

## 7.1 Viewport navigation

Required:

- zoom in/out;
- reset zoom;
- fit canvas;
- 100% view;
- pan;
- wheel/trackpad support;
- pinch zoom where supported;
- optional rulers;
- guides;
- grid;
- safe-area overlays.

## 7.2 Selection

Required:

- click select;
- marquee selection;
- shift additive selection;
- selection cycling for overlapping objects;
- layer-panel selection synchronization;
- keyboard traversal where feasible.

## 7.3 Transform handles

For transformable nodes:

- drag;
- resize edges/corners;
- preserve aspect ratio modifier;
- rotate;
- numeric transform input;
- snap to canvas edges/center;
- snap to other objects;
- optional grid snapping.

## 7.4 Alignment

Multi-selection alignment:

- left;
- horizontal center;
- right;
- top;
- vertical center;
- bottom;
- distribute horizontally;
- distribute vertically.

Generated code must reflect final coordinates only; temporary snapping/editor state is not emitted.

---

# 8. History / command model

All semantic editor mutations must pass through an undoable command system.

Commands include:

```text
insert node
delete node
move node
resize node
rotate node
change property
reorder layer
group/ungroup
asset replace
chart data edit
path edit
timeline clip edit
keyframe edit
```

Requirements:

- undo;
- redo;
- transaction grouping;
- drag operations collapse into one history command;
- property scrubbing does not create hundreds of history entries;
- history is bounded;
- project save state can detect dirty/clean state.

---

# 9. Property Inspector system

## 9.1 Schema-driven controls

The inspector must be powered by a capability/property registry rather than large one-off JSX forms.

Conceptual descriptor:

```ts
type VisualControlDescriptor = {
  id: string;
  capability: string;
  propertyPath: string;
  section: string;
  control: 'number' | 'text' | 'color' | 'select' | 'boolean' |
           'slider' | 'asset' | 'gradient' | 'matrix' | 'data-table' |
           'timeline' | 'code-fragment';
  defaultValue?: unknown;
  enumValues?: readonly unknown[];
  min?: number;
  max?: number;
  step?: number;
  previewImpact: ...;
  codegen: ...;
};
```

## 9.2 Inspector groups

Common inspector categories:

```text
Layout
Transform
Content
Appearance
Fill
Stroke
Shadow
Background
Pattern
Mask
Effects
Typography
Data
Axes
Legend
Animation
Audio
Video
Output
Advanced
```

Only relevant sections appear for the selected node.

## 9.3 Advanced raw option editor

For highly nested or newly introduced API options, provide an Advanced structured-object editor tied to the exact public option schema.

This is a safety net, not a substitute for first-class controls for common properties.

---

# 10. Canvas / document authoring — full coverage target

The Canvas section must expose every current declaration-backed canvas/background option.

## 10.1 Document dimensions

Controls:

- width;
- height;
- common presets;
- orientation swap;
- custom dimensions;
- pixel-ratio/backing policy where the current runtime exposes it.

## 10.2 Background

Support all available canvas background families, including as applicable:

- solid color;
- transparency;
- linear gradient;
- radial gradient;
- gradient geometry;
- stops;
- multiple background layers;
- image/bitmap background layers;
- custom background input supported by Apexify;
- noise;
- pattern backgrounds;
- blend/opacity options exposed by current API.

## 10.3 Canvas appearance

Expose current API options for:

- border/stroke;
- border width;
- corner radius;
- shadow;
- clipping/rounding behavior;
- pattern sizing/spacing/rotation;
- noise intensity;
- output-relevant options where applicable.

## 10.4 Generated code

Prefer idiomatic code such as:

```ts
const { buffer } = await painter.createCanvas({
  width: 1200,
  height: 800,
  gradientBg: { ... },
  patternBg: { ... },
});
```

Do not generate Studio-specific canvas wrappers.

---

# 11. Images and shapes — full coverage target

## 11.1 Sources

Image nodes may source from:

- Studio-uploaded local file;
- remote URL when current runtime/security model allows it;
- generated Apexify buffer;
- another visual node output/reference where supported;
- built-in Apexify shape descriptors;
- registered named asset.

## 11.2 Asset insertion

Users can:

- drag/drop file onto viewport;
- select from Asset Shelf;
- paste image from clipboard where browser permissions allow;
- enter URL;
- replace existing source without recreating the layer.

## 11.3 Geometry

Expose declaration-backed image/shape geometry:

- x/y;
- width/height;
- fit mode;
- alignment;
- crop semantics;
- rotation/transform;
- radius;
- clipping;
- shape-specific dimensions/points.

## 11.4 Appearance

Expose available:

- opacity;
- fill;
- stroke;
- stroke width;
- shadow;
- blend/composite behavior;
- masks;
- filters;
- effects;
- gradient application;
- tint/color processing;
- any other public `ImageProperties`/`CreateImageOptions` option.

## 11.5 Built-in shapes

All built-in shapes exposed by Apexify must appear in the Insert/Shapes panel.

Each shape gets visual handles appropriate to its geometry.

## 11.6 Code generation

One or multiple image/shape nodes may lower into one `createImage()` call when that is the cleanest equivalent.

Do not emit one call per node if Apexify naturally accepts a descriptor array and grouping them preserves semantics.

---

# 12. Text and fonts — full coverage target

## 12.1 Text insertion

Tools:

- click-to-add text;
- text box;
- duplicate;
- inline text edit on double-click;
- inspector text edit.

## 12.2 Typography

Expose every current declaration-backed text option, including where available:

- font family;
- uploaded font asset;
- font size;
- style/weight representation supported by Apexify;
- fill;
- stroke;
- stroke width;
- x/y;
- alignment;
- baseline;
- width/max width;
- line height;
- letter spacing;
- opacity;
- rotation/transform;
- text shadows/effects;
- wrapping/layout options.

## 12.3 Font assets

Asset Shelf supports font upload.

Visual Studio must display:

- registered family;
- file name;
- preview sample;
- asset usage count.

Generated code must use a clean font registration approach appropriate to exported target.

## 12.4 Text measurement

Expose `measureText` through an optional inspector/measurement panel for selected text.

This is a structured-result operation, not a fake visual property.

---

# 13. Charts — all chart families and options

Visual Studio must support all currently public chart families:

- pie;
- doughnut/donut where represented;
- bar;
- horizontal bar;
- line;
- scatter;
- radar;
- polar area;
- comparison charts;
- combo charts.

## 13.1 Chart insertion workflow

1. Insert Chart.
2. Pick chart family.
3. Enter/paste/import data.
4. Configure appearance/options.
5. Resize/reposition chart layer.
6. Preview updates.
7. Generated code uses the matching Apexify chart API.

## 13.2 Data editor

Required:

- table/grid editing;
- add/remove row;
- add/remove series;
- CSV paste where practical;
- JSON advanced editor;
- numeric validation;
- labels/colors editing;
- data replacement without rebuilding the chart node.

## 13.3 Chart option coverage

The inspector must map all current option families, including where supported:

- dimensions/padding;
- titles;
- axis labels;
- axis ranges;
- ticks;
- grid;
- colors;
- series styles;
- data labels;
- legends;
- legend position;
- backgrounds;
- borders;
- value labels;
- pie/donut-specific controls;
- bar-family controls;
- line/scatter controls;
- radar/polar controls;
- comparison spacing/layout;
- combo axes/series configuration.

## 13.4 Chart composition

Chart output can be used as:

- final artifact;
- image layer in a larger composition;
- scene layer;
- generated buffer source.

Visual Studio must preserve that relationship rather than rasterizing the chart into an opaque uploaded asset.

---

# 14. Path / Doodle / custom geometry

## 14.1 Path tools

Provide:

- pen/path tool;
- line tool;
- polyline;
- freehand doodle;
- bezier editing;
- node/anchor editing;
- close/open path;
- direct Path2D command inspection.

## 14.2 Freehand / doodle

Pointer samples are simplified into a manageable path.

Configurable:

- smoothing;
- simplification tolerance;
- stroke width;
- color;
- opacity;
- line cap;
- line join;
- dash;
- optional pressure mapping when pointer pressure is available.

## 14.3 Custom connector paths

Expose current Apexify custom path semantics such as:

- start/end points;
- straight/smooth/bezier path types;
- tension where applicable;
- arrows;
- markers;
- marker positions;
- marker shape/color/size;
- line style;
- dash patterns.

## 14.4 Fill / compound path

Expose current Path2D functionality including:

- fill;
- stroke;
- fill rule;
- compound shapes;
- reusable path objects.

## 14.5 Code generation

Generated code must prefer:

```text
painter.path2d.create(...)
painter.path2d.draw(...)
painter.path2d.custom(...)
```

when those APIs represent the visual operation.

---

# 15. Pixels and detection tools

Advanced editor section for current public pixel/detection capabilities.

Possible tools based on current public API include:

- pixel read/write;
- point color inspect;
- pixel manipulation operations;
- region detection;
- path hit detection;
- arbitrary-region hit testing;
- distance measurement.

UI may include:

- pixel inspector loupe;
- coordinate readout;
- sampled color;
- region overlay;
- detection results panel.

Structured results are shown in the inspector/diagnostics and generated as explicit Apexify calls when user chooses to include the operation.

---

# 16. Scenes, nested surfaces and composition

## 16.1 Scene support

Visual project may lower to a scene when scene semantics are more appropriate than sequential buffer operations.

Support current public scene capabilities including:

- scene background;
- image layers;
- text layers;
- chart layers;
- path layers;
- nested surface layers;
- component layers;
- asset references;
- scene validation;
- SceneBuilder lifecycle operations where applicable.

## 16.2 Nested surfaces

A nested surface appears as a group-like layer with its own dimensions and children.

Users can enter/isolate the nested surface for editing.

## 16.3 SceneBuilder operations

When visually relevant, support:

- add;
- replace;
- insert;
- remove;
- move/reorder.

The editor itself uses its own history model; generated code uses SceneBuilder only when that is the correct public Apexify representation.

---

# 17. Components

All current Apexify component factories must be discoverable in an Insert → Components library.

Current representative component categories include things such as:

- card;
- badge;
- progress;
- avatar;
- watermark;
- other component factories present in the package capability manifest.

Each component exposes its complete option schema in the inspector.

Generated code uses the actual component factory APIs, not flattened handcrafted shapes, unless the user explicitly converts/explodes a component into primitive layers.

---

# 18. Templates

Template authoring support:

- create/select template;
- placeholders;
- placeholder defaults;
- named assets;
- overrides;
- insertions;
- render-input inspection;
- final render.

Template instances remain semantic objects in the layer tree.

Provide an explicit **Detach/Expand** command if users want to convert a template instance into editable primitive nodes. Do not silently detach it.

---

# 19. Named assets and variables

## 19.1 Asset registry editor

Expose current named-asset capabilities:

- image registration;
- font registration;
- palette registration;
- arbitrary supported values;
- replace;
- unregister;
- has/list/delete/clear;
- dotted-path resolve;
- `$ref` preprocessing.

## 19.2 Visual references

Inspector fields may bind to:

```text
literal value
named asset
project variable
```

The UI clearly indicates when a field is bound rather than literal.

## 19.3 Code generation

Named assets should remain named assets in code when the visual project uses them semantically.

Do not replace all `$refs` with copied literal values just because the preview could be flattened.

---

# 20. Image utilities / manipulation workspace

Every public `painter.image.*` capability must receive a Studio operation mapping.

Current option families include:

- resize;
- crop;
- filters;
- effects;
- blend;
- mask;
- gradient;
- collage;
- stitch;
- palette extraction;
- color analysis/removal;
- conversion;
- compression;
- format handling;
- validation utilities where user-facing.

## 20.1 Destructive vs nondestructive editing

Visual Studio project state should store image operations nondestructively as an operation stack when practical.

Preview:

```text
source asset → operation stack → rendered result
```

Generated code emits the equivalent ordered Apexify utility calls.

## 20.2 Operation stack UI

Users can:

- add operation;
- reorder compatible operations;
- enable/disable operation;
- edit options;
- duplicate;
- remove;
- reset.

---

# 21. GIF and animation authoring

## 21.1 GIF mode

A document can generate GIF output from:

- explicitly authored frames;
- animation frame sequence;
- scene-to-GIF workflow;
- current Apexify `createGIF` semantics.

## 21.2 Timeline

Bottom timeline appears when animation/GIF is active.

Visual tracks may contain:

- layer visibility;
- transform/property animation where currently supported;
- frame snapshots;
- markers;
- frame duration.

## 21.3 GIF output options

Expose every current declaration-backed GIF option, including as applicable:

- width/height;
- frame count;
- delay;
- repeat;
- quality;
- output form;
- static/poster output where supported.

## 21.4 Code generation

Generate the actual public GIF/animation APIs:

```text
createGIF
animate
renderSceneToGIF
```

Do not invent a Studio-only animation runtime.

---

# 22. Audio authoring

Visual Studio must support the complete current procedural audio surface:

- preset catalog;
- preset generation;
- synth;
- custom oscillator generation;
- ADSR/envelope controls;
- filters;
- pan;
- modulation;
- noise;
- sequences;
- composition timeline;
- mixing.

## 22.1 Audio UI

Provide:

- audio node/track list;
- waveform preview when data is available;
- duration;
- playback;
- trim/range controls when the underlying API supports the operation;
- parameter controls;
- volume/pan;
- sequence event editor;
- mix graph/timeline.

## 22.2 Generated code

Generated code must use current public `createAudio` families:

```text
preset
synth
custom
sequence
compose
mix
```

Hosted Studio continues to respect its filesystem-persistence security boundary; project export may generate persistence code only when explicitly requested for an external Node project target.

---

# 23. Video authoring

Video editing is a first-class Visual Studio mode, not a single `createVideo` form.

## 23.1 Video sources

Sources may include:

- uploaded Studio video asset;
- generated frame sequence;
- generated scene frames;
- supported local/project asset in exported project;
- remote source only where the execution/security model explicitly supports it.

## 23.2 Timeline tracks

Video timeline supports semantic track types:

```text
video clips
image overlays
text overlays
visual layers
audio tracks
procedural audio
markers
transitions where supported
```

## 23.3 Core operations

Expose current video capability families, including:

- create from frames;
- transcode;
- trim;
- splice/merge;
- speed;
- crop;
- rotate;
- effects;
- color correction;
- compression;
- fades;
- reverse;
- volume/mute/normalize;
- watermark;
- picture-in-picture;
- text overlays;
- audio mixing;
- frame extraction;
- thumbnails/previews;
- segment replacement;
- looping;
- scene detection;
- stabilization;
- freeze frames;
- export presets;
- LUT application;
- transitions currently implemented by Apexify;
- metadata/probe;
- codec/operation info.

## 23.4 Video pipeline

`videoPipeline()` should have a visual retained-operation stack/timeline representation.

Support current pipeline semantics such as:

- source;
- trim;
- splice;
- text overlays;
- audio/procedural audio tracks;
- layer add/update/remove/clear;
- undo/redo where represented by pipeline API;
- snapshot/getLayers;
- render presets.

## 23.5 Preview

Editing preview may use lower-resolution/proxy rendering for responsiveness, but the proxy must still be produced by the real Apexify/media stack.

Final export uses requested output settings.

---

# 24. Batch and chain

Advanced section exposes current:

- `batch`;
- `chain`.

These are not always represented as visible canvas nodes.

Visual representation may use an **Operations** panel showing ordered processing steps.

Generated code should preserve the batch/chain semantic when the user explicitly constructs that workflow.

---

# 25. Plugins

Plugin support is an advanced project-level section.

## 25.1 Editor behavior

- show installed/available compatible project plugins;
- expose plugin-provided capabilities only when a Studio schema adapter exists;
- allow plugin configuration;
- indicate runtime route/security requirements.

## 25.2 No automatic fake UI

A plugin API is not automatically visually editable just because it exists.

The capability matrix must classify it.

A plugin can contribute a Visual Studio adapter later through a documented extension contract.

---

# 26. Output / export operations

Visual Studio must expose local/noncredentialed output conversion capabilities, including current:

- `toOutput`;
- `outPut` legacy behavior where still public;
- data URL;
- base64;
- Blob;
- ArrayBuffer;
- binary download/export.

Hosted Studio does not expose arbitrary server filesystem paths or deployment secrets.

Credentialed third-party public upload remains an explicit hosted-runtime exclusion, not a silently missing feature.

---

# 27. Asset system

## 27.1 Asset types

Asset Shelf handles:

```text
image
font
audio
video
JSON/data
palette
future compatible binary resources
```

## 27.2 Source categories

```text
Studio local upload
URL/reference
project-generated artifact
named Apexify asset
generated node buffer
```

## 27.3 Asset usage tracking

For each asset display:

- type;
- name;
- dimensions/duration when known;
- size;
- usages;
- missing/broken state;
- replace action;
- delete protection when in use.

## 27.4 Export path strategy

A Studio asset reference must not leak into exported user code as `studio://...`.

Code export translates it to one of:

- project-relative file path;
- URL;
- embedded data when explicitly selected and reasonable;
- generated buffer variable.

The user chooses export asset strategy when ambiguity exists.

---

# 28. Visual compiler

## 28.1 Responsibilities

The Visual compiler converts project state into a normalized ordered operation plan.

Passes:

```text
validate project
normalize defaults
resolve references
resolve draw/layer order
resolve generated dependencies
choose public Apexify API strategy
build operation graph
classify runtime requirements
produce preview plan
produce codegen plan
```

## 28.2 Strategy selection

The compiler may choose between equivalent public Apexify strategies based on project semantics.

Example:

```text
simple canvas + text + image
→ createCanvas → createImage → createText

semantic scene with nested surfaces/components
→ SceneBuilder / renderScene

chart layer inside composition
→ createChart → buffer → composition layer
```

Generated code should be the most understandable correct representation, not merely the lowest-level sequence.

## 28.3 No semantic flattening

If the user created:

- template;
- component;
- named asset;
- chart;
- scene;
- video pipeline;

then code generation should preserve that higher-level semantic where possible.

---

# 29. Code generator contract

## 29.1 Output style

Default TypeScript output:

```ts
import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  // generated Apexify.js project
}

return await main();
```

## 29.2 Minimal imports

Only import APIs/modules actually needed.

## 29.3 Stable naming

Node names are sanitized into stable readable identifiers.

Examples:

```text
heroImage
heading
salesChart
brandPalette
introAudio
finalVideo
```

Fallback names are deterministic.

## 29.4 Omit defaults

Do not emit every default option simply because the inspector knows about it.

Generated code should include:

- values changed by the user;
- values required for deterministic equivalence;
- meaningful semantic defaults when omission would make the code misleading.

## 29.5 Preserve user semantics

Examples:

```text
named asset remains named asset
chart remains chart
component remains component
template remains template
video pipeline remains pipeline
```

## 29.6 Single-file-first policy

Default generator emits one file.

No artificial helper splitting.

No “Shared setup page”.

No separate “Run page”.

No pagination simply because source is long.

The editor uses code folding and scrolling.

## 29.7 Multi-file project export

Optional project export can produce:

```text
src/index.ts
src/components/...      only if explicitly reusable/extracted
src/data/...            only for large datasets
assets/...
package.json            optional project scaffold
apexify-studio.json     optional round-trip project source
```

## 29.8 Formatting

Generated code passes the repository’s formatter/parser gate.

## 29.9 Codegen proof

Every visual capability must have snapshots proving generated code.

Golden assertions should focus on semantic output and stable formatting.

---

# 30. Visual ↔ Code relationship

## 30.1 Visual → Code

Guaranteed.

Every valid visual project must produce code or a precise compile diagnostic.

## 30.2 Visual → Preview

Guaranteed through real Apexify execution.

## 30.3 Code → Preview

Already provided by Code Studio and remains unchanged.

## 30.4 Arbitrary Code → Visual

Not guaranteed in the first Visual Studio program.

Imperative arbitrary JavaScript can contain:

- loops;
- dynamic data;
- conditionals;
- plugins;
- external state;
- arbitrary calculations.

Pretending every possible program can be reconstructed into a visual editor would be dishonest and fragile.

## 30.5 Generated-code round trip

Code generated by Visual Studio can remain linked to its Visual Project through:

- project identity;
- generator version;
- optional metadata hash;
- saved `.apexstudio.json` project file.

Switching Visual → Code can create/update a generated buffer.

Switching back to Visual uses the stored Visual Project, not pixel analysis.

Later program: parse a safe recognized subset of Apexify code into visual nodes.

---

# 31. Runtime and preview routing

## 31.1 Fast browser path

Use `@apexify/web` for compatible realtime visual editing.

The browser path should support incremental updates and retained resources as the package evolves.

## 31.2 Full-runtime path

Use existing same-origin isolated full runtime for:

- native-only image operations;
- complex scenes not available in web runtime;
- GIF;
- audio;
- video;
- FFmpeg workflows;
- advanced APIs requiring the full package.

## 31.3 Debouncing

Pointer drags must not launch expensive full-runtime jobs on every mousemove.

Strategy:

- browser-compatible live preview during interaction;
- debounced authoritative render after commit;
- lower-quality media proxy preview where appropriate;
- explicit final render for expensive video/GIF workflows.

## 31.4 Resource reuse

Reuse:

- decoded images;
- registered fonts;
- generated chart buffers;
- stable resources;
- thumbnails;
- media metadata.

Bound caches.

---

# 32. Timeline architecture

Timeline is conditional, not always visible.

Appear when project contains:

- GIF/animation;
- audio sequence/composition;
- video;
- future engine animation.

Track model:

```text
visual property track
visibility track
frame track
video clip track
audio clip track
procedural audio track
marker track
```

The current Apexify 6.x adapter lowers only to semantics actually supported by current APIs.

The future engine animation system can replace the adapter without replacing timeline UX/project identity.

---

# 33. Snapping, guides and layout helpers

Editor-only tools:

- canvas center guides;
- object edge/center snapping;
- pixel grid;
- configurable snap threshold;
- rulers;
- manual guides;
- alignment measurements;
- spacing indicators.

These do not pollute generated Apexify code.

Only final geometry is emitted.

---

# 34. Accessibility requirements

Visual authoring is pointer-heavy but cannot be pointer-only.

Required:

- keyboard layer selection;
- arrow-key movement;
- modifier accelerated movement;
- delete/duplicate shortcuts;
- undo/redo;
- inspector labels;
- focus visibility;
- accessible button names;
- minimum hit targets;
- non-color-only selection states;
- reduced-motion support;
- screen-reader-readable layer tree;
- textual property editing for transform values.

Canvas artwork itself may require a semantic description field; raw pixels are not automatically accessible content.

---

# 35. Performance budgets

Targets should be verified on representative projects.

Initial budgets:

- selection/drag UI feedback: target 60 FPS on ordinary desktop hardware for normal documents;
- inspector property response: visually immediate for browser-compatible updates;
- no full page React rerender for pointer movement;
- large layer trees virtualized when needed;
- code generation for normal project: <100 ms target;
- project serialization: <100 ms target for normal projects;
- expensive media render runs asynchronously with visible progress/cancellation where supported;
- asset caches bounded;
- history bounded;
- heavy chart/media/editor modules lazy-loaded.

Actual thresholds may be refined from profiling, not guessed permanently.

---

# 36. Security rules

Visual Studio inherits the current Studio security boundary.

Never expose:

- Vercel secrets;
- arbitrary host filesystem;
- unrestricted subprocess;
- unrestricted FFI;
- arbitrary server network egress;
- arbitrary server persistence.

Uploaded/local assets are materialized only through the bounded Studio asset protocol.

Generated external project code may contain capabilities that hosted Studio cannot safely execute, but the UI must clearly distinguish:

```text
can generate
can execute in hosted Studio
```

No silent omission.

---

# 37. Persistence

## 37.1 Browser persistence

Use IndexedDB for large structured project/asset state.

Do not put binary media in localStorage.

## 37.2 Project file

Define a versioned project format:

```text
.apexstudio.json
```

The schema stores semantic authoring state, not rendered pixel dumps.

## 37.3 Migration

Every schema version change requires a migration path.

Do not corrupt older Studio projects silently.

---

# 38. Project export

Export modes:

## 38.1 Copy code

Copies single-file TypeScript.

## 38.2 Download code

Downloads `.ts`.

## 38.3 Export Apexify project

Optional archive containing:

- source;
- local assets;
- optional package scaffold;
- optional Visual Studio project JSON.

## 38.4 Export rendered artifact

Downloads current real Apexify artifact:

- PNG/JPEG/WebP/etc.;
- GIF;
- WAV/audio;
- MP4/WebM;
- structured JSON where applicable.

---

# 39. Feature completeness system

A new generated file:

```text
generated/studio/visual-capability-matrix.json
```

Each record contains:

```text
capability id
public symbol
option family
visual classification
editor section
control registry IDs
model field(s)
preview route
codegen adapter
tests
status
```

CI rules:

1. every current public Studio-relevant capability has a record;
2. every visual capability has codegen mapping;
3. every visual capability has preview route;
4. every visual property has a control or documented structured advanced editor;
5. every codegen adapter has tests;
6. every editor section has at least one browser test;
7. every media section has Linux smoke proof;
8. no `TODO-supported` entries count as complete.

This is how “all features, no exceptions” is enforced technically instead of relying on memory.

---

# 40. Proposed repository structure

```text
components/studio/
  CodeStudio.tsx                     existing
  StudioShell.tsx                    new parent mode shell
  visual/
    VisualStudio.tsx
    VisualToolbar.tsx
    VisualViewport.tsx
    VisualOverlay.tsx
    VisualLayersPanel.tsx
    VisualInspector.tsx
    VisualInsertPanel.tsx
    VisualTimeline.tsx
    VisualCodePanel.tsx
    VisualAssetBrowser.tsx
    controls/
      NumberControl.tsx
      ColorControl.tsx
      GradientControl.tsx
      AssetControl.tsx
      TransformControl.tsx
      DataTableControl.tsx
      ...

lib/studio/visual/
  model.ts
  schema.ts
  persistence.ts
  commands.ts
  history.ts
  selection.ts
  snapping.ts
  registry.ts
  completeness.ts
  compiler/
    normalize.ts
    validate.ts
    dependencies.ts
    lower.ts
    plan.ts
  preview/
    browserAdapter.ts
    fullRuntimeAdapter.ts
  codegen/
    ast.ts
    names.ts
    imports.ts
    emitter.ts
    formatter.ts
    assets.ts
  domains/
    canvas.ts
    image.ts
    text.ts
    chart.ts
    path.ts
    pixels.ts
    scene.ts
    component.ts
    template.ts
    imageUtils.ts
    gif.ts
    audio.ts
    video.ts
    batchChain.ts
    output.ts

scripts/studio/visual/
  generate-capability-matrix.ts
  verify-capability-matrix.ts
  codegen-smoke.ts
  visual-browser-smoke.mjs
  visual-media-smoke.ts
  Dockerfile.visual-smoke

generated/studio/
  visual-capability-matrix.json

.github/workflows/
  studio-visual-check.yml
  studio-visual-media-smoke.yml
```

Exact filenames may evolve, but separation of model/compiler/codegen/UI/runtime adapters is mandatory.

---

# 41. Development / Vercel policy

This program must not repeat the recent pattern of discovering runtime problems through repeated production deployments.

## 41.1 Phase branch

Every phase uses its own work branch/worktree:

```text
studio-visual/v00-contract
studio-visual/v01-shell
studio-visual/v02-model-codegen
...
```

## 41.2 Iteration happens outside `main`

During a phase:

```text
edit
→ local unit tests
→ local dev browser test
→ local Linux/Docker smoke where runtime-sensitive
→ GitHub Actions phase checks
→ fix
→ repeat
```

Do not deploy Vercel for iterative debugging.

## 41.3 Vercel preview suppression

Before implementation begins, ensure `studio-visual/*` work branches do not consume unnecessary Vercel preview builds.

If the project currently auto-builds every Git branch, add/configure an ignored-build rule for Visual Studio work branches.

Production branch remains `main`.

## 41.4 One main integration per completed phase

Only after the phase gate is green:

```text
update master-plan checklist
squash/merge or single phase completion commit
→ main
→ one production deployment
→ one production smoke verification
```

No “try a fix on main and see what Vercel says.”

## 41.5 Main commit naming

Examples:

```text
feat(studio-visual): complete phase 01 dual-mode shell
feat(studio-visual): complete phase 04 canvas authoring
feat(studio-visual): complete phase 08 charts
feat(studio-visual): complete phase 13 video timeline
```

---

# 42. Standard phase Definition of Done

A phase is not complete because the UI looks finished.

Every feature phase must satisfy all applicable items:

- [ ] project schema updated;
- [ ] visual controls implemented;
- [ ] runtime preview mapping implemented;
- [ ] generated code mapping implemented;
- [ ] undo/redo integration implemented;
- [ ] persistence/migration covered;
- [ ] capability matrix updated;
- [ ] unit tests green;
- [ ] generated-code snapshots green;
- [ ] browser interaction test green;
- [ ] Linux/Docker test green when native/media path involved;
- [ ] accessibility check for new controls;
- [ ] no fake/no-op options;
- [ ] no editor-only render implementation;
- [ ] plan phase checklist/status updated;
- [ ] one final phase commit merged to `main`;
- [ ] production smoke after merge, not during iteration.

---

# 43. Ordered implementation phases

The order below is intentionally dependency-driven.

Do not jump to video timeline before the project model, selection/layers and code generator are stable.

---

## STUDIO-VISUAL-0 — Contract, plan, capability baseline and isolated workflow

### Objective

Freeze the product contract and create the completeness mechanism before UI coding.

### Deliverables

- master plan committed as source of truth;
- Visual Studio terminology;
- Code/Visual mode contract;
- initial Visual Capability Matrix generator;
- classification of every current public Studio capability;
- branch/CI/Vercel workflow policy;
- initial `.apexstudio.json` schema draft;
- decision log.

### Required tests

- capability inventory generation deterministic;
- zero unclassified current public capabilities.

### Phase gate

No feature implementation starts until this inventory is trustworthy.

### Main integration

```text
feat(studio-visual): establish visual authoring contract
```

---

## STUDIO-VISUAL-1 — Dual-mode Studio shell

### Objective

Add Visual mode without changing Code Studio execution behavior.

### Deliverables

- top-level Code/Visual switch;
- shared project/session shell;
- shared assets;
- shared output/diagnostics/history surfaces;
- Visual mode lazy-loaded;
- responsive empty visual workspace.

### Non-goals

No drawing/editing yet.

### Gate

Existing Code Studio regression suite remains green.

### Main integration

```text
feat(studio-visual): complete dual-mode Studio shell
```

---

## STUDIO-VISUAL-2 — Visual Project model, persistence and codegen core

### Objective

Establish the semantic source of truth before building tools.

### Deliverables

- versioned `VisualProject` schema;
- stable node IDs;
- assets/variables/references;
- normalize/validate pass;
- Studio Operation Plan;
- code generator framework;
- minimal imports;
- stable identifier naming;
- default single-file emitter;
- save/load `.apexstudio.json`;
- Visual → Code handoff.

### Proof

A programmatically created sample Visual Project generates readable executable Apexify code and equivalent preview.

### Main integration

```text
feat(studio-visual): complete project model and codegen core
```

---

## STUDIO-VISUAL-3 — Viewport, layers, selection, transforms and history

### Objective

Make Visual Studio a real editor before adding feature breadth.

### Deliverables

- viewport zoom/pan/fit;
- selection overlay;
- drag;
- resize;
- rotation;
- numeric transform inspector;
- layer tree;
- reorder;
- show/hide;
- lock/unlock;
- duplicate/delete;
- multi-select;
- align/distribute;
- snapping;
- undo/redo command stack;
- keyboard shortcuts.

### Proof

Generic placeholder nodes can be manipulated without runtime-specific implementation leaking into editor infrastructure.

### Main integration

```text
feat(studio-visual): complete viewport layers and transform editing
```

---

## STUDIO-VISUAL-PRE-4 — Studio product shell rebuild

### Objective

Rebuild the Visual Studio product shell before feature breadth expands further. The approved Apexify Studio Visual Editor reference supplied on 2026-09-21 is the authoritative visual/UX direction for this pre-phase.

The target is not a cosmetic restyle of the current Phase-3 shell. PRE-4 establishes the permanent product architecture that later Canvas, Image, Text, Chart, Path, Component, GIF, Audio and Video phases will plug into.

Phase 4 must not begin until PRE-4 is production verified and the remaining master plan has been re-audited against the finished shell.

### Product-shell target

The Visual Studio shell must converge on this permanent structure:

```text
Apexify Studio
├── top application bar
│   ├── brand + product subtitle
│   ├── Code / Visual mode switch
│   ├── Run
│   ├── Preview
│   ├── Generate Code
│   ├── Export
│   └── account / notification affordances
├── left feature rail
│   ├── Canvas
│   ├── Images
│   ├── Text
│   ├── Charts
│   ├── Shapes
│   ├── Paths
│   ├── Layers
│   ├── Components
│   ├── Assets
│   ├── GIF
│   ├── Audio
│   └── Video
├── secondary left context panel
│   └── semantic Layers tree by default
├── central viewport / canvas workspace
│   ├── device / canvas-size selector
│   ├── zoom controls
│   ├── select / pan / view controls
│   └── authoritative artboard
├── right contextual inspector
│   ├── Style
│   ├── Transform
│   ├── Effects
│   ├── Data
│   └── Advanced
└── bottom dock
    ├── Preview
    ├── Generated Code
    ├── Diagnostics
    ├── Assets
    └── History
```

### Visual direction

The shell must use one coherent Apexify Studio design system matching the approved reference direction:

- deep blue-black / navy application background;
- layered navy panel surfaces with restrained elevation;
- electric blue and violet primary accents;
- subtle gradients and glow only where they improve hierarchy;
- thin low-contrast borders;
- consistent rounded controls and panels;
- compact creator-tool density without cramped controls;
- stronger typography hierarchy than the Phase-3 prototype shell;
- explicit hover, active, selected, focus, disabled and drag states;
- consistent icon sizing and alignment;
- clear separation between application navigation, authoring tools, viewport and contextual editing;
- canvas remains the visual center of gravity.

A tokenized Studio theme must own spacing, typography, radii, surfaces, borders, shadows, accent states and control sizing. One-off inline styling is not the long-term shell architecture.

### Required shell deliverables

#### Top application bar

- Apexify Studio brand block;
- product subtitle;
- Code / Visual switch retained and visually integrated;
- Run / Preview / Generate Code / Export action grouping;
- project state / dirty-state affordance;
- account/notification positions reserved without requiring authentication work in this phase;
- responsive overflow behavior with no control collisions.

#### Feature rail

Permanent navigation positions for:

- Canvas;
- Images;
- Text;
- Charts;
- Shapes;
- Paths;
- Layers;
- Components;
- Assets;
- GIF;
- Audio;
- Video.

A feature may be visibly present before its owning phase only as navigation architecture. It must not claim working behavior that does not yet exist.

#### Layers / context panel

- polished semantic nested tree;
- collapse / expand;
- selected / hover / focus states;
- visibility and lock affordances;
- drag reorder affordance;
- inline rename affordance;
- add/create affordance;
- correct nested spacing and connector hierarchy;
- context-panel architecture reusable by future feature rail sections.

#### Central viewport

- dominant central authoring surface;
- device/canvas selector region;
- compact zoom group;
- select / pan / view-control group;
- centered artboard with premium grid/stage treatment;
- Phase-3 selection, transforms, snapping, marquee, pan, zoom and keyboard behavior preserved;
- no overflow collisions at supported desktop widths.

#### Inspector

Permanent tab architecture:

- Style;
- Transform;
- Effects;
- Data;
- Advanced.

PRE-4 must establish reusable inspector-section primitives for labels, number fields, text fields, selects, button groups, toggles, sliders, color/fill rows and collapsed groups. Only controls backed by current editor/runtime behavior may be interactive; future-phase controls can occupy structural placeholders but must be clearly non-authoring until implemented.

#### Bottom dock

Replace the Phase-3 history-dominated footer area with a real dock system:

- Preview;
- Generated Code;
- Diagnostics;
- Assets;
- History.

Requirements:

- active-tab state;
- collapsible dock;
- resizable height where practical;
- generated-code surface wired to the current Visual Project generator;
- diagnostics/history preserve their current semantic sources;
- asset surface reuses the shared Studio asset model rather than creating a new store;
- dock architecture reusable by later media/timeline phases.

### Phase-3 behavior preservation gate

The shell rebuild must not regress any verified Phase-3 editor behavior:

- Code ↔ Visual switching;
- project identity/session preservation;
- selection and multi-selection;
- marquee and overlap cycling;
- drag, resize and rotate;
- numeric transforms;
- snapping / guides;
- layer hierarchy and reorder;
- show/hide and lock/unlock;
- duplicate/delete;
- copy/cut/paste;
- group/ungroup;
- align/distribute;
- undo/redo;
- keyboard shortcuts;
- dirty/clean state;
- save/load;
- generated-code handoff.

### Responsive / layout contract

PRE-4 must establish deterministic desktop behavior for the full shell and graceful constrained-width behavior:

- no overlapping toolbar labels;
- no clipped primary actions at supported desktop widths;
- side panels can collapse or adapt before the viewport becomes unusable;
- bottom dock does not permanently consume excessive viewport height;
- inspector remains readable;
- horizontal scrolling is not the default shell layout strategy;
- touch/pointer behavior from Phase 3 remains functional where supported.

### Non-goals

PRE-4 does not complete the authoring implementation for future domains. It must not falsely mark these as feature-complete:

- full Canvas/background authoring;
- image/shape feature completeness;
- typography/font completeness;
- chart authoring;
- path/doodle/pixel/detection authoring;
- Components/Templates feature completion;
- GIF/animation completion;
- Audio completion;
- Video completion;
- final export/project round-trip completion.

Those domains retain their owning phases after PRE-4.

### Engineering architecture

The shell rebuild must prefer composable Studio primitives over another monolithic VisualStudio component. Expected boundaries include equivalents of:

```text
VisualStudioShell
├── StudioTopBar
├── FeatureRail
├── ContextPanel
│   └── LayersPanel
├── ViewportWorkspace
│   ├── ViewportToolbar
│   └── ArtboardStage
├── InspectorPanel
│   └── InspectorTabs / reusable property sections
└── StudioBottomDock
    ├── PreviewDock
    ├── GeneratedCodeDock
    ├── DiagnosticsDock
    ├── AssetsDock
    └── HistoryDock
```

Exact file names may differ, but responsibilities must be separated enough that Phases 4+ extend the shell without rebuilding it again.

### Verification

PRE-4 requires:

- typecheck;
- production build;
- dedicated Studio Visual contract tests;
- Phase-3 regression tests unchanged or strengthened;
- desktop browser smoke;
- constrained-width/responsive smoke;
- Code → Visual → Code session-preservation smoke;
- live production smoke after merge.

### Acceptance criteria

PRE-4 is complete only when all of the following are true:

1. The live Visual Studio clearly matches the approved reference's layout hierarchy and visual direction.
2. The current prototype-like shell has been replaced rather than merely recolored.
3. Top bar, feature rail, Layers/context panel, central viewport, Inspector and bottom dock are all first-class permanent surfaces.
4. The canvas is the dominant visual focus.
5. The shell uses a consistent tokenized design system.
6. Phase-3 editing behavior remains operational and covered by regression tests.
7. Future feature categories have stable UI homes without fake functional claims.
8. The shell behaves correctly at supported desktop widths and degrades intentionally at constrained widths.
9. Generated Code, Preview, Diagnostics, Assets and History have permanent dock architecture.
10. Production smoke confirms the rebuilt shell after merge.

### Mandatory post-PRE-4 roadmap re-audit

After PRE-4 is production verified and before STUDIO-VISUAL-4 begins:

- re-audit Phases 4–18 against the finished shell;
- map each authoring domain to its permanent feature-rail, context-panel, inspector and dock surfaces;
- move shared functionality into the earliest correct owning phase;
- remove duplicated UI work from later phases;
- add missing functional dependencies discovered by the rebuilt shell;
- preserve the existing phase numbers unless a materially better execution order requires a deliberate master-plan revision.

This re-audit is a required planning gate, not an optional cleanup.

### Main integration

```text
feat(studio-visual): rebuild studio product shell before phase 4
```

---

### Post-PRE-4 roadmap re-audit result

The re-audit of STUDIO-VISUAL-4 through STUDIO-VISUAL-18 is complete.

Decisions:

- phase numbering and execution order **4–18 remain unchanged**;
- no new permanent top-level shell surfaces are required before Phase 4;
- later phases must plug into the existing feature rail, context/Layers panel, Inspector tabs, contextual Timeline/result views, bottom Code/Diagnostics/Assets/History dock, and top Preview/Generate Code/Export workflows;
- each feature phase now owns extension of the linked Code ↔ Visual reconciler for deterministic semantics introduced by that phase;
- arbitrary imperative code is still not promised to round-trip; unsupported edits surface explicit sync limitations;
- Phase 15 completes/hardens export and round-trip foundations already introduced early rather than rebuilding those workflows;
- Phase 17 hardens autosave/live-sync/modal/panel reliability already present;
- Phase 18 validates the new permanent UI and bidirectional contract end-to-end.

## STUDIO-VISUAL-4 — Canvas and background authoring

### Objective

Complete the first end-to-end authoring domain inside the permanent PRE-4 shell.

### Permanent UI placement

- **Canvas** feature-rail entry becomes the owning authoring surface;
- canvas name / size remain in the right Inspector and extend beyond the linked width/height controls already shipped;
- background/fill/stroke/shadow/radius controls live under **Style**;
- canvas-level procedural/background effects live under **Effects**;
- advanced declaration-backed options that do not justify first-class controls live under **Advanced**;
- the center artboard remains the authoritative visual editing surface;
- no new standalone Canvas window or duplicate bottom preview surface is introduced.

### Deliverables

Every current canvas/background option classified and exposed:

- dimensions;
- color/transparent background;
- gradients;
- stops/geometry;
- layers;
- noise;
- patterns;
- stroke;
- shadow;
- radius;
- other declaration-backed canvas options.

### Linked-code requirement

Phase 4 extends the existing live Code ↔ Visual reconciler from width/height to the complete deterministic `createCanvas()` contract owned by this phase.

Required behavior:

- Inspector/canvas edits regenerate the linked code automatically;
- canonical supported `createCanvas()` edits update Visual state automatically;
- unsupported dynamic expressions remain editable but surface an explicit sync error rather than silently diverging.

### Codegen proof

Visual project → clean `createCanvas()` call.

### Runtime proof

Generated/live-linked code and the top Preview modal produce equivalent output.

### Main integration

```text
feat(studio-visual): complete canvas authoring
```

---

## STUDIO-VISUAL-5 — Assets, images and shapes

### Permanent UI placement

- **Images**, **Shapes** and **Assets** feature-rail entries become active authoring tools;
- image/shape insertion and library browsing use the left context panel plus the existing right-side Assets drawer;
- geometry and placement use **Transform**;
- fill/stroke/radius/opacity use **Style**;
- shadow/blend/mask use **Effects**;
- source/binding metadata uses **Data** or **Advanced** where appropriate;
- asset upload/replacement reuses the existing shared Studio asset store.

### Deliverables

- drag/drop image;
- Asset Shelf insertion;
- URL source;
- generated-buffer source;
- all built-in shapes;
- geometry;
- fit/alignment;
- opacity;
- fill/stroke;
- radius;
- shadow;
- blend;
- mask;
- image-level public options;
- asset replacement;
- code generation to `createImage()`.

### Linked-code requirement

Implement deterministic two-way reconciliation for the canonical image/shape source generated by this phase. Asset references must round-trip by stable asset identity/path without embedding editor-only state in generated code.

### Gate

Every current `ImageProperties` / `CreateImageOptions` field classified, with a declared Visual control location and reverse-sync policy.

### Main integration

```text
feat(studio-visual): complete image and shape authoring
```

---

## STUDIO-VISUAL-6 — Text and font authoring

### Permanent UI placement

- **Text** feature-rail entry owns insertion and text-specific context;
- direct canvas text editing is supported where technically safe;
- typography, color, alignment, wrapping and layout controls live under **Style** / **Transform**;
- font assets use the existing **Fonts** category in the Assets drawer;
- measurement/read-only metrics appear contextually in the Inspector instead of creating a separate global panel.

### Deliverables

- text insertion/editing;
- all public text option controls;
- uploaded fonts;
- family registry;
- measurement panel;
- wrapping/layout controls;
- generated `createText()` code.

### Linked-code requirement

Canonical `createText()` output and supported font/text properties must round-trip Code ↔ Visual without losing text content, font identity or layout semantics.

### Main integration

```text
feat(studio-visual): complete text and font authoring
```

---

## STUDIO-VISUAL-7 — Path, doodle, pixels and detection

### Permanent UI placement

- **Paths** feature-rail entry owns freehand/path/vector authoring;
- canvas overlays/handles own point and bezier manipulation;
- **Style** owns fill/stroke/dash/marker presentation;
- **Advanced** owns lower-level Path2D/pixel-operation parameters;
- structured pixel/detection results use the existing bottom **Diagnostics**/context-result surfaces rather than a permanent new dock;
- editor-only path handles/guides never leak into generated code.

### Deliverables

- freehand tool;
- line/polyline;
- bezier/path editor;
- Path2D commands;
- custom connectors;
- arrows/markers/dash;
- fill/stroke/fill rule;
- pixel inspector/operations;
- detection tools;
- structured result panel;
- exact path/pixels/detect codegen.

### Linked-code requirement

Canonical path/pixel/detection operations generated by this phase must have an explicit reverse-sync classification: fully reversible, safely normalized, or intentionally code-only with a visible sync limitation.

### Main integration

```text
feat(studio-visual): complete path doodle and pixel tools
```

---

## STUDIO-VISUAL-8 — Charts

### Permanent UI placement

- **Charts** feature-rail entry owns chart insertion and family selection;
- **Data** Inspector tab becomes the primary series/data binding editor;
- **Style** owns titles, axes, legends, labels and series presentation;
- chart-family-specific advanced controls live under **Advanced**;
- large tabular editing may use the left context panel or an expandable dock view, but must not replace the permanent bottom Code surface.

### Deliverables

- all chart families;
- data table editor;
- titles;
- axes;
- ranges/ticks/grid;
- series styles;
- labels;
- legends;
- chart-family-specific options;
- comparison chart UI;
- combo chart UI;
- chart buffer reuse in composition;
- complete chart option matrix.

### Linked-code requirement

Chart family, data, bindings and supported option trees must round-trip through the canonical generated chart representation. Data edits from either side must update the same Visual Project chart node.

### Main integration

```text
feat(studio-visual): complete chart authoring
```

### Phase 8 implementation record — STUDIO-VISUAL-8

**Status:** MAIN MERGED

- documentation branch: `studio-visual/v08-charts`
- documentation PR: **#88**
- final verified Phase-8 head: `819ff7dfa18dcdd9bca535b0f03fd197c070121b`
- documentation main integration: `19aad8dfa9e06a22fa2cb7d083a3e8366c7a5b12`
- Apexify.js runtime PR: **#37**
- Apexify.js runtime merge: `f57bb82743c8f71bbe7e519d060010f970b06ef9`
- pinned `@apexify/web` Studio snapshot: exact runtime merge above
- runtime acceptance for the Phase-8 extension:
  - Apexify CI: **SUCCESS**
  - Phase 14-P Final Acceptance: **SUCCESS**
- exact-head documentation acceptance:
  - Studio Visual Phase Gate: run **35748508943** — **SUCCESS**
  - Documentation Runtime Build Gate: run **35748508679** — **SUCCESS** on Node 22 / 24 / 26
- automated Phase-8 review findings were addressed and all five review threads were resolved before merge.

Completed implementation scope:

- Charts feature-rail insertion surface with all ten required chart authoring families;
- Data Inspector support for rows, series, comparison sub-chart data and combo bar/line data;
- Style controls for title, axes, labels, legend, grid and series presentation;
- Advanced family controls for bar/horizontal bar, pie/donut, line/scatter, radar, polar area, comparison and combo;
- complete raw chart option tree editor and explicit option-matrix visibility;
- semantic chart nodes in the Visual Project;
- native contract alignment for RadarSeries, standalone bar `type`, donut `donutInnerRadius`, pie/donut `legends.standard`, and comparison family resets;
- donut lowering through native `createChart('pie', ..., { type: 'donut' })`;
- lowering to `createChart()`, `createComparisonChart()` and `createComboChart()`;
- generated chart Buffer reuse through canonical `createImage()` composition;
- reverse-sync from canonical literal chart code back to the same semantic chart node;
- `@apexify/web` comparison/combo preview support;
- Phase-8 unit/source execution proof;
- exact-head TypeScript typecheck, production build and dual-mode browser regression proof.

**Phase 8 is closed. STUDIO-VISUAL-9 is next.**

---

## STUDIO-VISUAL-9 — Scenes, nested surfaces, components, templates and named assets

### Permanent UI placement

- **Components** feature-rail entry owns component/template browsing and insertion;
- nested scenes/surfaces remain visible through the existing semantic **Layers** tree;
- component/template configuration uses the left context panel plus **Data** / **Advanced** Inspector tabs;
- named assets continue to use the shared Assets system;
- detach/expand actions are layer/component actions, not new global modes.

### Deliverables

- scene authoring strategy;
- nested surfaces;
- SceneBuilder semantic operations;
- component library;
- all component option schemas;
- template instances;
- placeholder editor;
- overrides/insertions;
- named asset registry;
- `$ref` bindings;
- variables/references;
- detach/expand behavior where meaningful.

### Linked-code requirement

Scene/component/template references, overrides and named-asset bindings must use stable semantic identities so canonical generated code can reconcile back into the same nested Visual Project structure.

### Main integration

```text
feat(studio-visual): complete scene component template authoring
```

### Phase 9 implementation record — STUDIO-VISUAL-9

**Status:** COMPLETE — integration PR **#101**

- documentation branch: `studio-visual/v09-scenes-components`
- documentation PR: **#101**
- green implementation head: `718a409fb02b9705400d14aa70c5e22650cf68a3`
- dedicated Studio Visual Phase Gate: run **35837846542** — **SUCCESS**
- base main commit: `bfdf27f02401ea92ce9be8b1a1c9fcd7bae6d9d5`
- branch divergence at PR open: **33 ahead / 0 behind**
- verified Apexify runtime API snapshot: `f57bb82743c8f71bbe7e519d060010f970b06ef9`

Completed implementation scope:

- semantic `scene` and `surface` nodes with nested SceneBuilder lowering;
- permanent Components rail authoring surface and semantic Layers-tree ownership;
- component/template capture, libraries and reusable instance insertion;
- template placeholder editor plus instance data bindings;
- per-definition layer overrides and native before/after insertion schemas;
- insertion materialization in browser preview;
- named asset and variable registry integration with stable `$ref` bindings;
- detach and expand lifecycle actions;
- Data / Advanced Inspector authoring for Phase-9 semantic nodes;
- Phase-9 validation for definition integrity, missing definitions, override targets and insertion targets;
- native SceneBuilder/template code generation aligned with Apexify.js `createScene()`, `createTemplate()`, `TemplateHandle.toRenderInput()` and asset registry contracts;
- stable semantic source marker for canonical Code → Visual reconstruction without eval;
- browser-safe preview path that materializes components/templates and flattens scene/surface containers before `@apexify/web` execution;
- deterministic insertion identities and source serialization;
- dedicated Phase-9 source/unit regression coverage integrated into `studio:visual:test`.

Acceptance evidence for run **35837846542**:

- Studio completeness: **PASS**
- Visual capability / option coverage: **PASS** — 187 capabilities, 17,233 option paths, 0 unclassified
- Studio Visual tests: **PASS** — 92 / 92
- codegen proof: **PASS**
- TypeScript typecheck: **PASS**
- production Next.js build: **PASS**
- production server start: **PASS**
- dual-mode browser regression: **PASS**

**Phase 9 is complete. STUDIO-VISUAL-10 is next.**

---

## STUDIO-VISUAL-10 — Image utility / effect stack

### Permanent UI placement

This phase extends the existing **Images** workflow; it does not add another top-level tool.

- ordered nondestructive operations live primarily under **Effects**;
- operation ordering/presets use contextual Inspector sections or the left context panel;
- crop/resize geometry cooperates with the existing Transform system;
- conversion/compression controls that affect exported artifacts live under **Advanced** / Export configuration.

### Deliverables

Nondestructive ordered operation stack covering every public image utility family:

- resize;
- crop;
- filters/effects;
- blend/mask/gradient;
- collage/stitch;
- palette/color operations;
- conversion/compression;
- current remaining image utility capabilities.

### Linked-code requirement

Operation order and parameters must serialize deterministically and reconcile back into the same ordered Visual effect stack when canonical generated source is edited.

### Main integration

```text
feat(studio-visual): complete image manipulation stack
```

---

## STUDIO-VISUAL-11 — GIF and animation timeline

### Permanent UI placement

- **GIF** feature-rail entry activates GIF/animation authoring;
- temporal editing uses a specialized **Timeline** dock view that plugs into the existing bottom-dock architecture;
- Timeline is contextual and must coexist with the permanent Code / Diagnostics / Assets / History tabs;
- frame assets continue through the shared Assets system;
- Preview remains the top modal, not a second embedded preview pane.

### Deliverables

- conditional timeline;
- frame authoring;
- duration/repeat/quality;
- `createGIF`;
- `animate`;
- scene-to-GIF;
- GIF preview;
- frame rail;
- generated code.

### Linked-code requirement

Frame order, timing and deterministic animation/GIF options must round-trip between canonical source and the timeline model.

### Local/CI requirement

Linux GIF smoke test before `main`.

### Main integration

```text
feat(studio-visual): complete GIF and animation authoring
```

---

## STUDIO-VISUAL-12 — Audio authoring

### Permanent UI placement

- **Audio** feature-rail entry owns audio authoring;
- presets/sources use the left context panel and shared **Audio** Assets category;
- synthesis/mix parameters use **Style**, **Data** or **Advanced** according to semantics;
- sequencing/composition uses the same contextual Timeline dock architecture introduced in Phase 11;
- waveform/player surfaces are contextual tools, not a replacement for the Code dock.

### Deliverables

- preset browser;
- synth/custom controls;
- ADSR/filter/pan/modulation/noise;
- sequence editor;
- composition timeline;
- mix controls;
- waveform/player;
- generated procedural audio code.

### Linked-code requirement

Deterministic synth, sequence, timeline and mix declarations generated by this phase must round-trip into the same audio composition model.

### Local/CI requirement

Linux audio smoke suite.

### Main integration

```text
feat(studio-visual): complete audio authoring
```

---

## STUDIO-VISUAL-13 — Video editor

### Permanent UI placement

- **Video** feature-rail entry owns video authoring;
- uploaded/generative sources use the shared **Video** Assets category;
- clips/tracks use the contextual Timeline dock architecture;
- overlays remain normal Visual nodes in Layers so text/image/component editing stays consistent with earlier phases;
- clip properties use **Transform**, **Effects**, **Data** and **Advanced** rather than a separate full-screen inspector;
- final render settings belong to Export/Advanced surfaces.

### Deliverables

- clip timeline;
- uploaded/generative sources;
- create-from-frames;
- trim/splice;
- overlays;
- PiP;
- text;
- audio;
- speed/effects/crop/rotate;
- color/compression/fades/reverse;
- frame extraction;
- thumbnails;
- pipeline retained operations;
- advanced video stack capabilities;
- final render settings;
- generated code.

### Linked-code requirement

Canonical clip/track ordering, timing, retained operations and render settings must have deterministic source serialization and reverse reconciliation wherever supported by the public runtime contract.

### Local/CI requirement

The existing Linux Studio video smoke infrastructure becomes mandatory and expands to cover Visual Video generated code.

No Vercel debugging.

### Main integration

```text
feat(studio-visual): complete video timeline authoring
```

---

## STUDIO-VISUAL-14 — Advanced operations, batch/chain/plugins/output

### Permanent UI placement

This phase primarily activates the existing **Advanced** Inspector tab and contextual Operations views.

- batch/chain/plugin configuration uses **Advanced** plus the left context panel where lists are needed;
- structured operation results use **Diagnostics** or temporary result views;
- output conversion integrates with the existing top **Export** workflow;
- this phase must not create a competing permanent Operations dock unless a proven workflow cannot fit the established shell.

### Deliverables

- Operations panel;
- batch editor;
- chain editor;
- compatible plugin configuration;
- output conversion options;
- structured results;
- generated advanced Apexify code;
- explicit hosted-runtime exclusions.

### Linked-code requirement

Every advanced operation is classified as reversible, normalized, or code-only. Reversible/normalized canonical operations participate in live Code ↔ Visual sync; code-only operations must be visibly identified without corrupting linked Visual state.

### Main integration

```text
feat(studio-visual): complete advanced operation authoring
```

---

## STUDIO-VISUAL-15 — Export, round-trip project bundles and code quality

### Objective

Complete and harden the export/round-trip foundations already introduced before Phase 4. This phase must extend the existing top Generate Code modal, top Export menu and linked bottom Code editor rather than rebuilding them.

### Deliverables

Already-established foundations to harden/complete:

- Copy Code;
- Download `.ts`;
- editable/autosaving linked Code surface;
- filename editing;
- top Generate Code modal;
- explicit Open in Code Studio handoff.

Remaining completion scope:

- one-file default;
- optional project export;
- asset export strategies;
- `.apexstudio.json`;
- complete linked-buffer round trip for all deterministic domains implemented through Phase 14;
- formatting/linting;
- deterministic snapshots;
- conflict/recovery behavior for unsupported code edits;
- optional generated-code provenance metadata that does not pollute normal code.

### Round-trip gate

For every reversible domain implemented in Phases 4–14:

```text
Visual edit
→ canonical code update
→ code edit
→ Visual Project reconciliation
→ regenerated canonical code
```

must preserve semantic state.

### Main integration

```text
feat(studio-visual): complete code and project export
```

---

## STUDIO-VISUAL-16 — Full feature completeness gate

### Objective

Prove “all Apexify features are represented” mechanically in the finalized Studio architecture.

### Deliverables

- declaration/API-driven inventory;
- option-family inventory;
- visual capability matrix;
- permanent UI-location mapping for every authorable capability;
- reverse-sync classification for every code-generating capability;
- zero unclassified capabilities;
- zero visual capabilities without codegen;
- zero visual capabilities without Preview-modal runtime route;
- zero option families lacking controls/advanced schema;
- zero reversible capabilities lacking linked-code reconciliation;
- representative proof projects;
- generated report.

### UI completeness rule

A capability is not complete merely because a control exists. The matrix must prove the correct permanent home among:

- feature rail;
- left context/Layers panel;
- Style / Transform / Effects / Data / Advanced Inspector;
- contextual Timeline/result views;
- bottom Code / Diagnostics / Assets / History;
- top Preview / Generate Code / Export workflows.

### Main integration

```text
chore(studio-visual): close full feature completeness gate
```

---

## STUDIO-VISUAL-17 — Performance, accessibility, UX and reliability hardening

### Deliverables

- profiling;
- render invalidation optimization;
- large layer trees;
- asset cache behavior;
- keyboard accessibility;
- responsive editor;
- modal focus trapping / Escape / restoration behavior;
- resizable/collapsible panel and Timeline reliability;
- CodeMirror large-document performance;
- live Code ↔ Visual debounce/transaction performance;
- autosave persistence, recovery and migration;
- explicit linked-code conflict/sync-error recovery;
- error recovery;
- corrupt-project handling;
- migrations;
- crash isolation;
- performance budgets;
- accessibility audit;
- browser matrix.

### Reliability rule

Autosave, linked-code state, project state, panel state and asset state must recover coherently after refresh/crash. A stale code buffer must never silently overwrite a newer Visual Project.

### Main integration

```text
perf(studio-visual): complete editor hardening
```

---

## STUDIO-VISUAL-18 — Final release gate

### Final end-to-end proof

Representative projects must cover:

- canvas;
- image/shape;
- text/font;
- chart;
- path/doodle;
- pixels/detection;
- scene/nested surface;
- component;
- template;
- named assets;
- image effects;
- GIF;
- animation;
- audio;
- video;
- batch/chain;
- output conversion;
- multi-artifact output;
- generated code execution.

For each representative project, prove the production UI path:

```text
Visual Project
→ linked canonical code
→ top Preview modal
→ authoritative runtime artifact
→ compare with generated-code execution
```

For every capability classified reversible, also prove:

```text
Visual state
→ canonical code
→ supported code edit
→ Visual reconciliation
→ regenerated canonical code
→ equivalent runtime artifact
```

The release gate fails on semantic divergence, silent linked-code drift, broken modal/export flows, or UI placement that bypasses the permanent PRE-4 shell architecture.

### Required shell proof

Final browser proof must exercise:

- feature rail;
- Layers/context panel;
- Inspector tabs;
- live editable Code dock;
- Diagnostics / Assets / History;
- Preview modal pan/zoom/download/rename;
- Generate Code modal copy/rename/download;
- Export / project bundle workflow;
- responsive/constrained-width behavior.

### Production policy

Only after local + GitHub final gate is green:

```text
merge final phase to main
→ one Vercel production deployment
→ production smoke
```

### Main integration

```text
feat(studio-visual): release visual authoring and preview-to-code
```

---

# 44. Phase tracking table

| Phase | Name | Status | Main commit | Production proof |
|---|---|---|---|---|
| 0 | Contract / capability baseline | PRODUCTION VERIFIED | `97d7741c8f35b06dd33bed5ba2ac9b247b344465` | Vercel deployment + `/`, `/studio`, `/docs/getting-started`, `/api-reference` smoke |
| 1 | Dual-mode shell | PRODUCTION VERIFIED | `b7bfd7d70e2bd30a4e6bca63562a4fdc6e6782a7` | Vercel production deployment completed on main (`4d28777edbf140c9afe65e4e874a4b9b38ca5803`); live `/studio` Code → Visual → Code smoke passed with shared Assets/Output/Diagnostics/History and source-session preservation |
| 2 | Project model / codegen core | MAIN MERGED | `186b87bcabba5316639c5a103c0b12125822a35a` | Manual deployment intentionally not triggered; current project instruction is merge-to-main only |
| 3 | Viewport / layers / transforms / history | PRODUCTION VERIFIED | `372d449e8e37c998faf56eef0f0db8704f648e9d` | Vercel production deployment `dpl_6TEqXQJ9NbH2MYT2fpC1mmgRgNbn` READY for exact merge SHA; live `/studio` Visual-mode smoke passed with Layers, Transform Inspector, History, zoom/fit/reset, Select/Pan, Project menu and viewport visible |
| PRE-4 | Studio product shell rebuild | MAIN MERGED | `b530d0a8f18290ac3f9081744153c9aae58a9dfe` | Studio Visual push gate `35632663379` PASS; PR gate `35632667933` PASS; build/browser/screenshot proof PASS; production deployment deferred because Vercel quota is rate-limited |
| 4 | Canvas | MAIN MERGED | `7c33de0eae60a6ed7a12fb41b942610eaf702498` | PR #83; exact-head Studio Visual gate `35654406532` PASS; contracts/typecheck/build/runtime/browser/live-sync proof PASS; production deployment deferred because Vercel quota is rate-limited |
| 5 | Images / shapes / assets | MAIN MERGED | `b3aa8683345f48687cddc4e54077bdfd3f13226d` | PR #84; exact-head Studio Visual gate `35657277254` PASS; contracts/typecheck/build/runtime/browser/live-sync proof PASS; production deployment deferred because no exact merge deployment is available yet |
| 6 | Text / fonts | MAIN MERGED | `123d0bea6a324acb1a715d45d0f2faa70a500b05` | PR #85; exact-head Studio Visual gate `35662040413` PASS; contracts/typecheck/build/runtime/browser/live-sync proof PASS; Apexify Web text renderer merged as `fb48f08ed8fc3d48628d8a93b15fe5d94b69bfbb`; production verification deferred because no exact Phase-6 main production deployment is available; branch preview `dpl_9vzrordcDAz2wVM7a3no3R872SDq` was intentionally canceled by the Vercel ignored-build-step policy |
| 7 | Paths / doodle / pixels / detect | MAIN MERGED | `f331de671c14e8dadc0167fe8c4532c22ba54c8f` | PR #86; exact-head Studio Visual gate `35721981002` PASS; Documentation Runtime Build Gate `35721981107` PASS; typecheck/build/browser/live-sync/reverse-sync proof PASS; direct canvas anchor/Bézier editing PASS; Apexify.js Phase-7 runtime finalized by PR #36 as `45b9381c07b70bb16be456406940858af8ab699a`; production verification deferred because exact feature-merge Vercel status was still pending when closure was recorded |
| 8 | Charts | NOT STARTED | — | NEXT — activate Charts and implement complete chart authoring against the permanent shell |
| 9 | Scenes / components / templates / assets | NOT STARTED | — | — |
| 10 | Image utilities | NOT STARTED | — | — |
| 11 | GIF / animation | NOT STARTED | — | — |
| 12 | Audio | NOT STARTED | — | — |
| 13 | Video | NOT STARTED | — | — |
| 14 | Advanced operations | NOT STARTED | — | — |
| 15 | Export / project round trip | NOT STARTED | — | — |
| 16 | Feature completeness gate | NOT STARTED | — | — |
| 17 | Hardening | NOT STARTED | — | — |
| 18 | Final release | NOT STARTED | — | — |

## Phase 1 implementation record — STUDIO-VISUAL-1

> **Status:** PRODUCTION VERIFIED
>
> **Work branch:** `studio-visual/v01-shell`
>
> **Base main commit:** `97d7741c8f35b06dd33bed5ba2ac9b247b344465`
>
> **Green phase-gate run:** GitHub Actions `35584341599`
>
> **Main integration:** `b7bfd7d70e2bd30a4e6bca63562a4fdc6e6782a7`
>
> **Production deployment:** VERIFIED — Vercel completed deployment for main commit `4d28777edbf140c9afe65e4e874a4b9b38ca5803` on 2026-09-21.
>
> **Production smoke:** PASS — live `/studio` verified Code mode, Visual mode, Visual workspace/shared surfaces, and Code-session preservation after switching back.

Completed Phase-1 scope:

- top-level Code / Visual authoring-mode switch;
- shared Studio shell and shared session state;
- shared assets, output artifacts, diagnostics/notices and history surfaces;
- Visual mode lazy-loaded on first use;
- responsive empty Visual workspace with no drawing/editing implementation;
- existing Code Studio runtime/execution path preserved;
- accessible tab / tabpanel relationships;
- desktop and mobile browser regression;
- Code → Visual → Code session-preservation proof;
- TypeScript typecheck and production Next.js build green;
- existing capability/completeness gates remain green;
- Phase-1 PR #70 squash-merged into `main`;
- production Vercel deployment completed successfully;
- live `/studio` smoke passed for Code → Visual → Code with the original Code Studio source preserved.

The Phase-1 browser smoke verifies the Studio route at desktop and mobile widths, switches into Visual mode, confirms the empty/shared surfaces, checks for horizontal overflow, switches back to Code mode and proves that the Code Studio source session was not mutated.

## Phase 2 implementation record — STUDIO-VISUAL-2

> **Status:** MAIN MERGED
>
> **Work branch:** `studio-visual/v02-model-codegen`
>
> **Base main commit:** `be884aa507e8703d8a25118abb4b8167d3f84a76`
>
> **Green phase-gate run:** GitHub Actions `35611056198`
>
> **PR:** #78
>
> **Main integration:** `186b87bcabba5316639c5a103c0b12125822a35a`
>
> **Deployment policy:** no manual Vercel deployment; current project instruction is merge-to-main only.

Completed Phase-2 scope:

- versioned `VisualProject` v1 semantic model;
- stable project and node IDs;
- typed asset / variable / palette references;
- deterministic normalization;
- structural/reference validation;
- private Studio Operation Plan;
- real Apexify operation-plan executor;
- deterministic TypeScript code-generation framework;
- minimal import registry;
- stable identifier naming;
- default single-file emitter;
- `.apexstudio.json` save/load;
- generated-code surface backed by the actual Visual Project;
- explicit Visual → Code fork into a new Code Studio buffer;
- Phase-2 unit tests;
- desktop/mobile browser regression including Visual → Code handoff;
- programmatic Visual Project proof using the real Apexify runtime;
- generated-code/runtime equivalence proof.

Phase-2 proof evidence:

- authoritative operation-plan preview and generated Apexify code produced the same artifact;
- artifact size: 399 bytes;
- SHA-256: `76d3fb9bc8c219f823912f35265a5182c9c366517e4d1226056ecad302b0a4f3`;
- dedicated Studio Visual Phase Gate `35611056198`: PASS;
- PR #78 squash-merged into `main` as `186b87bcabba5316639c5a103c0b12125822a35a`.

The broader DOC-* failures observed on PR #78 are baseline documentation-workflow failures rather than Phase-2 regressions: the same workflow families were already failing repeatedly on `main` before the Phase-2 branch, including the Phase-2 base/current-main history. The dedicated Studio Visual Phase Gate and Documentation Runtime Build Gate both passed for the Phase-2 head.

## Phase 3 implementation record — STUDIO-VISUAL-3

> **Status:** PRODUCTION VERIFIED
>
> **Work branch:** `studio-visual/v03-editor`
>
> **Base main commit:** `ed09d0b74053d50388d641a574bf5e52e159ff9c`
>
> **Green phase-gate run:** GitHub Actions `35623534882`
>
> **PR:** #79
>
> **Main integration:** `372d449e8e37c998faf56eef0f0db8704f648e9d`
>
> **Production deployment:** Vercel `dpl_6TEqXQJ9NbH2MYT2fpC1mmgRgNbn` — READY, target `production`, exact merge SHA `372d449e8e37c998faf56eef0f0db8704f648e9d`.
>
> **Production smoke:** PASS — live `/studio` switched Code → Visual and rendered the Phase-3 Visual Workspace with Layers, Transform Inspector, History, zoom/reset/fit controls, Select/Pan tools, Project menu and viewport.

Completed Phase-3 scope:

- viewport zoom in/out, 100%, reset and fit-to-viewport;
- mouse pan, wheel/trackpad pan, modifier-wheel zoom and two-touch pinch zoom;
- click, shift-additive, marquee, keyboard traversal and Alt overlap-cycle selection;
- drag, eight-handle resize, aspect-ratio modifier and rotation with 15° modifier snapping;
- numeric transform inspector with grouped history commits;
- snapping to canvas, object and grid candidates with ephemeral editor-only guides;
- semantic nested layer tree with collapse/expand;
- visibility and editor-only lock state;
- inline/inspector rename;
- sibling drag reorder plus forward/backward/front/back stacking operations;
- duplicate/delete;
- internal copy/cut/paste clipboard;
- semantic group/ungroup with hierarchy preservation;
- multi-select align/distribute;
- bounded undo/redo command history with one command per drag/resize/rotate/property edit;
- dirty/clean save-state detection;
- keyboard shortcuts for undo/redo, clipboard, duplicate, delete, group/ungroup, nudge and selection traversal;
- validation of persisted transforms and editor selection references;
- generic placeholder proof with no runtime-specific Phase-3 editor infrastructure leakage.

Phase-3 proof evidence:

- dedicated Studio Visual Phase Gate `35623534882`: PASS;
- PR #79 merged to `main` as `372d449e8e37c998faf56eef0f0db8704f648e9d`;
- exact merge SHA deployed to Vercel production and reported READY;
- live Visual Workspace smoke: PASS.


## PRE-4 implementation record — STUDIO-VISUAL-PRE-4

> **Status:** MAIN MERGED — PRODUCTION VERIFICATION DEFERRED
>
> **Work branch:** `studio-visual/pre4-shell-rebuild`
>
> **PR:** #80
>
> **Green Studio Visual push gate:** GitHub Actions `35632663379`
>
> **Green Studio Visual PR gate:** GitHub Actions `35632667933`
>
> **Main integration:** `b530d0a8f18290ac3f9081744153c9aae58a9dfe`
>
> **Production deployment:** DEFERRED — Vercel reported deployment rate limiting / exhausted usage. This is an infrastructure quota constraint, not a PRE-4 implementation failure.
>
> **Browser proof:** PASS — typecheck, production build, dual-mode browser regression, responsive 1440×900 evidence capture and Code ↔ Visual session preservation all passed on the PRE-4 head before merge.

Completed PRE-4 scope:

- reference-aligned Apexify Studio product shell;
- Apexify Studio branding and permanent Code / Visual switch;
- Run / Preview / Generate Code / Export top-bar architecture;
- permanent feature rail for Canvas, Images, Text, Charts, Shapes, Paths, Layers, Components, Assets, GIF, Audio and Video;
- polished Layers/context panel architecture;
- centered scale-aware viewport and artboard;
- compact device, zoom, select, pan, fit and reset controls;
- permanent Style / Transform / Effects / Data / Advanced inspector architecture;
- editable Code / Diagnostics / Assets / History bottom dock;
- real shared asset shelf reuse;
- runtime preview surface reuse;
- Phase-3 editor behavior preserved;
- constrained-width responsive behavior;
- PRE-4 contract tests and browser screenshot evidence.

### PRE-4 linked-code follow-up

> **Status:** MAIN MERGED
>
> **PR:** #82
>
> **Main integration:** `fa46e0affb139ad962a17af2338f5bbf24661f40`
>
> **Green Studio Visual gate:** GitHub Actions `35644690224`
>
> **Production deployment:** still deferred because Vercel usage is rate-limited.

Follow-up behavior now established:

- bottom Preview tab removed;
- bottom Canvas Output pane removed;
- bottom Code surface is editable through the shared lazy CodeMirror editor;
- code autosaves locally;
- Visual changes regenerate linked code automatically;
- safe Code → Visual reconciliation is active for the compiler contract currently owned by Studio: document `createCanvas({ width, height })`;
- unsupported/dynamic reverse-sync edits surface an explicit sync error instead of silently diverging;
- top Preview opens a closable clean output modal with pan, zoom, reset, canvas rename and artifact download;
- top Generate Code opens a closable syntax-highlighted code modal with copy, filename editing and source download;
- Export retains the explicit Open in Code Studio handoff;
- Canvas inspector exposes name, width and height as the first proven two-way linked visual properties;
- reverse reconciliation does not use `eval` or `new Function`.

The linked-code architecture is intentionally capability-bounded. Each future feature phase extends the reverse reconciler only when that feature owns deterministic lowering and parsing semantics.

### Required next gate

Before STUDIO-VISUAL-4 begins, perform the mandatory post-PRE-4 roadmap re-audit and remap Phases 4–18 to the permanent shell surfaces now established.

## Phase 4 implementation record — STUDIO-VISUAL-4

> **Status:** MAIN MERGED — PRODUCTION VERIFICATION DEFERRED
>
> **Work branch:** `studio-visual/v04-canvas-authoring`
>
> **PR:** #83
>
> **Verified PR head:** `85b4a622d6880509cc1755be72ae60a4f3f92648`
>
> **Green Studio Visual gate:** GitHub Actions `35654406532`
>
> **Main integration:** `7c33de0eae60a6ed7a12fb41b942610eaf702498`
>
> **Production deployment:** DEFERRED — Vercel usage is currently rate-limited. This is an infrastructure quota constraint, not a Phase 4 implementation failure.

Completed Phase-4 scope:

- modeled the pinned Apexify `CanvasConfig` contract in Visual Project state;
- deterministic normalization, validation and lowering of Canvas configuration;
- canonical `createCanvas()` generation for dimensions and declaration-backed Canvas options;
- safe literal `createCanvas({...})` reverse reconciliation without `eval` / `new Function`;
- **Style** Inspector authoring for canvas name, primary background, gradients/stops, custom image background, opacity, radius, stroke and shadow;
- **Transform** Inspector authoring for width/height, x/y, rotation and internal zoom;
- **Effects** Inspector authoring for blur, blend mode, procedural pattern, noise and ordered background layers;
- **Advanced** Inspector authoring for custom background filters, validated complete `CanvasConfig` JSON, video-background declaration options and advanced border geometry;
- complete declaration-level escape hatch so deep supported fields remain authorable without bloating the primary Inspector;
- browser artboard reflects basic color/gradient/transparent/radius/opacity changes immediately;
- browser Preview does not pretend to support Node-only video-frame extraction; generated code remains exact and the limitation is surfaced explicitly;
- Visual Inspector edits update the linked CodeMirror code automatically;
- canonical literal Canvas code edits reconcile back into Visual canvas state;
- runtime equivalence proof compares operation-plan output and generated-code output using the real pinned ApexPainter runtime;
- browser proof changes background color and width through the Inspector and verifies the live linked code updates;
- Phase-3 / PRE-4 shell and linked-code regression contracts remain green.

### Phase 4 proof

```text
Visual Canvas state
→ deterministic Studio operation plan
→ canonical createCanvas() source
→ real ApexPainter execution
→ equivalent artifact

Inspector edit
→ Visual Project mutation
→ live generated code update

canonical literal createCanvas() edit
→ safe parser/reconciler
→ Visual Canvas mutation
```

Production verification remains deferred until an exact Phase-6 main production deployment is available.

---

## Phase 5 implementation record — STUDIO-VISUAL-5

> **Status:** MAIN MERGED — PRODUCTION VERIFICATION DEFERRED
>
> **Work branch:** `studio-visual/v05-images-shapes-assets`
>
> **PR:** #84
>
> **Verified PR head:** `d37fa656c7aedbd546af9feb9a881a3a62fc2138`
>
> **Green Studio Visual gate:** GitHub Actions `35657277254`
>
> **Main integration:** `b3aa8683345f48687cddc4e54077bdfd3f13226d`
>
> **Production deployment:** DEFERRED — no READY production deployment exists for the exact Phase 5 merge commit yet; the latest observed READY production deployment is still pre-Phase-4 main.

Completed Phase-5 scope:

- modeled pinned Apexify `ImageProperties`, `ShapeProperties`, `CreateImageOptions` and group-transform contracts;
- mechanically classified every current image/shape/createImage field into Transform / Style / Effects / Data / Advanced plus an explicit reverse-sync policy;
- activated permanent **Images**, **Shapes** and **Assets** feature-rail surfaces;
- contextual left panel now provides URL insertion, image-asset insertion, all built-in Apexify shapes and shared asset access;
- drag/drop image files on the artboard flow through the shared persistent Studio asset store;
- Studio image assets retain stable `studio://asset/...` source identity in canonical code;
- Asset Shelf and compact Assets pane can insert images directly into Visual mode;
- image replacement from existing Studio assets is available from the **Data** Inspector;
- generated-buffer source authoring supports the document canvas and only earlier semantic image/shape outputs, preventing forward-reference generation;
- **Style** Inspector covers image fit/alignment/inherit, shape type/fill/color, radius, stroke and box background;
- **Transform** retains generic x/y/width/height/rotation/opacity editing and direct-manipulation handles;
- **Effects** Inspector covers blur, blend mode, filter stack/order/intensity, shadow and mask;
- **Data** Inspector owns source identity, asset replacement and generated-buffer bindings;
- **Advanced** exposes a validated declaration-level editor for clipPath, distortion, meshWarp, advanced effects, gradients, masks, stroke/shadow/boxBackground and `CreateImageOptions.groupTransform`;
- semantic image/shape nodes lower into ordered `createImage()` operations;
- generated-buffer references emit real earlier result identifiers rather than editor-only placeholders;
- canonical `createImage()` source safely reconciles back into image/shape Visual nodes without `eval` / `new Function`;
- existing legacy Visual asset references remain compatible and resolve to their URI during code generation;
- the artboard displays an authoritative debounced `@apexify/web` render frame beneath selection/transform overlays;
- real ApexPainter operation-plan execution and generated-code execution produce equivalent Phase-5 shape artifacts;
- desktop browser proof inserts a built-in Rectangle from the Shapes context, verifies live `createImage()` code, and waits for the authoritative Apexify frame;
- mobile/desktop shell, modal, Code Studio round-trip and prior phase regressions remain green.

### Phase 5 proof

```text
Image / Shape / Asset authoring
→ semantic Visual nodes
→ ordered Studio operation plan
→ canonical createImage() calls
→ real ApexPainter execution
→ equivalent artifact

Visual edit
→ linked createImage() source update

canonical literal createImage() edit
→ safe parser/reconciler
→ Image / Shape Visual state update

Studio image asset
→ stable studio://asset/<id> source
→ browser Preview + generated code
```

Production verification remains deferred until an exact Phase 5 main deployment is available.

---

## Phase 6 implementation record — STUDIO-VISUAL-6

> **Status:** MAIN MERGED — PRODUCTION VERIFICATION DEFERRED
>
> **Work branch:** `studio-visual/v06-text-fonts`
>
> **PR:** #85
>
> **Verified implementation head:** `426b86342f9a4da7ff1251a28815c240e53c9273`
>
> **Green Studio Visual gate:** GitHub Actions `35662040413`
>
> **Main integration:** `123d0bea6a324acb1a715d45d0f2faa70a500b05`
>
> **Apexify.js runtime integration:** PR #33 merged as `fb48f08ed8fc3d48628d8a93b15fe5d94b69bfbb`
>
> **Production deployment:** DEFERRED — no exact Phase-6 main production deployment is available. The latest Phase-6 branch deployment observed (`dpl_9vzrordcDAz2wVM7a3no3R872SDq`) was intentionally canceled by the Vercel ignored-build-step policy, so it is not production evidence.

Completed Phase-6 scope:

- modeled the pinned Apexify `TextProperties` contract, including modern nested `font`, `decorations`, `effects`, `layout`, `placement`, `fill`, `stroke`, `textOnCurve`, measurement options and legacy aliases;
- mechanically classified every pinned text property into its permanent Inspector surface and reverse-sync policy;
- activated the permanent **Text** feature-rail entry and contextual text/font panel;
- added semantic text insertion with stable Visual node identity;
- added safe double-click inline canvas text editing with one history transaction per edit;
- added typography controls for family, size, line height, letter/word spacing, bold, italic, alignment and baseline;
- added wrapping/max-width/max-height controls linked to transform geometry;
- added fill color/opacity, underline, overline, strikethrough and text stroke controls;
- added shadow, glow, highlight and curved-text authoring;
- added system-font selection and uploaded font assets through the existing shared Assets/Fonts surfaces;
- preserved uploaded font identity with stable `studio://asset/<id>` references in Visual state and canonical generated source;
- added contextual text metrics and measurement configuration;
- added a validated complete `TextProperties` Advanced escape hatch;
- extended the Studio operation plan with ordered `create-text` operations;
- generated deterministic canonical `createText()` source and preserved mixed image/shape/text composition order;
- extended safe Code → Visual reconciliation to canonical `createText()` calls without `eval` / `new Function`;
- allowed earlier text output to remain a valid generated buffer source for later composition operations;
- upgraded the authoritative `@apexify/web` Studio text renderer to consume modern nested TextProperties rather than relying on legacy flat aliases;
- pinned the documentation Studio to the merged Apexify Web runtime snapshot from `fb48f08ed8fc3d48628d8a93b15fe5d94b69bfbb`;
- proved real ApexPainter operation-plan execution and generated-code execution produce equivalent Phase-6 text artifacts;
- proved `measureText()` returns real width/height/line and character-metric data for the Phase-6 representative project;
- desktop browser proof inserts Text, generates live `createText()` code, edits text inline on the artboard and verifies the linked source changes automatically;
- mobile/desktop shell, Preview/Generate Code modals, Code Studio round-trip and all prior Visual phase regressions remain green.

### Phase 6 proof

```text
Text / Font authoring
→ semantic Visual text node
→ ordered Studio operation plan
→ canonical createText() source
→ real ApexPainter execution
→ equivalent artifact

Visual text edit
→ linked createText() source update

canonical literal createText() edit
→ safe parser/reconciler
→ Text Visual state update

uploaded font asset
→ stable studio://asset/<id> identity
→ registered browser font family
→ authoritative @apexify/web preview
```

Production verification remains deferred until Vercel usage is available again.


---

## Phase 7 implementation record — STUDIO-VISUAL-7

> **Status:** MAIN MERGED — PRODUCTION VERIFICATION DEFERRED
>
> **Work branch:** `studio-visual/v07-path-pixels-detect`
>
> **PR:** #86
>
> **Verified final implementation head:** `2a7f63f050e58a5f252f086cc6d4e19c4f7f711e`
>
> **Green Studio Visual gate:** GitHub Actions `35721981002`
>
> **Green Documentation Runtime Build Gate:** GitHub Actions `35721981107`
>
> **Main integration:** `f331de671c14e8dadc0167fe8c4532c22ba54c8f`
>
> **Apexify.js Phase-7 runtime:** PR #34 merged as `a216c54cd86583ba62c640574bf059e0fdeaff4e`; follow-up PR #35 merged as `c1f96c7d170e51de2b9cd816dc80d2341c01f32e`; final pivot-translation parity PR #36 merged as `45b9381c07b70bb16be456406940858af8ab699a`.
>
> **Pinned `@apexify/web` snapshot:** exact runtime commit `45b9381c07b70bb16be456406940858af8ab699a`; `src/studio-preview.ts` blob `308331b6c2b9eb769c9114794824664fe881fa81`.
>
> **Production deployment:** DEFERRED — exact feature-merge Vercel status for `f331de671c14e8dadc0167fe8c4532c22ba54c8f` was still pending when this closure record was written, so no production smoke is claimed.

Completed Phase-7 scope:

- activated the permanent **Paths** authoring rail and contextual path/pixel tooling;
- added line, polyline, cubic Bézier, generic path and connector insertion;
- added freehand/doodle authoring with pointer capture;
- added direct editor-only canvas anchor and Bézier control-point handles;
- added correct local ↔ document coordinate mapping for translation, rotation, scale and pivot/origin transforms;
- added Path2D command authoring and exact canonical `.path2d.create()` / `.path2d.draw()` code generation;
- added custom connector generation through `.path2d.custom()`, including arrows, markers, dash, caps, joins and connector transform geometry;
- added fill, stroke, opacity, fill-rule, shadow and advanced path JSON controls;
- added pixel manipulation, pixel set, pixel color inspection and pixel-data sampling;
- added path hit detection, region hit detection, any-region detection and distance detection;
- routed structured Phase-7 results into the existing **Diagnostics** surface rather than introducing a competing permanent Results dock;
- added explicit reverse-sync classifications for every canonical Phase-7 path/pixel/detection operation;
- preserved mixed pixel mutation/detection chronology deterministically;
- preserved path-resource identity across duplicate path definitions and detection references;
- preserved primitive path bounds and transform pivots during Code → Visual reconciliation;
- rejected malformed connector payloads, dangling/hidden path probes and noncanonical branched pixel-buffer bases rather than silently changing semantics;
- pruned dependent path-detection operations when a target path is deleted or hidden through normal Visual editing;
- added runtime/browser support for path rendering, custom connectors, pixel operations and structured detection results;
- aligned native Apexify Path2D and `@apexify/web` transform semantics so `translateX`/`translateY` work together with `originX`/`originY`;
- pinned the Documentation Studio to the final merged Phase-7 `@apexify/web` snapshot;
- added desktop/mobile browser proof that inserts a Bézier path, drags a real control point, mutates canonical linked source, executes pixel operations, returns structured results and preserves the authoritative Apexify frame;
- preserved Code → Visual → Code sync boundaries without `eval` / `new Function`;
- kept editor-only path handles/guides out of generated code.

### Phase 7 proof

```text
Path / doodle authoring
→ semantic Visual path/freehand nodes
→ ordered Studio operation plan
→ canonical path2d.create / path2d.draw / path2d.custom
→ real Apexify runtime + @apexify/web preview

Direct canvas point edit
→ local path command mutation
→ one history transaction
→ linked generated Apexify source update
→ authoritative preview remains live

Pixel mutation / inspection / detection
→ ordered Visual operations
→ canonical pixels.* / detect.* source
→ structured Diagnostics results
→ reverse-sync with canonical linear-buffer guarantees
```

Production verification remains deferred until the exact Phase-7 main feature merge has a confirmed production deployment and live `/studio` smoke.


---

Allowed phase statuses:

```text
NOT STARTED
ACTIVE
LOCAL GREEN
CI GREEN
MAIN MERGED
PRODUCTION VERIFIED
BLOCKED
```

---

# 45. Decision log

This section is updated whenever a nontrivial architecture decision changes.

## D-001 — Visual mode is structured authoring, not pixel-to-code AI

**Decision:** Preview → Code means code generation from semantic Visual Project state.

**Reason:** deterministic, editable, feature-complete and testable.

## D-002 — No editor-only shadow renderer

**Decision:** user artwork/media is rendered using real Apexify paths.

**Reason:** prevents preview/code/runtime drift.

## D-003 — Single-file generated code is default

**Decision:** one clean file unless a real project reason requires splitting.

**Reason:** generated code must be understandable and usable.

## D-004 — Linked code-to-visual is compiler-contract bounded

**Decision:** Code Studio remains arbitrary-code capable. Visual Studio keeps its generated source linked bidirectionally only for semantics owned by the current Visual compiler/reconciler. Unsupported or non-deterministic code edits must report a sync error rather than silently mutating or forking the scene.

**Reason:** deterministic generated contracts can be round-tripped safely, while arbitrary imperative programs still cannot be reliably inverted into a visual scene graph.

## D-005 — Vercel is release verification, not development test infrastructure

**Decision:** local/Docker/GitHub Actions catch runtime errors before main.

**Reason:** preserve deployment quota and reduce debugging latency.

---

# 46. Open questions to resolve during STUDIO-VISUAL-0

These questions must be answered before their dependent phase begins:

1. Exact `VisualProject` schema naming and versioning strategy.
2. Exact compatibility boundary between current Apexify 6.x operation plan and future ARS.
3. Whether canvas groups lower to sequential operations or scenes by default.
4. Exact code formatting engine used in browser vs build/test environment.
5. Export asset path convention.
6. Vercel branch ignored-build rule for `studio-visual/*`.
7. Exact threshold/policy for optional project code splitting.
8. RESOLVED — generated Visual code remains linked while edits stay within deterministic reconciler-owned semantics; unsupported edits remain in the editor but report a sync error until corrected or explicitly opened in Code Studio.
9. Which future animation controls remain hidden until the corresponding package API becomes current/stable.
10. Plugin-provided Visual Studio control-extension API.

No question above blocks creation of this master plan.

---

# 47. Program completion definition

The Visual Studio program is complete only when all of the following are true:

- Code mode remains fully functional.
- User can switch to Visual mode.
- User can build a composition without writing code.
- User can manage layers, visibility, order and transforms.
- User can drag, resize and rotate supported objects.
- User can use assets from uploads and supported URLs.
- Canvas options are complete.
- Image/shape options are complete.
- Text/font options are complete.
- Chart families/options are complete.
- Path/doodle features are complete.
- Pixel/detection operations are represented.
- Scene/component/template/named-asset systems are represented.
- Image utility operations are represented.
- GIF/animation authoring works.
- Audio authoring works.
- Video authoring works.
- Advanced batch/chain/output/plugin capabilities are classified and represented where authorable.
- Every current public Studio-relevant Apexify capability is classified.
- Every visual capability has a control/model mapping.
- Every visual capability has generated-code mapping.
- Every visual capability has a real preview/runtime route.
- Generated code is clean and readable.
- Generated code defaults to one file.
- Generated code produces the same authoritative result as the visual project for representative proof projects.
- Local/Linux CI catches native/media failures before production.
- No phase requires repeated Vercel deployments to discover runtime errors.
- Final completeness matrix is green.
- Final release gate is green.

Only then can Visual Studio be called feature-complete.

---

# 48. Immediate next action

Do **not** start by coding image tools or a canvas toolbar.

Start with **STUDIO-VISUAL-0**:

```text
1. freeze current Apexify capability inventory;
2. create Visual Capability Matrix schema;
3. classify all current public capabilities;
4. define VisualProject v1 schema;
5. define compiler/codegen contracts;
6. create isolated branch/CI workflow;
7. ensure Visual branches do not trigger wasteful Vercel previews;
8. update this plan with the completed architecture decisions;
9. run local/CI gate;
10. only then merge Phase 0 to main.
```

That gives every later phase a measurable definition of “complete” and prevents Visual Studio from becoming a large collection of disconnected UI controls.

---

# 49. STUDIO-VISUAL-0 implementation record

> **Status:** COMPLETE
>
> **Work branch:** `studio-visual/v00-contract`
>
> **Baseline main commit:** `ce4f329c82bf8e8536b85724eb04402fb32d55d0`

Phase-0 architecture decisions are recorded in `STUDIO_VISUAL_DECISIONS.md`.

The binding Phase-0 execution contract is recorded in `STUDIO_VISUAL_CONTRACT.md`.

The Visual capability inventory is generated from the existing declaration-driven Studio capability evidence into:

```text
generated/studio/visual-capability-matrix.json
```

Phase 0 is not complete until the Visual capability generator is deterministic, zero current public Studio capabilities remain unclassified, the schema/decision/CI contracts are committed, and the branch gate passes.


## 49.1 Phase 0 completion evidence

- [x] master plan committed as source of truth;
- [x] Visual Studio terminology fixed;
- [x] Code/Visual mode contract fixed;
- [x] declaration-driven Visual Capability Matrix generator implemented;
- [x] all 187 current Studio-relevant public capabilities classified;
- [x] DOC-4 public option inventory coverage enforced with 17,233 option paths and zero unclassified paths at the Phase-0 gate;
- [x] `.apexstudio.json` / `VisualProject` v1 schema committed;
- [x] Studio Operation Plan / preview / code-generation contracts defined;
- [x] all ten Phase-0 architecture questions resolved in `STUDIO_VISUAL_DECISIONS.md`;
- [x] `studio-visual/*` Vercel ignore behavior implemented and regression-tested;
- [x] dedicated `studio-visual-check.yml` CI gate implemented;
- [x] declaration parser hardened against JSDoc braces/quotes and compiler indentation changes without changing the committed 187-capability evidence;
- [x] base Studio capability regeneration is deterministic;
- [x] Visual capability generation/check is deterministic;
- [x] Visual contract tests pass;
- [x] TypeScript typecheck passes;
- [x] GitHub Actions **Studio Visual Phase Gate** run `35580198765` passed.

Phase 0 is therefore complete. The next implementation phase is **STUDIO-VISUAL-1 — Dual-mode Studio shell**.
