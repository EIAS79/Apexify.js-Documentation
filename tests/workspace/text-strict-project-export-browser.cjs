/* Genuine Chromium CDP Workspace typography smoke. Uses only Node's built-in WebSocket. */
const {spawn} = require("node:child_process");
const {mkdir,writeFile} = require("node:fs/promises");
const {join,resolve} = require("node:path");
const {setTimeout:delay}=require("node:timers/promises");

const chromePath="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port=39653;
const base="http://127.0.0.1:39508/workspace";
const screenshots=resolve(process.cwd(),"evidence","workspace-text","strict");
const userDir=resolve(process.cwd(),".chrome-text-export-strict");
const chrome=spawn(chromePath,["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
  "--disable-background-networking","--remote-debugging-port="+port,"--user-data-dir="+userDir,"about:blank"],
  {windowsHide:true,stdio:"ignore"});
let client=null;
let currentId=0;
const pending=new Map();
function send(method,params={}){
  return new Promise((resolve,reject)=>{
    const id=++currentId;
    pending.set(id,{resolve,reject});
    client.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression){
  const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error("Browser expression: "+JSON.stringify(result.exceptionDetails.exception?.description||result.exceptionDetails.text));
  return result.result?.value;
}
async function until(expr,timeout=30000){
  const start=Date.now();let last;
  while(Date.now()-start<timeout){
    try{last=await evaluate(expr);if(last)return last;}catch(err){last=String(err)}
    await delay(220);
  }
  throw Error("Timed out waiting for: "+expr+"; last="+JSON.stringify(last));
}
async function click(expr){
  const result=await evaluate("(()=>{const x="+expr+"; if(!x)return false;x.click();return true})()");
  if(!result)throw Error("Missing browser control "+expr);
  await delay(250);
}
async function setInput(selector,value){
  const result=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});
    if(!el)return false;
    const desc=Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value');
    desc.set.call(el,${JSON.stringify(String(value))});
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  })()`);
  if(!result)throw Error("Missing input "+selector);
  await delay(350);
}
async function screenshot(filename){
  const data=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await mkdir(screenshots,{recursive:true});
  await writeFile(join(screenshots,filename),Buffer.from(data.data,"base64"));
  console.log("SCREENSHOT",join(screenshots,filename));
}
async function run(){
  for(let tries=0;tries<110;tries++){
    try{const res=await fetch("http://127.0.0.1:"+port+"/json/version");if(res.ok)break;}catch{}
    if(tries===109)throw Error("Chromium debugging port unavailable");
    await delay(250);
  }
  const tab=await (await fetch("http://127.0.0.1:"+port+"/json/new?"+encodeURIComponent(base),{method:"PUT"})).json();
  client=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{client.addEventListener("open",resolve,{once:true});client.addEventListener("error",reject,{once:true});});
  client.addEventListener("message",e=>{
    const message=JSON.parse(String(e.data));
    if(!message.id)return;
    const request=pending.get(message.id);if(!request)return;
    pending.delete(message.id);
    if(message.error)request.reject(Error(message.error.message));else request.resolve(message.result);
  });
  await send("Page.enable");
  await send("Runtime.enable");
  // Each run starts from a clean browser project state in its isolated Chrome profile.
  await send("Storage.clearDataForOrigin",{origin:"http://127.0.0.1:39508",storageTypes:"all"});
  await send("Emulation.setDeviceMetricsOverride",{width:1560,height:1000,deviceScaleFactor:1,mobile:false});
  await send("Page.navigate",{url:base});
  await until("document.readyState==='complete'&&!!document.querySelector('button[aria-label=\"Select Apexify\"]')",75000);
  await delay(2600); // Ensure client hydration before first UI click.
  await click('document.querySelector(\'button[aria-label="Select Apexify"]\')');
  await until("!!document.querySelector('.aw-text-editor')");
  await click('document.querySelector(\'.aw-text-editor [data-text-path="Text properties"] > .aw-section-heading button\')');
  await until("!!document.querySelector('.aw-text-editor [data-text-path=\"font\"]')");
  await click('document.querySelector(\'.aw-text-editor [data-text-path="font"] > .aw-section-heading button\')');
  await click('Array.from(document.querySelectorAll(\'.aw-text-editor .aw-text-optional\')).find(x=>x.firstElementChild?.textContent==="family")?.querySelector("button")');
  await setInput('input[aria-label="Text family"]',"DejaVu Sans");
  await click('document.querySelector(\'.aw-text-editor [data-text-path="layout"] > .aw-section-heading button\')');
  await click('Array.from(document.querySelectorAll(\'.aw-text-editor .aw-text-optional\')).find(x=>x.firstElementChild?.textContent==="letterSpacing")?.querySelector("button")');
  await setInput('input[aria-label="Text letterSpacing"]',"3.25");
  await until("!!document.querySelector('input[aria-label=\"Text letterSpacing\"][value=\"3.25\"]')");
  // Additional strict browser paths: nested numeric font, required curve, integer measurement canvas.
  await click('Array.from(document.querySelectorAll(".aw-text-editor:not(.aw-text-editor-compact) .aw-text-optional")).find(x=>x.firstElementChild?.textContent==="weight")?.querySelector("button")');
  await evaluate(`(()=>{const el=document.querySelector('select[aria-label="Text weight mode"]'); if(!el)return false;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(el,"numeric");el.dispatchEvent(new Event("change",{bubbles:true}));return true;})()`);
  await until("!!document.querySelector('input[aria-label=\"Text weight numeric\"]')");
  await setInput('input[aria-label="Text weight numeric"]',"350");
  await until("document.querySelector('input[aria-label=\"Text weight numeric\"]')?.value==='350'");
  console.log("STRICT_NUMERIC_WEIGHT_350_PASS");
  await click('document.querySelector(\'.aw-text-editor:not(.aw-text-editor-compact) [data-text-path="textOnCurve"] > .aw-section-heading button\')');
  await until("!!document.querySelector('input[aria-label=\"Text sweepAngle\"]')");
  const sweep=await evaluate("document.querySelector('input[aria-label=\"Text sweepAngle\"]').value");
  if(sweep!=="120")throw Error("Curved default sweep invalid: "+sweep);
  console.log("STRICT_CURVE_REQUIRED_120_PASS");
  await click('document.querySelector(\'.aw-text-editor:not(.aw-text-editor-compact) [data-text-path="measurementCanvas"] > .aw-section-heading button\')');
  await click('Array.from(document.querySelectorAll(".aw-text-editor:not(.aw-text-editor-compact) .aw-text-optional")).find(x=>x.firstElementChild?.textContent==="width")?.querySelector("button")');
  await setInput('input[aria-label="Text width"]',"256");
  await until("document.querySelector('input[aria-label=\"Text width\"]')?.value==='256'");
  console.log("STRICT_MEASUREMENT_CANVAS_INTEGER_256_PASS");
  await click('Array.from(document.querySelectorAll("button")).find(x=>x.textContent?.includes("Measure with painter.measureText"))');
  await until("!!document.querySelector('.aw-text-metrics')",15000);
  const observed=await evaluate("document.querySelector('.aw-text-metrics').innerText");
  console.log("NATIVE_METRICS",observed.replaceAll("\\n"," | "));
  await until("document.documentElement.innerHTML.includes('letterSpacing')");
  await screenshot("01-native-typography-inspector.png");
  const save=await evaluate("document.querySelector('input[aria-label=\"Text letterSpacing\"]').value");
  if(save!=="3.25")throw Error("Visual -> model did not retain letterSpacing");
  console.log("EDITOR_INPUT_COMMITTED",save);
  const graphExists=await evaluate("!!document.querySelector('.aw-text-editor-compact')");
  if(!graphExists)throw Error("Graph text editor not mounted");
  await setInput('.aw-text-editor-compact input[aria-label="Text letterSpacing"]',"4.5");
  const inspectorSynced=await until("document.querySelector('.aw-text-editor:not(.aw-text-editor-compact) input[aria-label=\\\"Text letterSpacing\\\"]')?.value==='4.5'");
  if(!inspectorSynced)throw Error("Graph input did not reach Inspector model");
  console.log("GRAPH_TO_INSPECTOR_SYNC",inspectorSynced);
  await click('document.querySelector(\'[aria-label="Undo"]\')');
  await until("document.querySelector('.aw-text-editor:not(.aw-text-editor-compact) input[aria-label=\\\"Text letterSpacing\\\"]')?.value==='3.25'");
  await click('document.querySelector(\'[aria-label="Redo"]\')');
  await until("document.querySelector('.aw-text-editor:not(.aw-text-editor-compact) input[aria-label=\\\"Text letterSpacing\\\"]')?.value==='4.5'");
  console.log("UNDO_REDO_PASS");
  await click('document.querySelector(\'[aria-label="Undo"]\')');
  await until("document.querySelector('.aw-text-editor:not(.aw-text-editor-compact) input[aria-label=\\\"Text letterSpacing\\\"]')?.value==='3.25'");
  await evaluate("document.querySelector('.aw-text-editor-compact')?.scrollIntoView({block:'center'})");
  await delay(350);
  await screenshot("02-typed-graph-with-text-editor.png");
  await delay(1900);
  await send("Page.reload",{ignoreCache:true});
  await until("document.readyState==='complete'&&!!document.querySelector('button[aria-label=\"Select Apexify\"]')",75000);
  await delay(2600); // Ensure client hydration before first UI click.
  await click('document.querySelector(\'button[aria-label="Select Apexify"]\')');
  await until("!!document.querySelector('input[aria-label=\"Text letterSpacing\"]')",20000);
  const persisted=await evaluate("document.querySelector('input[aria-label=\"Text letterSpacing\"]').value");
  if(persisted!=="3.25")throw Error("Text did not persist after reload: "+persisted);
  console.log("PERSISTED_AFTER_RELOAD",persisted);
  await screenshot("03-persisted-text-after-reload.png");
  // Project export uses the real "Save project" browser download; import uses the hidden project file input.
  const exportsDir=resolve(process.cwd(),"evidence","workspace-text","strict","project-export");
  await mkdir(exportsDir,{recursive:true});
  await send("Page.setDownloadBehavior",{behavior:"allow",downloadPath:exportsDir});
  await click('Array.from(document.querySelectorAll("footer button")).find(x=>x.textContent?.includes("Save project"))');
  const fs=require("node:fs");
  let exportedPath=null;
  for(let n=0;n<75;n++){
    const files=fs.readdirSync(exportsDir).filter(x=>x.endsWith(".apexify.json"));
    if(files.length){exportedPath=join(exportsDir,files[0]);break;}
    await delay(120);
  }
  if(!exportedPath)throw Error("PROJECT_EXPORT_NOT_DOWNLOADED");
  const exported=JSON.parse(fs.readFileSync(exportedPath,"utf8"));
  const exportedText=exported.layers.find(x=>x.kind==="text");
  if(!exportedText||exportedText.textSettings?.properties?.layout?.letterSpacing!==3.25)throw Error("EXPORTED_SEMANTIC_VALUE_MISSING");
  if(exportedText.textSettings?.properties?.font?.weight!==350)throw Error("EXPORTED_NUMERIC_WEIGHT_MISSING");
  console.log("PROJECT_EXPORT_JSON_PASS",exportedPath);
  await setInput('input[aria-label="Text letterSpacing"]',"8");
  await until('Array.from(document.querySelectorAll("input")).some(x=>x.getAttribute("aria-label")==="Text letterSpacing"&&x.value==="8")');
  await send("DOM.enable");const root=await send("DOM.getDocument",{depth:-1});
  const pick=await send("DOM.querySelector",{nodeId:root.root.nodeId,selector:'.aw-tools input[type=file][accept="application/json,.json"]'});
  if(!pick.nodeId)throw Error("PROJECT_IMPORT_INPUT_NOT_FOUND");
  await send("DOM.setFileInputFiles",{nodeId:pick.nodeId,files:[exportedPath]});
  await delay(500);
  await click('Array.from(document.querySelectorAll("button")).find(x=>x.getAttribute("aria-label")==="Select Apexify")');
  await until('Array.from(document.querySelectorAll("input")).some(x=>x.getAttribute("aria-label")==="Text letterSpacing"&&x.value==="3.25")',15000);
  console.log("PROJECT_IMPORT_RESTORED_EXACT_VALUE_PASS");
  // Verify Code -> Visual by editing generated composition data via the actual mounted CodeMirror editor.
  await until("!!document.querySelector('.cm-editor')",20000);
  const changed=await evaluate(`(()=>{const view=document.querySelector('.cm-editor .cm-content')?.cmTile?.root?.view;
    if(!view)return {ok:false,reason:'CodeMirror document view unavailable'};
    const source=view.state.doc.toString(),pattern=/"letterSpacing"\\s*:\\s*3\\.25/;
    if(!pattern.test(source))return {ok:false,reason:'missing exact source value',length:source.length};
    const next=source.replace(pattern,'"letterSpacing": 4.125');
    view.dispatch({changes:{from:0,to:view.state.doc.length,insert:next}});
    return {ok:true,previousLength:source.length,nextLength:next.length};
  })()`);
  if(!changed?.ok)throw Error('CODEMIRROR_TRANSACTION_REJECTED '+JSON.stringify(changed));
  console.log('CODEMIRROR_EDITOR_TRANSACTION_PASS',changed);
  await until("!!document.querySelector('.aw-source-dirty')",15000);
  await click('document.querySelector(".aw-code-toolbar button.aw-button")');
  await delay(900);
  console.log("CODE_APPLY_INSPECTION",await evaluate('({dirty:!!document.querySelector(".aw-source-dirty"),synced:!!document.querySelector(".aw-source-synced"),error:document.querySelector(".aw-code-error")?.textContent,alert:document.querySelector("[role=alert]")?.textContent})'));
  await until("!!document.querySelector('.aw-source-synced')",20000);
  await click('Array.from(document.querySelectorAll("button")).find(x=>x.getAttribute("aria-label")==="Select Apexify")');
  await until('Array.from(document.querySelectorAll("input")).some(x=>x.getAttribute("aria-label")==="Text letterSpacing"&&x.value==="4.125")',15000);
  console.log("CODE_TO_VISUAL_APPLY_PASS");
  await until("!!document.querySelector('img[src^=blob]')",20000);
  const pngDigest=await evaluate(`(async()=>{const im=document.querySelector('img[src^="blob:"]');
    const a=await (await fetch(im.src)).arrayBuffer();
    return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",a)),x=>x.toString(16).padStart(2,"0")).join("");
  })()`);
  if(!/^[0-9a-f]{64}$/.test(pngDigest))throw Error("PREVIEW_NOT_NATIVE_BLOB_PNG");
  console.log("CODE_APPLY_SERVER_NATIVE_PNG",pngDigest);
  console.log("BROWSER_PASS");
}
run().catch(e=>{console.error("BROWSER_FAIL",e.stack||String(e));process.exitCode=1;}).finally(async()=>{
  try{client?.close();}catch{}
  try{chrome.kill();}catch{}
});
