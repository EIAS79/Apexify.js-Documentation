import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { auditRepository } from '../../scripts/workspace/foundation-audit.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const PIN='379a5248f09ed39c1b1734fe104b6bd73a77857f';

async function createFixture() {
  const root=await mkdtemp(join(tmpdir(), 'apexify-workspace-audit-'));
  const dependency=`github:EIAS79/Apexify.js#${PIN}`;
  async function write(path, data) {
    const dst=join(root,path);
    await mkdir(dirname(dst),{recursive:true});
    await writeFile(dst,typeof data==='string'?data:JSON.stringify(data,null,2));
  }
  await write('package.json',{name:'workspace-fixture',dependencies:{'apexify.js':dependency}});
  await write('package-lock.json',{lockfileVersion:3,packages:{'':{dependencies:{'apexify.js':dependency}},'node_modules/apexify.js':{version:'6.0.0',resolved:`git+ssh://git@github.com/EIAS79/Apexify.js.git#${PIN}`}}});
  await write('features/apex-workspace/WorkspaceApp.tsx',`'use client';\nimport { helper } from './helper';\nexport const value = helper;`);
  await write('features/apex-workspace/helper.ts',`export const helper = 1;`);
  await write('features/apex-workspace/server/render.ts',`import { readFile } from 'node:fs/promises';\nexport const fn = readFile;`);
  await write('features/apex-workspace/codegen.ts',`export function generate(){ return \`import { ApexPainter } from 'apexify.js';\`; }`);
  return {root,write,cleanup:()=>rm(root,{recursive:true,force:true})};
}

test('manifest and locked source identity are separate from uninstalled runtime artifact',async()=>{
  const fixture=await createFixture();
  try{
    const report=await auditRepository(fixture.root,{ts,expectedPin:PIN});
    assert.equal(report.engine.manifestSha,PIN);
    assert.equal(report.engine.lockRootSha,PIN);
    assert.deepEqual(report.engine.identityFindings,[]);
    assert.equal(report.gates.identity,'PASS_MANIFEST_AND_LOCK_ONLY');
    assert.equal(report.gates.installedArtifact,'NOT_VERIFIED');
    assert.equal(report.engine.sourceCommitEqualsInstalledArtifact,'UNVERIFIED');
    assert.equal(report.workspace.scannedFiles,4);
    assert.deepEqual(report.workspace.importBoundaryViolations,[]);
    assert.deepEqual(report.workspace.staticUsedMethods,[]);
  }finally{await fixture.cleanup();}
});

test('mismatched lock identity must fail rather than treating manifest as installed proof',async()=>{
  const fixture=await createFixture();
  try{
    await fixture.write('package-lock.json',{lockfileVersion:3,packages:{'':{dependencies:{'apexify.js':'github:EIAS79/Apexify.js#'+'f'.repeat(40)}},'node_modules/apexify.js':{resolved:'git+ssh://invalid'}}});
    const report=await auditRepository(fixture.root,{ts,expectedPin:PIN});
    assert.equal(report.gates.identity,'FAIL');
    assert(report.engine.identityFindings.some(msg=>/mismatch/.test(msg)));
  }finally{await fixture.cleanup();}
});

test('client transitive import of node native backend is rejected; server import is allowed',async()=>{
  const fixture=await createFixture();
  try{
    await fixture.write('features/apex-workspace/helper.ts',`import { readFile } from 'node:fs/promises';\nexport const helper = readFile;`);
    const report=await auditRepository(fixture.root,{ts});
    assert.equal(report.gates.staticImportBoundaries,'FAIL');
    assert(report.workspace.importBoundaryViolations.some(v=>v.file.endsWith('/helper.ts')&&v.specifier==='node:fs/promises'));
    assert(!report.workspace.importBoundaryViolations.some(v=>v.file.endsWith('server/render.ts')));
  }finally{await fixture.cleanup();}
});

test('Studio import forbidden even when type-only, generated source strings are not imports',async()=>{
  const fixture=await createFixture();
  try{
    await fixture.write('features/apex-workspace/helper.ts',`import type { Something } from '@/features/studio/model';\nexport const helper = 1;`);
    const report=await auditRepository(fixture.root,{ts});
    assert.equal(report.workspace.importBoundaryViolations.filter(v=>v.reason.includes('Studio')).length,1);
    assert(!report.workspace.importBoundaryViolations.some(v=>v.file.endsWith('codegen.ts')));
  }finally{await fixture.cleanup();}
});

test('static public API call candidates do not claim public surface completeness',async()=>{
  const fixture=await createFixture();
  try{
    await fixture.write('features/apex-workspace/server/render.ts',`const painter: unknown = null;\n// static candidate only\npainter.createCanvas({ width: 2 });`);
    const report=await auditRepository(fixture.root,{ts});
    assert(report.workspace.staticUsedMethods.some(c=>c.method==='createCanvas'&&c.evidence==='static-call-only'));
    assert.equal(report.gates.recursiveApiParity,'NOT_RUN');
  }finally{await fixture.cleanup();}
});


test('a non-literal dynamic import is an explicit unresolved blocker, never silently safe',async()=>{
  const fixture=await createFixture();
  try {
    await fixture.write('features/apex-workspace/helper.ts',`const moduleName = 'node:fs/promises';\nexport async function load(){return import(moduleName);}`);
    const report=await auditRepository(fixture.root,{ts});
    assert.equal(report.gates.staticImportBoundaries,'INDETERMINATE_UNRESOLVED_IMPORTS');
    assert(report.workspace.unresolvedImports.some(v=>v.file.endsWith('/helper.ts')));
    assert(report.diagnostics.some(d=>d.code==='AWP-BOUNDARY-UNRESOLVED'));
  } finally {await fixture.cleanup();}
});

test('imports leaving audited workspace paths are explicitly unresolved',async()=>{
  const fixture=await createFixture();
  try {
    await fixture.write('features/apex-workspace/helper.ts',`export { hidden } from '@/lib/not-in-scanned-workspace';`);
    const report=await auditRepository(fixture.root,{ts});
    assert.equal(report.gates.staticImportBoundaries,'INDETERMINATE_UNRESOLVED_IMPORTS');
    assert(report.workspace.unresolvedImports.some(v=>v.specifier==='@/lib/not-in-scanned-workspace'));
  } finally {await fixture.cleanup();}
});

test('import equals require syntax is checked on browser paths',async()=>{
  const fixture=await createFixture();
  try {
    await fixture.write('features/apex-workspace/helper.ts',`import fs = require('node:fs');\nexport const helper = fs;`);
    const report=await auditRepository(fixture.root,{ts});
    assert.equal(report.gates.staticImportBoundaries,'FAIL');
    assert(report.workspace.importBoundaryViolations.some(v=>v.specifier==='node:fs'));
  } finally {await fixture.cleanup();}
});

test('static callsite inventory is source-hashed and does not certify engine behavior',async()=>{
  const fixture=await createFixture();
  try {
    await fixture.write('features/apex-workspace/server/render.ts',`const painter = {};\npainter.createCanvas({width:5});`);
    const report=await auditRepository(fixture.root,{ts});
    assert.equal(report.workspace.capabilityInventory[0].candidate,'ApexPainter.createCanvas');
    assert.equal(report.workspace.capabilityInventory[0].status,'UNVERIFIED');
    assert.match(report.workspace.capabilityInventory[0].sourceCalls[0].sourceSha256,/^[0-9a-f]{64}$/);
  } finally {await fixture.cleanup();}
});
