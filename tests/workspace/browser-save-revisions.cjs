/* Supervisor #8: compare-and-swap IndexedDB commits across real Chromium tabs.
 * Reads durable revisions via independent readonly IndexedDB transactions.
 */
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only','node_modules','playwright-core'));
const origin=process.env.S8_BROWSER_URL||'http://127.0.0.1:38478/workspace';
async function snapshot(page) {
 return page.evaluate(async()=>{
   const db=await new Promise((yes,no)=>{
     const req=indexedDB.open('apexify-workspace-immutable-assets-v1');
     req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error);
   });
   try{
     if(!db.objectStoreNames.contains('projects'))return null;
     const tx=db.transaction('projects','readonly');
     const current=await new Promise((yes,no)=>{
       const q=tx.objectStore('projects').get('active-project');
       q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error);
     });
     return current?{revision:current.revision??0,extras:current.document.canvasExtras,
       name:current.document.name}:null;
   }finally{db.close();}
 });
}
async function until(page,pred,description){
 const started=Date.now();
 do{
   const s=await snapshot(page);
   if(s&&pred(s))return s;
   await new Promise(r=>setTimeout(r,70)); // polls the actual IndexedDB transition, never a fixed sleep assertion
 }while(Date.now()-started<25000);
 throw Error('waited for durable change: '+description);
}
async function load(page){
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});
 try{await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:16000});}
 catch(e){console.log('S8_LOAD_DIAGNOSTIC='+JSON.stringify(await page.evaluate(()=>({html:document.body.innerText.slice(0,1600),busy:document.querySelector('.aw-app')?.getAttribute('aria-busy'),alert:document.querySelector('[role=alert]')?.textContent,stored:localStorage.getItem('apexify-workspace-document-v1')?.slice(0,150)}))));throw e;}
 await page.getByLabel('Canvas gradient type').waitFor({state:'visible'});
}
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1450,height:950},acceptDownloads:true});
 const errors=[],first=context.newPage;
 try{
   const seed=await context.newPage();seed.on('pageerror',e=>errors.push('seed:'+e.message));
   await load(seed);
   const baseline=await until(seed,v=>v.revision>=1,'initial first commit');
   await seed.close();
   const a=await context.newPage(),b=await context.newPage();
   a.on('pageerror',e=>errors.push('a:'+e.message));
   b.on('pageerror',e=>errors.push('b:'+e.message));
   await load(a);await load(b);
   const beforeA=await snapshot(a),beforeB=await snapshot(b);
   assert.equal(beforeA.revision,beforeB.revision,'both tabs must start at same committed IDB revision');
   await a.getByLabel('Canvas gradient type').selectOption('linear');
   const latest=await until(a,v=>v.revision>beforeA.revision&&v.extras?.gradientBg?.type==='linear','tab A save');
   assert.equal(latest.revision,beforeA.revision+1);
   await b.getByLabel('Canvas gradient type').selectOption('radial');
   await b.getByRole('alert',{name:'Workspace save conflict'}).waitFor({state:'visible',timeout:18000});
   const checked=await snapshot(a);
   assert.equal(checked.revision,latest.revision,'tab B must not advance IDB revision');
   assert.equal(checked.extras.gradientBg.type,'linear','tab B must not overwrite tab A canvas');
   assert.equal(await b.getByLabel('Canvas gradient type').inputValue(),'radial','stale authoring state must be exportable');
   const download=b.waitForEvent('download');
   await b.getByRole('button',{name:'Download unsaved local project'}).click();
   const event=await download;assert.ok(event.suggestedFilename().includes('.json'));
   console.log('S8_CAS_TWO_TAB_CONFLICT_PASS='+JSON.stringify({initial:beforeA.revision,committed:latest.revision,blocked:'radial',persisted:'linear'}));
   // Crash between IDB transaction commit and marker update: localStorage absent.
   await a.evaluate(()=>localStorage.removeItem('apexify-workspace-document-v1'));
   await a.reload({waitUntil:'domcontentloaded'});
   await a.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:25000});
   assert.equal(await a.getByLabel('Canvas gradient type').inputValue(),'linear');
   assert.equal((await snapshot(a)).revision,latest.revision);
   console.log('S8_MISSING_POINTER_RECONCILED_PASS=1');
   assert.equal(errors.length,0,'browser errors: '+errors.join(';'));
   console.log('S8_CROSS_TAB_BROWSER_PASS=1');
 }finally{await browser.close();}
}
main().catch(err=>{console.error('S8_CROSS_TAB_BROWSER_FAIL',err.stack||String(err));process.exitCode=1;});
