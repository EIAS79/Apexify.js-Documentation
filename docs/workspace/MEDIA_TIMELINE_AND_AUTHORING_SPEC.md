# Workspace — Visual, Code, Graph and Media Editing Contract

**Program: AWP. Priority: P0 / HIGHEST. Revision: 2026-10-19 media-authoring clarification. Status: PLANNED; not implemented acceptance.**

This specification makes the owner's required image/text/filter/layer/doodle/line/style/template/frame/GIF/animation/video/audio workflows explicit. It extends the A–Z master plan without replacing the accepted UI or adding a separate Studio-based application.

## 1. The product being built

A shared creative workspace with a serious timeline editor for time-based work, using familiar editing concepts from tools such as CapCut. The comparison describes editing ergonomics, not a promise to clone every feature or copy another product's design.

Users can work in Visual, Code and Graph. Each view edits the same supported semantic document, with one selection context, time controller, command/history system, asset registry and compiler. Advanced editor helpers are clearly separated from actual Apexify APIs and upstream engine capabilities.

| Workflow | Main editing unit | Required views | Typical output |
| --- | --- | --- | --- |
| Image / composition | Layers, geometry, text, effects and styles | Visual canvas + inspector, valid Apexify source, composition graph | PNG/JPEG/WebP and editable project |
| Frame sequence / GIF | Ordered frame definitions and exposure durations | Frame Collection + canvas + timeline + source + frame/encode graph | Ordered image sequence, GIF, reusable sequence |
| Animation | Time-varying properties, layers and keyframes | Canvas + keyframe timeline + source + temporal graph | Live playback, sampled frames, GIF/video |
| Video | Clips/tracks, source ranges, overlays, transitions and sound | Preview/canvas + multitrack timeline + source + media graph | Supported encoded video plus project/source |
| Audio | Clips/events/oscillators/envelopes at precise times | Waveform + audio tracks + property editors + source + audio graph | WAV and mixed audio/video |

Audio authoring is time/sample-based. It must not be forced onto video-frame boundaries. GIF, animation and video offer frame-accurate editing, but video can also use imported clips; users should not be required to paint every frame manually.

## 2. UI and panel arrangement

Keep the approved dark surfaces, compact controls and neon accent system. Reuse the existing docking surface and permanent Panels menu.

- Visual Canvas/Preview remain the central spatial editing surfaces. Code and Graph remain connected windows.
- Add independently closable/reopenable/resizable **Timeline** and **Frame Collection / Media Bin** windows for media work. They can occupy/reclaim available lower-workspace space; their presence must not require navigating to another route or rebuilding the entire shell.
- The media bin presents sources, frame collections, nested compositions, thumbnails, probe metadata and asset usage. Frame Collection presents ordered frames and per-frame durations; these may share a window with distinct tabs.
- The inspector follows the explicit selected target: document, layer, stroke, frame, clip, keyframe, track, effect or style. Show both spatial and temporal properties where applicable.
- Transport controls provide play/pause/stop, previous/next frame, timecode/frame index, loop/range and jump-to-selection. Provide an accessible transport action even when Timeline is hidden.
- Code editor, graph viewport, timeline zoom/scroll, frame selection, playhead, loop range, inspector target and waveform state survive panel closure and project reload according to the state/persistence contract.
- On narrow screens, use active-panel switching plus a compact transport. Preserve the desktop layout for restoration. Keyboard/touch alternatives must exist for dragging, trimming and drawing.
- Merely closing Timeline does not stop an export or lose a composition. Explicit stop/cancel controls govern playback/jobs; browser background/autoplay policies remain visible and respected.

The original nine panels are the merged baseline, not a permanent ceiling on production window types. Do not force new windows into the default static-image layout when they are unnecessary.

## 3. Canonical schema additions and ownership

The schema ADR defines exact types before code is written. Required semantic records include:

| Record | Required information |
| --- | --- |
| Project/Sequence | IDs, schema version, dimensions, rational timebase, optional nominal fps, duration policy, tracks, frame collections, referenced assets/styles and export presets |
| Track | Stable ID, kind, order/composition role, contained clip/event IDs, locked/export-enabled state, applicable gain/blend and declared overlap policy |
| Clip | Source ref/type, timeline in/out, source in/out, speed/reverse/time map, transforms/effects/opacity, linked media, instance overrides and keyframes |
| Frame definition | Stable ID, source/composition ref or independent scene snapshot, local overrides, exposure duration, order, provenance and shared/unlinked ownership |
| Stroke | Editable points/path commands, brush/style, optional raw pressure/time samples, transform and explicit layer/frame/clip scope |
| Keyframe | Stable target/property path, time, value/interpolator, easing and conflict policy |
| Audio event/clip | Preset/synth/WAV/source ref, start/sample offset, duration, gain/pan/fades/processing, seed and mix relationship |
| Shared style | Stable identity, typed color/gradient/pattern/font/stroke/effect values, reference/override policy and version |
| Selection context | Object IDs, composition/sequence ID, playhead, selected frame/clip and explicit edit scope |
| Artifact/proxy | Original asset hash, derived/proxy metadata, source/time mapping, quality and producing job/revision identity |

