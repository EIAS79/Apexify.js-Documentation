# Workspace Studio — Responsive Layout, Interaction and Visual Design Specification

> Status: WS design baseline; must be validated in real browser prototypes before production.
> Design origin: approved canvas-first adaptive first concept, refined to use fewer simultaneously mounted panels; visual branding is from existing Home, Frame Docs and Motion Field Gallery, not blue legacy Studio.
> Rule: *Features remain available without remaining visible.* Visibility is context and user preference, not capability removal.

## 1. Default structure (desktop)

~~~text
┌──────────────────────────────── Studio brand / project / Run / Export ───────────────────────────────┐
│ Rail │ [optional contextual drawer] │ Visual  Code  Graph  Split │ [optional contextual inspector] │
│ 56px │ Projects/Files/Assets/Layers   │        ACTIVE WORKSPACE      │ Properties / Data / Advanced   │
│      │ Templates/Components/History  │    artboard/code/graph       │                               │
│      │ 240-320px (collapsible)        │    maximizes free space     │ 280-360px (collapsible)        │
├──────┴───────────────────────────────┴────────────────────────────┴───────────────────────────────┤
│ Bottom dock trigger: Queue | Timeline | Outputs | Console | Diagnostics | History   ↑ count        │
│ [Optional expandable bottom pane 180–380px; default CLOSED; x dismiss, user resize]                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
~~~

Default: rail visible, drawer closed, inspector closed, dock collapsed, mode Visual on first visit. A project may restore mode/panels per breakpoint if the stored layout remains valid. In Code mode, code editor fills main workspace; no automatic split unless opt-in. In Graph mode, entire canvas is the typed graph; a preview may float as dismissible small thumbnail or be a split pane if enabled. The output is never a fake generated bitmap: run and show verified artifacts.

## 2. Breakpoints and panel behavior

Dimensions are CSS pixels, not physical screen pixels. All limits must be tested in Chrome/Firefox/WebKit with OS zoom and dynamic font sizes.

| Width | Header/rail | Primary editor | Drawer / inspector / dock |
|---|---|---|---|
| ≥ 1600 | Full navigation & rail | Primary full, optional split 45/55–70/30 | Left/right can dock independently; queue dock resizable |
| 1200–1599 | Header compact; rail | Visual or Code full, user-chosen split only if min widths | One or both can dock; auto-undock if editor below min width |
| 1024–1199 | Header compact; rail | Primary only by default; two-pane split only if each min width met | Drawer OR inspector docks; other becomes overlay |
| 768–1023 | Compact header and rail | Primary fills remainder, no automatic split | Side drawers & inspectors overlay with backdrop, queue bottom sheet |
| 480–767 | Mobile toolbar with overflow menu | One Visual/Code/Graph mode, adaptive safe-height | Context panels bottom sheet/full-height drawer, no permanent side panels |
| 320–479 | Single-row core actions plus overflow | One full focus editor, horizontally scrollable *toolbar*, never whole page | Bottom sheet or full-screen drawer, sheet content internally scrollable |

Clamps for actual implementation after measurement (not fixed requirements when screens differ):
- Header 54–68 px and row height respects touch.
- Rail 52–64px when docked; mobile rail collapses to commands/action bar.
- Left drawer 240–320px; right inspector 280–360px.
- Main editor/canvas minimum 420px desktop or 100% remaining width on narrow/mobile. Code minimum 400px when dual-pane; graph minimum 400px. Below these thresholds **disable split and overlay context** instead of narrowing.
- Dock expanded 180–380px with min active workspace height 280px; clamp/responsive to smaller viewport; sheet can cover instead of squashing center.
- Nested split ratios persist within breakpoint tier, then clamp on resize/orientation change.
- No hard-coded >viewport min-width applied to outer shell. Artboard can scale/zoom independent of editor viewport.

## 3. Height, safe area, scroll contract

Use shell height: 100dvh with 100svh fallback, min-height:0 and overflow:hidden on Studio root when appropriate. On iOS and virtual keyboard, respect visual viewport height and safe-area insets; preserve access to toolbar, run and keyboard-composition dialogs. OS browser chrome shrinking must not hide Save/Close.

