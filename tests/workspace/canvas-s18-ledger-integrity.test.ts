import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {resolve} from 'node:path';
const docs=(filename:string)=>JSON.parse(readFileSync(resolve(process.cwd(),'docs/workspace',filename),'utf8'));
const a=docs('CREATE_CANVAS_STRICT_CERTIFICATION_S17.json');
const b=docs('CREATE_CANVAS_STRICT_CERTIFICATION_S18.json');
const c=docs('CREATE_CANVAS_COVERAGE_S18.json');
const r=docs('CREATE_CANVAS_WORKSPACE_READINESS_S18.json');
assert.equal(a.paths.length,208);assert.equal(b.paths.length,208);assert.equal(c.paths.length,208);assert.equal(r.paths.length,208);
const newly=new Set(a.paths.filter((x:any)=>x.readinessS17==='WORKSPACE_READY'&&x.strictStatus==='PARTIAL_CERTIFICATION').map((x:any)=>x.optionPath));
assert.equal(newly.size,43);
for(let i=0;i<208;i++)test('S18 strict original inventory invariant path '+a.paths[i].optionPath,()=>{
 const before=a.paths[i],after=b.paths[i],cover=c.paths[i],ready=r.paths[i];
 assert.equal(after.optionPath,before.optionPath);assert.equal(after.optionPath,cover.optionPath);assert.equal(after.optionPath,ready.optionPath);
 assert.equal(after.runtimePin,'379a5248f09ed39c1b1734fe104b6bd73a77857f');
 assert.equal(after.pinnedDeclaration,before.pinnedDeclaration);
 assert.equal(after.pinnedSource,before.pinnedSource);
 assert.equal(cover.strictStatusS18,after.strictStatus);
 assert.equal(ready.workspaceStatus,after.readinessS17);
 if(newly.has(after.optionPath)){
  assert.equal(before.strictStatus,'PARTIAL_CERTIFICATION');
  assert.equal(after.strictStatus,'FULL');
  assert.equal(after.strictGate.nativeDiscriminating,true);
  assert.equal(after.strictGate.CodeExecutableParity,true);
  assert.equal(after.strictGate.typeDefaultValidation,true);
  assert.equal(after.strictGate.Inspector,true);
  assert.equal(after.strictGate.GraphCanonical,true);
  assert.equal(after.strictGate.Chromium,true);
  assert.equal(after.strictGate.historyIDB,true);
  assert.equal(after.strictGate.security,true);
  assert.ok(after.evidenceIds.includes('S18-43-PINNED-NATIVE-CODE-GRAPH'));
  assert.ok(after.evidenceIds.includes('S18-43-STRICT-NEGATIVES'));
  assert.ok(after.evidenceIds.some((id:string)=>id.startsWith('S18-CHROMIUM-')));
  assert.ok(after.evidenceFiles.some((f:string)=>f.includes('canvas-stagec-s18-43-native.cases.ts')));
  assert.ok(after.s18Certification?.codeRawPixelParity);
 }else{
  assert.equal(after.strictStatus,before.strictStatus,'Unapproved pre-S18 status change');
  assert.deepEqual(after.evidenceIds,before.evidenceIds,'Historical FULL evidence must remain unchanged');
 }
 if(after.strictStatus==='BLOCKED_SECURITY')assert.ok(after.optionPath.startsWith('canvas.videoBg'));
 if(after.strictStatus==='NOT_APPLICABLE')assert.equal(after.optionPath,'painterOpts.resolveAssetRefs');
});
test('S18 exact totals and evidence do not inflate via READY inference',()=>{
 assert.deepEqual(b.strictSummary,{FULL:167,PARTIAL_CERTIFICATION:8,BLOCKED_UPSTREAM:6,BLOCKED_SECURITY:26,NOT_APPLICABLE:1});
 assert.equal(b.newStrictFull,43);
 assert.equal(b.previousStrictFull,124);
 assert.equal(r.workspaceReadyCount,167);
 assert.equal(c.summary.fullyCertified,167);
 assert.equal(new Set(b.paths.map((x:any)=>x.optionPath)).size,208);
 assert.equal(b.paths.filter((x:any)=>x.strictStatus==='FULL').length,167);
 assert.equal(Object.keys(b.s18EvidenceRegistry).length,6);
});