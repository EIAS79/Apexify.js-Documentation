const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const cwd=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(path.join(cwd,p),'utf8'));
const inv=read('docs/workspace/TEXT_OPTION_INVENTORY_TEXT01.json'),ledger=read('docs/workspace/TEXT01_STRICT_CERTIFICATION_444.json');
test('TEXT01 pinned canonical inventory path/ordering completeness',()=>{
 assert.equal(inv.engine,ledger.enginePIN);
 assert.equal(inv.engine,'379a5248f09ed39c1b1734fe104b6bd73a77857f');
 assert.equal(inv.results.length,444);assert.equal(ledger.records.length,444);
 assert.equal(new Set(ledger.records.map(x=>x.api)).size,444);
 inv.results.forEach((s,i)=>{const r=ledger.records[i];assert.equal(r.api,s.api);assert.equal(r.originalStatus,s.status);assert.equal(r.canonicalModel,s.model)});
 assert.equal(ledger.originalInventorySha256,sha(fs.readFileSync(path.join(cwd,'docs/workspace/TEXT_OPTION_INVENTORY_TEXT01.json'))));
 assert.deepEqual(ledger.counts,{FULL:440,PARTIAL:2,BLOCKED:1,EXCLUDED:1});
});
test('TEXT01 every FULL authoring path has traceable native, Code, control, lifecycle, output and project proof',()=>{
 const records=ledger.records.filter(x=>x.originalStatus==='WORKSPACE_READY');
 assert.equal(records.length,399);assert.equal(records.filter(x=>x.classification==='FULL').length,399);
 for(const r of records.filter(x=>x.classification==='FULL')){
  for(const key of ['native','generatedExecutableCode','inspector','history','indexedDB','reload','projectExportImport','browserNativePreview','actualEffect']){
   assert.ok(r.proof[key]?.length>0,r.api+' missing '+key);
  }
  if(r.api.startsWith('createText.CreateTextOptions.')||r.api.startsWith('createText.TextProperties[].')||r.api.startsWith('createText.TextProperties.')){
   if(!['createText.TextProperties.text','createText.TextProperties.x','createText.TextProperties.y'].includes(r.api)&&!r.api.includes(' baseline')) assert.ok(r.proof.graph.length>0,r.api+' graph proof missing');
  }
  assert.ok(r.proof.indexedDB[0].id.startsWith('LIFE-'));
  assert.ok(r.proof.inspector[0].id.startsWith('UI-'));
 }
});
test('TEXT01 measurement outputs and deliberate exclusions',()=>{
 const m=ledger.records.filter(x=>x.originalStatus==='WORKSPACE_READY_RESULT');
 assert.equal(m.length,43);assert.equal(m.filter(x=>x.classification==='FULL').length,41);
 const partial=ledger.records.filter(x=>x.classification==='PARTIAL').map(x=>x.api).sort();
 assert.deepEqual(partial,[
 'measureText.TextMetrics.hangingBaseline','measureText.TextMetrics.ideographicBaseline'].sort());
 assert.equal(ledger.records.filter(x=>x.classification==='BLOCKED').length,1);
 assert.ok(ledger.records.find(x=>x.classification==='BLOCKED').api.includes('font.path'));
 assert.equal(ledger.records.filter(x=>x.classification==='EXCLUDED').length,1);
});
function requireConsistentFullRecord(r){
 if(r.classification!=='FULL')return;
 const p=r.proof||{},ui=r.browser||{};
 assert.match(r.fullCertificationGate||'',/^PASS:/,'FULL still open or missing PASS gate: '+r.api);
 assert.doesNotMatch(r.fullCertificationGate,/\\bOPEN\\b|UNPROVEN|incomplete/i,'FULL has contradiction: '+r.api);
 assert.ok(p.native?.length>0&&p.generatedExecutableCode?.length>0,'FULL native/Code proof missing: '+r.api);
 if(r.originalStatus==='WORKSPACE_READY'){
  assert.match(ui.perPathInspectorGraphUI||'',/^VERIFIED_PER_PATH_INSPECTOR/,'FULL UI not proven: '+r.api);
  for(const key of ['inspector','history','indexedDB','reload','projectExportImport','browserNativePreview','actualEffect'])
   assert.ok(p[key]?.length>0,'FULL '+r.api+' missing proof '+key);
  const inspectorId=p.inspector[0]?.id,lifeId=p.indexedDB[0]?.id,pngId=p.browserNativePreview[0]?.id;
  assert.ok(inspectorId&&lifeId&&pngId,'FULL UI proof IDs invalid: '+r.api);
  const dedicatedFontProof=Boolean(r.fontResolutionDependency);
  if(dedicatedFontProof){
   const specific=p.inspector.find(x=>x.id?.startsWith('UI-FOUR-FONT-'));
   assert.ok(specific,'New FULL font path lacks targeted Inspector/Graph proof '+r.api);
   assert.ok(p.graph?.some(x=>x.id===specific.id),'Targeted font Graph proof missing '+r.api);
   assert.ok(p.actualEffect?.some(x=>x.id?.startsWith('NATIVE-FOUR-FONT-')),'Targeted native font effect absent '+r.api);
   assert.ok(p.generatedExecutableCode?.some(x=>x.id?.startsWith('NATIVE-FOUR-FONT-')),'Targeted executable Code proof absent '+r.api);
   assert.ok(r.fullCertificationGate.includes('['+specific.id+']'),'Targeted FULL gate missing font transaction '+r.api);
   assert.ok(ui.perPathInspectorGraphUI.includes('UI='+specific.id),'Targeted browser proof ID missing '+r.api);
   assert.ok(ui.perPathInspectorGraphUI.includes('SERVER_NATIVE_PREVIEW_SHARED'),'Shared preview provenance absent '+r.api);
  }else{
   assert.ok(r.fullCertificationGate.includes('['+inspectorId+']'),'FULL gate missing Inspector ID: '+r.api);
   assert.ok(r.fullCertificationGate.includes('['+lifeId+']'),'FULL gate missing lifecycle ID: '+r.api);
   assert.ok(r.fullCertificationGate.includes('['+pngId+']'),'FULL gate missing shared renderer ID: '+r.api);
   assert.ok(ui.perPathInspectorGraphUI.includes('UI='+inspectorId),'FULL browser field not linked to per-path UI: '+r.api);
   assert.ok(ui.perPathInspectorGraphUI.includes('SHARED_SERVER_NATIVE_PNG='+pngId),'FULL browser field misses shared vs individual distinction: '+r.api);
  }
  const isBaseline=r.api.includes(' baseline')||r.api.startsWith('text selection bounds.')||
   ['createText.TextProperties.text','createText.TextProperties.x','createText.TextProperties.y'].includes(r.api);
  if(isBaseline){
   assert.match(ui.perPathInspectorGraphUI,/GRAPH_NOT_SEPARATE_BASELINE_CONTROL/,'Baseline graph distinction missing '+r.api);
   assert.equal(p.graph?.length||0,0,'Baseline unexpectedly claims per-path Graph edit '+r.api);
  } else{
   assert.match(ui.perPathInspectorGraphUI,/^VERIFIED_PER_PATH_INSPECTOR_GRAPH_HISTORY/,'FULL Graph field unproven '+r.api);
   assert.ok(p.graph?.some(x=>x.id===inspectorId),'Graph UI proof ID not matching Inspector for '+r.api);
  }
 }else if(r.originalStatus==='WORKSPACE_READY_RESULT'){
  assert.equal(ui.perPathInspectorGraphUI,'NOT_SEPARATE_INPUT','Read-only metric incorrectly treated as edit control '+r.api);
  assert.ok(p.measurement?.some(x=>x.present===true),'FULL metric not observed in browser JSON '+r.api);
  assert.match(r.fullCertificationGate,/read-only.*TextMetrics/i,'Metric FULL gate not read-only '+r.api);
 }else assert.fail('Unsupported FULL status '+r.originalStatus+' '+r.api);
}
test('TEXT01 corrected ledger SHA-256, exact inventory and immutable classification checksum',()=>{
 const manifest=read('evidence/workspace-text/strict/ledger-consistency-reconciliation.json');
 const corrected=sha(fs.readFileSync(path.join(cwd,'docs/workspace/TEXT01_STRICT_CERTIFICATION_444.json')));
 assert.equal(manifest.correctedLedgerSha256,ledger.targetedFourReview.parentLedgerSha256,'Historical correction baseline drift');
 const fontManifest=read('evidence/workspace-text/strict/final-four/promotion-manifest.json');
 assert.equal(fontManifest.ledgerSha256,corrected,'Targeted four-path promotion hash drift');
 assert.deepEqual(fontManifest.counts,ledger.counts);
 assert.equal(manifest.originalInventorySha256,ledger.originalInventorySha256);
 assert.equal(manifest.uncorrectedLedgerSha256,'81807c8703828aaa7a67d97a6006b7dc501ad0745ed290c8135b5472d1b95881');
 assert.deepEqual(manifest.counts,{FULL:438,PARTIAL:4,BLOCKED:1,EXCLUDED:1});
 assert.equal(manifest.graphVerified,387);
 assert.equal(manifest.baselineInspectorOnly,10);
 assert.equal(manifest.fullAuthoring,397);
 assert.equal(manifest.fullMeasurement,41);
});
test('TEXT01 FULL certification gate and browser state must never contradict proof',()=>{
 const full=ledger.records.filter(r=>r.classification==='FULL');
 assert.equal(full.length,440);
 assert.equal(full.filter(r=>r.originalStatus==='WORKSPACE_READY').length,399);
 assert.equal(full.filter(r=>r.originalStatus==='WORKSPACE_READY_RESULT').length,41);
 for(const r of full)requireConsistentFullRecord(r);
 const first=full.find(r=>r.originalStatus==='WORKSPACE_READY');
 const metric=full.find(r=>r.originalStatus==='WORKSPACE_READY_RESULT');
 assert.throws(()=>requireConsistentFullRecord({...first,fullCertificationGate:'OPEN: old stale gate'}),/FULL still open|FULL has contradiction/);
 assert.throws(()=>requireConsistentFullRecord({...first,browser:{...first.browser,perPathInspectorGraphUI:'UNPROVEN_FOR_THIS_INVENTORY_PATH'}}),/FULL UI not proven/);
 assert.throws(()=>requireConsistentFullRecord({...metric,fullCertificationGate:'OPEN: stale measurement gate'}),/FULL still open|FULL has contradiction/);
 assert.throws(()=>requireConsistentFullRecord({...metric,browser:{...metric.browser,perPathInspectorGraphUI:'UNPROVEN_FOR_THIS_INVENTORY_PATH'}}),/Read-only metric incorrectly/);
});
test('TEXT01 two font promotions are backed by real glyph and metric differences, native/generated pixel parity and actual browser transactions',()=>{
 const proof=read('evidence/workspace-text/strict/final-four/font-native-registration-and-optional-metrics.json');
 const generated=read('evidence/workspace-text/strict/final-four/font-generated-code-equivalence.json');
 const browser=read('evidence/workspace-text/strict/final-four/font-browser-targeted.json');
 const contract=read('evidence/workspace-text/strict/final-four/engine-contract-audit.json');
 assert.ok(contract.engineSource.lineNumbers.nameOverridesFamily>0);
 assert.ok(proof.fontSources.every(x=>x.fileExists&&x.sourceSha256&&x.registeredResult!==null));
 for(const key of ['family','name']){
  const api='createText.TextProperties.font.'+key,record=ledger.records.find(x=>x.api===api);
  assert.equal(record.classification,'FULL');
  const cases=generated.cases.filter(x=>x.path===api);assert.equal(cases.length,2);
  assert.ok(cases.every(x=>x.pixelEquality&&x.codeExecution==='PASS'&&x.codeToVisual==='PASS'));
  assert.notEqual(cases[0].nativeSha256,cases[1].nativeSha256);
  assert.notEqual(cases[0].measuredWidth,cases[1].measuredWidth);
  const browserProof=browser.results.find(x=>x.api===api);
  assert.equal(browserProof.status,'PASS');assert.equal(browserProof.inspector.model,'Arial');
  for(const key of ['graph','indexedDB','reloaded','exportedValue','imported']){
   assert.equal(key==='graph'?browserProof[key].model:browserProof[key],'Courier New');
  }
  assert.equal(browserProof.undo,'Arial');assert.equal(browserProof.redo,'Courier New');
  assert.ok(browserProof.serverNativePng.changed);
  assert.equal(record.native.anyVisiblePixelChange,true);
  assert.ok(record.proof.actualEffect.some(x=>x.id.startsWith('NATIVE-FOUR-FONT-')));
 }
});
test('TEXT01 optional baseline native absences follow pinned TypeScript and finite-number forwarding contract',()=>{
 const contract=read('evidence/workspace-text/strict/final-four/engine-contract-audit.json');
 const registration=read('evidence/workspace-text/strict/final-four/font-native-registration-and-optional-metrics.json');
 for(const key of ['hangingBaseline','ideographicBaseline']){
  const record=ledger.records.find(x=>x.api==='measureText.TextMetrics.'+key);
  assert.equal(record.classification,'PARTIAL');
  assert.equal(record.sourceOptionalDisposition,'COMPLIANT_OPTIONAL_ABSENCE_UNOBSERVED');
  assert.ok(contract.engineDeclaration.optionalNumeric.includes(key));
  assert.equal(registration.underlyingCanvasOptionalMetrics[key].present,false);
  assert.equal(record.browser.perPathInspectorGraphUI,'NOT_SEPARATE_INPUT');
  assert.match(record.fullCertificationGate,/^PARTIAL: legitimate optional property absent/);
  assert.ok(record.proof.measurement.some(x=>x.id.startsWith('ENGINE-OPTIONAL-BASELINE-')));
 }
});
test('TEXT01 every cited browser file exists and retains recorded SHA-256',()=>{
 const checked=new Map();
 for(const r of ledger.records){
  for(const arr of Object.values(r.proof||{})){
   if(!Array.isArray(arr))continue;
   for(const ev of arr){
    if(!ev||!ev.file||!ev.fileSha256)continue;
    const p=path.join(cwd,ev.file);
    assert.ok(fs.existsSync(p),'MISSING: '+ev.file);
    if(!checked.has(p))checked.set(p,sha(fs.readFileSync(p)));
    assert.equal(checked.get(p),ev.fileSha256,'CHECKSUM_MISMATCH: '+ev.file+' for '+r.api);
   }
  }
 }
 assert.ok(checked.size>=12);
});