Store serializable scene/path/style/media data, never native Path2D/canvas/AudioContext/VideoFrame objects or transient object URLs in the persisted semantic project. User callbacks and arbitrary source remain in the separately isolated program boundary, not executable JSON values.

One command/transaction layer owns all edits. Timeline moves, frame duplication, graph reconnection, code application and inspector changes validate references and produce coherent undo/redo across views.

## 4. Time and synchronization semantics

Choose and document rational timebase and integer timestamp representation through B06/C06. Native source presentation timestamps and audio sample indices map to project time explicitly. Never accumulate rounded floating-point frame durations as the authoritative clock.

- Intervals use a documented half-open `[in, out)` boundary rule. Define the last-frame/sequence-end sampling exception explicitly; splitting must not duplicate or omit a boundary frame/sample.
- Preserve nominal frame-rate numerator/denominator, including rates such as 30000/1001. Do not round 29.97 to 30 without an explicit conversion.
- Frame collections may have unequal exposure durations. Distinguish collection index, project frame index/time and source frame/PTS; changing order or fps cannot silently relabel source provenance.
- Variable-frame-rate imports retain source timestamps. Thumbnail/proxy frame indices must map back to originals, not assume constant frame timing.
- Audio uses native sample positions and a resampling policy. Subframe audio edits, mixing and envelopes must not be quantized to video frames.
- GIF export quantizes to its supported 10 ms units. Preserve authored timing in the project, show effective encoded timing and use a documented deterministic quantization/error-distribution policy.
- Playback, scrubbing, frame stepping, random-access evaluation, graph execution and export share the same time/effect semantics. A late preview response must not replace the result for a newer playhead/revision.
- Monitor-only mute/solo and preview quality are view settings. Export-enabled/visible/audible state is semantic project data. Label the difference; do not accidentally export a monitor-only change.

## 5. Frame collections and independent frame editing

Frame collections are first-class, reusable project assets, not an anonymous array of PNG buffers inside a render job.

Required operations:

1. Create empty/blank frames, capture a composition snapshot, import a naturally ordered image sequence, split an imported GIF, or extract selected frames/ranges from video.
2. Insert, duplicate, remove, reorder, select ranges, rename, set per-frame exposure and apply a validated batch edit to a selected range.
3. Open any frame in the normal canvas and edit its background, images, text, styles, filters, layers, vector paths, doodles and transforms.
4. Show previous/next frame, frame index and time, thumbnail filmstrip, exposure duration and optional onion-skin overlays with opacity controls.
5. Support explicit **independent copy**, **linked composition instance** and **local override** relationships. Explain edits to shared content and offer unlink/make-unique before a change propagates unexpectedly.
6. Distinguish editing this frame, selected frames, a clip instance or a reusable source composition. Display the target/scope before committing; default to a specific selected target rather than silently changing the whole sequence.
7. Export a current frame, selected frame range, full image sequence with ordering/timing manifest, GIF or sampled video. ZIP is a packaging option, not a substitute for preserved frame/timing metadata.
8. Save/load and undo frame relationships and edits without duplicating large binary assets unnecessarily. Generate previews lazily under cache limits.

Imported raster/video frames are flattened source pixels. Their original text or shapes do not magically become editable layers. Add editable overlays/effects, or use an editable scene-backed frame; do not claim reverse reconstruction from pixels.

## 6. Doodles, lines and geometric drawing

Doodle drawing must be a real authoring tool in the canvas and selected frame, not a decorative icon or source-only path JSON box.

