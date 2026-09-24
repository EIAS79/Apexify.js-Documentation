import fs from 'node:fs';
import path from 'node:path';

import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { createPhase17AutosaveEnvelope } from '../../../lib/studio/visual/hardening';
import { PHASE18_PROOF_PROJECTS } from './phase18-proof-projects';

const outPath = path.resolve('generated/studio/phase18-proof-projects.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const fixtures = PHASE18_PROOF_PROJECTS.map((proof) => {
  const project = proof.build();
  const generated = generateVisualProjectCode(project);
  return {
    id: proof.id,
    coverage: proof.coverage,
    expectMultipleArtifacts: Boolean(proof.expectMultipleArtifacts),
    envelope: createPhase17AutosaveEnvelope({
      project,
      code: {
        source: generated.source,
        fileName: generated.fileName,
        savedAt: 0,
        syncState: 'synced',
        syncError: null,
      },
      savedAt: 0,
      assets: [],
    }),
  };
});

fs.writeFileSync(
  outPath,
  JSON.stringify({ phase: 'STUDIO-VISUAL-18', fixtures }, null, 2) + '\n',
);
console.log('[studio-visual:phase18-fixtures] wrote ' + fixtures.length + ' release fixtures');
