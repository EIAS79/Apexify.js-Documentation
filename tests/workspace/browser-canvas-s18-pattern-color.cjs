const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const out='D:/ApexifyCanvasS15IntegrationAudit_764cd972_20261022/S18/chromium';
(async()=>{
 let b;const saved=[];
 try{
 b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const p=await b.newPage({viewport:{width:1600,height:980},acceptDownloads:true});
 async function state(){return p.evaluate(async()=>{const db=await new Promise((ok,no)=>{const t=indexedDB.open('apexify-workspace-immutable-assets-v1');t.onsuccess=()=>ok(t.result);t.onerror=()=>no(t.error)});try{const g=db.transaction('projects','readonly').objectStore('projects').get('active-project');return await new Promise((ok,no)=>{g.onsuccess=()=>ok(g.result);g.onerror=()=>no(g.error)})}finally{db.close()}})}
 async function wait(fn,name){const start=Date.now();let r;while(Date.now()-start<18000){r=await state();if(r&&fn(r))return r;await p.waitForTimeout(70)}throw Error('No saved '+name)}
 await p.goto('http://127.0.0.1:38496/workspace',{waitUntil:'domcontentloaded',timeout:60000});
 await p.locator('.aw-app[aria-busy="false"]').waitFor({timeout:40000});
 await p.getByRole('button',{name:'New Project'}).click();await wait(s=>s.document.width===1280,'new');
 await p.getByRole('button',{name:'Add pattern layer'}).click();
 await wait(s=>s.document.canvasExtras?.bgLayers?.[0]?.type==='presetPattern','pattern');
 const group='Layer 1';
 for(const field of ['primary','secondary']){
  const label=group+' '+field+' color',value=field==='primary'?'#b523a9':'#1adab3';
  const before=await state();await p.locator('.aw-inspector').getByLabel(label,{exact:true}).fill(value);
  const after=await wait(s=>s.revision>before.revision&&s.document.canvasExtras?.bgLayers?.[0]?.pattern?.[field==='primary'?'color':'secondaryColor']===value,label);
  saved.push({path:'canvas.bgLayers.pattern.'+(field==='primary'?'color':'secondaryColor'),revision:after.revision,value});
 }
 await p.screenshot({path:path.join(out,'07_S18_pattern_colors_inspector.png'),animations:'disabled'});
 await p.locator('.aw-graph-semantic-properties > summary').click();
 assert.ok((await state()).document.canvasExtras.bgLayers[0].nodeId);
 await p.screenshot({path:path.join(out,'08_S18_pattern_colors_graph.png'),animations:'disabled'});
 const dl=p.waitForEvent('download');await p.getByLabel('Download source').click();const downloaded=await dl,src=await fs.readFile(await downloaded.path(),'utf8');
 assert.ok(src.includes('"secondaryColor"')&&src.includes('"#1adab3"')&&src.includes('"color"')&&src.includes('"#b523a9"'));
 await p.getByLabel('Undo',{exact:true}).click();await wait(s=>s.document.canvasExtras?.bgLayers?.[0]?.pattern?.secondaryColor!=='#1adab3','undo');
 await p.getByLabel('Redo',{exact:true}).click();await wait(s=>s.document.canvasExtras?.bgLayers?.[0]?.pattern?.secondaryColor==='#1adab3','redo');
 await p.reload({waitUntil:'domcontentloaded'});await p.locator('.aw-app[aria-busy="false"]').waitFor({timeout:30000});
 const r=await state();assert.equal(r.document.canvasExtras.bgLayers[0].pattern.color,'#b523a9');assert.equal(r.document.canvasExtras.bgLayers[0].pattern.secondaryColor,'#1adab3');
 await fs.writeFile(path.join(out,'S18_2_PATTERN_COLOR_BROWSER_REPORT.json'),JSON.stringify({pass:true,saved,history:true,code:true,graph:true,reload:true,screenshots:2},null,2));
 console.log('S18_PATTERN_COLOR_2_BROWSER_PASS='+JSON.stringify(saved));
 }finally{await b?.close()}
})().catch(e=>{console.error('S18_PATTERN_COLOR_BROWSER_ERROR',e.stack||e);process.exitCode=1});
