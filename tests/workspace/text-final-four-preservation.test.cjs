const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),source='docs/workspace/TEXT01_STRICT_CERTIFICATION_444.json';
const old=JSON.parse(execFileSync('git',['-C',root,'show','39f2f9772a5dca36ed392c44566a40421a4c978b:'+source],{maxBuffer:16*1024*1024}).toString('utf8'));
const now=JSON.parse(fs.readFileSync(path.join(root,source),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'evidence/workspace-text/strict/final-four/promotion-manifest.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('TEXT01 final four targeted: all 440 other records and original identity/order preserved',()=>{
 assert.equal(now.records.length,444);assert.equal(old.records.length,444);
 assert.deepEqual(now.counts,{FULL:440,PARTIAL:2,BLOCKED:1,EXCLUDED:1});
 const targets=new Set(['createText.TextProperties.font.family','createText.TextProperties.font.name',
  'measureText.TextMetrics.hangingBaseline','measureText.TextMetrics.ideographicBaseline']);
 for(let i=0;i<444;i++){const a=old.records[i],b=now.records[i];
  assert.equal(b.id,a.id);assert.equal(b.ordinal,a.ordinal);assert.equal(b.api,a.api);
  assert.equal(b.originalStatus,a.originalStatus);assert.equal(b.canonicalModel,a.canonicalModel);
  if(!targets.has(a.api))assert.deepEqual(b,a,'Unexpected non-target modification '+a.api);
 }
 assert.equal(targets.size,4);
});
test('TEXT01 target promotion SHA and security exclusions unchanged',()=>{
 assert.equal(manifest.ledgerSha256,sha(fs.readFileSync(path.join(root,source))));
 assert.equal(manifest.baselineLedgerSha256,'d68473dc0656eb7b59107ed24a82a665373286a855e73d37d0f225eeB00304ba'.toLowerCase());
 assert.equal(manifest.promoted.length,2);assert.equal(manifest.optional.length,2);
 assert.equal(now.records.find(x=>x.api==='createText.TextProperties.font.path').classification,'BLOCKED');
 assert.equal(now.records.filter(x=>x.classification==='EXCLUDED').length,1);
 assert.equal(now.originalInventorySha256,old.originalInventorySha256);
 assert.equal(now.enginePIN,old.enginePIN);
});