Exact scrolling ownership:
- Studio root: **no accidental document horizontal scroll**; no child forces width larger than viewport.
- Project/Files/Templates/Layers drawer: overflow-y:auto, overflow-x:hidden, own scrollbar, sticky local search & section title if helpful.
- Main Visual canvas: overflow:hidden as viewport; use pan/zoom for artboard, not document scroll; fit-to-view on resize; avoid clipping off-screen controls.
- Code: independent x/y scroll for long source lines; wrap toggle for editing; line numbers and minimap cannot force page overflow.
- Graph: pointer/keyboard panning and zoom, fit-to-graph, viewport clipping; nodes and edges must not trigger document overflow.
- Inspector: overflow-y:auto; sticky current selection/tab header; long labels and code fragments wrap or have local scroll.
- Bottom dock: terminal/logs/queue each has its own scroll; queue sticky header, bounded rows and optional virtualization; timeline horizontal scroll/zoom only inside timeline.
- Toolbar: on narrow screens only toolbar scrolls horizontally or moves secondary actions to overflow; body does not scroll sideways.
- Dialog/sheet: focus trap and internal max-height/overflow-y:auto; overlay background remains stable; sticky dismiss control.
- Menu/popover inside code/canvas can escape pane via accessible portal without getting clipped.

CSS structural requirements: display:grid/flex child overflow with min-width:0; min-height:0; max-width:100%; box-sizing:border-box; overflow containment explicit; use overscroll-behavior:contain where needed, but don't prevent screen reader or native scrolling. Test 200%/400% browser zoom without content loss. Test viewport height 480px and mobile landscape.

## 4. User interactions

**Panel toggles**
- Click rail item to open corresponding drawer; click active item or X to close and return space; state persists per project/device class if desired.
- Properties appears when selecting an editable item OR manually toggled; keyboard focus returned to selection when dismissed.
- Queue collapsed by default. Badge displays real pending items count, not fabricated fixed 3. Expand via button/shortcut, resize, minimize/dismiss using X.
- Projects/Files/Assets can expand full-screen on mobile and are searchable, keyboard navigable and contain real corresponding content.
- Pinned panels optional only at widths that preserve editor min-size; layout engine must automatically unpin to overlay when width shrinks.
- Drawers use tabs within ONE drawer, not multiple simultaneous left sidebars.

**Workspace modes**
- Visual ↔ Code ↔ Graph preserve project revision, object selection, scroll/viewport and last valid generated code.
- Unsupported source parsing: precise errors, preserve original, avoid overwriting model, offer preview-only/Code-only actions and explicit irreversible conversion choices.
- Split via toolbar menu: Code+Preview, Graph+Preview, Visual+Code, Visual+Preview, with max two large panes; mobile split unavailable with clear explanation.
- Preview inspector can select one or multiple artifact outputs and show provenance, MIME, dimensions/duration, warnings.
- Run resolves backend automatically or shows required backend, validation and limits; supports cancellation and accurate progress.

**Window management**
- Drag separators with pointer, keyboard arrow adjustments, Home/End bounds, reset layout; visible focus and accessible separator role with announced dimensions.
- Layout presets: Focus, Review, Animate, Debug, Saved Custom; presets change panels/mode only, never change project content.
- Zoom: fit, 50/75/100/200/custom; source zoom independent from artboard; canvas pixel size remains exact.
- Fullscreen preview, detach pane *within browser* if feasible and verified; external OS-window detach is not assumed.

**Editable visual layer tree**
- Structure and visibility/lock states, nest/reparent/order operations, undo, keyboard and pointer drag; do not visually promise engine-native grouping if compiler semantics differ.
- Show project layers and graph nodes as distinct representations with cross-selection for mapped elements; not all code has a one-to-one node.
- Selected object inspector groups: Style, Transform, Effects, Data, Advanced; search options via actual schema.

**Media**
- Timeline opens only for GIF/audio/video/animation projects; static artboards have Outputs/Queue instead.
- Real play, seek/scrub, keyframe semantic validation, frame source identification, audio listen, duration accurate after loadedmetadata.
- Pending media task shows explicit preparation or indeterminate state when backend emits no percent.

## 5. Keyboard and accessibility

Global: Cmd/Ctrl+K command palette; Cmd/Ctrl+S save; Cmd/Ctrl+Enter run; Escape dismiss overlay; Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z semantic undo/redo (scoped to active editor); ? shortcuts help. Confirm actual shortcuts and avoid stealing browser/text-area keys. Code and Graph maintain conventional keyboard editors. Skip links and logical landmarks; no modal focus leakage; focus restoration on close.

