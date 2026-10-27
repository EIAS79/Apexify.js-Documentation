/* S21 direct real Chromium/CDP acceptance, no mocked renderer, storage or codegen. */
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const ORIGIN='http://127.0.0.1:38610/workspace',CDP='http://127.0.0.1:38611',ROOT='D:/ApexifyWorkspaceIntegration/audit/S21_S20_CONTROLLED_INTEGRATION/S21_BROWSER';
const sleep=n=>new Promise(r=>setTimeout(r,n));let socket=null;
(async()=>{
 await fsp.mkdir(ROOT,{recursive:true});
 const tab=await(await fetch(CDP+'/json/new?'+encodeURIComponent(ORIGIN),{method:'PUT'})).json();
 socket=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((ok,no)=>{socket.onopen=ok;socket.onerror=no});
 let seq=0;const pending=new Map(),rows=[],errors=[],screens=[];
 socket.onmessage=(event)=>{let r;try{r=JSON.parse(event.data)}catch{return}
  const p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.ok(r.result)};
 function send(method,params={}){return new Promise((ok,no)=>{let id=++seq;pending.set(id,{ok,no});socket.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);no(Error('CDP timeout '+method))}},60000)})}
 async function ev(exp){const r=await send('Runtime.evaluate',{expression:exp,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value}
 async function until(exp,label,ms=42000){const start=Date.now();let last;while(Date.now()-start<ms){try{last=await ev(exp);if(last)return last}catch(err){last=String(err.message)}await sleep(150)}throw Error('Timeout '+label+' last='+JSON.stringify(last))}
 async function snap(name){const r=await send('Page.captureScreenshot',{format:'png',fromSurface:true});const loc=path.join(ROOT,name+'.png');await fsp.writeFile(loc,Buffer.from(r.data,'base64'));screens.push(name+'.png')}
 async function state(){return ev("(async()=>{const db=await new Promise((ok,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});try{const r=db.transaction('projects','readonly').objectStore('projects').get('active-project');return await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}finally{db.close()}})()")}
 async function preview(){return ev("(async()=>{const img=document.querySelector('img.aw-render-image');if(!img||!img.complete||!img.naturalWidth)return null;const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const bytes=ctx.getImageData(0,0,c.width,c.height).data;const dig=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(dig),v=>v.toString(16).padStart(2,'0')).join('')})()")}
 async function action(type,label,value){const result=await ev("(()=>{let el=[...document.querySelectorAll('"+type+"[aria-label]')].find(x=>x.getAttribute('aria-label')==="+JSON.stringify(label)+");if(!el)return 'MISSING:'+ "+JSON.stringify(label)+";"+(type==='button'?"el.click();return true":type==='input'?"const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(el,"+JSON.stringify(String(value))+");el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return el.value":"el.value="+JSON.stringify(value)+";el.dispatchEvent(new Event('change',{bubbles:true}));return el.value")+"})()");
  if(String(result).startsWith('MISSING:'))throw Error(result);return result}
 async function clickText(text){return ev("(()=>{let b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==="+JSON.stringify(text)+");if(!b)return false;b.click();return true})()")}
 async function checkbox(label,desired){return ev("(()=>{let e=[...document.querySelectorAll('input[aria-label]')].find(x=>x.getAttribute('aria-label')==="+JSON.stringify(label)+");if(!e){e=[...document.querySelectorAll('label.aw-field')].find(x=>x.querySelector('span')?.textContent.trim()==="+JSON.stringify(label)+")?.querySelector('input[type=checkbox]')}if(!e)return 'MISSING';if(e.checked!=="+desired+")e.click();return e.checked})()")}
 async function storedWhere(predicate,label,prev){const start=Date.now();let s;while(Date.now()-start<30000){s=await state();if(s&&(!prev||s.revision>prev)&&predicate(s.document))return s;await sleep(170)}throw Error('Persisted state missing: '+label+'; last='+JSON.stringify(s?.document?.canvasExtras).slice(0,300))}
 async function edited(label,fn,check){const s=await state();const first=await preview();await fn();const saved=await storedWhere(check,label,s?.revision);await until("document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false' && document.querySelector('img.aw-render-image')?.naturalWidth>0",label+' native');
 await sleep(350);const last=await preview();return {revision:saved.revision,before:first,after:last,changed:first!==last}}
 async function undoRedo(expected,previous){const s=await state();await action('button','Undo');await storedWhere(x=>previous(x),'Undo',s.revision);const t=await state();await action('button','Redo');await storedWhere(expected,'Redo',t.revision)}
 async function exports(name){await ev("(()=>{if(!window.__s21Capture){const f=URL.createObjectURL.bind(URL);window.__s21Capture=[];URL.createObjectURL=(blob)=>{window.__s21Capture.push(blob);return f(blob)}}return true})()");
 await action('button','Download project JSON');await sleep(120);let project=await ev("(async()=>{const x=window.__s21Capture?.findLast(b=>b.type==='application/json');return x?await x.text():null})()");
 assert.ok(project,'Browser Project export empty');await fsp.writeFile(path.join(ROOT,name+'.apexify.json'),project);
 await action('button','Download source');await sleep(140);let code=await ev("(async()=>{const x=window.__s21Capture?.findLast(b=>b.type==='text/typescript');return x?await x.text():null})()");
 assert.ok(code&&code.includes('painter.createCanvas'),'Browser public Code export empty');await fsp.writeFile(path.join(ROOT,name+'.ts'),code);
 return {project:JSON.parse(project),codeBytes:code.length};
 }
 const report={pathRecords:rows,errors,screens,engineCommit:'9fe8b95f372efdadcd5ebdab1e9f6333413187c6'};
 async function fresh(label){assert.equal(await clickText('New Project'),true);await until("document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",label+' new');await sleep(220);return await state()}
 try{
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1700,height:1080,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:ORIGIN});
 await until("document.readyState==='complete' && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",'workspace loaded',90000);
 // 1. Root procedural repeat Inspector and Graph; real render (no simulated raster).
 await fresh('root repeat');
 await action('select','Canvas pattern type','dots');
 await storedWhere(d=>d.canvasExtras?.patternBg?.type==='dots','root pattern');
 const a=await edited('Inspector root repeat',()=>action('select','Pattern repeat','no-repeat'),d=>d.canvasExtras?.patternBg?.repeat==='no-repeat');
 const b=await edited('Graph root repeat',()=>action('select','Graph root repeat','repeat-y'),d=>d.canvasExtras?.patternBg?.repeat==='repeat-y');
 await undoRedo(d=>d.canvasExtras?.patternBg?.repeat==='repeat-y',d=>d.canvasExtras?.patternBg?.repeat==='no-repeat');
 await snap('01_root_repeat_inspector_graph');
 const exp1=await exports('01_root_repeat');rows.push({path:'canvas.patternBg.repeat',inspector:a,graph:b,undoRedo:true,export:exp1.codeBytes});
 await send('Page.reload',{ignoreCache:true});
 await until("document.readyState==='complete' && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",'S21 path 1 IndexedDB reload',65000);
 assert.ok( (await state()).document.canvasExtras?.patternBg?.repeat==='repeat-y' , 'S21 independent IndexedDB reload not persisted for path 1');
 rows.at(-1).persistedAfterReload=true;
 // 2. Ordered procedural preset Pattern, preserve stable node IDs and graph.
 await fresh('layer pattern repeat');
 assert.equal(await clickText('Add pattern layer'),true);
 await storedWhere(d=>d.canvasExtras?.bgLayers?.[0]?.type==='presetPattern','preset layer');
 const beforeLayer=(await state()).document.canvasExtras.bgLayers[0].nodeId;
 const c=await edited('Inspector layer repeat',()=>action('select','Layer 1 repeat','repeat-x'),d=>d.canvasExtras?.bgLayers?.[0]?.pattern?.repeat==='repeat-x');
 const d=await edited('Graph layer repeat',()=>action('select','Graph layer 1 repeat','no-repeat'),d=>d.canvasExtras?.bgLayers?.[0]?.pattern?.repeat==='no-repeat');
 await undoRedo(doc=>doc.canvasExtras?.bgLayers?.[0]?.pattern?.repeat==='no-repeat',doc=>doc.canvasExtras?.bgLayers?.[0]?.pattern?.repeat==='repeat-x');
 assert.equal((await state()).document.canvasExtras.bgLayers[0].nodeId,beforeLayer);
 await snap('02_ordered_repeat_inspector_graph');
 const exp2=await exports('02_layer_repeat');rows.push({path:'canvas.bgLayers.pattern.repeat',inspector:c,graph:d,stableNodeId:beforeLayer,undoRedo:true,export:exp2.codeBytes});
 await send('Page.reload',{ignoreCache:true});
 await until("document.readyState==='complete' && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",'S21 path 2 IndexedDB reload',65000);
 assert.ok( (await state()).document.canvasExtras?.bgLayers?.[0]?.pattern?.repeat==='no-repeat' , 'S21 independent IndexedDB reload not persisted for path 2');
 rows.at(-1).persistedAfterReload=true;
 // 3. Shadow radius explicitly takes precedence over owning Canvas radius (transparent background).
 await fresh('shadow radius');assert.equal(await checkbox('Transparent base',true),true);assert.equal(await checkbox('Canvas shadow enabled',true),true);
 await action('input','Canvas shadow X',0);await action('input','Canvas shadow Y',0);await action('input','Canvas shadow blur',0);
 await action('select','Canvas shadow radius mode','numeric');
 await storedWhere(doc=>typeof doc.canvasExtras?.shadow?.borderRadius==='number','numeric shadow');
 await action('input','Canvas shadow radius',0);
 await storedWhere(doc=>doc.canvasExtras?.shadow?.borderRadius===0,'shadow flat');
 const e=await edited('Inspector shadow radius',()=>action('input','Canvas shadow radius',65),doc=>doc.canvasExtras?.shadow?.borderRadius===65);
 const f=await edited('Graph shadow radius',()=>action('input','Graph shadow radius',24),doc=>doc.canvasExtras?.shadow?.borderRadius===24);
 await undoRedo(doc=>doc.canvasExtras?.shadow?.borderRadius===24,doc=>doc.canvasExtras?.shadow?.borderRadius===65);
 await snap('03_shadow_radius_inspector_graph');
 const exp3=await exports('03_shadow_radius');rows.push({path:'canvas.shadow.borderRadius',inspector:e,graph:f,undoRedo:true,export:exp3.codeBytes});
 await send('Page.reload',{ignoreCache:true});
 await until("document.readyState==='complete' && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",'S21 path 3 IndexedDB reload',65000);
 assert.ok( (await state()).document.canvasExtras?.shadow?.borderRadius===24 , 'S21 independent IndexedDB reload not persisted for path 3');
 rows.at(-1).persistedAfterReload=true;
 // 4. Deprecated alias wins root Canvas borderPosition; roundedCorners remains undefined.
 await fresh('shadow legacy position');assert.equal(await checkbox('Transparent base',true),true);await action('input','Border radius',55);assert.equal(await checkbox('Canvas shadow enabled',true),true);
 await action('input','Canvas shadow X',0);await action('input','Canvas shadow Y',0);await action('input','Canvas shadow blur',0);
 await action('select','Canvas shadow border position','all');
 await storedWhere(doc=>doc.canvasExtras?.shadow?.borderPosition==='all','shadow alias all');
 const g=await edited('Inspector deprecated position',()=>action('select','Canvas shadow border position','top'),doc=>doc.canvasExtras?.shadow?.borderPosition==='top');
 const h=await edited('Graph deprecated position',()=>action('select','Graph shadow border position','left'),doc=>doc.canvasExtras?.shadow?.borderPosition==='left');
 await undoRedo(doc=>doc.canvasExtras?.shadow?.borderPosition==='left',doc=>doc.canvasExtras?.shadow?.borderPosition==='top');
 await snap('04_shadow_alias_inspector_graph');const exp4=await exports('04_shadow_position');
 rows.push({path:'canvas.shadow.borderPosition',inspector:g,graph:h,undoRedo:true,export:exp4.codeBytes});
 await send('Page.reload',{ignoreCache:true});await until("document.readyState==='complete' && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",'reload persistence',65000);
 const reloaded=await state();assert.equal(reloaded.document.canvasExtras.shadow.borderPosition,'left');rows.at(-1).persistedAfterReload=true;await snap('05_shadow_persisted_after_reload');
 report.passed=true;
 }catch(err){errors.push(String(err.stack||err));report.passed=false}
 finally{await fsp.writeFile(path.join(ROOT,'S21_FOUR_CHROMIUM_REPORT.json'),JSON.stringify(report,null,2));console.log('S21_CHROMIUM_FINAL='+JSON.stringify({pass:report.passed,count:rows.length,errors:errors.length,changed:rows.map(r=>[r.path,r.inspector.changed,r.graph.changed])}));socket?.close();}
 if(!report.passed)process.exitCode=1;
})().catch(err=>{console.error('S21_CDP_FATAL',err.stack||err);socket?.close();process.exitCode=1});
