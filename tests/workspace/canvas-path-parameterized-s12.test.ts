import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {editCanvasGraph,projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const painter=new ApexPainter();
type Config=Parameters<ApexPainter['createCanvas']>[0];
const colors=[{stop:0,color:'#f82032'},{stop:1,color:'#175add'}];
const base:Config={width:96,height:72,colorBg:'#305776'};
async function png(c:Config){return sharp((await painter.createCanvas(c)).buffer).ensureAlpha().raw().toBuffer();}
async function changes(a:Config,b:Config):Promise<boolean>{return !(await png(a)).equals(await png(b));}
const linear={type:'linear' as const,colors,startX:0,startY:0,endX:40,endY:0};
const radial={type:'radial' as const,colors,startX:30,startY:30,startRadius:0,endX:30,endY:30,endRadius:32};
const conic={type:'conic' as const,colors,centerX:48,centerY:36,startAngle:10};
const numberedGradientCases=[
 {path:'canvas.gradientBg.startX',gradient:{...linear,startX:14},base:linear},
 {path:'canvas.gradientBg.startY',gradient:{...linear,startY:12},base:linear},
 {path:'canvas.gradientBg.endX',gradient:{...linear,endX:69},base:linear},
 {path:'canvas.gradientBg.endY',gradient:{...linear,endY:22},base:linear},
 {path:'canvas.gradientBg.rotate',gradient:{...linear,rotate:42},base:linear},
 {path:'canvas.gradientBg.pivotX',gradient:{...linear,rotate:42,pivotX:11},base:{...linear,rotate:42,pivotX:48}},
 {path:'canvas.gradientBg.pivotY',gradient:{...linear,rotate:42,pivotY:9},base:{...linear,rotate:42,pivotY:36}},
 {path:'canvas.gradientBg.startRadius',gradient:{...radial,startRadius:8},base:radial},
 {path:'canvas.gradientBg.endRadius',gradient:{...radial,endRadius:49},base:radial},
 {path:'canvas.gradientBg.centerX',gradient:{...conic,centerX:33},base:conic},
 {path:'canvas.gradientBg.centerY',gradient:{...conic,centerY:19},base:conic},
 {path:'canvas.gradientBg.colors.color',gradient:{...linear,colors:[colors[0],{stop:1,color:'#99ff00'}]},base:linear},
 {path:'canvas.gradientBg.colors.stop',gradient:{...linear,colors:[colors[0],{stop:0.55,color:'#175add'}]},base:linear}
];
for(const item of numberedGradientCases){
 test('S12 path runtime change and canonical/code roundtrip: '+item.path,async()=>{
  assert.ok(await changes({width:96,height:72,gradientBg:item.base},{width:96,height:72,gradientBg:item.gradient}),item.path+' must alter painted pixels');
  const doc=createBlankDocument();doc.width=96;doc.height=72;doc.layers=[];doc.canvasExtras=validateCanvasExtras({gradientBg:item.gradient});
  const validated=validateDocument(doc);
  assert.deepEqual(parseSource(generateSource(validated)),validated);
  const tx=transactCanvasViaV2(validated,validated.canvasExtras!);
  assert.deepEqual(tx.document,validated);
  const graph=projectCanvasGraph(validated);
  assert.ok(graph.edges.some(x=>x.id==='edge:gradient-root'));
 });
}
test('S22 conic startAngle changes native pixels at every nonzero tested angle',async()=>{
 const a=await png({width:96,height:72,gradientBg:{...conic,startAngle:0}});
 for(const degree of [35,90,180,270]){
   const b=await png({width:96,height:72,gradientBg:{...conic,startAngle:degree}});
   assert.notDeepEqual(a,b,'S22 native conic startAngle must change raw pixels at degree '+degree);
 }
});
for(const repeat of ['repeat','reflect','no-repeat'] as const){
 test('S12 enum/path CanvasGradient repeat is accepted, code-preserved and executed: '+repeat,async()=>{
  const gradient={...linear,repeat};
  const doc=createBlankDocument();doc.width=96;doc.height=72;doc.layers=[];doc.canvasExtras=validateCanvasExtras({gradientBg:gradient});
  assert.equal(doc.canvasExtras.gradientBg?.repeat,repeat);
  const roundtrip=parseSource(generateSource(doc));assert.equal(roundtrip.canvasExtras?.gradientBg?.repeat,repeat);
  const painted=await png({width:96,height:72,gradientBg:gradient});
  assert.equal(painted.length,96*72*4);
 });
}
for(const type of ['grid','dots','diagonal','stripes','waves','crosses','hexagons','checkerboard','diamonds','triangles','stars','polka'] as const){
 test('S12 pinned procedural pattern kind paints, persists and roundtrips: '+type,async()=>{
  const pattern={type,color:'#ff5533',secondaryColor:'#002244',size:15,spacing:18,opacity:0.7};
  const doc=createBlankDocument();doc.width=96;doc.height=72;doc.layers=[];doc.canvasExtras=validateCanvasExtras({patternBg:pattern});
  const v=validateDocument(doc);
  assert.equal(parseSource(generateSource(v)).canvasExtras?.patternBg?.type,type);
  const gradient=projectCanvasGraph(v);
  assert.ok(gradient.nodes.some(n=>n.id==='canvas:pattern:root'));
  const image=await png({width:96,height:72,patternBg:pattern});
  assert.ok(new Set(Array.from(image.filter((_,i)=>i%4===0))).size>1,'Type '+type+' must paint spatial pattern');
 });
}
for(const style of ['solid','dashed','dotted','groove','ridge','double'] as const){
 test('S12 pinned stroke style validates, persists and paints: '+style,async()=>{
  const doc=createBlankDocument();doc.width=96;doc.height=72;doc.layers=[];doc.canvasExtras=validateCanvasExtras({stroke:{color:'#ff4455',width:12,style}});
  const v=validateDocument(doc);
  assert.equal(parseSource(generateSource(v)).canvasExtras?.stroke?.style,style);
  assert.ok(projectCanvasGraph(v).edges.some(e=>e.id==='edge:stroke-root'));
  const raw=await png({width:96,height:72,colorBg:'#101322',stroke:{color:'#ff4455',width:12,style}});
  assert.ok(raw.includes(255),'Style must render colored pixels');
 });
}
for(const value of [0,0.2,0.7,1] as const){
 test('S12 pinned layer alpha, gradient and noise intensity execute: '+value,async()=>{
  const opts=validateCanvasExtras({bgLayers:[{type:'color',value:'#fa2060',opacity:value}],noiseBg:{intensity:value}});
  const v=createBlankDocument();v.width=96;v.height=72;v.layers=[];v.canvasExtras=opts;
  const tx=transactCanvasViaV2(v,opts);
  assert.deepEqual(tx.document.canvasExtras?.bgLayers,opts.bgLayers);
  const img=await png({...base,bgLayers:[{type:'color',value:'#fa2060',opacity:value}]});
  assert.equal(img.length,96*72*4);
 });
}
for(const mode of ['source-over','multiply','screen','overlay'] as const){
 test('S12 four safe layer composite modes apply to native decoded pixels: '+mode,async()=>{
  assert.ok(await changes({...base,bgLayers:[{type:'color',value:'#ad513f',blendMode:'source-over'}]},
    {...base,bgLayers:[{type:'color',value:'#ad513f',blendMode:mode,opacity:0.5}]}));
 });
}
test('S12 26 video leaves remain blocked and untrusted media cannot enter the portable workspace',()=>{
 const unsupported=[
  'videoBg','videoBg.source','videoBg.frame','videoBg.time','videoBg.format','videoBg.quality',
  'videoBg.filters','videoBg.loop','videoBg.autoplay','videoBg.fit','videoBg.align'
 ];
 for(const key of unsupported){
  assert.throws(()=>validateCanvasExtras({[key.split('.')[0]]:{source:'https://evil.invalid/clip.mp4',frame:1}}),/unsupported keys/);
 }
 assert.throws(()=>validateCanvasExtras({customBg:{source:'https://evil.invalid/a.png'}}),/content-addressed/);
});

test('S12 FULL candidate stroke.style all six variants produce pairwise-distinct native pixels, typed Graph and Code',async()=>{
 const styles=['solid','dashed','dotted','groove','ridge','double'] as const;
 const rendered=new Map<string,Buffer>();
 for(const style of styles){
  const opt=validateCanvasExtras({stroke:{color:'#ff3344',width:14,style},borderRadius:10});
  const doc=createBlankDocument();doc.width=96;doc.height=72;doc.layers=[];doc.canvasExtras=opt;
  const d=validateDocument(doc);
  assert.equal(parseSource(generateSource(d)).canvasExtras?.stroke?.style,style);
  const tx=transactCanvasViaV2(d,opt);assert.equal(tx.canonical.canvas.extras?.stroke?.style,style);
  const out=projectCanvasGraph(d);assert.ok(out.nodes.some(n=>n.id==='canvas:stroke'));
  rendered.set(style,await png({width:96,height:72,colorBg:'#122145',borderRadius:10,stroke:{color:'#ff3344',width:14,style}}));
 }
 for(let i=0;i<styles.length;i++)for(let j=i+1;j<styles.length;j++)
  assert.notDeepEqual(rendered.get(styles[i]),rendered.get(styles[j]),'Styles '+styles[i]+' and '+styles[j]+' must remain distinguishable');
 assert.throws(()=>validateCanvasExtras({stroke:{style:'unsafe-custom' as never}}),/unsupported stroke style/);
});
test('S12 FULL candidate canvas.gradientBg.colors.stop full numeric interval validates with ordered stops, native pixel and Code',async()=>{
 for(const pos of [0,0.01,0.23,0.5,0.99,1]){
  const gradient={type:'linear' as const,colors:[{stop:0,color:'#ff3344'},{stop:pos,color:'#2244ff'}],endX:96};
  const opts=validateCanvasExtras({gradientBg:gradient});
  const doc=createBlankDocument();doc.width=96;doc.height=72;doc.layers=[];doc.canvasExtras=opts;
  const normalized=validateDocument(doc);
  assert.equal(normalized.canvasExtras?.gradientBg?.colors[1].stop,pos);
  assert.deepEqual(parseSource(generateSource(normalized)),normalized);
  assert.deepEqual(transactCanvasViaV2(normalized,opts).document,normalized);
  assert.equal((await png({width:96,height:72,gradientBg:gradient})).length,96*72*4);
 }
 for(const invalid of [-0.001,1.001,NaN,Infinity]){
  assert.throws(()=>validateCanvasExtras({gradientBg:{...linear,colors:[{stop:0,color:'#ff3344'},{stop:invalid,color:'#2244ff'}]}}),/outside supported range/);
 }
 assert.throws(()=>validateCanvasExtras({gradientBg:{...linear,colors:[{stop:0.8,color:'#ff3344'},{stop:0.5,color:'#2244ff'}]}}),/ordered/);
});

for(const family of ['patternBg','stroke'] as const){
 test('S12 FULL opacity contract exact [0,1] bounded native and invalid inputs: '+family,async()=>{
  for(const alpha of [0,0.001,0.2,0.5,0.999,1]){
   const c=family==='patternBg'
     ?{patternBg:{...({type:'grid',color:'#ff3355',secondaryColor:'#0044ff',size:18,spacing:22} as const),opacity:alpha}}
     :{stroke:{color:'#ff3355',width:12,opacity:alpha}};
   const options=validateCanvasExtras(c);
   const d=createBlankDocument();d.width=96;d.height=72;d.layers=[];d.canvasExtras=options;
   const validated=validateDocument(d);
   assert.deepEqual(transactCanvasViaV2(validated,options).document,validated);
   assert.deepEqual(parseSource(generateSource(validated)),validated);
   const pngBuffer=(await painter.createCanvas({width:96,height:72,colorBg:'#121e39',...options})).buffer;
   assert.equal((await sharp(pngBuffer).ensureAlpha().raw().toBuffer()).length,96*72*4);
  }
  for(const invalid of [-0.01,1.01,NaN,Infinity,-Infinity]){
   const c=family==='patternBg'
     ?{patternBg:{type:'grid',opacity:invalid}}
     :{stroke:{color:'#ff3355',width:12,opacity:invalid}};
   assert.throws(()=>validateCanvasExtras(c),/range/);
  }
 });
}
