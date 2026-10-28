/* Run with an existing app, or WORKSPACE_TEST_START_SERVER=1 to start Next dev.
   PLAYWRIGHT_MODULE and CHROME_PATH support an external browser installation. */
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const base = process.env.WORKSPACE_URL || 'http://127.0.0.1:4173';

async function run() {
  let server, app, browser;
  const errors = [];
  try {
    if (process.env.WORKSPACE_TEST_START_SERVER === '1') {
      app=require('next')({dev:true,dir:process.cwd(),hostname:'127.0.0.1'});
      await app.prepare();
      server=http.createServer(app.getRequestHandler());
      await new Promise(resolve=>server.listen(Number(new URL(base).port)||4173,'127.0.0.1',resolve));
    }
    browser = await chromium.launch({executablePath:process.env.CHROME_PATH, headless:true,
      args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    page.on('pageerror', error => {errors.push(error.message);console.error('BROWSER ERROR:',error.message,error.stack);});
    page.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text().slice(0,600),m.location());});
    if(process.env.WORKSPACE_TEST_LOCAL_ASSETS==='1') {
      // Optional host workaround: serve exact built assets over CDP when local
      // HTTP static-file streaming truncates large development chunks.
      await page.route('**/_next/static/**',async route=>{
        const name=new URL(route.request().url()).pathname.slice('/_next/'.length);
        const file=path.resolve(process.cwd(),'.next',name);
        const root=path.resolve(process.cwd(),'.next','static')+path.sep;
        if(!file.startsWith(root))return route.abort();
        try{await route.fulfill({status:200,body:require('node:fs').readFileSync(file),
          contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'application/octet-stream'});}
        catch{await route.continue();}
      });
    }
    await page.addInitScript(() => localStorage.setItem('apexify-theme', 'dark'));
    assert.equal((await page.goto(base+'/workspace', {waitUntil:'networkidle',timeout:120000})).status(), 200);
    await page.locator('.aw-app').waitFor({state:'visible',timeout:30000});
    console.log('Workspace loaded');
    const desktop = page.locator('.aw-desktop-dock');
    const inspector = desktop.locator('.aw-inspector');
    await page.locator('.aw-render-image').first().waitFor({state:'visible'});
    assert.match(await page.locator('.aw-brand img').getAttribute('src'), /apexify-lockup-v2.avif/);
    assert.equal(await page.locator('.aw-app').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(17, 17, 17)');
    assert.equal(await desktop.locator('.aw-panel:visible').count(), 6);
    assert.equal(await desktop.getByRole('tab',{name:'Code',exact:true}).getAttribute('aria-selected'),'true');
    assert.equal(await desktop.getByRole('tab',{name:'Render Queue',exact:true}).getAttribute('aria-selected'),'true');

    console.log('Theme and default layout verified');
    assert.deepEqual(await inspector.getByRole('tablist',{name:'Canvas property categories'}).getByRole('tab').allTextContents(),['Layout','Background','Effects','Advanced']);
    for(const [name,control] of [
      ['Layout',inspector.getByRole('spinbutton',{name:'Width',exact:true})],
      ['Background',inspector.locator('.aw-segmented')],
      ['Effects',inspector.getByLabel('Canvas stroke enabled',{exact:true})],
      ['Advanced',inspector.getByLabel('Import canvas background image',{exact:true})],
    ]) {
      const tab=inspector.getByRole('tab',{name,exact:true});
      await tab.click();await control.waitFor({state:'visible'});
      assert.equal(await tab.getAttribute('aria-selected'),'true');
    }
    await inspector.getByRole('tab',{name:'Layout',exact:true}).click();

    const help = inspector.getByRole('button', {name:'About Width', exact:true});
    await help.click();
    await page.getByRole('note', {name:'Width help',exact:true}).waitFor();
    assert.match(await page.getByRole('note').innerText(), /pixels/);
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('note').count(), 0);
    assert.equal(await help.evaluate(el => el === document.activeElement), true);

    console.log('Help verified');
    await inspector.getByRole('tab',{name:'Background',exact:true}).click();
    await inspector.locator('#aw-canvas-gradients > summary').click();
    await inspector.getByLabel('Canvas gradient type').selectOption('linear');
    // CodeMirror virtualizes off-screen lines; inspect the actual source download.
    const readSource = async () => {
      const pending = page.waitForEvent('download');
      await desktop.getByRole('button',{name:'Download source',exact:true}).click();
      const download=await pending;
      return require('node:fs').readFileSync(await download.path(),'utf8');
    };
    assert.match(await readSource(), /gradientBg/);
    console.log('Canvas verified');
    await desktop.getByRole('button', {name:'Text',exact:true}).click();
    await inspector.getByLabel('Text content',{exact:true}).fill('Frame Studio');
    await inspector.getByRole('spinbutton', {name:'Font size',exact:true}).fill('48');
    const layout = inspector.locator('.aw-editor-section').filter({has:page.locator('summary > strong', {hasText:/^Layout$/})});
    await layout.locator('summary').click();
    await layout.getByRole('button', {name:'Enable',exact:true}).click();
    await layout.locator('.aw-text-optional').filter({hasText:'Letter Spacing'}).getByRole('button', {name:'Add',exact:true}).click();
    await layout.getByLabel('Text letterSpacing',{exact:true}).fill('3');
    assert.match(await readSource(), /"letterSpacing": 3/);
    const measure = inspector.locator('.aw-editor-section').filter({has:page.locator('summary > strong', {hasText:/^Measure text$/})});
    await measure.locator('summary').click();
    await measure.getByRole('button', {name:'Measure text',exact:true}).click();
    await measure.locator('.aw-text-metrics').waitFor();
    assert.match(await measure.locator('.aw-text-metrics').innerText(), /Width: [1-9]/);

    console.log('Text verified');
    await inspector.getByRole('tab',{name:'Assets',exact:true}).click();
    await inspector.locator('.aw-assets input[type=file]').setInputFiles(path.join(process.cwd(),'public/workspace/assets/crystal-lake.webp'));
    await inspector.getByLabel('Image fit',{exact:true}).waitFor();
    const oldPreview=await desktop.locator('.aw-render-image').getAttribute('src');
    await inspector.getByLabel('Image fit',{exact:true}).selectOption('contain');
    await page.waitForFunction(old=>{const image=document.querySelector('.aw-desktop-dock .aw-render-image');return image&&image.getAttribute('src')!==old&&image.complete&&image.naturalWidth>0;},oldPreview);
    assert.equal(await desktop.locator('.aw-tool.selected').innerText(),'Image');
    assert.equal(await inspector.getByLabel('Image fit',{exact:true}).inputValue(), 'contain');
    await inspector.getByRole('button', {name:'About Image fit',exact:true}).click();
    assert.match(await page.getByRole('note').innerText(), /Cover.*Contain.*Fill/);
    await page.keyboard.press('Escape');
    await page.locator('.aw-topbar').getByRole('button', {name:'Switch to light theme',exact:true}).click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.aw-app')).backgroundColor === 'rgb(244, 245, 237)');
    await page.screenshot({path:process.env.WORKSPACE_LIGHT_SCREENSHOT || '/tmp/workspace-frame-light.png'});
    await page.locator('.aw-topbar').getByRole('button', {name:'Switch to dark theme',exact:true}).click();
    await page.locator('.aw-topbar').getByRole('button', {name:'Panels',exact:true}).click();
    await page.locator('#aw-panels-menu').getByLabel('Visual Graph',{exact:true}).check();
    await page.keyboard.press('Escape');
    await desktop.locator('.react-flow__node').first().waitFor();
    assert.ok(await desktop.locator('.react-flow__handle').count()>0);
    await desktop.getByRole('button', {name:'Close Visual Graph',exact:true}).click();
    assert.equal(await desktop.locator('.aw-panel-graph').count(), 0);
    await page.screenshot({path:process.env.WORKSPACE_DARK_SCREENSHOT || '/tmp/workspace-frame-dark.png'});

    await page.setViewportSize({width:390,height:844});
    await page.getByLabel('Active workspace panel').selectOption('inspector');
    const mobile = page.locator('.aw-mobile-dock .aw-inspector');
    await mobile.getByRole('button', {name:'About Image fit',exact:true}).click();
    const bounds = await page.getByRole('note').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 844);
    await page.keyboard.press('Escape');
    await page.screenshot({path:process.env.WORKSPACE_MOBILE_SCREENSHOT || '/tmp/workspace-frame-mobile.png'});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);

    console.log('PASS: Balanced layout, logo, grouped tabs, accessible help, canvas/code sync, text layout/measurements, image import/fit, themes, panel recovery, and 390px inspector.');
  } finally {
    await browser?.close();
    server?.closeAllConnections();
    server?.close();
    if(app)await Promise.race([app.close(),new Promise(resolve=>setTimeout(resolve,1000))]);
  }
}
run().then(()=>{if(process.env.WORKSPACE_TEST_START_SERVER==='1')process.exit(0);}).catch(error => {console.error(error);process.exit(1);});
