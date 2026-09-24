import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runSameOriginIsolatedStudio } from '../../lib/studio/runtime/isolatedNodeExecutor';
import { createVisualProject } from '../../lib/studio/visual/project';
import {
  defaultPhase13Timeline,
  setPhase13Timeline,
} from '../../lib/studio/visual/video-authoring-contract';
import { generateVisualProjectCode } from '../../lib/studio/visual/codegen/generator';

const source = String.raw`
import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

const W = 480;
const H = 480;
const N = 20;
const FPS = 22;

async function main() {
  const frames = [];

  for (let i = 0; i < N; i++) {
    const phase = (i / N) * Math.PI * 2;
    const pulse = 0.62 + 0.38 * Math.sin(phase);
    const r = Math.min(W, H) * 0.42 * pulse;

    const { buffer } = await painter.createCanvas({
      width: W,
      height: H,
      gradientBg: {
        type: 'radial',
        colors: [
          { stop: 0, color: '#fefce8' },
          { stop: 0.35, color: '#fde047' },
          { stop: 0.65, color: '#ea580c' },
          { stop: 1, color: '#431407' },
        ],
        startX: W / 2,
        startY: H / 2,
        startRadius: 0,
        endX: W / 2,
        endY: H / 2,
        endRadius: r,
      },
      bgLayers: [
        {
          type: 'noise',
          intensity: 0.06 + 0.02 * Math.sin(phase * 2),
          blendMode: 'overlay',
        },
      ],
      patternBg: {
        type: 'dots',
        color: 'rgba(255, 255, 255, 0.06)',
        secondaryColor: 'rgba(127, 29, 29, 0.35)',
        size: 3,
        spacing: 16,
        rotation: (i * 6) % 360,
        blendMode: 'soft-light',
        opacity: 0.45,
      },
    });

    frames.push(buffer);
  }

  const mp4Path = path.join(process.cwd(), 'public', 'gallery-outputs', 'videos', 'pulse-bloom.mp4');
  fs.mkdirSync(path.dirname(mp4Path), { recursive: true });

  await painter.createVideo({
    source: path.join(process.cwd(), 'package.json'),
    createFromFrames: {
      frames,
      outputPath: mp4Path,
      fps: FPS,
      format: 'mp4',
      quality: 'medium',
      resolution: { width: W, height: H },
    },
  });
}

(async () => {
  await main();
})().catch(console.error);
`;

async function runSmoke() {
  const result = await runSameOriginIsolatedStudio(source, [], []);
  const body = result.body;

  if (result.status !== 200 || !body.ok) {
  console.error('\n[studio:smoke:video] FAILED');
  console.error(body.error ?? 'Unknown Studio runtime failure');
  if (body.stderr) console.error('\n--- stderr ---\n' + body.stderr);
  if (body.runtimeDebug) console.error('\n--- runtime debug ---\n' + JSON.stringify(body.runtimeDebug, null, 2));
  process.exit(1);
}

const outputs = body.outputs ?? [];
const video = outputs.find((artifact) => artifact.mime === 'video/mp4' || artifact.kind === 'video');

if (!video?.base64) {
  console.error('\n[studio:smoke:video] FAILED: Studio returned no MP4 artifact');
  console.error(JSON.stringify(outputs.map(({ id, name, kind, mime, metadata }) => ({ id, name, kind, mime, metadata })), null, 2));
  process.exit(1);
}

const outDir = path.resolve('studio-smoke-output');
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'pulse-bloom.mp4');
writeFileSync(outPath, Buffer.from(video.base64, 'base64'));

console.log('\n[studio:smoke:video] PASS');
  console.log(JSON.stringify({
    status: result.status,
    runtime: body.runtime,
    runtimeIdentity: body.runtimeIdentity,
    output: {
      name: video.name,
      kind: video.kind,
      mime: video.mime,
      bytes: Buffer.byteLength(video.base64, 'base64'),
      path: outPath,
    },
  }, null, 2));

  const visualProject = createVisualProject({
    id: 'project_phase13_linux_video_smoke',
    name: 'Phase 13 Linux Video Smoke',
    width: 160,
    height: 90,
    now: '2026-09-24T00:00:00.000Z',
  });
  const videoTimeline = defaultPhase13Timeline();
  videoTimeline.mode = 'frames';
  videoTimeline.frames.width = 160;
  videoTimeline.frames.height = 90;
  videoTimeline.frames.fps = 2;
  videoTimeline.frames.quality = 'low';
  videoTimeline.frames.items = [
    { id: 'frame-a', source: { kind: 'solid', color: '#0b1020', label: 'APEX' } },
    { id: 'frame-b', source: { kind: 'solid', color: '#2563eb', label: 'VIDEO' } },
  ];
  const generatedProject = setPhase13Timeline(visualProject, videoTimeline);
  const generated = generateVisualProjectCode(generatedProject);
  if (!generated.source.includes('apexify-studio-v13:') || !generated.source.includes('createFromFrames')) {
    throw new Error('Phase 13 generated video source is missing its canonical marker or createFromFrames route.');
  }

  const generatedRun = await runSameOriginIsolatedStudio(generated.source, [], []);
  if (generatedRun.status !== 200 || !generatedRun.body.ok) {
    throw new Error(
      'Phase 13 generated video runtime failed: ' +
      (generatedRun.body.error ?? generatedRun.body.stderr ?? 'unknown error'),
    );
  }
  const generatedVideo = (generatedRun.body.outputs ?? []).find(
    (artifact) => artifact.mime === 'video/mp4' || artifact.kind === 'video',
  );
  if (!generatedVideo?.base64) {
    throw new Error('Phase 13 generated video returned no MP4 artifact.');
  }
  const generatedBytes = Buffer.from(generatedVideo.base64, 'base64');
  if (generatedBytes.length < 12 || generatedBytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
    throw new Error('Phase 13 generated video artifact is not an ISO-BMFF/MP4 file.');
  }
  const generatedPath = path.join(outDir, 'phase13-generated.mp4');
  writeFileSync(generatedPath, generatedBytes);

  console.log('\n[studio-visual:phase13] Linux generated video codegen/runtime proof passed');
  console.log(JSON.stringify({
    bytes: generatedBytes.byteLength,
    mime: generatedVideo.mime,
    generatedFile: generated.fileName,
    path: generatedPath,
    route: 'createVideo.createFromFrames',
  }, null, 2));
}

runSmoke().catch((error) => {
  console.error('[studio:smoke:video] harness error');
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
