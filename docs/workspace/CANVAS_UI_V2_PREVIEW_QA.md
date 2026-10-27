# Canvas Studio UI v2 preview QA

This release-preview branch is cut from the Canvas-only production candidate. It must not change Gallery, Image, Text, or Chart editors.

## Acceptance checklist

- [ ] Setup, Background, Styling, Effects, Advanced, Layers render without clipped/wrapped labels at narrow, docked, and maximized sizes
- [ ] Image uploads, gradients, patterns, stroke/shadow, and ordered-layer CRUD remain accessible and functional
- [ ] Visual graph renders typed nodes and connections; invalid connections fail closed; node selection and drag work
- [ ] Graph edits synchronize with Visual, live Apexify.js Code, preview, undo/redo, and persisted project
- [ ] Keyboard focus, tab navigation, reduced motion, and read-only control behavior verified
- [ ] Real browser screenshots and rendering regressions verified

**Do not infer completion from a successful Next.js compilation alone.**
