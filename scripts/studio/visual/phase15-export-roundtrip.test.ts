import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { createVisualNode, createVisualProject } from '../../../lib/studio/visual/project';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import {
  createDeterministicStoredZip,
  createPhase15ProjectExport,
  formatGeneratedTypeScript,
  lintGeneratedTypeScript,
  phase15CleanGeneratedSource,
  phase15DefaultExportOptions,
  phase15ExportedCode,
  phase15SemanticHash,
  phase15TextHash,
} from '../../../lib/studio/visual/export-contract';
import {
  defaultImageNodeProps,
  defaultShapeNodeProps,
  imagePropsRecord,
} from '../../../lib/studio/visual/image-contract';
import {
  defaultTextNodeProps,
  textPropsRecord,
} from '../../../lib/studio/visual/text-contract';
import {
  defaultPathNodeProps,
  pathPropsRecord,
} from '../../../lib/studio/visual/path-pixel-contract';
import {
  chartPropsRecord,
  defaultChartNodeProps,
} from '../../../lib/studio/visual/chart-contract';
import { capturePhase9Component } from '../../../lib/studio/visual/scene-component-contract';
import { setPhase11Timeline, defaultPhase11Timeline } from '../../../lib/studio/visual/gif-animation-contract';
import {
  createPhase12ComposeClip,
  setPhase12Timeline,
  defaultPhase12Timeline,
} from '../../../lib/studio/visual/audio-authoring-contract';
import { setPhase13Timeline, defaultPhase13Timeline } from '../../../lib/studio/visual/video-authoring-contract';
import { ensurePhase14Authoring } from '../../../lib/studio/visual/advanced-authoring-contract';
import type { StudioVirtualAsset } from '../../../lib/studio/runtime/assets';
import type { VisualProject } from '../../../lib/studio/visual/model';

