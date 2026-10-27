const path=require('node:path'),fs=require('node:fs/promises');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only','node_modules','playwright-core'));
const origin=process.env.S12_BROWSER_URL||'http://127.0.0.1:38494/workspace';
const logDir=process.env.S12_EVIDENCE_DIR||'D:/ApexifySupervisor5LocalBuildArtifacts';
async function main(){
const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const ctx=await b.newContext({viewport:{width:1700,height:1050}}), page=await ctx.newPage();
const failures=[],records=[],pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
async function state(){return page.evaluate(async()=>{
const db=await new Promise((yes,no)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});
try{const tx=db.transaction('projects','readonly'),q=tx.objectStore('projects').get('active-project');return await new Promise((yes,no)=>{q.onsuccess=()=>yes(q.result);q.onerror=()=>no(q.error)});}
finally{db.close()}
})}
async function painted(){return page.evaluate(async()=>{const a=document.querySelector('.aw-node-output img'),i=document.querySelector('.aw-visual .aw-render-image');
if(!i?.complete||!i.naturalWidth||!a?.complete||!a.naturalWidth||i.currentSrc!==a.currentSrc)return null;
const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);
const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels)),x=>x.toString(16).padStart(2,'0')).join('');
})}
async function waitState(fn,name){const t=Date.now();while(Date.now()-t<16000){const s=await state();if(s&&fn(s))return s;await page.waitForTimeout(60)}throw Error(name+' did not persist')}
async function waitPaint(before,name){const t=Date.now();while(Date.now()-t<20000){const hash=await painted();if(hash&&hash!==before)return hash;await page.waitForTimeout(130)}throw Error(name+' output pixel hash unchanged')}
async function init(){
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:35000});
 await page.getByRole('button',{name:'New Project'}).click();
 await waitState(x=>x.document?.width===1280,'new project');
 await page.waitForFunction(()=>document.querySelector('.aw-visual .aw-render-image')?.naturalWidth>0,null,{timeout:28000});
 await page.locator('.aw-graph-semantic-properties > summary').click();
}
async function attempt(pathId,label,value,property,options={}){
 const beforeState=await state(),beforeHash=await painted();
 if(!beforeHash)throw Error('No baseline image for '+pathId);
 try{
  const field=options.group?page.getByRole('group',{name:options.group}).getByLabel(label,{exact:true}):page.getByLabel(label,{exact:true});
  if(options.select)await field.selectOption(value);
  else if(options.check)await field.check();
  else if(options.color)await field.fill(value);
  else await field.fill(String(value));
  const saved=await waitState(s=>s.revision>beforeState.revision&&property(s.document.canvasExtras??{},s.document),pathId);
  const afterHash=options.paint===false?await painted():await waitPaint(beforeHash,pathId);
  if(options.undo){
   await page.getByLabel('Undo',{exact:true}).click();
   await waitState(x=>x.revision>saved.revision&&property(x.document.canvasExtras??{},x.document)===false,'undo '+pathId);
   await page.getByLabel('Redo',{exact:true}).click();
   await waitState(x=>x.revision>saved.revision&&property(x.document.canvasExtras??{},x.document),'redo '+pathId);
  }
  records.push({path:pathId,value,beforeHash,afterHash,revision:saved.revision,passed:true,undo:!!options.undo});
  console.log('PATH_BROWSER_PASS',pathId,JSON.stringify({revision:saved.revision,changed:beforeHash!==afterHash}));
 }catch(error){
  records.push({path:pathId,value,passed:false,reason:String(error.message)});
  failures.push(pathId+': '+error.message);
  console.log('PATH_BROWSER_FAIL',pathId,String(error.message));
 }
}
try{
await init();
await page.getByLabel('Canvas graph background gradient').selectOption('linear');
await waitState(x=>x.document.canvasExtras?.gradientBg?.type==='linear','linear background');
const gField=(key,label,val,options)=>attempt('canvas.gradientBg.'+key,'Graph root '+label,val,x=>x.gradientBg?.[key]===val,options);
await gField('endX','end X',900,{undo:true});
await gField('startX','start X',80,{undo:true});
await gField('startY','start Y',120);
await gField('endY','end Y',270);
await gField('rotate','rotation',35,{undo:true});
await gField('pivotX','pivot X',120);
await gField('pivotY','pivot Y',90);
await attempt('canvas.gradientBg.colors.stop','Graph root stop 2',0.75,x=>x.gradientBg?.colors?.some(c=>c.stop===0.75),{undo:true});
await attempt('canvas.gradientBg.colors.color','Graph root stop color 1','#ff2255',x=>x.gradientBg?.colors?.[0]?.color==='#ff2255',{color:true});
await page.getByLabel('Canvas graph background gradient').selectOption('radial');
await waitState(x=>x.document.canvasExtras?.gradientBg?.type==='radial','radial background');
await gField('endRadius','end radius',300);
await gField('startRadius','start radius',60);
await page.getByLabel('Canvas graph background gradient').selectOption('conic');
await waitState(x=>x.document.canvasExtras?.gradientBg?.type==='conic','conic background');
await gField('centerX','center X',240,{undo:true});
await gField('centerY','center Y',210);
await attempt('canvas.zoom.scale','Graph zoom scale',1.6,x=>x.zoom?.scale===1.6,{undo:true});
await attempt('canvas.zoom.centerX','Graph zoom center X',330,x=>x.zoom?.centerX===330);
await attempt('canvas.zoom.centerY','Graph zoom center Y',300,x=>x.zoom?.centerY===300);
await page.getByLabel('Canvas pattern type').selectOption('grid');
await waitState(x=>x.document.canvasExtras?.patternBg?.type==='grid','pattern background');
const pField=(key,label,val,opts)=>attempt('canvas.patternBg.'+key,'Graph root '+label,val,x=>x.patternBg?.[key]===val,opts);
await pField('size','size',35,{undo:true});
await pField('spacing','spacing',53);
await pField('opacity','opacity',0.8);
await pField('rotation','rotation',30,{group:'Graph root pattern properties'});
await pField('scale','scale',1.3);
await pField('offsetX','offset X',55);
await pField('offsetY','offset Y',35);
await pField('color','primary color','#e12b43',{color:true});
await pField('secondaryColor','secondary color','#15bd80',{color:true});
await attempt('canvas.patternBg.type','Graph root type','dots',x=>x.patternBg?.type==='dots',{select:true,undo:true});
await page.getByLabel('Graph stroke enabled').check();
await waitState(x=>x.document.canvasExtras?.stroke,'stroke enabled');
await attempt('canvas.stroke.width','Graph stroke width',26,x=>x.stroke?.width===26);
await attempt('canvas.stroke.opacity','Graph stroke opacity',0.4,x=>x.stroke?.opacity===0.4);
await attempt('canvas.stroke.style','Graph stroke style','dashed',x=>x.stroke?.style==='dashed',{select:true,undo:true});
await attempt('canvas.stroke.blur','Graph stroke blur',8,x=>x.stroke?.blur===8);
await attempt('canvas.stroke.position','Graph stroke position',12,x=>x.stroke?.position===12);
await page.reload({waitUntil:'domcontentloaded'});
await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:30000});
const end=await state();
await page.waitForFunction(()=>document.querySelector('.aw-visual .aw-render-image')?.naturalWidth>0,null,{timeout:24000});
const finalHash=await painted();
console.log('PATH_BROWSER_FINAL_RELOAD',JSON.stringify({revision:end.revision,gradient:end.document.canvasExtras?.gradientBg?.type,pattern:end.document.canvasExtras?.patternBg?.type,stroke:end.document.canvasExtras?.stroke?.style,hash:finalHash,errors:pageErrors}));
await page.screenshot({path:path.join(logDir,'supervisor12_parameterized_canvas_browser.png')});
}finally{await b.close()}
await fs.writeFile(path.join(logDir,'supervisor12_canvas_path_browser_matrix.json'),JSON.stringify({records,failures,pageErrors},null,2));
console.log('PATH_MATRIX_SUMMARY='+JSON.stringify({tested:records.length,passed:records.filter(x=>x.passed).length,failed:failures.length,pageErrors}));
if(failures.length||pageErrors.length)process.exitCode=1;
}
main().catch(e=>{console.error('PATH_MATRIX_FATAL',e.stack);process.exitCode=1});