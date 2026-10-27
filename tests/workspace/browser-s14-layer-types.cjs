const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const sharp=require(path.join(process.env.TEMP,'apexify-supervisor12-isolated-fullsource/node_modules/sharp'));
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await b.newPage({viewport:{width:1900,height:1150}}),problems=[],checks=[];
 page.on('pageerror',e=>problems.push(e.message));
 async function state(){return page.evaluate(async()=>{
   const db=await new Promise((a,n)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>a(q.result);q.onerror=()=>n(q.error)});
   try{const r=db.transaction('projects','readonly').objectStore('projects').get('active-project');return await new Promise((a,n)=>{r.onsuccess=()=>a(r.result);r.onerror=()=>n(r.error)})}finally{db.close()}
 })}
 async function wait(fn,label){let rec;const t=Date.now();while(Date.now()-t<16000){rec=await state();if(rec&&fn(rec))return rec;await page.waitForTimeout(60)}throw Error('Uncommitted '+label)}
 try{
  await page.goto('http://127.0.0.1:38496/workspace',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:45000});
  await page.getByRole('button',{name:'New Project'}).click();
  await wait(s=>s.document?.width===1280,'New Project');
  const pixels=await sharp({create:{width:34,height:14,channels:4,background:{r:111,g:176,b:226,alpha:1}}}).png().toBuffer();
  const hash=crypto.createHash('sha256').update(pixels).digest('hex');
  await page.getByLabel('Import canvas image background layer').setInputFiles({name:'tile.png',mimeType:'image/png',buffer:pixels});
  await wait(s=>s.document.canvasExtras?.bgLayers?.some(l=>l.type==='image'&&l.source==='asset:'+hash),'Imported verified image');
  await page.getByRole('button',{name:'Add color layer'}).click();
  const initial=await wait(s=>s.document.canvasExtras?.bgLayers?.length===2,'two layers');
  const stable=initial.document.canvasExtras.bgLayers[1].nodeId;
  for(const kind of ['gradient','presetPattern','noise','image','pattern','color']){
   const old=await state();
   await page.getByLabel('Background layer 2 type',{exact:true}).selectOption(kind);
   const rec=await wait(s=>s.revision>old.revision&&s.document.canvasExtras.bgLayers[1].type===kind,'type '+kind);
   const layer=rec.document.canvasExtras.bgLayers[1];
   assert.equal(layer.nodeId,stable);
   assert.ok(!(kind==='noise'&&'opacity' in layer),'Noise must not retain alpha');
   if(kind==='image'||kind==='pattern')assert.equal(layer.source,'asset:'+hash);
   if(kind==='gradient')assert.equal(layer.value.type,'linear');
   if(kind==='presetPattern')assert.equal(layer.pattern.type,'grid');
   checks.push({kind,nodeId:layer.nodeId,revision:rec.revision});
  }
  const prior=await state();
  await page.getByLabel('Width',{exact:true}).fill('999999');
  await page.getByLabel('Width',{exact:true}).blur();
  await page.waitForTimeout(300);
  const after=await state();
  assert.equal(after.document.width,1280,'Invalid dimension must not mutate canonical project');
  assert.equal(await page.getByLabel('Width',{exact:true}).inputValue(),'1280','Invalid draft must restore valid model width');
  assert.equal(after.revision,prior.revision,'Invalid input must not create history revision');
  await page.getByLabel('Undo',{exact:true}).click();
  await wait(s=>s.document.canvasExtras.bgLayers[1].type!=='color','Undo layer type');
  await page.getByLabel('Redo',{exact:true}).click();
  await wait(s=>s.document.canvasExtras.bgLayers[1].type==='color','Redo layer type');
  const download=page.waitForEvent('download');await page.getByLabel('Download source').click();
  const file=await download;const source=await fs.readFile(await file.path(),'utf8');
  assert.ok(source.includes('ApexPainter')&&source.includes('createCanvas('));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:30000});
  const last=await state();
  assert.equal(last.document.canvasExtras.bgLayers.length,2);
  assert.equal(last.document.canvasExtras.bgLayers[1].type,'color');
  assert.equal(last.document.canvasExtras.bgLayers[1].nodeId,stable);
  assert.deepEqual(problems,[]);
  const p='D:/ApexifySupervisor5LocalBuildArtifacts/supervisor14_live_ui/layer_type_integrity.json';
  await fs.writeFile(p,JSON.stringify({checks,asset:hash,invalidRejected:true,history:true,reloaded:true,sourceChecked:true},null,2));
  console.log('S14_SIX_LAYER_TYPES_AND_INVALID_BOUNDARY_PASS='+JSON.stringify({types:checks.length,invalidRejected:true,reloaded:true,asset:hash,browser:b.version()}));
 }finally{await b.close()}
})().catch(e=>{console.error('S14_LAYER_TYPES_FAIL',e.stack||e);process.exitCode=1});
