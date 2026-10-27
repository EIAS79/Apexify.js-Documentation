const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.TEMP,'apexify-s4-browser-test-only/node_modules/playwright-core'));
const origin=process.env.S13_URL||'http://127.0.0.1:38495/workspace';
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function model(){return page.evaluate(async()=>{const db=await new Promise((res,rej)=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});try{const q=db.transaction('projects','readonly').objectStore('projects').get('active-project');return await new Promise((res,rej)=>{q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}finally{db.close()}})}
 async function until(test,what){let rec;const start=Date.now();while(Date.now()-start<14000){rec=await model();if(rec&&test(rec))return rec;await page.waitForTimeout(60)}throw Error(what+' did not persist')}
 async function pixels(){return page.evaluate(async()=>{const img=document.querySelector('.aw-visual .aw-render-image');if(!img?.complete||!img.naturalWidth)return null;const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('')})}
 async function image(){const t=Date.now();while(Date.now()-t<18000){const p=await pixels();if(p)return p;await page.waitForTimeout(120)}throw Error('visual missing')}
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:35000});
  await page.getByRole('button',{name:'New Project'}).click();
  await until(x=>x.document?.width===1280,'New Project');
  await page.getByLabel('Canvas graph background gradient').selectOption('linear');
  await until(x=>x.document?.canvasExtras?.gradientBg?.type==='linear','gradient');
  await page.locator('.aw-graph-semantic-properties > summary').click();
  const group=page.getByRole('group',{name:'Graph root gradient properties'});
  await group.getByLabel('Graph root end X').fill('120');
  await until(x=>x.document?.canvasExtras?.gradientBg?.endX===120,'narrow endX');
  await page.waitForTimeout(1800);
  const select=group.getByLabel('Graph root gradient repeat');
  assert.equal(await select.locator('option').count(),3);
  const hashes=[];
  const changed=async(before,label)=>{const t=Date.now();while(Date.now()-t<18000){const hash=await pixels();if(hash&&hash!==before)return hash;await page.waitForTimeout(150)}throw Error(label+' did not update rendered pixels')};
  for(const repeat of ['no-repeat','repeat','reflect']){
   const old=await model();
   await select.selectOption(repeat);
   const x=await until(x=>x.revision>old.revision&&x.document.canvasExtras?.gradientBg?.repeat===repeat,'gradient repeat '+repeat);
   hashes.push({repeat,hash:repeat==='no-repeat'?await image():await changed(hashes[hashes.length-1].hash,repeat),revision:x.revision});
    await page.waitForTimeout(1600);
    hashes[hashes.length-1].hash=await image();
  }
  console.log('GRADIENT_REPEAT_HASHES',JSON.stringify(hashes));
  assert.equal(new Set(hashes.map(x=>x.hash)).size,3,'Root gradient modes should visually differ');
  await page.getByLabel('Undo',{exact:true}).click();
  await until(x=>x.document.canvasExtras?.gradientBg?.repeat==='repeat','Undo repeat');
  await page.getByLabel('Redo',{exact:true}).click();
  await until(x=>x.document.canvasExtras?.gradientBg?.repeat==='reflect','Redo reflect');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.aw-app[aria-busy="false"]').waitFor({timeout:35000});
  assert.equal((await model()).document.canvasExtras.gradientBg.repeat,'reflect');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'D:/ApexifySupervisor5LocalBuildArtifacts/supervisor13_gradient_repeat_chromium.png'});
  await fs.writeFile('D:/ApexifySupervisor5LocalBuildArtifacts/supervisor13_gradient_repeat_browser.json',JSON.stringify({hashes,errors},null,2));
  console.log('S13_GRADIENT_REPEAT_BROWSER_PASS='+JSON.stringify(hashes));
 }finally{await browser.close()}
}
main().catch(e=>{console.error('S13_GRADIENT_REPEAT_BROWSER_FAIL',e.stack||e);process.exitCode=1});