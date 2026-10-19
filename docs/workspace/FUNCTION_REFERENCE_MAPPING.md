# Supplied Function References → Workspace Authoring Requirements

**P0 / AWP.** Fourteen owner-supplied documents are mapped here. Their source audit is `cbeea053c2a973d4e867f8ca96e79546060dd62d`; the site's package pin checked during this revision is `379a5248f09ed39c1b1734fe104b6bd73a77857f`.

**Evidence class: STATIC AUDIT, NOT EXECUTED ACCEPTANCE.** Audit headings saying verified/source-confirmed describe a static contract review, not passed browser/runtime/export tests. Do not change the runtime pin or certify every listed option by copying these files. A06/A07 reconcile the actual installed artifact, source validators/defaults/types and behavior.

The [media-authoring contract](MEDIA_TIMELINE_AND_AUTHORING_SPEC.md) defines the required Visual/Code/Graph/Timeline flows. The source-input register records exact hashes of these files alongside the earlier 17 planning inputs.

## File-to-requirement map

| Supplied file | Actual public API / subject | Mandatory workspace requirements | Tasks |
| --- | --- | --- | --- |
| 00_INDEX(2).md | Domain index and source integrity/scope caveats | Inventory all domains, preserve actual source precedence and distinguish preview subset/future plans from current Node behavior | A06, A07, W07 |
| 00_METHOD_MAP(2).md | Public facade/facet-to-source audit map | Bind controls/graph/source to actual public exports and obtain missing domain detail from runtime; root names and callback boundaries must be correct | A02, A07, B07, W07 |
| 01_createCanvas(2).md | createCanvas(config, painterOpts?) → CanvasResults | All background/layer/style/inherit/fit/alignment/limits; frame-local canvas editing; still-video source capture; preserve result.buffer semantics | F01, F06, L06, R07 |
| 02_createImage(2).md | createImage(single/array, canvas, options?, painterOpts?) → PNG Buffer | Shapes/source placement, crop/fit, filters, masks/clips, group transforms, distortion/mesh, frame/clip/range-scoped nondestructive editing | H01–H06, K06, M06 |
| 03_shared_styles_gradients_patterns(2).md | Shared output/fit/align/stroke/shadow/gradient/pattern types | Named Style manager, editable gradient stops/geometry and patterns, per-renderer translation, overrides and actual blend semantics | H03, K06, A07 |
| 04_createText(2).md | createText overloads and measureText | Full nested font/decorations/effects/layout/placement/fill/stroke/curve, grouped text, precise metrics and timed/frame-local text | G01–G06, M07 |
| 15_scenes_scene_builder(2).md | createScene/SceneBuilder/renderScene/validateSceneRenderInput/scene-to-GIF/video | Ordered/nested editable layers/surfaces and scene snapshots for frames/clips, components/ref defaults and real scene export bridges | C07, K01, K07, P06, R06 |
| 16_templates(2).md | createTemplate, TemplateHandle.toRenderInput/render | Typed data/bindings, placeholders/refs/visibility/layout/overrides/insertions; explicit linked instances and frame-local overrides | K03, K04, K07, C07 |
| 19_createGIF(2).md | createGIF input frames or generated/streaming mode → GIFResults | True frame collection editing, holds/order/disposal/transparency/overlays, mutually exclusive input modes, output shapes and timing policy | O07, P01–P06, S06 |
| 20_animate(2).md | animate → Promise<Buffer[] or undefined> | Generate actual frames and optional streamed GIF, bridge to editable collection/timeline, distinguish this helper from retained browser playback | L06, O01, O07, P06, M07 |
| 21_audio_synthesis(2).md | createAudio synth/custom/preset/sequence/compose/mix/save | Oscillators/envelopes/events/clip controls, true waveform/playback, sample-time tracks, rate/pitch limits, WAV decode/mix and video sound sync | Q01–Q07, O08, S06 |
| 22_video_create_and_operations(2).md | createVideo operation dispatch, probe/extract and VideoStack | NLE clips/tracks/frame extraction/overlays/audio and actual codec/probe output; use verified ordered pipeline for complex edits | R01–R07, L06, L07, S06 |
| 35_createPath2D_drawPath(2).md | painter.path2d.create/draw; helper names are not root APIs | Real point/curve/shape and freehand editing, serializable commands, accurate stroke/fill/transform/angle units and callback isolation | I01, I02, I06, I07, M07 |
| 36_customLineDrawing(2).md | painter.path2d.custom and scene customLines | Editable line endpoints/arrows/markers/dashes/texture and supported styles; retain separate arbitrary control-point paths and test reported limitations | I01, I06, I07, N07, W07 |

Task ranges identify the existing and newly expanded domain tasks; the exact executable delivery tracker is TASKS.json. The files are supplied reference inputs, not newly implemented features.

