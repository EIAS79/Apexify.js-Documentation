/* Supervisor #9: deterministic browser failure injection at real IndexedDB/localStorage boundaries.
 * These monkeypatches exist only in the test browser context, NEVER in the application.
 */
const assert=require('node:assert/strict');
const path=require('node:path');
const sharp=require(path.join(process.env.S9_PROJECT_ROOT,'node_modules','sharp'));
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const base=process.env.S9_BROWSER_URL||'http://127.0.0.1:38479/workspace';
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1420,height:900}});
 await context.addInitScript(()=>{
  window.__s9fail=null;window.__s9fired=0;
  const put=IDBObjectStore.prototype.put,add=IDBObjectStore.prototype.add;
  IDBObjectStore.prototype.put=function(...args){
   if(window.__s9fail==='manifest'&&this.name==='projects'&&this.transaction.mode==='readwrite'){
    window.__s9fired++;this.transaction.abort();return undefined;
   }
   return put.apply(this,args);
  };
  IDBObjectStore.prototype.add=function(...args){
   if(window.__s9fail==='quota'&&this.name==='blobs'&&this.transaction.mode==='readwrite'){
    window.__s9fired++;this.transaction.abort();return undefined;
   }
   return add.apply(this,args);
  };
  const set=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
   if(window.__s9fail==='pointer'&&k==='apexify-workspace-document-v1'&&v.includes('apexify-workspace-indexeddb')){
    window.__s9fired++;throw new DOMException('Injected localStorage quota rejection','QuotaExceededError');
   }
   return set.call(this,k,v);
  };
 });
 const page=await context.newPage();
 page.on('pageerror',e=>console.log('S9_PAGEERROR='+e.message));
 const get=async()=>page.evaluate(async()=>{
  const raw=localStorage.getItem('apexify-workspace-document-v1')||'';
  const db=await new Promise((yes,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
  try{
   const tx=db.transaction('projects','readonly');
   const rec=await new Promise((yes,no)=>{const req=tx.objectStore('projects').get('active-project');req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error)});
   return {revision:rec?.revision||0,type:rec?.document?.canvasExtras?.gradientBg?.type||'none',
     assets:rec?.document?.assets?.length||0,pointer:raw};
  }finally{db.close();}
 });
 async function loaded(){
  try{await page.locator('.aw-app[aria-busy="false"]').waitFor({state:'visible',timeout:13000});}catch(e){console.log('S9_LOAD_DEBUG='+JSON.stringify(await page.evaluate(()=>({body:document.body.innerText.slice(0,1000),html:document.body.innerHTML.slice(0,500)}))));throw e;}
 }
 async function waitChange(fn,msg){
  const start=Date.now();
  while(Date.now()-start<15000){
   const v=await get();if(fn(v))return v;
   await new Promise(resolve=>setTimeout(resolve,70));
  }
  throw Error(msg+' not observed');
 }
 async function fire(mode){
  await page.evaluate(v=>{window.__s9fired=0;window.__s9fail=v;},mode);
 }
 async function waitFire(){
  await page.waitForFunction(()=>window.__s9fired>0,null,{timeout:16000});
  await page.getByText(/Project save failed/i).first().waitFor({state:'visible',timeout:10000});
 }
 try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:50000});
  await loaded();
  // Fresh default project writes a manifest once, as in the shipped application.
  const first=await waitChange(s=>s.revision>=1,'initial manifest');
  await fire('manifest');
  await page.getByLabel('Canvas gradient type').selectOption('linear');
  await waitFire();
  const afterAbort=await get();
  assert.equal(afterAbort.revision,first.revision);
  assert.equal(afterAbort.type,first.type);
  console.log('S9_MANIFEST_TRANSACTION_ABORT_PRESERVED=1');
  await fire(null);await page.reload({waitUntil:'domcontentloaded'});await loaded();
  assert.equal(await page.getByLabel('Canvas gradient type').inputValue(),'none');
  await fire('quota');
  const png=await sharp({create:{width:15,height:14,channels:4,background:{r:198,g:33,b:55,alpha:1}}}).png().toBuffer();
  await page.getByLabel('Import canvas background image').setInputFiles({name:'quota-injection.png',mimeType:'image/png',buffer:png});
  await waitFire();
  const afterQuota=await get();
  assert.equal(afterQuota.revision,first.revision);
  assert.equal(afterQuota.assets,0);
  console.log('S9_QUOTA_ABORT_BLOB_INSERT_PRESERVED=1');
  await fire(null);await page.reload({waitUntil:'domcontentloaded'});await loaded();
  await fire('pointer');
  await page.getByLabel('Canvas gradient type').selectOption('radial');
  await waitFire();
  const afterPointer=await waitChange(s=>s.revision===first.revision+1,'transaction committed before failed pointer');
  assert.equal(afterPointer.type,'radial');
  console.log('S9_COMMITTED_WITH_FAILED_POINTER='+JSON.stringify({revision:afterPointer.revision,pointer:afterPointer.pointer.slice(0,90)}));
  await fire(null);await page.reload({waitUntil:'domcontentloaded'});await loaded();
  assert.equal(await page.getByLabel('Canvas gradient type').inputValue(),'radial');
  assert.equal((await get()).revision,first.revision+1);
  console.log('S9_POINTER_RELOAD_RECOVERED=1');
  console.log('S9_BROWSER_FAILURE_INJECTION_PASS=1');
 }finally{await browser.close();}
}
main().catch(e=>{console.error('S9_BROWSER_FAULTS_FAIL',e.stack||e.message);process.exitCode=1});
