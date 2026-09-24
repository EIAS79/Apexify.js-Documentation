import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

import { runSameOriginIsolatedStudio } from '../../../lib/studio/runtime/isolatedNodeExecutor';
import {
  generateVisualProjectCode,
  generateVisualProjectPreviewCode,
} from '../../../lib/studio/visual/codegen/generator';
import { PHASE18_PROOF_PROJECTS } from './phase18-proof-projects';

type Artifact = {
  id?: string;
  name?: string;
  kind?: string;
  mime?: string;
  base64?: string;
};

function digestBytes(value: Uint8Array | Buffer) {
  return createHash('sha256').update(value).digest('hex');
}

async function semanticDigest(mime: string, base64: string) {
  const bytes = Buffer.from(base64, 'base64');
  if (mime.startsWith('image/')) {
    const image = await loadImage(bytes);
    const canvas = createCanvas(Math.max(1, image.width), Math.max(1, image.height));
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return {
      kind: 'pixels',
      width: canvas.width,
      height: canvas.height,
      sha256: digestBytes(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)),
    };
  }
  return {
    kind: 'bytes',
    sha256: digestBytes(bytes),
  };
}

async function execute(label: string, source: string) {
  const result = await runSameOriginIsolatedStudio(source, [], []);
  if (result.status !== 200 || !result.body.ok) {
    throw new Error(
      label + ': runtime failed: ' +
      (result.body.error ?? result.body.stderr ?? JSON.stringify(result.body.runtimeDebug ?? {})),
    );
  }
  const rawArtifacts = (result.body.outputs ?? [])
    .filter((item: Artifact) => typeof item.base64 === 'string' && item.base64.length > 0);
  if (!rawArtifacts.length) throw new Error(label + ': runtime returned no artifact bytes');

  return await Promise.all(
    rawArtifacts.map(async (item: Artifact) => {
      const mime = item.mime ?? 'application/octet-stream';
      const base64 = item.base64!;
      return {
        mime,
        kind: item.kind ?? 'binary',
        bytes: Buffer.byteLength(base64, 'base64'),
        semantic: await semanticDigest(mime, base64),
      };
    }),
  );
}

async function main() {
  const report = [];
  const failures: string[] = [];

  for (const proof of PHASE18_PROOF_PROJECTS) {
    try {
      const project = proof.build();
      const canonical = generateVisualProjectCode(project).source;
      const preview = generateVisualProjectPreviewCode(project).source;

      const canonicalArtifacts = await execute(proof.id + ':generated', canonical);
      const previewArtifacts = await execute(proof.id + ':preview', preview);

      if (proof.expectMultipleArtifacts && canonicalArtifacts.length < 2) {
        throw new Error(
          proof.id + ': expected multi-artifact generated output, received ' +
          canonicalArtifacts.length,
        );
      }

      const canonicalComparable = canonicalArtifacts.map(({ mime, semantic }) => ({ mime, semantic }));
      const previewComparable = previewArtifacts.map(({ mime, semantic }) => ({ mime, semantic }));

      if (JSON.stringify(canonicalComparable) !== JSON.stringify(previewComparable)) {
        throw new Error(
          proof.id + ': Preview/generated artifact divergence\n' +
          'generated=' + JSON.stringify(canonicalComparable) + '\n' +
          'preview=' + JSON.stringify(previewComparable),
        );
      }

      report.push({
        id: proof.id,
        coverage: proof.coverage,
        artifacts: canonicalArtifacts,
      });
      console.log(
        '[studio-visual:phase18-runtime] PASS ' +
          proof.id +
          ' ' +
          canonicalArtifacts.map((item) => item.mime + ':' + item.bytes + ':' + item.semantic.kind).join(','),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.error('[studio-visual:phase18-runtime] FAIL ' + proof.id + '\n' + message);
    }
  }

  if (failures.length) {
    throw new Error(
      'Phase 18 runtime proof failed for ' + failures.length + ' project(s):\n' +
      failures.map((message) => '- ' + message).join('\n'),
    );
  }

const outPath = path.resolve('generated/studio/phase18-runtime-proof.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify({ phase: 'STUDIO-VISUAL-18', projects: report }, null, 2) + '\n',
);

  console.log('[studio-visual:phase18-runtime] PASS ' + report.length + ' representative projects');
}

main().catch((error) => {
  console.error('[studio-visual:phase18-runtime] FAILED');
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
