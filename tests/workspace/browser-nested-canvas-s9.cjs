/* Supervisor #9: actual Visual/Graph nested pattern and gradient controls and image pixels. */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const origin=process.env.S9_BROWSER_URL||'http://127.0.0.1:38479/workspace';
const evidence=process.env.S9_EVIDENCE_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts';
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1660,height:1040}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function revision(){
  return page.evaluate(async()=>{
   const db=await new Promise((yes,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
   try{
    const tx=db.transaction('projects','readonly');
    const doc=await new Promise((yes,no)=>{const q=tx.objectStore('projects').get('active-project');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
    return {revision:doc?.revision||0,options:doc?.document?.canvasExtras};
   }finally{db.close();}
  });
 }
 async function settle(test,desc){
  const start=Date.now();
  while(Date.now()-start<16000){
   const x=await revision();if(test(x))return x;
   await new Promise(r=>setTimeout(r,80));
  }
  throw Error('Canvas semantics did not save: '+desc);
 }
 async function pixels(){
  return page.evaluate(async()=>{
   const imgs=['.aw-visual .aw-render-image','.aw-node-output img'].map(q=>document.querySelector(q));
   if(imgs.some(i=>!i||!i.complete||i.naturalWidth!==1280)||imgs[0].currentSrc!==imgs[1].currentSrc)return null;
   try{await Promise.all(imgs.map(i=>i.decode()));}catch{return null;} // expected during superseded object-URL swap
   const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(imgs[0],0,0);
   const data=ctx.getImageData(0,0,1280,720).data;
   let hash=2166136261>>>0,nonBlack=0;
   for(let y=0;y<720;y+=12)for(let x=0;x<1280;x+=12){
    const at=(y*1280+x)*4;
    for(let z=0;z<3;z++)hash=Math.imul((hash^data[at+z])>>>0,16777619)>>>0;
    if(data[at]+data[at+1]+data[at+2]>30)nonBlack++;
   }
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
   return {src:imgs[0].currentSrc,hash:digest,gridHash:hash.toString(16),nonBlack};
  });
 }
 async function waitLatestDecoded(description){
  const expected=await page.evaluate(async()=>{
    const db=await new Promise((yes,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
    const tx=db.transaction('projects','readonly');
    const v=await new Promise((yes,no)=>{const q=tx.objectStore('projects').get('active-project');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
    db.close();
    let response;
    for(let attempt=0;attempt<6;attempt++){
      response=await fetch('/api/workspace/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(v.document)});
      if(response.status!==429)break;
      // The secure renderer enforces two concurrent jobs and explicitly returns Retry-After: 2.
      const seconds=Math.max(1,Math.min(3,Number(response.headers.get('Retry-After')||'2')));
      await new Promise(resolve=>setTimeout(resolve,seconds*1000));
    }
    if(response.status!==200)throw Error('expected render returned '+response.status);
    const bitmap=await createImageBitmap(await response.blob());
    const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);
    const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
    bitmap.close();
    return {hash,revision:v.revision};
  });
  const start=Date.now();
  while(Date.now()-start<22000){
    const got=await pixels();
    if(got?.hash===expected.hash)return {...got,revision:expected.revision};
    await new Promise(resolve=>setTimeout(resolve,90));
  }
  throw Error(description+' preview did not match committed render at revision '+expected.revision+' expected '+expected.hash+
    ' last '+JSON.stringify(await pixels()));
 }
 async function preview(previous,description){
  await page.waitForFunction(previous=>{
   const v=document.querySelector('.aw-visual .aw-render-image'),g=document.querySelector('.aw-node-output img');
   return v?.complete&&g?.complete&&v.naturalWidth===1280&&g.naturalWidth===1280&&v.currentSrc===g.currentSrc&&
    (!previous||v.currentSrc!==previous);
  },previous?.src??null,{timeout:25000});
  const s=await pixels();assert.ok(s,description+' must decode in Visual and Graph simultaneously');
  return s;
 }
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:27000});
  await page.getByRole('button',{name:'New Project'}).click();
  await settle(s=>s.revision>=1&&(!s.options?.bgLayers||s.options.bgLayers.length===0),'new blank composition');
  const original=await preview(null,'blank baseline');
  await page.getByLabel('Canvas pattern type').selectOption('stripes');
  await settle(s=>s.options?.patternBg?.type==='stripes','stripes');
  const striped=await waitLatestDecoded('stripes root');
  await page.getByLabel('Root size',{exact:true}).fill('37');
  await page.getByLabel('Root size',{exact:true}).press('Tab');
  await settle(s=>s.options?.patternBg?.size===37,'root geometry');
  const bigger=await waitLatestDecoded('resized root pattern');
  assert.notEqual(striped.hash,bigger.hash,'Visual pattern geometry must change decoded pixels');
  console.log('S9_BROWSER_PATTERN_GEOMETRY='+JSON.stringify({first:striped.hash,second:bigger.hash,changed:true}));
  await page.getByLabel('Root use gradient paint',{exact:true}).check();
  await settle(s=>s.options.patternBg?.gradient?.type==='linear'&&!s.options.patternBg?.color,'pattern gradient paint');
  const paint=await waitLatestDecoded('gradient pattern paint');
  assert.notEqual(paint.hash,bigger.hash,'Pattern GradientConfig must change decoded Visual/Graph pixels');
  await page.getByLabel('Root use gradient paint',{exact:true}).uncheck();
  await settle(s=>!s.options.patternBg?.gradient&&s.options.patternBg?.color,'solid pattern restoration');
  await waitLatestDecoded('restored solid pattern');
  console.log('S9_BROWSER_PATTERN_GRADIENT_PAINT='+JSON.stringify({solid:bigger.hash,gradient:paint.hash}));
  await page.getByRole('button',{name:'Add pattern layer'}).click();
  await settle(s=>s.options?.bgLayers?.length===1&&s.options.bgLayers[0].type==='presetPattern','new ordered pattern layer');
  await page.getByLabel('Layer 1 type',{exact:true}).selectOption('dots');
  await settle(s=>s.options.bgLayers[0].pattern.type==='dots','nested pattern kind');
  await page.getByLabel('Layer 1 size',{exact:true}).fill('31');
  await page.getByLabel('Layer 1 size',{exact:true}).press('Tab');
  await settle(s=>s.options.bgLayers[0].pattern.size===31,'nested layer size');
  const patternLayer=await waitLatestDecoded('nested pattern');
  assert.notEqual(patternLayer.hash,bigger.hash,'ordered pattern must change decoded visual output');
  console.log('S9_BROWSER_NESTED_PATTERN='+JSON.stringify({pixels:patternLayer.hash,savedType:'dots'}));
  await page.getByRole('button',{name:'Add gradient layer'}).click();
  await settle(s=>s.options.bgLayers?.length===2&&s.options.bgLayers[1].type==='gradient','gradient layer');
  await page.getByLabel('Layer 2 end X',{exact:true}).fill('320');
  await page.getByLabel('Layer 2 end X',{exact:true}).press('Tab');
  await settle(s=>s.options.bgLayers[1].value.endX===320,'nested gradient geometry');
  await page.getByLabel('Canvas gradient type').selectOption('radial');
  await settle(s=>s.options.gradientBg?.type==='radial','radial');
  await page.getByLabel('Root end radius',{exact:true}).fill('240');
  await page.getByLabel('Root end radius',{exact:true}).press('Tab');
  await settle(s=>s.options.gradientBg.endRadius===240,'radial radius');
  const radial240=await waitLatestDecoded('radial geometry from Visual');
  await page.locator('.aw-graph-semantic-properties > summary').click();
  await page.getByText('Ordered layer 2: gradient',{exact:true}).click();
  await page.getByLabel('Graph layer 2 end X',{exact:true}).fill('800');
  await page.getByLabel('Graph layer 2 end X',{exact:true}).press('Tab');
  await settle(s=>s.options.bgLayers[1].value.endX===800,'typed Graph ordered gradient property');
  const radial320=await waitLatestDecoded('Graph radial geometry');
  assert.notEqual(radial320.hash,radial240.hash,'Graph property input must change actual Visual and Graph pixels');
  console.log('S9_BROWSER_GRAPH_GRADIENT_PARITY='+JSON.stringify({before:radial240.hash,after:radial320.hash}));
  await page.getByLabel('Undo',{exact:true}).click();
  await settle(s=>s.options.bgLayers[1].value.endX===320,'Graph layer undo');
  const undone=await waitLatestDecoded('Graph undo decoded pixels');
  assert.equal(undone.hash,radial240.hash,'Undo must restore exact previous Visual/Graph decoded output');
  await page.getByLabel('Redo',{exact:true}).click();
  await settle(s=>s.options.bgLayers[1].value.endX===800,'Graph layer redo');
  const redone=await waitLatestDecoded('Graph redo decoded pixels');
  assert.equal(redone.hash,radial320.hash,'Redo must restore exact latest decoded output');
  console.log('S9_BROWSER_GRAPH_UNDO_REDO_PASS=1');
  await page.screenshot({path:path.join(evidence,'supervisor9_nested_canvas_visual.png'),fullPage:false});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:27000});
  const restored=await revision();
  assert.equal(restored.options.gradientBg.type,'radial');
  assert.equal(restored.options.gradientBg.endRadius,240);
  assert.equal(restored.options.bgLayers[0].pattern.type,'dots');
  assert.equal(restored.options.bgLayers[1].value.endX,800);
  await preview(null,'reload nested options');
  console.log('S9_BROWSER_NESTED_CANVAS_RELOAD_PASS='+JSON.stringify({revision:restored.revision,layerCount:restored.options.bgLayers.length}));
  assert.deepEqual(errors,[]);
  console.log('S9_NESTED_BROWSER_PASS=1');
 }finally{await browser.close();}
}
run().catch(e=>{console.error('S9_NESTED_BROWSER_FAIL',e.stack||e.message);process.exitCode=1});
