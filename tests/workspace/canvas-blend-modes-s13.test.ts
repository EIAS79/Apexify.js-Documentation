import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createCanvas} from '@napi-rs/canvas';
import {ApexPainter} from 'apexify.js';
import {CanvasBlendModes,validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {projectCanvasGraph,editCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
const p=new ApexPainter(), color='#225588',over='#f07946';
const native=async(extras:Record<string,unknown>)=>sharp((await p.createCanvas({width:96,height:72,colorBg:color,...extras})).buffer).ensureAlpha().raw().toBuffer();
const c=()=>{const x=createBlankDocument();x.width=96;x.height=72;x.layers=[];return x;};
test('S13 installed v6 exposes exactly 26 blend modes and rejects arbitrary strings without mutating Graph',()=>{
 assert.equal(CanvasBlendModes.length,26);assert.equal(new Set(CanvasBlendModes).size,26);
 assert.throws(()=>validateCanvasExtras({bgLayers:[{type:'color',value:'#ffcc44',blendMode:'dangerous'}]}),/unsupported blend/);
 assert.throws(()=>validateCanvasExtras({patternBg:{type:'grid',blendMode:'dangerous'}}),/unsupported pattern blend/);
});
for(const mode of CanvasBlendModes)test('S13 layer blend native compositing / Graph / Code: '+mode,async()=>{
 const extras=validateCanvasExtras({bgLayers:[{type:'color',nodeId:'layer:blend-mode-test',value:over,opacity:0.7,blendMode:mode}]});
 const doc=c();doc.canvasExtras=extras;const v=validateDocument(doc);
 assert.deepEqual(parseSource(generateSource(v)).canvasExtras,extras);
 assert.deepEqual(transactCanvasViaV2(v,extras).document.canvasExtras,extras);
 const changed=editCanvasGraph(v,{op:'layer-blend',index:0,value:mode});
 assert.equal(changed.bgLayers?.[0].blendMode,mode);
 assert.equal(projectCanvasGraph({...v,canvasExtras:changed}).nodes.find(x=>x.id==='canvas:ordered-layer:layer:blend-mode-test')?.kind,'layer');
 const result=await native({bgLayers:[{type:'color',value:over,opacity:0.7,blendMode:mode}]});
 const ctx=createCanvas(96,72).getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,96,72);
 ctx.save();ctx.globalAlpha=0.7;ctx.globalCompositeOperation=mode;ctx.fillStyle=over;ctx.fillRect(0,0,96,72);ctx.restore();
 const direct=Buffer.from(ctx.getImageData(0,0,96,72).data);
 assert.equal(result.length,96*72*4);
 const idx=(36*96+48)*4;
 const delta=[...result.subarray(idx,idx+4)].map((x,i)=>Math.abs(x-direct[idx+i]));
 assert.ok(delta.every(x=>x<=3),'Pinned '+mode+' disagrees with independently-composited pixel '+delta);
});
for(const mode of CanvasBlendModes)test('S13 pattern blend acceptance / canonical / paint: '+mode,async()=>{
 const extras=validateCanvasExtras({patternBg:{type:'grid',color:'#ffaa00',secondaryColor:'#003366',size:7,spacing:12,opacity:0.9,blendMode:mode}});
 const doc=c();doc.canvasExtras=extras;const v=validateDocument(doc);
 assert.equal(parseSource(generateSource(v)).canvasExtras?.patternBg?.blendMode,mode);
 assert.deepEqual(transactCanvasViaV2(v,extras).document.canvasExtras,extras);
 assert.ok(projectCanvasGraph(v).nodes.some(n=>n.id==='canvas:pattern:root'));
 const result=await native({patternBg:extras.patternBg});
 assert.equal(result.length,96*72*4);
});

for(const mode of CanvasBlendModes)test('S13 nested layer pattern blend validation / Graph / painter '+mode,async()=>{
 const record={type:'presetPattern' as const,nodeId:'layer:nested-pattern-blend',pattern:{
   type:'grid' as const,color:'#ef2635',secondaryColor:'#247ee5',size:15,spacing:23,opacity:0.8,blendMode:mode
 },opacity:0.9};
 const extras=validateCanvasExtras({bgLayers:[record]});
 const doc=c();doc.canvasExtras=extras;const v=validateDocument(doc);
 const existing=projectCanvasGraph(v);
 assert.ok(existing.edges.some(e=>e.id==='edge:pattern-layer:layer:nested-pattern-blend'));
 const changed=editCanvasGraph(v,{op:'layer-pattern',index:0,value:record.pattern});
 assert.equal((changed.bgLayers?.[0] as {pattern:{blendMode?:string}}).pattern.blendMode,mode);
 assert.deepEqual(transactCanvasViaV2(v,extras).document.canvasExtras,extras);
 assert.deepEqual(parseSource(generateSource(v)).canvasExtras,extras);
 const nativePixels=await native({bgLayers:[{...record,nodeId:undefined}]});
 assert.equal(nativePixels.length,96*72*4);
});
