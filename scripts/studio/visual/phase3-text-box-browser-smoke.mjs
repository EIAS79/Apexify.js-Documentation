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
  const font=field('Size')?.querySelector('input');
  const node=document.querySelector('.apx-pre4-node[data-kind="text"][data-selected="true"]');
  const rect=node?.getBoundingClientRect();
  const board=document.querySelector('[data-artboard-surface]');
  const bounds=board?.getBoundingClientRect();
  const preview=document.querySelector('[data-authoritative-apexify-frame]');
  const textZ=node?Number.parseInt(getComputedStyle(node).zIndex,10):null;
  const previewZ=preview?Number.parseInt(getComputedStyle(preview).zIndex,10):null;
  const otherLayers=[...document.querySelectorAll('.apx-pre4-node')]
    .filter(item=>item!==node).map(item=>Number.parseInt(getComputedStyle(item).zIndex,10)||0);
  const borderHit=rect && document.elementFromPoint(rect.x+1.25,rect.y+Math.min(20,rect.height/2))?.closest('[data-visual-node]')===node;
  return {width:width?Number(width.value):null,height:height?Number(height.value):null,fontSize:font?Number(font.value):null,fit,overflow:Boolean(document.querySelector('[data-text-overflow="true"]')),
    boardWidth:board ? (Number.parseFloat(board.style.width) || board.clientWidth) : null,rect:rect&&{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
    board:bounds&&{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height},textZ,previewZ,maxOtherLayerZ:Math.max(0,...otherLayers),borderHit};

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
 check(original.textZ>original.previewZ,'Text selection border is stacked behind Apexify preview image');
 check(original.textZ>original.maxOtherLayerZ,'Selected text outline is behind another image or layer overlay');
 check(original.borderHit,'Text selection outline is not the hit-test top layer');
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
 check(wider.fit?.includes('Wrap only'),'Wrap-only status missing');
 check(wider.fontSize===original.fontSize,'Resizing the width must not scale font size');
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
 check(shorter.fontSize===original.fontSize,'Changing box height must not change font size');
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
 check(manual.fontSize===original.fontSize,'Typing max width unexpectedly changed the font size');
 const fontHandle=await page.evaluateHandle(()=>{
   const field=[...document.querySelectorAll('.apx-text-v3-field')].find(n=>n.querySelector('span')?.textContent?.trim()==='Size');
   return field?.querySelector('input')??null;
 });
 const fontInput=fontHandle.asElement();
 check(fontInput,'Font size number field is missing');
 await fontInput.click({clickCount:3});
 await page.keyboard.down('Control');
 await page.keyboard.press('KeyA');
 await page.keyboard.up('Control');
 await fontInput.type('102.1');
 await fontInput.press('Tab');
 await new Promise(r=>setTimeout(r,500));
 const resizedFont=await getBox();
 console.log('FONT_SIZE_DIRECT',JSON.stringify(resizedFont));
 check(Math.abs(resizedFont.fontSize-102.1)<0.01,'Font Size input was not updated to 102.1px');
 check(resizedFont.width===260,'Changing font size modified max width');
 check(resizedFont.fit?.includes('font 102.1px'),'Font size is not authoritative in the inspector');
 check(resizedFont.overflow,'Large font in a small box must show an explicit overflow warning');
 // Text boxes are allowed to extend beyond canvas bounds; only the
 // selection chrome must render above the artboard and image overlay.
 const widthSelector='[data-text-v3-section="layout"] .apx-text-v3-field:nth-child(4) input';
 const again=await page.$(widthSelector);
 await again.click({clickCount:3});
 await page.keyboard.down('Control');
 await page.keyboard.press('KeyA');
 await page.keyboard.up('Control');
 await again.type('5000');
 await again.press('Tab');
 await new Promise(r=>setTimeout(r,450));
 const oversized=await getBox();
 console.log('CANVAS_OVERFLOW_ALLOWED',JSON.stringify(oversized));
 check(oversized.width===5000,'Max width must not be clamped to canvas');
 check(oversized.rect.width>oversized.board.width,'Text selection rectangle was visually clamped');
 check(oversized.fontSize===102.1,'Editing box width changed glyph size');
 check(oversized.textZ>oversized.previewZ && oversized.textZ>oversized.maxOtherLayerZ,
   'Selected text should remain above preview and other overlay layers');
 // Drag beyond the artboard and preserve the off-canvas authoring position.
 const rect=oversized.rect;
 await page.mouse.move(rect.x+Math.min(rect.width/2,70),rect.y+Math.min(rect.height/2,22));
 await page.mouse.down();
 await page.mouse.move(rect.x-1100,rect.y-900,{steps:8});
 await page.mouse.up();
 await new Promise(r=>setTimeout(r,450));
 const moved=await getBox();
 console.log('OFF_CANVAS_POSITION_ALLOWED',JSON.stringify(moved));
 check(moved.rect.x<moved.board.x || moved.rect.y<moved.board.y,
   'Text was incorrectly clamped inside the artboard');
 check(moved.textZ>moved.previewZ,'Off-canvas text selection border fell behind the frame');
 if(errors.length)throw Error('Browser errors '+JSON.stringify(errors));
 console.log('TEXT_BOX_BROWSER_RESIZE_PASS');
}finally{await browser.close()}
