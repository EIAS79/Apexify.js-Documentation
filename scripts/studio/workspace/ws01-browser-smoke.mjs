#!/usr/bin/env node
// WS-01 locked neon reference — structural and real-workspace regression suite.
// The reference screenshot is 1672×941; no fake output or queue progress allowed.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const chrome=process.env.CHROME_PATH;
const base=process.env.STUDIO_WS01_BASE_URL || 'http://127.0.0.1:3000';
const output=process.env.STUDIO_WS01_EVIDENCE || 'generated/studio/workspace/ws01-browser';
if(!chrome)throw Error('CHROME_PATH required');
const browsers=[['reference',1672,941],['wide',1920,1080],['desktop',1440,900],['laptop',1280,720],['compact',1024,768],['tablet',820,1180],['mobile',390,844],['small',320,568]];
await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage']});
const report=[];
try{
  for(const [name,width,height] of browsers){
    const page=await browser.newPage();
    const issues=[];
    page.on('pageerror',e=>issues.push('JS: '+e.message));
    try{
      await page.setViewport({width,height,deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});
      const response=await page.goto(base+'/studio/workspace',{waitUntil:'domcontentloaded',timeout:90000});
      if(response?.status()!==200)throw Error('HTTP '+response?.status());
      await page.waitForSelector('.nw[data-workspace-stage="ws01-neon-approved"]',{timeout:90000});
      await page.waitForSelector('.nw-code .apx-studio-root',{timeout:75000});
      const baseline=await page.evaluate(()=>{
        const shell=document.querySelector('.nw');
        const selectors=['.nw-header','.nw-rail','.nw-explorer','.nw-main','.nw-modebar','.nw-editor','.nw-preview','.nw-inspector','.nw-dock'];
        const regions=Object.fromEntries(selectors.map(s=>{
          const e=document.querySelector(s);const r=e?.getBoundingClientRect();
          return [s,r?{x:r.x,y:r.y,width:r.width,height:r.height}:null];
        }));
        const rootStyle=getComputedStyle(shell);
        const overflow=Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth);
        return {regions,overflow,background:rootStyle.backgroundColor,accent:rootStyle.getPropertyValue('--nw-cyan').trim(),
          noGeneratedOutput:document.querySelector('.nw-preview-content')?.hasAttribute('data-example-artwork'),
          sampleLabel:document.querySelector('.nw-reference-label')?.textContent||'',
        };
      });
      if(baseline.accent!=='#20c8ff')issues.push('Neon cyan token missing');
      if(baseline.overflow>1)issues.push('Document horizontal overflow '+baseline.overflow);
      if(!baseline.regions['.nw-main'] || !baseline.regions['.nw-editor'])issues.push('Editor shell missing');
      if(width>=1161&&(!baseline.regions['.nw-inspector']||baseline.regions['.nw-inspector'].width<260))issues.push('Desktop inspector not docked');
      if(width>=961&&(!baseline.regions['.nw-explorer']||baseline.regions['.nw-explorer'].width<170))issues.push('Desktop file browser missing');
      if(width>=761&&!baseline.regions['.nw-dock'])issues.push('Desktop output dock missing');
      if(baseline.noGeneratedOutput&&!baseline.sampleLabel.includes('NOT A GENERATED RUN'))issues.push('Example artwork lacks truthful label');
      await page.screenshot({path:path.join(output,name+'-full.png'),fullPage:true});
      await page.click('.nw-modes button:nth-child(3)');
      await page.waitForSelector('.nw-graph .nw-node',{timeout:25000});
      if(await page.$eval('.nw-graph .nw-node',node=>getComputedStyle(node).visibility==='hidden'))issues.push('Graph overview hidden');
      await page.click('.nw-modes button:nth-child(1)');
      await page.waitForSelector('.nw-code .apx-studio-root');
      if(width>=761)await page.click('.nw-modes-preview > button:nth-child(1)');
      await page.click('.nw-modes button:nth-child(1)');
      const toggle=await page.$('button[aria-label="Toggle sidebar"]');
      if(toggle && width<=760){await toggle.click();await toggle.click();}
      const runButton=await page.$('.nw-preview .nw-run');
      if(!runButton && width>760)issues.push('Run button absent from desktop');
      report.push({name,width,height,status:issues.length?'FAIL':'PASS',issues,baseline});
    }catch(error){
      issues.push(error instanceof Error?(error.stack||error.message):String(error));
      try{await page.screenshot({path:path.join(output,name+'-error.png')});}catch{}
      report.push({name,width,height,status:'FAIL',issues});
    }finally{await page.close();}
  }
}finally{await browser.close();}
await writeFile(path.join(output,'report.json'),JSON.stringify({phase:'WS-01',ui:'reference-neon',report},null,2)+'\n');
console.log(JSON.stringify(report.map(x=>({name:x.name,status:x.status,issues:x.issues})),null,2));
if(report.some(x=>x.status==='FAIL'))process.exitCode=1;
