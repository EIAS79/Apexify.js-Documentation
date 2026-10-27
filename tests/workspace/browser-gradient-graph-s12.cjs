/* Supervisor #12 isolated real-Chromium Graph -> Visual -> stored model acceptance. */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const origin=process.env.S12_BROWSER_URL||'http://127.0.0.1:38492/workspace';
const evidence=process.env.S12_EVIDENCE_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts';
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const ctx=await browser.newContext({viewport:{width:1700,height:1100}});
 const page=await ctx.newPage(), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function stored(){return page.evaluate(async()=>{
  const db=await new Promise((res,rej)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
  try{const transaction=db.transaction('projects','readonly'),query=transaction.objectStore('projects').get('active-project');
   return await new Promise((res,rej)=>{query.onsuccess=()=>res(query.result);query.onerror=()=>rej(query.error)});}
  finally{db.close();}
 });}
 async function commit(where,description){
  let last;const start=Date.now();while(Date.now()-start<22000){
   last=await stored();if(last&&where(last))return last;
   await new Promise(r=>setTimeout(r,120));
  }
  throw Error(description+' was not durably committed; '+JSON.stringify(last?.document?.canvasExtras).slice(0,600));
 }
 async function view(){
  return page.evaluate(async()=>{
   const img=document.querySelector('.aw-visual .aw-render-image');
   if(!img?.complete||!img.naturalWidth)return null;
   try{await img.decode()}catch{return null}
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const cv=canvas.getContext('2d');cv.drawImage(img,0,0);
   const bytes=cv.getImageData(0,0,canvas.width,canvas.height).data;
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
   return {hash,width:canvas.width,height:canvas.height,center:[...cv.getImageData(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1).data]};
  });
 }
 async function changed(previous,desc){
  const start=Date.now();while(Date.now()-start<26000){
   const v=await view();if(v&&v.hash!==previous)return v;
   await new Promise(r=>setTimeout(r,200));
  }throw Error(desc+' never updated rendered RGBA from hash '+previous);
 }
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:65000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:45000});
  await page.getByRole('button',{name:'New Project'}).click();
  await commit(x=>x.document?.width===1280,'blank project');
  await page.waitForFunction(()=>document.querySelector('.aw-visual .aw-render-image')?.naturalWidth>0,null,{timeout:35000});
  const initial=await view(); assert.ok(initial?.hash,'Initial render absent');
  await page.getByLabel('Canvas graph background gradient').selectOption('linear');
  await commit(x=>x.document.canvasExtras?.gradientBg?.type==='linear','linear gradient');
  const lin=await changed(initial.hash,'linear gradient');
  await page.getByLabel('Canvas graph background gradient').selectOption('radial');
  await commit(x=>x.document.canvasExtras?.gradientBg?.type==='radial','radial gradient');
  const radial=await changed(lin.hash,'radial gradient');
  await page.locator('.aw-graph-semantic-properties > summary').click();
  await page.getByLabel('Graph root gradient type').selectOption('conic');
  await commit(x=>x.document.canvasExtras?.gradientBg?.type==='conic','conic switch');
  const conic=await changed(radial.hash,'conic gradient');
  await page.getByLabel('Graph root center X').fill('80');
  await commit(x=>x.document.canvasExtras?.gradientBg?.centerX===80,'conic center X');
  const shifted=await changed(conic.hash,'center X');
  await page.getByLabel('Graph zoom scale').fill('1.8');
  await commit(x=>x.document.canvasExtras?.zoom?.scale===1.8,'graph zoom');
  const scaled=await changed(shifted.hash,'zoom scale');
  await page.getByLabel('Graph zoom center X').fill('60');
  await commit(x=>x.document.canvasExtras?.zoom?.centerX===60,'graph zoom center');
  const panned=await changed(scaled.hash,'zoom pivot');
  await page.getByLabel('Undo',{exact:true}).click();
  await commit(x=>x.document.canvasExtras?.zoom?.centerX===undefined,'zoom Undo');
  await page.getByLabel('Redo',{exact:true}).click();
  await commit(x=>x.document.canvasExtras?.zoom?.centerX===60,'zoom Redo');
  await page.screenshot({path:path.join(evidence,'supervisor12_chromium_gradient_zoom.png')});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:30000});
  const reloaded=await stored();
  assert.equal(reloaded.document.canvasExtras.gradientBg.type,'conic');
  assert.equal(reloaded.document.canvasExtras.gradientBg.centerX,80);
  assert.equal(reloaded.document.canvasExtras.zoom.centerX,60);
  // A real gradient source feeds an ordered gradient layer through a validated typed port.
  await page.getByRole('button',{name:'Add gradient layer'}).click();
  const withLayer=await commit(x=>x.document.canvasExtras?.bgLayers?.length===1,'add gradient layer');
  const layerId=withLayer.document.canvasExtras.bgLayers[0].nodeId;
  assert.ok(layerId?.startsWith('layer:'),'New background layer must retain stable identity');
  await page.locator('.aw-graph-wiring > summary').click();
  await page.getByLabel('Graph output port').selectOption('canvas:gradient:root|output|gradient');
  await page.getByLabel('Graph input port').selectOption('canvas:ordered-layer:'+layerId+'|input|gradient');
  await page.getByRole('button',{name:'Connect graph ports'}).click();
  await commit(x=>JSON.stringify(x.document.canvasExtras?.bgLayers?.[0]?.value)===JSON.stringify(x.document.canvasExtras?.gradientBg),'graph gradient connect');
  const afterWire=await stored();
  assert.equal(afterWire.document.canvasExtras.bgLayers[0].nodeId,layerId);
  assert.ok((await view())?.hash,'Graph did not render after typed connection');
  await page.getByRole('button',{name:'Toggle canvas graph noise input'}).click();
  await commit(x=>x.document.canvasExtras?.noiseBg?.intensity===0.08&&x.document.canvasExtras?.gradientBg?.type==='conic','noise toggling must remove conflicting primary');
  if(!(await page.locator('.aw-graph-semantic-properties').evaluate(el=>el.open)))
    await page.locator('.aw-graph-semantic-properties > summary').click();
  await page.getByLabel('Canvas pattern type').selectOption('dots');
  await commit(x=>x.document.canvasExtras?.patternBg?.type==='dots'&&x.document.canvasExtras?.gradientBg?.type==='conic'&&x.document.canvasExtras?.noiseBg?.intensity===0.08,'concurrent pattern + gradient + noise overlays');
  await page.getByLabel('Graph noise intensity').fill('0.55');
  await commit(x=>x.document.canvasExtras?.noiseBg?.intensity===0.55,'noise intensity');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:30000});
  const end=await stored();
  assert.equal(end.document.canvasExtras.noiseBg.intensity,0.55);
  assert.equal(end.document.canvasExtras.gradientBg.type,'conic');
  assert.equal(end.document.canvasExtras.patternBg.type,'dots');
  assert.equal(end.document.canvasExtras.zoom.scale,1.8);
  assert.equal(end.document.canvasExtras.bgLayers[0].nodeId,layerId);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(evidence,'supervisor12_chromium_noise_layers.png')});
  console.log('S12_BROWSER_CANVAS_PASS='+JSON.stringify({initial:initial.hash,linear:lin.hash,radial:radial.hash,conic:conic.hash,shifted:shifted.hash,scaled:scaled.hash,panned:panned.hash,layerId,revision:end.revision,browser:browser.version()}));
 }finally{await browser.close()}
}
run().catch(e=>{console.error('S12_BROWSER_CANVAS_FAIL',e.stack||e);process.exitCode=1});
