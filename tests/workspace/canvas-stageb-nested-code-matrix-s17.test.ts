import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';import {join} from 'node:path';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {ApexPainter} from 'apexify.js';import sharp from 'sharp';
import {validateCanvasExtras,type CanvasExtras} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {parseSource,generateSource} from '../../features/apex-workspace/codegen';
import {projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
const runner=promisify(execFile),painter=new ApexPainter();
const colors=[{stop:0,color:'#f62367'},{stop:1,color:'#16bef6'}];
type Group='rootPattern'|'layerPattern'|'stroke'|'shadow';
type Kind='linear'|'radial'|'conic';
type Scalar='gradient'|'type'|'colors'|'colors.color'|'colors.stop'|'startX'|'startY'|'endX'|'endY'|'startRadius'|'endRadius'|'centerX'|'centerY'|'repeat'|'rotate'|'pivotX'|'pivotY';
const roots:Record<Group,string>={rootPattern:'canvas.patternBg.gradient',layerPattern:'canvas.bgLayers.pattern.gradient',stroke:'canvas.stroke.gradient',shadow:'canvas.shadow.gradient'};
function g(kind:Kind){
 if(kind==='linear')return {type:kind,colors:colors.map(x=>({...x})),startX:0,startY:0,endX:140,endY:30};
 if(kind==='radial')return {type:kind,colors:colors.map(x=>({...x})),startX:10,startY:10,endX:65,endY:50,startRadius:0,endRadius:100};
 return {type:kind,colors:colors.map(x=>({...x})),centerX:82,centerY:66};
}
function paint(group:Group,gradient:Record<string,unknown>|null):CanvasExtras{
 const pat={type:'grid',size:13,spacing:21,opacity:1,...(gradient?{gradient}:{color:'#ff3366',secondaryColor:'#1166dd'})};
 if(group==='rootPattern')return {patternBg:pat as any};
 if(group==='layerPattern')return {bgLayers:[{type:'presetPattern',nodeId:'layer:stage-b-painted-pattern',pattern:pat} as any]};
 if(group==='stroke')return {stroke:{width:28,opacity:1,style:'solid',borderRadius:28,...(gradient?{gradient}:{color:'#dd33cc'})} as any};
 return {borderRadius:36,shadow:{offsetX:25,offsetY:18,blur:0,opacity:1,...(gradient?{gradient}:{color:'#ee66bb'})} as any};
}
function choose(key:Scalar):Kind{if(['centerX','centerY'].includes(key))return 'conic';if(['startRadius','endRadius'].includes(key))return 'radial';return 'linear'}
function value(key:Scalar,base:boolean){
 const kind=choose(key);
 if(key==='gradient')return base?null:g('linear');
 if(key==='type')return g(base?'linear':'radial');
 const obj:Record<string,any>={...g(kind)};
 if(key==='colors')obj.colors=base?colors.map(x=>({...x})):[{stop:0,color:'#f62367'},{stop:0.5,color:'#adff30'},{stop:1,color:'#16bef6'}];
 else if(key==='colors.color')obj.colors=[{stop:0,color:base?'#f62367':'#41ff32'},{stop:1,color:'#16bef6'}];
 else if(key==='colors.stop')obj.colors=[{stop:0,color:'#f62367'},{stop:base?1:0.46,color:'#16bef6'}];
 else if(key==='repeat'){obj.endX=21;obj.endY=0;obj.repeat=base?'no-repeat':'repeat';}
 else if(key==='rotate'){obj.rotate=base?0:47;}
 else if(key==='pivotX'){obj.rotate=45;obj.pivotX=base?0:65;}
 else if(key==='pivotY'){obj.rotate=45;obj.pivotY=base?0:70;}
 else if(key==='startX')obj.startX=base?0:22;
 else if(key==='startY')obj.startY=base?0:16;
 else if(key==='endX')obj.endX=base?140:88;
 else if(key==='endY')obj.endY=base?30:95;
 else if(key==='startRadius')obj.startRadius=base?0:20;
 else if(key==='endRadius')obj.endRadius=base?100:154;
 else if(key==='centerX')obj.centerX=base?82:112;
 else if(key==='centerY')obj.centerY=base?66:111;
 return obj;
}
function options(group:Group,key:Scalar,base:boolean){
 const v=value(key,base);
 if(group==='shadow'&&key==='startRadius'&&v&&typeof v==='object')
   Object.assign(v,{startX:120,startY:90,endX:120,endY:90,endRadius:130,startRadius:base?0:35});
 return paint(group,v as Record<string,unknown>|null);
}
function document(extras:CanvasExtras){
 const d=createBlankDocument();d.width=256;d.height=184;d.layers=[];d.background={...d.background,mode:'color',transparent:false,color:'#204671'};
 d.canvasExtras=validateCanvasExtras(extras);return validateDocument(d);
}
function nativeCfg(doc:ReturnType<typeof document>){
 const deep=(x:unknown):unknown=>!x||typeof x!=='object'?x:Array.isArray(x)?x.map(deep):Object.fromEntries(Object.entries(x as Record<string,unknown>).filter(([k])=>k!=='nodeId').map(([k,v])=>[k,deep(v)]));
 return {width:doc.width,height:doc.height,colorBg:'#204671',...deep(doc.canvasExtras) as Record<string,unknown>};
}
const rgba=async(bytes:Buffer)=>sharp(bytes).ensureAlpha().raw().toBuffer();
const common:Scalar[]=['gradient','type','colors','colors.color','colors.stop','startX','startY','endX','endY','startRadius','endRadius','centerX','centerY','repeat'];
const cases:{group:Group;key:Scalar;path:string}[]=[];
for(const group of ['rootPattern','layerPattern','stroke','shadow'] as Group[]){
 for(const key of [...common,...((group==='stroke'||group==='shadow')?['rotate','pivotX','pivotY'] as Scalar[]:[])]){
  if(group==='shadow'&&key==='repeat')continue; // known native-inert shadow leaf
  cases.push({group,key,path:roots[group]+(key==='gradient'?'':'.'+key)});
 }
}
assert.equal(cases.length,61);
for(const item of cases)test('S17 nested independently executable Code, pinned native effective, graph '+item.path,async()=>{
 const before=document(options(item.group,item.key,true)),doc=document(options(item.group,item.key,false));
 const parsed=parseSource(generateSource(doc));
 assert.deepEqual(parsed,doc,'Canonical parser roundtrip');
 assert.ok(projectCanvasGraph(doc).nodes.length>0,'Graph had no source node');
 const a=await rgba((await painter.createCanvas(nativeCfg(doc))).buffer);
 const b=await rgba((await painter.createCanvas(nativeCfg(before))).buffer);
 assert.notDeepEqual(a,b,'Pinned native inert on '+item.path);
 const dir=await mkdtemp(join(process.cwd(),'.stageb-nested-'));
 try{
  const file=join(dir,'script.mjs'),out=join(dir,'render.png');
  const js=generateSource(doc);
  assert.ok(js.includes("writeFile('output.png', output)"));
  await writeFile(file,js.replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(out)+', output)'));
  await runner(process.execPath,[file],{cwd:process.cwd(),timeout:30000});
  assert.deepEqual(await rgba(await readFile(out)),a,'Code pixels differ: '+item.path);
  console.log('S17_NESTED_STRICT_PASS='+item.path);
 }finally{await rm(dir,{recursive:true,force:true,maxRetries:10,retryDelay:140})}
});
