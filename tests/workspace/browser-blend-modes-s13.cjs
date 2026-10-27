const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const url=process.env.S13_URL||'http://127.0.0.1:38495/workspace';
const out=process.env.S13_EVIDENCE||'D:/ApexifySupervisor5LocalBuildArtifacts';
const modes=['source-over','source-in','source-out','source-atop','destination-over','destination-in','destination-out','destination-atop','lighter','copy','xor','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1700,height:1100}});
 const errors=[],records=[];page.on('pageerror',x=>errors.push(x.message));
 async function persisted(){
  return page.evaluate(async()=>{
   const db=await new Promise((yes,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
   try{const tx=db.transaction('projects','readonly'),q=tx.objectStore('projects').get('active-project');
    return await new Promise((yes,no)=>{q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)})}
   finally{db.close()}
  });
 }
 async function until(fn,label){let last;const begin=Date.now();while(Date.now()-begin<18000){last=await persisted();if(last&&fn(last))return last;await page.waitForTimeout(50)}throw Error(label+' did not persist; '+JSON.stringify(last?.document?.canvasExtras).slice(0,300))}
 async function untilRaster(){const t=Date.now();let hash;while(Date.now()-t<24000){hash=await visibleHash();if(hash)return hash;await page.waitForTimeout(150)}throw Error('Rendered PNG did not decode')}
async function visibleHash(){
  return page.evaluate(async()=>{
   const img=document.querySelector('.aw-visual .aw-render-image');
   if(!img?.complete||!img.naturalWidth)return null;
   const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);
   const bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  });
 }
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:40000});
  await page.getByRole('button',{name:'New Project'}).click();
  await until(s=>s.document?.width===1280,'new');
  await page.getByRole('button',{name:'Add color layer'}).click();
  await until(s=>s.document?.canvasExtras?.bgLayers?.length===1,'color-layer');
  const inspector=page.getByLabel('Layer 1 blend',{exact:true});
  assert.equal(await inspector.locator('option').count(),26,'Inspector misses a public composite mode');
  await page.locator('.aw-graph-semantic-properties > summary').click();
  const nested=page.getByRole('group',{name:/Editable typed canvas property ports/});
  const details=page.locator('.aw-graph-semantic-properties details').filter({hasText:'Ordered layer 1'});
  await details.locator('summary').click();
  const graph=page.getByLabel('Graph layer 1 blend',{exact:true});
  assert.equal(await graph.locator('option').count(),26,'Graph misses mode');
  for(const mode of modes){
   const old=await persisted(),hash=await visibleHash();
   await graph.selectOption(mode);
   const next=await until(s=>s.revision>old.revision&&s.document.canvasExtras?.bgLayers?.[0]?.blendMode===mode,'Graph blend '+mode);
   assert.equal(await inspector.inputValue(),mode,'Inspector/Graph diverged');
   assert.equal((await persisted()).document.canvasExtras.bgLayers[0].blendMode,mode);
   const rendered=await untilRaster();
   assert.ok(rendered,'No decoded visual output after '+mode);
   records.push({path:'canvas.bgLayers.blendMode',variant:mode,revision:next.revision,before:hash,after:rendered});
  }
  await page.getByLabel('Undo',{exact:true}).click();
  await until(s=>s.document.canvasExtras?.bgLayers?.[0]?.blendMode!=='luminosity','Undo blend must restore an earlier group');
  await page.getByLabel('Redo',{exact:true}).click();
  await until(s=>s.document.canvasExtras?.bgLayers?.[0]?.blendMode==='luminosity','Redo blend value differs');
  await page.getByLabel('Canvas pattern type').selectOption('grid');
  await until(s=>s.document.canvasExtras?.patternBg?.type==='grid','pattern activate');
  const patternGroup=page.getByRole('group',{name:'Graph root pattern properties'});
  const patternBlend=patternGroup.getByLabel('Graph root blend',{exact:true});
  assert.equal(await patternBlend.locator('option').count(),26);
  for(const mode of modes){
   const old=await persisted();
   await patternBlend.selectOption(mode);
   const next=await until(s=>s.revision>old.revision&&s.document.canvasExtras?.patternBg?.blendMode===mode,'pattern blend '+mode);
   records.push({path:'canvas.patternBg.blendMode',variant:mode,revision:next.revision});
  }
  await page.getByRole('button',{name:'Add pattern layer'}).click();
  await until(s=>s.document.canvasExtras?.bgLayers?.length===2,'add nested procedural pattern');
  const nestedDetails=page.locator('.aw-graph-semantic-properties details').filter({hasText:'Ordered layer 2'});
  await nestedDetails.locator('summary').click();
  const nestedBlend=page.getByLabel('Graph layer 2 blend',{exact:true});
  assert.equal(await nestedBlend.locator('option').count(),26);
  for(const mode of modes){
   const old=await persisted();
   await nestedBlend.selectOption(mode);
   const state=await until(s=>s.revision>old.revision&&s.document.canvasExtras?.bgLayers?.[1]?.pattern?.blendMode===mode,'nested blend '+mode);
   records.push({path:'canvas.bgLayers.pattern.blendMode',variant:mode,revision:state.revision});
  }
  await page.screenshot({path:path.join(out,'supervisor13_blend_26_graph_inspector.png')});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:30000});
  const end=await until(s=>s.document.canvasExtras?.bgLayers?.[0]?.blendMode==='luminosity'&&s.document.canvasExtras?.patternBg?.blendMode==='luminosity','persistence reload');
  assert.equal(end.document.canvasExtras?.bgLayers?.[1]?.pattern?.blendMode,'luminosity');
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'supervisor13_blend_browser_matrix.json'),JSON.stringify({records,errors,revision:end.revision},null,2));
  console.log('S13_BLEND_CHROMIUM_PASS='+JSON.stringify({modes:modes.length,checks:records.length,revision:end.revision,browser:browser.version()}));
 }finally{await browser.close()}
})().catch(e=>{console.error('S13_BLEND_CHROMIUM_FAIL',e.stack||e);process.exitCode=1});