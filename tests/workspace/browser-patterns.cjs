/* Supervisor #8: real Chromium procedural and content-addressed custom pattern authoring. */
const assert=require('node:assert/strict');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const sharp=require(path.join(process.env.S8_PROJECT_ROOT,'node_modules/sharp'));
const url=process.env.S8_BROWSER_URL||'http://127.0.0.1:38478/workspace';
const screenshot=process.env.S8_SCREENSHOT_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts';
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1460,height:930}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const state=async()=>page.evaluate(async()=>{
   const p=JSON.parse(localStorage.getItem('apexify-workspace-document-v1')||'{}');
   const db=await new Promise((yes,no)=>{const r=indexedDB.open('apexify-workspace-immutable-assets-v1');r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)});
   try{
    const tx=db.transaction('projects','readonly');
    const rec=await new Promise((yes,no)=>{const q=tx.objectStore('projects').get('active-project');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
    return {pointer:p.storageKind,revision:rec?.revision,pattern:rec?.document?.canvasExtras?.patternBg};
   }finally{db.close()}
 });
 async function until(check,why){
  const started=Date.now();
  while(Date.now()-started<15000){
   const s=await state();if(check(s))return s;
   await new Promise(resolve=>setTimeout(resolve,80));
  }
  throw Error('No persisted state: '+why);
 }
 async function pixel(kind='graph'){
  return page.evaluate(async kind=>{
   const img=document.querySelector(kind==='graph'?'.aw-flow-card-preview, .aw-node-output img':'.aw-visual .aw-render-image');
   if(!img||!img.complete||!img.naturalWidth)return null;
   await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
   const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
   return {src:img.currentSrc,dimensions:[c.width,c.height],
     sample:Array.from(ctx.getImageData(Math.min(40,c.width-1),Math.min(40,c.height-1),1,1).data),
     sample2:Array.from(ctx.getImageData(Math.min(100,c.width-1),Math.min(100,c.height-1),1,1).data)};
  },kind);
 }
 async function waitPreview(change,description){
  await page.waitForFunction(old=>{
   const graph=document.querySelector('.aw-flow-card-preview, .aw-node-output img'),visual=document.querySelector('.aw-visual .aw-render-image');
   return !!graph&&!!visual&&graph.complete&&visual.complete&&graph.naturalWidth===1280&&visual.naturalWidth===1280&&
     graph.currentSrc===visual.currentSrc&&(!old||graph.currentSrc!==old);
  },change,{timeout:24000});
  const g=await pixel('graph'),v=await pixel('visual');
  assert.deepEqual(g,v,description+' must agree between Graph and Visual');
  assert.deepEqual(g.dimensions,[1280,720]);
  return g;
 }
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:30000});
  const prior=await pixel();
  await page.getByLabel('Canvas pattern type').selectOption('waves');
  const first=await waitPreview(prior?.src,'procedural waves');
  const persisted=await until(s=>s.pattern?.type==='waves','wave root pattern');
  assert.ok(persisted.revision>=1);
  console.log('S8_BROWSER_WAVES='+JSON.stringify({sample:first.sample,sample2:first.sample2,revision:persisted.revision}));
  await page.getByLabel('Canvas pattern type').selectOption('diamonds');
  const diamond=await waitPreview(first.src,'diamonds variant');
  assert.notEqual(diamond.src,first.src);
  await page.getByLabel('Pattern repeat').selectOption('no-repeat');
  const repeated=await waitPreview(diamond.src,'repeat semantics');
  await until(s=>s.pattern?.repeat==='no-repeat','pattern repeat');
  const img=await sharp({create:{width:16,height:16,channels:4,background:{r:205,g:44,b:82,alpha:1}}}).png().toBuffer();
  const identity=crypto.createHash('sha256').update(img).digest('hex');
  await page.getByLabel('Import canvas pattern image').setInputFiles({name:'verified-pattern.png',mimeType:'image/png',buffer:img});
  await until(s=>s.pattern?.type==='custom'&&s.pattern.customPatternImage==='asset:'+identity,'content-addressed custom pattern');
  assert.equal(await page.getByLabel('Graph connect pattern asset').inputValue(),'asset:'+identity);
  const custom=await waitPreview(repeated.src,'custom SHA256 pattern');
  assert.deepEqual(custom.sample,[205,44,82,255]);
  await page.screenshot({path:path.join(screenshot,'supervisor8_custom_pattern_chromium.png')});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:24000});
  const restored=await waitPreview(null,'saved custom pattern');
  assert.deepEqual(restored.sample,[205,44,82,255]);
  assert.equal((await state()).pattern.customPatternImage,'asset:'+identity);
  await page.screenshot({path:path.join(screenshot,'supervisor8_custom_pattern_reloaded.png')});
  assert.deepEqual(errors,[]);
  console.log('S8_BROWSER_PATTERN_PASS='+JSON.stringify({src:identity,pixel:restored.sample,procs:'waves,diamonds,repeat,custom,graph,reload'}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error('S8_BROWSER_PATTERN_FAIL',e.stack||e.message);process.exitCode=1});
