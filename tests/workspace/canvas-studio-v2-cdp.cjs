/* Real Chromium Canvas Studio QA using Node 24+ built-in CDP WebSocket. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const os=require("node:os");
const {spawn}=require("node:child_process");
const origin=process.env.APEXIFY_QA_URL||"http://127.0.0.1:38485";
const chrome=process.env.CHROME_PATH||"/usr/bin/google-chrome";
const artifacts=path.resolve("test-results/canvas-studio-v2");
const port=19371;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function retry(fn,timeout=85000){
  const start=Date.now(),errors=[];
  while(Date.now()-start<timeout){try{const value=await fn();if(value)return value;}catch(err){errors.push(err.message);}await sleep(400);}
  throw Error("Canvas Studio browser timeout: "+errors.slice(-3).join(" | "));
}
async function main(){
 fs.mkdirSync(artifacts,{recursive:true});
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),"apx-canvas-"));
 const process=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu","--no-first-run","--disable-extensions","--remote-debugging-address=127.0.0.1","--remote-debugging-port="+port,"--remote-allow-origins=*","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
 let ws;
 try {
  const target=await retry(async()=>{
    const result=await (await fetch("http://127.0.0.1:"+port+"/json")).json();
    return result.find(item=>item.type==="page"&&item.webSocketDebuggerUrl);
  },20000);
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
  const pending=new Map();let id=0;const exceptions=[];
  ws.onmessage=e=>{
    const v=JSON.parse(e.data);
    if(v.id){const wait=pending.get(v.id);if(wait){pending.delete(v.id);v.error?wait.no(Error(v.error.message)):wait.ok(v.result);}}
    else if(v.method==="Runtime.exceptionThrown")exceptions.push(v.params?.exceptionDetails?.text??"Unknown browser exception");
  };
  const send=(method,params={})=>new Promise((ok,no)=>{const n=++id;pending.set(n,{ok,no});ws.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>{
    const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
    return r.result.value;
  };
  const screenshot=async name=>{
    const r=await send("Page.captureScreenshot",{format:"png"});
    fs.writeFileSync(path.join(artifacts,name+".png"),Buffer.from(r.data,"base64"));
  };
  const tabClick=async name=>{
    assert(await evaluate("(() => {const t=[...document.querySelectorAll('.aw-property-tabs button')].find(x=>x.textContent.trim()==="+JSON.stringify(name)+");if(!t)return false;t.click();return true;})()"),"Missing "+name+" tab");
    await retry(()=>evaluate("document.querySelector('.aw-property-tabs [aria-selected=true]')?.textContent.trim()==="+JSON.stringify(name)),12000);
  };
  await send("Page.enable");await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:1480,height:960,deviceScaleFactor:1,mobile:false});
  await send("Page.navigate",{url:origin+"/workspace"});
  await retry(()=>evaluate("(() => {const b=document.querySelector('.aw-property-tabs button');return !!b&&Object.keys(b).some(k=>k.startsWith('__reactProps$'));})()"));
  await retry(()=>evaluate("!document.body.innerText.includes('Loading workspace...')"),60000);
  // The focused Frame layout keeps Graph available through Panels.
  if(!await evaluate("!!document.querySelector('.react-flow')")) {
    await evaluate("document.querySelector('.aw-panels-wrapper>button').click()");
    await retry(()=>evaluate("!!document.querySelector('#aw-panels-menu')"),10000);
    assert(await evaluate("(() => {const label=[...document.querySelectorAll('#aw-panels-menu label')].find(x=>x.textContent.trim()==='Visual Graph');const input=label?.querySelector('input');if(!input)return false;if(!input.checked)input.click();return true;})()"),"Graph panel must be reopenable");
    await evaluate("document.querySelector('.aw-panels-wrapper>button').click()");
  }
  await retry(()=>evaluate("document.querySelectorAll('.react-flow__node').length>=3"),30000);
  await sleep(850);
  const start=await evaluate("({tabs:[...document.querySelectorAll('.aw-property-tabs button')].map(x=>x.textContent.trim()),nodes:document.querySelectorAll('.react-flow__node').length,ports:document.querySelectorAll('.react-flow__handle').length,minimap:!!document.querySelector('.react-flow__minimap'),width:Math.round(document.querySelector('.aw-inspector').getBoundingClientRect().width)})");
  console.log("SETUP",JSON.stringify(start));
  assert.deepEqual(start.tabs,["Setup","Background","Styling","Effects","Advanced","Layers"]);
  assert(start.nodes>=3&&start.ports>=3&&start.minimap,"Interactive typed graph incomplete");
  const report={start,categories:{},graph:{}};
  await screenshot("01-setup");
  for(const [name,expected] of [["Background","background"],["Styling","aw-canvas-fundamentals"],["Effects","aw-canvas-effects"],["Advanced","aw-canvas-images"],["Layers","aw-canvas-layers"]]){
    await tabClick(name);await sleep(150);
    const state=await evaluate("({selected:document.querySelector('.aw-property-tabs [aria-selected=true]')?.textContent.trim(),sections:[...document.querySelectorAll('.aw-canvas-advanced>.aw-canvas-section')].filter(x=>x.getClientRects().length&&getComputedStyle(x).display!=='none').map(x=>x.id),base:!!document.querySelector('.aw-segmented'),fieldWidths:[...document.querySelectorAll('.aw-canvas-advanced .aw-field')].filter(x=>x.getClientRects().length).map(x=>Math.round(x.getBoundingClientRect().width)).filter(Boolean).slice(0,20)})");
    report.categories[name]=state;console.log("CATEGORY "+name,JSON.stringify(state));
    assert.equal(state.selected,name);
    if(expected==="background")assert(state.base,"Background base controls missing");
    else assert(state.sections.includes(expected),"Missing active controls: "+expected);
    assert(!state.fieldWidths.some(w=>w<65),"Collapsed field in "+name);
    if(name==="Effects"){
      const toggleOverflow=await evaluate("([...document.querySelectorAll('.aw-canvas-advanced .aw-canvas-properties input[type=checkbox]')].filter(x=>x.getClientRects().length).map(x=>({right:Math.round(x.getBoundingClientRect().right),fieldsetRight:Math.round(x.closest('fieldset').getBoundingClientRect().right)})))");
      console.log("EFFECT_TOGGLE_BOUNDS",JSON.stringify(toggleOverflow));
      assert(toggleOverflow.every(x=>x.right<=x.fieldsetRight+2),"Stroke/shadow switch overflows its fieldset");
    }
    await screenshot("02-"+name.toLowerCase());
  }
  await tabClick("Setup");
  const setup=await evaluate("({inputs:[...document.querySelectorAll('#aw-canvas-category-panel input')].map(x=>({type:x.type,width:Math.round(x.getBoundingClientRect().width)})),scroll:document.querySelector('.aw-property-tabs').scrollWidth,client:document.querySelector('.aw-property-tabs').clientWidth})");
  console.log("SETUP_FIELDS",JSON.stringify(setup));
  assert(setup.inputs.length>=3,"Canvas dimensions/name fields missing");
  assert(setup.scroll<=setup.client+3,"Canvas subtabs clipped");
  await tabClick("Background");
  assert(await evaluate("(() => {const b=[...document.querySelectorAll('.aw-segmented button')].find(x=>x.textContent.toLowerCase().includes('gradient'));if(!b)return false;b.click();return true;})()"),"Missing gradient background button");
  await retry(()=>evaluate("document.querySelector('.aw-segmented button.selected')?.textContent.trim().toLowerCase()==='gradient'"),12000);
  report.backgroundEdit="color/gradient visual control changed successfully";
  await screenshot("07-background-edit");
  const graph=await evaluate("({ids:[...document.querySelectorAll('.react-flow__node')].map(x=>x.getAttribute('data-id')),edges:document.querySelectorAll('.react-flow__edge').length,ports:document.querySelectorAll('.react-flow__handle').length})");
  console.log("GRAPH",JSON.stringify(graph));assert(graph.ids.includes("canvas:root")&&graph.ids.includes("canvas:output")&&graph.edges>=2);
  report.graph=graph;await screenshot("08-graph");
  await send("Emulation.setDeviceMetricsOverride",{width:900,height:740,deviceScaleFactor:1,mobile:false});await sleep(500);await screenshot("09-tablet");
  await send("Emulation.setDeviceMetricsOverride",{width:390,height:840,deviceScaleFactor:1,mobile:true});await sleep(500);await screenshot("10-mobile");
  fs.writeFileSync(path.join(artifacts,"report.json"),JSON.stringify(report,null,2));
  console.log("CANVAS_STUDIO_BROWSER_QA_PASS",JSON.stringify({tabs:start.tabs.length,nodes:graph.ids.length,edges:graph.edges,exceptions:exceptions.slice(0,3)}));
  if(exceptions.length)console.warn("Page exceptions",exceptions.slice(0,5));
 } finally {ws?.close();process.kill();fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});}
}
main().catch(e=>{console.error("CANVAS_STUDIO_BROWSER_QA_FAIL",e.stack||e);process.exitCode=1;});
