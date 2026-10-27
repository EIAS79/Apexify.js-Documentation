import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {CanvasBlendModes,validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
const exec=promisify(execFile),painter=new ApexPainter();
const base=()=>{const d=createBlankDocument();d.width=96;d.height=72;d.layers=[];d.background={...d.background,mode:'color',color:'#225588',transparent:false};return d};
const rgba=(x:Buffer)=>sharp(x).ensureAlpha().raw().toBuffer();
for(const area of ['pattern','layer','nested'] as const)for(const blendMode of CanvasBlendModes)test('S13 exact pinned Code-vs-direct pixel parity: '+area+' blend '+blendMode,async()=>{
 const doc=base();
 const extras=area==='pattern'?
   {patternBg:{type:'grid' as const,color:'#ffcc44',secondaryColor:'#223366',size:16,spacing:24,opacity:0.65,blendMode}}:
   area==='nested'?{bgLayers:[{type:'presetPattern' as const,nodeId:'layer:nested-code-parity',opacity:0.7,pattern:{
      type:'grid' as const,color:'#ffcc44',secondaryColor:'#223366',size:16,spacing:24,opacity:0.65,blendMode
   }}]}:
   {bgLayers:[{type:'color' as const,value:'#ffcc44',opacity:0.65,blendMode,nodeId:'layer:code-parity'}]};
 doc.canvasExtras=validateCanvasExtras(extras);
 const v=validateDocument(doc);
 assert.deepEqual(parseSource(generateSource(v)).canvasExtras,v.canvasExtras);
 assert.deepEqual(transactCanvasViaV2(v,v.canvasExtras!).document,v);
 const bg=v.canvasExtras!.bgLayers?.map(({nodeId:_id,...l})=>l);
 const nativeOpts={width:96,height:72,colorBg:'#225588',...(bg?{bgLayers:bg}:{}),...(v.canvasExtras!.patternBg?{patternBg:v.canvasExtras!.patternBg}:{})};
 const actual=(await painter.createCanvas(nativeOpts)).buffer;
 const folder=await mkdtemp(join(process.cwd(),'.s13-blend-'));
 try{
  const file=join(folder,'result.png'),script=join(folder,'generated.mjs');
  await writeFile(script,generateSource(v).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(file)+', output)'));
  await exec(process.execPath,[script],{cwd:process.cwd(),timeout:30000});
  assert.deepEqual(await rgba(await readFile(file)),await rgba(actual),'Mismatch: '+area+' '+blendMode);
 }finally{await rm(folder,{recursive:true,force:true})}
});
