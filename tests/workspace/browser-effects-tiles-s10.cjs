/* Supervisor #10: actual Chrome canvas stroke/Graph/tile asset/regression with decoded full-image verification. */
const assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(path.join(process.env.S10_PROJECT_ROOT,'node_modules/sharp'));
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const origin=process.env.S10_BROWSER_URL||'http://127.0.0.1:38480/workspace';
const evidence=process.env.S10_EVIDENCE_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts';
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1650,height:1030},acceptDownloads:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const committed=()=>page.evaluate(async()=>{
  const db=await new Promise((ok,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
  try{
   const tx=db.transaction('projects','readonly'),q=tx.objectStore('projects').get('active-project');
   const value=await new Promise((ok,no)=>{q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
   return value?{revision:value.revision,doc:value.document}:null;
  }finally{db.close()}
 });
 async function waitCommitted(fn,name){
  const start=Date.now();while(Date.now()-start<17000){
   const c=await committed();if(c&&fn(c))return c;
   await new Promise(r=>setTimeout(r,75));
  }throw Error(name+' not committed');
 }
 const image=()=>page.evaluate(async()=>{
  const a=document.querySelector('.aw-node-output img'),b=document.querySelector('.aw-visual .aw-render-image');
  if(!a||!b||!a.complete||!b.complete||!a.naturalWidth||!b.naturalWidth||a.currentSrc!==b.currentSrc)return null;
  try{await Promise.all([a.decode(),b.decode()]);}catch{return null;}
  const c=document.createElement('canvas');c.width=a.naturalWidth;c.height=a.naturalHeight;
  const ctx=c.getContext('2d');ctx.drawImage(a,0,0);
  const data=ctx.getImageData(0,0,c.width,c.height).data;
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
  return {hash,src:a.currentSrc,width:c.width,height:c.height};
 });
 async function latest(name){
  const expected=await page.evaluate(async()=>{
   const db=await new Promise((yes,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
   const tx=db.transaction(['projects','blobs'],'readonly'),get=q=>new Promise((yes,no)=>{q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
   const active=await get(tx.objectStore('projects').get('active-project'));
   const stored=await Promise.all((active.document.assets||[]).map(async asset=>({meta:asset,record:await get(tx.objectStore('blobs').get(asset.id))})));
   db.close();
   const hydratedAssets=await Promise.all(stored.map(async entry=>{
     if(!entry.record?.blob)throw Error('Missing immutable renderer asset '+entry.meta.id);
     const bytes=new Uint8Array(await entry.record.blob.arrayBuffer());let binary='';
     for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
     return {id:entry.meta.id,sha256:entry.meta.sha256,mime:entry.meta.mime,width:entry.meta.width,height:entry.meta.height,bytes:entry.meta.bytes,dataUri:'data:'+entry.meta.mime+';base64,'+btoa(binary)};
   }));
   const hydrated={...active.document,assets:hydratedAssets};
   let response;
   for(let attempt=0;attempt<7;attempt++){
    response=await fetch('/api/workspace/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(hydrated)});
    if(response.status!==429)break;
    const seconds=Math.max(1,Math.min(3,Number(response.headers.get('Retry-After')||'2')));
    await new Promise(resolve=>setTimeout(resolve,seconds*1000));
   }
   if(!response||response.status!==200)throw Error('Independent render failed '+response?.status+' '+(response?await response.text():'no response'));
   const bmp=await createImageBitmap(await response.blob());
   const c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;
   const ctx=c.getContext('2d');ctx.drawImage(bmp,0,0);bmp.close();
   const pixels=ctx.getImageData(0,0,c.width,c.height).data;
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels)),v=>v.toString(16).padStart(2,'0')).join('');
   return {hash,revision:active.revision};
  });
  const start=Date.now();
  while(Date.now()-start<27000){
   const displayed=await image();
   if(displayed?.hash===expected.hash)return {...displayed,revision:expected.revision};
   await new Promise(resolve=>setTimeout(resolve,85));
  }
  throw Error(name+' did not render committed revision '+expected.revision+' expected '+expected.hash+' actual '+JSON.stringify(await image()));
 }
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:65000});
  try{await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:17000});}
  catch(e){console.log('S10_BROWSER_INIT_DEBUG='+JSON.stringify(await page.evaluate(()=>({body:document.body.innerText.slice(0,1600),alerts:[...document.querySelectorAll('[role=alert]')].map(x=>x.innerText.slice(0,300)),busy:document.querySelector('.aw-app')?.getAttribute('aria-busy')}))));console.log('PAGE_EXCEPTIONS='+JSON.stringify(errors));throw e;}
  const beforeNew=await committed();
  await page.getByRole('button',{name:'New Project'}).click();
  await waitCommitted(x=>x.revision>(beforeNew?.revision??0),'new project');
  await page.waitForFunction(()=>{const g=document.querySelector('.aw-node-output img'),v=document.querySelector('.aw-visual .aw-render-image');return g?.complete&&v?.complete&&g.naturalWidth===1280&&v.naturalWidth===1280&&g.currentSrc===v.currentSrc;},null,{timeout:22000});
  const blank=await image();
  assert.ok(blank,'Canvas preview must decode before stroke authoring');
  await page.getByLabel('Canvas stroke enabled').check();
  await waitCommitted(x=>x.doc.canvasExtras?.stroke?.width===8,'enable stroke');
  const solid=await latest('solid stroke');
  assert.notEqual(solid.hash,blank.hash,'actual stroke must change decoded pixels');
  await page.getByLabel('Canvas stroke style').selectOption('dotted');
  await waitCommitted(x=>x.doc.canvasExtras?.stroke?.style==='dotted','dotted stroke');
  const dotted=await latest('dotted stroke');
  assert.notEqual(dotted.hash,solid.hash,'dotted must differ from solid stroke');
  await page.locator('.aw-graph-semantic-properties > summary').click();
  await page.getByLabel('Graph stroke style').selectOption('dashed');
  await waitCommitted(x=>x.doc.canvasExtras?.stroke?.style==='dashed','Graph stroke');
  const dashed=await latest('graph dashed stroke');
  assert.notEqual(dashed.hash,dotted.hash,'typed Graph stroke edit must affect decoded Visual+Graph output');
  await page.getByLabel('Undo',{exact:true}).click();
  await waitCommitted(x=>x.doc.canvasExtras?.stroke?.style==='dotted','stroke undo');
  assert.equal((await latest('stroke undo')).hash,dotted.hash,'Undo must restore exact decoded pixels');
  await page.getByLabel('Redo',{exact:true}).click();
  await waitCommitted(x=>x.doc.canvasExtras?.stroke?.style==='dashed','stroke redo');
  assert.equal((await latest('stroke redo')).hash,dashed.hash,'Redo must restore exact decoded pixels');
  const png=await sharp({create:{width:20,height:16,channels:4,background:{r:241,g:73,b:42,alpha:1}}}).png().toBuffer();
  const sha=crypto.createHash('sha256').update(png).digest('hex');
  await page.getByLabel('Import canvas pattern image').setInputFiles({name:'tile-s10.png',mimeType:'image/png',buffer:png});
  await waitCommitted(x=>x.doc.canvasExtras?.patternBg?.customPatternImage==='asset:'+sha,'tile import');
  // Root opaque repeating custom pattern would cover the underlying ordered tile.
  // Clear only the root primary, retain the immutable asset and verify the layer on its own.
  await page.getByLabel('Canvas pattern type').selectOption('none');
  await waitCommitted(x=>!x.doc.canvasExtras?.patternBg,'root pattern clear');
  await page.getByRole('button',{name:'Add imported tile layer'}).click();
  await waitCommitted(x=>x.doc.canvasExtras?.bgLayers?.[0]?.type==='pattern','source-backed layer');
  const tiled=await latest('tiled asset');
  await page.getByLabel('Layer 1 pattern repeat').selectOption('no-repeat');
  await waitCommitted(x=>x.doc.canvasExtras.bgLayers[0].repeat==='no-repeat','no-repeat tile');
  const untiled=await latest('untiled asset');
  assert.notEqual(untiled.hash,tiled.hash,'true image-tile repeat modes must alter full decoded pixels');
  await page.screenshot({path:path.join(evidence,'supervisor10_stroke_tile_workspace.png')});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:24000});
  assert.equal((await committed()).doc.canvasExtras.bgLayers[0].repeat,'no-repeat');
  assert.equal((await latest('tile reload')).hash,untiled.hash,'durable asset layer persists latest pixels');
  await page.screenshot({path:path.join(evidence,'supervisor10_stroke_tile_reloaded.png')});
  assert.deepEqual(errors,[]);
  console.log('S10_CANVAS_EFFECTS_BROWSER_PASS='+JSON.stringify({blank:blank.hash,stroke:solid.hash,graph:dashed.hash, tile:tiled.hash,noRepeat:untiled.hash,asset:sha}));
 }finally{await browser.close()}
}
run().catch(e=>{console.error('S10_CANVAS_EFFECTS_BROWSER_FAIL',e.stack||e);process.exitCode=1});
