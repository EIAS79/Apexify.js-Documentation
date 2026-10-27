import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createBlankDocument,newLayer,validateDocument} from '../../features/apex-workspace/model';
import {generateSource} from '../../features/apex-workspace/codegen';
const digest=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
async function main(){
const colors=[{stop:0,color:'#fa355b'},{stop:1,color:'#17d6c4'}];
const xy=(x:number,y:number)=>({x,y});
const mesh=[[xy(0,0),xy(44,2)],[xy(1,40),xy(42,39)]];
const quad=[xy(0,0),xy(44,0),xy(43,40),xy(0,40)];
const handle={from:xy(13,12),to:xy(23,19),radius:16,strength:0.8,falloff:'smooth'};
const origin=()=>({width:120,height:100,color:'#172438'});
const imageBytes=await sharp(Buffer.from('<svg width="44" height="40"><rect width="44" height="40" fill="#f03"/><circle cx="26" cy="22" r="12" fill="#39e9ab"/><rect x="6" y="6" width="13" height="17" fill="#2a47e3"/></svg>')).png().toBuffer();
const asset={id:'asset:'+digest(imageBytes),sha256:digest(imageBytes),mime:'image/png',bytes:imageBytes.length,width:44,height:40,dataUri:'data:image/png;base64,'+imageBytes.toString('base64')};
const swappedBytes=await sharp(imageBytes).flop().png().toBuffer();
const altAsset={id:'asset:'+digest(swappedBytes),sha256:digest(swappedBytes),mime:'image/png',bytes:swappedBytes.length,width:44,height:40,dataUri:'data:image/png;base64,'+swappedBytes.toString('base64')};
assert.notEqual(altAsset.id,asset.id);
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

const src=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json','utf8'));
const entries=src.records.filter((r:any)=>r.stageAStatus==='WORKSPACE_READY');
assert.equal(entries.length,330);
const dest=process.env.IMG01_FIXTURE_DIR||'D:/ApexifyWorkspaceParallel/IMG01_RECOVERY_20261025/strict-browser-fixtures';
await mkdir(dest,{recursive:true});
const results=[];
for(const [index,row] of entries.entries()){
 const parts=row.path.split('.');
 const group=row.path.startsWith('options.'),root=group?(parts.length===2?parts[1]:parts[2]):parts[1];
 try{
  const d=createBlankDocument();d.name='IMG01 CERT '+index;
  d.width=480;d.height=360;
  d.background={...d.background,mode:'color',color:'#172438'};
  d.assets=row.path==='images.source'||row.path.endsWith('.mask.source')?[asset as any,altAsset as any]:[asset as any];
  const shape=root==='shape';
  const layer:any=newLayer(shape?'shape':'image','cert_'+index,shape?'star':asset.id);
  Object.assign(layer,{x:60,y:48,width:118,height:95,rotation:0,opacity:1,visible:true});
  if(shape&&row.path.includes('.points'))layer.shape='polygon';
  if(shape&&(row.path.endsWith('.startAngle')||row.path.endsWith('.endAngle')||row.path.endsWith('.radius')))layer.shape='pieSlice';
  const value=property(root,row.path);
  if(group){
    d.imageGroups=[{id:'group:cert',name:'Certified Group',transform:root==='isGrouped'||root==='groupTransform'?{}:{[root]:value}} as any];
    layer.imageGroupId='group:cert';
    const companion:any=newLayer('image','member_'+index,asset.id);
    Object.assign(companion,{x:185,y:85,width:101,height:70,imageGroupId:'group:cert'});
    d.layers=[layer,companion];
  }else {
    if(['x','y','width','height','rotation','opacity'].includes(root))
     layer[root]=root==='width'?140:root==='height'?120:root==='x'?72:root==='y'?65:root==='rotation'?25:0.7;
    else if(root==='source')layer.source=asset.id;
    else layer.imageOptions={[root]:value};
    d.layers=[layer];
  }
  const accepted=validateDocument(d);
  const code=generateSource(accepted);
  const file=dest+'/'+String(index).padStart(3,'0')+'.ts';
  await writeFile(file,code);
  results.push({index,path:row.path,id:row.id,group,root,layerId:layer.id,layerName:layer.name,
    expectedDocumentPath:group?'imageGroups[0].transform.'+root:['x','y','width','height','rotation','opacity','source'].includes(root)?'layers[0].'+root:'layers[0].imageOptions.'+root,
    file,bytes:code.length,valid:true});
 }catch(e){results.push({index,path:row.path,id:row.id,group,root,valid:false,issue:String(e instanceof Error?e.message:e)})}
}
const output={schemaVersion:1,pinnedEngine:src.enginePin,total:entries.length,passed:results.filter(x=>x.valid).length,failed:results.filter(x=>!x.valid).length,entries:results};
await writeFile(dest+'/manifest.json',JSON.stringify(output,null,2)+'\n');
console.log('STRICT_BROWSER_FIXTURES',output.total,output.passed,output.failed);
for(const x of results.filter(x=>!x.valid))console.log('INVALID',x.index,x.path,x.issue);
assert.equal(results.length,330);

}
void main().catch(e=>{console.error(e);process.exitCode=1});
