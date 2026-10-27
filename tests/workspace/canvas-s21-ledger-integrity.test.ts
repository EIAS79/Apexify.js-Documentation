import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(n:string)=>JSON.parse(readFileSync('docs/workspace/'+n,'utf8'));
const s18=read('CREATE_CANVAS_STRICT_CERTIFICATION_S18.json');
const s21=read('CREATE_CANVAS_STRICT_CERTIFICATION_S21.json');
const cov18=read('CREATE_CANVAS_COVERAGE_S18.json');
const cov21=read('CREATE_CANVAS_COVERAGE_S21.json');
const ready18=read('CREATE_CANVAS_WORKSPACE_READINESS_S18.json');
const ready21=read('CREATE_CANVAS_WORKSPACE_READINESS_S21.json');
const add=new Set(['canvas.patternBg.repeat','canvas.bgLayers.pattern.repeat','canvas.shadow.borderRadius']);
const oldAlias='canvas.shadow.borderPosition';
test('S21 all 208 exact IDs, ordering, pinned-source references and unrelated prior evidence unchanged',()=>{
 assert.equal(s21.paths.length,208);assert.equal(cov21.paths.length,208);assert.equal(ready21.paths.length,208);
 assert.equal(new Set(s21.paths.map((x:any)=>x.optionPath)).size,208);
 for(let i=0;i<208;i++){
  const old=s18.paths[i],next=s21.paths[i];
  assert.equal(old.optionPath,next.optionPath);assert.equal(old.index,i);assert.equal(next.index,i);
  assert.equal(next.optionPath,cov21.paths[i].optionPath);assert.equal(next.optionPath,ready21.paths[i].optionPath);
  assert.deepEqual(cov21.paths[i].strictStatusS18,cov18.paths[i].strictStatusS18);
  assert.equal(ready21.paths[i].workspaceStatus,ready18.paths[i].workspaceStatus);
  assert.equal(next.pinnedSource,old.pinnedSource);
  assert.equal(next.pinnedDeclaration,old.pinnedDeclaration);
  if(!add.has(old.optionPath)&&old.optionPath!==oldAlias)assert.deepEqual(next,old,'Unapproved prior S18 strict path mutated: '+old.optionPath);
  if(old.strictStatus==='FULL')assert.equal(next.strictStatus,'FULL','One of 167 accepted FULL paths lost '+old.optionPath);
 }
});
test('S21 exact three modern FULL promotions and one deprecated legacy compatibility remaining PARTIAL',()=>{
 const changes=s21.paths.filter((x:any,i:number)=>x.strictStatus!==s18.paths[i].strictStatus);
 assert.deepEqual(changes.map((x:any)=>x.optionPath).sort(),[...add].sort());
 for(const id of add){
  const now=s21.paths.find((x:any)=>x.optionPath===id);
  assert.equal(now.strictStatus,'FULL');assert.equal(now.runtimePin,'9fe8b95f372efdadcd5ebdab1e9f6333413187c6');
  for(const v of Object.values(now.strictGate))assert.equal(v,true,id);
  assert.equal(now.s21Certification.nativePixelsDiffer,true);
  assert.equal(now.s21Certification.browserInspectorNativeChanged,true);
  assert.equal(now.s21Certification.browserGraphNativeChanged,true);
  assert.equal(now.s21Certification.indexedDbReload,true);
  assert.equal(now.s21Certification.browserExecutablePublicCodeParity,true);
 }
 const alias=s21.paths.find((x:any)=>x.optionPath===oldAlias);
 assert.equal(alias.strictStatus,'PARTIAL_CERTIFICATION');
 assert.equal(alias.s21Certification.browserInspectorNativeChanged,true);
 assert.equal(alias.s21Certification.browserGraphNativeChanged,true);
 assert.ok(alias.classificationReason.includes('DEPRECATED_COMPATIBILITY_PROVEN'));
});
test('S21 candidate-only strict counts truthful, prior S18 ledger preserved',()=>{
 const counts=Object.fromEntries(['FULL','PARTIAL_CERTIFICATION','BLOCKED_UPSTREAM','BLOCKED_SECURITY','NOT_APPLICABLE'].map(key=>[key,s21.paths.filter((x:any)=>x.strictStatus===key).length]));
 assert.deepEqual(counts,{FULL:170,PARTIAL_CERTIFICATION:7,BLOCKED_UPSTREAM:4,BLOCKED_SECURITY:26,NOT_APPLICABLE:1});
 assert.deepEqual(s21.strictSummary,counts);
 assert.equal(s21.enginePin,'9fe8b95f372efdadcd5ebdab1e9f6333413187c6');
 assert.equal(s18.enginePin,'379a5248f09ed39c1b1734fe104b6bd73a77857f');
 assert.equal(s18.paths.filter((x:any)=>x.strictStatus==='FULL').length,167);
 assert.equal(ready21.workspaceReadyCount,170);
 assert.equal(ready21.strictFullCount,170);
 assert.equal(cov21.summary.fullyCertified,170);
 assert.equal(s21.s21VerifiedDeprecatedCompatOnly[0],oldAlias);
 for(const x of s21.paths.filter((x:any)=>x.strictStatus==='BLOCKED_SECURITY'))assert.ok(x.optionPath.startsWith('canvas.videoBg'));
 assert.equal(s21.paths.find((x:any)=>x.strictStatus==='NOT_APPLICABLE')?.optionPath,'painterOpts.resolveAssetRefs');
});
