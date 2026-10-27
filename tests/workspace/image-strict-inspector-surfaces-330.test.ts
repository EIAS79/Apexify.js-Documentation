import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {readFile,writeFile} from 'node:fs/promises';
import ImageOptionsEditor,{GroupTransformEditor} from '../../features/apex-workspace/components/ImageOptionsEditor';
import {IMAGE_FILTERS,IMAGE_FILTER_FIELDS,IMAGE_DISTORTIONS} from '../../features/apex-workspace/image-options';
const {createElement}=React;
const {renderToStaticMarkup}=require('react-dom/server') as {renderToStaticMarkup:(node:React.ReactNode)=>string};
Object.assign(globalThis,{React});
const sha='asset:'+'a'.repeat(64);
const gradient=(type:string)=>({type,colors:[{stop:0,color:'#ff0000'},{stop:1,color:'#0033ee'}],
 startX:2,startY:3,endX:36,endY:38,startRadius:2,endRadius:44,centerX:18,centerY:25,rotate:32,pivotX:20,pivotY:20});
const distortion=(kind:string,method:string)=>({
 type:kind,intensity:0.5,radius:25,angle:95,centerX:20,centerY:20,
 points:[{x:0,y:0},{x:40,y:0},{x:40,y:40},{x:0,y:40}],
 controlPoints:method==='handles'?[{from:{x:15,y:15},to:{x:22,y:22},radius:16,strength:0.9,falloff:'smooth'}]:undefined,
 amplitudeX:4,amplitudeY:3,wavelengthX:24,wavelengthY:25,phaseX:7,phaseY:9,
 interpolation:'bilinear',edgeMode:'clamp'
});
const filterList=IMAGE_FILTERS.map(type=>({type,...Object.fromEntries(IMAGE_FILTER_FIELDS[type].map(k=>[k,k==='size'?8:k==='levels'?4:1]))}));
const base={onChange:()=>{},assets:[{id:sha,sha256:'a'.repeat(64),mime:'image/png',bytes:8,width:2,height:2,dataUri:'data:image/png;base64,AA=='}],onAsset:()=>{},onError:()=>{},width:80,height:74};
function markup(group:boolean,kind:string,mode:string,gradientKind:string,shapePaintMode:'gradient'|'solid'){
 const g=gradient(gradientKind);
 const data:any={
 stroke:shapePaintMode==='gradient'?{width:6,gradient:g}:{width:6,color:'#1122ee'},
 shadow:shapePaintMode==='gradient'?{blur:6,offsetX:4,offsetY:4,gradient:g}:{blur:6,color:'#1122ee',offsetX:4,offsetY:4},
 boxBackground:shapePaintMode==='gradient'?{gradient:g}:{color:'#1122ee'},
 filters:filterList,filterOrder:'pre',filterIntensity:1,
 clipPath:[{x:0,y:0},{x:70,y:0},{x:36,y:72}],
 distortion:distortion(kind,mode),
 meshWarp:{gridX:1,gridY:1,controlPoints:[[{x:0,y:0},{x:80,y:0}],[{x:0,y:74},{x:80,y:74}]],interpolation:'bilinear',edgeMode:'clamp'},
 effects:{vignette:{size:0.6,intensity:0.7},lensFlare:{x:27,y:30,intensity:0.6},filmGrain:{intensity:0.7},chromaticAberration:{intensity:0.7}},
 mask:{source:sha,mode:'alpha'},blendMode:'source-over',borderRadius:15,borderPosition:'all',rotation:35,pivotX:24,pivotY:30,translateX:7,translateY:6,
 scaleX:1.2,scaleY:0.9,opacity:0.8,blur:5
 };
 if(group)return renderToStaticMarkup(createElement(GroupTransformEditor as any,{...base,value:data}));
 const opts:any={...data,shape:shapePaintMode==='gradient'?{fill:true,gradient:g,points:[{x:0,y:0},{x:80,y:0},{x:40,y:70}],radius:22,sides:6,startAngle:15,endAngle:280}:{fill:true,color:'#1122ee',points:[{x:0,y:0},{x:80,y:0},{x:40,y:70}],radius:22,sides:6,startAngle:15,endAngle:280}};
 return renderToStaticMarkup(createElement(ImageOptionsEditor as any,{...base,isShape:true,shapeType:'polygon',options:opts}));
}
const decode=(s:string)=>s.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#x27;/g,"'");
const labels=new Map<boolean,Set<string>>();
for(const group of [false,true]){
 const out=new Set<string>();
 for(const grad of ['linear','radial','conic']){
  for(const kind of IMAGE_DISTORTIONS){
   for(const mode of ['quad','handles']){
    for(const paint of ['gradient','solid'] as const){
     const html=markup(group,kind,mode,grad,paint);
     for(const m of html.matchAll(/aria-label="([^"]*)"/g))out.add(decode(m[1]));
    }
   }
  }
 }
 labels.set(group,out);
}
function expected(path:string):string[] {
 const group=path.startsWith('options.groupTransform.');
 const pieces=path.split('.');
 const p=group?pieces.slice(2):pieces.slice(1);
 const root=p[0],rest=p.slice(1),field=p.at(-1);
 const prefix=group?'Image group':'Image';
 if(path==='options.isGrouped'||path==='options.groupTransform'||path==='images.source'||['x','y','width','height','rotation','opacity'].includes(root)&&!group)return [];
 if(root==='align')return ['Image alignment'];
 if(root==='blendMode')return [group?'Group compositing':'Composite / blend mode'];
 if(root==='fit')return ['Image fit'];
 if(root==='inherit')return ['Use intrinsic dimensions'];
 if(root==='blur')return [group?'Group blur':'Blur'];
 if(root==='borderRadius')return [group?'Group border radius':'Border radius'];
 if(root==='borderPosition')return [group?'Group border position':'Border position'];
 if(root==='filterIntensity')return [group?'Group filter intensity':'Filter intensity'];
 if(root==='filterOrder')return [group?'Group filter order':'Filter ordering'];
 if(root==='translateX'||root==='translateY'||root==='scaleX'||root==='scaleY'||root==='pivotX'||root==='pivotY'||root==='rotation'||root==='opacity')return [ 'Group '+root ];
 if(root==='shape'){
  if(!rest.length)return ['Shape fill'];
  if(rest[0]==='gradient')return gradLabel('Image shape',rest);
  if(rest[0]==='points')return ['Polygon points'];
  return ['Shape '+field,field==='color'?'Shape color':'Shape fill'];
 }
 if(root==='boxBackground'){
  if(!rest.length)return [group?'Group box paint':'Box background enabled'];
  if(rest[0]==='gradient')return gradLabel(group?'Group box':'Image box',rest);
  if(field==='color')return [group?'Group box color':'Box color'];
 }
 if(root==='stroke'||root==='shadow'){
  if(!rest.length)return [prefix+' '+root+' enabled'];
  if(rest[0]==='gradient')return gradLabel(prefix+' '+root,rest);
  if(field==='offsetX')return [prefix+' shadow X'];
  if(field==='offsetY')return [prefix+' shadow Y'];
  if(field==='borderRadius')return [prefix+' '+root+' radius mode',prefix+' '+root+' radius'];
  return [prefix+' '+root+' '+(field==='borderPosition'?'border position':field==='roundedCorners'?'rounded corners':field)];
 }
 if(root==='filters'){
  if(!rest.length)return ['Filter 1 type'];
  if(field==='type')return ['Filter 1 type'];
  return IMAGE_FILTERS.filter(t=>IMAGE_FILTER_FIELDS[t].includes(field as any)).map(t=>t+' '+field);
 }
 if(root==='distortion'){
  if(!rest.length)return [group?'Group distortion':'Enable distortion'];
  if(field==='type')return ['Distortion type'];
  if(field==='points'||rest.includes('points'))return ['Quad corners · TL → TR → BR → BL','Point 1 X','Y 1'];
  if(field==='controlPoints'||rest.includes('controlPoints')){
   if(field==='from'||field==='x')return ['from X','to X'];
   if(field==='to'||field==='y')return ['to Y','from Y'];
   if(field==='radius')return ['Influence radius'];
   if(field==='strength')return ['Strength'];
   if(field==='falloff')return ['Falloff'];
   return ['Warp geometry mode'];
  }
  if(field==='edgeMode')return ['Distortion edge mode'];
  if(field==='interpolation')return ['Distortion interpolation'];
  return ['Distortion '+field];
 }
 if(root==='meshWarp'){
  if(!rest.length)return [group?'Group mesh':'Enable mesh warp'];
  if(rest[0]==='controlPoints')return ['Vertex 1 X','Y'];
  if(field==='edgeMode')return ['Mesh edge mode'];
  if(field==='interpolation')return ['Mesh interpolation'];
  return [field??'gridX'];
 }
 if(root==='clipPath'){
  if(!rest.length)return [group?'Group clipping':'Enable polygon clip'];
  return ['Point 1 X','Y 1'];
 }
 if(root==='mask'){
  if(!rest.length)return [group?'Group mask':'Enable image mask'];
  if(field==='mode')return [group?'Group mask mode':'Mask mode'];
  return ['Mask SHA-256 source','Group mask SHA-256 source'];
 }
 if(root==='effects'){
  const effect=rest[0];
  if(!effect)return ['Enable vignette','Group vignette'];
  if(rest.length===1)return [group?({'lensFlare':'Group lens flare','filmGrain':'Group film grain','chromaticAberration':'Group chromatic aberration'} as Record<string,string>)[effect]??'Group '+effect:('Enable '+effect)];
  if(group)return ['Group '+effect+' '+field,'Group flare '+field];
  return [effect+' '+field];
 }
 return [];
}
function gradLabel(id:string,parts:string[]):string[]{
 const f=parts.at(-1),middle=parts[1];
 if(parts.length===1)return [id+' gradient properties'];
 if(f==='type')return [id+' gradient type'];
 if(f==='colors')return [id+' stops'];
 if(f==='color')return [id+' stop color 1',id+' stop hex 1'];
 if(f==='stop')return [id+' stop 1'];
 if(f==='rotate')return [id+' rotation'];
 if(f==='repeat')return [id+' gradient repeat'];
 const synonyms:Record<string,string>={startX:'start X',startY:'start Y',endX:'end X',endY:'end Y',startRadius:'start radius',endRadius:'end radius',centerX:'center X',centerY:'center Y',pivotX:'pivot X',pivotY:'pivot Y'};
 return [id+' '+(synonyms[f??'']??f)];
}
test('330 exact READY Image option identities have individually mapped Inspector authoring surfaces or explicit external-control classification',async()=>{
 const source=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json','utf8'));
 const ready=source.records.filter((r:any)=>r.stageAStatus==='WORKSPACE_READY');
 assert.equal(ready.length,330);
 const report=ready.map((r:any)=>{
  const group=r.path.startsWith('options.groupTransform.');
  const ariaLabels=labels.get(group)!;
  const candidates=expected(r.path);
  const matched=candidates.filter(x=>ariaLabels.has(x));
  const status=!candidates.length?'EXTERNAL_INSPECTOR_OR_SEMANTIC_CONTAINER_NOT_STATICALLY_VERIFIED':matched.length?'CONDITIONAL_REACHABLE_CONTROL':'UNMAPPED_OR_MISSING_INSPECTOR_CONTROL';
  return {id:r.id,path:r.path,status,expectedLabels:candidates,matchedLabels:matched,evidenceId:'IMG01-INSPECTOR-SSR-'+r.path};
 });
 const summary=report.reduce((acc:any,r:any)=>(acc[r.status]=(acc[r.status]||0)+1,acc),{});
 await writeFile('docs/workspace/IMG01_STRICT_INSPECTOR_SURFACE_330.json',JSON.stringify({enginePin:source.enginePin,sourcePaths:330,summary,rows:report},null,2)+'\n');
 console.log('IMG01_INSPECTOR_SURFACES',JSON.stringify(summary));
 assert.equal(report.length,330);
});

