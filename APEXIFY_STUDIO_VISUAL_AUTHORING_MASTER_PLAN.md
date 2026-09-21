# Apexify Studio — Visual Authoring / Preview → Code Master Plan

> **Program ID:** `STUDIO-VISUAL`
>
> **Status:** ACTIVE MASTER PLAN — STUDIO-VISUAL-0 COMPLETE; STUDIO-VISUAL-1 NEXT
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

## STUDIO-VISUAL-4 — Canvas and background authoring

### Objective

First complete end-to-end Apexify visual domain.

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

### Codegen proof

Visual project → clean `createCanvas()` call.

### Runtime proof

Generated code and visual preview produce equivalent output.

### Main integration

```text
feat(studio-visual): complete canvas authoring
```

---

## STUDIO-VISUAL-5 — Assets, images and shapes

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

### Gate

Every current `ImageProperties` / `CreateImageOptions` field classified.

### Main integration

```text
feat(studio-visual): complete image and shape authoring
```

---

## STUDIO-VISUAL-6 — Text and font authoring

### Deliverables

- text insertion/editing;
- all public text option controls;
- uploaded fonts;
- family registry;
- measurement panel;
- wrapping/layout controls;
- generated `createText()` code.

### Main integration

```text
feat(studio-visual): complete text and font authoring
```

---

## STUDIO-VISUAL-7 — Path, doodle, pixels and detection

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

### Main integration

```text
feat(studio-visual): complete path doodle and pixel tools
```

---

## STUDIO-VISUAL-8 — Charts

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

### Main integration

```text
feat(studio-visual): complete chart authoring
```

---

## STUDIO-VISUAL-9 — Scenes, nested surfaces, components, templates and named assets

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

### Main integration

```text
feat(studio-visual): complete scene component template authoring
```

---

## STUDIO-VISUAL-10 — Image utility / effect stack

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

### Main integration

```text
feat(studio-visual): complete image manipulation stack
```

---

## STUDIO-VISUAL-11 — GIF and animation timeline

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

### Local/CI requirement

Linux GIF smoke test before `main`.

### Main integration

```text
feat(studio-visual): complete GIF and animation authoring
```

---

## STUDIO-VISUAL-12 — Audio authoring

### Deliverables

- preset browser;
- synth/custom controls;
- ADSR/filter/pan/modulation/noise;
- sequence editor;
- composition timeline;
- mix controls;
- waveform/player;
- generated procedural audio code.

### Local/CI requirement

Linux audio smoke suite.

### Main integration

```text
feat(studio-visual): complete audio authoring
```

---

## STUDIO-VISUAL-13 — Video editor

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

### Local/CI requirement

The existing Linux Studio video smoke infrastructure becomes mandatory and expands to cover Visual Video generated code.

No Vercel debugging.

### Main integration

```text
feat(studio-visual): complete video timeline authoring
```

---

## STUDIO-VISUAL-14 — Advanced operations, batch/chain/plugins/output

### Deliverables

- Operations panel;
- batch editor;
- chain editor;
- compatible plugin configuration;
- output conversion options;
- structured results;
- generated advanced Apexify code;
- explicit hosted-runtime exclusions.

### Main integration

```text
feat(studio-visual): complete advanced operation authoring
```

---

## STUDIO-VISUAL-15 — Export, round-trip project bundles and code quality

### Deliverables

- Copy Code;
- Download `.ts`;
- one-file default;
- optional project export;
- asset export strategies;
- `.apexstudio.json`;
- Visual → Code linked-buffer workflow;
- formatting/linting;
- deterministic snapshots;
- optional generated-code provenance metadata that does not pollute normal code.

### Main integration

```text
feat(studio-visual): complete code and project export
```

---

## STUDIO-VISUAL-16 — Full feature completeness gate

### Objective

Prove “all Apexify features are represented” mechanically.

### Deliverables

- declaration/API-driven inventory;
- option-family inventory;
- visual capability matrix;
- zero unclassified capabilities;
- zero visual capabilities without codegen;
- zero visual capabilities without preview route;
- zero option families lacking controls/advanced schema;
- representative proof projects;
- generated report.

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
- error recovery;
- corrupt-project handling;
- migrations;
- autosave;
- crash isolation;
- performance budgets;
- accessibility audit;
- browser matrix.

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

For each representative project:

```text
Visual Project
→ generated Apexify code
→ execute generated code
→ artifact
→ compare with Visual Studio authoritative artifact
```

The release gate fails on semantic divergence.

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
| 1 | Dual-mode shell | CI GREEN | pending merge | Branch gate `35584036125` |
| 2 | Project model / codegen core | NOT STARTED | — | — |
| 3 | Viewport / layers / transforms / history | NOT STARTED | — | — |
| 4 | Canvas | NOT STARTED | — | — |
| 5 | Images / shapes / assets | NOT STARTED | — | — |
| 6 | Text / fonts | NOT STARTED | — | — |
| 7 | Paths / doodle / pixels / detect | NOT STARTED | — | — |
| 8 | Charts | NOT STARTED | — | — |
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

## STUDIO-VISUAL-1 implementation record

> **Status:** CI GREEN
>
> **Work branch:** `studio-visual/v01-shell`
>
> **Branch gate:** GitHub Actions run `35584036125` — PASS

Delivered:

- top-level Code / Visual mode switch;
- shared session provider for assets, output artifacts, diagnostics, and history;
- Code Studio kept mounted so mode switching does not destroy its working session;
- lazy-loaded Visual Studio;
- responsive empty Visual workspace;
- accessible tab/panel relationships for the mode selector;
- desktop and mobile browser regression proving Code → Visual → Code round-trip without source mutation;
- existing Code Studio runtime planner/execution path retained.

Phase 1 intentionally adds no drawing, selection, transform, or domain-specific visual authoring.

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

## D-004 — Arbitrary code-to-visual is not promised in this program

**Decision:** Code Studio remains arbitrary-code capable; Visual Studio guarantees Visual → Code and generated-project round trip.

**Reason:** arbitrary imperative programs cannot reliably be inverted into a visual scene graph.

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
8. Whether a user can manually edit generated code while remaining linked to Visual mode, or editing automatically forks into Code mode.
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
