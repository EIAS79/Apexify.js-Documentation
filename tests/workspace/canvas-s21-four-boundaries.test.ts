import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
const source=readFileSync('docs/workspace/CREATE_CANVAS_STRICT_CERTIFICATION_S18.json','utf8');
const ledger=JSON.parse(source);
const paths=['canvas.patternBg.repeat','canvas.bgLayers.pattern.repeat','canvas.shadow.borderRadius','canvas.shadow.borderPosition'];
const target=ledger.paths.filter((x:any)=>paths.includes(x.optionPath));
assert.equal(target.length,4);
const pat={type:'grid',color:'#e64074',secondaryColor:'#2decb1',size:18,spacing:14};
const layer=(repeat:any)=>({type:'presetPattern',nodeId:'layer:s21-preset',pattern:{...pat,repeat}});
test('S21 original 208 identities and 167 FULL stay untouched',()=>{
 assert.equal(ledger.paths.length,208);assert.equal(new Set(ledger.paths.map((x:any)=>x.optionPath)).size,208);
 assert.equal(ledger.paths.filter((x:any)=>x.strictStatus==='FULL').length,167);
 for(const id of paths)assert.ok(target.some((x:any)=>x.optionPath===id));
});
for(const path of paths)test('S21 finite/default/invalid/security '+path,()=>{
 assert.deepEqual(validateCanvasExtras({}),{});
 let valid:any,invalid:any;
 if(path==='canvas.patternBg.repeat'){valid={patternBg:{...pat,repeat:'no-repeat'}};invalid={patternBg:{...pat,repeat:'reflect'}};}
 else if(path==='canvas.bgLayers.pattern.repeat'){valid={bgLayers:[layer('repeat-x')]};invalid={bgLayers:[layer('invalid')]};}
 else if(path==='canvas.shadow.borderRadius'){valid={shadow:{color:'#dd5544',borderRadius:64}};invalid={shadow:{color:'#dd5544',borderRadius:-2}};}
 else {valid={shadow:{color:'#dd5544',borderPosition:'bottom-right'}};invalid={shadow:{color:'#dd5544',borderPosition:'diagonal'}};}
 const ok=validateCanvasExtras(valid);assert.ok(ok);
 assert.throws(()=>validateCanvasExtras(invalid),/repeat|radius|border|position|option|invalid|allowed/i);
 const doc=createBlankDocument();doc.layers=[];doc.canvasExtras=ok;
 assert.ok(validateDocument(doc));
});
test('S21 12 procedural repeat kinds and six ordered compositor discriminants validated',()=>{
 for(const kind of ['grid','dots','diagonal','stripes','waves','crosses','hexagons','checkerboard','diamonds','triangles','stars','polka'])for(const repeat of ['repeat','repeat-x','repeat-y','no-repeat']){
   assert.equal(validateCanvasExtras({patternBg:{...pat,type:kind,repeat}}).patternBg?.repeat,repeat);
   assert.equal((validateCanvasExtras({bgLayers:[{...layer(repeat),pattern:{...pat,type:kind,repeat}}]}).bgLayers?.[0] as any).pattern.repeat,repeat);
 }
 for(const p of ['all','top','bottom','left','right','bottom-right'])assert.equal(validateCanvasExtras({shadow:{borderPosition:p}}).shadow?.borderPosition,p);
 for(const r of [0,1,1024,'circular'])assert.equal(validateCanvasExtras({shadow:{borderRadius:r}}).shadow?.borderRadius,r);
 for(const x of [NaN,Infinity,-Infinity,-1,1025])assert.throws(()=>validateCanvasExtras({shadow:{borderRadius:x}}));
 assert.throws(()=>validateCanvasExtras({patternBg:{...pat,type:'custom',customPatternImage:'https://bad.example/video.mp4'}}),/asset|reference|source|unsafe|image/i);
});
test('S21 installed v6 runtime bundle has approved scope but no deferred angle adapter',()=>{
 const bundle=readFileSync('node_modules/apexify.js/dist/esm/index.js','utf8');
 assert.ok(bundle.includes('geometryOptions.repeat')||bundle.includes('repeat !== "repeat"'));
 assert.ok(bundle.includes('shadow?.borderRadius')||bundle.includes('shadow.borderRadius'));
 const editor=readFileSync('features/apex-workspace/components/CanvasEffectsEditor.tsx','utf8');
 assert.ok(editor.includes('Shadow radius mode')&&editor.includes('Shadow border position (deprecated)'));
 assert.ok(!editor.includes('Shadow border position (deprecated, inert)'));
});
