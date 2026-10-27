/* Supervisor #11: solid/transparent complete canvas background Graph-Visual-Code-render acceptance with decoded full-image verification. */
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
  // Background group: Graph->Visual, transparent alpha, typed connect, undo/redo and reload.
  await page.locator('.aw-graph-wiring > summary').click();
  const original=await latest('initial solid background');
  await page.getByLabel('Graph solid background color').fill('#4f29a6');
  await waitCommitted(x=>x.doc.background.color==='#4f29a6'&&x.doc.background.mode==='color','Graph solid color');
  const colored=await latest('Graph solid color edit');
  assert.notEqual(original.hash,colored.hash,'Graph paint must change actual decoded Visual/Graph pixels');
  const sampled=await page.evaluate(()=>{
    const img=document.querySelector('.aw-visual .aw-render-image');
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    const cx=c.getContext('2d');cx.drawImage(img,0,0);return Array.from(cx.getImageData(640,360,1,1).data);
  });
  assert.deepEqual(sampled,[0x4f,0x29,0xa6,255],'opaque solid color exact central RGBA');
  await page.getByLabel('Graph transparent canvas').check();
  await waitCommitted(x=>x.doc.background.transparent===true,'Graph alpha transparent');
  const transparent=await latest('transparent Graph');
  assert.notEqual(transparent.hash,colored.hash);
  const alpha=await page.evaluate(()=>{
    const img=document.querySelector('.aw-visual .aw-render-image');
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    const cx=c.getContext('2d');cx.drawImage(img,0,0);return cx.getImageData(640,360,1,1).data[3];
  });
  assert.equal(alpha,0,'transparentBase must yield truly zero alpha');
  await page.getByLabel('Graph output port').selectOption('canvas:color:root|output|color');
  await page.getByLabel('Graph input port').selectOption('canvas:background|input|color');
  await page.getByRole('button',{name:'Connect graph ports'}).click();
  await waitCommitted(x=>x.doc.background.transparent===false,'typed color connect');
  assert.equal((await latest('reconnected color')).hash,colored.hash);
  await page.getByLabel('Undo',{exact:true}).click();
  await waitCommitted(x=>x.doc.background.transparent===true,'color link Undo');
  assert.equal((await latest('reconnect undo')).hash,transparent.hash);
  await page.getByLabel('Redo',{exact:true}).click();
  await waitCommitted(x=>x.doc.background.transparent===false,'color link Redo');
  assert.equal((await latest('reconnect redo')).hash,colored.hash);
  // Visual edit must propagate back to typed Graph, Code, IDB and pixels.
  await page.locator('.aw-inspector input[type=color]').first().fill('#ffaa22');
  await waitCommitted(x=>x.doc.background.color==='#ffaa22','Visual solid color input');
  const visual=await latest('Visual solid-color update');
  assert.notEqual(visual.hash,colored.hash);
  await page.screenshot({path:path.join(evidence,'supervisor11_solid_background.png')});
  await page.getByLabel('Graph transparent canvas').check();
  await waitCommitted(x=>x.doc.background.transparent===true,'transparent persistence');
  await latest('transparency set');
  await page.screenshot({path:path.join(evidence,'supervisor11_transparent_canvas.png')});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:24000});
  const saved=await committed();
  assert.equal(saved.doc.background.color,'#ffaa22');
  assert.equal(saved.doc.background.transparent,true);
  await latest('alpha reload');
  assert.equal(await page.getByLabel('Graph solid background color').inputValue(),'#ffaa22');
  assert.deepEqual(errors,[]);
  console.log('S11_BACKGROUND_BROWSER_PASS='+JSON.stringify({original:original.hash,opaque:colored.hash,transparent:transparent.hash,visual:visual.hash}));
 }finally{await browser.close()}
}
run().catch(e=>{console.error('S11_BACKGROUND_BROWSER_FAIL',e.stack||e);process.exitCode=1});
