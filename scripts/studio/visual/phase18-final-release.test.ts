import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  PHASE18_BROWSER_VIEWPORTS,
  PHASE18_PROOF_MAP,
  PHASE18_REQUIRED_COVERAGE,
  PHASE18_REQUIRED_SHELL_MARKERS,
  PHASE18_REVERSIBLE_PHASES,
} from '../../../lib/studio/visual/final-release';
import { PHASE16_PROOF_PROJECTS } from './phase16-proof-projects';
import { PHASE18_PROOF_PROJECTS } from './phase18-proof-projects';
import {
  generateVisualProjectCode,
  generateVisualProjectDisplayPreviewCode,
  generateVisualProjectPreviewCode,
} from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { phase15CleanGeneratedSource } from '../../../lib/studio/visual/export-contract';

const byId = new Map(PHASE18_PROOF_PROJECTS.map((proof) => [proof.id, proof] as const));

function editReversibleSource(phase: number, source: string): string {
  const candidates: Record<number, Array<[RegExp, string]>> = {
    4: [
      [/colorBg: "#071426"/, 'colorBg: "#10233f"'],
      [/width: 640/, 'width: 642'],
    ],
    5: [
      [/x: 40/, 'x: 48'],
      [/opacity: 1/, 'opacity: 0.94'],
    ],
    6: [
      [/Phase 16 completeness/, 'Phase 18 reversible text'],
      [/x: 40/, 'x: 52'],
    ],
    7: [
      [/x: 20/, 'x: 26'],
      [/y: 20/, 'y: 24'],
    ],
    8: [
      [/x: 40/, 'x: 46'],
      [/width: 480/, 'width: 500'],
    ],
  };
  for (const [pattern, replacement] of candidates[phase] ?? []) {
    if (pattern.test(source)) return source.replace(pattern, replacement);
  }
  throw new Error('No supported Phase-' + phase + ' reversible edit target was found.');
}

test('Phase 18 release coverage maps every required category to a real representative project', () => {
  assert.deepEqual(Object.keys(PHASE18_PROOF_MAP).sort(), [...PHASE18_REQUIRED_COVERAGE].sort());
  for (const category of PHASE18_REQUIRED_COVERAGE) {
    const ids = PHASE18_PROOF_MAP[category];
    assert.ok(ids.length > 0, category + ' has no release proof');
    for (const id of ids) assert.ok(byId.has(id), category + ' references unknown proof ' + id);
  }
});

test('Phase 18 representative projects validate and expose canonical, Preview and display-Preview routes', () => {
  for (const proof of PHASE18_PROOF_PROJECTS) {
    const project = proof.build();
    const validation = validateVisualProject(project);
    assert.equal(
      validation.ok,
      true,
      proof.id + ': ' + validation.issues.map((issue) => issue.message).join(' | '),
    );

    const canonical = generateVisualProjectCode(project);
    const preview = generateVisualProjectPreviewCode(project);
    const display = generateVisualProjectDisplayPreviewCode(project);

    assert.match(canonical.source, /ApexPainter/);
    assert.match(preview.source, /ApexPainter/);
    assert.match(display.source, /ApexPainter/);
    assert.ok(canonical.source.length > 80, proof.id + ': canonical source unexpectedly empty');
    assert.ok(preview.source.length > 80, proof.id + ': Preview source unexpectedly empty');

    const clean = phase15CleanGeneratedSource(canonical.source);
    assert.doesNotMatch(clean, /\/api\/gallery\/run|StudioOperationRuntime|__studio/i);
  }
});

test('Phase 18 canonical representative source round-trips without semantic or source drift', () => {
  for (const proof of PHASE18_PROOF_PROJECTS) {
    const project = proof.build();
    const canonical = generateVisualProjectCode(project).source;
    const reconciled = reconcileVisualProjectFromCode(project, canonical);
    assert.equal(reconciled.ok, true, proof.id + ': canonical reconciliation failed');
    if (!reconciled.ok) continue;
    const regenerated = generateVisualProjectCode(reconciled.project).source;
    assert.equal(regenerated, canonical, proof.id + ': canonical source drift after reconciliation');
  }
});

