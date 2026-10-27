import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasExtras,validateCanvasImageFilters,validatePatternGradient} from '../../features/apex-workspace/canvas-options';
import {parseSource,generateSource} from '../../features/apex-workspace/codegen';
import {projectCanvasGraph,editCanvasGraph,validateGraphTopology} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {validateImageAsset} from '../../features/apex-workspace/asset-store';
const root=process.cwd(),run=promisify(execFile),painter=new ApexPainter({type:'buffer'});
const colors=[{stop:0,color:'#fb2547'},{stop:0.19,color:'#18eba8'},{stop:0.62,color:'#2639ed'},{stop:1,color:'#fabd21'}];
const conic=(startAngle:number)=>({type:'conic' as const,centerX:61,centerY:43,startAngle,colors});
const linear=(angle:number)=>({type:'linear' as const,startX:6,startY:10,endX:27,endY:16,angle,colors});
const pattern=(g:any)=>({type:'dots' as const,size:12,spacing:13,opacity:1,gradient:g});
const shadow=(startAngle:number)=>({opacity:1,blur:0,offsetX:0,offsetY:0,gradient:conic(startAngle)});
const stroke=(startAngle:number)=>({width:18,opacity:1,gradient:conic(startAngle)});
type Case={path:string;before:any;after:any;detail:string};
const cases:Case[]=[
 {path:'canvas.gradientBg.startAngle',before:{gradientBg:conic(0)},after:{gradientBg:conic(121)},detail:'conic primary base'},
 {path:'canvas.patternBg.gradient.startAngle',before:{patternBg:pattern(conic(0))},after:{patternBg:pattern(conic(121))},detail:'pattern mask conic'},
 {path:'canvas.bgLayers.pattern.gradient.startAngle',before:{bgLayers:[{type:'presetPattern',pattern:pattern(conic(0))}]},after:{bgLayers:[{type:'presetPattern',pattern:pattern(conic(121))}]},detail:'ordered pattern conic'},
 {path:'canvas.shadow.gradient.startAngle',before:{__transparent:true,shadow:shadow(0)},after:{__transparent:true,shadow:shadow(121)},detail:'native shadow conic'},
 {path:'canvas.stroke.gradient.startAngle',before:{__transparent:true,stroke:stroke(0)},after:{__transparent:true,stroke:stroke(121)},detail:'native stroke conic'},
 {path:'canvas.patternBg.gradient.angle',before:{patternBg:pattern(linear(0))},after:{patternBg:pattern(linear(91))},detail:'separate PatternGradient angle contract'},
 {path:'canvas.bgLayers.pattern.gradient.angle',before:{bgLayers:[{type:'presetPattern',pattern:pattern(linear(0))}]},after:{bgLayers:[{type:'presetPattern',pattern:pattern(linear(91))}]},detail:'nested pattern paint angle'},
 {path:'canvas.shadow.gradient.repeat',before:{__transparent:true,shadow:{opacity:1,blur:0,gradient:{type:'linear',startX:3,startY:7,endX:24,endY:11,repeat:'no-repeat',colors}}},after:{__transparent:true,shadow:{opacity:1,blur:0,gradient:{type:'linear',startX:3,startY:7,endX:24,endY:11,repeat:'reflect',colors}}},detail:'short gradient period discriminates repeat from reflect'}
];
let imageAsset:any=null;
async function asset(){
 if(imageAsset)return imageAsset;
 const w=48,h=32,raw=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;raw[i]=(x*19+y*11)%256;raw[i+1]=(x*7+y*25)%256;raw[i+2]=((x+y)%2)*245;raw[i+3]=255;}
 const data=await sharp(raw,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
 const sha256=createHash('sha256').update(data).digest('hex');
 imageAsset=validateImageAsset({id:'asset:'+sha256,sha256,mime:'image/png',width:w,height:h,bytes:data.length,dataUri:'data:image/png;base64,'+data.toString('base64')});
 return imageAsset;
}
async function document(extras:any){
 const d=createBlankDocument();d.width=160;d.height=126;d.layers=[];
 d.background={...d.background,mode:'color',transparent:!!extras.__transparent,color:'#192e49'};
 if(extras.customBg)d.assets=[await asset()];
 const options={...extras};delete options.__transparent;
 d.canvasExtras=validateCanvasExtras(options);
 return validateDocument(d);
}
function native(doc:any){
 const ext=doc.canvasExtras||{},bg=doc.background;
 const hydrate=(value:any):any=>Array.isArray(value)?value.map(hydrate):
  value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k])=>k!=='nodeId').map(([k,v])=>[k,hydrate(v)])):
  typeof value==='string'&&value.startsWith('asset:')?doc.assets.find((a:any)=>a.id===value)?.dataUri??value:value;
 const primary=ext.customBg?{customBg:hydrate(ext.customBg)}:ext.gradientBg?{gradientBg:ext.gradientBg}:bg.transparent?{transparentBase:true}:{colorBg:bg.color};
 const {gradientBg,customBg,bgLayers,patternBg,noiseBg,...effects}=ext;
 return {width:doc.width,height:doc.height,...primary,...(bgLayers?{bgLayers:hydrate(bgLayers)}:{}),...(patternBg?{patternBg:hydrate(patternBg)}:{}),...(noiseBg?{noiseBg}:{}),...effects};
}
const rgba=async(bytes:Buffer)=>sharp(bytes).ensureAlpha().raw().toBuffer();
async function codeRaster(doc:any){
 const dir=await mkdtemp(join(root,'.s22path-'));
 try{
  const code=generateSource(doc),file=join(dir,'candidate.mjs'),out=join(dir,'native.png');
  await writeFile(file,code.replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(out)+', output)'));
  await run(process.execPath,[file],{cwd:root,timeout:30000});
  return await rgba(await readFile(out));
 }finally{await rm(dir,{recursive:true,force:true,maxRetries:6,retryDelay:80})}
}
for(const c of cases){
 test('S22 native/Code/Graph/canonical: '+c.path,async()=>{
  const before=await document(c.before),after=await document(c.after);
  assert.deepEqual(parseSource(generateSource(after)),after,'canonical Code-to-Visual');
  assert.deepEqual(transactCanvasViaV2(after,after.canvasExtras??{}).document,after,'canonical transaction');
  const graph=projectCanvasGraph(after);validateGraphTopology(graph);assert.ok(graph.nodes.length>0);
  const ex=after.canvasExtras!;
  if(ex.gradientBg)assert.deepEqual(editCanvasGraph(after,{op:'gradient',value:ex.gradientBg}).gradientBg,ex.gradientBg);
  if(ex.patternBg)assert.deepEqual(editCanvasGraph(after,{op:'root-pattern',value:ex.patternBg}).patternBg,ex.patternBg);
  if(ex.shadow)assert.deepEqual(editCanvasGraph(after,{op:'shadow',value:ex.shadow}).shadow,ex.shadow);
  if(ex.stroke)assert.deepEqual(editCanvasGraph(after,{op:'stroke',value:ex.stroke}).stroke,ex.stroke);
  if(ex.bgLayers?.[0]?.type==='presetPattern')assert.deepEqual(
   (editCanvasGraph(after,{op:'layer-pattern',index:0,value:ex.bgLayers[0].pattern}).bgLayers?.[0] as any).pattern,ex.bgLayers[0].pattern);
  const a=await rgba((await painter.createCanvas(native(after))).buffer);
  const b=await rgba((await painter.createCanvas(native(before))).buffer);
  assert.notDeepEqual(a,b,'target-only native RGBA must visibly change');
  assert.deepEqual(await codeRaster(after),a,'independently executed generated source has exact RGBA parity');
 });
}
test('S22 customBg gaussianBlur.radius native parity and Code/Visual/Graph',async()=>{
 const a=await asset(),base={customBg:{source:a.id,filters:[{type:'gaussianBlur',radius:2}]}},
  changed={customBg:{source:a.id,filters:[{type:'gaussianBlur',radius:8}]}};
 const before=await document(base),after=await document(changed);
 assert.deepEqual(parseSource(generateSource(after)),after);
 assert.deepEqual(transactCanvasViaV2(after,after.canvasExtras??{}).document,after);
 validateGraphTopology(projectCanvasGraph(after));
 const aa=await rgba((await painter.createCanvas(native(after))).buffer);
 const bb=await rgba((await painter.createCanvas(native(before))).buffer);
 assert.notDeepEqual(aa,bb,'radius changes native filtered pixels');
 assert.deepEqual(await codeRaster(after),aa);
 assert.throws(()=>validateCanvasImageFilters([{type:'grayscale',radius:4}]));
 assert.throws(()=>validateCanvasImageFilters([{type:'gaussianBlur',radius:4,intensity:2}]));
});
test('S22 pattern gradient angle validator recognizes all discriminants and rejects incompatible geometry',()=>{
 const radial={type:'radial',colors,startX:10,startY:15,endX:50,endY:75,startRadius:0,endRadius:30,angle:70};
 const con={type:'conic',colors,centerX:30,centerY:40,startAngle:23,angle:45};
 assert.equal(validatePatternGradient(radial).angle,70);
 assert.equal(validatePatternGradient(con).angle,45);
 assert.throws(()=>validatePatternGradient({...con,repeat:'reflect'}));
});
