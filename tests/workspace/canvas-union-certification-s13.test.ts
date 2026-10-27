import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import sharp from 'sharp';import {ApexPainter} from 'apexify.js';
import {validateCanvasExtras,CanvasBlendModes} from '../../features/apex-workspace/canvas-options';
import {validateImageAsset} from '../../features/apex-workspace/asset-store';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {projectCanvasGraph,editCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const painter=new ApexPainter(),rgb='#17466c', colors=[{stop:0,color:'#ff2244'},{stop:1,color:'#11aacc'}];
async function asset(){const raw=Buffer.alloc(24*14*4);for(let i=0;i<raw.length;i+=4){raw[i]=(i/4)%24*9;raw[i+1]=90;raw[i+2]=155;raw[i+3]=255}const png=await sharp(raw,{raw:{width:24,height:14,channels:4}}).png().toBuffer(),sha256=createHash('sha256').update(png).digest('hex');return validateImageAsset({id:'asset:'+sha256,sha256,mime:'image/png',width:24,height:14,bytes:png.length,dataUri:'data:image/png;base64,'+png.toString('base64')})}
const patternTypes=['grid','dots','diagonal','stripes','waves','crosses','hexagons','checkerboard','diamonds','triangles','stars','polka','custom'] as const;
const mkPattern=(kind:typeof patternTypes[number],id:string)=>kind==='custom'?{type:kind,customPatternImage:id,opacity:0.7}:{type:kind,color:'#ffc13d',secondaryColor:'#084468',size:12,spacing:19,opacity:0.7};
const mkLayer=(type:string,id:string)=>type==='color'?{type:'color' as const,value:'#e46633'}:
 type==='gradient'?{type:'gradient' as const,value:{type:'linear' as const,colors}}:
 type==='noise'?{type:'noise' as const,intensity:0.25}:
 type==='image'?{type:'image' as const,source:id,fit:'cover' as const}:
 type==='pattern'?{type:'pattern' as const,source:id,repeat:'repeat' as const}:
 {type:'presetPattern' as const,pattern:mkPattern('grid',id)};
const types=['color','gradient','noise','image','pattern','presetPattern'] as const;
async function png(config:Record<string,unknown>){return sharp((await painter.createCanvas(config)).buffer).ensureAlpha().raw().toBuffer()}
for(const layerType of types)test('S13 union coverage layer blend mode, exact value+Graph+native '+layerType,async()=>{
 const a=await asset();
 const original=mkLayer(layerType,a.id);
 for(const blendMode of CanvasBlendModes){
  const extras=validateCanvasExtras({bgLayers:[{...original,nodeId:'layer:union-image',blendMode}]});
  const d=createBlankDocument();d.width=96;d.height=72;d.layers=[];d.assets=[a];d.canvasExtras=extras;
  const doc=validateDocument(d);
  assert.equal(doc.canvasExtras?.bgLayers?.[0].blendMode,blendMode);
  assert.deepEqual(parseSource(generateSource(doc)).canvasExtras,extras);
  assert.deepEqual(transactCanvasViaV2(doc,extras).document.canvasExtras,extras);
  assert.equal(editCanvasGraph(doc,{op:'layer-blend',index:0,value:blendMode}).bgLayers?.[0].blendMode,blendMode);
  assert.ok(projectCanvasGraph(doc).nodes.some(x=>x.id==='canvas:ordered-layer:layer:union-image'));
  const strip=(v:unknown):unknown=>v===a.id?a.dataUri:v&&typeof v==='object'?(Array.isArray(v)?v.map(strip):Object.fromEntries(Object.entries(v as Record<string,unknown>).filter(([k])=>k!=='nodeId').map(([k,w])=>[k,strip(w)]))):v;
  const native=await png({width:96,height:72,colorBg:rgb,bgLayers:strip(extras.bgLayers)});
  assert.equal(native.length,96*72*4);
 }
});
for(const kind of patternTypes)test('S13 nested pattern blend + alpha variant '+kind,async()=>{
 const a=await asset();
 for(const property of ['blend','opacity'] as const){
  const pattern={...mkPattern(kind,a.id),...(property==='blend'?{blendMode:'multiply' as const}:{opacity:0.45})};
  const extras=validateCanvasExtras({bgLayers:[{type:'presetPattern',nodeId:'layer:pattern-union',pattern}]});
  const d=createBlankDocument();d.width=96;d.height=72;d.layers=[];d.assets=[a];d.canvasExtras=extras;
  const doc=validateDocument(d),project=projectCanvasGraph(doc);
  assert.ok(project.edges.some(e=>e.id==='edge:pattern-layer:layer:pattern-union'));
  assert.deepEqual(parseSource(generateSource(doc)).canvasExtras,extras);
  assert.deepEqual(transactCanvasViaV2(doc,extras).document.canvasExtras,extras);
  assert.equal((editCanvasGraph(doc,{op:'layer-pattern',index:0,value:pattern}).bgLayers?.[0] as NonNullable<typeof extras.bgLayers>[number]).type,'presetPattern');
  const input={...pattern,...(kind==='custom'?{customPatternImage:a.dataUri}:{})};
  const pixels=await png({width:96,height:72,colorBg:rgb,bgLayers:[{type:'presetPattern',pattern:input}]});
  assert.equal(pixels.length,96*72*4);
 }
});
for(const kind of ['color','gradient','image','pattern','presetPattern'] as const)test('S13 bgLayers.opacity covers authored union with distinct RGBA '+kind,async()=>{
 const a=await asset(),layer=mkLayer(kind,a.id);
 const hashes=new Set<string>();
 for(const opacity of [0,0.25,0.5,0.75,1]){
  const extras=validateCanvasExtras({bgLayers:[{...layer,nodeId:'layer:alpha-union',opacity}]});
  const d=createBlankDocument();d.width=96;d.height=72;d.layers=[];d.assets=[a];d.canvasExtras=extras;
  const doc=validateDocument(d);
  assert.equal((editCanvasGraph(doc,{op:'layer-opacity',index:0,value:opacity}).bgLayers?.[0] as {opacity?:number}|undefined)?.opacity,opacity);
  assert.deepEqual(parseSource(generateSource(doc)).canvasExtras,extras);
  const strip=(v:unknown):unknown=>v===a.id?a.dataUri:v&&typeof v==='object'?(Array.isArray(v)?v.map(strip):Object.fromEntries(Object.entries(v as Record<string,unknown>).filter(([k])=>k!=='nodeId').map(([k,w])=>[k,strip(w)]))):v;
  const bytes=await png({width:96,height:72,colorBg:rgb,bgLayers:strip(extras.bgLayers)});
  hashes.add(createHash('sha256').update(bytes).digest('hex'));
 }
 assert.equal(hashes.size,5,'Opacity inert/quantized in '+kind);
});
