const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const sharp=require(path.join(process.env.TEMP,'apexify-supervisor12-isolated-fullsource','node_modules','sharp'));
const url=process.env.S13_URL||'http://127.0.0.1:38495/workspace';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1700,height:1100}}),records=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function stored(){return page.evaluate(async()=>{const db=await new Promise((res,rej)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});try{const q=db.transaction('projects','readonly').objectStore('projects').get('active-project');return await new Promise((res,rej)=>{q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}finally{db.close()}})}
 async function wait(fn,name){const t=Date.now();let x;while(Date.now()-t<22000){x=await stored();if(x&&fn(x))return x;await page.waitForTimeout(100)}throw Error(name+' not durable '+JSON.stringify(x?.document?.canvasExtras).slice(0,300))}
 async function pixels(){return page.evaluate(async()=>{const img=document.querySelector('.aw-visual .aw-render-image');if(!img?.complete||!img.naturalWidth)return null;const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',p)),n=>n.toString(16).padStart(2,'0')).join('')})}
 async function changed(prev,name){const t=Date.now();while(Date.now()-t<22000){const v=await pixels();if(v&&v!==prev)return v;await page.waitForTimeout(160)}throw Error(name+' yielded no decoded pixel change')}
 async function scalar(label,path,read,values=[0.35,0.75]){
  for(const value of values){
   const old=await stored(),before=await pixels();
   await page.getByLabel(label,{exact:true}).fill(String(value));
   const next=await wait(s=>s.revision>old.revision&&read(s.document.canvasExtras??{})===value,path+' '+value);
   const hash=before?await changed(before,path):await pixels();
   records.push({path,value,revision:next.revision,pixelHash:hash});
  }
 }
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:40000});
  await page.getByRole('button',{name:'New Project'}).click();await wait(s=>s.document?.width===1280,'new project');
  await page.locator('.aw-graph-semantic-properties > summary').click();
  await scalar('Graph canvas opacity','canvas.opacity',x=>x.opacity);
  const pixelsData=await sharp({create:{width:30,height:10,channels:4,background:{r:85,g:171,b:220,alpha:1}}}).png().toBuffer();
  const hash=crypto.createHash('sha256').update(pixelsData).digest('hex');
  await page.getByLabel('Import canvas background image').setInputFiles({name:'scalar-image.png',mimeType:'image/png',buffer:pixelsData});
  await wait(s=>s.document.canvasExtras?.customBg?.source==='asset:'+hash,'import verified root');
  await scalar('Graph root image opacity','canvas.customBg.opacity',x=>x.customBg?.opacity);
  await page.getByRole('button',{name:'Add color layer'}).click();
  await wait(s=>s.document.canvasExtras?.bgLayers?.length===1,'color layer');
  const layer=page.locator('.aw-graph-semantic-properties details').filter({hasText:'Ordered layer 1'});
  await layer.locator('summary').click();
  await scalar('Graph layer 1 opacity','canvas.bgLayers.opacity',x=>x.bgLayers?.[0]?.opacity);
  await page.getByRole('button',{name:'Add noise layer'}).click();
  await wait(s=>s.document.canvasExtras?.bgLayers?.length===2,'noise layer');
  await page.locator('.aw-graph-semantic-properties details').filter({hasText:'Ordered layer 2'}).locator('summary').click();
  await scalar('Graph layer 2 noise intensity','canvas.bgLayers.intensity',x=>x.bgLayers?.[1]?.intensity);
  await page.getByRole('button',{name:'Add pattern layer'}).click();
  await wait(s=>s.document.canvasExtras?.bgLayers?.length===3,'pattern layer');
  await page.locator('.aw-graph-semantic-properties details').filter({hasText:'Ordered layer 3'}).locator('summary').click();
  await scalar('Graph layer 3 opacity','canvas.bgLayers.pattern.opacity',x=>x.bgLayers?.[2]?.pattern?.opacity);
  assert.equal(await page.getByLabel('Graph layer 3 layer opacity').count(),1,'Nested-pattern layer and nested paint alpha must not collide');
  await page.getByLabel('Undo',{exact:true}).click();await wait(s=>s.document.canvasExtras?.bgLayers?.[2]?.pattern?.opacity!==0.75,'undo');
  await page.getByLabel('Redo',{exact:true}).click();await wait(s=>s.document.canvasExtras?.bgLayers?.[2]?.pattern?.opacity===0.75,'redo');
  await page.screenshot({path:'D:/ApexifySupervisor5LocalBuildArtifacts/supervisor13_scalar_graph.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:35000});
  const end=await wait(s=>s.document.canvasExtras?.bgLayers?.[2]?.pattern?.opacity===0.75&&s.document.canvasExtras?.customBg?.opacity===0.75,'reload');
  assert.deepEqual(errors,[]);
  await fs.writeFile('D:/ApexifySupervisor5LocalBuildArtifacts/supervisor13_scalar_browser.json',JSON.stringify({records,errors,revision:end.revision},null,2));
  console.log('S13_SCALAR_BROWSER_PASS='+JSON.stringify({paths:5,checks:records.length,revision:end.revision,browser:browser.version()}));
 }finally{await browser.close()}
})().catch(e=>{console.error('S13_SCALAR_BROWSER_FAIL',e.stack||e);process.exitCode=1});