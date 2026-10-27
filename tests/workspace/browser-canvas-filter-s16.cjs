const path=require('path'),fs=require('fs/promises'),assert=require('assert/strict'),crypto=require('crypto');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const sharp=require(path.join(process.env.TEMP,'apexify-supervisor12-isolated-fullsource/node_modules/sharp'));
const outputDir='D:/ApexifyCanvasS15IntegrationAudit_764cd972_20261022/S16_browser';
(async()=>{
 await fs.mkdir(outputDir,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:2100,height:1300},acceptDownloads:true});
 const errors=[],edits=[],shots=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function state(){return page.evaluate(async()=>{
   const db=await new Promise((ok,no)=>{const req=indexedDB.open('apexify-workspace-immutable-assets-v1');req.onsuccess=()=>ok(req.result);req.onerror=()=>no(req.error)});
   try{const req=db.transaction('projects','readonly').objectStore('projects').get('active-project');
    return await new Promise((ok,no)=>{req.onsuccess=()=>ok(req.result);req.onerror=()=>no(req.error)})}
   finally{db.close()}
 })}
 async function wait(predicate,label){let last;const t=Date.now();while(Date.now()-t<25000){
  last=await state();if(last&&predicate(last))return last;await page.waitForTimeout(100);
 }throw Error(label+' not saved: '+JSON.stringify(last?.document?.canvasExtras).slice(0,400))}
 async function mutate(action,label,test){
  const prior=await state();await action();const result=await wait(s=>s.revision>prior.revision&&test(s.document.canvasExtras||{}),label);
  edits.push({label,revision:result.revision});return result;
 }
 async function screenshot(name){
  await page.locator('.aw-canvas-status .aw-status-ready').first().waitFor({timeout:35000});
  await page.waitForTimeout(250);
  await page.screenshot({path:path.join(outputDir,name+'.png'),animations:'disabled'});
  shots.push(name);
 }
 try{
  await page.goto('http://127.0.0.1:38496/workspace',{waitUntil:'domcontentloaded',timeout:55000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:45000});
  await page.getByRole('button',{name:'New Project'}).click();
  await wait(s=>s.document?.width===1280,'new project');
  await page.getByLabel('Width',{exact:true}).fill('512');
  await wait(s=>s.document.width===512,'bounded native filter width');
  await page.getByLabel('Height',{exact:true}).fill('360');
  await wait(s=>s.document.height===360,'bounded native filter height');
  const raw=Buffer.alloc(40*24*4);
  for(let y=0;y<24;y++)for(let x=0;x<40;x++){const i=(y*40+x)*4;raw[i]=x*5;raw[i+1]=y*9;raw[i+2]=80;raw[i+3]=255}
  const bytes=await sharp(raw,{raw:{width:40,height:24,channels:4}}).png().toBuffer();
  const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
  const importer=page.getByLabel('Import canvas background image');
  await mutate(()=>importer.setInputFiles({name:'verified-local.png',mimeType:'image/png',buffer:bytes}),'import SHA-256 root',x=>x.customBg?.source==='asset:'+sha256);
  const inspector=page.locator('#aw-canvas-images');
  await inspector.evaluate(el=>el.open=true);
  await mutate(()=>inspector.getByLabel('Add verified image filter').click(),'add verified invert',x=>x.customBg?.filters?.[0]?.type==='invert');
  await screenshot('01_verified_filter_inspector');
  const options=['grayscale','sepia','brightness','contrast','saturation','hueShift',
   'posterize','gaussianBlur','motionBlur','radialBlur','sharpen','noise','grain','edgeDetection','emboss','pixelate'];
  for(const type of options){
   await mutate(()=>inspector.getByLabel('Filter 1 type').selectOption(type),'filter '+type,x=>x.customBg?.filters?.[0]?.type===type);
  }
  await mutate(()=>inspector.getByLabel('Filter 1 size').fill('12'),'pixelate size',x=>x.customBg?.filters?.[0]?.size===12);
  await mutate(()=>inspector.getByLabel('Filter 1 x').fill('4'),'pixelate x',x=>x.customBg?.filters?.[0]?.x===4);
  await mutate(()=>inspector.getByLabel('Filter 1 y').fill('5'),'pixelate y',x=>x.customBg?.filters?.[0]?.y===5);
  await mutate(()=>inspector.getByLabel('Filter 1 width').fill('65'),'pixelate width',x=>x.customBg?.filters?.[0]?.width===65);
  await mutate(()=>inspector.getByLabel('Filter 1 height').fill('48'),'pixelate height',x=>x.customBg?.filters?.[0]?.height===48);
  await mutate(()=>inspector.getByLabel('Filter 1 type').selectOption('motionBlur'),'motion blur',x=>x.customBg?.filters?.[0]?.type==='motionBlur');
  await mutate(()=>inspector.getByLabel('Filter 1 angle').fill('31'),'motion angle',x=>x.customBg?.filters?.[0]?.angle===31);
  await screenshot('02_native_motion_blur');
  await mutate(()=>inspector.getByLabel('Filter 1 type').selectOption('radialBlur'),'radial blur',x=>x.customBg?.filters?.[0]?.type==='radialBlur');
  await mutate(()=>inspector.getByLabel('Filter 1 centerX').fill('32'),'radial center X',x=>x.customBg?.filters?.[0]?.centerX===32);
  await mutate(()=>inspector.getByLabel('Filter 1 centerY').fill('25'),'radial center Y',x=>x.customBg?.filters?.[0]?.centerY===25);
  await mutate(()=>inspector.getByLabel('Filter 1 type').selectOption('posterize'),'posterize',x=>x.customBg?.filters?.[0]?.type==='posterize');
  await mutate(()=>inspector.getByLabel('Filter 1 levels').fill('6'),'posterize levels',x=>x.customBg?.filters?.[0]?.levels===6);
  const beforeInvalid=await state();
  await inspector.getByLabel('Filter 1 levels').fill('1');
  await inspector.getByLabel('Filter 1 levels').blur();
  await page.waitForTimeout(200);
  assert.equal((await state()).revision,beforeInvalid.revision,'Invalid bounds must not commit');
  await page.locator('.aw-graph-semantic-properties > summary').click();
  const graph=page.locator('.aw-graph-semantic-properties');
  await mutate(()=>graph.getByLabel('Add verified image filter').click(),'Graph adds second filter',x=>x.customBg?.filters?.length===2);
  await mutate(()=>graph.getByLabel('Filter 2 type').selectOption('grayscale'),'Graph filter variant',x=>x.customBg?.filters?.[1]?.type==='grayscale');
  await screenshot('03_filter_graph_canonical');
  const dl=page.waitForEvent('download');
  await page.getByLabel('Download source').click();
  const file=await dl,source=await fs.readFile(await file.path(),'utf8');
  assert.ok(source.includes('ApexPainter')&&source.includes('createCanvas('));
  assert.ok(source.includes('"filters"')&&source.includes('"posterize"')&&source.includes('"grayscale"'));
  await page.getByLabel('Undo',{exact:true}).click();
  await wait(s=>s.document.canvasExtras?.customBg?.filters?.[1]?.type!=='grayscale','Undo filter');
  await page.getByLabel('Redo',{exact:true}).click();
  await wait(s=>s.document.canvasExtras?.customBg?.filters?.[1]?.type==='grayscale','Redo filter');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:40000});
  const final=await state();
  assert.equal(final.document.canvasExtras.customBg.source,'asset:'+sha256);
  assert.equal(final.document.canvasExtras.customBg.filters.length,2);
  assert.equal(final.document.canvasExtras.customBg.filters[0].levels,6);
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(outputDir,'browser-report.json'),JSON.stringify({pass:true,edits,screenshots:shots,invalidRejected:true,undoRedo:true,reload:true,codeExport:true,asset:sha256},null,2));
  console.log('S16_FILTER_CHROMIUM_PASS='+JSON.stringify({edits:edits.length,screenshots:shots.length,revision:final.revision}));
 }finally{await browser.close()}
})().catch(e=>{console.error('S16_FILTER_CHROMIUM_FAIL',e.stack||e);process.exitCode=1});
