import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {existsSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {parseSource,generateSource} from '../../features/apex-workspace/codegen';
import {validateDocument,type WorkspaceDocument} from '../../features/apex-workspace/model';
import {imageArguments,groupArguments} from '../../features/apex-workspace/image-runtime';
import {IMAGE_FILTER_FIELDS} from '../../features/apex-workspace/image-options';
const root=process.env.IMG01_LIFECYCLE_ROOT||'D:/ApexifyWorkspaceParallel/IMG01_RECOVERY_20261025';
const dir=join(root,'strict-lifecycle-browser');
const fixtures=join(root,'strict-browser-fixtures');
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
function readValue(doc:any,path:string){
 if(path==='options.isGrouped')return doc.layers[0].imageGroupId;
 if(path==='options.groupTransform')return doc.imageGroups[0].transform;
 const parts=path.split('.'),group=parts[0]==='options';
 let x:any=group?doc.imageGroups?.[0]?.transform:doc.layers?.[0];
 const bits=group?parts.slice(2):parts.slice(1);
 if(!group&&!['x','y','width','height','rotation','opacity','source'].includes(bits[0]))x=x?.imageOptions;
 for(const bit of bits){if(Array.isArray(x))x=Array.isArray(x[0])?x[0][0]:x[0];x=x?.[bit]}
 return x;
}
function setValue(doc:any,path:string,value:any){
 if(path==='options.isGrouped'){doc.layers[0].imageGroupId=value;return}
 if(path==='options.groupTransform'){doc.imageGroups[0].transform=value;return}
 const parts=path.split('.'),group=parts[0]==='options';
 let x:any=group?doc.imageGroups?.[0]?.transform:doc.layers?.[0];
 const bits=group?parts.slice(2):parts.slice(1);
 if(!group&&!['x','y','width','height','rotation','opacity','source'].includes(bits[0]))x=x.imageOptions;
 for(let i=0;i<bits.length-1;i++){if(Array.isArray(x))x=Array.isArray(x[0])?x[0][0]:x[0];x=x[bits[i]]}
 if(Array.isArray(x))x=Array.isArray(x[0])?x[0][0]:x[0];
 if(value===undefined)delete x[bits.at(-1)!];else x[bits.at(-1)!]=structuredClone(value);
 // A discriminant and its dependent native fields must change as one valid union.
 const holder:any=group?doc.imageGroups?.[0]?.transform:doc.layers?.[0]?.imageOptions;
 if(path.endsWith('.filters.type')&&holder?.filters?.[0]){
  const type=holder.filters[0].type;
  const keys=IMAGE_FILTER_FIELDS[type as keyof typeof IMAGE_FILTER_FIELDS]||[];
  holder.filters[0]={type,...Object.fromEntries(keys.map(k=>[k,k==='levels'?4:k==='size'?7:k==='radius'?4:1]))};
 }
 if((path.endsWith('.meshWarp.gridX')||path.endsWith('.meshWarp.gridY'))&&holder?.meshWarp){
  const mesh=holder.meshWarp,gx=mesh.gridX??1,gy=mesh.gridY??1;
  const width=doc.layers[0]?.width??118,height=doc.layers[0]?.height??95;
  mesh.controlPoints=Array.from({length:gy+1},(_,j)=>Array.from({length:gx+1},(_,i)=>({x:i*width/gx,y:j*height/gy})));
 }
}
async function render(doc:WorkspaceDocument,bundled:Buffer,painter:ApexPainter,out?:{buffer?:Buffer}){
 const canvas=await painter.createCanvas({width:doc.width,height:doc.height,colorBg:doc.background.color});
 let buffer=canvas.buffer;
 for(let i=0;i<doc.layers.length;i++){
  const layer=doc.layers[i];
  if(layer.kind!=='image'&&layer.kind!=='shape')throw Error('Strict fixture contains unexpected layer '+layer.kind);
  const g=doc.imageGroups?.find(x=>x.id===layer.imageGroupId);
  const members=[layer];
  if(g)while(i+1<doc.layers.length&&doc.layers[i+1].imageGroupId===g.id&&['image','shape'].includes(doc.layers[i+1].kind))members.push(doc.layers[++i] as typeof layer);
  const args=members.map(l=>imageArguments(l,doc,bundled));
  buffer=g?await painter.createImage(args,buffer,{isGrouped:true,groupTransform:groupArguments(g.transform,doc,bundled)}):await painter.createImage(args[0],buffer);
 }
 if(out)out.buffer=buffer;
 const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,doc.width);assert.equal(info.height,doc.height);
 return hash(data);
}

