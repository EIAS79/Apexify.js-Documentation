/* Supervisor #7 durability/recovery regression. Actual browser and production UI.
 * Tests explicit user-controlled recovery, immutable IndexedDB, legacy migration
 * and missing-blob rejection. Requires local dev server and Chrome/Playwright.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only','node_modules','playwright-core'));
const sharp=require(path.join(process.env.S7_PROJECT_ROOT,'node_modules','sharp'));
const site=process.env.S7_BROWSER_URL||'http://127.0.0.1:38478/workspace';
const out=process.env.S7_EVIDENCE_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts';
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-first-run','--disable-extensions']});
 const context=await browser.newContext({viewport:{width:1500,height:980},acceptDownloads:true});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
 const key='apexify-workspace-document-v1';
 async function reloadUntilRecovery(){
  await page.reload({waitUntil:'domcontentloaded'});
  try{await page.getByRole('alert',{name:'Workspace project recovery'}).waitFor({state:'visible',timeout:18000});}
  catch(error){console.log('S9_DURABLE_RECOVERY_DEBUG='+JSON.stringify(await page.evaluate(()=>({record:(localStorage.getItem('apexify-workspace-document-v1')||'').slice(0,280),alerts:Array.from(document.querySelectorAll('[role=alert]')).map(n=>n.textContent?.slice(0,300)),body:document.body.innerText.slice(-1000)}))));throw error;}
 }
 async function idb(){
  return page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const req=indexedDB.open('apexify-workspace-immutable-assets-v1');
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   try{
    const tx=db.transaction(['projects','blobs'],'readonly');
    const req=q=>new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
    const projects=await req(tx.objectStore('projects').getAll());
    const keys=await req(tx.objectStore('blobs').getAllKeys());
    return {projects:projects.map(p=>({id:p.id,version:p.version,assets:p.document.assets.length,canvas:p.document.canvasExtras?.customBg?.source})),blobs:keys.map(String)};
   }finally{db.close();}
  });
 }
 async function waitProject(test,description){
  const start=Date.now();
  while(Date.now()-start<14000){
   const ready=await page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('apexify-workspace-document-v1')||'{}').storageKind==='apexify-workspace-indexeddb'}catch{return false}});
   if(ready){const state=await idb();if(test(state))return state;}
   await new Promise(resolve=>setTimeout(resolve,70));
  }
  const diag=await page.evaluate(()=>({stored:(localStorage.getItem('apexify-workspace-document-v1')||'').slice(0,200),error:document.querySelector('[role=alert]')?.textContent,txt:document.body.innerText.slice(-700)}));
  console.log('S7_DEBUG='+JSON.stringify({description,diag}));
  throw Error(description+' did not persist');
 }
 try{
  const response=await page.goto(site,{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(response.status(),200);
  await page.getByLabel('Import canvas background image').waitFor({state:'visible'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:18000});
  const png=await sharp({create:{width:20,height:14,channels:4,background:{r:111,g:38,b:189,alpha:1}}}).png().toBuffer();
  await page.getByLabel('Import canvas background image').setInputFiles({name:'durable.png',mimeType:'image/png',buffer:png});
  const state=await waitProject(d=>d.projects.some(x=>x.id==='active-project'&&x.assets===1),'asset import');
  assert.equal(state.blobs.length,1);
  await page.getByLabel('Import canvas background image').setInputFiles({name:'same.png',mimeType:'image/png',buffer:png});
  const duplicate=await waitProject(d=>d.projects.some(x=>x.id==='active-project'&&x.assets===1),'dedup import');
  assert.equal(duplicate.blobs.length,1,'reimport must not alias two mutable blob records');
  console.log('S7_IDB_DEDUP=1');
  // Reload ends pending debounced autosaves before deliberate store corruption.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:18000});
  await page.locator('.aw-visual .aw-render-image').first().waitFor({state:'visible',timeout:18000});
  const savedDocument=await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('apexify-workspace-immutable-assets-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
   try{
    const tx=db.transaction(['projects','blobs'],'readonly'),req=q=>new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
    const rec=await req(tx.objectStore('projects').get('active-project'));
    const assets=await Promise.all(rec.document.assets.map(async meta=>{
      const stored=await req(tx.objectStore('blobs').get(meta.id));
      const bytes=new Uint8Array(await stored.blob.arrayBuffer());
      let string='';for(let i=0;i<bytes.length;i+=8192)string+=String.fromCharCode(...bytes.subarray(i,i+8192));
      return {...meta,dataUri:'data:'+meta.mime+';base64,'+btoa(string)};
    }));
    return {...rec.document,assets};
   }finally{db.close()}
  });
  assert.equal(savedDocument.assets.length,1);
  // Deliberate corruption: IndexedDB blob deleted, pointer + manifest are kept.
  await page.evaluate(async id=>{
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('apexify-workspace-immutable-assets-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
   try{
    const tx=db.transaction('blobs','readwrite');
    tx.objectStore('blobs').delete(id);
    await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});
   }finally{db.close()}
  },savedDocument.assets[0].id);
  await reloadUntilRecovery();
  const rawBefore=await page.evaluate(key=>localStorage.getItem(key),key);
  assert.match(rawBefore,/indexeddb/);
  // Normal UI authoring must NOT unlock a corrupt stored project.
  await page.getByLabel('Canvas gradient type').selectOption('linear');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),rawBefore);
  assert.equal(await page.getByRole('alert',{name:'Workspace project recovery'}).count(),1);
  console.log('S7_MISSING_BLOB_EDIT_BLOCKED=1');
  // Download preserves an actual recovery bundle with manifest and missing marker.
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download original recovery record'}).click();
  const download=await event;
  const downloaded=fs.readFileSync(await download.path(),'utf8');
  const bundle=JSON.parse(downloaded);
  assert.equal(bundle.recoveryBundleVersion,1);
  assert.ok(bundle.rawStorageRecord.includes('indexeddb'));
  assert.equal(bundle.savedManifest.document.assets.length,1);
  assert.equal(bundle.portableDocument.assets[0].missing,true);
  console.log('S7_RAW_RECOVERY_DOWNLOAD=1');
  await page.screenshot({path:path.join(out,'supervisor7_missing_blob_recovery.png'),fullPage:false});
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Explicitly reset saved project'}).click();
  await page.getByRole('alert',{name:'Workspace project recovery'}).waitFor({state:'detached',timeout:14000});
  const reset=await waitProject(d=>d.projects.some(x=>x.id==='active-project'&&x.assets===0),'explicit reset');
  assert.ok(reset.projects.some(x=>x.id.startsWith('recovery-backup-')&&x.assets===1),'backup manifest must survive reset');
  console.log('S7_EXPLICIT_RESET_BACKUP=1');
  // Unsupported future schema must fail closed.
  await page.evaluate(([key,good])=>localStorage.setItem(key,JSON.stringify({...good,schemaVersion:999})),[key,savedDocument]);
  await reloadUntilRecovery();
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).schemaVersion,key),999);
  console.log('S7_FUTURE_SCHEMA_REJECTED=1');
  // Successful explicit recovery import of portable v1 JSON after future-schema failure.
  await page.getByLabel('Import recovery project').setInputFiles({name:'restored.apexify.json',
    mimeType:'application/json',buffer:Buffer.from(JSON.stringify(savedDocument))});
  await page.getByRole('alert',{name:'Workspace project recovery'}).waitFor({state:'detached',timeout:15000});
  const migrated=await waitProject(d=>d.projects.some(x=>x.id==='active-project'&&x.assets===1),'import recovery');
  assert.equal(migrated.blobs.length,1);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByLabel('Import canvas background image').waitFor({state:'visible',timeout:15000});
  await page.locator('.aw-visual .aw-render-image').first().waitFor({state:'visible',timeout:20000});
  assert.ok(await page.locator('.aw-visual .aw-render-image').first().evaluate(async img=>{await img.decode();return img.naturalWidth===1280&&img.naturalHeight===720;}));
  console.log('S7_EXPLICIT_IMPORT_AND_REOPEN=1');
  await page.screenshot({path:path.join(out,'supervisor7_after_import_recovery.png'),fullPage:false});
  // Invalid JSON record also enters recovery, never executes.
  await page.evaluate(key=>localStorage.setItem(key,'{\"broken\":'),key);
  await reloadUntilRecovery();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'{"broken":');
  console.log('S7_INVALID_JSON_PRESERVED=1');
  // An inline v1 pointer must NOT roll back a newer IDB commit after a crash.
  const beforeLegacy=await idb();
  await page.evaluate(([key,doc])=>localStorage.setItem(key,JSON.stringify(doc)),[key,savedDocument]);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:18000});
  const retained=await idb();
  assert.deepEqual(retained.projects.filter(p=>p.id==='active-project'),beforeLegacy.projects.filter(p=>p.id==='active-project'));
  console.log('S8_OLDER_INLINE_POINTER_CANNOT_ROLLBACK_IDB=1');
  // A genuinely fresh browser profile must migrate legacy inline v1 bytes.
  const migrationContext=await browser.newContext({viewport:{width:1500,height:980}});
  await migrationContext.addInitScript(({key,raw})=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,raw);
  },{key,raw:JSON.stringify(savedDocument)});
  const migratedPage=await migrationContext.newPage();
  try{
    await migratedPage.goto(site,{waitUntil:'domcontentloaded',timeout:60000});
    await migratedPage.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:18000});
    await migratedPage.waitForFunction(async()=>{
      const pointer=JSON.parse(localStorage.getItem('apexify-workspace-document-v1')||'{}');
      if(pointer.storageKind!=='apexify-workspace-indexeddb')return false;
      const db=await new Promise((yes,no)=>{const r=indexedDB.open('apexify-workspace-immutable-assets-v1');r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)});
      try{
        const tx=db.transaction(['projects','blobs'],'readonly');
        const get=req=>new Promise((yes,no)=>{req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error)});
        const active=await get(tx.objectStore('projects').get('active-project'));
        return active?.document?.assets?.length===1 && !!(await get(tx.objectStore('blobs').get(active.document.assets[0].id)));
      }finally{db.close();}
    },null,{timeout:22000});
    await migratedPage.locator('.aw-visual .aw-render-image').first().waitFor({state:'visible',timeout:22000});
    assert.ok(await migratedPage.locator('.aw-visual .aw-render-image').first().evaluate(async image=>{await image.decode();return image.naturalWidth===1280&&image.naturalHeight===720}));
    console.log('S7_INLINE_V1_AUTO_MIGRATION=1');
  }finally{await migrationContext.close();}
  assert.equal(errors.length,0,'unexpected browser errors '+errors.join(' | '));
  console.log('S7_BROWSER_DURABILITY_PASS=1');
 }finally{await browser.close();}
}
run().catch(error=>{console.error('S7_BROWSER_DURABILITY_FAILED',error.stack||error.message);process.exitCode=1;});
