import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasExtras,validateCanvasGradient} from '../../features/apex-workspace/canvas-options';
import {canvasGraphPortId,editCanvasGraph,projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const painter=new ApexPainter();
const exec=promisify(execFile);
const stops=[{stop:0,color:'#ff1133'},{stop:1,color:'#1133ff'}];
const redBlue={type:'linear' as const,colors:stops,endX:112,endY:0};
const solid={type:'grid' as const,color:'#ff5533',secondaryColor:'#002244',size:16,spacing:20};
const document=()=>{const x=createBlankDocument();x.width=112;x.height=84;x.layers=[];return validateDocument(x);};
async function raw(config:Parameters<ApexPainter['createCanvas']>[0]){
 const png=(await painter.createCanvas(config)).buffer;
 return sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
}
function pixel(a:Awaited<ReturnType<typeof raw>>,x:number,y:number){return [...a.data.subarray((y*a.info.width+x)*4,(y*a.info.width+x)*4+4)];}
function spread(a:Awaited<ReturnType<typeof raw>>){
 const sum=[0,0,0],square=[0,0,0];
 for(let i=0;i<a.data.length;i+=4)for(let c=0;c<3;c++){const x=a.data[i+c];sum[c]+=x;square[c]+=x*x;}
 const n=a.info.width*a.info.height;
 return square.reduce((s,x,i)=>s+x/n-(sum[i]/n)**2,0);
}
test('S12: declared gradient outputs are backed by real root, layer, stroke and shadow paint and stable ports',()=>{
 const doc=document();
 doc.canvasExtras={gradientBg:redBlue,stroke:{gradient:redBlue,width:5},shadow:{gradient:redBlue,blur:3},
   bgLayers:[{type:'gradient',nodeId:'layer:first-gradient',value:redBlue,opacity:0.5},
             {type:'gradient',nodeId:'layer:second-gradient',value:{type:'radial',colors:stops},opacity:0.4}]};
 const g=projectCanvasGraph(validateDocument(doc));
 for(const id of ['canvas:gradient:root','canvas:gradient:layer:layer:first-gradient',
   'canvas:gradient:layer:layer:second-gradient','canvas:gradient:stroke','canvas:gradient:shadow'])
  assert.ok(g.nodes.some(n=>n.id===id),'Missing functional gradient node '+id);
 assert.ok(g.edges.some(e=>e.id==='edge:gradient-layer:layer:second-gradient'));
 assert.equal(g.ports.length,new Set(g.ports.map(p=>p.id)).size);
 const moved=validateDocument({...doc,canvasExtras:editCanvasGraph(doc,{op:'layer-order',from:0,to:1})});
 assert.ok(projectCanvasGraph(moved).nodes.some(n=>n.id==='canvas:gradient:layer:layer:first-gradient'));
});
test('S12: connect gradients across two layers and stroke/shadow without mutating source, and reject stale/invalid inputs',()=>{
 const doc=document();doc.canvasExtras={gradientBg:redBlue,
   bgLayers:[{type:'gradient',nodeId:'layer:first-gradient',value:{type:'radial',colors:stops}},
             {type:'gradient',nodeId:'layer:second-gradient',value:{type:'conic',colors:stops}}],
   stroke:{color:'#cccccc',width:6},shadow:{color:'#112233',blur:2}};
 const initial=JSON.stringify(doc),src=canvasGraphPortId('canvas:gradient:root','output','gradient');
 const dst=canvasGraphPortId('canvas:ordered-layer:layer:second-gradient','input','gradient');
 const modified=editCanvasGraph(doc,{op:'connect',fromPort:src,toPort:dst});
 assert.deepEqual((modified.bgLayers?.[1] as {value:unknown}).value,redBlue);
 assert.equal(JSON.stringify(doc),initial,'Original undo revision mutated');
 const s=editCanvasGraph({...doc,canvasExtras:modified},{op:'connect',fromPort:src,toPort:canvasGraphPortId('canvas:stroke','input','gradient')});
 assert.deepEqual(s.stroke?.gradient,redBlue);assert.equal(s.stroke?.color,undefined);
 const h=editCanvasGraph({...doc,canvasExtras:s},{op:'connect',fromPort:src,toPort:canvasGraphPortId('canvas:shadow','input','gradient')});
 assert.deepEqual(h.shadow?.gradient,redBlue);
 const restored=editCanvasGraph({...doc,canvasExtras:h},{op:'disconnect',toPort:canvasGraphPortId('canvas:stroke','input','gradient')});
 assert.equal(restored.stroke?.color,'#000000');
 assert.equal(restored.stroke?.gradient,undefined);
 const tx=transactCanvasViaV2(doc,h);assert.deepEqual(tx.document.canvasExtras,h);
 assert.deepEqual(parseSource(generateSource(tx.document)),tx.document);
 const wrong=canvasGraphPortId('canvas:root','output','canvas');
 assert.throws(()=>editCanvasGraph(doc,{op:'connect',fromPort:wrong,toPort:dst}),/type mismatch/);
 assert.throws(()=>editCanvasGraph(doc,{op:'disconnect',toPort:dst}),/required layer gradient/);
 assert.throws(()=>editCanvasGraph(doc,{op:'connect',fromPort:'missing',toPort:dst}),/source port/);
});
test('S12: pattern source-to-destination connections represent real typed background compositions',()=>{
 const doc=document();doc.canvasExtras={patternBg:solid,bgLayers:[
   {type:'presetPattern',nodeId:'layer:first-pattern',pattern:{...solid,spacing:18}},
   {type:'presetPattern',nodeId:'layer:second-pattern',pattern:{...solid,color:'#00ff00'}}]};
 const g=projectCanvasGraph(doc),src=canvasGraphPortId('canvas:pattern:layer:layer:second-pattern','output','pattern');
 const dst=canvasGraphPortId('canvas:ordered-layer:layer:first-pattern','input','pattern');
 assert.ok(g.edges.some(e=>e.id==='edge:pattern-layer:layer:first-pattern'));
 const changed=editCanvasGraph(doc,{op:'connect',fromPort:src,toPort:dst});
 assert.deepEqual((changed.bgLayers?.[0] as {pattern:unknown}).pattern,doc.canvasExtras!.bgLayers![1].type==='presetPattern'?doc.canvasExtras!.bgLayers![1].pattern:null);
 const updated=validateDocument({...doc,canvasExtras:changed});
 assert.deepEqual(parseSource(generateSource(updated)),updated);
 const root=editCanvasGraph(updated,{op:'connect',fromPort:src,toPort:canvasGraphPortId('canvas:background','input','pattern')});
 assert.deepEqual(root.patternBg,(changed.bgLayers?.[1] as {pattern:unknown}).pattern);
 assert.throws(()=>editCanvasGraph(doc,{op:'disconnect',toPort:dst}),/required layer pattern/);
});
test('S12: Graph geometry/noise preserve native gradient overlays and reject invalid values atomically',()=>{
 const doc=document();doc.canvasExtras={gradientBg:redBlue};
 const before=JSON.stringify(doc);
 const zoom=editCanvasGraph(doc,{op:'zoom',value:{scale:1.75,centerX:24,centerY:36}});
 const noise=editCanvasGraph({...doc,canvasExtras:zoom},{op:'noise',value:{intensity:0.15}});
 assert.deepEqual(noise.gradientBg,redBlue);
 assert.deepEqual(noise.zoom,{scale:1.75,centerX:24,centerY:36});
 assert.equal(noise.noiseBg?.intensity,0.15);
 assert.equal(JSON.stringify(doc),before);
 const tx=transactCanvasViaV2(doc,noise);
 assert.equal(tx.canonical.canvas.extras?.noiseBg?.intensity,0.15);
 assert.throws(()=>editCanvasGraph(doc,{op:'zoom',value:{scale:NaN}}),/outside supported range/);
 assert.throws(()=>editCanvasGraph(doc,{op:'noise',value:{intensity:1.1}}),/outside supported range/);
 assert.deepEqual(editCanvasGraph(doc,{op:'noise',value:null}).noiseBg,undefined);
});
test('S12: invalid identical gradient geometry is rejected before it reaches the native renderer',()=>{
 assert.throws(()=>validateCanvasGradient({type:'linear',colors:stops,endX:0,endY:0}),/degenerate/);
 assert.throws(()=>validateCanvasGradient({type:'radial',colors:stops,endRadius:0}),/degenerate/);
 assert.throws(()=>validateCanvasGradient({type:'radial',colors:stops,startX:5,endX:5,startY:6,endY:6,startRadius:2,endRadius:2}),/degenerate/);
 assert.deepEqual(validateCanvasGradient(redBlue),redBlue);
 assert.doesNotThrow(()=>validateCanvasGradient({type:'conic',colors:stops,startAngle:70,centerX:30,centerY:10}));
 assert.throws(()=>validateCanvasGradient({type:'conic',colors:stops,repeat:'reflect'}),/unsupported keys/);
});
test('S12: linear/radial/conic gradients, rotation, pivots and color stops produce distinct pinned pixels',async()=>{
 const configs=[
  {type:'linear' as const,colors:stops,endX:112},
  {type:'radial' as const,colors:stops,endRadius:56},
  {type:'conic' as const,colors:stops,centerX:56,centerY:42}
 ];
 const views=await Promise.all(configs.map(gradientBg=>raw({width:112,height:84,gradientBg})));
 for(const view of views)assert.ok(spread(view)>100);
 assert.notDeepEqual(views[0].data,views[1].data);
 assert.notDeepEqual(views[1].data,views[2].data);
 const rotation=await raw({width:112,height:84,gradientBg:{...configs[0],rotate:45,pivotX:20,pivotY:28}});
 assert.notDeepEqual(rotation.data,views[0].data);
 const changedStop=await raw({width:112,height:84,gradientBg:{...configs[0],colors:[{stop:0,color:'#ff1133'},{stop:0.8,color:'#1133ff'}]}});
 assert.notDeepEqual(changedStop.data,views[0].data);
});
test('S12: zoom midpoint/pivots and scale modify native pixels and no-scale center remains inert as declared',async()=>{
 const base={width:112,height:84,gradientBg:{...redBlue,endX:112},bgLayers:[{type:'color' as const,value:'#004488',opacity:0.13}]};
 const normal=await raw(base),zoom=await raw({...base,zoom:{scale:1.6}});
 const moved=await raw({...base,zoom:{scale:1.6,centerX:12,centerY:20}});
 assert.notDeepEqual(normal.data,zoom.data);
 assert.notDeepEqual(zoom.data,moved.data);
 const centerNoScale=await raw({...base,zoom:{scale:1,centerX:12,centerY:20}});
 assert.deepEqual(normal.data,centerNoScale.data);
});
test('S12: pinned layer blend equations agree with expected multiply/screen/source-over center pixel',async()=>{
 const base={width:64,height:64,colorBg:'#808080'};
 const make=(blendMode:'source-over'|'multiply'|'screen')=>raw({...base,bgLayers:[{type:'color' as const,value:'#ff0000',blendMode}]});
 const [a,b,c]=await Promise.all([make('source-over'),make('multiply'),make('screen')]);
 assert.deepEqual(pixel(a,20,20).slice(0,3),[255,0,0]);
 const multiply=pixel(b,20,20),screen=pixel(c,20,20);
 assert.ok(Math.abs(multiply[0]-128)<=2&&multiply[1]<=2&&multiply[2]<=2,JSON.stringify(multiply));
 assert.ok(screen[0]>=253&&Math.abs(screen[1]-128)<=2&&Math.abs(screen[2]-128)<=2,JSON.stringify(screen));
});
test('S12: nondeterministic noise increases actual channel dispersion instead of using false byte parity',async()=>{
 const black=await raw({width:128,height:128,colorBg:'#000000'});
 const noisy=await raw({width:128,height:128,noiseBg:{intensity:0.7}});
 assert.ok(spread(noisy)>spread(black)+100,'noise must change spatial statistics');
 const layered=await raw({width:128,height:128,noiseBg:{intensity:0.4},
   bgLayers:[{type:'color',value:'#ffffff',opacity:0.3}]});
 assert.ok(spread(layered)>50,'noise with layers should remain visibly nonuniform');
});
test('S12: generated public-v6 program for composed gradient/zoom/blend/stroke/shadow equals independently invoked engine',async()=>{
 const doc=document();doc.canvasExtras=validateCanvasExtras({gradientBg:redBlue,
   zoom:{scale:1.2,centerX:35,centerY:35},
   bgLayers:[{type:'color',nodeId:'layer:blend-check',value:'#aa3300',opacity:0.22,blendMode:'screen'}],
   stroke:{color:'#00ccff',width:3},shadow:{color:'#220066',offsetX:3,offsetY:2,blur:4}});
 const actual=validateDocument(doc);
 const direct=(await painter.createCanvas({width:112,height:84,colorBg:undefined,
   ...actual.canvasExtras,bgLayers:actual.canvasExtras!.bgLayers!.map(layer=>{const {nodeId:_id,...data}=layer;return data;})})).buffer;
 const scratch=await mkdtemp(join(process.cwd(),'.s12-pinned-'));
 try{
  const output=join(scratch,'s12.png'),program=join(scratch,'s12.mjs');
  const code=generateSource(actual).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(output)+', output)');
  await writeFile(program,code);await exec(process.execPath,[program],{cwd:process.cwd(),timeout:30000});
  const generated=await readFile(output);
  assert.deepEqual(await sharp(generated).ensureAlpha().raw().toBuffer(),await sharp(direct).ensureAlpha().raw().toBuffer());
  assert.deepEqual(parseSource(generateSource(actual)),actual);
 }finally{await rm(scratch,{recursive:true,force:true});}
});

