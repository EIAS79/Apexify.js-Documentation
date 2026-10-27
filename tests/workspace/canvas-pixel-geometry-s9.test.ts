import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {editCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const painter=new ApexPainter();
async function render(options:Record<string,unknown>):Promise<Uint8Array>{
 const x=await painter.createCanvas({width:96,height:96,...options});
 return new Uint8Array(await sharp(x.buffer).removeAlpha().raw().toBuffer());
}
function changed(a:Uint8Array,b:Uint8Array):number{
 assert.equal(a.length,b.length);let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n;
}
const base={type:'stripes' as const,color:'#ff4c12',secondaryColor:'#1768dc',size:9,spacing:13,opacity:.85};
test('12 verified pattern types produce spatially varying decoded pixel grids, not flat fills',async()=>{
 const types=['grid','dots','diagonal','stripes','waves','crosses','hexagons','checkerboard','diamonds','triangles','stars','polka'] as const;
 const fill=await render({colorBg:'#19304d'});
 const signatures=new Set<string>();
 for(const type of types){
  const result=await render({colorBg:'#19304d',patternBg:{...base,type}});
  assert.ok(changed(result,fill)>96,type+' should affect more than a single pixel');
  let variable=false;
  for(let row=0;row<12;row++)for(let col=0;col<12;col++){
   const pos=(row*8*96+col*8)*3;
   if(result[pos]!==result[0]||result[pos+1]!==result[1]||result[pos+2]!==result[2])variable=true;
  }
  assert.equal(variable,true,type+' must vary across a representative grid');
  signatures.add(Buffer.from(result).toString('base64'));
 }
 assert.equal(signatures.size,12,'all 12 pattern variants should render distinct decoded pixel grids');
});
test('pattern geometry, colors, opacity and blend are all pixel-affecting in pinned runtime',async()=>{
 const primary=await render({colorBg:'#19304d',patternBg:base});
 const alterations={
  color:'#10ff12',secondaryColor:'#21fa24',size:22,spacing:28,opacity:.2,
  rotation:90,scale:2.4,offsetX:23,offsetY:27,blendMode:'screen'
 } as const;
 for(const [field,value] of Object.entries(alterations)){
  const next=await render({colorBg:'#19304d',patternBg:{...base,[field]:value}});
  assert.ok(changed(primary,next)>32,field+' did not affect actual pixel values');
 }
 const layerOriginal=await render({colorBg:'#19304d',bgLayers:[{type:'presetPattern',pattern:base,opacity:1}]});
 const layerAltered=await render({colorBg:'#19304d',bgLayers:[{type:'presetPattern',pattern:{...base,size:22,scale:2},opacity:1}]});
 assert.ok(changed(layerOriginal,layerAltered)>400,'nested pattern layer geometry must change output');
});
test('S21 approved S20 fixture: root/layer procedural repeat=no-repeat causes native pixel changes',async()=>{
 const root=await render({colorBg:'#19304d',patternBg:base});
 const noRepeat=await render({colorBg:'#19304d',patternBg:{...base,repeat:'no-repeat'}});
 assert.ok(changed(root,noRepeat)>100,'S20 root procedural no-repeat must affect native pixels');
 const layer=await render({colorBg:'#19304d',bgLayers:[{type:'presetPattern',pattern:base}]});
 const layerNoRepeat=await render({colorBg:'#19304d',bgLayers:[{type:'presetPattern',pattern:{...base,repeat:'no-repeat'}}]});
 assert.ok(changed(layer,layerNoRepeat)>100,'S20 ordered procedural no-repeat must affect native pixels');
});
test('linear/radial/conic geometry materially changes decoded pixels and Graph->Code round trips',async()=>{
 const cases=[
  {type:'linear',colors:[{stop:0,color:'#ff2244'},{stop:1,color:'#1122dd'}],
   geom:{startX:5,startY:80,endX:80,endY:10}},
  {type:'radial',colors:[{stop:0,color:'#ff2244'},{stop:1,color:'#1122dd'}],
   geom:{startX:10,startY:30,startRadius:3,endX:60,endY:50,endRadius:45}},
  {type:'conic',colors:[{stop:0,color:'#ff2244'},{stop:1,color:'#1122dd'}],
   geom:{centerX:10,centerY:60,startAngle:1.5}}
 ] as const;
 for(const g of cases){
  const start=await render({gradientBg:{type:g.type,colors:g.colors}});
  const next=await render({gradientBg:{type:g.type,colors:g.colors,...g.geom}});
  assert.ok(changed(start,next)>400,g.type+' gradient geometry made no meaningful pixel difference');
  const doc=createBlankDocument();
  const updated=editCanvasGraph(doc,{op:'gradient',value:{type:g.type,colors:g.colors.map(x=>({...x})),...g.geom}});
  doc.canvasExtras=updated;
  const valid=validateDocument(doc);
  assert.deepEqual(parseSource(generateSource(valid)),valid);
 }
});
test('typed nested Graph operations reject incompatible ports and keep updates atomic',()=>{
 const doc=createBlankDocument();doc.canvasExtras={bgLayers:[
  {type:'presetPattern',pattern:{type:'grid',color:'#ff4422'}},
  {type:'gradient',value:{type:'linear',colors:[{stop:0,color:'#ff0000'},{stop:1,color:'#0000ff'}]}}
 ]};
 const original=JSON.stringify(doc);
 const patterned=editCanvasGraph(doc,{op:'layer-pattern',index:0,value:{type:'dots',size:14,spacing:19}});
 assert.equal(patterned.bgLayers?.[0].type,'presetPattern');
 assert.equal(JSON.stringify(doc),original,'Graph must not mutate its input document');
 assert.throws(()=>editCanvasGraph(doc,{op:'layer-pattern',index:1,value:{type:'grid'}}),/incompatible/);
 assert.throws(()=>editCanvasGraph(doc,{op:'layer-gradient',index:0,value:{type:'linear',colors:[{stop:0,color:'#ff0000'},{stop:1,color:'#00ff00'}]}}),/incompatible/);
 assert.throws(()=>editCanvasGraph(doc,{op:'layer-pattern',index:4,value:{type:'grid'}}),/existing/);
 const moved=editCanvasGraph(doc,{op:'layer-gradient',index:1,value:{type:'conic',colors:[{stop:0,color:'#ff0000'},{stop:1,color:'#0000ff'}],centerX:50,centerY:45}});
 assert.equal(moved.bgLayers?.[1].type,'gradient');
 doc.canvasExtras=moved;
 const valid=validateDocument(doc);
 assert.deepEqual(JSON.parse(JSON.stringify(valid)),valid);
});

test('pattern GradientConfig linear, radial, conic are distinct and reject mixed solid paint',async()=>{
 const colors=[{stop:0,color:'#ff0000'},{stop:1,color:'#0000ff'}];
 const samples=[] as Uint8Array[];
 for(const type of ['linear','radial','conic'] as const){
  const gradient={type,colors};
  const p={type:'dots' as const,size:12,spacing:20,gradient};
  const valid=validateCanvasExtras({patternBg:p});
  const output=await render({colorBg:'#050b24',patternBg:valid.patternBg});
  samples.push(output);
  const doc=createBlankDocument();doc.canvasExtras=valid;
  assert.deepEqual(parseSource(generateSource(validateDocument(doc))),validateDocument(doc));
 }
 assert.ok(changed(samples[0],samples[1])>500);
 assert.ok(changed(samples[1],samples[2])>500);
 assert.throws(()=>validateCanvasExtras({patternBg:{type:'dots',color:'#112233',
   gradient:{type:'linear',colors}}}),/mutually exclusive/);
 assert.throws(()=>validateCanvasExtras({patternBg:{type:'custom',customPatternImage:'asset:'+'0'.repeat(64),
   gradient:{type:'linear',colors}}}),/unsupported/);
 assert.throws(()=>validateCanvasExtras({patternBg:{type:'dots',gradient:{type:'radial',colors,startRadius:-1}}}),/outside supported range|unsupported/);
});
test('S22 PatternGradient linear angle changes native dot paint geometry',async()=>{
 const p={type:'dots',size:12,spacing:20};
 const colors=[{stop:0,color:'#ff0000'},{stop:1,color:'#0000ff'}];
 const original=await render({colorBg:'#050b24',patternBg:{...p,gradient:{type:'linear',colors}}});
 const angled=await render({colorBg:'#050b24',patternBg:{...p,gradient:{type:'linear',colors,angle:45}}});
 assert.ok(changed(original,angled)>100,'S22 native PatternGradient.angle must produce distinct dot pixels');
});
