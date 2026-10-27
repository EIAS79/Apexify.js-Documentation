const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),crypto=require('node:crypto');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const sharp=require(path.join(process.env.TEMP,'apexify-supervisor12-isolated-fullsource','node_modules','sharp'));
const url=process.env.S13_URL||'http://127.0.0.1:38495/workspace';
const align=['center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'],fit=['fill','contain','cover'];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[],records=[];page.on('pageerror',e=>errors.push(e.message));
 async function state(){return page.evaluate(async()=>{const db=await new Promise((a,b)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>a(q.result);q.onerror=()=>b(q.error)});try{const q=db.transaction('projects','readonly').objectStore('projects').get('active-project');return await new Promise((a,b)=>{q.onsuccess=()=>a(q.result);q.onerror=()=>b(q.error)})}finally{db.close()}})}
 async function saved(fn,desc){const t=Date.now();let x;while(Date.now()-t<18000){x=await state();if(x&&fn(x))return x;await page.waitForTimeout(70)}throw Error(desc+' unsaved; '+JSON.stringify(x?.document?.canvasExtras).slice(0,600))}
 async function raster(){return page.evaluate(async()=>{const i=document.querySelector('.aw-visual .aw-render-image');if(!i?.complete||!i.naturalWidth)return null;const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),n=>n.toString(16).padStart(2,'0')).join('')})}
 async function decoded(){const t=Date.now();while(Date.now()-t<18000){const h=await raster();if(h)return h;await page.waitForTimeout(180)}throw Error('Decoded PNG unavailable')}
 async function select(where,name,values,predicate,inspect){
  const field=page.getByLabel(name,{exact:true});assert.equal(await field.locator('option').count(),values.length);
  for(const value of values){
   const last=await state();await field.selectOption(value);
   const next=await saved(s=>s.revision>last.revision&&predicate(s,value),name+'='+value);
   if(inspect)assert.equal(await page.getByLabel(inspect,{exact:true}).inputValue(),value);
   records.push({path:where,value,revision:next.revision,renderHash:await decoded()});
  }
 }
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:40000});
  await page.getByRole('button',{name:'New Project'}).click();await saved(s=>s.document?.width===1280,'new');
  const width=30,height=10,rgba=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;rgba[i]=x*8;rgba[i+1]=y*22;rgba[i+2]=(x+y)*6;rgba[i+3]=255}
  const file=await sharp(rgba,{raw:{width,height,channels:4}}).png().toBuffer(),hash=crypto.createHash('sha256').update(file).digest('hex');
  await page.getByLabel('Import canvas background image').setInputFiles({name:'trusted.png',mimeType:'image/png',buffer:file});
  const root=await saved(s=>s.document.canvasExtras?.customBg?.source==='asset:'+hash,'import root');
  assert.ok(root.document.assets?.some(a=>a.sha256===hash));
  await page.locator('.aw-graph-semantic-properties > summary').click();
  await select('canvas.customBg.fit','Graph root image fit',fit,(s,v)=>s.document.canvasExtras?.customBg?.fit===v,'Imported background fit');
  await select('canvas.customBg.align','Graph root image alignment',align,(s,v)=>s.document.canvasExtras?.customBg?.align===v,'Imported background alignment');
  await page.getByLabel('Import canvas image background layer').setInputFiles({name:'trusted-layer.png',mimeType:'image/png',buffer:file});
  const withLayer=await saved(s=>s.document.canvasExtras?.bgLayers?.some(l=>l.type==='image'&&l.source==='asset:'+hash),'import layer');
  const index=withLayer.document.canvasExtras.bgLayers.findIndex(l=>l.type==='image');
  const graphLayer=page.locator('.aw-graph-semantic-properties details').filter({hasText:'Ordered layer '+(index+1)});
  await graphLayer.locator('summary').click();
  await select('canvas.bgLayers.fit','Graph layer '+(index+1)+' fit',fit,(s,v)=>s.document.canvasExtras?.bgLayers?.[index]?.fit===v,'Layer '+(index+1)+' fit');
  await select('canvas.bgLayers.align','Graph layer '+(index+1)+' align',align,(s,v)=>s.document.canvasExtras?.bgLayers?.[index]?.align===v,'Layer '+(index+1)+' align');
  await page.getByLabel('Undo',{exact:true}).click();
  await saved(s=>s.document.canvasExtras?.bgLayers?.[index]?.align!=='bottom-right','image align undo');
  await page.getByLabel('Redo',{exact:true}).click();
  await saved(s=>s.document.canvasExtras?.bgLayers?.[index]?.align==='bottom-right','image align redo');
  const rootBefore=await state();
  await page.getByLabel('Graph root image intrinsic dimensions',{exact:true}).check();
  await saved(x=>x.revision>rootBefore.revision&&x.document.canvasExtras?.customBg?.inherit===true,'Graph intrinsic image');
  assert.equal(await page.getByLabel('Imported background fit',{exact:true}).isDisabled(),true);
  assert.equal(await page.getByLabel('Imported background alignment',{exact:true}).isDisabled(),true);
  assert.equal(await page.getByLabel('Imported image intrinsic dimensions',{exact:true}).isChecked(),true);
  const mode=await state();
  await page.getByLabel('Imported image intrinsic dimensions',{exact:true}).uncheck();
  await saved(x=>x.revision>mode.revision&&x.document.canvasExtras?.customBg?.inherit===false,'Inspector intrinsic image');
  assert.equal(await page.getByLabel('Graph root image fit',{exact:true}).isEnabled(),true);
  console.log('S14_IMAGE_INTRINSIC_CHROMIUM_GRAPH_AND_INSPECTOR_PASS');
  await page.screenshot({path:'D:/ApexifySupervisor5LocalBuildArtifacts/supervisor13_image_layout_graph.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:35000});
  const final=await saved(s=>s.document.canvasExtras?.customBg?.align==='bottom-right'&&s.document.canvasExtras?.bgLayers?.[index]?.align==='bottom-right','reload image layout');
  assert.equal(final.document.assets?.[0]?.sha256,hash);
  assert.deepEqual(errors,[]);
  await fs.writeFile('D:/ApexifySupervisor5LocalBuildArtifacts/supervisor13_image_layout_browser.json',JSON.stringify({records,errors,revision:final.revision,sha256:hash},null,2));
  console.log('S13_IMAGE_LAYOUT_CHROMIUM_PASS='+JSON.stringify({paths:4,checks:records.length,revision:final.revision,asset:hash,browser:browser.version()}));
 }finally{await browser.close()}
})().catch(e=>{console.error('S13_IMAGE_LAYOUT_CHROMIUM_FAIL',e.stack||e);process.exitCode=1});