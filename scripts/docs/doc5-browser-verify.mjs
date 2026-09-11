import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require=createRequire(import.meta.url);
const axeSource=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const base=process.env.DOC5_BASE_URL||'http://127.0.0.1:3000';
const chrome=process.env.CHROME_PATH;
if(!chrome)throw new Error('[doc5-browser] CHROME_PATH required');
const out=path.join(process.cwd(),'generated','docs-doc5','runtime');
fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage']});
const states=[
  {name:'desktop-light',w:1440,h:1000,theme:'light'},
  {name:'tablet-dark',w:900,h:1000,theme:'dark'},
  {name:'mobile-light',w:390,h:844,theme:'light'},
  {name:'narrow-dark',w:320,h:760,theme:'dark'},
  {name:'reduced-dark',w:1440,h:1000,theme:'dark',reduced:true},
];
const results=[];

async function installClipboard(page){
  await page.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async text=>{window.__doc5Clipboard=String(text);},
    readText:async()=>window.__doc5Clipboard||'',
  }}));
}
function expectedLocalMiss(row){
  const u=new URL(row.url);
  return row.status===404&&u.origin===new URL(base).origin&&(u.pathname==='/favicon.ico'||u.pathname==='/_vercel/speed-insights/script.js');
}

try{
  for(const s of states){
    const page=await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setViewport({width:s.w,height:s.h});
    await page.evaluateOnNewDocument(theme=>localStorage.setItem('apexify-theme',theme),s.theme);
    await installClipboard(page);
    if(s.reduced)await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    const consoleErrors=[];const pageErrors=[];const httpErrors=[];
    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)httpErrors.push({status:response.status(),url:response.url()});});
    const response=await page.goto(`${base}/examples/node.canvas.basic`,{waitUntil:'networkidle2'});
    if(!response||response.status()!==200)throw new Error(`${s.name} example status ${response?.status()}`);
    const canonical=await page.$eval('link[rel="canonical"]',element=>element.href);
    if(canonical!==`https://apexifyjs.vercel.app/examples/node.canvas.basic`)throw new Error(`${s.name} canonical mismatch: ${canonical}`);
    const verification=await page.$eval('[data-doc5-example]',element=>element.getAttribute('data-verification'));
    if(verification!=='verified')throw new Error(`${s.name} verification marker ${verification}`);
    if(!(await page.$('[data-doc5-component="CodePreview"]')))throw new Error(`${s.name} CodePreview missing`);
    if(!(await page.$('img[src*="example-outputs/node.canvas.basic"]')))throw new Error(`${s.name} verified output missing`);
    await page.addScriptTag({content:axeSource});
    const axe=await page.evaluate(async()=>{const result=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}));});
    if(axe.length)throw new Error(`${s.name} axe ${JSON.stringify(axe)}`);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    if(overflow)throw new Error(`${s.name} horizontal overflow`);
    let reducedMotionOk=true;
    if(s.reduced){
      reducedMotionOk=await page.evaluate(()=>[...document.querySelectorAll('.apx-doc5-example *')].every(element=>{
        const style=getComputedStyle(element);
        const transitions=style.transitionDuration.split(',').map(value=>parseFloat(value)||0);
        const animations=style.animationDuration.split(',').map(value=>parseFloat(value)||0);
        return Math.max(...transitions,0)<=0.01&&Math.max(...animations,0)<=0.01;
      }));
      if(!reducedMotionOk)throw new Error(`${s.name} reduced-motion override not applied`);
    }
    const unexpectedHttp=httpErrors.filter(row=>!expectedLocalMiss(row));
    const onlyExpectedLocal404s=httpErrors.length>0&&unexpectedHttp.length===0&&httpErrors.every(expectedLocalMiss);
    const unexpectedConsole=consoleErrors.filter(message=>!(onlyExpectedLocal404s&&message.includes('404')));
    if(unexpectedHttp.length||unexpectedConsole.length||pageErrors.length)throw new Error(`${s.name} browser errors ${JSON.stringify({unexpectedHttp,unexpectedConsole,pageErrors})}`);
    results.push({name:s.name,status:200,canonical,axeViolations:axe,horizontalOverflow:false,reducedMotionOk,expectedResourceMisses:httpErrors.filter(expectedLocalMiss)});
    await page.close();
  }

  const interaction=await browser.newPage();
  await interaction.setCacheEnabled(false);
  await interaction.setViewport({width:1200,height:900});
  await installClipboard(interaction);

  await interaction.goto(`${base}/examples/node.canvas.basic`,{waitUntil:'networkidle2'});
  const copyButton=await interaction.$('[data-doc5-component="CodePreview"] button[aria-label="Copy code"]');
  if(!copyButton)throw new Error('CodePreview copy control missing');
  await copyButton.focus();
  await interaction.keyboard.press('Enter');
  await interaction.waitForFunction(()=>document.querySelector('[data-doc5-component="CodePreview"] button[aria-label="Code copied"]')!==null);
  const copied=await interaction.evaluate(()=>window.__doc5Clipboard||'');
  if(!copied.includes('ApexPainter')||!copied.includes('createCanvas'))throw new Error('keyboard code copy did not copy authoritative source');

  await interaction.goto(`${base}/examples/node.integration.report`,{waitUntil:'networkidle2'});
  const tabs=await interaction.$$('[data-doc5-component="CodePreview"] [role="tab"]');
  if(tabs.length<2)throw new Error('multi-file CodePreview tabs missing');
  await tabs[0].focus();
  await interaction.keyboard.press('ArrowRight');
  const selectedTab=await interaction.$eval('[data-doc5-component="CodePreview"] [role="tab"][aria-selected="true"]',element=>element.textContent?.trim()||'');
  if(!selectedTab.includes('report-data'))throw new Error(`CodePreview keyboard tab switch failed: ${selectedTab}`);

  await interaction.goto(`${base}/examples/node.gif.basic`,{waitUntil:'networkidle2'});
  const summary=await interaction.$('.apx-doc5-animation summary');
  if(!summary)throw new Error('GIF user-controlled disclosure missing');
  await summary.focus();
  await interaction.keyboard.press('Enter');
  if(!(await interaction.$eval('.apx-doc5-animation',element=>element.hasAttribute('open'))))throw new Error('GIF disclosure keyboard toggle failed');

  await interaction.goto(`${base}/docs/node/canvas`,{waitUntil:'networkidle2'});
  if(!(await interaction.$('[data-doc5-example="node.canvas.basic"]')))throw new Error('docs stable-ID executable example missing');

  await interaction.goto(`${base}/gallery#${encodeURIComponent('node.canvas.basic+advance')}`,{waitUntil:'networkidle2'});
  await interaction.waitForSelector('#gallery-modal-title');
  if(!(await interaction.$('#gallery-modal-about a[href="/examples/node.canvas.basic"]')))throw new Error('Gallery return link to canonical example missing');

  await interaction.goto(`${base}/api-reference/apexify.js/ApexPainter/createCanvas`,{waitUntil:'networkidle2'});
  if(!(await interaction.$('[data-doc5-api-examples] a[href="/examples/node.canvas.basic"]')))throw new Error('API reverse example linkage missing');

  const unknown=await interaction.goto(`${base}/examples/node.missing.example`,{waitUntil:'networkidle2'});
  if(!unknown||unknown.status()!==404)throw new Error(`unknown example expected 404 got ${unknown?.status()}`);
  await interaction.close();
}finally{
  await browser.close();
}

const evidence={schemaVersion:1,phase:'DOC-5',states:results,keyboard:{copy:true,multiFileTabs:true,gifDisclosure:true},docsLinkage:true,galleryLinkage:true,apiLinkage:true,unknown404:true};
fs.writeFileSync(path.join(out,'browser.json'),`${JSON.stringify(evidence,null,2)}\n`);
console.log('[doc5-browser] PASS',JSON.stringify(evidence));
