/* Optional real-Chromium smoke test. Run against locally built Next, using external playwright-core test installation. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
async function run(){
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-first-run','--disable-extensions']});
  let page;
  try{
    page=await browser.newPage({viewport:{width:1440,height:900}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().includes('/api/workspace/render'))console.log('BROWSER_RENDER_API_STATUS='+r.status())});
    page.on('requestfailed',r=>{if(r.url().includes('/api/workspace/render'))console.log('BROWSER_RENDER_FETCH_ERROR='+r.failure()?.errorText)});
    const response=await page.goto(process.env.S4_BROWSER_URL||'http://127.0.0.1:38471/workspace',{waitUntil:'domcontentloaded',timeout:60000});
    assert.equal(response.status(),200,'workspace must serve 200');
    await page.getByLabel('Canvas gradient type').waitFor({state:'visible',timeout:30000});
    console.log('CHROME_RENDERED_WORKSPACE=PASS');
    await page.getByLabel('Canvas gradient type').selectOption('radial');
    await page.waitForTimeout(1000);
    assert.equal(await page.getByLabel('Canvas gradient type').inputValue(),'radial');
    console.log('CHROME_VISUAL_GRADIENT_CONTROL=PASS');
    await page.getByLabel('Canvas graph background gradient').selectOption('conic');
    await page.waitForTimeout(600);
    assert.equal(await page.getByLabel('Canvas gradient type').inputValue(),'conic');
    console.log('CHROME_GRAPH_TO_VISUAL_CANONICAL_SYNC=PASS');
    await page.getByLabel('Canvas gradient type').selectOption('linear');
    await page.getByRole('button',{name:'Add color layer'}).click();
    await page.getByRole('button',{name:'Add noise layer'}).click();
    await page.getByRole('button',{name:'Up',exact:true}).last().click();
    await page.waitForTimeout(500);
    console.log('CHROME_BACKGROUND_LAYER_EDITOR=PASS');
    console.log('CHROME_STORED_BEFORE_RELOAD='+await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('apexify-workspace-document-v1')||'{}').canvasExtras||null)));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByLabel('Canvas gradient type').waitFor({state:'visible',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('select[aria-label="Canvas gradient type"]')?.value==='linear',null,{timeout:12000});
    assert.equal(await page.getByLabel('Canvas gradient type').inputValue(),'linear');
    console.log('CHROME_SAVE_RELOAD=PASS');
    await page.getByRole('button',{name:'Run Graph'}).click();
    await page.waitForTimeout(10000);
    console.log('BROWSER_UI_ALERTS='+await page.locator('.aw-app [role=alert]').allTextContents());
    console.log('BROWSER_PREVIEW_IMG='+await page.locator('.aw-app img').count());
    const rendered=await page.locator('.aw-graph-node.aw-node-output img').count();
    console.log('CHROME_RENDER_OUTPUT_IMAGE_COUNT='+rendered);
    if(rendered<1) throw Error('Graph render did not produce a preview image');
    if(errors.length)throw Error('Unhandled browser exceptions: '+errors.join('|'));
    console.log('CHROME_NO_UNHANDLED_JS=PASS');
    await page.screenshot({path:process.env.S4_SCREENSHOT_PATH||'canvas-smoke.png',fullPage:false});
    console.log('CHROME_CANVAS_SMOKE=PASS');
  }finally{await browser.close()}
}
run().catch(e=>{console.error('CHROME_CANVAS_SMOKE_FAIL',e.stack||e.message);process.exitCode=1});
