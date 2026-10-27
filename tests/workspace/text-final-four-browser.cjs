/* TEXT01 per-path native Workspace-control Chromium runner.
   Drives actual React DOM controls, reads canonical state from mounted TextOptionsEditor React props,
   and associates evidence with the authoritative source path; it does not claim full browser lifecycle
   until all per-option gates are independently established. */
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {setTimeout:delay}=require('node:timers/promises');
const root=process.cwd(),evidence=path.resolve(root,'evidence/workspace-text/strict');
const plan=JSON.parse(fs.readFileSync(path.join(evidence,'ui-matrix-plan.json')));
const begin=Number(process.env.TEXT_UI_START||0),limit=Number(process.env.TEXT_UI_COUNT||30);
const port=39678,base='http://127.0.0.1:39508/workspace';
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
 ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking',
 '--remote-debugging-port='+port,'--user-data-dir='+path.join(root,'.chrome-text-four-path-clean-02'), 'about:blank'],{windowsHide:true,stdio:'ignore'});
const pending=new Map();let ws=null,id=0;
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
async function evalJs(expr){let r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error('CHROME '+String(r.exceptionDetails.exception?.description||r.exceptionDetails.text));return r.result?.value;}
async function wait(expr,ms=22000){const t=Date.now();let last;while(Date.now()-t<ms){try{last=await evalJs(expr);if(last)return last}catch(e){last=String(e)}await delay(200)}throw Error('TIMEOUT '+expr+' LAST '+JSON.stringify(last))}
async function open(){
 for(let i=0;i<100;i++){try{let r=await fetch('http://127.0.0.1:'+port+'/json/version');if(r.ok)break}catch{}if(i===99)throw Error('Chrome debugger unavailable');await delay(250)}
 const tab=await(await fetch('http://127.0.0.1:'+port+'/json/new?'+encodeURIComponent(base),{method:'PUT'})).json();
 ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true})});
 ws.addEventListener('message',ev=>{const r=JSON.parse(String(ev.data));const p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.reject(Error(r.error.message)):p.resolve(r.result)});
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1660,height:1050,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base});
 await wait("document.readyState==='complete'&&!!document.querySelector('button[aria-label=\"Select Apexify\"]')",75000);
 await delay(1200);
 await evalJs("document.querySelector('button[aria-label=\"Select Apexify\"]').click()");
 await wait("!!document.querySelector('.aw-text-editor:not(.aw-text-editor-compact)')",30000);
}
const injected=String.raw`
window.__text01={
 getLayer(){
  const editor=document.querySelector('.aw-text-editor:not(.aw-text-editor-compact)');if(!editor)return null;
  const key=Object.keys(editor).find(x=>x.startsWith('__reactFiber$'));
  let f=editor[key];while(f){if(f.memoizedProps?.layer?.kind==='text')return f.memoizedProps.layer;f=f.return;}return null;
 },
 async tick(t=13){await new Promise(r=>setTimeout(r,t))},
 getRoot(root,compact=false){
   const editor=document.querySelector(compact?'.aw-text-editor.aw-text-editor-compact':'.aw-text-editor:not(.aw-text-editor-compact)');
   if(!editor)throw Error('NO_EDITOR_'+compact);
   const title=root==='properties'?'Text properties':root==='items'?'Text array items':'Grouped text options';
   return [...editor.querySelectorAll('.aw-text-nested')].find(e=>e.dataset.textPath===title);
 },
 async ensure(container){
  if(!container)throw Error('PARENT_NOT_FOUND');
  const heading=container.querySelector(':scope > .aw-section-heading');
  if(heading?.querySelector('button')?.textContent==='Enable'){heading.querySelector('button').click();await this.tick();}
 },
 findChild(parent,key){
  const body=parent?.querySelector(':scope > .aw-text-nested-fields');
  if(!body)return null;
  const n=[...body.children].find(e=>e.classList?.contains('aw-text-nested')&&e.dataset.textPath===key);
  return n||null;
 },
 findOptional(parent,key){
  const body=parent?.querySelector(':scope > .aw-text-nested-fields');
  return [...(body?.children??[])].find(e=>e.classList?.contains('aw-text-optional')&&e.firstElementChild?.textContent===key);
 },
 findLeaf(parent,key){
  const body=parent?.querySelector(':scope > .aw-text-nested-fields');
  return [...(body?.children??[])].find(e=>e.classList?.contains('aw-text-leaf')&&e.firstElementChild?.textContent===key);
 },
 async go(item,compact=false){
  let current=this.getRoot(item.root,compact);await this.ensure(current);
  if(item.root==='group'&&item.tokens[0]==='groupTransform'){
    const input=current?.querySelector('input[aria-label="Text isGrouped"]');
    if(!input)throw Error('GROUP_ENABLE_CONTROL_MISSING');
    if(!input.checked){input.click();await this.tick(30);current=this.getRoot(item.root,compact);}
  }
  if(item.root==='items'){
   const heading=current?.querySelector(':scope > .aw-section-heading');
   if(!current.querySelector('.aw-text-array-entry')){heading?.querySelector('button:last-child')?.click();await this.tick();}
   current=this.getRoot(item.root,compact).querySelector('.aw-text-array-entry .aw-text-nested[data-text-path="Text array items[0]"]');
   await this.ensure(current);
  }
  for(let i=0;i<item.tokens.length-1;i++){
   const raw=item.tokens[i],key=raw.endsWith('[]')?raw.slice(0,-2):raw;
   if(['underline','overline','strikethrough'].includes(key)){
     const holder=current?.querySelector(':scope > .aw-text-nested-fields');
     const selector=[...(holder?.querySelectorAll(':scope > .aw-text-nested > .aw-field select')??[])].find(e=>e.getAttribute('aria-label')==='Text '+key);
     if(!selector)throw Error('DECORATION_MISSING:'+key);
     if(selector.value!=='styled'){this.setValue(selector,'styled');await this.tick();}
     current=[...this.getRoot(item.root,compact).querySelectorAll('.aw-text-nested')].find(e=>e.dataset.textPath===key+' style');
     if(!current)throw Error('STYLED_PARENT_MISSING:'+key);
     await this.ensure(current);continue;
   }
   let next=this.findChild(current,key);
   if(!next)throw Error('NESTED_MISSING:'+key+'@'+item.api);
   await this.ensure(next);
   if(key==='gradient'){
     const final=item.tokens.at(-1), needed=['centerX','centerY','startAngle'].includes(final)?'conic':['startRadius','endRadius'].includes(final)?'radial':'linear';
     const select=[...next.querySelectorAll('select')].find(e=>e.getAttribute('aria-label')==='Text type');
     if(select&&select.value!==needed){this.setValue(select,needed);await this.tick();next=this.findChild(current,key);}
   }
   if(raw.endsWith('[]')){
     const array=next;
     if(!array.querySelector('.aw-text-array-entry')){array.querySelector(':scope > .aw-section-heading button:last-child')?.click();await this.tick();}
     next=this.findChild(current,key);
     const entry=next.querySelector('.aw-text-array-entry .aw-text-nested');
     if(!entry)throw Error('ARRAY_ENTRY_MISSING:'+key);
     current=entry;await this.ensure(current);
   } else current=next;
  }
  return {parent:current,key:item.tokens.at(-1)};
 },
 setValue(el,value){
   if(el.type==='checkbox'){el.click();return;}
   const p=el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
   Object.getOwnPropertyDescriptor(p,'value').set.call(el,String(value));
   el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));
   if(el.tagName!=='SELECT')el.dispatchEvent(new Event('change',{bubbles:true}));
 },
 async edit(item,compact=false,iteration=0){
  let {parent,key}=await this.go(item,compact);
  if(item.spec.kind==='decoration'||item.api.endsWith('(boolean)')){
    const option=parent?.querySelector(':scope > .aw-text-nested-fields .aw-text-nested select[aria-label="Text '+key+'"]');
    if(!option)throw Error('DECORATION_BOOLEAN_MISSING:'+key);
    this.setValue(option,iteration?'off':'on');await this.tick();return {value:iteration?false:true};
  }
  const before=this.findOptional(parent,key);
  if(before){before.querySelector('button')?.click();await this.tick();({parent,key}=await this.go(item,compact));}
  let leaf=this.findLeaf(parent,key);
  if(!leaf)throw Error('LEAF_MISSING:'+key+'@'+item.api);
  const kind=item.spec.kind, input=leaf.querySelector('input,select,textarea');
  if(!input)throw Error('INPUT_MISSING:'+key);
  let value;
  if(kind==='boolean')value=!(input.checked);
  else if(kind==='enum')value=item.spec.choices.find(x=>x!==input.value)??input.value;
  else if(kind==='font-weight'){const mode=leaf.querySelector('select[aria-label="Text weight mode"]');this.setValue(mode,'numeric');await this.tick();({parent,key}=await this.go(item,compact));leaf=this.findLeaf(parent,key);value=iteration?450:350;this.setValue(leaf.querySelector('input[aria-label="Text weight numeric"]'),value);await this.tick();return {value};}
  else if(kind==='number'){
   const min=item.spec.min,max=item.spec.max;
   value=key==='sweepAngle'?iteration?100:120:key==='stop'?iteration?.3:.25:key==='width'||key==='height'?Math.max(min,Math.min(max,max<=100?(iteration?40:30):(iteration?155:128))):
      key==='opacity'?iteration?.5:.7:key==='size'?iteration?25:32:key==='lineHeight'?iteration?1.4:1.2:
      key==='scaleX'||key==='scaleY'?iteration?1.3:1.2:key==='radius'||key==='startRadius'||key==='endRadius'?iteration?90:80:
      Math.max(min,Math.min(max,iteration?7:5));
   if(key==='stop'&&item.tokens.includes('colors[]'))value=iteration?.3:.15;
  }else if(kind==='color')value=iteration?'#aa33ff':'#ff8800';
  else value=['family','name'].includes(key)?(iteration?'Courier New':'Arial'):key==='text'?(iteration?'Browser graph value':'Browser path value'):'Strict path '+iteration;
  this.setValue(input,value);await this.tick(18);return {value};
 },
 getPath(item){
  let layer=this.getLayer();if(!layer)return undefined;
  if(item.root==='baseline')return layer[item.model.split('.').at(-1)];
  let v=item.root==='properties'?layer.textSettings?.properties:item.root==='items'?layer.textSettings?.items?.[0]:layer.textSettings?.group;
  for(const raw of item.tokens){const k=raw.endsWith('[]')?raw.slice(0,-2):raw;v=v?.[k];if(raw.endsWith('[]'))v=v?.[0];}
  return v;
 },
 async editBaseline(item,iteration){
  const key=item.model.split('.').at(-1);
  const labels={text:'Text',x:'X',y:'Y',fontSize:'Font size',weight:'Weight',color:'Color',opacity:'Opacity',rotation:'Rotation',width:'Width',height:'Height'};
  const inspector=document.querySelector('.aw-inspector-scroll');
  let input=key==='text'?inspector.querySelector('textarea[aria-label="Text content"]'):null;
  if(!input){const candidates=[...inspector.querySelectorAll('label')].filter(e=>{
   const title=e.querySelector(':scope > span, :scope > strong')?.textContent?.trim()||'';
   return title===labels[key]||e.textContent.trim()===labels[key];
  });input=candidates.map(e=>e.querySelector('input,select')).find(Boolean);}
  if(!input)throw Error('BASELINE_CONTROL_MISSING:'+key);
  let value=key==='text'?iteration?'Graph baseline text':'Inspector baseline text':
  key==='color'?iteration?'#aa33ff':'#ff8800':key==='weight'?iteration?700:600:
  key==='opacity'?iteration?.6:.8:key==='rotation'?iteration?22:13:
  key==='fontSize'?iteration?34:29:key==='width'||key==='height'?iteration?210:185:iteration?70:55;
  this.setValue(input,value);await this.tick(25);return {value};
 },
 hasGraph(){return !!document.querySelector('.aw-text-editor.aw-text-editor-compact')},
 code(){
   const el=document.querySelector('.aw-code-editor textarea')||document.querySelector('.aw-code-editor');
   return el?.value??el?.textContent??null;
 }
};
`;
async function run(){
 await open();await evalJs(injected);console.log('LAYER_PROBE',JSON.stringify(await evalJs("({layer:window.__text01.getLayer()?.kind,graph:window.__text01.hasGraph(),path:document.querySelector('.aw-text-editor')?.getAttribute('aria-label')})")));
 const outputs=[];
 if(process.env.TEXT_UI_FONT_FOUR==='1'){
   const targets=plan.filter(x=>['createText.TextProperties.font.family','createText.TextProperties.font.name'].includes(x.api));
   if(targets.length!==2)throw Error('Expected exactly two font paths');
   const exportDir=path.join(evidence,'final-four','exports');fs.mkdirSync(exportDir,{recursive:true});
   await send('DOM.enable');
   await send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:exportDir});
   const canonical=(entry)=>`window.__text01.getPath(${JSON.stringify(entry)})`;
   const blobDigest=async()=>evalJs(`(async()=>{const image=document.querySelector('img[src^="blob:"]');if(!image)return null;const b=await(await fetch(image.src)).arrayBuffer();return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",b)),x=>x.toString(16).padStart(2,"0")).join("");})()`);
   async function changedPreview(before){const start=Date.now();let value;while(Date.now()-start<16000){await delay(350);value=await blobDigest();if(value&&value!==before)return value;}throw Error('SERVER_NATIVE_PNG_DIGEST_UNCHANGED '+before);}
   await evalJs(`(()=>{const el=document.querySelector('textarea[aria-label="Text content"]');if(!el)throw Error('Cannot select Text content');window.__text01.setValue(el,'WMWM iiiiii 0123456789 ABCDEFG');return true})()`);
   await delay(1100);
   for(const entry of targets){
     const refs={api:entry.api,evidenceId:entry.api.endsWith('.family')?'UI-FOUR-FONT-FAMILY-001':'UI-FOUR-FONT-NAME-001'};
     try {
      const q=JSON.stringify(entry);
      const before=await blobDigest();
      const inspector=await evalJs(`(async()=>{const item=${q};const e=await window.__text01.edit(item,false,0);return {value:e.value,model:window.__text01.getPath(item)};})()`);
      if(inspector.value!=='Arial'||inspector.model!=='Arial')throw Error('Inspector did not set Arial');
      const arialDigest=await changedPreview(before);
      const graph=await evalJs(`(async()=>{const item=${q};const e=await window.__text01.edit(item,true,1);return {value:e.value,model:window.__text01.getPath(item)};})()`);
      if(graph.value!=='Courier New'||graph.model!=='Courier New')throw Error('Graph did not set Courier New');
      const courierDigest=await changedPreview(arialDigest);
      const undo=await evalJs(`(async()=>{document.querySelector('[aria-label="Undo"]').click();await window.__text01.tick(55);return window.__text01.getPath(${q})})()`);
      if(undo!=='Arial')throw Error('Undo did not restore Arial: '+undo);
      const redo=await evalJs(`(async()=>{document.querySelector('[aria-label="Redo"]').click();await window.__text01.tick(55);return window.__text01.getPath(${q})})()`);
      if(redo!=='Courier New')throw Error('Redo did not restore Courier New: '+redo);
      await delay(1100);
      const idb=await evalJs(`(async()=>{const d=await new Promise((yes,no)=>{const t=indexedDB.open('apexify-workspace-immutable-assets-v1',1);t.onsuccess=()=>yes(t.result);t.onerror=()=>no(t.error)});try{const v=await new Promise((yes,no)=>{const t=d.transaction('projects','readonly').objectStore('projects').get('active-project');t.onsuccess=()=>yes(t.result);t.onerror=()=>no(t.error)});return v?.document?.layers?.find(x=>x.kind==='text')?.textSettings?.properties?.font?.[${JSON.stringify(entry.tokens.at(-1))}]}finally{d.close()}})()`);
      if(idb!=='Courier New')throw Error('IndexedDB font mismatch '+idb);
      const code=await evalJs(`(()=>{const e=document.querySelector('.cm-editor .cm-content');return e?.cmTile?.root?.view?.state.doc.toString()??null})()`);
      if(!code||!code.includes('Courier New'))throw Error('Generated Code missing exact font');
      await send('Page.reload',{ignoreCache:true});
      await wait("document.readyState==='complete'&&!!document.querySelector('button[aria-label=\"Select Apexify\"]')",45000);await delay(1200);
      await evalJs("document.querySelector('button[aria-label=\"Select Apexify\"]').click()");
      await wait("!!document.querySelector('.aw-text-editor:not(.aw-text-editor-compact)')",20000);
      await evalJs(injected);
      const reloaded=await evalJs(canonical(entry));if(reloaded!=='Courier New')throw Error('Reload font mismatch '+reloaded);
      const name=entry.tokens.at(-1);
      for(const x of fs.readdirSync(exportDir).filter(x=>x.endsWith('.apexify.json'))){fs.renameSync(path.join(exportDir,x),path.join(exportDir,'prior-'+Date.now()+'-'+name+'-'+x));}
      const previous=new Set(fs.readdirSync(exportDir));
      await evalJs(`Array.from(document.querySelectorAll('footer button')).find(x=>x.textContent?.includes('Save project'))?.click()`);
      let exported=null;for(let j=0;j<100;j++){await delay(120);const hit=fs.readdirSync(exportDir).find(x=>x.endsWith('.apexify.json')&&!previous.has(x));if(hit){exported=path.join(exportDir,hit);break;}}
      if(!exported)throw Error('No project JSON export for '+name);
      const project=JSON.parse(fs.readFileSync(exported,'utf8'));
      const exportedValue=project.layers.find(x=>x.kind==='text')?.textSettings?.properties?.font?.[name];
      if(exportedValue!=='Courier New')throw Error('Exported font mismatch '+JSON.stringify(exportedValue));
      await evalJs(`(async()=>{const item=${q};const e=await window.__text01.edit(item,false,0);return e.value})()`);
      await delay(125);
      const dom=await send('DOM.getDocument',{depth:-1});
      const fileNode=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'.aw-tools input[type=file][accept="application/json,.json"]'});
      if(!fileNode.nodeId)throw Error('Missing native project import input');
      await send('DOM.setFileInputFiles',{nodeId:fileNode.nodeId,files:[exported]});
      await delay(550);
      await evalJs("document.querySelector('button[aria-label=\"Select Apexify\"]').click()");
      await wait("!!document.querySelector('.aw-text-editor:not(.aw-text-editor-compact)')",10000);
      await evalJs(injected);
      const imported=await evalJs(canonical(entry));
      if(imported!=='Courier New')throw Error('Project import font mismatch '+imported);
      outputs.push({...refs,status:'PASS',inspector,graph,undo,redo,indexedDB:idb,reloaded,exportedValue,imported,generatedCodeContainsExactFont:true,serverNativePng:{arialDigest,courierDigest,changed:arialDigest!==courierDigest},exportFile:path.relative(evidence,exported)});
      console.log('FONT_BROWSER_PATH_PASS',refs.api,JSON.stringify({arialDigest,courierDigest,ui:true,history:true,imported}));
     }catch(error){outputs.push({...refs,status:'FAIL',error:String(error)});console.error('FONT_BROWSER_PATH_FAIL',refs.api,String(error));}
   }
   const file=path.join(evidence,'final-four','font-browser-targeted.json');fs.writeFileSync(file,JSON.stringify({results:outputs},null,2)+'\n');
   console.log('FONT_BROWSER_FINAL',JSON.stringify({pass:outputs.filter(x=>x.status==='PASS').length,fail:outputs.filter(x=>x.status==='FAIL').length,output:file}));
   if(outputs.some(x=>x.status!=='PASS'))process.exitCode=1;
   return;
 }
 if(process.env.TEXT_UI_ARRAYS==='1'){
  const checks=await evalJs(`(async()=>{
   const e=window.__text01,assert=(x,msg)=>{if(!x)throw Error(msg)};
   const evidence=[];
   let root=e.getRoot('items'),first=root.querySelector(':scope > .aw-section-heading button:last-child');
   const initial=e.getLayer().textSettings?.items?.length??0;
   if(initial>=30)throw Error('TOO_MANY_STARTING_RUNS');
   first.click();await e.tick(40);root=e.getRoot('items');
   first=root.querySelector(':scope > .aw-section-heading button:last-child');first.click();await e.tick(40);root=e.getRoot('items');
   const entries=[...root.querySelectorAll(':scope > .aw-text-array-entry')];assert(entries.length===initial+2,'runs insertion wrong');
   const textarea=entries.at(-1).querySelector('textarea[aria-label="Text additional content"]');
   if(!textarea)throw Error('RUN_TEXT_EDITOR_MISSING');
   e.setValue(textarea,'Run uniquely modified');await e.tick(50);
   const previous=e.getLayer().textSettings.items.map(x=>x.text);
   const lastIndex=entries.length-1;
   root=e.getRoot('items');
   root.querySelector('[aria-label="Text array items move item up '+lastIndex+'"]').click();await e.tick(50);
   const moved=e.getLayer().textSettings.items.map(x=>x.text);
   assert(moved[lastIndex-1]==='Run uniquely modified','RUN_REORDER_FAILED');
   root=e.getRoot('items');root.querySelector('[aria-label="Text array items remove item '+lastIndex+'"]').click();await e.tick(50);
   assert(e.getLayer().textSettings.items.length===initial+1,'RUN_REMOVE_FAILED');
   evidence.push({id:'UI-ARRAY-RUN-001',initial,inserted:2,reordered:true,removed:true,previous,moved});
   let prop=e.getRoot('properties');await e.ensure(prop);prop=e.getRoot('properties');
   let fill=e.findChild(prop,'fill');await e.ensure(fill);prop=e.getRoot('properties');fill=e.findChild(prop,'fill');
   let grad=e.findChild(fill,'gradient');await e.ensure(grad);
   prop=e.getRoot('properties');fill=e.findChild(prop,'fill');grad=e.findChild(fill,'gradient');
   if(!grad)throw Error('GRADIENT_CONTROL_MISSING');
   let colors=e.findChild(grad,'colors');let starting=e.getLayer().textSettings.properties.fill.gradient.colors.length;
   colors.querySelector(':scope > .aw-section-heading button:last-child').click();await e.tick(50);
   prop=e.getRoot('properties');fill=e.findChild(prop,'fill');grad=e.findChild(fill,'gradient');colors=e.findChild(grad,'colors');
   let data=e.getLayer().textSettings.properties.fill.gradient.colors;
   assert(data.length===starting+1,'GRADIENT_STOP_ADD_FAILED');
   const moveIndex=starting;
   const before=JSON.stringify(data);
   colors.querySelector('[aria-label="colors move item up '+moveIndex+'"]').click();await e.tick(50);
   data=e.getLayer().textSettings.properties.fill.gradient.colors;
   assert(JSON.stringify(data)!==before,'GRADIENT_REORDER_NO_CHANGE');
   prop=e.getRoot('properties');fill=e.findChild(prop,'fill');grad=e.findChild(fill,'gradient');colors=e.findChild(grad,'colors');
   colors.querySelector('[aria-label="colors remove item '+(data.length-1)+'"]').click();await e.tick(50);
   assert(e.getLayer().textSettings.properties.fill.gradient.colors.length===starting,'GRADIENT_REMOVE_FAILED');
   evidence.push({id:'UI-ARRAY-GRADIENT-001',starting,inserted:1,reordered:true,removed:true});
   return evidence;
  })()`);
  const file=path.join(evidence,'ui-array-mutations.json');fs.writeFileSync(file,JSON.stringify({checks},null,2));
  console.log('UI_ARRAY_MUTATIONS_PASS',JSON.stringify(checks));return;
 }
 if(process.env.TEXT_UI_LIFECYCLE==='1'){
   const savedValue=(item)=>`(async()=>{const j=${JSON.stringify(item)};const db=await new Promise((ok,no)=>{const q=indexedDB.open("apexify-workspace-immutable-assets-v1",1);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});let p;try{p=await new Promise((ok,no)=>{const q=db.transaction("projects","readonly").objectStore("projects").get("active-project");q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})}finally{db.close()}let layer=p?.document?.layers?.find(x=>x.kind==="text");if(!layer)return null;if(j.root==="baseline")return layer[j.model.split(".").at(-1)]??null;let x=j.root==="properties"?layer.textSettings?.properties:j.root==="items"?layer.textSettings?.items?.[0]:layer.textSettings?.group;for(const raw of j.tokens){const k=raw.endsWith("[]")?raw.slice(0,-2):raw;x=x?.[k];if(raw.endsWith("[]"))x=x?.[0]}return x??null;})()`;
   for(const entry of plan.slice(begin,begin+limit)){
    const q=JSON.stringify(entry);
    const id='LIFE-'+String(entry.i+1).padStart(4,'0');
    try{
     const edit=await evalJs(`(async()=>{const j=${q};const v=j.root==="baseline"?await window.__text01.editBaseline(j,0):await window.__text01.edit(j,false,0);return {value:v.value,current:window.__text01.getPath(j)}})()`);
     if(JSON.stringify(edit.value)!==JSON.stringify(edit.current))throw Error('EDIT_VALUE_MISMATCH');
     let saved=null;for(let tries=0;tries<12;tries++){await delay(155);saved=await evalJs(savedValue(entry));if(JSON.stringify(saved)===JSON.stringify(edit.value))break;}
     if(JSON.stringify(saved)!==JSON.stringify(edit.value))throw Error('IDB_PERSIST_MISMATCH '+JSON.stringify({expected:edit.value,saved}));
     await send('Page.reload',{ignoreCache:true});
     await wait("document.readyState==='complete'&&!!document.querySelector('button[aria-label=\\\"Select Apexify\\\"]')",45000);
     await delay(530);
     await evalJs("document.querySelector('button[aria-label=\\\"Select Apexify\\\"]').click()");
     await wait("!!document.querySelector('.aw-text-editor:not(.aw-text-editor-compact)')",20000);
     await evalJs(injected);
     const reloaded=await evalJs(`window.__text01.getPath(${q})`);
     if(JSON.stringify(reloaded)!==JSON.stringify(edit.value))throw Error('RELOAD_MISMATCH '+JSON.stringify({expected:edit.value,reloaded}));
     outputs.push({id,api:entry.api,status:'PERSIST_RELOAD_PASS',evidence:{edit,stored:saved,reloaded,indexedDB:'apexify-workspace-immutable-assets-v1/projects/active-project'}});
    }catch(error){outputs.push({id,api:entry.api,status:'FAIL',error:String(error)});}
    if(outputs.length%10===0)console.log('LIFECYCLE_PROGRESS',begin,outputs.length,'pass',outputs.filter(x=>x.status==='PERSIST_RELOAD_PASS').length,'fail',outputs.filter(x=>x.status==='FAIL').length);
   }
   const file=path.join(evidence,`ui-lifecycle-${begin}-${begin+limit}.json`);fs.writeFileSync(file,JSON.stringify({begin,limit,results:outputs},null,2));
   console.log('LIFECYCLE_FINAL',file,JSON.stringify({pass:outputs.filter(x=>x.status==='PERSIST_RELOAD_PASS').length,fail:outputs.filter(x=>x.status==='FAIL').length,failures:outputs.filter(x=>x.status==='FAIL').slice(0,10)}));return;
 }
 for(const entry of plan.slice(begin,begin+limit)){
  if(!entry.spec){
   const q=JSON.stringify(entry);
   try{
    const inspector=await evalJs(`(async()=>{const item=${q};const x=await window.__text01.editBaseline(item,0);return {value:x.value,current:window.__text01.getPath(item)};})()`);
    if(JSON.stringify(inspector.current)!==JSON.stringify(inspector.value))throw Error('BASELINE_INSPECTOR_MISMATCH '+JSON.stringify(inspector));
    await delay(560); // Baseline layer commits coalesce within 500 ms by design.
    const second=await evalJs(`(async()=>{const item=${q};const x=await window.__text01.editBaseline(item,1);return {value:x.value,current:window.__text01.getPath(item)};})()`);
    if(JSON.stringify(second.current)!==JSON.stringify(second.value))throw Error('BASELINE_SECOND_EDIT_MISMATCH '+JSON.stringify(second));
    const undo=await evalJs(`(async()=>{document.querySelector('[aria-label="Undo"]')?.click();await window.__text01.tick(32);return window.__text01.getPath(${q});})()`);
    if(JSON.stringify(undo)!==JSON.stringify(inspector.value))throw Error('BASELINE_UNDO_MISMATCH '+JSON.stringify({expected:inspector.value,undo}));
    const redo=await evalJs(`(async()=>{document.querySelector('[aria-label="Redo"]')?.click();await window.__text01.tick(32);return window.__text01.getPath(${q});})()`);
    if(JSON.stringify(redo)!==JSON.stringify(second.value))throw Error('BASELINE_REDO_MISMATCH');
    outputs.push({id:'UI-'+String(entry.i+1).padStart(4,'0'),api:entry.api,status:'INSPECTOR_HISTORY_PASS',evidence:{inspector,second,undo,redo,graphApplicable:false}});
   }catch(e){outputs.push({id:'UI-'+String(entry.i+1).padStart(4,'0'),api:entry.api,status:'FAIL',error:String(e)});}
   continue;
  }
  const query=JSON.stringify(entry);
  try{
   const result=await evalJs(`(async()=>{const item=${query}; const x=await window.__text01.edit(item,false);return {edit:x,current:window.__text01.getPath(item),graph:window.__text01.hasGraph()};})()`);
   const expected=result.edit.value;
   if(JSON.stringify(result.current)!==JSON.stringify(expected))throw Error('MODEL_MISMATCH expected='+JSON.stringify(expected)+' got='+JSON.stringify(result.current));
   const graph=await evalJs(`(async()=>{const item=${query};const change=await window.__text01.edit(item,true,1);return {value:change.value,current:window.__text01.getPath(item)};})()`);
   if(JSON.stringify(graph.current)!==JSON.stringify(graph.value))throw Error('GRAPH_MODEL_MISMATCH expected='+JSON.stringify(graph.value)+' got='+JSON.stringify(graph.current));
   const undo=await evalJs(`(async()=>{document.querySelector('[aria-label="Undo"]')?.click();await window.__text01.tick(25);return window.__text01.getPath(${query});})()`);
   if(JSON.stringify(undo)!==JSON.stringify(expected))throw Error('UNDO_MISMATCH expected='+JSON.stringify(expected)+' got='+JSON.stringify(undo));
   const redo=await evalJs(`(async()=>{document.querySelector('[aria-label="Redo"]')?.click();await window.__text01.tick(25);return window.__text01.getPath(${query});})()`);
   if(JSON.stringify(redo)!==JSON.stringify(graph.value))throw Error('REDO_MISMATCH expected='+JSON.stringify(graph.value)+' got='+JSON.stringify(redo));
   outputs.push({id:'UI-'+String(entry.i+1).padStart(4,'0'),api:entry.api,status:'INSPECTOR_GRAPH_HISTORY_PASS',evidence:{inspectorExpected:expected,inspectorCurrent:result.current,graphValue:graph.value,graphModel:graph.current,undo,redo,graphMounted:result.graph}});
  }catch(e){outputs.push({id:'UI-'+String(entry.i+1).padStart(4,'0'),api:entry.api,status:'FAIL',error:String(e)});}
  if(outputs.length%10===0){console.log('BATCH_PROGRESS',begin,outputs.length,'pass',outputs.filter(x=>x.status==='INSPECTOR_GRAPH_HISTORY_PASS'||x.status==='INSPECTOR_MODEL_PASS').length,'fail',outputs.filter(x=>x.status==='FAIL').length);}
 }
 const destination=path.join(evidence,`ui-matrix-${begin}-${begin+limit}.json`);fs.writeFileSync(destination,JSON.stringify({start:begin,count:limit,results:outputs},null,2));
 console.log('UI_MATRIX_RESULT',destination,JSON.stringify({pass:outputs.filter(x=>x.status==='INSPECTOR_GRAPH_HISTORY_PASS'||x.status==='INSPECTOR_MODEL_PASS').length,fail:outputs.filter(x=>x.status==='FAIL').length,skips:outputs.filter(x=>x.status==='SKIP_BASELINE_UNTESTED').length,failures:outputs.filter(x=>x.status==='FAIL').slice(0,10)}));
}
run().catch(e=>{console.error('UI_MATRIX_FATAL',e);process.exitCode=1}).finally(()=>{try{ws?.close()}catch{};try{chrome.kill()}catch{}});