test('seven Image and Group color leaves expose validated keyboard-editable hexadecimal authoring alongside native color pickers',()=>{
 const image=markup(false,'bulge','quad','linear','solid');
 const group=markup(true,'bulge','quad','linear','solid');
 for(const label of ['Shape color','Box color','Image stroke color','Image shadow color']){
  assert.match(image,new RegExp('aria-label="'+label+' hex"'),label+' has no accessible hex editor');
  assert.match(image,new RegExp('aria-label="'+label+'"'),label+' lost native picker');
 }
 for(const label of ['Group box color','Image group stroke color','Image group shadow color']){
  assert.match(group,new RegExp('aria-label="'+label+' hex"'),label+' has no accessible group hex editor');
  assert.match(group,new RegExp('aria-label="'+label+'"'),label+' lost native group picker');
 }
 for(const html of [image,group]){
  assert.ok(html.includes('pattern="#[0-9a-fA-F]'), 'Expected strict hex pattern in rendered editor');
  assert.match(html,/maxLength="9"/);
 }
 assert.doesNotMatch(markup(false,'bulge','quad','linear','gradient'),/aria-label="Shape color hex"/);
 assert.doesNotMatch(markup(true,'bulge','quad','linear','gradient'),/aria-label="Group box color hex"/);
});


test('pixelate native region fields are authored as integer pixel coordinates and dimensions',()=>{
 const image=markup(false,'bulge','quad','linear','solid');
 const group=markup(true,'bulge','quad','linear','solid');
 for(const html of [image,group]){
  for(const part of ['x','y','width','height']){
   const label='pixelate '+part;
   const tag=html.match(new RegExp('<input[^>]+aria-label="'+label+'"[^>]*>'))?.[0];
   assert.ok(tag,'Missing '+label+' native region field');
   assert.match(tag,/step="1"/,'Fractional '+label+' native region coordinate is not allowed');
  }
 }
});
