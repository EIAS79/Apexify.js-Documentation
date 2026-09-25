import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

function readJson(relativePath: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as Record<string, any>;
}

test('visual capability matrix covers the declaration-driven Studio inventory', () => {
  const base = readJson('generated/studio/capability-matrix.json');
  const visual = readJson('generated/studio/visual-capability-matrix.json');

  assert.equal(base.implementationComplete, true);
  assert.equal(visual.summary.complete, true);
  assert.equal(visual.summary.unclassifiedCount, 0);
  assert.deepEqual(visual.summary.unclassifiedCapabilities, []);
  assert.deepEqual(visual.summary.duplicateCapabilities, []);
  assert.equal(visual.summary.totalCapabilities, base.capabilityProofs.length);
  assert.equal(visual.source.packagePin, base.packagePin);

  const rowCapabilities = new Set(
    (visual.rows as Array<{ capability: string }>).map((row) => row.capability),
  );
  for (const proof of base.capabilityProofs as Array<{ capability: string }>) {
    assert.equal(rowCapabilities.has(proof.capability), true, proof.capability);
  }
});

test('visual project v1 schema locks the saved format identity', () => {
  const schema = readJson('schemas/studio/visual-project.v1.schema.json');
  assert.equal(schema.properties.format.const, 'apexify-studio-visual');
  assert.equal(schema.properties.schemaVersion.const, 1);
  assert.equal(schema.properties.codegen.$ref, '#/$defs/codegen');
  assert.equal(schema.$defs.codegen.properties.singleFile.default, true);
  assert.equal(schema.$defs.codegen.properties.assetBasePath.const, './assets/');
});

test('phase 0 source-of-truth documents are present', () => {
  const plan = fs.readFileSync(
    path.join(root, 'APEXIFY_STUDIO_VISUAL_AUTHORING_MASTER_PLAN.md'),
    'utf8',
  );
  const contract = fs.readFileSync(path.join(root, 'STUDIO_VISUAL_CONTRACT.md'), 'utf8');
  const decisions = fs.readFileSync(path.join(root, 'STUDIO_VISUAL_DECISIONS.md'), 'utf8');

  assert.match(plan, /STUDIO-VISUAL-0/);
  assert.match(contract, /One semantic source/);
  assert.match(decisions, /SV0-DEC-010/);
});

test('Vercel Git integration deploys main and suppresses every other branch', () => {
  const vercel = readJson('vercel.json');
  const deploymentEnabled =
    (vercel.git as { deploymentEnabled?: Record<string, boolean> } | undefined)
      ?.deploymentEnabled;

  assert.equal(deploymentEnabled?.['*'], false);
  assert.equal(deploymentEnabled?.main, true);
  assert.equal('ignoreCommand' in vercel, false);
});
