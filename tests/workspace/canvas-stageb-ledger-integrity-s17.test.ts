import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {resolve} from 'node:path';
const root=process.cwd();
const json=(name:string)=>JSON.parse(readFileSync(resolve(root,'docs/workspace',name),'utf8'));
const b=json('CREATE_CANVAS_WORKSPACE_READINESS_S16.json');
const c=json('CREATE_CANVAS_STRICT_CERTIFICATION_S17.json');
const r=json('CREATE_CANVAS_WORKSPACE_READINESS_S17.json');
const n=json('CREATE_CANVAS_COVERAGE_S17.json');
assert.equal(c.paths.length,208);assert.equal(n.paths.length,208);
for(let i=0;i<208;i++){
 const path=c.paths[i].optionPath;
 test('S17 208 original exact strict ledger path '+path,()=>{
  assert.equal(b.paths[i].optionPath,path);
  assert.equal(r.paths[i].optionPath,path);
  assert.equal(n.paths[i].optionPath,path);
  assert.equal(n.paths[i].strictStatusS17,c.paths[i].strictStatus);
  assert.equal(n.paths[i].workspaceStatusS17,r.paths[i].workspaceStatus);
  assert.equal(c.paths[i].runtimePin,'379a5248f09ed39c1b1734fe104b6bd73a77857f');
  assert.ok(c.paths[i].pinnedDeclaration&&c.paths[i].pinnedSource);
  const record=c.paths[i];
  if(record.strictStatus==='FULL'){
   assert.equal(record.readinessS17,'WORKSPACE_READY');
   assert.ok(record.evidenceIds.length>=2,'Need independent strict evidence IDs '+path);
   assert.ok(record.evidenceFiles.length>0,'No exact test source '+path);
   assert.ok(Object.values(record.strictGate).every(Boolean),'Incomplete proven strict gate '+path);
  }else if(record.strictStatus==='PARTIAL_CERTIFICATION'){
   assert.ok(record.unprovenRequirement?.length>20,'Exact remaining gap required '+path);
  }else if(record.strictStatus==='BLOCKED_SECURITY'){
   assert.ok(path.startsWith('canvas.videoBg'),'Security boundary widened unexpectedly '+path);
  }else if(record.strictStatus==='BLOCKED_UPSTREAM'){
   assert.ok(record.classificationReason.length>20);
  }else assert.equal(path,'painterOpts.resolveAssetRefs');
 });
}
test('S17 global strict certificate totals and unchanged pin',()=>{
 assert.deepEqual(c.strictSummary,{FULL:124,PARTIAL_CERTIFICATION:51,BLOCKED_UPSTREAM:6,BLOCKED_SECURITY:26,NOT_APPLICABLE:1});
 assert.equal(r.workspaceReadyCount,167);
 assert.equal(c.paths.filter((x:any)=>x.strictStatus==='FULL'&&b.paths[x.index].workspaceStatus==='WORKSPACE_READY').length,123);
 assert.equal(c.paths.find((x:any)=>x.optionPath==='canvas.shadow.roundedCorners').strictStatus,'FULL');
 assert.equal(n.summary.fullyCertified,124);
 assert.ok(Object.keys(c.freshEvidenceRegistry).length>=14);
 assert.equal(new Set(c.paths.map((x:any)=>x.optionPath)).size,208);
});