test('S12: generated-code noise uses the same pinned engine distribution without inventing deterministic byte equality',async()=>{
 const doc=document();doc.canvasExtras={noiseBg:{intensity:0.7}};
 const validated=validateDocument(doc);
 assert.throws(()=>validateCanvasExtras({noiseBg:{intensity:-0.001}}),/range/);
 assert.throws(()=>validateCanvasExtras({noiseBg:{intensity:1.001}}),/range/);
 assert.throws(()=>validateCanvasExtras({noiseBg:{intensity:Infinity}}),/range/);
 assert.deepEqual(validateCanvasExtras({noiseBg:{}}),{noiseBg:{}},'omit keeps runtime 0.05 default');
 const zeros=await raw({width:112,height:84,noiseBg:{intensity:0}});
 const direct=await raw({width:112,height:84,noiseBg:{intensity:0.7}});
 assert.ok(spread(direct)>spread(zeros)+120,'public-v6 noise intensity should visibly affect decoded RGBA');
 const scratch=await mkdtemp(join(process.cwd(),'.s12-noise-'));
 try{
  const output=join(scratch,'out.png'),prog=join(scratch,'noise.mjs');
  const code=generateSource(validated).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(output)+', output)');
  await writeFile(prog,code);await exec(process.execPath,[prog],{cwd:process.cwd(),timeout:30000});
  const generated=await sharp(await readFile(output)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([generated.info.width,generated.info.height],[112,84]);
  const ratio=spread(generated)/spread(direct);
  assert.ok(ratio>0.5&&ratio<1.5,'Expected statistically comparable noise variance, ratio='+ratio);
  assert.deepEqual(parseSource(generateSource(validated)),validated);
 }finally{await rm(scratch,{recursive:true,force:true});}
});

