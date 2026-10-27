/**
 * IMG01 Stage C: attempt every exact READY path from the strict 351-record ledger.
 * Native source / semantic model / graph / Code-parity fixture tests are per path.
 * Browser and control-level checks are *not* inferred from these Node fixtures.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,newLayer,validateDocument} from '../../features/apex-workspace/model';
import {imageArguments,groupArguments} from '../../features/apex-workspace/image-runtime';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
test('IMG01 exact 330 READY path matrix',{skip:process.env.IMG01_STRICT_CAMPAIGN==='1'?false:'Explicit opt-in: set IMG01_STRICT_CAMPAIGN=1 for the 330-process strict campaign'},async()=>{
const exec=promisify(execFile),digest=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const input=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json','utf8'));
const targets=input.records.filter((r:any)=>r.stageAStatus==='WORKSPACE_READY');
assert.equal(targets.length,330);
const out='docs/workspace/IMG01_READY_OPTION_MATRIX.json',painter=new ApexPainter({type:'buffer'});
const colors=[{stop:0,color:'#fa355b'},{stop:1,color:'#17d6c4'}];
const xy=(x:number,y:number)=>({x,y});
const mesh=[[xy(0,0),xy(44,2)],[xy(1,40),xy(42,39)]];
const quad=[xy(0,0),xy(44,0),xy(43,40),xy(0,40)];
const handle={from:xy(13,12),to:xy(23,19),radius:16,strength:0.8,falloff:'smooth'};
const origin=()=>({width:120,height:100,color:'#172438'});
const imageBytes=await sharp(Buffer.from('<svg width="44" height="40"><rect width="44" height="40" fill="#f03"/><circle cx="26" cy="22" r="12" fill="#39e9ab"/><rect x="6" y="6" width="13" height="17" fill="#2a47e3"/></svg>')).png().toBuffer();
const asset={id:'asset:'+digest(imageBytes),sha256:digest(imageBytes),mime:'image/png',bytes:imageBytes.length,width:44,height:40,dataUri:'data:image/png;base64,'+imageBytes.toString('base64')};
const bundled=await readFile('public/workspace/assets/crystal-lake.webp');
type Any=Record<string,any>;
function gradient(path:string):Any{
 const field=path.split('.').at(-1)??'',t=field==='startRadius'||field==='endRadius'?'radial':field==='centerX'||field==='centerY'?'conic':'linear';
 const g:Any={type:t,colors:structuredClone(colors)};
 if(t==='radial')Object.assign(g,{startX:7,startY:7,startRadius:3,endX:28,endY:20,endRadius:35});
 if(t==='conic')Object.assign(g,{centerX:23,centerY:20});
 if(t==='linear')Object.assign(g,{startX:0,startY:0,endX:39,endY:38});
 const values:Any={startX:7,startY:9,endX:32,endY:37,pivotX:24,pivotY:22,rotate:35,startRadius:6,endRadius:30,centerX:26,centerY:21};
 if(field==='type')g.type='radial',Object.assign(g,{startRadius:2,endRadius:37});
 else if(field==='colors')g.colors=[{stop:0,color:'#ffee00'},{stop:1,color:'#113bee'}];
 else if(path.endsWith('.colors.color'))g.colors[0].color='#fe9214';
 else if(path.endsWith('.colors.stop'))g.colors[0].stop=0.15;
 else if(values[field]!==undefined)g[field]=values[field];
 return g;
}
function filters(path:string):Any[]{
 const field=path.split('.').at(-1)??'';
 const type=field==='angle'?'motionBlur':['centerX','centerY'].includes(field)?'radialBlur':
 ['x','y','width','height','size'].includes(field)?'pixelate':field==='levels'?'posterize':
 field==='value'?'brightness':field==='type'?'sepia':'gaussianBlur';
 const f:Any={type};
 if(type==='gaussianBlur')Object.assign(f,{radius:3,intensity:1});
 if(type==='motionBlur')Object.assign(f,{radius:4,intensity:1,angle:40});
 if(type==='radialBlur')Object.assign(f,{radius:5,intensity:1,centerX:18,centerY:16});
 if(type==='pixelate')Object.assign(f,{size:5,x:1,y:1,width:40,height:37});
 if(type==='posterize')f.levels=5;
 if(type==='brightness')f.value=1.5;
 const values:Any={angle:65,centerX:21,centerY:18,height:31,intensity:1.5,levels:3,size:7,value:1.7,width:33,x:2,y:3};
 if(field in values)f[field]=values[field];
 return [f];
}
function distortion(path:string):Any{
 const f=path.split('.').at(-1)??'';
 const warp=/controlPoints|\.from|\.to|\.falloff|\.strength/.test(path)||
 (path.includes('distortion.controlPoints.'));
 const geom=/\.points/.test(path);
 const wave=['amplitudeX','amplitudeY','wavelengthX','wavelengthY','phaseX','phaseY'].includes(f);
 const twirl=f==='angle';
 const type=warp?'warp':geom?'perspective':wave?'wave':twirl?'twirl':'bulge';
 const o:Any={type};
 if(warp)o.controlPoints=[structuredClone(handle)];
 if(geom)o.points=structuredClone(quad);
 if(wave)Object.assign(o,{amplitudeX:6,amplitudeY:4,wavelengthX:20,wavelengthY:23,phaseX:15,phaseY:25});
 if(twirl)Object.assign(o,{intensity:0.8,angle:100,centerX:22,centerY:19,radius:19});
 if(type==='bulge')Object.assign(o,{intensity:0.6,centerX:21,centerY:18,radius:21});
 const values:Any={amplitudeX:8,amplitudeY:7,wavelengthX:24,wavelengthY:26,phaseX:35,phaseY:40,angle:135,centerX:22,centerY:21,intensity:0.75,radius:23};
 if(fieldIn(f,values))o[f]=values[f];
 if(f==='type')o.type='pinch';
 if(f==='edgeMode')o.edgeMode='clamp';
 if(f==='interpolation')o.interpolation='nearest';
 if(f==='falloff')o.controlPoints[0].falloff='gaussian';
 if(f==='strength')o.controlPoints[0].strength=0.55;
 if(f==='from'||path.endsWith('from.x')||path.endsWith('from.y'))o.controlPoints[0].from=xy(10,16);
 if(f==='to'||path.endsWith('to.x')||path.endsWith('to.y'))o.controlPoints[0].to=xy(28,25);
 if(path.includes('controlPoints.radius'))o.controlPoints[0].radius=12;
 if(f==='points'||path.endsWith('points.x')||path.endsWith('points.y'))o.points=[xy(1,2),xy(41,0),xy(42,38),xy(2,40)];
 return o;
}
function fieldIn(f:string,o:Any){return Object.prototype.hasOwnProperty.call(o,f)}
function effect(path:string):Any{
 const key=['vignette','lensFlare','filmGrain','chromaticAberration'].find(k=>path.includes('.'+k));
 if(!key)return {vignette:{intensity:0.55,size:0.6}};
 return {[key]:key==='vignette'?{intensity:0.6,size:0.5}:key==='lensFlare'?{x:25,y:20,intensity:0.7}:{intensity:0.65}};
}
function property(root:string,path:string):any{
 const parts=path.split('.'),last=parts.at(-1)??'';
 if(root==='boxBackground')return path.includes('.gradient')?{gradient:gradient(path)}:{color:'#ef7a2c'};
 if(root==='stroke'||root==='shadow'){
  const v:Any=root==='stroke'?{color:'#fc7d3a',width:7,opacity:0.85}:{color:'#f36a4d',offsetX:7,offsetY:4,blur:5,opacity:0.85};
  if(path.includes('.gradient')){delete v.color;v.gradient=gradient(path);}
  const vals:Any={blur:4,borderRadius:9,borderPosition:'top-left',roundedCorners:'top-left',opacity:0.6,position:3,style:'dashed',width:11,offsetX:11,offsetY:9};
  if(last in vals&&!path.includes('.gradient'))v[last]=vals[last];
  if(last==='color'&&!path.includes('.gradient'))v.color='#0ccfa7';
  return v;
 }
 if(root==='shape'){
  const vals:Any={color:'#ff8c23',fill:true,centerX:21,centerY:20,endAngle:270,innerRadius:10,outerRadius:23,radius:23,sides:6,startAngle:20};
  const v:Any={fill:true,color:'#fa792b'};
  if(path.includes('.gradient')){delete v.color;v.gradient=gradient(path);}
  if(path.includes('.points'))v.points=[xy(0,0),xy(43,0),xy(37,39),xy(4,37)];
  if(last in vals&&!path.includes('.gradient'))v[last]=vals[last];
  return v;
 }
 if(root==='filters')return filters(path);
 if(root==='distortion')return distortion(path);
 if(root==='meshWarp'){
  const v:Any={gridX:1,gridY:1,controlPoints:structuredClone(mesh),interpolation:'bilinear',edgeMode:'clamp'};
  if(last==='interpolation')v.interpolation='nearest';
  if(last==='edgeMode')v.edgeMode='mirror';
  if(last==='gridX')v.gridX=1;
  if(last==='gridY')v.gridY=1;
  if(path.includes('.controlPoints'))v.controlPoints=[[xy(2,1),xy(42,3)],[xy(1,39),xy(43,36)]];
  return v;
 }
 if(root==='mask')return {source:asset.id,mode:last==='mode'?'inverse':'alpha'};
 if(root==='clipPath')return [xy(0,0),xy(44,0),xy(20,40)];
 if(root==='effects')return effect(path);
 const direct:Any={align:'bottom-right',blendMode:'multiply',blur:2,borderPosition:'top-left',borderRadius:8,
 filterIntensity:1.4,filterOrder:'post',fit:'contain',inherit:false,opacity:0.75,rotation:19,
 scaleX:1.18,scaleY:0.84,pivotX:20,pivotY:17,translateX:7,translateY:3};
 return direct[root];
}
const retry=process.env.IMG01_MATRIX_RETRY_FAILED==='1';
const previous=retry?JSON.parse(await readFile(out,'utf8')).records:[];
const rerunPaths=new Set<string>(previous.filter((r:any)=>r.issue).map((r:any)=>r.path));
const results:any[]=retry?previous:[];
const tmp=await mkdtemp(join(process.cwd(),'tests/workspace/.img01-ready-matrix-'));
try{
 for(let i=0;i<targets.length;i++){
  const row=targets[i],parts=row.path.split('.');
  if(retry&&!rerunPaths.has(row.path))continue;
  const group=row.path.startsWith('options.'),root=group?(parts.length===2?parts[1]:parts[2]):parts[1];
  const record:any={id:row.id,path:row.path,index:i,group,root,assertions:{},evidenceIds:[],source:row.source,issue:null};
  try{
   const w=origin(),d=createBlankDocument();d.width=w.width;d.height=w.height;d.background={...d.background,mode:'color',color:w.color};d.assets=[asset as any];
   const isShape=root==='shape';
   const l=newLayer(isShape?'shape':'image','cert_'+i,isShape?'star':asset.id);
   Object.assign(l,{x:12,y:8,width:44,height:40,rotation:0,opacity:1,visible:true});
   if(isShape&&row.path.includes('.points')){(l as Any).source='polygon';}
   if(isShape&&(row.path.endsWith('.startAngle')||row.path.endsWith('.endAngle')||row.path.endsWith('.radius'))) (l as Any).source='pieSlice';
   const v=property(root,row.path);
   if(group){
    d.imageGroups=[{id:'group:cert',name:'Certified',transform:root==='isGrouped'||root==='groupTransform'?{translateX:8}:{[root]:v}} as any];
    (l as Any).imageGroupId='group:cert';const other=newLayer('image','other_'+i,asset.id);Object.assign(other,{x:54,y:25,width:32,height:30,imageGroupId:'group:cert'});d.layers=[l,other];
   }else{
    if(['x','y','width','height','rotation','opacity'].includes(root))(l as Any)[root]=root==='width'?55:root==='height'?48:root==='x'?20:root==='y'?15:root==='rotation'?23:0.6;
    else if(root==='source')(l as Any).source=asset.id;
    else (l as Any).imageOptions={[root]:v};
    d.layers=[l];
   }
   const vdoc=validateDocument(d);
   record.assertions.modelValid=true;record.evidenceIds.push('READY-MODEL-'+i);
   const source=generateSource(vdoc);
   const decoded=parseSource(source);
   assert.deepEqual(decoded,vdoc);
   record.assertions.canonicalCodeRoundTrip=true;
   const graph=projectCanvasGraph(vdoc);
   assert.ok(graph.nodes.length>=vdoc.layers.length);
   record.assertions.graphRepresented=true;
   const bg=(await painter.createCanvas({width:w.width,height:w.height,colorBg:w.color})).buffer;
   const items=vdoc.layers.map((a:any)=>imageArguments(a,vdoc,bundled));
   const png=group?await painter.createImage(items,bg,{isGrouped:true,groupTransform:groupArguments(vdoc.imageGroups![0].transform,vdoc,bundled)}):await painter.createImage(items[0],bg);
   const pmeta=await sharp(png).metadata();
   assert.equal(pmeta.width,w.width);assert.equal(pmeta.height,w.height);
   record.assertions.nativeAccepted=true;record.assertions.outputDimensionsVerified=true;record.nativeSHA256=digest(png);
   const baselineDoc=structuredClone(vdoc);
   if(group){baselineDoc.imageGroups![0].transform={};}
   else {const basic=baselineDoc.layers[0]; if(['x','y','width','height','rotation','opacity'].includes(root))Object.assign(basic,{[root]:(newLayer(basic.kind,basic.id,basic.kind==='image'?asset.id:undefined) as Any)[root]});else basic.imageOptions={};}
   try{const baseArgs=baselineDoc.layers.map((a:any)=>imageArguments(a,baselineDoc,bundled));const comparison=group?await painter.createImage(baseArgs,bg,{isGrouped:true,groupTransform:groupArguments(baselineDoc.imageGroups![0].transform,baselineDoc,bundled)}):await painter.createImage(baseArgs[0],bg);record.assertions.nativePixelDiffFromDefault=digest(comparison)!==record.nativeSHA256;record.baselineSHA256=digest(comparison);}
   catch(baseError){record.assertions.nativePixelDiffFromDefault=null;record.baselineFailure=String((baseError as Error).message||baseError).slice(0,200)}
   const program=join(tmp,'program-'+i+'.mjs'),target=join(tmp,'render-'+i+'.png');
   const generated=source.replace("writeFile('output.png', output)","writeFile("+JSON.stringify(target)+", output)");
   if(generated===source)throw Error('Generated executable source lacks expected output artifact marker');
   await writeFile(program,generated);
   await exec(process.execPath,[program],{cwd:process.cwd(),timeout:45000,maxBuffer:1024*1024});
   const image=await readFile(target);assert.deepEqual(image,png);
   record.assertions.executableCodePNGParity=true;record.evidenceIds.push('READY-CODEPNG-'+i);
  }catch(e){record.issue=String((e as Error).message||e).slice(0,450);record.assertions.failedCriterion='MODEL_OR_NATIVE_OR_CODE_PARITY'}
  if(retry){const existing=results.findIndex(x=>x.path===record.path);if(existing<0)throw Error('No existing record '+record.path);results[existing]=record;}
  else results.push(record);
  if(retry||(i+1)%15===0||i===targets.length-1){await writeFile(out,JSON.stringify({schemaVersion:1,enginePin:input.enginePin,sourceLedgerCount:targets.length,progress:results.length,records:results,summary:{passed:results.filter(x=>!x.issue).length,failed:results.filter(x=>x.issue).length}},null,2)+'\n'); console.log('READY_MATRIX_BATCH',i+1,'PASSED',results.filter(x=>!x.issue).length,'FAILED',results.filter(x=>x.issue).length);}
 }
}finally{await rm(tmp,{recursive:true,force:true})}
assert.equal(results.length,330);

});
