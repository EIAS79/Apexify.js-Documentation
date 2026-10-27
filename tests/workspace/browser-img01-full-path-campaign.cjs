/* IMG01 real-browser per-leaf campaign: only native CDP Input events and real Workspace controls.
 * One row is never promoted by this script; it records independent criterion evidence.
 * Usage: IMG01_START=0 IMG01_END=55 node tests/workspace/browser-img01-full-path-campaign.cjs
 */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=process.cwd();
const out=process.env.IMG01_CAMPAIGN_OUT||'D:/ApexifyWorkspaceParallel/IMG01_RECOVERY_20261025/strict-lifecycle-browser';
const fixtures=process.env.IMG01_FIXTURE_DIR||'D:/ApexifyWorkspaceParallel/IMG01_RECOVERY_20261025/strict-browser-fixtures';
const cdp=process.env.IMG01_CHROME_CDP||'http://127.0.0.1:38545';
const url=process.env.IMG01_BROWSER_URL||'http://127.0.0.1:38719/workspace';
const lo=Number(process.env.IMG01_START||0),hi=Number(process.env.IMG01_END||330),runId=Date.now().toString();
const only=process.env.IMG01_ONLY_INDICES?new Set(process.env.IMG01_ONLY_INDICES.split(',').map(Number)):null;
const items=JSON.parse(fs.readFileSync(fixtures+'/manifest.json','utf8')).entries;
const surface=JSON.parse(fs.readFileSync(root+'/docs/workspace/IMG01_STRICT_INSPECTOR_SURFACE_330.json','utf8')).rows;
const surf=new Map(surface.map(x=>[x.path,x]));
if(items.length!==330||surface.length!==330)throw Error('Incorrect exact source inventory');
fs.mkdirSync(out,{recursive:true});
const report={schemaVersion:1,pin:'379a5248f09ed39c1b1734fe104b6bd73a77857f',start:lo,end:hi,runId,results:[]};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const eq=(a,b)=>{
 if(typeof a==='number'&&typeof b==='number')return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7;
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)!==Array.isArray(b))return false;
 const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();
 return ak.length===bk.length&&ak.every((k,i)=>k===bk[i]&&eq(a[k],b[k]));
};
function getValue(doc,p){
 const parts=p.split('.');
 const group=parts[0]==='options';
 if(group&&p==='options.isGrouped')return !!doc.layers?.[0]?.imageGroupId;
 let x=group?doc.imageGroups?.[0]?.transform:doc.layers?.[0];
 const steps=group?parts.slice(2):parts.slice(1);
 if(!group&&!['x','y','width','height','rotation','opacity','source'].includes(steps[0]))x=x?.imageOptions;
 for(const bit of steps){if(x==null)return undefined;
  if(Array.isArray(x)){x=Array.isArray(x[0])?x[0][0]:x[0]}
  x=x?.[bit];
 }
 return x;
}
function idbJS(){
 return "(async()=>{const db=await new Promise((ok,no)=>{const r=indexedDB.open('apexify-workspace-immutable-assets-v1');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});try{return (await new Promise((ok,no)=>{const r=db.transaction('projects','readonly').objectStore('projects').get('active-project');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}))?.document||null}finally{db.close()}})()";
}
(async()=>{
const tab=await(await fetch(cdp+'/json/new?'+encodeURIComponent(url),{method:'PUT'})).json();
const ws=new WebSocket(tab.webSocketDebuggerUrl),pending=new Map();let serial=0;
ws.onmessage=({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}};
await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timed out: '+method))}},60000)});
const evalJS=async expression=>{const v=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(v.exceptionDetails)throw Error('Chrome: '+v.exceptionDetails.text);return v.result?.value};
const until=async(fn,ms=10000)=>{if(process.env.IMG01_FAST_DIAG==='1'&&ms<=30000)ms=Math.min(ms,5000);const start=Date.now();let failure;while(Date.now()-start<ms){try{const res=await fn();if(res)return res}catch(e){failure=String(e.message)}await pause(160)}throw Error('Timeout '+(failure||''))};
const center=async(expression)=>evalJS("(()=>{const el="+expression+";if(!el)return null;el.scrollIntoView({block:'center',inline:'center'});const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}})()");
const click=async expression=>{
 const p=await center(expression);if(!p||p.w<1||p.h<1)throw Error('Invisible click target '+expression);
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
};
const keyboard=async(key,code,modifiers=0)=>{
 const vk=key==='a'?65:key==='ArrowDown'?40:key==='ArrowUp'?38:key==='Home'?36:key==='End'?35:key==='Enter'?13:key==='Tab'?9:0;
 for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key,code,modifiers,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk});
};
const input=async text=>send('Input.insertText',{text:String(text)});
const doc=async()=>evalJS(idbJS());
const selectLayer=async(name,layerId)=>{
 const document=await doc();
 const index=layerId?[...document.layers].reverse().findIndex(l=>l.id===layerId):-1;
 if(layerId&&index<0)throw Error('Image-layer ID not found '+layerId);
 const exp=index>=0?"[...document.querySelectorAll('.aw-layer-list > div > button:first-child')]["+index+"]":
  "[...document.querySelectorAll('.aw-layer-list button')].find(x=>x.textContent.includes("+JSON.stringify(name)+"))";
 await until(()=>evalJS('!!('+exp+')'),20000);
 await click(exp);
 await until(()=>evalJS('!!document.querySelector(".aw-image-options")'),4000);
};
const parentOpen=async(selector)=>{
 // A user can only operate a nested field if every parent <details> is open.
 for(let i=0;i<9;i++){
  const summary=await evalJS("(()=>{const x="+selector+";if(!x)return null;let p=x.closest('details');let outer=null;while(p){if(!p.open)outer=p;p=p.parentElement?.closest('details')}if(!outer)return null;const all=[...document.querySelectorAll('details')];return all.indexOf(outer)})()");
  if(summary===null)return;
  await click('document.querySelectorAll("details")['+summary+'].querySelector("summary")');
 }
 throw Error('Parent details remain closed');
};
const labelElement=(container,label)=>container+' [aria-label='+JSON.stringify(label)+']';
const interactive=(container,label)=>{
 const parent=labelElement(container,label);
 return "(()=>{const e=document.querySelector("+JSON.stringify(parent)+");if(!e)return null;if(e.matches('input,select,textarea,button'))return e;return e.querySelector('input,select,textarea,button')})()";
};
const change=async(expr)=>{
 await parentOpen(expr);
 const info=await evalJS("(()=>{const e="+expr+";return e&&{tag:e.tagName,type:e.type,disabled:e.disabled,value:e.value,checked:e.checked,options:e.options?[...e.options].map(x=>x.value):null,min:e.min,max:e.max,step:e.step,visible:e.getBoundingClientRect().width>0}})()");
 if(!info||info.disabled||!info.visible)throw Error('Control unavailable '+JSON.stringify(info));
 if(info.tag==='SELECT'){
  const target=await send('Runtime.evaluate',{expression:expr,returnByValue:false});
  if(!target.result?.objectId)throw Error('Select element cannot acquire keyboard focus');
  await send('DOM.focus',{objectId:target.result.objectId});
  const idx=info.options.indexOf(info.value);
  const dest=idx===0?'End':'Home';
  await keyboard(dest,dest);
  await keyboard('Enter','Enter');
 }else if(info.type==='checkbox'||info.type==='radio'){
  await click(expr);
 }else if(info.type==='number'||info.type==='text'){
  const old=Number(info.value),min=Number(info.min),max=Number(info.max);
  const step=info.type==='number'?(Number(info.step)>0?Number(info.step):1):1;
  const number=Number.isFinite(old)?old+Math.max(step,0.1):1;
  let changed=Number.isFinite(max)&&info.max!==''&&number>max?old-Math.max(step,0.1):number;
  if(info.min!==''&&changed<min)changed=min;
  const typed=info.type==='text'?(info.value.startsWith('#')?(info.value.toLowerCase()==='#ad71f3'?'#bd29a1':'#ad71f3'):info.value+' cert'):String(changed);
  const focusTarget=await send('Runtime.evaluate',{expression:expr,returnByValue:false});
  if(!focusTarget.result?.objectId)throw Error('Cannot resolve visible input for browser keyboard focus');
  await send('DOM.focus',{objectId:focusTarget.result.objectId});
  const focused=await evalJS("document.activeElement&&document.activeElement.getAttribute('aria-label')");
  if(focused===null)throw Error('Actual numeric/text field did not acquire keyboard focus');
  await keyboard('a','KeyA',2);await input(typed);await keyboard('Tab','Tab');
 }else if(info.type==='color'){
  const label=await evalJS("("+expr+")?.getAttribute('aria-label')");
  if(!label)throw Error('Native color control has no accessible label');
  const hex="("+expr+")?.closest('.aw-inspector,.aw-graph-semantic-properties')?.querySelector("+JSON.stringify('[aria-label="'+label+' hex'+'"]')+")";
  return change(hex);
 }else if(info.tag==='BUTTON'){
  await click(expr);
 }else throw Error('Unknown interactive control '+JSON.stringify(info));
 return info;
};
const changeNamed=async(container,label,optionPath='')=>{
 const numericDuplicate=(label==='Group film grain'||label==='Group chromatic aberration');
 const mesh=optionPath.includes('meshWarp.controlPoints.');
 const expr=mesh?"(()=>{const f=[...document.querySelectorAll("+JSON.stringify(container+' fieldset.aw-canvas-properties')+")].find(e=>e.querySelector('legend')?.textContent.includes('Mesh warp'));return f?.querySelector('details')?.querySelector("+JSON.stringify('input[aria-label="'+label+'"]')+")})()":
  numericDuplicate?"[...document.querySelectorAll("+JSON.stringify(container+' [aria-label="'+label+'"]')+")].find(e=>e.matches('input[type=number]'))":interactive(container,label);
 const exists=await evalJS('!!('+expr+')');
 if(!exists)throw Error('Control not found '+label+' in '+container);
 return change(expr);
};
const putFixture=async(f)=>{
 const code=fs.readFileSync(f,'utf8');
 await click("document.querySelector('.aw-code .cm-content')");
 await keyboard('a','KeyA',2);
 await input(code);
 await until(()=>evalJS("!!document.querySelector('.aw-code .aw-source-dirty')"),10000);
 await click("[...document.querySelectorAll('.aw-code button')].find(x=>x.textContent.includes('Apply code'))");
 const m=f.match(/(\d+)\.ts$/),expected='IMG01 CERT '+Number(m?.[1]);
 await until(()=>evalJS("document.querySelector('.aw-statusbar')?.textContent.includes("+JSON.stringify(expected)+")"),20000);
 await until(async()=>{const d=await doc();return d&&d.name===expected},15000);
};
const ensureImageAssetBlobs=async(row)=>{
 if(!row.path.endsWith('.mask.source'))return;
 const code=fs.readFileSync(row.file,'utf8');
 const prefix='const composition = ';
 const first=code.indexOf(prefix);
 if(first<0)throw Error('Certified image fixture missing canonical composition declaration');
 const raw=code.slice(first+prefix.length);
 const last=raw.indexOf('\n};');
 if(last<0)throw Error('Certified image fixture missing JSON closing delimiter');
 const fixture=JSON.parse(raw.slice(0,last+2));
 const list=fixture.assets||[];
 if(list.length<2)throw Error('Mask source variant requires at least two embedded local assets');
 const dir=path.join(out,'uploaded-fixture-assets');fs.mkdirSync(dir,{recursive:true});
 await send('DOM.enable');
 for(const asset of list){
  if(!asset?.dataUri||!/^data:image\/(png|jpeg|webp);base64,/.test(asset.dataUri))throw Error('Missing embedded bounded Image asset data');
  const bytes=Buffer.from(asset.dataUri.split(',')[1],'base64');
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Image asset SHA-256 mismatch');
  const file=path.join(dir,'IMG01-'+row.index+'-'+asset.sha256+'.png');
  fs.writeFileSync(file,bytes);
  const chooser=await until(async()=>{
   const x=await send('Runtime.evaluate',{expression:"document.querySelector('.aw-inspector input[aria-label=\"Upload verified image source\"]')",returnByValue:false});
   return x.result?.objectId?x:null;
  },13000);
  await send('DOM.setFileInputFiles',{objectId:chooser.result.objectId,files:[file]});
  await pause(950);
 }
 await until(()=>evalJS("!!document.querySelector('.aw-layer-list')"),9000);
};
const saveProject=async(row)=>{
 const dir=path.join(out,'project-exports');fs.mkdirSync(dir,{recursive:true});
 await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:dir});
 const target='IMG01-CERT-'+row.index;
 const old=new Map(fs.readdirSync(dir).filter(n=>n.startsWith(target)&&n.endsWith('.apexify.json')).map(n=>[n,fs.statSync(path.join(dir,n)).mtimeMs]));
 const started=Date.now();
 await click("[...document.querySelectorAll('.aw-statusbar button')].find(x=>x.textContent.includes('Save project'))");
 return until(()=>{
  const names=fs.readdirSync(dir).filter(n=>n.startsWith(target)&&n.endsWith('.apexify.json')).filter(n=>{
   const t=fs.statSync(path.join(dir,n)).mtimeMs;
   return !old.has(n)||(t!==old.get(n)&&t>=started-1500);
  });if(!names.length)return null;
  const file=path.join(dir,names[0]);const b=fs.readFileSync(file,'utf8');if(!b.endsWith('}'))return null;
  return {document:JSON.parse(b),file,sha256:crypto.createHash('sha256').update(b).digest('hex')};
 },12000);
};
await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url});
await until(()=>evalJS("document.querySelector('.aw-code .cm-content')&&document.querySelector('.aw-inspector')&&document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'"),80000);
for(let i=lo;i<Math.min(hi,items.length);i++){
 if(only&&!only.has(i))continue;
 const row=items[i],s=surf.get(row.path),external={
  'images.x':['X',null],'images.y':['Y',null],'images.width':['Width',null],'images.height':['Height',null],
  'images.rotation':['Rotation',null],'images.opacity':['Opacity',null],
  'images.source':['Image layer source','Graph image layer asset'],
  'options.isGrouped':['Image group selection','Graph image group'],
  'options.groupTransform':['Group rotation','Group rotation']
 }[row.path],proof={index:i,path:row.path,id:row.id,sourceFixtureValid:row.valid,inspector:false,graph:false,graphNotApplicable:false,undoRedo:false,indexedDB:false,projectExport:false,projectImported:false,nativePreview:false,codeApplied:false,proofIds:[],issues:[]};
 const t=Date.now();
 try{
  if(!row.valid)throw Error('No valid stage C source fixture: '+row.issue);
  if(!s?.matchedLabels?.length&&!external)throw Error('No mapped Image/Group Inspector label or applicable external control');
  await putFixture(row.file);proof.codeApplied=true;proof.proofIds.push('IMG01-E-CODE-APPLY-'+i);
  await selectLayer(row.layerName,row.layerId);
  await ensureImageAssetBlobs(row);
  if(row.path.endsWith('.mask.source'))proof.proofIds.push('IMG01-E-REAL-ASSET-PICKER-'+i);
  await selectLayer(row.layerName,row.layerId);
  const oldDoc=await doc(),oldValue=getValue(oldDoc,row.path);
  if(process.env.IMG01_DIAG==='1'){
   console.log('IMG01_PRE_EDIT',i,row.path,'NAME',oldDoc?.name,'OPTIONS',JSON.stringify(row.path.startsWith('options.')?oldDoc?.imageGroups?.[0]?.transform:oldDoc?.layers?.[0]?.imageOptions).slice(0,1400),'BEFORE',JSON.stringify(oldValue));
   if(row.path.includes('meshWarp.controlPoints.'))console.log('IMG01_MESH_FIELDS',JSON.stringify(await evalJS("[...document.querySelectorAll('.aw-inspector input')].filter(e=>/Vertex|^Y$/.test(e.getAttribute('aria-label')||'')).map(e=>({label:e.getAttribute('aria-label'),value:e.value,details:e.closest('details')?.querySelector('summary')?.textContent,legend:e.closest('fieldset')?.querySelector('legend')?.textContent})).slice(0,30)")));
  }
  const mapped=s?.matchedLabels?.length?s.matchedLabels:[external[0]];
  const last=row.path.split('.').at(-1);
  const preferred=row.path==='images.shadow.borderRadius'?'Image shadow radius':
   row.path==='options.groupTransform.shadow.borderRadius'?'Image group shadow radius':
   row.path==='options.groupTransform.effects.chromaticAberration.intensity'?'Group chromatic aberration':
   row.path==='options.groupTransform.effects.filmGrain.intensity'?'Group film grain':
   row.path.endsWith('.points.y')||row.path.endsWith('.clipPath.y')?'Y 1':
   row.path.endsWith('.points.x')||row.path.endsWith('.clipPath.x')?'Point 1 X':
   row.path.endsWith('.meshWarp.controlPoints.y')?'Y':
   row.path.endsWith('.meshWarp.controlPoints.x')?'Vertex 0 X':
   row.path.includes('controlPoints.from')?(last==='x'?'from X':last==='y'?'from Y':null):
   row.path.includes('controlPoints.to')?(last==='x'?'to X':last==='y'?'to Y':null):
   last==='y'?(mapped.find(x=>x==='Y 1')||mapped.find(x=>x==='Y')||null):
   last==='x'?(mapped.find(x=>x==='Point 1 X'||x==='Vertex 1 X')||null):null;
  const candidates=preferred?[preferred,...mapped.filter(x=>x!==preferred)]:mapped;
  let controlled=false,priorError;
  for(const label of candidates){
   try{proof.control=label;proof.controlInfo=await changeNamed('.aw-inspector',label,row.path);controlled=true;break}catch(e){priorError=String(e.message)}
  }
  if(!controlled)throw Error('Inspector edit cannot operate mapped control: '+priorError);
  if(process.env.IMG01_DIAG==='1'){
   await pause(600);
   proof.diag={canonical:getValue(await doc(),row.path),controlDOM:await evalJS("(()=>{const e=document.querySelector('.aw-inspector [aria-label="+JSON.stringify(proof.control)+"]');return e&&{tag:e.tagName,value:e.value,display:e.getBoundingClientRect().width}})()")};
   console.log('IMG01_DIAG',i,row.path,'OLD',JSON.stringify(oldValue),'AFTER',JSON.stringify(proof.diag),'CONTROL',JSON.stringify(proof.controlInfo));
  }
  const newValue=await until(async()=>{const next=await doc();const v=getValue(next,row.path);if(!eq(v,oldValue))return {value:v,doc:next};return null},17000);
  proof.inspector=true;proof.before=oldValue;proof.after=newValue.value;proof.proofIds.push('IMG01-E-INSPECTOR-'+i);
  proof.nativePreview=Boolean(await until(()=>evalJS("document.querySelector('img.aw-render-image')?.naturalWidth>0&&!document.querySelector('.aw-canvas-status .aw-status-working')"),18000));
  await click('document.querySelector("button[aria-label=Undo]")');
  await until(async()=>eq(getValue(await doc(),row.path),oldValue),12000);
  await click('document.querySelector("button[aria-label=Redo]")');
  await until(async()=>eq(getValue(await doc(),row.path),newValue.value),12000);
  proof.undoRedo=true;proof.proofIds.push('IMG01-E-HISTORY-'+i);
  const graphLabel=row.path==='images.inherit'?null:(external?external[1]:proof.control);
  let graphValue=newValue.value;
  if(graphLabel){
   await changeNamed('.aw-graph-semantic-properties',graphLabel,row.path);
   graphValue=(await until(async()=>{const v=getValue(await doc(),row.path);return !eq(v,newValue.value)?{value:v}:null},12000)).value;
   proof.graph=true;proof.graphAfter=graphValue;proof.proofIds.push('IMG01-E-GRAPH-'+i);
   if(eq(graphValue,oldValue)){
    // Two-option selectors and toggles return to seed after a Graph edit;
    // re-apply a real Inspector edit so the persisted export proves the leaf changed.
    await changeNamed('.aw-inspector',proof.control,row.path);
    graphValue=(await until(async()=>{const v=getValue(await doc(),row.path);return !eq(v,oldValue)?{value:v}:null},12000)).value;
    proof.finalInspectorReapplied=true;
    proof.proofIds.push('IMG01-E-INSPECTOR-REAPPLY-'+i);
   }
   const match=await evalJS("!!document.querySelector("+JSON.stringify(labelElement('.aw-inspector',proof.control))+")");
   if(!match)throw Error('Graph edit leaves Inspector target unavailable');
  }else{
   proof.graphNotApplicable=true;proof.graphNAReason=row.path==='images.inherit'?'Graph contains root canvas intrinsic dimensions, not layer Image inherit; this per-layer option is Inspector-only': 'Graph has no typed geometry/source scalar control for this external layer property; Inspector is the authoring surface';
   proof.proofIds.push('IMG01-E-GRAPH-NA-'+i);
  }
  await send('Page.reload');
  await until(()=>evalJS("document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'&&document.querySelector('img.aw-render-image')?.naturalWidth>0"),70000);
  await selectLayer(row.layerName,row.layerId);
  await until(async()=>eq(getValue(await doc(),row.path),graphValue),12000);
  proof.indexedDB=true;proof.proofIds.push('IMG01-E-PERSIST-'+i);
  const freshExport=await saveProject(row);
  const exported=freshExport.document;
  proof.projectFile=freshExport.file;proof.projectSHA256=freshExport.sha256;
  if(!eq(getValue(exported,row.path),graphValue))throw Error('Visible project export lost target canonical value');
  proof.projectExport=true;proof.proofIds.push('IMG01-E-EXPORT-'+i);
  // First diverge the exact leaf using its actual Inspector control; only then does import prove restoration.
  await changeNamed('.aw-inspector',proof.control,row.path);
  const beforeReimport=(await until(async()=>{const v=getValue(await doc(),row.path);return !eq(v,graphValue)?{value:v}:null},8000)).value;
  // Preserve a real absent-value divergence in the JSON proof instead of dropping undefined.
  proof.preImportDivergence=beforeReimport===undefined?{canonicalAbsent:true,path:row.path}:beforeReimport;
  proof.proofIds.push('IMG01-E-IMPORT-DIVERGENCE-'+i);
  // Real project re-import through the visible Open project tool and native Chrome file picker.
  await click("[...document.querySelectorAll('.aw-tools button')].find(x=>x.textContent.trim()==='Open project')");
  await send('DOM.enable');
  const domRoot=(await send('DOM.getDocument',{depth:2,pierce:true})).root;
  const picker=(await send('DOM.querySelector',{nodeId:domRoot.nodeId,selector:'.aw-tools input[type=file]'})).nodeId;
  if(!picker)throw Error('Real Open project file input unavailable');
  await send('DOM.setFileInputFiles',{nodeId:picker,files:[freshExport.file]});
  await until(async()=>eq(getValue(await doc(),row.path),graphValue),12000);
  await until(()=>evalJS("document.querySelector('img.aw-render-image')?.naturalWidth>0"),12000);
  proof.projectImported=true;proof.proofIds.push('IMG01-E-IMPORT-'+i);
  if(i%10===0){
   const ss=await send('Page.captureScreenshot',{format:'png'});
   const dir=path.join(out,'screenshots');fs.mkdirSync(dir,{recursive:true});
   const screenshot=path.join(dir,'IMG01-'+String(i).padStart(3,'0')+'.png');
   fs.writeFileSync(screenshot,Buffer.from(ss.data,'base64'));
   proof.browserScreenshot=screenshot;
   proof.proofIds.push('IMG01-E-CHROMIUM-SHOT-'+i);
  }
 }catch(err){proof.issues.push(String(err&&err.stack||err).slice(0,650))}
 proof.elapsedMs=Date.now()-t;
 report.results.push(proof);
 fs.writeFileSync(path.join(out,'batch-'+String(lo).padStart(3,'0')+'-'+String(hi).padStart(3,'0')+'-'+runId+'.json'),JSON.stringify(report,null,2));
 console.log('IMG01_PATH',i,row.path,'PASS',!proof.issues.length,'EDIT',proof.inspector,'GRAPH',proof.graph,'LIFECYCLE',proof.indexedDB,'ERROR',proof.issues[0]?.slice(0,110)||'none');
}
console.log('IMG01_BATCH_COMPLETE',JSON.stringify({start:lo,end:hi,processed:report.results.length,complete:report.results.filter(x=>!x.issues.length).length,inspector:report.results.filter(x=>x.inspector).length,graph:report.results.filter(x=>x.graph).length,persist:report.results.filter(x=>x.indexedDB).length}));
ws.close();
})().catch(e=>{console.error('CAMPAIGN_FATAL',e.stack);process.exitCode=1});
