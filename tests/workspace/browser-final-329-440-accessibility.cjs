/* Permanent real-Chromium a11y interaction regression for 329 Image / 440 Text pinned Workspace.
   Requires production Next server + Chromium CDP. All assertions operate on real DOM and native rendering. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const url=process.env.A11Y_DELTA_URL,endpoint=process.env.A11Y_DELTA_CDP,out=process.env.A11Y_DELTA_OUT;
if(!url||!endpoint||!out)throw Error('Set A11Y_DELTA_URL, A11Y_DELTA_CDP, A11Y_DELTA_OUT');
fs.mkdirSync(out,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const res=await fetch(endpoint+'/json/new?'+encodeURIComponent(url),{method:'PUT'});
 assert.equal(res.status,200);
 const tab=await res.json(),ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((yes,no)=>{ws.onopen=yes;ws.onerror=no});
 const outstanding=new Map();let id=0;
 ws.onmessage=e=>{const v=JSON.parse(String(e.data)),entry=outstanding.get(v.id);if(!entry)return;outstanding.delete(v.id);v.error?entry.no(Error(v.error.message)):entry.yes(v.result)};
 const send=(method,params={})=>new Promise((yes,no)=>{const seq=++id;outstanding.set(seq,{yes,no});ws.send(JSON.stringify({id:seq,method,params}));setTimeout(()=>{if(outstanding.has(seq)){outstanding.delete(seq);no(Error('CDP timeout '+method))}},90000)});
 const evalJs=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value};
 const until=async(expression,timeout=30000)=>{const start=Date.now();let last;while(Date.now()-start<timeout){try{last=await evalJs(expression);if(last)return last}catch(e){last=String(e)}await pause(260)}throw Error('DOM timeout: '+expression+' last='+String(last))};
 const rect=async expression=>evalJs('(()=>{const n='+expression+';if(!n)return null;n.scrollIntoView({block:"center"});const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height}})()');
 const click=async expression=>{const r=await rect(expression);if(!r||r.w<3||r.h<3)throw Error('Not visible '+expression);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:r.x,y:r.y});await send('Input.dispatchMouseEvent',{type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:r.x,y:r.y,button:'left',clickCount:1})};
 const key=async(value,code,vk,modifiers=0)=>{for(const type of ['rawKeyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:value,code,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,modifiers})};
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',fromSurface:true});const f=path.join(out,name+'.png'),b=Buffer.from(r.data,'base64');fs.writeFileSync(f,b);return {file:name+'.png',bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}};
 const result={url,viewport:'1440x900',checks:[],screenshots:[],status:'RUNNING'};
 try{
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,mobile:false,deviceScaleFactor:1});
  await send('Page.navigate',{url});
  await until("document.readyState==='complete'&&document.querySelector('.aw-app')&&document.querySelector('.aw-app').getAttribute('aria-busy')==='false'",90000);
  await until("!!document.querySelector('div[role=\"separator\"][aria-label=\"Resize root panels\"]')",30000);
  const selector="document.querySelector('div[role=\"separator\"][aria-label=\"Resize root panels\"]')";
  const before=await evalJs('(()=>{const n='+selector+';return {value:Number(n.getAttribute("aria-valuenow")),min:Number(n.getAttribute("aria-valuemin")),max:Number(n.getAttribute("aria-valuemax")),orientation:n.getAttribute("aria-orientation"),tabIndex:n.tabIndex}})()');
  assert.equal(before.min,12);assert.equal(before.max,88);assert.equal(before.tabIndex,0);
  assert.equal(before.orientation,'vertical');assert.ok(before.value>=12&&before.value<=88);
  await click(selector);
  // Pointer-captured resize handles need explicit DOM focus for stable CDP key events.
  // The rendered tabindex=0 is verified above; ArrowRight/Left are genuine key inputs.
  await evalJs(selector+'.focus()');
  assert.equal(await evalJs('document.activeElement==='+selector),true,'focusable keyboard resize separator');
  await key('ArrowRight','ArrowRight',39);
  const after=await until('(()=>{const v=Number('+selector+'.getAttribute("aria-valuenow"));return v>'+before.value+'?v:false})()',14000);
  assert.equal(after,before.value+2);
  await key('ArrowLeft','ArrowLeft',37);
  const restored=await until('Number('+selector+'.getAttribute("aria-valuenow"))==='+before.value,14000);
  assert.equal(restored,true);
  result.checks.push({gate:'real focusable separator keyboard ArrowRight/Left updates ARIA value and size',pass:true,before:before.value,after,restored:before.value});
  result.screenshots.push(await screenshot('01-resize-keyboard'));
  const editor="document.querySelector('.cm-content[contenteditable=\"true\"]')";
  await until('!!('+editor+')',35000);
  const accessibility=await evalJs('(()=>{const e='+editor+',s=document.querySelector(".cm-scroller");return {editorName:e.getAttribute("aria-label"),scrollFocus:s?.tabIndex,editable:e.getAttribute("contenteditable"),visible:e.getBoundingClientRect().width>2}})()');
  assert.equal(accessibility.editorName,'TypeScript code editor');assert.equal(accessibility.scrollFocus,0);
  assert.equal(accessibility.editable,'true');
  assert.equal(accessibility.visible,true);
  await click(editor);
  assert.equal(await evalJs('document.activeElement==='+editor),true);
  const sourceBefore=await evalJs(editor+'.textContent');
  await send('Input.insertText',{text:' '});
  await until("!!document.querySelector('.aw-code .aw-source-dirty')",14000);
  const sourceAfter=await evalJs(editor+'.textContent');
  assert.notEqual(sourceAfter,sourceBefore);
  result.checks.push({gate:'CodeMirror keyboard editing with live React state and unsynchronized Code flag',pass:true,editable:true,scrollTabIndex:0});
  result.screenshots.push(await screenshot('02-codemirror-typed'));
  // Undo the edit using actual keyboard, preserving the original generated Source.
  await key('z','KeyZ',90,2);
  await pause(300);
  const sourceUndo=await evalJs(editor+'.textContent');
  assert.equal(sourceUndo,sourceBefore,'CodeMirror undo should restore generated Code');
  result.checks.push({gate:'CodeMirror real Control+Z restores source',pass:true});
  // Request an actual render job, not synthetic markup.
  const current=await evalJs("document.querySelectorAll('.aw-queue .aw-job-art').length");
  if(!current){
   const renderBtn="[...document.querySelectorAll('.aw-queue button')].find(n=>n.textContent.includes('Render this composition'))";
   await until('!!('+renderBtn+')',25000);
   await click(renderBtn);
  }
  const job=await until("(()=>{const b=document.querySelector('.aw-queue .aw-job-art');return b?{name:b.getAttribute('aria-label'),disabled:b.disabled,hasImage:!!b.querySelector('img')}:false})()",90000);
  assert.ok(job.name&&job.name.trim().length>6,'render output button accessible name should not be blank');
  assert.match(job.name,/rendered image|image unavailable/);
  if(job.hasImage)assert.match(job.name,/Open .* rendered image/);
  result.checks.push({gate:'real rendered Image queue output button accessible name',pass:true,job});
  result.screenshots.push(await screenshot('03-native-result-button'));
  result.status='PASS';
 }catch(e){result.status='FAIL';result.error=String(e.stack||e);try{result.screenshots.push(await screenshot('error'))}catch{}}
 finally{fs.writeFileSync(path.join(out,'actual-chromium-interactions.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));ws.close()}
 if(result.status!=='PASS')process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
