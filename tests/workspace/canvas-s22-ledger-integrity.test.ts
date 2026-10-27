import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
const load=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const previous=load('docs/workspace/CREATE_CANVAS_STRICT_CERTIFICATION_S21.json');
const next=load('docs/workspace/CREATE_CANVAS_STRICT_CERTIFICATION_S22.json');
const matrix=load('docs/workspace/CREATE_CANVAS_COVERAGE_S22.json');
const packageInfo=load('package.json'),lock=load('package-lock.json'),doc4=load('generated/docs-doc4/api-manifest.json');
const pin='b6ca97cfc675b16a52c2c7b5d0ff881b87b911be';
const statuses=['FULL','PARTIAL_CERTIFICATION','BLOCKED_UPSTREAM','BLOCKED_SECURITY','NOT_APPLICABLE'];
test('S22 preserves the exact 208-path S21 baseline and promotes only nine genuinely proved native leaves',()=>{
 assert.deepEqual(previous.strictSummary,{FULL:170,PARTIAL_CERTIFICATION:7,BLOCKED_UPSTREAM:4,BLOCKED_SECURITY:26,NOT_APPLICABLE:1});
 assert.equal(next.paths.length,208);
 assert.deepEqual(next.paths.map((x:any)=>[x.index,x.optionPath]),previous.paths.map((x:any)=>[x.index,x.optionPath]));
 const improved=next.paths.filter((x:any,i:number)=>x.strictStatus!==previous.paths[i].strictStatus);
 assert.deepEqual(improved.map((x:any)=>x.optionPath).sort(),[...next.s22FullPromotions].sort());
 assert.equal(improved.length,9);assert.ok(improved.every((x:any)=>x.strictStatus==='FULL'));
 for(const path of improved){assert.equal(path.unprovenRequirement,null);assert.ok(Object.values(path.strictGate).every(Boolean));assert.equal(path.runtimePin,pin)}
 assert.deepEqual(next.strictSummary,{FULL:179,PARTIAL_CERTIFICATION:2,BLOCKED_UPSTREAM:0,BLOCKED_SECURITY:26,NOT_APPLICABLE:1});
 for(const status of statuses)assert.equal(next.paths.filter((x:any)=>x.strictStatus===status).length,next.strictSummary[status]);
 assert.deepEqual(matrix.strictSummary,next.strictSummary);
 assert.equal(matrix.totalPaths,208);
});
test('S22 exact GitHub pin matches DOC-4, lock and engine ledger; no local production tarball',()=>{
 assert.equal(packageInfo.dependencies['apexify.js'],'github:EIAS79/Apexify.js#'+pin);
 assert.equal(doc4.package.commit,pin);
 assert.ok(lock.packages['node_modules/apexify.js'].resolved.endsWith('#'+pin));
 assert.equal(next.enginePin,pin);assert.equal(matrix.engineCommit,pin);
 assert.deepEqual(Object.keys(next.s22EvidenceRegistry.nativeBrowser).sort(),[...next.s22FullPromotions].sort());
});
test('S22 preserves all 26 video-related security blocks, legacy ambiguity, and N/A path',()=>{
 const blocked=(ledger:any)=>ledger.paths.filter((x:any)=>x.strictStatus==='BLOCKED_SECURITY').map((x:any)=>x.optionPath).sort();
 assert.equal(blocked(previous).length,26);assert.deepEqual(blocked(next),blocked(previous));
 assert.deepEqual(next.paths.filter((x:any)=>x.strictStatus==='PARTIAL_CERTIFICATION').map((x:any)=>x.optionPath).sort(),['canvas.blendMode','canvas.shadow.borderPosition']);
 assert.equal(next.paths.find((x:any)=>x.optionPath==='painterOpts.resolveAssetRefs').strictStatus,'NOT_APPLICABLE');
 assert.throws(()=>validateCanvasExtras({videoBg:{source:'https://invalid.example/clip.mp4'}}),/unsupported keys/i);
 assert.equal(next.allReadyFull,false);
});