function base(id: string, name: string) {
  const project = createVisualProject({
    id,
    name,
    width: 640,
    height: 360,
    now: '2026-09-24T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };
  return project;
}

function phase4() {
  return base('phase15-p4', 'Phase 4 round trip');
}

function phase5() {
  const project = base('phase15-p5', 'Phase 5 round trip');
  const node = createVisualNode(
    'image',
    imagePropsRecord(defaultImageNodeProps('https://example.com/phase15.png')),
    { id: 'phase15-image', name: 'Image' },
  );
  node.transform = { x: 40, y: 30, width: 240, height: 160, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return project;
}

function phase6() {
  const project = base('phase15-p6', 'Phase 6 round trip');
  const node = createVisualNode(
    'text',
    textPropsRecord(defaultTextNodeProps('Phase 15 linked text')),
    { id: 'phase15-text', name: 'Text' },
  );
  node.transform = { x: 40, y: 30, width: 320, height: 90, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return project;
}

function phase7() {
  const project = base('phase15-p7', 'Phase 7 round trip');
  const props = defaultPathNodeProps('path');
  props.commands = [
    { type: 'moveTo', x: 20, y: 20 },
    { type: 'lineTo', x: 180, y: 100 },
  ];
  const node = createVisualNode('path', pathPropsRecord(props), {
    id: 'phase15-path',
    name: 'Path',
  });
  node.transform = { x: 20, y: 20, width: 220, height: 140, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return project;
}

function phase8() {
  const project = base('phase15-p8', 'Phase 8 round trip');
  const node = createVisualNode(
    'chart',
    chartPropsRecord(defaultChartNodeProps('bar')),
    { id: 'phase15-chart', name: 'Chart' },
  );
  node.transform = { x: 40, y: 30, width: 480, height: 260, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return project;
}

function phase9() {
  const project = base('phase15-p9', 'Phase 9 round trip');
  const node = createVisualNode(
    'shape',
    imagePropsRecord(defaultShapeNodeProps('rectangle')),
    { id: 'phase15-component-shape', name: 'Component shape' },
  );
  node.transform = { x: 40, y: 30, width: 240, height: 160, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return capturePhase9Component(project, [node.id], 'Phase 15 component').project;
}

function phase10() {
  const project = phase5();
  project.id = 'phase15-p10';
  project.name = 'Phase 10 round trip';
  const node = project.document.nodes['phase15-image'];
  node.props = imagePropsRecord({
    ...defaultImageNodeProps('https://example.com/phase15.png'),
    utilityStack: [{
      id: 'phase15-resize',
      type: 'resize',
      size: { width: 320 },
      maintainAspectRatio: true,
      outputFormat: 'png',
    }],
  });
  return project;
}

function phase11() {
  const project = base('phase15-p11', 'Phase 11 round trip');
  return setPhase11Timeline(project, defaultPhase11Timeline(project, 'phase15-gif'));
}

function phase12() {
  const project = base('phase15-p12', 'Phase 12 round trip');
  return setPhase12Timeline(project, defaultPhase12Timeline());
}

function phase13() {
  const project = base('phase15-p13', 'Phase 13 round trip');
  return setPhase13Timeline(project, defaultPhase13Timeline());
}

function phase14() {
  return ensurePhase14Authoring(base('phase15-p14', 'Phase 14 round trip'));
}

const roundTripProjects: Array<[number, () => VisualProject]> = [
  [4, phase4],
  [5, phase5],
  [6, phase6],
  [7, phase7],
  [8, phase8],
  [9, phase9],
  [10, phase10],
  [11, phase11],
  [12, phase12],
  [13, phase13],
  [14, phase14],
];

test('Phase 15 keeps one-file generated code clean by default and provenance opt-in', () => {
  const project = phase14();
  const linked = generateVisualProjectCode(project).source;
  assert.match(linked, /apexify-studio-v14:/);

  const clean = phase15ExportedCode(project, linked, false);
  assert.doesNotMatch(clean, /apexify-studio-v14:/);
  assert.doesNotMatch(clean, /apexify-studio provenance:/);
  assert.match(clean, /from 'apexify\.js'/);
  assert.equal(clean.endsWith('\n'), true);

  const withProvenance = phase15ExportedCode(project, linked, true);
  assert.match(withProvenance, /^\/\* apexify-studio provenance:/);
  assert.doesNotMatch(withProvenance, /apexify-studio-v14:/);
  assert.match(withProvenance, /"generator":"STUDIO-VISUAL-15"/);
});

test('Phase 15 formatter and lint gate are deterministic', () => {
  const messy = "import { ApexPainter } from 'apexify.js';  \r\n\r\n\r\nconst painter = new ApexPainter();   \r\n";
  const formatted = formatGeneratedTypeScript(messy);
  assert.equal(
    formatted,
    "import { ApexPainter } from 'apexify.js';\n\n\nconst painter = new ApexPainter();\n",
  );
  assert.deepEqual(lintGeneratedTypeScript(formatted), []);
  assert.ok(
    lintGeneratedTypeScript(
      "import { ApexPainter } from 'apexify.js';\nconst source = 'studio://asset/x';\n",
      { requirePortableAssets: true },
    ).some((issue) => issue.code === 'studio-asset-reference'),
  );
  assert.ok(
    lintGeneratedTypeScript(
      "import { ApexPainter } from 'apexify.js';\nconst endpoint = '/api/gallery/run';\n",
    ).some((issue) => issue.code === 'studio-runtime-leak'),
  );
});

test('Phase 15 linked-buffer canonical round trip is idempotent through Phases 4-14', () => {
  for (const [phase, build] of roundTripProjects) {
    const project = build();
    const source = generateVisualProjectCode(project).source;
    const result = reconcileVisualProjectFromCode(structuredClone(project), source);
    assert.equal(result.ok, true, 'Phase ' + phase + ': ' + (result.ok ? '' : result.error));
    if (!result.ok) continue;
    const regenerated = generateVisualProjectCode(result.project).source;
    const second = reconcileVisualProjectFromCode(structuredClone(result.project), regenerated);
    assert.equal(second.ok, true, 'Phase ' + phase + ' second reconcile failed');
    if (!second.ok) continue;
    assert.equal(
      generateVisualProjectCode(second.project).source,
      regenerated,
      'Phase ' + phase + ' canonical source drifted after the second reconciliation',
    );
  }
});

test('Phase 15 parser-backed edits reconcile while marker-backed unsafe edits become conflicts', () => {
  for (const [phase, build] of roundTripProjects.filter(([phase]) => phase <= 8)) {
    const project = build();
    const source = generateVisualProjectCode(project).source;
    const edited = source.replace('width: 640', 'width: 641');
    assert.notEqual(edited, source, 'Phase ' + phase + ' fixture must expose literal canvas width');
    const result = reconcileVisualProjectFromCode(project, edited);
    assert.equal(result.ok, true, 'Phase ' + phase + ' literal edit should reconcile');
    if (!result.ok) continue;
    assert.equal(result.project.document.width, 641);
    const canonical = generateVisualProjectCode(result.project).source;
    const stable = reconcileVisualProjectFromCode(result.project, canonical);
    assert.equal(stable.ok, true);
  }

  for (const [phase, build] of roundTripProjects.filter(([phase]) => phase >= 9)) {
    const project = build();
    const source = generateVisualProjectCode(project).source;
    const edited = source + '\n// unsupported linked edit\n';
    const result = reconcileVisualProjectFromCode(project, edited);
    assert.equal(result.ok, false, 'Phase ' + phase + ' body edit must not be silently ignored');
    if (result.ok) continue;
    assert.match(result.error, /Restore canonical Visual code or fork/i);
  }
});

test('Phase 15 project bundle externalizes assets, includes round-trip source, and is byte deterministic', () => {
  const timeline = defaultPhase12Timeline();
  timeline.mode = 'compose';
  timeline.compose.clips = [{
    ...createPhase12ComposeClip(0),
    id: 'phase15-audio-clip',
    source: { kind: 'asset', assetId: 'phase15-audio' },
    gain: 1,
  }];
  const project = setPhase12Timeline(
    base('phase15-p12-assets', 'Phase 12 round trip'),
    timeline,
  );
  const asset: StudioVirtualAsset = {
    id: 'phase15-audio',
    name: 'Voice Intro.wav',
    mime: 'audio/wav',
    size: 4,
    base64: Buffer.from([1, 2, 3, 4]).toString('base64'),
  };
  const linked = generateVisualProjectCode(project).source;
  assert.match(linked, /studio:\/\/asset\/phase15-audio/);

  const options = phase15DefaultExportOptions();
  const first = createPhase15ProjectExport(project, linked, [asset], options);
  const second = createPhase15ProjectExport(project, linked, [asset], options);

  assert.deepEqual(first.zip, second.zip);
  assert.equal(first.zip[0], 0x50);
  assert.equal(first.zip[1], 0x4b);
  assert.equal(first.fileName, 'phase-12-round-trip.zip');

  const names = first.files.map((file) => file.path);
  assert.ok(names.includes('src/index.ts'));
  assert.ok(names.includes('assets/Voice-Intro.wav'));
  assert.ok(names.includes('package.json'));
  assert.ok(names.includes('tsconfig.json'));
  assert.ok(names.includes('phase-12-round-trip.apexstudio.json'));
  assert.ok(names.includes('apexify-studio.export.json'));

  const sourceFile = first.files.find((file) => file.path === 'src/index.ts');
  assert.ok(sourceFile);
  const exportedSource = Buffer.from(sourceFile!.bytes).toString('utf8');
  assert.doesNotMatch(exportedSource, /studio:\/\/asset\//);
  assert.match(exportedSource, /\.\/assets\/Voice-Intro\.wav/);
  assert.doesNotMatch(exportedSource, /apexify-studio-v12:/);

  const pkg = first.files.find((file) => file.path === 'package.json');
  assert.ok(pkg);
  assert.match(
    Buffer.from(pkg!.bytes).toString('utf8'),
    /github:EIAS79\/Apexify\.js#50f2543482abbd7a9624192a060ec01330370bef/,
  );
  assert.equal(first.manifest.semanticHash, phase15SemanticHash(project));
  assert.equal(first.manifest.sourceHash, phase15TextHash(exportedSource));
});

test('Phase 15 manifest and omit asset strategies are explicit, never silent', () => {
  const project = phase4();
  const asset: StudioVirtualAsset = {
    id: 'asset-a',
    name: 'asset.png',
    mime: 'image/png',
    size: 3,
    base64: Buffer.from([7, 8, 9]).toString('base64'),
  };
  const linked = generateVisualProjectCode(project).source;

  const manifest = createPhase15ProjectExport(project, linked, [asset], {
    ...phase15DefaultExportOptions(),
    assetStrategy: 'manifest',
  });
  assert.ok(manifest.files.some((file) => file.path === 'assets/studio-assets.json'));
  assert.ok(manifest.manifest.warnings.some((warning) => /round trip|archival/i.test(warning)));

  const omit = createPhase15ProjectExport(project, linked, [asset], {
    ...phase15DefaultExportOptions(),
    assetStrategy: 'omit',
  });
  assert.ok(!omit.files.some((file) => file.path.startsWith('assets/')));
  assert.ok(omit.manifest.warnings.some((warning) => /omitted/i.test(warning)));
});

test('Phase 15 clean exported TypeScript parses without syntax diagnostics', () => {
  for (const [phase, build] of roundTripProjects) {
    const project = build();
    const source = phase15CleanGeneratedSource(generateVisualProjectCode(project).source);
    const result = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
      reportDiagnostics: true,
    });
    const syntaxErrors = (result.diagnostics ?? []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    assert.equal(
      syntaxErrors.length,
      0,
      'Phase ' + phase + ': ' + syntaxErrors.map((item) => item.messageText).join(' | '),
    );
  }
});

test('Phase 15 UI extends existing Generate Code and Export surfaces without adding a dock', () => {
  const shell = fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx', 'utf8');
  const modal = fs.readFileSync('components/studio/visual/VisualStudioModals.tsx', 'utf8');
  for (const marker of [
    'data-phase15-single-file-export',
    'data-phase15-project-export',
    'data-phase15-asset-strategy',
    'data-phase15-code-conflict',
    'data-phase15-recover-canonical',
    'data-phase15-fork-code',
    'data-phase15-code-quality',
  ]) {
    assert.ok(shell.includes(marker), marker + ' missing');
  }
  assert.ok(modal.includes('data-phase15-clean-code'));
  assert.ok(modal.includes('data-phase15-provenance-toggle'));
  assert.ok(shell.includes('data-visual-generate-code'));
  assert.ok(shell.includes('apx-pre4-export'));
  assert.ok(!shell.includes('Phase15Dock'));
});

test('Phase 15 deterministic ZIP writer is stable independent of input order', () => {
  const a = { path: 'b.txt', mime: 'text/plain', bytes: Uint8Array.from([2]) };
  const b = { path: 'a.txt', mime: 'text/plain', bytes: Uint8Array.from([1]) };
  assert.deepEqual(createDeterministicStoredZip([a, b]), createDeterministicStoredZip([b, a]));
});