- Freehand pen with color, width, opacity, caps/joins and validated smoothing; optional supported brush/texture presets and stylus pressure. Record original samples and deterministic conversion policy.
- Touch/mouse/stylus capture with correct inverse pan/zoom/DPR/rotation coordinate mapping, pointer capture/cancel handling and keyboard alternatives for geometry editing.
- Persist strokes as editable path/layer records. If variable pressure needs outline geometry rather than the runtime's fixed-width stroke, implement and label that workspace helper; do not invent pressure support in an existing API.
- Support move/resize/rotate/recolor, point/control-handle edits, stroke selection/deletion, undo per stroke and a nondestructive eraser or clearly labeled object-erasure mode.
- Straight lines, polylines, quadratic/cubic curves and shape commands have real handles/numeric controls. Connector arrows, dashes, markers and textures use their verified option semantics.
- Graph wires express computation dependencies. Artwork lines/doodles are scene content. Connecting graph nodes must not create a rendered drawing stroke accidentally.
- Freehand and eraser edits respect the selected frame/clip/source scope. Linked frames do not all change unless the user intentionally edits the shared source.

Serialize PathCommand arrays and style/connector records. The reference filenames use helper names; generate public `painter.path2d.create/draw/custom`, not nonexistent root `createPath2D`, `drawPath` or `createCustom` methods. Display angle units correctly for native arc/ellipse radians versus arrow/transform degrees.

## 7. Flexible text, styles, layers and filters

Common controls must be visual and discoverable, with validated numeric/structured editors for precision. “Freely adjustable” means broad real controls and sensible limits; it does not mean accepting invalid parameters or promising unimplemented renderer behavior.

- Canvas backgrounds/layer stacks cover actual color/gradient/pattern/noise/image/still-video-frame variants, ordering, opacity/blending, inheritance, clipping, masks, stroke/shadow and transforms.
- Image/shape editing includes all verified shapes and filter unions, effect order/pre-post placement, distortion/mesh handles, border/clip/mask/group options and source replacements.
- Text covers preferred nested font/decorations/effects/layout/placement/fill/stroke/curve options, actual measurement, grouped transforms and legacy-import precedence. Timed titles/captions are also clip/layer content.
- A shared Style manager supports named colors, gradient stops/handles, patterns, typography, strokes/shadows and effect stacks with explicit link/copy/override behavior. Editing a linked style exposes affected targets; local overrides remain local.
- Style types consumed by different runtime APIs are not assumed identical. Translate supported fields explicitly, including `gradient` versus `GradientConfig`, units and pattern defaults.
- Filters/styles/transforms apply to a selected object/frame/clip/range with an explicit scope. Support keyframing only for properties/interpolators the evaluator can faithfully execute; otherwise declare discrete changes or unsupported animation.
- Template/component instances and scene hierarchy preserve source identities, bindings and local overrides. Their rendering uses actual public APIs and correct asset-reference resolution defaults.

## 8. Shared multitrack timeline

Use one timeline core with focused tools for Frame/GIF, Animation, Video and Audio workflows. Do not create four incompatible documents or clocks.

Required timeline interactions:

- Add/reorder/rename/lock/enable tracks and group related clips; select one/many clips or keyframes.
- Drag/insert/move/duplicate/delete clips, trim in/out, split at playhead, ripple-delete/close gaps, snap to boundaries/playhead/markers and adjust exact values numerically.
- Show and edit source offsets separately from project start/duration. Support verified speed/reverse mappings and preserve linked audio/video relationships when appropriate.
- Keyframe applicable transform/opacity/style/effect/audio properties with visible curves/easing where supported; cut/copy/paste and retime keyframes safely.
- Edit transitions/overlap where an actual runtime mapping exists. Define z/composition order, track overlap, audio summing, gaps/transparent/held frames and disabled-track behavior.
- Set work area/in-out, loop, scrub, frame-step, jump, zoom/fit and horizontal/vertical scrolling; keyboard shortcuts and numeric alternatives accompany drag actions.
- Show source thumbnails, frame filmstrips and real audio waveforms without decoding the entire project unboundedly. Cache/proxy generation is cancellable work with visible state.
- A central time controller owns preview scheduling; jobs render immutable timeline snapshots. Presets are starting points, not a fixed single-layer move form or a tiny hard-coded frame limit masquerading as an editor.

Filmstrips and property curves are separate representations. A manual sequence holds selected independent frames; interpolation generates time samples. Converting between them is an explicit bake/sample operation with editable source retained or a clear flattening decision.

## 9. Audio-specific editor

Provide actual multi-layer synth/preset/event and imported-audio clip workflows, not only a Play button and frequency field.