test('IMG01 residual 55 candidates use contract-specific geometry and exact target-only native pixel discriminants',async()=>{
 const l=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json','utf8'));
 const n=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_ISOLATED_NATIVE_LIFECYCLE_330.json','utf8'));
 const report=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_FINAL_PROOF_REFERENCES.json','utf8'));
 const residual=report.cases.filter((x:any)=>[3,9,13,14,24,25,29,30,31,33,34,35,36,38,39,40,43,49,66,84,91,107,108,121,122,132,133,142,143,148,162,163,183,193,194,204,205,209,210,211,213,214,215,216,218,219,223,246,268,273,274,288,289,312,313].includes(x.sourceIndex));
 const only=process.env.IMG01_RESIDUAL_ONLY?new Set(process.env.IMG01_RESIDUAL_ONLY.split(',').map(Number)):null;
 const previous=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_RESIDUAL_NATIVE_55.json','utf8'));
 const previousRows=new Map(previous.rows.map((v:any)=>[v.index,v]));
 assert.equal(residual.length,55);
 const painter=new ApexPainter({type:'buffer'});
 const checkCode=process.env.IMG01_RESIDUAL_CODE_PARITY==='1';
 const scratch=checkCode?await mkdtemp(join(process.cwd(),'tests/workspace/.img01-residual-')):'';
 const invoke=promisify(execFile);
 const raw=Buffer.alloc(180*140*4);
 for(let y=0;y<140;y++)for(let x=0;x<180;x++){const p=(y*180+x)*4;raw[p]=(x*13+y*11)%256;raw[p+1]=(Math.floor(x/5)+Math.floor(y/7))%2?240:12;raw[p+2]=(x*4-y*5+3000)%256;raw[p+3]=(x+y)%9===0?30:220;}
 const png=await sharp(raw,{raw:{width:180,height:140,channels:4}}).png().toBuffer();
 const sh=hash(png);
 const texture={id:'asset:'+sh,sha256:sh,mime:'image/png',bytes:png.length,width:180,height:140,dataUri:'data:image/png;base64,'+png.toString('base64')};
 const other=await sharp(png).flop().png().toBuffer();
 const otherSha=hash(other);
 const second={id:'asset:'+otherSha,sha256:otherSha,mime:'image/png',bytes:other.length,width:180,height:140,dataUri:'data:image/png;base64,'+other.toString('base64')};
 const originalFallback=await readFile('public/workspace/assets/crystal-lake.webp');
 const outputs=[];
 function variantValues(value:any,path:string){
  if(typeof value==='number')return [0,1,2,10,35,75,150,260,-55,0.05,-0.5,3.8].filter(x=>x!==value);
  if(typeof value==='string'){
   if(path.endsWith('color'))return ['#ffffff','#000000','#f93112','#22ee55'].filter(x=>x!==value);
   const guesses=path.endsWith('falloff')?['linear','smooth','gaussian','exponential']:path.endsWith('edgeMode')?['transparent','clamp','wrap','mirror','repeat']:path.endsWith('borderPosition')?['all','top','bottom','left','right','top-left','bottom-right']:['alpha','inverse','luminance','contain','fill','cover'];
   return guesses.filter(x=>x!==value);
  }
  if(typeof value==='boolean')return [!value];
  if(value&&typeof value==='object'){
   if((path.endsWith('.from')||path.endsWith('.to'))&&!Array.isArray(value)&&typeof value.x==='number'&&typeof value.y==='number')
    return [{x:value.x+88,y:value.y+52},{x:0,y:0},{x:value.x-42,y:value.y-25},{x:value.x+180,y:value.y+120}];
   const out=[undefined];
   if(!Array.isArray(value))for(const k of Object.keys(value)){
    if(typeof value[k]==='string')out.push({...value,[k]:value[k]==='alpha'?'inverse':'alpha'});
   }
   return out;
  }
  return [undefined];
 }
 function configure(doc:any,path:string,geom:number){
  const d=structuredClone(doc);
  d.background={...d.background,mode:'color',color:geom===0?'#101b38':'#fd5f3c'};
  d.width=geom===0?520:700;d.height=geom===0?420:490;
  d.assets=[...(d.assets||[]).filter((a:any)=>a.id!==texture.id&&a.id!==second.id),texture,second];
  d.layers.forEach((layer:any,j:number)=>{
   layer.visible=true;layer.opacity=1;
   layer.x=geom===0?(60+j*75):(35+j*110);
   layer.y=geom===0?(55+j*70):(40+j*80);
   layer.width=geom===0?180:267;layer.height=geom===0?140:215;
   layer.rotation=geom===0?0:28;
   if(layer.kind==='image'&&path!=='images.source')layer.source=texture.id;
   if(layer.kind==='shape'){
    if(path.endsWith('.sides'))layer.shape='polygon';
    if(path.endsWith('.centerX')||path.endsWith('.centerY'))layer.shape='pieSlice';
    if(path.endsWith('.innerRadius')||path.endsWith('.outerRadius'))layer.shape='star';
    layer.imageOptions={...layer.imageOptions,shape:{...layer.imageOptions?.shape,fill:true,innerRadius:geom===0?35:70,outerRadius:geom===0?80:135,radius:geom===0?64:120,sides:7}};
    if(path.endsWith('.sides'))delete layer.imageOptions.shape.points;
   }
   if(layer.imageOptions?.fit)layer.imageOptions={...layer.imageOptions,fit:geom===0?'fill':'contain'};
  });
  const options=path.startsWith('options.')?d.imageGroups?.[0]?.transform:d.layers?.[0]?.imageOptions;
  if(options){
   for(const colorKey of ['boxBackground','shadow','stroke','shape']){
    if(options[colorKey]?.gradient){
     const grad=options[colorKey].gradient;grad.rotate=geom===0?64:127;
     grad.startX=0;grad.startY=0;grad.endX=180;grad.endY=140;
    }
   }
   if(path.endsWith('.filterIntensity'))options.filters=[{type:'gaussianBlur',radius:10,intensity:1}];
   if(options.distortion){
    const v=options.distortion;
    v.radius=geom===0?90:170;v.intensity=geom===0?1.2:3;
    v.centerX=geom===0?68:110;v.centerY=geom===0?52:91;
    v.angle=geom===0?105:190;
    if(v.type==='warp'&&v.controlPoints?.length){
     for(const p of v.controlPoints){p.radius=geom===0?100:175;p.strength=geom===0?2:5;p.from={...p.from,x:68,y:55};p.to={...p.to,x:geom===0?120:225,y:geom===0?96:145};}
    }
   }
   if(options.clipPath)options.clipPath=[{x:0,y:0},{x:geom===0?180:260,y:0},{x:geom===0?110:170,y:geom===0?135:212},{x:0,y:geom===0?140:215}];
   if(options.mask&&typeof options.mask==='object')options.mask={...options.mask,source:texture.id};
   if(options.meshWarp){
    const w=geom===0?180:260,h=geom===0?140:210,offset=geom===0?48:90;
    // Bicubic support touches source pixels beyond the boundary even when the mesh UV lies within [0,1].
    // Bilinear cannot distinguish edge modes under this mesh mapper; bicubic must.
    options.meshWarp={...options.meshWarp,interpolation:'bicubic',gridX:1,gridY:1,
      controlPoints:[[{x:-offset,y:-offset},{x:w+offset,y:-offset}],[{x:-offset,y:h+offset},{x:w+offset,y:h+offset}]]};
   }
   if(path.endsWith('borderPosition')){
    options.borderRadius=geom===0?18:45;
    options.stroke={color:'#14ff49',width:geom===0?16:26,opacity:1,position:10};
   }
  }
  if(path.startsWith('options.')&&d.imageGroups?.[0]){
   d.imageGroups[0].transform={...d.imageGroups[0].transform,rotation:geom===0?25:69,scaleX:1.3,scaleY:0.8,pivotX:geom===0?60:140,pivotY:geom===0?55:110};
  }
  return d;
 }
 for(const row of residual){
  const i=row.sourceIndex;const path=row.path;
  if(only&&!only.has(i)){const previousRow=previousRows.get(i);assert.ok(previousRow,'Missing independent prior native residual witness '+i);outputs.push(previousRow);continue;}
  const o:any={index:i,path,attempted:0,nativeEffects:[],proofIds:[],invalid:[],remaining:true};
  try{
   const data=n.rows[i];
   const projectFile=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_FINAL_PROOF_REFERENCES.json','utf8')).cases[i];
   const browserFile=join(dir,'project-exports','IMG01-CERT-'+i+'.apexify.json');
   const seedFile=join(fixtures,String(i).padStart(3,'0')+'.ts');
   const actualFile=existsSync(browserFile)?JSON.parse(await readFile(browserFile,'utf8')):parseSource(await readFile(seedFile,'utf8'));
   const original=readValue(actualFile,path);
   for(const geom of [0,1]){
    const prepared=configure(actualFile,path,geom);
    let validated;
    try{validated=validateDocument(prepared)}catch(e){o.invalid.push('base geometry'+geom+': '+String(e).slice(0,200));continue}
    const nativeOriginal=readValue(validated,path);
    let originalHash;
    try{originalHash=await render(validated,originalFallback,painter)}catch(e){o.invalid.push('native base'+geom+': '+String(e).slice(0,200));continue}
    for(const value of variantValues(nativeOriginal,path)){
     try{
      const altered=structuredClone(validated);
      setValue(altered,path,value);
      const checked=validateDocument(altered);
      const checkValue=readValue(checked,path);
      if(JSON.stringify(checkValue)===JSON.stringify(nativeOriginal))continue;
      const after=await render(checked,originalFallback,painter);
      o.attempted++;
      if(originalHash!==after){
       if(await render(validated,originalFallback,painter)!==originalHash || await render(checked,originalFallback,painter)!==after){o.invalid.push('nondeterministic candidate '+geom+' '+JSON.stringify(value));continue}
       let codeEvidence:any={codeNativePNGParity:false};
       if(checkCode){
        const capture:{buffer?:Buffer}={};
        assert.equal(await render(checked,originalFallback,painter,capture),after);
        assert.ok(capture.buffer,'Native reference output missing');
        const source=generateSource(checked);
        const target=join(scratch,'IMG01-'+i+'.png'),program=join(scratch,'IMG01-'+i+'.mjs');
        const transformed=source.replace("writeFile('output.png', output)","writeFile("+JSON.stringify(target)+", output)");
        assert.notEqual(transformed,source,'Could not target executable output');
        await writeFile(program,transformed);
        await invoke(process.execPath,[program],{cwd:process.cwd(),timeout:45000,maxBuffer:1024*1024});
        const codePNG=await readFile(target);
        assert.deepEqual(codePNG,capture.buffer,'Residual edited native vs generated public v6 Code differed in PNG bytes');
        codeEvidence={codeNativePNGParity:true,sourceSHA256:hash(Buffer.from(source)),codePNG_SHA256:hash(codePNG),sourceBytes:source.length};
       }
       o.nativeEffects.push({geometryId:geom,baseline:originalHash,changed:after,oldValue:nativeOriginal,newValue:checkValue,originalSourceValue:original,enginePin:l.enginePin,proofId:'IMG01-F-RESIDUAL-NATIVE-'+i,...codeEvidence});
       o.proofIds.push('IMG01-F-RESIDUAL-NATIVE-'+i);
       o.remaining=false;
       break;
      }
     }catch(e){o.invalid.push('candidate '+geom+': '+String(e).slice(0,180));}
    }
    if(!o.remaining)break;
   }
  }catch(e){o.invalid.push(String(e).slice(0,300))}
  outputs.push(o);
  console.log('IMG01_RESIDUAL_NATIVE',i,path,'EFFECT',!o.remaining,'TRIALS',o.attempted,'ISSUES',o.invalid.length);
 }
 const reportFile='docs/workspace/IMG01_STRICT_RESIDUAL_NATIVE_55.json';
 const summary={sourceResidual:55,attempted:outputs.filter(x=>x.attempted).length,effects:outputs.filter(x=>!x.remaining).length,unresolved:outputs.filter(x=>x.remaining).length};
 await writeFile(reportFile,JSON.stringify({enginePin:l.enginePin,summary,rows:outputs},null,2)+'\n');
 if(scratch)await rm(scratch,{recursive:true,force:true});
 console.log('IMG01_RESIDUAL_NATIVE_SUMMARY',JSON.stringify(summary));
 assert.equal(outputs.length,55);
});
