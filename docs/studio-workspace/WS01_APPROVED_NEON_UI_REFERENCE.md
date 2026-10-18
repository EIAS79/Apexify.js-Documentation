# Workspace Studio WS-01 — LOCKED neon reference execution contract

Status: **WS-01 UI redesign in progress; prior green/olive UI rejected**.
Approved reference: user-provided 1672 × 941 image on 2026-10-19, containing the full hero-animation Studio screenshot plus three mode preview cards. This is a **visual and spatial acceptance contract**, not an Apexify.js API specification.

## Visual lock (no green shell)
- Chrome #030b1d / #05132a / #071936; panel border #204778; near-white text #e9f1ff; muted #86a6ca.
- Electric cyan #14c9ff, periwinkle #536bff, violet #993aff, magenta #e13bff; primary **yellow** #ffe633 for Run or Deploy.
- Current homepage branding and nav Home / Docs / API / Gallery / Studio; compact project select on left.
- Dense pro-product layout, thin 1px blue borders, tiny restrained accent glows and 8–12px corners. **Not** emerald/olive, green highlights, full-pane gradient fills or a black empty artboard.
- Branding and visual proof imagery must come from verified repo assets or generated artifacts. Never mislabel reference artwork as a successful runtime render.

## Exact layout contract (reference screenshot)
At 1672 px reference, shell: top navigation ~58px; left icon rail ~60px; files explorer ~205px; center editor+live preview; right inspector ~300px; bottom dock ~185px; three mode showcase cards visible as an independent bottom strip. Main code/preview columns near 50/50, inspector independently scrollable, queue/output panels side-by-side. Code, Visual, Graph tab strip above center. Workspace toolbar: file tabs, language, Run, Preview, viewport preset, zoom, fullscreen. Left explorer with real stored buffers/assets; right properties / presets / assets and collapsible canvas/background/document/effects. Bottom tabs: queue, console, diagnostics, history; output thumbnails reflect **real session artifacts** and reveal example artwork only with an explicit reference badge.

**Runtime reality rule:** WS-01 creates exact UI chrome; Code executes through existing pinned CodeStudio; Visual retains current verified renderer; graph node compiler and persistent render queue remain later phases. Graph/design demos may be read-only and labeled. Queue MUST NOT invent tasks, percents or output counts. Any button that appears live must either do a real action or be clearly disabled.

## Architecture migration and protection
- Keep production `/studio` and legacy Code + Visual intact.
- Keep existing PR #155 unmerged and its head preserved. Branch this redesign from it.
- Build reference-aligned UI at feature-gated `/studio/workspace`, no fallback to green shell.
- Use shared Studio session's real `previewArtifacts`, `history`, `assets`; sample hero art shown only before first output and marked as preview/demo artwork, not simulated execution.
- Keep source editor usable with real Apexify.js templates and generated output; preserve legacy storage keys and code revisions.

## Responsive behavior
- Desktop 1440+: rail 60, explorer 205, inspector 285–310, center flexible, dock user collapsible. On 1024-1439 use overlays for inspector/drawer when needed; main center min usable width.
- Tablet 768–1023: close panels into overlays, primary Code/Preview toggles, dock can be collapsed.
- Mobile 320–767: one primary pane, internal toolbar scrolling, drawers overlay; no horizontal document overflow or hidden close actions.
- Every pane has its own scroll; document viewport avoids horizontal scroll. Keyboard close, focus restore, reduced-motion and zoom.
- Reference bottom mode cards are a **switchable gallery strip** or dismissible showcase so short viewports are usable.

## Acceptance gates before marking WS-01 DONE
1. Review actual screenshots side-by-side with approved user reference at 1672×941, 1440×900, 1280×720, 1024×768, 768×1024, 390×844, 320×568.
2. Implement top header, rail, files, code/preview split, inspector, dock, and three mode showcase cards with correct spatial and color fidelity.
3. Code Run returns real artifacts; saved code buffers survive switching; Preview renders real artifacts. Sample art explicitly marked unrendered. Visual mode retains working legacy engine, Graph correctly classified without fake capabilities.
4. No blank dominant canvas or olive UI; no unresponsive controls, invalid run buttons, fabricated queue states, mock pretend data.
5. Build, typecheck, Studio Fast, test runtime fixtures and browser smoke pass; record viewport evidence and known accessibility risks.
6. Keep all Vercel development branch deploys filtered; only **one user-authorized review preview** when ready. No production cutover until approved.

Do not mark WS-01 complete merely because the shell renders. Keep WS-02 separate from UI visual sign-off.
