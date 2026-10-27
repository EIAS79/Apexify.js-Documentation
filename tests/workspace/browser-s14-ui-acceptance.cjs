const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const sharp=require(path.join(process.env.TEMP,'apexify-supervisor12-isolated-fullsource/node_modules/sharp'));
const origin=process.env.S14_URL||'http://127.0.0.1:38496/workspace';
const out=process.env.S14_EVIDENCE_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts/supervisor14_live_ui';
async function run(){
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:2080,height:1260},deviceScaleFactor:1});
 const errors=[],records=[],screens=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text().slice(0,200))});
 async function state(){return page.evaluate(async()=>{
  const db=await new Promise((yes,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
  try{const req=db.transaction('projects','readonly').objectStore('projects').get('active-project');
   return await new Promise((yes,no)=>{req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error)});}
  finally{db.close()}
 });}
 async function until(fn,description,ms=25000){
  let last;const t=Date.now();while(Date.now()-t<ms){last=await state();if(last&&fn(last))return last;await page.waitForTimeout(80)}
  throw Error(description+' not saved; '+JSON.stringify(last?.document?.canvasExtras).slice(0,380));
 }
 async function changed(fn,description){
  const old=await state(),rev=old?.revision||0;await fn();const next=await until(s=>s.revision>rev,description);
  records.push({action:description,revision:next.revision,canvasExtras:!!next.document?.canvasExtras});
  return next;
 }
 async function rendered(){
  const t=Date.now();while(Date.now()-t<27000){const info=await page.evaluate(async()=>{
   const i=document.querySelector('.aw-visual .aw-render-image');if(!i?.complete||!i.naturalWidth)return null;
   const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);
   const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   return {width:c.width,height:c.height,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('')};
  });if(info)return info;await page.waitForTimeout(150)}throw Error('Native renderer not decoded in Visual');
 }
 async function panel(group){const target=page.locator('#aw-canvas-'+group);await target.locator('summary').scrollIntoViewIfNeeded();await target.evaluate(x=>x.open=true);await page.waitForTimeout(180);}
 async function shot(number,name,group){
  if(group)await panel(group);
  await page.waitForTimeout(260);
  await page.locator('.aw-canvas-status .aw-status-ready').first().waitFor({timeout:40000});
  await rendered();
  const filename=String(number).padStart(2,'0')+'_'+name+'.png';
  const file=path.join(out,filename);
  await page.screenshot({path:file,animations:'disabled'});
  screens.push({section:name,filename,actualRender:await rendered()});
  console.log('S14_SCREENSHOT',filename);
 }
 async function field(label,value){return changed(()=>page.getByLabel(label,{exact:true}).fill(String(value)),label+'='+value);}
 async function select(label,value){return changed(()=>page.getByLabel(label,{exact:true}).selectOption(value),label+'='+value);}
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:45000});
  await page.getByRole('button',{name:'New Project'}).click();
  await until(s=>s.document?.width===1280&&s.document?.height===720,'new project');
  await field('Width',1024);
  await field('Height',640);
  await field('Canvas X',14);
  await field('Canvas Y',8);
  await field('Opacity',0.94);
  await field('Rotation',12);
  await field('Blur',3);
  await field('Zoom scale',1.06);
  await field('Zoom center X',515);
  await field('Zoom center Y',295);
  await field('Border radius',18);
  await select('Canvas border position','top');
  await shot(1,'canvas_fundamentals','fundamentals');

  await select('Canvas gradient type','linear');
  await until(s=>s.document.canvasExtras?.gradientBg?.type==='linear','linear gradient');
  await changed(()=>page.getByRole('button',{name:'Add gradient stop'}).first().click(),'add native gradient stop');
  await until(s=>s.document.canvasExtras?.gradientBg?.colors?.length===3,'gradient third stop');
  await field('Root stop 2',0.42);
  await changed(async()=>{const input=page.getByLabel('Root stop hex 2',{exact:true});await input.fill('#19d3d1');await input.blur();},'gradient stop hex color');
  await select('Root gradient type','radial');
  await until(s=>s.document.canvasExtras?.gradientBg?.colors?.length===3,'preserve three stops changing variant');
  await field('Root end radius',340);
  await field('Root start radius',22);
  await select('Root gradient type','conic');
  await until(s=>s.document.canvasExtras?.gradientBg?.type==='conic'&&s.document.canvasExtras?.gradientBg?.colors?.length===3,'conic preserve stops');
  await field('Root center X',540);
  await field('Root center Y',320);
  await shot(2,'gradient_editor','gradients');
  await select('Root gradient type','radial');
  await field('Root end radius',450);

  await select('Canvas pattern type','waves');
  await field('Root size',36);
  await field('Root spacing',48);
  await field('Root opacity',0.26);
  await select('Root blend','screen');
  await shot(3,'procedural_patterns','patterns');

  await changed(()=>page.getByRole('button',{name:'Add color layer'}).click(),'add initial color layer');
  const initialLayer=(await state()).document.canvasExtras.bgLayers[0].nodeId;
  await select('Background layer 1 type','gradient');
  await until(s=>s.document.canvasExtras?.bgLayers?.[0]?.type==='gradient'&&s.document.canvasExtras?.bgLayers?.[0]?.nodeId===initialLayer,'switch to gradient stable identity');
  await select('Background layer 1 type','color');
  await until(s=>s.document.canvasExtras?.bgLayers?.[0]?.type==='color'&&s.document.canvasExtras?.bgLayers?.[0]?.nodeId===initialLayer,'switch back safely stable identity');
  await changed(()=>page.getByRole('button',{name:'Add gradient layer'}).click(),'add gradient layer');
  await changed(()=>page.getByRole('button',{name:'Add pattern layer'}).click(),'add procedural layer');
  await changed(()=>page.getByRole('button',{name:'Add noise layer'}).click(),'add noise layer');
  await select('Layer 1 blend','multiply');
  await field('Layer 3 layer opacity',0.22);
  await field('Layer 4 noise intensity',0.16);
  await changed(()=>page.getByLabel('Background layer 3').getByRole('button',{name:'Up'}).click(),'reorder procedural layer');
  assert.equal((await state()).document.canvasExtras.bgLayers.length,4);
  await shot(4,'ordered_background_layers','layers');

  await changed(()=>page.getByLabel('Canvas stroke enabled').check(),'enable native stroke');
  await select('Canvas stroke style','double');
  await field('Canvas stroke width',18);
  await changed(()=>page.getByLabel('Canvas stroke color',{exact:true}).fill('#f0783d'),'stroke solid paint');
  await select('Canvas stroke border position','all');
  await field('Canvas stroke radius',25).catch(async err=>{throw new Error('Stroke radius required: '+err.message)});
  await shot(5,'stroke_border_editor','effects');

  await changed(()=>page.getByLabel('Canvas shadow enabled').check(),'enable native shadow');
  await field('Canvas shadow X',24);
  await field('Canvas shadow Y',19);
  await field('Canvas shadow blur',26);
  await field('Canvas shadow opacity',0.67);
  await changed(()=>page.getByLabel('Canvas shadow color',{exact:true}).fill('#c38fff'),'shadow solid paint');
  await shot(6,'shadow_effect_editor','effects');

  await changed(()=>page.getByRole('button',{name:'Add pattern layer'}).click(),'add composite procedural layer');
  await page.locator('.aw-graph-semantic-properties > summary').click();
  await page.locator('.aw-graph-semantic-properties details').filter({hasText:'Ordered layer 1'}).locator('summary').click();
  await page.getByLabel('Graph layer 1 blend').selectOption('overlay');
  await until(s=>s.document.canvasExtras?.bgLayers?.[0]?.blendMode==='overlay','Graph semantic layer blend');
  await shot(7,'typed_graph_editor','effects');

  await page.waitForTimeout(1200);
  const codeText=await page.locator('.aw-code').innerText();
  assert.ok(codeText.includes('Synced with Visual & Graph'),'Code not synced');
  // CodeMirror virtualizes offscreen lines: check the exported complete program,
  // rather than assuming createCanvas is in the visible editor viewport.
  const downloadEvent=page.waitForEvent('download');
  await page.getByLabel('Download source').click();
  const downloaded=await downloadEvent;
  const program=await fs.readFile(await downloaded.path(),'utf8');
  assert.ok(program.includes('ApexPainter')&&program.includes('createCanvas(')&&program.includes('apexify.js'),
    'Downloaded Code does not use real public Apexify.js');
  await shot(8,'generated_apexify_code','gradients');

  const raw=Buffer.alloc(32*18*4);
  for(let y=0;y<18;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;raw[i]=20+x*6;raw[i+1]=110+y*7;raw[i+2]=178;raw[i+3]=255;}
  const file=await sharp(raw,{raw:{width:32,height:18,channels:4}}).png().toBuffer();
  const hash=crypto.createHash('sha256').update(file).digest('hex');
  await page.getByLabel('Import canvas image background layer').setInputFiles({name:'workspace_verified_asset.png',mimeType:'image/png',buffer:file});
  await until(s=>s.document?.canvasExtras?.bgLayers?.some(l=>l.type==='image'&&l.source==='asset:'+hash),'secure imported image');
  const assetLayer=(await state()).document.canvasExtras.bgLayers.length;
  await select('Layer '+assetLayer+' fit','contain');
  await select('Layer '+assetLayer+' align','top-right');
  await shot(9,'composite_native_canvas','images');

  await page.getByLabel('Undo',{exact:true}).click();
  await until(s=>s.document.canvasExtras?.bgLayers?.[assetLayer-1]?.align!=='top-right','undo image layout');
  await page.getByLabel('Redo',{exact:true}).click();
  await until(s=>s.document.canvasExtras?.bgLayers?.[assetLayer-1]?.align==='top-right','redo image layout');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:40000});
  const saved=await state();
  assert.equal(saved.document.width,1024);
  assert.equal(saved.document.height,640);
  assert.equal(saved.document.canvasExtras.gradientBg.type,'radial');
  assert.equal(saved.document.canvasExtras.gradientBg.colors.length,3);
  assert.equal(saved.document.canvasExtras.bgLayers.length,6);
  assert.ok(saved.document.assets.some(a=>a.sha256===hash));
  assert.equal(saved.document.canvasExtras.bgLayers.at(-1).align,'top-right');
  assert.ok(await rendered());
  if(errors.length)console.log('S14_BROWSER_ERRORS',JSON.stringify(errors.slice(0,12)));
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'s14_browser_report.json'),JSON.stringify({screens,records,errorCount:errors.length,commit:saved.revision,source:'Real Chrome 155 local /workspace, live v6 rendering, IndexedDB after reload'},null,2));
  console.log('S14_UI_ACCEPTANCE_PASS='+JSON.stringify({screenshots:screens.length,transactions:records.length,revision:saved.revision,verifiedAsset:hash,browser:browser.version()}));
 }finally{await browser.close()}
}
run().catch(e=>{console.error('S14_UI_ACCEPTANCE_FAIL',e.stack||e);process.exitCode=1});
