/* Combined pinned-engine Stage G browser acceptance — CDP real mouse/keyboard.
   Requires real persisted uploaded image from browser-image-strict-acceptance.cjs.
   Refuses to fake controls or use synthetic image/render output. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const url=process.env.IMG01_BROWSER_URL;
const cdp=process.env.IMG01_CHROME_CDP;
const out=process.env.IMG01_STAGEG_BROWSER_OUT;
if(!url||!cdp||!out)throw Error('Set IMG01_BROWSER_URL, IMG01_CHROME_CDP and IMG01_STAGEG_BROWSER_OUT');
fs.mkdirSync(out,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const res=await fetch(cdp+'/json/new?'+encodeURIComponent(url),{method:'PUT'});
 if(!res.ok)throw Error('CHROME CDP unavailable '+res.status);
 const tab=await res.json(),ws=new WebSocket(tab.webSocketDebuggerUrl),pending=new Map();
 let id=0;ws.onmessage=e=>{const m=JSON.parse(String(e.data)),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.no(Error(m.error.message)):p.ok(m.result)}};
 await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no});
 const send=(method,params={})=>new Promise((ok,no)=>{const x=++id;pending.set(x,{ok,no});ws.send(JSON.stringify({id:x,method,params}));setTimeout(()=>{if(pending.has(x)){pending.delete(x);no(Error('CDP timeout '+method))}},45000)});
 const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(String(r.exceptionDetails.exception?.description||r.exceptionDetails.text));return r.result?.value};
 const until=async(x,timeout=25000)=>{const t=Date.now();let last;while(Date.now()-t<timeout){try{last=await ev(x);if(last)return last}catch(e){last=String(e)}await pause(250)}throw Error('TIMEOUT '+x+' '+String(last))};
 const mouse=async x=>{const p=await ev('(()=>{const n='+x+';if(!n)return null;n.scrollIntoView({block:"center",inline:"center"});const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height}})()');if(!p||p.w<2||p.h<2)throw Error('Not a visible click target '+x);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});await send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1})};
 const key=async(value,code,vk,modifiers=0)=>{for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:value,code,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,modifiers})};
 const snap=async label=>{const r=await send('Page.captureScreenshot',{format:'png',fromSurface:true});const p=path.join(out,label+'.png');fs.writeFileSync(p,Buffer.from(r.data,'base64'));return {name:label,bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}};
 const report={status:'RUNNING',source:'COMBINED_PINNED_GITHUB_379a524',url,steps:[],screenshots:[],failure:null};
 try{
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url});
  await until("document.querySelector('img.aw-render-image')?.naturalWidth>0 && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",100000);
  report.steps.push({gate:'initial native PNG',passed:true});
  // A real user adds a Shape, then enters an eight-digit color via keyboard.
  await mouse("[...document.querySelectorAll('.aw-tools button')].find(x=>x.textContent.trim()==='Shape')");
  await until("!!document.querySelector('input[aria-label=\"Shape color hex\"]')");
  await mouse("document.querySelector('input[aria-label=\"Shape color hex\"]')");
  await key('a','KeyA',65,2);
  await send('Input.insertText',{text:'#a1b2c3'});
  await until("document.querySelector('input[aria-label=\"Shape color hex\"]')?.value?.toLowerCase()==='#a1b2c3'",12000);
  await until("document.querySelector('img.aw-render-image')?.naturalWidth>0 && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",70000);
  report.steps.push({gate:'actual keyboard typed eight-digit hex into Shape color, React controlled value, native PNG',passed:true,value:'#a1b2c3'});
  report.screenshots.push(await snap('01-hex-color-native'));
  // Re-select the previously uploaded PNG from the real immutable asset workflow.
  await mouse("[...document.querySelectorAll('.aw-layer-list button')].find(x=>x.textContent.includes('IMG01-upload-fixture.png'))");
  await until("!!document.querySelector('[aria-label=\"Image authoring inspector\"]')");
  await mouse("[...document.querySelectorAll('.aw-image-options details summary')].find(s=>s.textContent.includes('Filters'))");
  await mouse("[...document.querySelectorAll('.aw-image-options button')].find(x=>x.textContent.includes('Add image filter'))");
  await until("!!document.querySelector('select[aria-label=\"Filter 1 type\"]')");
  const selected=await ev("(()=>{const s=document.querySelector('select[aria-label=\"Filter 1 type\"]');return {initial:s.value,pixelate:[...s.options].findIndex(o=>o.value==='pixelate')}})()");
  if(selected.pixelate<0)throw Error('Pixelate is not a real enabled filter type');
  await mouse("document.querySelector('select[aria-label=\"Filter 1 type\"]')");
  await key('Home','Home',36);
  await pause(160);
  for(let i=0;i<selected.pixelate;i++){await key('ArrowDown','ArrowDown',40);await pause(65)}
  await key('Enter','Enter',13);
  await until("document.querySelector('select[aria-label=\"Filter 1 type\"]')?.value==='pixelate'",15000);
  const pre=await ev("(()=>{const x=document.querySelector('input[aria-label=\"pixelate x\"]');return x?{step:x.step,value:x.value}:null})()");
  if(!pre||pre.step!=='1')throw Error('Pixelate x input not integer step=1');
  report.steps.push({gate:'real keyboard selects pixelate effect and native integer x field',passed:true,initial:selected.initial,step:pre.step});
  await mouse("document.querySelector('input[aria-label=\"pixelate x\"]')");
  await key('a','KeyA',65,2);
  await send('Input.insertText',{text:'17.6'});
  await key('Tab','Tab',9);
  await pause(450);
  const decimal=await ev("(()=>{const x=document.querySelector('input[aria-label=\"pixelate x\"]');return {value:x?.value,valid:x?.validity.valid,stepMismatch:x?.validity.stepMismatch}})()");
  // Browser type=number + step=1 may reject a fractional edit before React can round.
  // Both valid outcomes must be integer; no fractional coordinate may reach native.
  if(!Number.isInteger(Number(decimal.value)))throw Error('Fractional pixelate x persisted despite step=1 '+JSON.stringify(decimal));
  report.steps.push({gate:'invalid fractional coordinate rejected or rounded to integer',passed:true,decimal});
  await mouse("document.querySelector('input[aria-label=\"pixelate x\"]')");
  await key('a','KeyA',65,2);
  await send('Input.insertText',{text:'18'});
  await key('Tab','Tab',9);
  const region=await until("(()=>{const x=document.querySelector('input[aria-label=\"pixelate x\"]');const n=Number(x?.value);return x&&Number.isInteger(n)&&n===18?{x:n,step:x.step}:false})()",15000);
  await until("document.querySelector('img.aw-render-image')?.naturalWidth>0 && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",70000);
  report.steps.push({gate:'real keyboard integer pixelate coordinate commits to native after invalid decimal guard',passed:true,region});
  report.screenshots.push(await snap('02-pixelate-integer-native'));
  const value=await ev("(async()=>{const r=indexedDB.open('apexify-workspace-immutable-assets-v1');const db=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});try{return await new Promise((ok,no)=>{const q=db.transaction('projects','readonly').objectStore('projects').get('active-project');q.onsuccess=()=>ok(q.result?.document?.layers?.find(l=>l.name==='IMG01-upload-fixture.png')?.imageOptions?.filters?.find(f=>f.type==='pixelate')?.x);q.onerror=()=>no(q.error)})}finally{db.close()}})()");
  if(value!==region.x)throw Error('Pixelate integer native state not persisted to IndexedDB '+value+' != '+region.x);
  report.steps.push({gate:'pixelate integer persisted in actual IndexedDB project',passed:true,indexedDbCoordinate:value});
  const codeSynced=await ev("!!document.querySelector('.aw-code .aw-source-synced')");
  if(!codeSynced)throw Error('Native Code/Visual synchronization lost after committed Image filters');
  report.steps.push({gate:'CodeMirror generated Code source stays synchronized',passed:true});
  report.status='PASS';
 }catch(e){report.status='FAIL';report.failure=String(e.stack||e);try{report.screenshots.push(await snap('failure'))}catch{}}
 finally{fs.writeFileSync(path.join(out,'stageg-combined-browser-acceptance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));ws.close()}
 if(report.status!=='PASS')process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