Minimum 4.5:1 normal text contrast / 3:1 large text and UI control borders as applicable; theme dark, light and high-contrast. Visible focus indicator, icons with accessible labels, live-region run status without spam, tooltips not pointer-only. No color-only state, canvas selections have keyboard alternatives. Reduce motion disables decorative movement without removing functionality; timelines obey explicit user action.

## 6. Theme tokens from existing site

Reuse Frame Docs: --docs-bg #111210; --docs-panel #1b1d18; --docs-panel-2 #22251e; --docs-line #34382e; --docs-text #f3f4ec; --docs-text-2 #bdc2b3; --docs-text-3 #929a86; --docs-blue #d5ff5f (accent lime). Gallery provides --field-purple #c1a4ee as Graph context. New scoped workspace variables alias these, plus muted cyan for preview/media and amber for pending/warning.

Avoid blue-on-blue dashboard, excessive glows, gradient borders on every card, stock dashboard art. Gradient media/brand prism belongs **inside rendered preview or select hero**, and active view indicators; chrome stays quiet and editorial. Use shared Apexify logo, consistent navigation and typography. Dark and light have independent semantic color validation. Product screenshot inspiration is not a reference for valid Apexify API calls.

## 7. Empty, loading, error, offline and scale states

- First run: intentionally clear primary CTA ("Open project", "Start from template", "New canvas"), not a fake composition.
- Asset limit reached: accurate remaining quota, import/replace/compress path; no silent failure.
- Missing file/asset: structured dependency list and repair action.
- Invalid JS or unsupported conversion: code preserved, visible exact error and retained last good output with stale indicator.
- Failed Run: specific error and backend reason; no raw infrastructure secrets/debug dump.
- Source changed while render runs: output associated with originating revision and never silently shown as current.
- Corrupt autosave/import: offer recovery/export of raw snapshot and legacy access.
- Slow render: keep input responsive, cancellation, honest progress.
- Large trees/graphs/logs: virtualized lists, incremental search and performance thresholds. No unnecessary global scrollbars.

## 8. Mandatory responsive test matrix

For every UI milestone capture full-page and panel-focused browser screenshots and keyboard video/tests at:
- 320×568, 360×740, 390×844, 430×932, 600×800, 768×1024, 820×1180,
- 1024×768, 1280×720, 1366×768, 1440×900, 1920×1080, 2560×1440,
- mobile portrait/landscape with virtual keyboard, OS font scaling, 200%/400% zoom;
- Chrome, Firefox, WebKit, dark/light/high-contrast, reduced motion, touch and keyboard-only.

Assert measured: document scrollWidth <= document clientWidth + tolerance; every pane has scrollHeight/clientHeight handling; no controls clipped under docks, panels close and reclaim width; resizers clamp; inspector works at 320px; queues scroll; code can edit and save while queue runs; screen readers identify panels and statuses; touch targets comfortably reachable. Include automated Playwright/Puppeteer layout snapshots and manual reviewed evidence. Do not mark complete from desktop screenshot only.

## 9. Performance budget

Target p95 input-to-paint under 50ms on reference desktop for ordinary edits, responsive drag/zoom target 60fps on modest project, no synchronous runtime render on each keypress, no stale preview overwrite. Set browser-memory budget based on actual measured device, not invented universal number; monitor output object URLs, ImageBitmap close, worker lifecycle and long-running FFmpeg jobs. Test 10/100/1000 layers, 10/100/1000 graph nodes with virtualization thresholds, 1/10/100 files and current asset quotas. Report measurements and optimized fallbacks per device tier.

## 10. Sign-off checklist

- [ ] Default desktop not crowded: no more than one primary pane, only 1 contextual drawer open by user intent.
- [ ] View switch does not discard source, output, selection or project state.
- [ ] Code and Graph use full space when selected; preview optional.
- [ ] Queue and Timeline truly collapse and release height.
- [ ] Right/left panels truly close and release width.
- [ ] Asset/project navigation and file browser actually functional.
- [ ] No device-width/height causes hard clipping or unreadable editor.
- [ ] Scroll regions behave exactly as defined.
- [ ] Dark/light/a11y/reduced motion verified.
- [ ] All visible render artifacts produced through supported engine calls.
