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
test('IMG01 native after real Chromium edits and project re-import, exact leaf isolation',async()=>{
 const l=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json','utf8'));
 const rows=l.records.filter((x:any)=>x.stageAStatus==='WORKSPACE_READY');
 assert.equal(rows.length,330);
 const files=(await readdir(dir)).filter(x=>/^batch-\d+-\d+(?:-\d+)?\.json$/.test(x)).sort((a,b)=>statSync(join(dir,a)).mtimeMs-statSync(join(dir,b)).mtimeMs);
 const proofs=new Map<number,any[]>();
 for(const f of files){
  const j=JSON.parse(await readFile(join(dir,f),'utf8'));
  for(const x of j.results){const a=proofs.get(x.index)||[];a.push(x);proofs.set(x.index,a)}
 }
 let cachedRows:any[]=[];
 try{cachedRows=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_ISOLATED_NATIVE_LIFECYCLE_330.json','utf8')).rows||[];}catch(_){}
 const painter=new ApexPainter({type:'buffer'});
 const executeCode=process.env.IMG01_EXECUTABLE_CLOSURE==='1';
 const exec=promisify(execFile);
 const tmp=executeCode?await mkdtemp(join(process.cwd(),'tests/workspace/.img01-executable-')):'';
 const bundled=await readFile('public/workspace/assets/crystal-lake.webp');
 const raw=Buffer.alloc(118*95*4);
 for(let y=0;y<95;y++)for(let x=0;x<118;x++){
  const j=(y*118+x)*4,c=((Math.floor(x/13)+Math.floor(y/11))%2===0);
  raw[j]=c?255:34;raw[j+1]=(x*9+y*3)%256;raw[j+2]=c?22:240;raw[j+3]=(x+y)%7===0?35:170;
 }
 const tile=await sharp(raw,{raw:{width:118,height:95,channels:4}}).png().toBuffer();
 const textureHash=hash(tile);
 const texture:any={id:'asset:'+textureHash,sha256:textureHash,mime:'image/png',bytes:tile.length,width:118,height:95,dataUri:'data:image/png;base64,'+tile.toString('base64')};
 // Content-addressed alpha masks with deliberately different visible coverage.
 const masks:any[]=[];
 for(const opaque of [false,true]){
  const pixels=Buffer.alloc(118*95*4);
  for(let y=0;y<95;y++)for(let x=0;x<118;x++){
   const k=(y*118+x)*4;pixels[k]=pixels[k+1]=pixels[k+2]=255;
   pixels[k+3]=opaque||x>=59?255:0;
  }
  const png=await sharp(pixels,{raw:{width:118,height:95,channels:4}}).png().toBuffer();
  const digest=hash(png);
  masks.push({id:'asset:'+digest,sha256:digest,mime:'image/png',bytes:png.length,width:118,height:95,dataUri:'data:image/png;base64,'+png.toString('base64')});
 }
 const prepareContext=(input:WorkspaceDocument,path:string)=>{
  const d=structuredClone(input);
  d.assets=[...(d.assets??[]).filter(a=>a.id!==texture.id&&!masks.some(m=>m.id===a.id)),texture,...(path.includes('.mask')?masks:[])];
  for(const x of d.layers){
   if(x.kind==='image'&&path!=='images.source')x.source=texture.id;
   if(path==='images.align'){x.width=220;x.height=92;if(x.kind==='image')x.imageOptions={...x.imageOptions,fit:'contain'};}
   if(path==='images.fit'){x.width=225;x.height=94;}
   if(path==='images.inherit'){x.width=228;x.height=157;}
  }
  const t:any=path.startsWith('options.')?d.imageGroups?.[0]?.transform:d.layers[0]?.imageOptions;
  if(t){
   if(path.endsWith('.filterOrder')){
    t.filters=[{type:'posterize',levels:3},{type:'gaussianBlur',radius:4,intensity:1}];
    t.distortion={type:'twirl',angle:125,intensity:0.7,centerX:48,centerY:41,radius:35};
   }
   if(path.endsWith('.borderPosition'))t.stroke={color:'#15ff8a',width:14,position:3,opacity:1};
   if(path.endsWith('.roundedCorners'))t.stroke={...t.stroke,color:'#15ff8a',width:14,opacity:1,borderRadius:32};
   if(path==='images.mask.source'||path==='options.groupTransform.mask.source'||path==='options.groupTransform.mask')t.mask={source:masks[0].id,mode:'alpha'};
   if(path==='options.isGrouped'&&d.imageGroups?.[0])d.imageGroups[0].transform={rotation:25};
  }
  return d;
 };
 const output=[];
 for(const [i,row] of rows.entries()){
  const attempts=proofs.get(i)||[];
  const pass=attempts.filter(x=>x.inspector&&x.undoRedo&&x.indexedDB&&x.projectExport&&x.nativePreview&&x.codeApplied&&(x.graph||x.graphNotApplicable)).at(-1);
  const o:any={index:i,path:row.path,id:row.id,attempts:attempts.length,browserPass:Boolean(pass),projectReimportValid:false,codeToVisualRoundTrip:false,
    verifiedAssets:false,nativeIsolatedPixelChanged:null,nativeOldSHA256:null,nativeAfterSHA256:null,
    evidenceIds:pass?.proofIds||[],issue:null};
  if(pass){
   try{
    const file=pass.projectFile||join(dir,'project-exports','IMG01-CERT-'+i+'.apexify.json');
    if(!existsSync(file))throw Error('Missing real visible project export');
    const bytes=await readFile(file);
    o.sourceProjectSHA256=hash(bytes);
    if(pass.projectSHA256)assert.equal(o.sourceProjectSHA256,pass.projectSHA256,'Downloaded project SHA mismatch');
    const cached=cachedRows[i];
    if(executeCode&&cached?.id===row.id&&cached?.codeNativePNGParity===true&&!cached.issue&&cached.sourceProjectSHA256===o.sourceProjectSHA256&&!process.env.IMG01_REPROBE_INDICES?.split(',').includes(String(i))){
     output.push({...cached,attempts:attempts.length,browserPass:true});
     continue;
    }
    const imported=validateDocument(JSON.parse(bytes.toString('utf8')));
    o.projectReimportValid=true;
    const roundTrip=parseSource(generateSource(imported));
    assert.deepEqual(roundTrip,imported);
    o.codeToVisualRoundTrip=true;
    for(const asset of imported.assets||[]){
     const bytes=Buffer.from(asset.dataUri.split(',')[1], 'base64');
     assert.equal(hash(bytes),asset.sha256);
    }
    o.verifiedAssets=true;
    const seed=parseSource(await readFile(join(fixtures,String(i).padStart(3,'0')+'.ts'),'utf8'));
    const actual=readValue(imported,row.path),original=readValue(seed,row.path);
    const comparisonValue=JSON.stringify(actual)===JSON.stringify(original)?
     (pass.after!==undefined?pass.after:row.path==='images.mask'||row.path==='options.groupTransform.mask'?undefined:original):original;
    assert.notDeepEqual(actual,comparisonValue,'Browser Inspector and Graph changes must provide two distinct exact target values');
    const restored=structuredClone(imported);
    setValue(restored,row.path,comparisonValue);
    const baseline=validateDocument(restored);
    const oldPNG=await render(baseline,bundled,painter);
    const nativeEditedPNG:{buffer?:Buffer}={};
    const afterPNG=await render(imported,bundled,painter,nativeEditedPNG);
    o.nativeOldSHA256=oldPNG;o.nativeAfterSHA256=afterPNG;
    o.nativeIsolatedPixelChanged=oldPNG!==afterPNG;
    const contextual=prepareContext(imported,row.path);
    const contextualOld=structuredClone(contextual);
    // Change only the selected mask contract; leave image content and all siblings identical.
    if(row.path.endsWith('.mask.source'))setValue(contextualOld,row.path,masks[1].id);
    else if(row.path==='options.groupTransform.mask')setValue(contextualOld,row.path,undefined);
    else setValue(contextualOld,row.path,comparisonValue);
    const checkedContext=validateDocument(contextual);
    const checkedContextOld=validateDocument(contextualOld);
    const contextBefore=await render(checkedContextOld,bundled,painter);
    const contextAfter=await render(checkedContext,bundled,painter);
    o.discriminatingNativePixelChanged=contextBefore!==contextAfter;
    o.discriminatingFixture='alpha-checkerboard-118x95-same-option-subtree-context';
    o.discriminatingNativeBeforeSHA256=contextBefore;
    o.discriminatingNativeAfterSHA256=contextAfter;
    if(!o.nativeIsolatedPixelChanged&&!o.discriminatingNativePixelChanged){
     const beforeValue=readValue(checkedContext,row.path);
     const candidates:any[]=[];
     if(typeof beforeValue==='number')candidates.push(0,1,3,7,22,57,130,230,-15,0.2);
     else if(typeof beforeValue==='string')candidates.push(...(row.allowedValues??[]).filter((v:string)=>v!==beforeValue));
     else if(typeof beforeValue==='boolean')candidates.push(!beforeValue);
     if(candidates.length){
      for(const val of candidates.slice(0,9)){
       if(JSON.stringify(val)===JSON.stringify(beforeValue))continue;
       try{
        const variant=structuredClone(checkedContext);setValue(variant,row.path,val);
        const valid=validateDocument(variant);
        const changedSHA=await render(valid,bundled,painter);
        if(changedSHA!==contextAfter){
         const unchangedConfirm=await render(checkedContext,bundled,painter);
         const changedConfirm=await render(valid,bundled,painter);
         if(unchangedConfirm!==contextAfter||changedConfirm!==changedSHA){o.nativeNondeterminismDetected=true;break;}
         o.nativeDiscriminatingVariant={baseline:beforeValue,variant:val,afterSHA256:changedSHA,beforeSHA256:contextAfter};
         o.discriminatingNativePixelChanged=true;
         o.evidenceIds.push('IMG01-E-NATIVE-DISCRIMINANT-'+i);
         break;
        }
       }catch(_){/* Invalid union-specific variant is not an applicable native contract. */}
      }
     }
    }
    o.evidenceIds.push('IMG01-E-NATIVE-ISOLATED-'+i,'IMG01-E-IMPORT-VALIDATED-'+i);
    if(executeCode){
     const program=join(tmp,'case-'+i+'.mjs'),target=join(tmp,'image-'+i+'.png');
     const source=generateSource(imported);
     const generated=source.replace("writeFile('output.png', output)","writeFile("+JSON.stringify(target)+", output)");
     if(generated===source)throw Error('Cannot independently execute generated Code: missing output marker');
     await writeFile(program,generated);
     await exec(process.execPath,[program],{cwd:process.cwd(),timeout:45000,maxBuffer:1024*1024});
     const codePNG=await readFile(target);
     assert.ok(nativeEditedPNG.buffer,'Native edited PNG was not captured');
     assert.deepEqual(codePNG,nativeEditedPNG.buffer,'Independently executed edited Code PNG bytes differ from native output');
     const rendered=await sharp(codePNG).removeAlpha().raw().toBuffer();
     assert.equal(hash(rendered),afterPNG,'Edited Code decoded pixels differ from native rendering');
     o.codeNativePNGParity=true;
     o.codeSourceSHA256=hash(Buffer.from(source));
     o.codeResultPNG_SHA256=hash(await readFile(target));
     o.evidenceIds.push('IMG01-E-CODE-NATIVE-PNG-'+i);
    }
   }catch(e){o.issue=String(e instanceof Error?e.stack:e).slice(0,470)}
  }else{o.issue=attempts.length?'Real Chrome lifecycle or mapping failed':'Not executed by browser batches yet'}
  output.push(o);
 }
 const summary={records:output.length,attempted:output.filter(x=>x.attempts).length,browserLifecyclePassing:output.filter(x=>x.browserPass).length,
  projectValidated:output.filter(x=>x.projectReimportValid).length,
  codeRoundTrip:output.filter(x=>x.codeToVisualRoundTrip).length,
  nativeTargetEffective:output.filter(x=>x.nativeIsolatedPixelChanged===true).length,
  nativeTargetInertInFixture:output.filter(x=>x.nativeIsolatedPixelChanged===false).length,
  discriminatingNativeEffective:output.filter(x=>x.discriminatingNativePixelChanged===true).length,
  discriminatingNativeUnchanged:output.filter(x=>x.discriminatingNativePixelChanged===false).length,
  anyTargetNativeEffective:output.filter(x=>x.nativeIsolatedPixelChanged===true||x.discriminatingNativePixelChanged===true).length,
  parityFailures:output.filter(x=>x.browserPass&&x.issue).length};
 await writeFile('docs/workspace/IMG01_STRICT_ISOLATED_NATIVE_LIFECYCLE_330.json',JSON.stringify({enginePin:l.enginePin,summary,rows:output},null,2)+'\n');
 if(tmp)await rm(tmp,{recursive:true,force:true});
 console.log('IMG01_NATIVE_AFTER_BROWSER',JSON.stringify(summary));
 assert.equal(output.length,330);
});