## Complete authoring obligation

For each actual API option/variant: control or structured editor → canonical model/validation → graph representation/typed port → valid public source → execution/result → supported source reversal → persistence/history/recovery. Record scalar/object/array/union defaults and combinations; every applicable array supports create/edit/remove/reorder.

The workspace may add editor helpers such as smoothing, timeline commands, linked-frame overrides, style registries and portable packaging. B07 assigns reusable engine behavior upstream and editor behavior locally. Do not silently present a helper as an existing ApexPainter method or duplicate the future renderer/animation engine in the app.

## Audit caveats requiring explicit tests/disposition

| Finding from supplied audit | Workspace decision and test obligation |
| --- | --- |
| CanvasResults is a config-plus-buffer result, not a native drawing context | Use canvas.buffer/public scene APIs; native callback context is only available through supported isolated callback execution |
| videoBg extracts one still frame; loop/autoplay aliases do not make it a player | Label still capture and source frame/time accurately; full playback is a video/timeline workflow |
| Imperative image/text/path calls decode/encode rasters; nested scenes can stay native until output | Choose scene/batch compilation for many editable strokes/layers where verified; benchmark and keep direct browser interactivity out of repeated server PNG loops |
| animate generates sequential PNGs; optional GIF mode can return undefined | Check exact return/output modes; never treat animate as requestAnimationFrame playback or a retained engine |
| GIF normal and generated inputs are mutually exclusive; durations quantize to 10 ms | Validate mode/return shape, preserve authored holds and inspect decoded effective timing; cap frames/aggregate work and stream where supported |
| Node procedural audio is not browser playback | Add explicit audition/scheduling adapter, actual waveform decode and AudioContext/autoplay/resource handling |
| Audio compose.speed changes rate and pitch; synth and WAV pitch semantics differ | Do not label rate change pitch-preserving stretch; verify processing, source type and exact sample/duration output |
| createVideo is operation dispatch, not an arbitrary simultaneous-operation list | Use verified videoPipeline or an explicitly ordered sequence with immutable intermediate artifacts and safe job paths |
| Path2D is native and not serializable; root createPath2D/drawPath names are not facade exports | Persist PathCommand[]; reconstruct per backend; emit actual path2d facade calls |
| arc/ellipse use radians; arrow/helper transform rotation uses degrees | Label/convert at precise boundaries; differential-test geometry and round trips |
| custom connector accepts endpoints, not an arbitrary list of cubic handles | Use path command arrays for real multi-point/quadratic/cubic editing. Reproduce reported degenerate bezier/smooth branches before claiming curves through custom |
| custom lineStyle.shadow is reported declared/validated but unused at the audited SHA | Reproduce at the real pin; fix upstream and pin/test, implement an explicitly identified supported helper, or record an honest unsupported boundary; never ship a no-op as working |
| Connector markers reportedly follow the straight segment; singleLine mutates shared path state | Match actual verified semantics; do not claim curved arc-length placement; cover ordering/combined styles with visual regressions |
| Nested text fields override legacy flat aliases; overload selection matters | Emit preferred nested API, preserve legacy imports with precedence/diagnostics and exercise overloads/group options |
| renderScene resolves refs by default; SceneBuilder/imperative methods require opt-in; templates resolve separately | Match defaults and avoid double resolution; test shared/frame-instance refs and escaping |
| gradient and GradientConfig are distinct consumers; template layers include loose types | Validate actual runtime normalization rather than blindly copying declared fields across renderers |
| onDrawCustom, generated frame callbacks, resolvers and plugin functions are executable code | Safe declarative equivalents or explicit opaque isolated source; never executable JSON or arbitrary host/page callback evaluation |

These findings describe supplied static evidence, not newly reproduced bugs or confirmed fixes. A06/A07/W07 determine the exact current result before certification.

## What the provided subset does not contain

The index/method map refers to additional audit files that were not among these fourteen attachments: chart families/shared options, components/assets, videoPipeline and rich captions, image utilities, general Path2D/pixels/hit detection, batch/chain/output/plugins, browser preview/security limits and low-level VideoStack domains.

Their product scope remains in the main plan. A07 obtains missing detail from the pinned public implementation/types/tests and available upstream documentation. Do not reduce coverage to only the uploaded subset, and do not infer uninspected nested fields from the method map. This does not require the owner to resend files just to continue planning.

## Acceptance link

G15 and AC12 require reference-to-real-runtime reconciliation and accurate method/option/default/unit/return/callback semantics. G14 and AC01–AC11 require the promised authoring workflows and artifacts, including selected-frame scope, frame collections, doodles, styles, multitrack clip/keyframe/audio work and three-view synchronization.
