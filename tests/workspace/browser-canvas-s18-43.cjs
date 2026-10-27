const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const sharp=require(path.join(process.env.TEMP,'apexify-supervisor12-isolated-fullsource/node_modules/sharp'));
const base='D:/ApexifyCanvasS15IntegrationAudit_764cd972_20261022/S18',dest=path.join(base,'chromium');
(async()=>{
 await fs.mkdir(dest,{recursive:true});
 const inventory=JSON.parse(await fs.readFile(path.join(process.env.TEMP,'apexify-workspace-checkpoint-20261019-git-sparse/docs/workspace/CREATE_CANVAS_STRICT_CERTIFICATION_S17.json'),'utf8')).paths.filter(x=>x.readinessS17==='WORKSPACE_READY'&&x.strictStatus==='PARTIAL_CERTIFICATION');
 assert.equal(inventory.length,43);
 const wanted=new Set(inventory.map(x=>x.optionPath)),passed={},failed=[],errors=[];
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1850,height:1180},acceptDownloads:true});
 page.on('pageerror',e=>errors.push(e.message));
 async function state(){return page.evaluate(async()=>{const db=await new Promise((ok,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});try{const q=db.transaction('projects','readonly').objectStore('projects').get('active-project');return await new Promise((ok,no)=>{q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})}finally{db.close()}})}
 async function wait(f,name,ms=24000){const t=Date.now();let s;while(Date.now()-t<ms){s=await state();if(s&&f(s))return s;await page.waitForTimeout(100)}throw Error('No saved project for '+name+': '+JSON.stringify(s?.document?.canvasExtras).slice(0,330))}
 async function raster(){return page.evaluate(async()=>{const img=document.querySelector('.aw-visual .aw-render-image');if(!img||!img.complete||!img.naturalWidth)return null;const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);const raw=c.getContext('2d').getImageData(0,0,c.width,c.height).data;const hash=await crypto.subtle.digest('SHA-256',raw);return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('')})}
 async function record(ids,act,check){ids=Array.isArray(ids)?ids:[ids];try{const before=await state(),prev=await raster();await act();const after=await wait(s=>s.revision>before.revision&&check(s.document),ids.join(','));await page.waitForTimeout(150);const next=await raster();
  for(const id of ids){assert.ok(wanted.has(id),'Unexpected audit path '+id);passed[id]={revision:after.revision,nativeImageHashBefore:prev,nativeImageHashAfter:next,changed:prev!==next};}
  console.log('S18_CHROME_CERT_PASS='+ids.join(';'));
 }catch(e){for(const id of ids){failed.push({path:id,error:String(e.stack||e).slice(0,700)});}console.log('S18_CHROME_CERT_FAIL='+ids.join(';')+' :: '+String(e.message).slice(0,170));}}
 const choose=(label,val)=>page.getByLabel(label,{exact:true}).selectOption(val);
 const fill=(label,val)=>page.getByLabel(label,{exact:true}).fill(String(val));
 const toggle=(label)=>page.getByLabel(label,{exact:true}).check();
 async function img(kind){const w=48,h=32,r=Buffer.alloc(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;r[i]=(x*5+kind*47)%255;r[i+1]=(y*6+kind*58)%255;r[i+2]=(x*3+y*2+kind*31)%255;r[i+3]=255}const fmt=kind===0?'png':kind===1?'webp':'jpeg';const data=await sharp(r,{raw:{width:w,height:h,channels:4}})[fmt]().toBuffer();return {name:'S18-'+kind+'.'+fmt,mimeType:fmt==='jpeg'?'image/jpeg':'image/'+fmt,buffer:data,sha:crypto.createHash('sha256').update(data).digest('hex')}}
 const pictures=await Promise.all([img(0),img(1),img(2)]);
 try{
 await page.goto('http://127.0.0.1:38496/workspace',{waitUntil:'domcontentloaded',timeout:65000});
 await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:55000});
 await page.getByRole('button',{name:'New Project'}).click();await wait(s=>s.document?.width===1280,'new');
 await record('canvas.width',()=>fill('Width',1120),d=>d.width===1120);
 await record('canvas.height',()=>fill('Height',680),d=>d.height===680);
 await record('canvas.x',()=>fill('Canvas X',38),d=>d.canvasExtras?.x===38);
 await record('canvas.y',()=>fill('Canvas Y',24),d=>d.canvasExtras?.y===24);
 await record('canvas.blur',()=>fill('Blur',6),d=>d.canvasExtras?.blur===6);
 await record('canvas.borderRadius',()=>fill('Border radius',44),d=>d.canvasExtras?.borderRadius===44);
 await record('canvas.borderPosition',()=>choose('Canvas border position','top'),d=>d.canvasExtras?.borderPosition==='top');
 await record('canvas.rotation',()=>fill('Rotation',26),d=>d.canvasExtras?.rotation===26);
 await record('canvas.zoom',()=>fill('Zoom scale',1.5),d=>d.canvasExtras?.zoom?.scale===1.5);
 await record('canvas.colorBg',()=>page.locator('.aw-inspector .aw-field').filter({has:page.locator('input[type=color]')}).first().locator('input[type=color]').fill('#ce3b88'),d=>d.background?.color==='#ce3b88');
 await page.screenshot({path:path.join(dest,'01_geometry_and_root.png'),animations:'disabled'});
 await record('canvas.gradientBg',()=>choose('Canvas gradient type','linear'),d=>d.canvasExtras?.gradientBg?.type==='linear');
 await record('canvas.gradientBg.colors',()=>page.getByLabel('Root stop color 1',{exact:true}).fill('#eaa54d'),d=>d.canvasExtras?.gradientBg?.colors?.[0]?.color==='#eaa54d');
 await record('canvas.gradientBg.repeat',()=>choose('Root gradient repeat','reflect'),d=>d.canvasExtras?.gradientBg?.repeat==='reflect');
 await record('canvas.patternBg',()=>choose('Canvas pattern type','grid'),d=>d.canvasExtras?.patternBg?.type==='grid');
 await page.screenshot({path:path.join(dest,'02_gradients_patterns.png'),animations:'disabled'});
 await record('canvas.stroke',()=>toggle('Canvas stroke enabled'),d=>!!d.canvasExtras?.stroke);
 await record('canvas.stroke.color',()=>page.getByLabel('Canvas stroke color',{exact:true}).fill('#ff5bb9'),d=>d.canvasExtras?.stroke?.color==='#ff5bb9');
 await record('canvas.stroke.borderRadius',()=>fill('Canvas stroke radius',32),d=>d.canvasExtras?.stroke?.borderRadius===32);
 await record('canvas.shadow',()=>toggle('Canvas shadow enabled'),d=>!!d.canvasExtras?.shadow);
 await record('canvas.shadow.color',()=>page.getByLabel('Canvas shadow color',{exact:true}).fill('#69e4ba'),d=>d.canvasExtras?.shadow?.color==='#69e4ba');
 await record('canvas.shadow.blur',()=>fill('Canvas shadow blur',13),d=>d.canvasExtras?.shadow?.blur===13);
 await record('canvas.shadow.offsetX',()=>fill('Canvas shadow X',33),d=>d.canvasExtras?.shadow?.offsetX===33);
 await record('canvas.shadow.offsetY',()=>fill('Canvas shadow Y',24),d=>d.canvasExtras?.shadow?.offsetY===24);
 await record('canvas.shadow.opacity',()=>fill('Canvas shadow opacity',0.6),d=>d.canvasExtras?.shadow?.opacity===0.6);
 await page.screenshot({path:path.join(dest,'03_stroke_shadow.png'),animations:'disabled'});
 await record(['canvas.customBg','canvas.customBg.source'],()=>page.getByLabel('Import canvas background image').setInputFiles(pictures[0]),d=>d.canvasExtras?.customBg?.source==='asset:'+pictures[0].sha);
 await record('canvas.customBg.inherit',()=>toggle('Imported image intrinsic dimensions'),d=>d.canvasExtras?.customBg?.inherit===true);
 await page.getByLabel('Imported image intrinsic dimensions').uncheck();await wait(s=>s.document?.canvasExtras?.customBg?.inherit===false,'intrinsic false');
 await record('canvas.customBg.source',()=>page.getByLabel('Import canvas background image').setInputFiles(pictures[1]),d=>d.canvasExtras?.customBg?.source==='asset:'+pictures[1].sha);
 await record('canvas.patternBg.customPatternImage',()=>page.getByLabel('Import canvas pattern image').setInputFiles(pictures[2]),d=>d.canvasExtras?.patternBg?.type==='custom'&&d.canvasExtras?.patternBg?.customPatternImage==='asset:'+pictures[2].sha);
 await page.screenshot({path:path.join(dest,'04_verified_assets_webp_pattern.png'),animations:'disabled'});
 await record('canvas.bgLayers',()=>page.getByRole('button',{name:'Add color layer'}).click(),d=>d.canvasExtras?.bgLayers?.length>=1);
 await record('canvas.bgLayers.value',()=>page.getByLabel('Layer 1 color').fill('#8f31cb'),d=>d.canvasExtras?.bgLayers?.[0]?.value==='#8f31cb');
 await record('canvas.bgLayers.type',()=>choose('Background layer 1 type','gradient'),d=>d.canvasExtras?.bgLayers?.[0]?.type==='gradient');
 await record('canvas.bgLayers.source',()=>page.getByLabel('Import canvas image background layer').setInputFiles(pictures[1]),d=>d.canvasExtras?.bgLayers?.some(l=>l.type==='image'&&l.source==='asset:'+pictures[1].sha));
 await record('canvas.bgLayers.repeat',()=>page.getByRole('button',{name:'Add imported tile layer'}).click(),d=>d.canvasExtras?.bgLayers?.some(l=>l.type==='pattern'));
 const tileIndex=(await state()).document.canvasExtras.bgLayers.findIndex(l=>l.type==='pattern')+1;
 await record('canvas.bgLayers.repeat',()=>choose('Layer '+tileIndex+' pattern repeat','repeat-x'),d=>d.canvasExtras?.bgLayers?.[tileIndex-1]?.repeat==='repeat-x');
 await record('canvas.bgLayers.pattern',()=>page.getByRole('button',{name:'Add pattern layer'}).click(),d=>d.canvasExtras?.bgLayers?.some(l=>l.type==='presetPattern'));
 const idx=(await state()).document.canvasExtras.bgLayers.findIndex(l=>l.type==='presetPattern')+1;
 const group='Layer '+idx;
 await record('canvas.bgLayers.pattern.type',()=>choose(group+' type','dots'),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.type==='dots');
 await record('canvas.bgLayers.pattern.color',()=>page.locator('.aw-inspector').getByLabel(group+' primary color',{exact:true}).fill('#ce3491'),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.color==='#ce3491');
 await record('canvas.bgLayers.pattern.secondaryColor',()=>page.locator('.aw-inspector').getByLabel(group+' secondary color',{exact:true}).fill('#3dccb1'),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.secondaryColor==='#3dccb1');
 await record('canvas.bgLayers.pattern.size',()=>fill(group+' size',37),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.size===37);
 await record('canvas.bgLayers.pattern.spacing',()=>fill(group+' spacing',43),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.spacing===43);
 await record('canvas.bgLayers.pattern.rotation',()=>fill(group+' rotation',23),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.rotation===23);
 await record('canvas.bgLayers.pattern.scale',()=>fill(group+' scale',1.6),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.scale===1.6);
 await record('canvas.bgLayers.pattern.offsetX',()=>fill(group+' offset X',22),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.offsetX===22);
 await record('canvas.bgLayers.pattern.offsetY',()=>fill(group+' offset Y',14),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.offsetY===14);
 await record('canvas.bgLayers.pattern.customPatternImage',()=>choose(group+' type','custom'),d=>d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.type==='custom'&&!!d.canvasExtras?.bgLayers?.[idx-1]?.pattern?.customPatternImage);
 await page.screenshot({path:path.join(dest,'05_six_layer_types_and_pattern.png'),animations:'disabled'});
 await page.locator('.aw-graph-semantic-properties > summary').click();
 assert.ok((await state()).document.canvasExtras?.bgLayers?.[idx-1]?.nodeId,'stable graph ID missing');
 await page.screenshot({path:path.join(dest,'06_graph_semantic.png'),animations:'disabled'});
 const prior=await state();await page.getByLabel('Undo',{exact:true}).click();await wait(s=>s.revision>prior.revision,'Undo');
 const undo=await state();await page.getByLabel('Redo',{exact:true}).click();await wait(s=>s.revision>undo.revision,'Redo');
 const dl=page.waitForEvent('download');await page.getByLabel('Download source').click();const file=await dl;const source=await fs.readFile(await file.path(),'utf8');
 assert.ok(source.includes('ApexPainter')&&source.includes('createCanvas(')&&source.includes('bgLayers')&&source.includes('patternBg'));
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:40000});
 const reload=await state();assert.ok(reload.document.canvasExtras?.bgLayers?.length>=4);
 assert.ok(reload.document.assets.some(a=>a.mime==='image/webp'));
 assert.deepEqual(errors,[]);
 }finally{
  const missing=[...wanted].filter(x=>!passed[x]);
  const report={requested:43,passed:Object.keys(passed).length,missing,failed,passedPaths:passed,pageErrors:errors,browser:browser.version(),screenshots:6};
  await fs.writeFile(path.join(dest,'S18_CHROME_43_REPORT.json'),JSON.stringify(report,null,2));
  console.log('S18_CHROME_43_RESULT='+JSON.stringify({requested:43,passed:report.passed,missing:missing.length,failed:failed.length,errors:errors.length}));
  if(missing.length||failed.length||errors.length)process.exitCode=1;
  await browser.close();
 }
})().catch(e=>{console.error('S18_BROWSER_FATAL',e.stack||e);process.exitCode=1});
