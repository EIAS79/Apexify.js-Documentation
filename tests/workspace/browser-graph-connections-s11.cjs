/* Supervisor #11: real typed Graph connect, undo/redo, IDB and exact latest pixel verification with decoded full-image verification. */
const assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(path.join(process.env.S11_PROJECT_ROOT,'node_modules/sharp'));
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const origin=process.env.S11_BROWSER_URL||'http://127.0.0.1:38480/workspace';
const evidence=process.env.S11_EVIDENCE_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts';
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
  catch(e){console.log('S11_BROWSER_INIT_DEBUG='+JSON.stringify(await page.evaluate(()=>({body:document.body.innerText.slice(0,1600),alerts:[...document.querySelectorAll('[role=alert]')].map(x=>x.innerText.slice(0,300)),busy:document.querySelector('.aw-app')?.getAttribute('aria-busy')}))));console.log('PAGE_EXCEPTIONS='+JSON.stringify(errors));throw e;}
  const beforeNew=await committed();
  await page.getByRole('button',{name:'New Project'}).click();
  await waitCommitted(x=>x.revision>(beforeNew?.revision??0),'new project');
  await page.waitForFunction(()=>{const g=document.querySelector('.aw-node-output img'),v=document.querySelector('.aw-visual .aw-render-image');return g?.complete&&v?.complete&&g.naturalWidth===1280&&v.naturalWidth===1280&&g.currentSrc===v.currentSrc;},null,{timeout:22000});
  const blank=await image();
  assert.ok(blank,'Canvas preview must decode before stroke authoring');
  const makeImage=async(name,r,g,b)=>{
    const png=await sharp({create:{width:18,height:15,channels:4,background:{r,g,b,alpha:1}}}).png().toBuffer();
    const hash=crypto.createHash('sha256').update(png).digest('hex');
    await page.getByLabel('Import canvas pattern image').setInputFiles({name,mimeType:'image/png',buffer:png});
    await waitCommitted(x=>x.doc.canvasExtras?.patternBg?.customPatternImage==='asset:'+hash,'asset '+name);
    await page.getByLabel('Canvas pattern type').selectOption('none');
    await waitCommitted(x=>!x.doc.canvasExtras?.patternBg,'clear root custom pattern');
    return 'asset:'+hash;
  };
  const a=await makeImage('s11-a.png',230,45,62);
  await page.getByRole('button',{name:'Add imported tile layer'}).click();
  const original=await waitCommitted(x=>x.doc.canvasExtras?.bgLayers?.[0]?.source===a,'first tile source');
  const stableId=original.doc.canvasExtras.bgLayers[0].nodeId;
  assert.match(stableId,/^layer:/,'new authored layer must have stable immutable graph identity');
  const pixA=await latest('graph initial first tile');
  const b=await makeImage('s11-b.png',45,157,239);
  const initialRevision=(await committed()).revision;
  await page.locator('.aw-graph-wiring > summary').click();
  await page.getByLabel('Graph output port').selectOption('canvas:image:'+b+'|output|image-asset');
  await page.getByLabel('Graph input port').selectOption('canvas:ordered-layer:'+stableId+'|input|image-asset');
  await page.getByRole('button',{name:'Connect graph ports'}).click();
  await waitCommitted(x=>x.revision>initialRevision&&x.doc.canvasExtras.bgLayers[0].source===b,'typed graph source connection');
  const pixB=await latest('graph source rewired');
  assert.notEqual(pixA.hash,pixB.hash,'connecting asset node must change actual decoded Visual/Graph pixels');
  assert.equal((await committed()).doc.canvasExtras.bgLayers[0].nodeId,stableId,'connection may not change stable layer ID');
  await page.getByLabel('Graph output port').selectOption('canvas:root|output|canvas');
  await page.getByRole('button',{name:'Connect graph ports'}).click();
  await page.locator('.aw-graph-wiring [role=alert]').getByText(/type mismatch/i).waitFor({state:'visible'});
  const invalidRevision=(await committed()).revision;
  assert.equal((await committed()).doc.canvasExtras.bgLayers[0].source,b,'wrong-type connection cannot mutate project');
  await page.getByLabel('Undo',{exact:true}).click();
  await waitCommitted(x=>x.doc.canvasExtras.bgLayers[0].source===a,'Graph wiring undo');
  assert.equal((await latest('graph wiring undo')).hash,pixA.hash);
  await page.getByLabel('Redo',{exact:true}).click();
  await waitCommitted(x=>x.doc.canvasExtras.bgLayers[0].source===b,'Graph wiring redo');
  assert.equal((await latest('graph wiring redo')).hash,pixB.hash);
  await page.screenshot({path:path.join(evidence,'supervisor11_graph_port_connected.png')});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:24000});
  const afterReload=await committed();
  assert.equal(afterReload.doc.canvasExtras.bgLayers[0].nodeId,stableId,'stable node IDs persist IndexedDB reload');
  assert.equal(afterReload.doc.canvasExtras.bgLayers[0].source,b);
  assert.equal((await latest('graph reload')).hash,pixB.hash);
  await page.screenshot({path:path.join(evidence,'supervisor11_graph_port_reloaded.png')});
  assert.deepEqual(errors,[],'no uncaught browser exceptions');
  console.log('S11_GRAPH_BROWSER_PASS='+JSON.stringify({a,b,stableId,first:pixA.hash,second:pixB.hash,revision:invalidRevision}));
 }finally{await browser.close()}
}
run().catch(e=>{console.error('S11_GRAPH_BROWSER_FAIL',e.stack||e);process.exitCode=1});