test('Phase 18 reversible phases accept a supported code edit and regenerate stable canonical code', () => {
  for (const phase of PHASE18_REVERSIBLE_PHASES) {
    const proof = PHASE16_PROOF_PROJECTS.find((item) => item.phase === phase);
    assert.ok(proof, 'missing reversible Phase-' + phase + ' proof');
    if (!proof) continue;

    const project = proof.build();
    const canonical = generateVisualProjectCode(project).source;
    const edited = editReversibleSource(phase, canonical);
    assert.notEqual(edited, canonical, 'Phase-' + phase + ' edit did not change source');

    const reconciled = reconcileVisualProjectFromCode(project, edited);
    assert.equal(
      reconciled.ok,
      true,
      'Phase-' + phase + ': ' + (reconciled.ok ? '' : reconciled.error),
    );
    if (!reconciled.ok) continue;

    const regenerated = generateVisualProjectCode(reconciled.project).source;
    const stable = reconcileVisualProjectFromCode(reconciled.project, regenerated);
    assert.equal(stable.ok, true, 'Phase-' + phase + ' regenerated canonical source must reconcile');
    if (stable.ok) {
      assert.equal(
        generateVisualProjectCode(stable.project).source,
        regenerated,
        'Phase-' + phase + ' regenerated canonical source is not stable',
      );
    }
  }
});

test('Phase 18 marker-backed domains reject unsupported body edits instead of silently drifting', () => {
  for (const proof of PHASE16_PROOF_PROJECTS.filter((item) => item.phase >= 9)) {
    const project = proof.build();
    const canonical = generateVisualProjectCode(project).source;
    const result = reconcileVisualProjectFromCode(
      project,
      canonical + '\n// phase18 unsupported semantic body edit\n',
    );
    assert.equal(result.ok, false, proof.id + ' silently accepted an unsupported edit');
    if (!result.ok) assert.match(result.error, /Restore canonical Visual code or fork/i);
  }
});

test('Phase 18 permanent PRE-4 shell contains every required release surface', () => {
  const shell = fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx', 'utf8');
  const modals = fs.readFileSync('components/studio/visual/VisualStudioModals.tsx', 'utf8');
  const source = shell + '\n' + modals;
  for (const marker of PHASE18_REQUIRED_SHELL_MARKERS) {
    assert.ok(source.includes(marker), 'missing final shell marker ' + marker);
  }

  for (const tool of [
    'canvas','images','text','charts','shapes','paths','components',
    'assets','gif','audio','video','advanced',
  ]) {
    assert.ok(shell.includes("'" + tool + "'"), 'feature rail missing ' + tool);
  }

  for (const tab of ['style','transform','effects','data','advanced']) {
    assert.ok(shell.includes("'" + tab + "'"), 'Inspector missing ' + tab);
  }
  for (const tab of ['generated','diagnostics','assets','history','timeline']) {
    assert.ok(shell.includes("'" + tab + "'"), 'dock missing ' + tab);
  }

  assert.match(modals, /data-visual-preview-modal/);
  assert.match(modals, /Zoom out/);
  assert.match(modals, /Zoom in/);
  assert.match(modals, /Download/);
  assert.match(modals, /Canvas name|Project name/);
  assert.match(modals, /data-visual-code-modal/);
  assert.match(modals, /Copy/);
  assert.match(modals, /File name/);
});

test('Phase 18 browser matrix remains the hardened desktop/laptop/tablet/mobile matrix', () => {
  assert.deepEqual(
    PHASE18_BROWSER_VIEWPORTS.map(({ name, width, height }) => [name, width, height]),
    [
      ['desktop', 1440, 900],
      ['laptop', 1100, 800],
      ['tablet', 820, 1180],
      ['mobile', 390, 844],
    ],
  );
});

test('Phase 18 release wiring keeps runtime proof and video proof directly executable', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const scripts = pkg.scripts ?? {};
  assert.match(scripts['studio:visual:proof'] ?? '', /codegen-smoke/);
  assert.match(scripts['studio:smoke:video'] ?? '', /studio-video-smoke/);
  assert.match(scripts['studio:visual:phase17:browser'] ?? '', /phase17-browser-smoke/);
});
