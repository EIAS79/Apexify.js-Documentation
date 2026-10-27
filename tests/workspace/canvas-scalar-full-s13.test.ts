import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import sharp from 'sharp';import {ApexPainter} from 'apexify.js';
import {validateCanvasExtras,type CanvasExtras} from '../../features/apex-workspace/canvas-options';
import {validateImageAsset} from '../../features/apex-workspace/asset-store';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {editCanvasGraph,projectCanvasGraph,type CanvasGraphEdit} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';

const painter=new ApexPainter(),exec=promisify(execFile);
const rgb='#17466c';
async function asset(){
 const pixels=Buffer.alloc(24*12*4);
 for(let i=0;i<pixels.length;i+=4){pixels[i]=(i/4)%24*10;pixels[i+1]=70;pixels[i+2]=180;pixels[i+3]=255}
 const png=await sharp(pixels,{raw:{width:24,height:12,channels:4}}).png().toBuffer();
 const sha256=createHash('sha256').update(png).digest('hex');
 return validateImageAsset({id:'asset:'+sha256,sha256,mime:'image/png',width:24,height:12,bytes:png.length,dataUri:'data:image/png;base64,'+png.toString('base64')});
}
type Family='canvas.opacity'|'canvas.customBg.opacity'|'canvas.bgLayers.opacity'|'canvas.bgLayers.intensity'|'canvas.bgLayers.pattern.opacity';
const paths:Family[]=['canvas.opacity','canvas.customBg.opacity','canvas.bgLayers.opacity','canvas.bgLayers.intensity','canvas.bgLayers.pattern.opacity'];
const values=[0,0.2,0.5,0.8,1];
for(const pathName of paths)test('S13 complete [0,1] opacity/noise scalar family '+pathName,async()=>{
 const a=await asset(),hashes=new Set<string>();
 for(const value of values){
  const doc=createBlankDocument();doc.width=128;doc.height=96;doc.layers=[];doc.background={...doc.background,mode:'color',color:rgb,transparent:false};doc.assets=[a];
  let e:CanvasExtras={},op:CanvasGraphEdit;
  switch(pathName){
   case 'canvas.opacity':e={opacity:value};op={op:'canvas-opacity',value};break;
   case 'canvas.customBg.opacity':e={customBg:{source:a.id,fit:'cover',opacity:value}};op={op:'root-image-opacity',value};break;
   case 'canvas.bgLayers.opacity':e={bgLayers:[{type:'color',nodeId:'layer:scalar-color',value:'#f06424',opacity:value}]};op={op:'layer-opacity',index:0,value};break;
   case 'canvas.bgLayers.intensity':e={bgLayers:[{type:'noise',nodeId:'layer:scalar-noise',intensity:value}]};op={op:'layer-noise-intensity',index:0,value};break;
   default:e={bgLayers:[{type:'presetPattern',nodeId:'layer:scalar-pattern',pattern:{type:'grid',size:16,spacing:20,color:'#ee5566',secondaryColor:'#114477',opacity:value}}]};
    op={op:'layer-pattern',index:0,value:(e.bgLayers![0] as {pattern:CanvasExtras['patternBg']}).pattern!};
  }
  doc.canvasExtras=validateCanvasExtras(e);
  const valid=validateDocument(doc);
  assert.deepEqual(parseSource(generateSource(valid)).canvasExtras,valid.canvasExtras);
  assert.deepEqual(transactCanvasViaV2(valid,valid.canvasExtras!).document.canvasExtras,valid.canvasExtras);
  assert.ok(projectCanvasGraph(valid).nodes.some(n=>n.id==='canvas:root'));
  assert.deepEqual(editCanvasGraph(valid,op),valid.canvasExtras,'Graph op must preserve precisely this validated scalar '+pathName);
  const {customBg,bgLayers,...remaining}=valid.canvasExtras!;
  const canvasConfig={width:128,height:96,...(customBg?{customBg:{...customBg,source:a.dataUri}}:{colorBg:rgb}),...remaining,
    ...(bgLayers?{bgLayers:bgLayers.map(({nodeId:_nodeId,...layer})=>layer)}:{})};
  const png=(await painter.createCanvas(canvasConfig)).buffer;
  const rgba=await sharp(png).ensureAlpha().raw().toBuffer();
  hashes.add(createHash('sha256').update(rgba).digest('hex'));
  const folder=await mkdtemp(join(process.cwd(),'.s13-scalar-'));
  try{
   const target=join(folder,'out.png'),program=join(folder,'generated.mjs');
   await writeFile(program,generateSource(valid).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(target)+', output)'));
   await exec(process.execPath,[program],{cwd:process.cwd(),timeout:30000});
   assert.deepEqual(await sharp(await readFile(target)).ensureAlpha().raw().toBuffer(),rgba,'Code parity '+pathName+' '+value);
  }finally{await rm(folder,{recursive:true,force:true})}
 }
 assert.equal(hashes.size,5,'Scalar has inert/quantized values for '+pathName);
 const invalid=-0.01;
 const base=pathName==='canvas.opacity'?{opacity:invalid}:
   pathName==='canvas.customBg.opacity'?{customBg:{source:a.id,opacity:invalid}}:
   pathName==='canvas.bgLayers.opacity'?{bgLayers:[{type:'color',value:'#ee3344',opacity:invalid}]}:
   pathName==='canvas.bgLayers.intensity'?{bgLayers:[{type:'noise',intensity:invalid}]}:
   {bgLayers:[{type:'presetPattern',pattern:{type:'grid',opacity:invalid}}]};
 assert.throws(()=>validateCanvasExtras(base),/range/);
 console.log('S13_SCALAR_PATH_FULL_CANDIDATE='+JSON.stringify({path:pathName,values,hashes:hashes.size}));
});
