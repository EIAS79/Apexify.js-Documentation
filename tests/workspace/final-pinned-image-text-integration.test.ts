import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const read=(p:string)=>readFileSync(resolve(root,p),'utf8');
const img=JSON.parse(read('docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json'));
const txt=JSON.parse(read('docs/workspace/TEXT01_STRICT_CERTIFICATION_444.json'));
const editor=read('features/apex-workspace/components/ImageOptionsEditor.tsx');

test('combined S23 exact native engine, package-lock and protected browser vendor',()=>{
 const pkg=JSON.parse(read('package.json'));
 const lock=JSON.parse(read('package-lock.json'));
 const pin='github:EIAS79/Apexify.js#b6ca97cfc675b16a52c2c7b5d0ff881b87b911be';
 assert.equal(pkg.dependencies['apexify.js'],pin);
 assert.equal(lock.packages[''].dependencies['apexify.js'],pin);
 assert.match(lock.packages['node_modules/apexify.js'].resolved,/b6ca97cfc675b16a52c2c7b5d0ff881b87b911be/);
 assert.ok(!existsSync(resolve(root,'vendor/apexify-engine-s20')));
 const web=execFileSync('git',['rev-parse','HEAD:vendor/apexify-web/src/index.ts'],{cwd:root}).toString().trim();
 assert.match(web,/^[\da-f]{40}$/);
 assert.ok(existsSync(resolve(root,'vendor/apexify-web/src/index.ts')));
});

test('historical /studio routes remain retired while /workspace remains active',()=>{
 assert.equal(existsSync(resolve(root,'app/studio/page.tsx')),false);
 assert.equal(existsSync(resolve(root,'app/studio/workspace/page.tsx')),false);
 assert.ok(existsSync(resolve(root,'app/workspace/page.tsx')));
});

test('final Stage H 351 Image records retain exactly 329 FULL, 17 PARTIAL, 5 BLOCKED',()=>{
 assert.equal(img.records.length,351);
 const counts=new Map<string,number>();
 for(const r of img.records)counts.set(r.strictStatus,(counts.get(r.strictStatus)||0)+1);
 assert.equal(counts.get('FULL'),329);
 assert.equal(counts.get('PARTIAL'),17);
 assert.equal(counts.get('BLOCKED'),5);
 assert.equal(img.enginePin,'379a5248f09ed39c1b1734fe104b6bd73a77857f');
});

test('Text final 444 identities preserve 440 FULL including all 399 authoring, optional and secure statuses',()=>{
 assert.equal(txt.records.length,444);
 const count=(type:string)=>txt.records.filter((r:any)=>r.classification===type).length;
 assert.equal(count('FULL'),440);
 assert.equal(count('PARTIAL'),2);
 assert.equal(count('BLOCKED'),1);
 assert.equal(count('EXCLUDED'),1);
 assert.equal(txt.records.filter((r:any)=>r.kind==='authoring'&&r.classification==='FULL').length,399);
 assert.ok(txt.records.some((r:any)=>String(r.api).includes('font.path')&&r.classification==='BLOCKED'));
});

test('Image Stage H reconciled numeric pixelate coordinates are rounded only for pixelate, other filters retain decimal steps',()=>{
 assert.match(editor,/String\(f\.type\)==='pixelate'&&\['x','y','width','height'\]\.includes\(k\)/);
 assert.match(editor,/step=\{integerRegion\|\|k==='levels'\|\|k==='size'\?1:0\.1\}/);
 assert.match(editor,/integerRegion\?Math\.round\(n\):n/);
});

test('Image Stage H color hex UX coexists with Stage C conditional paint, verified local asset import and grouped masks',()=>{
 assert.match(editor,/function HexColor\(/);
 assert.match(editor,/maxLength=\{9\}/);
 assert.ok(editor.includes('pattern="#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?"'));
 for(const label of ['Image stroke color hex','Image shadow color hex','Image group stroke color hex','Image group shadow color hex'])
  assert.ok(editor.includes(label),label);
 assert.ok(editor.includes('{!options.shape?.gradient&&<Color'), 'preserve exclusive shape color');
 assert.ok(editor.includes('{!options.boxBackground.gradient&&<Color'),'preserve exclusive box color');
 assert.ok(editor.includes('{!value.boxBackground.gradient&&<Color'),'preserve exclusive group paint');
 assert.match(editor,/importImageAsset\(file\)/);
 assert.match(editor,/SHA-256 validated\. No external URLs or filesystem paths\./);
 assert.match(editor,/<Toggle label="Group mask"/);
 assert.match(editor,/<Toggle label="Enable polygon clip"/);
});

test('Stage H Group mesh toggle creates complete rectangular native-valid vertices',()=>{
 assert.ok(editor.includes('gridX:1,gridY:1,controlPoints:[[{x:0,y:0},{x:width,y:0}],[{x:0,y:height},{x:width,y:height}]]'));
 assert.ok(editor.includes("interpolation:'bilinear',edgeMode:'transparent'"));
});
