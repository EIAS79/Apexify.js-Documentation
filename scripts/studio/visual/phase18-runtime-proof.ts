import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

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

function digest(base64: string) {
  return createHash('sha256').update(Buffer.from(base64, 'base64')).digest('hex');
}

async function execute(label: string, source: string) {
  const result = await runSameOriginIsolatedStudio(source, [], []);
  if (result.status !== 200 || !result.body.ok) {
    throw new Error(
      label + ': runtime failed: ' +
      (result.body.error ?? result.body.stderr ?? JSON.stringify(result.body.runtimeDebug ?? {})),
    );
  }
  const artifacts = (result.body.outputs ?? [])
    .filter((item: Artifact) => typeof item.base64 === 'string' && item.base64.length > 0)
    .map((item: Artifact) => ({
      mime: item.mime ?? 'application/octet-stream',
      kind: item.kind ?? 'binary',
      bytes: Buffer.byteLength(item.base64!, 'base64'),
      sha256: digest(item.base64!),
    }));
  if (!artifacts.length) throw new Error(label + ': runtime returned no artifact bytes');
  return artifacts;
}

const report = [];

for (const proof of PHASE18_PROOF_PROJECTS) {
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

  const canonicalComparable = canonicalArtifacts.map(({ mime, sha256 }) => ({ mime, sha256 }));
  const previewComparable = previewArtifacts.map(({ mime, sha256 }) => ({ mime, sha256 }));

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
      canonicalArtifacts.map((item) => item.mime + ':' + item.bytes).join(','),
  );
}

const outPath = path.resolve('generated/studio/phase18-runtime-proof.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify({ phase: 'STUDIO-VISUAL-18', projects: report }, null, 2) + '\n',
);

console.log('[studio-visual:phase18-runtime] PASS ' + report.length + ' representative projects');
