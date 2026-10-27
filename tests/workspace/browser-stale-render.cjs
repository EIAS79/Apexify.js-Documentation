/* Deterministic old-response and old-error race. Live preview must follow latest revision. */
const assert=require('node:assert/strict');
const path=require('node:path');
const sharp=require(path.join(process.env.S8_PROJECT_ROOT,'node_modules/sharp'));
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const url=process.env.S8_BROWSER_URL||'http://127.0.0.1:38478/workspace';
const evidence=process.env.S8_SCREENSHOT_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts';
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1480,height:940}});
 await context.addInitScript(()=>{
  window.__s8urls={created:[],revoked:[]};
  const create=URL.createObjectURL,revoke=URL.revokeObjectURL;
  URL.createObjectURL=function(v){const u=create.call(URL,v);window.__s8urls.created.push(u);return u;};
  URL.revokeObjectURL=function(v){window.__s8urls.revoked.push(v);return revoke.call(URL,v);};
 });
 const page=await context.newPage(),errors=[],failures=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>{if(r.url().includes('/api/workspace/render'))failures.push(r.failure()?.errorText||'requestfailed');});
 const oldFrame=await sharp({create:{width:1280,height:720,channels:4,background:{r:255,g:0,b:255,alpha:1}}}).png().toBuffer();
 const before=deferred(),release=deferred(),oldDone=deferred();
 let armed=true;
 await page.route('**/api/workspace/render',async route=>{
  const payload=route.request().postDataJSON();
  if(armed && payload?.canvasExtras?.patternBg?.type==='waves'){
   armed=false;before.resolve();
   await release.promise;
   try{await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'delayed stale preview failure'})});}
   catch{/* Client aborts may close the route before release. */}
   oldDone.resolve();
   return;
  }
  await route.continue();
 });
 async function latestPixel(){
  return page.evaluate(async()=>{
   const g=document.querySelector('.aw-flow-card-preview, .aw-node-output img'),v=document.querySelector('.aw-visual .aw-render-image');
   if(!g||!v||!g.complete||!v.complete||!g.naturalWidth||g.currentSrc!==v.currentSrc)return null;
   await Promise.all([g.decode(),v.decode()]);
   const cv=document.createElement('canvas');cv.width=g.naturalWidth;cv.height=g.naturalHeight;
   const ctx=cv.getContext('2d');ctx.drawImage(g,0,0);
   return {src:g.currentSrc,pixel:Array.from(ctx.getImageData(31,31,1,1).data)};
  });
 }
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(()=>{const g=document.querySelector('.aw-flow-card-preview, .aw-node-output img'),v=document.querySelector('.aw-visual .aw-render-image');return g?.complete&&v?.complete&&g.naturalWidth===1280&&g.currentSrc===v.currentSrc;},null,{timeout:24000});
  const previous=await latestPixel();
  assert.ok(previous?.src,'require a previously displayed object URL to test cleanup');
  await page.getByLabel('Canvas pattern type').selectOption('waves');
  await Promise.race([before.promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('old render did not start')),18000))]);
  await page.getByLabel('Canvas pattern type').selectOption('diamonds');
  await page.waitForFunction(previous=>{
    const g=document.querySelector('.aw-flow-card-preview, .aw-node-output img'),v=document.querySelector('.aw-visual .aw-render-image');
    return g?.complete&&v?.complete&&g.naturalWidth===1280&&g.currentSrc===v.currentSrc&&g.currentSrc!==previous;
  },previous?.src??null,{timeout:24000});
  const winner=await latestPixel();
  assert.ok(winner&&winner.pixel[0]!==255);
  release.resolve();await oldDone.promise;
  // Route release and browser repaint checkpoints; no arbitrary long sleep.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const final=await latestPixel();
  assert.deepEqual(final,winner,'delayed old error must not replace the latest Visual/Graph pixels');
  assert.equal(await page.getByText('delayed stale preview failure').count(),0,'obsolete failed render must remain silent');
  const urls=await page.evaluate(()=>window.__s8urls);
  assert.ok(urls.created.includes(winner.src));
  assert.ok(!urls.revoked.includes(winner.src),'latest URL must not be revoked while displayed');
  assert.ok(urls.revoked.length>=1,'superseded URLs must be revoked');
  await page.screenshot({path:path.join(evidence,'supervisor8_delayed_preview.png')});
  assert.equal(errors.length,0,'JS exceptions '+errors.join(';'));
  console.log('S8_STALE_RENDER_BROWSER_PASS='+JSON.stringify({newPixel:winner.pixel,oldErrorReleased:true,
    activeRevoked:false,created:urls.created.length,revoked:urls.revoked.length,clientFailures:failures}));
 }finally{await browser.close();}
}
main().catch(e=>{console.error('S8_STALE_RENDER_BROWSER_FAIL',e.stack||e);process.exitCode=1});
