import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasExtras,type CanvasExtras,type CanvasGradient,type CanvasPattern,type CanvasStroke} from '../../features/apex-workspace/canvas-options';
import {projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const run=promisify(execFile),painter=new ApexPainter();
const colors=[{stop:0,color:'#f82032'},{stop:1,color:'#175add'}];
const linear:CanvasGradient={type:'linear',colors,startX:0,startY:0,endX:40,endY:0};
const radial:CanvasGradient={type:'radial',colors,startX:30,startY:30,startRadius:0,endX:30,endY:30,endRadius:32};
const conic:CanvasGradient={type:'conic',colors,centerX:48,centerY:36,startAngle:10};
const pattern:CanvasPattern={type:'grid',color:'#fa2345',secondaryColor:'#223377',size:16,spacing:20,opacity:0.7};
const stroke:CanvasStroke={color:'#ff3455',width:10,style:'solid',opacity:1,blur:0,position:0};
type Case={path:string;current:CanvasExtras;baseline:CanvasExtras;edge:string;browserExpected:boolean};
const candidates:Case[]=[
 ...([
  ['startX',{...linear,startX:14},linear],
  ['startY',{...linear,startY:12},linear],
  ['endX',{...linear,endX:69},linear],
  ['endY',{...linear,endY:22},linear],
  ['rotate',{...linear,rotate:42},linear],
  ['pivotX',{...linear,rotate:42,pivotX:11},{...linear,rotate:42,pivotX:48}],
  ['pivotY',{...linear,rotate:42,pivotY:9},{...linear,rotate:42,pivotY:36}],
  ['startRadius',{...radial,startRadius:8},radial],
  ['endRadius',{...radial,endRadius:49},radial],
  ['centerX',{...conic,centerX:33},conic],
  ['centerY',{...conic,centerY:19},conic],
  ['colors.color',{...linear,colors:[colors[0],{stop:1,color:'#99ff00'}]},linear],
  ['colors.stop',{...linear,colors:[colors[0],{stop:0.55,color:'#175add'}]},linear]
 ] as [string,CanvasGradient,CanvasGradient][]).map(([key,value,before])=>({
  path:'canvas.gradientBg.'+key,current:{gradientBg:value},baseline:{gradientBg:before},edge:'edge:gradient-root',browserExpected:true
 })),
 ...([
  ['size',{...pattern,size:29},pattern],
  ['spacing',{...pattern,spacing:35},pattern],
  ['opacity',{...pattern,opacity:0.3},pattern],
  ['rotation',{...pattern,rotation:37},pattern],
  ['scale',{...pattern,scale:1.7},pattern],
  ['offsetX',{...pattern,offsetX:28},pattern],
  ['offsetY',{...pattern,offsetY:22},pattern],
  ['color',{...pattern,color:'#10e62a'},pattern],
  ['secondaryColor',{...pattern,secondaryColor:'#e6a310'},pattern],
  ['type',{...pattern,type:'dots'},pattern]
 ] as [string,CanvasPattern,CanvasPattern][]).map(([key,value,before])=>({
  path:'canvas.patternBg.'+key,current:{patternBg:value},baseline:{patternBg:before},edge:'edge:pattern-root',browserExpected:true
 })),
 ...([
  ['style',{...stroke,style:'dashed'},stroke],
  ['width',{...stroke,width:20},stroke],
  ['opacity',{...stroke,opacity:0.35},stroke],
  ['blur',{...stroke,blur:7},stroke],
  ['position',{...stroke,position:12},stroke]
 ] as [string,CanvasStroke,CanvasStroke][]).map(([key,value,before])=>({
  path:'canvas.stroke.'+key,current:{stroke:value},baseline:{stroke:before},edge:'edge:stroke-root',browserExpected:true
 })),
 ...([
  ['scale',{zoom:{scale:1.5,centerX:32,centerY:20}},{zoom:{scale:1,centerX:32,centerY:20}}],
  ['centerX',{zoom:{scale:1.8,centerX:24,centerY:36}},{zoom:{scale:1.8,centerX:48,centerY:36}}],
  ['centerY',{zoom:{scale:1.8,centerX:48,centerY:25}},{zoom:{scale:1.8,centerX:48,centerY:36}}]
 ] as [string,CanvasExtras,CanvasExtras][]).map(([key,value,before])=>({
  path:'canvas.zoom.'+key,current:{...value,gradientBg:radial},baseline:{...before,gradientBg:radial},edge:'edge:gradient-root',browserExpected:true
 })),
];
const ids=new Set(candidates.map(x=>x.path));
assert.equal(ids.size,candidates.length);
function makeDoc(extras:CanvasExtras){
 const d=createBlankDocument();d.width=96;d.height=72;d.layers=[];d.background={...d.background,mode:'color',transparent:false,color:'#12213c'};
 d.canvasExtras=validateCanvasExtras(extras);
 return validateDocument(d);
}
const output=(extras:CanvasExtras)=>({width:96,height:72,...(extras.gradientBg?{gradientBg:extras.gradientBg}:extras.customBg?{customBg:extras.customBg}:{colorBg:'#12213c'}),...extras});
for(const c of candidates)test('S12 exact native + standalone public-v6 Code + Graph + canonical: '+c.path,async()=>{
 const doc=makeDoc(c.current),before=makeDoc(c.baseline);
 assert.deepEqual(parseSource(generateSource(doc)),doc);
 assert.deepEqual(transactCanvasViaV2(doc,doc.canvasExtras!).document,doc);
 const graph=projectCanvasGraph(doc);
 assert.ok(graph.edges.some(e=>e.id===c.edge),'Real graph port missing: '+c.edge);
 const actual=(await painter.createCanvas(output(doc.canvasExtras!))).buffer;
 const original=(await painter.createCanvas(output(before.canvasExtras!))).buffer;
 const a=await sharp(actual).ensureAlpha().raw().toBuffer();
 const b=await sharp(original).ensureAlpha().raw().toBuffer();
 assert.notDeepEqual(a,b,'Native raster is inert for '+c.path);
 const scratch=await mkdtemp(join(process.cwd(),'.s12path-'));
 try{
  const name=join(scratch,'out.png'),program=join(scratch,'program.mjs');
  await writeFile(program,generateSource(doc).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(name)+', output)'));
  await run(process.execPath,[program],{cwd:process.cwd(),timeout:30000});
  const code=(await readFile(name));
  assert.deepEqual(await sharp(code).ensureAlpha().raw().toBuffer(),a,'Independent public-v6 execution differs for '+c.path);
 }finally{await rm(scratch,{recursive:true,force:true});}
});
test('S12 reusable per-path manifest defines unique, individually exercised identities',()=>{
 assert.equal(candidates.length,31);
 assert.equal(new Set(candidates.map(x=>x.path)).size,31);
 assert.ok(candidates.every(c=>c.browserExpected),'Every path needs explicit browser test; node-only cannot certify');
});
