const fs=require('fs'),path=require('path');
const out=process.env.IMG01_GRADIENT_BROWSER_OUT||'D:/ApexifyWorkspaceParallel/IMG01_RECOVERY_20261025/browser-gradient-proof';
const cdp=process.env.IMG01_CHROME_CDP||'http://127.0.0.1:38543';
const url=process.env.IMG01_BROWSER_URL||'http://127.0.0.1:38499/workspace';
fs.mkdirSync(out,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const tab=await(await fetch(cdp+'/json/new?'+encodeURIComponent(url),{method:'PUT'})).json();
 const ws=new WebSocket(tab.webSocketDebuggerUrl),pending=new Map();let counter=0;
 ws.onmessage=({data})=>{const m=JSON.parse(data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.no(Error(m.error.message)):p.yes(m.result)}};
 await new Promise((yes,no)=>{ws.onopen=yes;ws.onerror=no});
 const send=(method,params={})=>new Promise((yes,no)=>{const id=++counter;pending.set(id,{yes,no});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);no(Error('CDP timeout '+method))}},35000)});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result?.value};
 const until=async(expression,timeout=60000)=>{const t=Date.now();while(Date.now()-t<timeout){try{const val=await run(expression);if(val)return val}catch{}await pause(360)}throw Error('Wait expired '+expression)};
 const snap=async label=>{const x=await send('Page.captureScreenshot',{format:'png'});const p=path.join(out,label+'.png');fs.writeFileSync(p,Buffer.from(x.data,'base64'));return {file:p,bytes:fs.statSync(p).size}};
 const byLabel=label=>'[aria-label='+JSON.stringify(label)+']';
 const click=async expression=>{
  const coords=await run("(()=>{const x="+expression+";if(!x)return null;x.scrollIntoView({block:'center',inline:'center'});const rect=x.getBoundingClientRect();return {x:rect.left+rect.width/2,y:rect.top+rect.height/2,w:rect.width,h:rect.height}})()");
  if(!coords||coords.w<1||coords.h<1)throw Error('Visible click target unavailable: '+expression);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:coords.x,y:coords.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:coords.x,y:coords.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:coords.x,y:coords.y,button:'left',clickCount:1});
 };
 const report={passed:false,enginePin:'379a5248f09ed39c1b1734fe104b6bd73a77857f',steps:[],screenshots:[],error:null};
 try{
  await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url});
  await until("document.querySelector('img.aw-render-image')?.naturalWidth>0 && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",90000);
  report.steps.push({step:'loaded native preview',width:await run("document.querySelector('img.aw-render-image').naturalWidth")});
  await click("[...document.querySelectorAll('.aw-tools button')].find(x=>x.textContent.trim()==='Shape')");
  await until("!!document.querySelector('[aria-label=\"Image authoring inspector\"]') && !!document.querySelector('input[aria-label=\"Shape gradient\"]')");
  if(!await run("!!document.querySelector('input[aria-label=\"Shape color\"]')"))throw Error('Shape solid control absent before gradient');
  report.screenshots.push(await snap('01-shape-solid'));
  await click("document.querySelector('input[aria-label=\"Shape gradient\"]')");
  await until("document.querySelector('input[aria-label=\"Shape gradient\"]')?.checked===true&&!document.querySelector('input[aria-label=\"Shape color\"]')");
  await until("document.querySelector('img.aw-render-image')?.naturalWidth>0 && !document.querySelector('.aw-canvas-status .aw-status-working')",80000);
  const generatedShape=await run("document.querySelector('.aw-code .cm-content')?.textContent||''");
  report.steps.push({step:'real Shape gradient toggle excludes native-inert solid color',sourceHasShapeGradient:generatedShape.includes('gradient'),width:await run("document.querySelector('img.aw-render-image').naturalWidth")});
  report.screenshots.push(await snap('02-shape-gradient'));
  await click("[...document.querySelectorAll('.aw-image-options details summary')].find(s=>s.textContent.includes('Stroke, shadow'))");
  await click("document.querySelector('input[aria-label=\"Box background enabled\"]')");
  await until("!!document.querySelector('input[aria-label=\"Box color\"]') && !!document.querySelector('input[aria-label=\"Box gradient\"]')");
  await click("document.querySelector('input[aria-label=\"Box gradient\"]')");
  await until("document.querySelector('input[aria-label=\"Box gradient\"]')?.checked===true&&!document.querySelector('input[aria-label=\"Box color\"]')");
  await until("document.querySelector('img.aw-render-image')?.naturalWidth>0 && !document.querySelector('.aw-canvas-status .aw-status-working')",80000);
  report.steps.push({step:'real box gradient toggling excludes native-inert solid color',width:await run("document.querySelector('img.aw-render-image').naturalWidth")});
  report.screenshots.push(await snap('03-box-gradient'));
  const downloads=path.join(out,'downloads');fs.mkdirSync(downloads,{recursive:true});
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
  await click("document.querySelector('button[aria-label=\"Download source\"]')");
  let downloaded=null;
  for(let k=0;k<70;k++){const matches=fs.readdirSync(downloads).filter(n=>n.endsWith('.ts'));if(matches.length){downloaded=path.join(downloads,matches[0]);break}await pause(260)}
  if(!downloaded)throw Error('Visible Download source did not produce TypeScript artifact');
  const downloadedCode=fs.readFileSync(downloaded,'utf8');
  if(!downloadedCode.includes('const composition')||!downloadedCode.includes('gradient')||!downloadedCode.includes('boxBackground'))throw Error('Downloaded canonical code omits active gradient shape or box');
  report.steps.push({step:'native Image gradient edits reflected in real downloaded executable canonical source',file:downloaded,bytes:fs.statSync(downloaded).size});
  await click("document.querySelector('input[aria-label=\"Box gradient\"]')");
  await until("document.querySelector('input[aria-label=\"Box gradient\"]')?.checked===false&&!!document.querySelector('input[aria-label=\"Box color\"]')");
  report.steps.push({step:'real box returns to valid solid paint'});
  const synced=await run("!!document.querySelector('.aw-code .aw-source-synced')");
  report.steps.push({step:'live CodeMirror source remains synchronized with Visual after UI edit',synced});
  if(!synced)throw Error('CodeMirror reported an unsynchronized Visual change');
  report.screenshots.push(await snap('04-box-back-to-solid'));
  report.passed=true;
 }catch(e){report.error=String(e.stack||e);try{report.screenshots.push(await snap('error'))}catch(_){}}
 finally{fs.writeFileSync(path.join(out,'image-gradient-browser-proof.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,steps:report.steps,screenshots:report.screenshots.length,error:report.error},null,2));ws.close();}
 if(!report.passed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