test('S12: pattern and noise overlay options can coexist with native gradient, custom image and each other',()=>{
 const gradient={type:'linear' as const,colors:stops,endX:112};
 const combined=validateCanvasExtras({gradientBg:gradient,patternBg:solid,noiseBg:{intensity:0.2}});
 assert.deepEqual(combined.gradientBg,gradient);
 assert.deepEqual(combined.patternBg,solid);
 assert.deepEqual(combined.noiseBg,{intensity:0.2});
 assert.throws(()=>validateCanvasExtras({customBg:{source:'asset:'+'a'.repeat(64)},gradientBg:gradient}),/one primary/);
 const doc=document();doc.canvasExtras=combined;
 const g=projectCanvasGraph(doc);
 assert.ok(g.edges.some(e=>e.id==='edge:pattern-root'));
 assert.ok(g.edges.some(e=>e.id==='edge:gradient-root'));
 const patternChanged=editCanvasGraph(doc,{op:'root-pattern',value:{...solid,size:28}});
 assert.deepEqual(patternChanged.gradientBg,gradient);
 assert.deepEqual(patternChanged.noiseBg,{intensity:0.2});
 const noiseChanged=editCanvasGraph(doc,{op:'noise',value:{intensity:0.7}});
 assert.deepEqual(noiseChanged.gradientBg,gradient);
 assert.deepEqual(noiseChanged.patternBg,solid);
 const gradientChanged=editCanvasGraph(doc,{op:'gradient',value:{...gradient,rotate:25}});
 assert.deepEqual(gradientChanged.patternBg,solid);
 assert.deepEqual(gradientChanged.noiseBg,{intensity:0.2});
 assert.deepEqual(parseSource(generateSource(transactCanvasViaV2(doc,patternChanged).document)).canvasExtras,patternChanged);
});
test('S12: native gradient + ordered layers + pattern overlay survives exact public Code output without silent branch loss',async()=>{
 const doc=document();doc.canvasExtras={
  gradientBg:redBlue,patternBg:{...solid,opacity:0.65,rotation:15},
  bgLayers:[{type:'color',value:'#44cc88',opacity:0.3,nodeId:'layer:overlay-paint'}]
 };
 const validated=validateDocument(doc);
 const {nodeId:_tag,...layer}=validated.canvasExtras!.bgLayers![0];
 const direct=(await painter.createCanvas({width:112,height:84,gradientBg:redBlue,
  bgLayers:[layer],patternBg:validated.canvasExtras!.patternBg})).buffer;
 const noOverlay=(await painter.createCanvas({width:112,height:84,gradientBg:redBlue,bgLayers:[layer]})).buffer;
 assert.notDeepEqual(await sharp(direct).ensureAlpha().raw().toBuffer(),await sharp(noOverlay).ensureAlpha().raw().toBuffer());
 const tmp=await mkdtemp(join(process.cwd(),'.s12-overlay-'));
 try{
  const output=join(tmp,'out.png'),prog=join(tmp,'composition.mjs');
  await writeFile(prog,generateSource(validated).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(output)+', output)'));
  await exec(process.execPath,[prog],{cwd:process.cwd(),timeout:30000});
  const generated=await readFile(output);
  assert.deepEqual(await sharp(generated).ensureAlpha().raw().toBuffer(),await sharp(direct).ensureAlpha().raw().toBuffer());
 }finally{await rm(tmp,{force:true,recursive:true});}
});
test('S12: original bundled image with native pattern overlay retains photo as base rather than painting it over the pattern',async()=>{
 const doc=document();doc.background.mode='image';doc.background.image='/workspace/assets/crystal-lake.webp';
 doc.canvasExtras={patternBg:{...solid,opacity:0.48}};
 const validated=validateDocument(doc);
 const artwork=await readFile(join(process.cwd(),'public/workspace/assets/crystal-lake.webp'));
 const direct=(await painter.createCanvas({width:112,height:84,
   customBg:{source:join(process.cwd(),'public/workspace/assets/crystal-lake.webp'),fit:'cover'},
   patternBg:validated.canvasExtras!.patternBg})).buffer;
 const base=(await painter.createCanvas({width:112,height:84,
   customBg:{source:join(process.cwd(),'public/workspace/assets/crystal-lake.webp'),fit:'cover'}})).buffer;
 assert.notDeepEqual(await sharp(direct).raw().toBuffer(),await sharp(base).raw().toBuffer());
 const tmp=await mkdtemp(join(process.cwd(),'.s12-legacy-overlay-'));
 try{
  const output=join(tmp,'out.png'),prog=join(tmp,'composition.mjs');
  await writeFile(prog,generateSource(validated).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(output)+', output)'));
  await exec(process.execPath,[prog],{cwd:process.cwd(),timeout:30000});
  const generated=await readFile(output);
  assert.deepEqual(await sharp(generated).ensureAlpha().raw().toBuffer(),await sharp(direct).ensureAlpha().raw().toBuffer());
 }finally{await rm(tmp,{force:true,recursive:true});}
});
