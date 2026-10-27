/* Supervisor #6: real Chromium imported-image regression, latest-revision pixels and safe telemetry.
 * Run against a LOCAL Next instance. Uses only files generated in-memory.
 */
const assert=require('node:assert/strict');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only','node_modules','playwright-core'));
const sharp=require(path.join(process.env.S6_PROJECT_ROOT||process.env.S5_PROJECT_ROOT,'node_modules','sharp'));
const url=process.env.S6_BROWSER_URL||'http://127.0.0.1:38473/workspace';
const out=process.env.S6_EVIDENCE_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts';
const selector='.aw-graph-node.aw-node-output img';
const visual='.aw-render-image';
async function fixture(rgb) {
  const png=await sharp({create:{width:24,height:16,channels:4,background:{...rgb,alpha:1}}}).png().toBuffer();
  return {name:'local-import.png',mimeType:'image/png',buffer:png,sha256:crypto.createHash('sha256').update(png).digest('hex'),bytes:png.length};
}
async function run() {
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-first-run','--disable-extensions']});
  const context=await browser.newContext({viewport:{width:1500,height:980}});
  await context.addInitScript(()=>{
    window.__s7readProject=async()=>{
      const raw=JSON.parse(localStorage.getItem('apexify-workspace-document-v1')||'{}');
      if(raw.storageKind!=='apexify-workspace-indexeddb')return raw;
      const db=await new Promise((resolve,reject)=>{
        const req=indexedDB.open('apexify-workspace-immutable-assets-v1',1);
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
      });
      try{
        const tx=db.transaction(['projects','blobs'],'readonly');
        const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
        const record=await request(tx.objectStore('projects').get('active-project'));
        if(!record)return {};
        const doc=record.document;
        const entries=await Promise.all(doc.assets.map(async meta=>{
          const result=await request(tx.objectStore('blobs').get(meta.id));
          if(!result)return {...meta,missing:true};
          const buffer=new Uint8Array(await result.blob.arrayBuffer());
          let text='';for(let i=0;i<buffer.length;i+=8192)text+=String.fromCharCode(...buffer.subarray(i,i+8192));
          return {...meta,dataUri:'data:'+meta.mime+';base64,'+btoa(text)};
        }));
        return {...doc,assets:entries};
      }finally{db.close();}
    };

    window.__s6={created:[],revoked:[],previewChanges:[]};
    const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
    URL.createObjectURL=function(blob){const value=oldCreate.call(URL,blob);
      window.__s6.created.push({url:value,bytes:blob.size,mime:blob.type});return value;};
    URL.revokeObjectURL=function(src){window.__s6.revoked.push(src);return oldRevoke.call(URL,src)};
    const observer=new MutationObserver(()=>{
      for(const el of document.querySelectorAll('.aw-render-image,.aw-node-output img')){
        const src=el.getAttribute('src');const last=window.__s6.previewChanges.at(-1);
        if(src && (last?.src!==src || last?.kind!==el.className)){
          window.__s6.previewChanges.push({kind:String(el.className),src});
        }
      }
    });
    observer.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
  });
  const page=await context.newPage();
  const exceptions=[],responses=[],fetchFailures=[];
  page.on('pageerror',e=>exceptions.push(String(e.message)));
  page.on('requestfailed',r=>{if(r.url().includes('/api/workspace/render'))
    fetchFailures.push({reason:r.failure()?.errorText||'unknown',method:r.method()})});
  page.on('response',r=>{if(r.url().includes('/api/workspace/render')){
    const record={status:r.status(),type:r.headers()['content-type']||'',source:'POST /api/workspace/render'};
    responses.push(record);
    // This callback intentionally excludes binary media or base64 from logs.
    // The browser owns this response body; decode an independent direct probe below.
  }});
  const current=async()=>page.evaluate(async()=>{
    const value=await window.__s7readProject();
    return {assets:value.assets?.map(a=>({id:a.id,sha256:a.sha256,width:a.width,height:a.height,bytes:a.bytes,mime:a.mime})),
      background:value.canvasExtras?.customBg,
      layers:value.canvasExtras?.bgLayers?.map(x=>({type:x.type,source:x.source}))};
  });
  const sample=async(which='graph')=>page.evaluate(async({which,selector,visual})=>{
    const img=document.querySelector(which==='graph'?selector:visual);
    if(!img||!img.complete||!img.naturalWidth)return null;
    try{await img.decode();}catch{return null;}
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
    const pixel=Array.from(ctx.getImageData(c.width-12,c.height-12,1,1).data);
    return {src:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight,pixel};
  },{which,selector,visual});
  async function waitColor(expected,description,oldSrc) {
    const handle=await page.waitForFunction(({expected,selector,visual,oldSrc})=>{
      const a=document.querySelector(selector),b=document.querySelector(visual);
      if(!a||!b||!a.complete||!b.complete||!a.naturalWidth||!b.naturalWidth
        || a.currentSrc!==b.currentSrc || (oldSrc&&a.currentSrc===oldSrc))return false;
      const c=document.createElement('canvas');c.width=a.naturalWidth;c.height=a.naturalHeight;
      const x=c.getContext('2d');x.drawImage(a,0,0);
      const p=Array.from(x.getImageData(c.width-12,c.height-12,1,1).data);
      const valid=expected==='green'?p[0]<90&&p[1]>180&&p[2]<110:
        expected==='magenta'?p[0]>150&&p[1]<110&&p[2]>140:
        expected==='dark'?p[0]<80&&p[1]<110&&p[2]<120:false;
      return valid?{src:a.currentSrc,width:a.naturalWidth,height:a.naturalHeight,pixel:p}:false;
    },{expected,selector,visual,oldSrc},{timeout:25000});
    const graph=await handle.jsonValue();
    assert.equal(graph.width,1280);assert.equal(graph.height,720);
    console.log('S6_PIXEL_'+description.toUpperCase()+'='+JSON.stringify({pixel:graph.pixel,width:graph.width,height:graph.height,urlVersion:graph.src.slice(-8)}));
    return graph;
  }
  async function waitSaved(sha256) {
    const expiry=Date.now()+20000;
    while(Date.now()<expiry){
      const value=await page.evaluate(()=>window.__s7readProject());
      if(value.canvasExtras?.customBg?.source==='asset:'+sha256)return value;
      await new Promise(resolve=>setTimeout(resolve,80));
    }
    throw new Error('indexeddb project manifest did not persist expected asset '+sha256);
  }
  async function upload(item){
    await page.getByLabel('Import canvas background image').setInputFiles({name:item.name,mimeType:item.mimeType,buffer:item.buffer});
    await waitSaved(item.sha256);
    const state=await current();
    assert.equal(state.background.source,'asset:'+item.sha256);
    assert.ok(state.assets.some(a=>a.sha256===item.sha256 && a.bytes===item.bytes && a.width===24&&a.height===16));
    assert.equal(await page.getByLabel('Graph connect canvas image asset').inputValue(),state.background.source);
    console.log('S6_IMPORTED_METADATA='+JSON.stringify({sha256:item.sha256,bytes:item.bytes,width:24,height:16,assetCount:state.assets.length}));
  }
  try{
    const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    assert.equal(resp.status(),200);
    await page.getByLabel('Import canvas background image').waitFor({state:'visible',timeout:30000});
    await page.screenshot({path:path.join(out,'supervisor6_before.png'),fullPage:false});
    console.log('S6_ORIGINAL_SELECTOR_MATCH='+await page.locator('.aw-graph-node-output img').count());
    assert.equal(await page.locator('.aw-graph-node-output img').count(),0,'old test selector must not match');
    const green=await fixture({r:25,g:213,b:75});
    await upload(green);
    const original=await waitColor('green','green-import');
    await page.screenshot({path:path.join(out,'supervisor6_after_import.png'),fullPage:false});
    // A genuinely different bitmap is introduced and made authoritative.
    const magenta=await fixture({r:213,g:35,b:217});
    await upload(magenta);
    let m=await waitColor('magenta','latest-magenta',original.src);
    await page.getByLabel('Undo').click();
    await waitSaved(green.sha256);
    const recovered=await waitColor('green','undo-green',m.src);
    await page.getByLabel('Redo').click();
    await waitSaved(magenta.sha256);
    m=await waitColor('magenta','redo-magenta',recovered.src);
    // Graph source port modifies the authoritative project; latest preview must follow.
    await page.getByLabel('Graph connect canvas image asset').selectOption('none');
    const noAsset=await waitColor('dark','graph-disconnect',m.src);
    await page.getByLabel('Undo').click();
    m=await waitColor('magenta','graph-undo',noAsset.src);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByLabel('Import canvas background image').waitFor({state:'visible',timeout:30000});
    const restored=await waitColor('magenta','reload-magenta');
    assert.equal((await current()).background.source,'asset:'+magenta.sha256);
    await page.screenshot({path:path.join(out,'supervisor6_after_reload.png'),fullPage:false});
    const fit=page.getByLabel('Imported background fit');
    await fit.selectOption('contain');
    const contained=await waitColor('dark','fit-contain',restored.src);
    await fit.selectOption('cover');
    const covered=await waitColor('magenta','fit-cover',contained.src);
    const choose=page.getByLabel('Graph connect canvas image asset');
    // Intentional rapid successive edits: only the final semantic source may win.
    for(const id of [green.sha256,magenta.sha256,green.sha256,magenta.sha256]){
      await choose.selectOption('asset:'+id);
    }
    const newest=await waitColor('magenta','rapid-final',covered.src);
    assert.equal((await current()).background.source,'asset:'+magenta.sha256);
    const direct=await page.evaluate(async()=>{
      const project=await window.__s7readProject();
      const response=await fetch('/api/workspace/render',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(project)});
      const blob=await response.blob();
      const bitmap=await createImageBitmap(blob);
      try{
        const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
        const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);
        return {status:response.status,mime:response.headers.get('content-type'),
          bytes:blob.size,width:bitmap.width,height:bitmap.height,
          pixel:Array.from(ctx.getImageData(bitmap.width-12,bitmap.height-12,1,1).data)};
      }finally{bitmap.close();}
    });
    assert.equal(direct.status,200);
    assert.ok(direct.mime.startsWith('image/png')&&direct.bytes>100);
    assert.equal(direct.width,1280);assert.equal(direct.height,720);
    assert.deepEqual(direct.pixel,[213,35,217,255]);
    console.log('S6_DIRECT_API_DECODED='+JSON.stringify(direct));
    const telemetry=await page.evaluate(()=>window.__s6);
    assert.ok(telemetry.created.length>=1,'browser must create object URL');
    assert.ok(responses.some(r=>r.status===200&&r.type.startsWith('image/png')),'pinned render API must serve PNG');
    assert.equal(exceptions.length,0,'browser exceptions '+exceptions.join('|'));
    console.log('S6_RENDER_LIFECYCLE='+JSON.stringify({requests:responses.length,
      responses:responses.map(r=>({status:r.status,type:r.type})),
      aborted:fetchFailures.length,objectURLs:telemetry.created.length,revoked:telemetry.revoked.length,
      previewTransitions:telemetry.previewChanges.length}));
    console.log('S6_BROWSER_ERRORS='+JSON.stringify(exceptions));
    console.log('S6_BROWSER_REGRESSION_PASS=1');
    // Corrupted persisted image must not replace a valid user project or be silently overwritten.
    const corrupt=await page.evaluate(async()=>{
      const key='apexify-workspace-document-v1',raw=localStorage.getItem(key);
      const project=await window.__s7readProject(),asset=project.assets[0];
      const db=await new Promise((resolve,reject)=>{
        const request=indexedDB.open('apexify-workspace-immutable-assets-v1');
        request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
      });
      try{
        const tx=db.transaction('blobs','readonly');
        const record=await new Promise((resolve,reject)=>{
          const r=tx.objectStore('blobs').get(asset.id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
        });
        const bytes=new Uint8Array(await record.blob.arrayBuffer());
        bytes[bytes.length-1]^=1;
        record.blob=new Blob([bytes],{type:record.mime});
        const write=db.transaction('blobs','readwrite');
        write.objectStore('blobs').put(record);
        await new Promise((resolve,reject)=>{write.oncomplete=resolve;write.onabort=()=>reject(write.error)});
      }finally{db.close();}
      return {length:raw.length,source:project.canvasExtras.customBg.source,assetCount:project.assets.length};
    });
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('alert',{name:'Workspace project recovery'}).waitFor({state:'visible',timeout:15000});
    await page.getByLabel('Import canvas background image').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>document.querySelector('.aw-render-image')?.naturalWidth>0,null,{timeout:20000});
    const after=await page.evaluate(async()=>{
      const raw=localStorage.getItem('apexify-workspace-document-v1');
      const d=await window.__s7readProject();
      return {length:raw.length,source:d.canvasExtras?.customBg?.source,
        assetCount:d.assets?.length};
    });
    assert.equal(after.length,corrupt.length,'corrupt saved project must not be overwritten during fallback');
    assert.equal(after.source,corrupt.source,'corrupt storage record must survive intact');
    assert.equal(after.assetCount,2);
    await page.screenshot({path:path.join(out,'supervisor6_corrupt_recovery_preserved.png'),fullPage:false});
    console.log('S6_CORRUPT_RECOVERY_PRESERVED='+JSON.stringify({length:after.length,assets:after.assetCount}));
  } catch(error){
    await page.screenshot({path:path.join(out,'supervisor6_failed_diagnostic.png'),fullPage:false}).catch(()=>{});
    console.log('S6_FAILURE_STATE='+JSON.stringify({state:await current().catch(()=>null),
      graph:await sample('graph').catch(()=>null),visual:await sample('visual').catch(()=>null),responses,exceptions}));
    throw error;
  } finally {await browser.close();}
}
run().catch(error=>{console.error('S6_BROWSER_REGRESSION_FAIL',error.stack||error.message);process.exitCode=1;});