- Expose presets dynamically from the pinned API, oscillator/noise layers, ADSR, frequency sweeps, partials, vibrato/tremolo, filters, stereo pan, sample rate/channels, gain/limiter and seeds.
- Audio tracks support clipping/source offset, precise positioning, gain/fades/pan, mixing, duplicate/split/trim and meaningful selection; waveform comes from decoded actual source/output.
- For `sequence`, events map to real start times and preset/synth definitions. For `compose`/`mix`, preserve clip/source identity and the supported processing chain.
- `SynthComposeClip.speed` changes rate **and pitch** in the supplied audit. Do not label it pitch-preserving time stretch. Pitch/detune behavior differs for synth and raw WAV inputs; expose accurate capabilities.
- The supplied createAudio surface processes WAV. Other imported audio/container formats require an explicit supported decode/FFmpeg step before passing PCM/WAV to synthesis/composition APIs.
- Browser WebAudio schedules/auditions preview with autoplay permissions and cleanup. It is not a claim that Node synthesis already provides a browser playback engine.
- Final video sound comes from the same semantic track mix with sample/time mapping, resampling and an audio/video sync tolerance defined by the release tests.

## 10. Public API and compiler mapping

| Authoring operation | Existing public-v6 execution route to verify | Extra application/upstream work |
| --- | --- | --- |
| Editable still/frame scene | createCanvas/createImage/createText, renderScene/SceneBuilder, components/templates | Semantic frames/layers, tools, references, undo, source/graph mappings |
| Doodle and geometry | path2d.draw/create with command arrays; scene path/customLines; path2d.custom | Pointer capture, smoothing/pressure conversion, handles, scope/history |
| Frame sequence generation | animate and/or deterministic public scene rendering per frame | Collection identity, exposure/order, renderer-capability mapping |
| GIF | createGIF normal frames or generated AsyncIterable; scene-to-GIF | Editable timeline, streaming jobs, timing quantization and metadata checks |
| Audio | createAudio synth/preset/sequence/compose/mix and save | Track/event/waveform UI, browser audition, safe decode and persistence |
| Video | createVideo, getVideoInfo/extract helpers, videoPipeline, scene-to-video | NLE clip/track/time compilation, proxy policy, jobs/isolation and deploy proof |
| Complex per-frame visual animation | Actual shared engine evaluator when available; otherwise a reviewed bounded compiler/evaluator using public rendering | First-party semantic ownership ADR; no duplicate incompatible engine or nonexistent API generation |
| Output | Public output/save APIs in isolated jobs plus browser-appropriate download packaging | Immutable manifests/assets/runtime metadata, expiry and completed downloads |

Do not invent `painter.createTimeline()` or assume every field of a `createVideo` dispatch object runs together. Complex ordered editing must use a verified pipeline or explicit sequence of operations. Generated source must contain runnable public API calls and any declared helper implementation/import with exact version and assets.

Callback hooks (`onDrawCustom`, GIF generators, custom resolvers, progress callbacks) are not JSON. Persist declarative equivalents when possible; preserve non-reversible code with isolation. Do not run arbitrary imported callbacks in the page or host renderer.

## 11. Visual, Code and Graph synchronization

Every supported content/frame/clip/stroke/track/keyframe/style has a stable semantic ID and source mapping.

- Canvas or inspector changes update the appropriate selected frame/clip and generated source/graph without changing unrelated targets.
- Timeline timing/order edits change the same sequence and its compiled program; graph views include temporal nodes/ports such as frames, clips, sample time, audio mix, sequence and encode sinks.
- Graph ports distinguish raster, scene, frame sequence, audio, video, numeric/property and timing values; validate units, duration, reference and cycle rules. Arbitrary graph wire order is not clip playback order.
- Supported source edits update visual/graph/timeline data transactionally. Unsupported user code stays preserved, runnable only under approved isolation, with explicit opaque regions.
- Editor graph positions and timeline zoom are view state; clip timing, paint order, frame exposures and export-enabled state are project semantics.
- Frame selection/playhead context is shared. A user can identify which scene, frame, clip, property and timestamp a code diagnostic or graph node refers to.

The canonical project drives these views. Do not keep independently editable unsynchronized media arrays in each panel.

## 12. Preview/export/persistence/resource rules

Preview is direct retained rendering for supported interactive operations. Lower-resolution proxies are explicitly marked and mapped to originals. Final export uses original source/declared quality, not an accidental thumbnail/proxy raster. Backend limitations and color/font/codec differences remain visible.

Seek/scrub cancels or invalidates older work by project revision and playhead. Bound decoded frame caches, waveforms, thumbnails, workers, native memory, temporary disk, progress logs and total export cost. Expensive collection imports/extractions/proxies are jobs under admission limits.

Persist frame/clip IDs, source mappings, per-frame edits, styles, keyframes, timing and linkage. Undo/redo covers cross-view operations atomically; saving/reopening retains the project and restores view context. Closing Timeline/Media Bin/Code/Graph cannot drop data or kill unrelated jobs.

