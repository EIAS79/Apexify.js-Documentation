/* Separate exact-path real Chromium import verification from prior real Save project exports.
 * The previous browser lifecycle proof is reused. This verifies actual file-picker recovery,
 * a distinguishable preceding document, SHA256 of exported bytes and native preview.
 */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const out='D:/ApexifyWorkspaceParallel/IMG01_RECOVERY_20261025/strict-lifecycle-browser';
const cdp=process.env.IMG01_CHROME_CDP||'http://127.0.0.1:38545';
const url=process.env.IMG01_BROWSER_URL||'http://127.0.0.1:38719/workspace';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const equality=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function targetValue(doc,p){
 if(p==='options.isGrouped')return Boolean(doc.layers?.[0]?.imageGroupId);
 if(p==='options.groupTransform')return doc.imageGroups?.[0]?.transform;
 const a=p.split('.'),group=a[0]==='options',parts=group?a.slice(2):a.slice(1);
 let x=group?doc.imageGroups?.[0]?.transform:doc.layers?.[0];
 if(!group&&!['x','y','width','height','rotation','opacity','source'].includes(parts[0]))x=x?.imageOptions;
 for(const key of parts){if(x==null)return undefined;if(Array.isArray(x))x=Array.isArray(x[0])?x[0][0]:x[0];x=x?.[key]}return x;
}
const batches=fs.readdirSync(out).filter(n=>/^batch-\d+-\d+(?:-\d+)?\.json$/.test(n)).map(n=>({name:n,stat:fs.statSync(path.join(out,n))})).sort((a,b)=>a.stat.mtimeMs-b.stat.mtimeMs);
const attempts=new Map();
for(const b of batches){
 const j=JSON.parse(fs.readFileSync(path.join(out,b.name),'utf8'));
 for(const x of j.results){const ary=attempts.get(x.index)||[];ary.push(x);attempts.set(x.index,ary)}
}
const candidates=[];
for(const [i,ary] of attempts){
 const passing=ary.filter(x=>x.inspector&&x.undoRedo&&x.indexedDB&&x.projectExport&&x.nativePreview&&x.codeApplied&&(x.graph||x.graphNotApplicable)).at(-1);
 if(!passing||passing.projectImported&&passing.preImportDivergence!==undefined)continue;
 const target=passing.projectFile||path.join(out,'project-exports','IMG01-CERT-'+i+'.apexify.json');
 if(!fs.existsSync(target)){candidates.push({index:i,path:passing.path,missing:target});continue}
 let saved;
 try{saved=JSON.parse(fs.readFileSync(target,'utf8'))}catch(e){candidates.push({index:i,path:passing.path,invalid:String(e)});continue}
 const expected=passing.finalInspectorReapplied?passing.after:(passing.graphAfter??passing.after);
 if(!equality(targetValue(saved,passing.path),expected)){candidates.push({index:i,path:passing.path,mismatch:true});continue}
 candidates.push({index:i,path:passing.path,saved,target,expected,passed:passing});
}
const result={schemaVersion:1,source:'saved-user-export-selected-through-visible-Open-project-tool',timestamp:new Date().toISOString(),total:candidates.length,rows:[]};
const file=path.join(out,'IMG01_STRICT_REAL_IMPORT_RECOVERY.json');
const persist=()=>fs.writeFileSync(file,JSON.stringify(result,null,2));
(async()=>{
const tab=await(await fetch(cdp+'/json/new?'+encodeURIComponent(url),{method:'PUT'})).json();
const ws=new WebSocket(tab.webSocketDebuggerUrl);const promises=new Map();let n=0;
ws.onmessage=({data})=>{const m=JSON.parse(data),p=promises.get(m.id);if(p){promises.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}};
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++n;promises.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(promises.has(id)){promises.delete(id);reject(Error('CDP timeout '+method))}},50000)});
const run=async expr=>{const res=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});if(res.exceptionDetails)throw Error(res.exceptionDetails.text);return res.result?.value};
const until=async(cb,ms=15000)=>{const start=Date.now();while(Date.now()-start<ms){try{const x=await cb();if(x)return x}catch(e){}await pause(120)}throw Error('Real UI import timed out')};
const active=()=>run("(async()=>{const db=await new Promise((ok,no)=>{const r=indexedDB.open('apexify-workspace-immutable-assets-v1');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});try{return (await new Promise((ok,no)=>{const r=db.transaction('projects','readonly').objectStore('projects').get('active-project');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}))?.document||null}finally{db.close()}})()");
const click=async expr=>{
 const pos=await run("(()=>{const e="+expr+";if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}})()");
 if(!pos||pos.w<1||pos.h<1)throw Error('Missing real clickable element: '+expr);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',x:pos.x,y:pos.y,clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',x:pos.x,y:pos.y,clickCount:1});
};
await send('Page.enable');await send('Runtime.enable');await send('DOM.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url});
await until(()=>run("document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'&&!!document.querySelector('.aw-tools')"),90000);
for(const entry of candidates){
 const proof={index:entry.index,path:entry.path,passed:false,realPicker:false,priorDistinct:false,sourceFile:null,sourceSHA256:null,sourceExportMatched:false,importedValueMatched:false,nativePreview:false,proofId:'IMG01-E-IMPORT-EXACT-'+entry.index,issue:null};
 try{
  if(entry.missing||entry.invalid||entry.mismatch)throw Error('Existing user export unavailable or mismatches exact browser proof');
  const before=await active();
  if(before?.name===entry.saved.name)throw Error('Pre-import active document is not distinct; cannot establish recovery transition');
  proof.priorDistinct=true;
  const bytes=fs.readFileSync(entry.target);
  proof.sourceFile=entry.target;proof.sourceSHA256=crypto.createHash('sha256').update(bytes).digest('hex');
  if(entry.passed.projectSHA256&&entry.passed.projectSHA256!==proof.sourceSHA256)throw Error('Original export changed since the browser proof');
  proof.sourceExportMatched=true;
  await click("[...document.querySelectorAll('.aw-tools button')].find(x=>x.textContent.trim()==='Open project')");
  const root=(await send('DOM.getDocument',{depth:2,pierce:true})).root;
  const picker=(await send('DOM.querySelector',{nodeId:root.nodeId,selector:'.aw-tools input[type=file]'})).nodeId;
  if(!picker)throw Error('Open project picker node missing');
  await send('DOM.setFileInputFiles',{nodeId:picker,files:[entry.target]});proof.realPicker=true;
  await until(async()=>{const d=await active();return d?.name===entry.saved.name&&equality(targetValue(d,entry.path),entry.expected)&&d?.layers?.length===entry.saved.layers.length},30000);
  proof.importedValueMatched=true;
  proof.nativePreview=Boolean(await until(()=>run("document.querySelector('img.aw-render-image')?.naturalWidth>0&&!document.querySelector('.aw-canvas-status .aw-status-working')"),30000));
  if(entry.index%20===0){const img=await send('Page.captureScreenshot',{format:'png'});const filePNG=path.join(out,'screenshots','IMG01-import-'+entry.index+'.png');fs.mkdirSync(path.dirname(filePNG),{recursive:true});fs.writeFileSync(filePNG,Buffer.from(img.data,'base64'));proof.screenshot=filePNG}
  proof.passed=true;
 }catch(e){proof.issue=String(e instanceof Error?e.stack:e).slice(0,550)}
 result.rows.push(proof);persist();
 console.log('IMG01_REAL_IMPORT',entry.index,entry.path,proof.passed,proof.issue?.slice(0,85)||'');
}
result.summary={total:result.rows.length,passed:result.rows.filter(x=>x.passed).length,failed:result.rows.filter(x=>!x.passed).length};persist();console.log('IMG01_REAL_IMPORT_COMPLETE',JSON.stringify(result.summary));ws.close();
})().catch(e=>{result.fatal=String(e.stack||e);if(result.rows.length)persist();else fs.writeFileSync(path.join(out,'IMG01_REAL_IMPORT_STARTUP_FAILURE.json'),JSON.stringify({error:result.fatal,timestamp:new Date().toISOString()},null,2));console.error(e);process.exitCode=1});
