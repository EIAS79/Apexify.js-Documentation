import puppeteer from 'puppeteer-core';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH || (process.platform==='win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome'),headless:'new',args:['--no-sandbox']});
const page=await browser.newPage();
await page.setViewport({width:1500,height:980});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
function check(ok,message){if(!ok)throw Error(message)}
async function getBox(){
 return page.evaluate(()=>{
  const field=label=>[...document.querySelectorAll('.apx-text-v3-field')].find(x=>x.querySelector('span')?.textContent?.trim()===label);
  const width=field('Max width')?.querySelector('input');
  const height=field('Max height')?.querySelector('input');
  const fit=document.querySelector('[data-text-box-fit-status]')?.textContent?.trim();
  const node=document.querySelector('.apx-pre4-node[data-kind="text"][data-selected="true"]');
  const rect=node?.getBoundingClientRect();
  return {width:width?Number(width.value):null,height:height?Number(height.value):null,fit,rect:rect&&{x:rect.x,y:rect.y,width:rect.width,height:rect.height}};
 });
}
try{
 const response=await page.goto((process.env.STUDIO_VISUAL_BASE_URL || 'http://127.0.0.1:3411').replace(/\/$/,'')+'/studio',{waitUntil:'networkidle2',timeout:80000});
 check(response?.status()===200,'Studio status '+response?.status());
 await page.waitForSelector('[data-studio-shell]');
 if((await page.$eval('[data-studio-shell]',n=>n.getAttribute('data-studio-mode')))!=='visual')
   await page.click('[data-studio-code-panel]:not([hidden]) [data-studio-mode-tab="visual"]');
 await page.waitForSelector('[data-studio-visual-workspace][data-active="true"]');
 await page.click('[data-feature-tool="text"]');
 await page.waitForSelector('[data-text-insert]');
 await page.click('[data-text-insert]');
 await page.waitForSelector('[data-text-v3-inspector]');
 await page.click('[data-inspector-tab="data"]');
 await page.waitForSelector('[data-text-content-editor]');
 await page.$eval('[data-text-content-editor]',(el)=>{
   const text='Preview could not render Invalid Apexify Studio Visual Project: document nodes text must be a non-empty string. Width must reflow this word sequence into the bounding rectangle.';
   Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,text);
   el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.click('[data-inspector-tab="style"]');
 await page.waitForSelector('[data-text-box-fit-status]');
 const original=await getBox();
 check(original.width>100 && original.height>40,'Initial size missing '+JSON.stringify(original));
 console.log('INITIAL_BOX',JSON.stringify(original));
 const east=await page.$('.apx-pre4-node[data-kind="text"] [aria-label="Resize e"]');
 check(east,'East resize handle missing');
 let box=await east.boundingBox();check(box,'No east bounds');
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.mouse.down();
 await page.mouse.move(box.x+box.width/2+175,box.y+box.height/2,{steps:10});
 await page.mouse.up();
 await new Promise(r=>setTimeout(r,600));
 const wider=await getBox();
 console.log('WIDER_BOX',JSON.stringify(wider));
 check(wider.width>original.width+50,'Width did not follow dragged edge');
 check(wider.height===original.height,'Height changed during east resize');
 check(wider.fit?.includes('rendered font'),'Fitted line info missing');
 const south=await page.$('.apx-pre4-node[data-kind="text"] [aria-label="Resize s"]');
 check(south,'South resize handle missing');
 box=await south.boundingBox();check(box,'No south bounds');
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.mouse.down();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2-52,{steps:10});
 await page.mouse.up();
 await new Promise(r=>setTimeout(r,500));
 const shorter=await getBox();
 console.log('SHORTER_BOX',JSON.stringify(shorter));
 check(shorter.height<wider.height-20,'Height did not update when handle moved');
 check(shorter.width===wider.width,'Width changed during south resize');
 // Numeric Max width updates the same transform (and therefore the blue box).
 const target=await page.$('[data-text-v3-section="layout"] .apx-text-v3-field:nth-child(4) input');
 check(target,'Max width number input missing');
 await target.click({clickCount:3});
 await page.keyboard.down('Control');
 await page.keyboard.press('KeyA');
 await page.keyboard.up('Control');
 await target.type('260');
 await target.press('Tab');
 await new Promise(r=>setTimeout(r,500));
 const manual=await getBox();
 console.log('NUMERIC_BOX',JSON.stringify(manual));
 check(Math.abs(manual.width-260)<1,'Manual width did not change blue rectangle');
 if(errors.length)throw Error('Browser errors '+JSON.stringify(errors));
 console.log('TEXT_BOX_BROWSER_RESIZE_PASS');
}finally{await browser.close()}