Verify current-frame/selection/full-range exports and source/project/image-sequence packages. GIF rounding and variable-frame/source timing changes must be reflected in encoded metadata with a clear policy. No production acceptance is satisfied by a static render disguised as video, a simulated waveform or a claimed saved draft that cannot recover.

## 13. Reference limitations and runtime pin

The 14 newly supplied function documents audit runtime `cbeea053c2a973d4e867f8ca96e79546060dd62d`; the documentation package currently pins `379a5248f09ed39c1b1734fe104b6bd73a77857f`. This revision does not change that pin. A06/A07 must reconcile the exact installed runtime before claiming those options.

These are static source audits, not executed acceptance. See [FUNCTION_REFERENCE_MAPPING.md](FUNCTION_REFERENCE_MAPPING.md) for bindings, known caveats and missing reference sections. Reproduce reported runtime gaps before fixing upstream or changing support claims.

## 14. Acceptance scenarios

All scenarios below start NOT_RUN. They supplement domain tests; W06/W07 and G14/G15 require actual UI → canonical project → source/graph → runtime → artifact → recovery evidence.

| Case | Required end-to-end workflow | Pass evidence |
| --- | --- | --- |
| AC01 | Build a layered image with styled/curved text, gradient/pattern, shape/image, mask/filter and reused template/style | Actual preview/export and public source agree; edits and overrides round-trip |
| AC02 | Draw a freehand stroke, edit points/style, erase/undo; add a cubic curve and arrow connector | Path data and angle units correct; graph wires do not become artwork; no unsupported connector-shadow claim |
| AC03 | Create eight editable frames, duplicate/reorder, give unequal holds, edit text/doodle only on frame 3, then undo and export GIF/sequence | Unlinked frames unchanged; linked-source behavior explicit; ordering/quantized timing/artifacts/manifests correct |
| AC04 | Import an image sequence/GIF and extract selected video frames including variable timestamps | Stable provenance, dimensions, ordering and source PTS maintained through proxy/sample/export |
| AC05 | Animate multiple layers/properties with keyframes/easing; seek arbitrary times and compare with export | Same sample semantics and final states; no stale seek result wins; no fixed demo-only animation form |
| AC06 | Edit a video sequence with two source clips, timed text/doodle/image overlays, a range effect/transition and two sound tracks; split/trim/move/ripple | Source vs project time correct, real exported picture/audio/timing, supported operations compile in actual order |
| AC07 | Create an audio-only multitrack project from preset, custom synth and imported WAV; trim/fade/pan/mix and export | Real waveforms, PCM/sample timing/gain, preserved seeds and accurate speed/pitch behavior |
| AC08 | Change a frame/clip/style/keyframe from each of Visual, supported Code and Graph | Same stable IDs/target/scope across all views; unrelated content unchanged; opaque code preserved |
| AC09 | Hide/reopen Timeline, Media Bin, Code and Graph; close all panels; reload and undo | Content/jobs/selection/playhead/view context restored per contract; no hidden state reset |
| AC10 | Cancel seek/import/proxy/export; test invalid time ranges, huge frame collection, corrupt audio/video and storage exhaustion | No false completion, data loss, runaway jobs or orphaned caches/files/processes |
| AC11 | Preview with a proxy, export current/selected/full ranges and download source/project/media | Original-quality final settings, actual signatures/probes and completed portable downloads on supported browsers |
| AC12 | Run reference-to-runtime audit and declared-gap tests before certification | Exact pin reconciled; callbacks isolated, return types/units/defaults/dispatch correct, no unsupported API or ignored field certified FULL |

## 15. Delivery sequence and definition of done

1. A06/A07: register the references, pin differences, missing sections and reproducible gaps.
2. B06/B07, C06/C07: approve shared time/frame/clip/style schema, scope and helper/engine ownership.
3. D06/D07, L06/L07, T06: media windows/transport, collections/assets/proxies and preserved state/history.
4. I06/I07, F06/G06/H06, K06/K07: drawing/styles/content editing inside the selected frame/clip.
5. O06–O09 and M06/M07/N06/N07: timeline/keyframe operations and three-view compilation/synchronization.
6. P06, Q06/Q07, R06/R07, S06: actual frame/GIF/audio/video authoring, encode/mix and portable artifacts.
7. U06/V06/W06/W07/X06/Y06/Z06: bounded seeking/exports, full acceptance scenarios, docs/deployed proof and final gates.

A simple GIF settings modal, single-layer movement preset, frequency-only audio form, graph diagram or one working export does not complete this specification. The targeted production workflow is flexible content authoring plus an integrated time-based editor with real execution and evidence.
