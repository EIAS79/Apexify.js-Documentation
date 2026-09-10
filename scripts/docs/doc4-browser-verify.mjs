import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import puppeteer from 'puppeteer-core';
const require=createRequire(import.meta.url);const axeSource=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const baseUrl=process.env.DOC4_BASE_URL||'http://127.0.0.1:3000';const executablePath=process.env.CHROME_PATH;if(!executablePath)throw new Error('[doc4-browser] CHROME_PATH required');
const OUT=path.join(process.cwd(),'.doc4-runtime-evidence');fs.mkdirSync(OUT,{recursive:true});
const REP='/api-reference/apexify.js/ApexPainter/createImage';const browser=await puppeteer.launch({executablePath,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage']});
const states=[
 {name:'desktop-light',viewport:{width:1440,height:1000},theme:'light'},
 {name:'tablet-dark',viewport:{width:900,height:1000},theme:'dark'},
 {name:'mobile-light',viewport:{width:390,height:844},theme:'light'},
 {name:'narrow-dark',viewport:{width:320,height:760},theme:'dark'},
 {name:'desktop-reduced',viewport:{width:1440,height:1000},theme:'dark',reduced:true},
];
const results=[];
try{
 for(const state of states){
  const page=await browser.newPage();await page.setCacheEnabled(false);await page.setViewport(state.viewport);
  await page.evaluateOnNewDocument(theme=>localStorage.setItem('apexify-theme',theme),state.theme);
  await page.evaluateOnNewDocument(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
      writeText:async text=>{window.__doc4Clipboard=String(text);},
      readText:async()=>window.__doc4Clipboard||'',
    }});
  });
  if(state.reduced)await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  const consoleErrors=[];const pageErrors=[];const httpErrors=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)httpErrors.push({status:r.status(),url:r.url()});});
  const response=await page.goto(`${baseUrl}${REP}`,{waitUntil:'networkidle2'});if(!response||response.status()!==200)throw new Error(`${state.name} status ${response?.status()}`);
  await page.addScriptTag({content:axeSource});
  const canonical=await page.$eval('link[rel="canonical"]',e=>e.href);if(canonical!==`https://apexifyjs.vercel.app${REP}`)throw new Error(`${state.name} canonical ${canonical}`);
  const components=await page.$$eval('[data-doc4-component]',nodes=>[...new Set(nodes.map(n=>n.getAttribute('data-doc4-component')).filter(Boolean))]);
  for(const required of ['ApiMethodHeader','ApiSignature','OptionTable','OptionCard','TypeReference','TypeExplorer','ReturnValue','ErrorReference','LimitReference','RelatedApiGrid','SourceLink'])if(!components.includes(required))throw new Error(`${state.name} missing ${required}`);
  const axe=await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}));});if(axe.length)throw new Error(`${state.name} axe ${JSON.stringify(axe)}`);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);if(overflow)throw new Error(`${state.name} horizontal overflow`);
  const initialOptionCount=await page.$$eval('[data-option-path]',nodes=>nodes.length);
  await page.focus('#api-option-search');await page.keyboard.type('images.mask.mode');
  await page.waitForFunction(initial=>{const nodes=[...document.querySelectorAll('[data-option-path]')];return nodes.length>0&&nodes.length<initial&&nodes.some(n=>n.getAttribute('data-option-path')==='images.mask.mode');},{},initialOptionCount);
  const visiblePaths=await page.$$eval('[data-option-path]',nodes=>nodes.map(e=>e.getAttribute('data-option-path')).filter(Boolean));
  if(!visiblePaths.includes('images.mask.mode'))throw new Error(`${state.name} option search omitted images.mask.mode: ${visiblePaths.join(',')}`);
  if(visiblePaths.length>=initialOptionCount)throw new Error(`${state.name} option search did not narrow results`);
  await page.goto(`${baseUrl}${REP}#option-images-mask-mode`,{waitUntil:'networkidle2'});
  const deep=await page.$('#option-images-mask-mode');if(!deep)throw new Error(`${state.name} deep option missing`);
  const explorer=await page.$('[data-doc4-component="TypeExplorer"] details summary');if(!explorer)throw new Error(`${state.name} TypeExplorer summary missing`);
  await explorer.focus();const before=await explorer.evaluate(e=>e.parentElement?.hasAttribute('open'));await page.keyboard.press('Enter');const after=await explorer.evaluate(e=>e.parentElement?.hasAttribute('open'));if(before===after)throw new Error(`${state.name} TypeExplorer keyboard toggle failed`);
  const signatureText=await page.$eval('[data-doc4-component="ApiSignature"]',e=>e.getAttribute('data-signature-text')||'');
  if(!signatureText.includes('Promise<Buffer>'))throw new Error(`${state.name} canonical signature marker missing`);
  await page.click('[data-doc4-component="ApiSignature"] button[aria-label="Copy API signature"]');
  await page.waitForFunction(()=>document.querySelector('[data-doc4-component="ApiSignature"] button[aria-label="Copy API signature"]')?.getAttribute('data-copy-state')==='copied');
  const copied=await page.evaluate(()=>window.__doc4Clipboard||'');if(copied!==signatureText)throw new Error(`${state.name} signature copy failed`);
  const sourceHref=await page.$eval('[data-doc4-component="SourceLink"]',e=>e.getAttribute('href')||'');if(!sourceHref.includes('dbed9743353593eafae9a7b1c25312d7170a233b'))throw new Error(`${state.name} source link is not commit-pinned`);
  const searchResult=await page.evaluate(async()=>{const r=await fetch('/api/docs/search?q=images.mask.mode');return r.json();});
  if(!searchResult.results?.some(r=>r.href===`${REP}#option-images-mask-mode`))throw new Error(`${state.name} nested option search deep-link missing`);
  const localOrigin=new URL(baseUrl).origin;
  const isExpectedLocalResourceMiss=r=>{const u=new URL(r.url);return r.status===404&&u.origin===localOrigin&&(u.pathname==='/favicon.ico'||u.pathname==='/_vercel/speed-insights/script.js');};
  const unexpectedHttp=httpErrors.filter(r=>!isExpectedLocalResourceMiss(r));
  const onlyExpectedLocal404s=httpErrors.length>0&&unexpectedHttp.length===0&&httpErrors.every(isExpectedLocalResourceMiss);
  const unexpectedConsole=consoleErrors.filter(message=>!(onlyExpectedLocal404s&&message.includes('404')));
  if(unexpectedHttp.length||unexpectedConsole.length||pageErrors.length)throw new Error(`${state.name} browser errors ${JSON.stringify({unexpectedHttp,consoleErrors:unexpectedConsole,pageErrors})}`);
  const js=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/_next/static/')&&r.name.endsWith('.js')).reduce((n,r)=>n+(r.transferSize||0),0));
  let reducedMotionOk=true;if(state.reduced){reducedMotionOk=await page.evaluate(()=>[...document.querySelectorAll('.apx-api-root *')].every(e=>{const s=getComputedStyle(e);const ds=s.transitionDuration.split(',').map(x=>parseFloat(x)||0);const as=s.animationDuration.split(',').map(x=>parseFloat(x)||0);return Math.max(...ds,0)<=0.01&&Math.max(...as,0)<=0.01;}));if(!reducedMotionOk)throw new Error(`${state.name} reduced motion not applied`);}
  results.push({...state,status:response.status(),canonical,components,axeViolations:axe,horizontalOverflow:overflow,nestedSearchHref:`${REP}#option-images-mask-mode`,optionSearchResultCount:visiblePaths.length,transferredJsBytes:js,reducedMotionOk,expectedResourceMisses:httpErrors.filter(isExpectedLocalResourceMiss)});
  await page.close();
 }
 const overload=await browser.newPage();await overload.setCacheEnabled(false);await overload.setViewport({width:1200,height:900});const r=await overload.goto(`${baseUrl}/api-reference/apexify.js/ApexPainter/createScene`,{waitUntil:'networkidle2'});if(!r||r.status()!==200)throw new Error('createScene overload route missing');
 const tabs=await overload.$$('[role="tab"]');if(tabs.length<2)throw new Error('createScene overload tabs missing');await tabs[0].focus();await overload.keyboard.press('ArrowRight');const selected=await overload.$eval('[role="tab"][aria-selected="true"]',e=>e.textContent?.trim());if(!selected)throw new Error('overload keyboard switching failed');await overload.close();
 const unknown=await browser.newPage();await unknown.setCacheEnabled(false);const bad=await unknown.goto(`${baseUrl}/api-reference/apexify.js/ApexPainter/__missing__`,{waitUntil:'networkidle2'});if(!bad||bad.status()!==404)throw new Error(`unknown member expected 404 got ${bad?.status()}`);await unknown.close();
}finally{await browser.close();}
const evidence={schemaVersion:1,phase:'DOC-4',representative:REP,states:results,overloadRoute:'/api-reference/apexify.js/ApexPainter/createScene',unknownMember404:true,failures:0};
fs.writeFileSync(path.join(OUT,'browser.json'),`${JSON.stringify(evidence,null,2)}\n`);console.log('[doc4-browser] PASS '+JSON.stringify(results.map(r=>({name:r.name,js:r.transferredJsBytes,optionMatches:r.optionSearchResultCount,expectedResourceMisses:r.expectedResourceMisses}))));
