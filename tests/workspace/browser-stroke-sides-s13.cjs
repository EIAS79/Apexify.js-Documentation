const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const url=process.env.S13_URL||'http://127.0.0.1:38495/workspace';
const sides=['all','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[],records=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function model(){return page.evaluate(async()=>{const db=await new Promise((a,b)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>a(q.result);q.onerror=()=>b(q.error)});try{const q=db.transaction('projects','readonly').objectStore('projects').get('active-project');return await new Promise((a,b)=>{q.onsuccess=()=>a(q.result);q.onerror=()=>b(q.error)})}finally{db.close()}})}
 async function persist(fn,description){let current;const t=Date.now();while(Date.now()-t<17000){current=await model();if(current&&fn(current))return current;await page.waitForTimeout(80)}throw Error('Unsaved '+description+': '+JSON.stringify(current?.document?.canvasExtras).slice(0,400))}
 async function raster(){return page.evaluate(async()=>{const i=document.querySelector('.aw-visual .aw-render-image');if(!i?.complete||!i.naturalWidth)return null;const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',d)),x=>x.toString(16).padStart(2,'0')).join('')})}
 async function haveRaster(){const t=Date.now();while(Date.now()-t<20000){const a=await raster();if(a)return a;await page.waitForTimeout(130)}throw Error('Renderer unavailable')}
 try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:40000});
 await page.getByRole('button',{name:'New Project'}).click();
 await persist(x=>x.document?.width===1280,'New Project');
 await page.locator('.aw-graph-semantic-properties > summary').click();
 await page.getByLabel('Graph stroke enabled',{exact:true}).check();
 await persist(x=>x.document.canvasExtras?.stroke?.width===8,'Stroke');
 await page.getByLabel('Graph stroke radius',{exact:true}).fill('22');
 await persist(x=>x.document.canvasExtras?.stroke?.borderRadius===22,'Stroke radius');
 for(const [key,label] of [['borderPosition','Graph stroke border position'],['roundedCorners','Graph stroke rounded corners']]){
  const sel=page.getByLabel(label,{exact:true});assert.equal(await sel.locator('option').count(),9);
  for(const side of sides){
   const old=await model();
   await sel.selectOption(side);
   const state=await persist(x=>x.revision>old.revision&&x.document.canvasExtras?.stroke?.[key]===side,key+' '+side);
   const hash=await haveRaster();
   records.push({path:'canvas.stroke.'+key,value:side,revision:state.revision,hash});
  }
 }
 await page.getByLabel('Undo',{exact:true}).click();
 await persist(x=>x.document.canvasExtras?.stroke?.roundedCorners!=='bottom-right','Undo last group');
 await page.getByLabel('Redo',{exact:true}).click();
 await persist(x=>x.document.canvasExtras?.stroke?.roundedCorners==='bottom-right','Redo last group');
 await page.screenshot({path:'D:/ApexifySupervisor5LocalBuildArtifacts/supervisor13_stroke_sides_graph.png'});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:35000});
 const r=await persist(x=>x.document.canvasExtras?.stroke?.borderPosition==='bottom-right'&&x.document.canvasExtras?.stroke?.roundedCorners==='bottom-right','Reload');
 assert.deepEqual(errors,[]);
 await fs.writeFile('D:/ApexifySupervisor5LocalBuildArtifacts/supervisor13_stroke_side_browser.json',JSON.stringify({records,errors,revision:r.revision},null,2));
 console.log('S13_STROKE_SIDES_BROWSER_PASS='+JSON.stringify({paths:2,variants:18,revision:r.revision,browser:browser.version()}));
 }finally{await browser.close()}
})().catch(e=>{console.error('S13_STROKE_SIDES_BROWSER_FAIL',e.stack||e);process.exitCode=1});