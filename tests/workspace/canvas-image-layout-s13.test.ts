import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import sharp from 'sharp';import {ApexPainter} from 'apexify.js';
import {CanvasImageAlignModes,validateCanvasExtras,type CanvasImageAlign,type CanvasImageFit} from '../../features/apex-workspace/canvas-options';
import {validateImageAsset} from '../../features/apex-workspace/asset-store';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {editCanvasGraph,projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const exec=promisify(execFile),api=new ApexPainter(),fits:CanvasImageFit[]=['fill','contain','cover'];
const source=async()=>{const width=30,height=10,raw=Buffer.alloc(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;raw[i]=x*8;raw[i+1]=y*22;raw[i+2]=(x+y)*6;raw[i+3]=255}
 const png=await sharp(raw,{raw:{width,height,channels:4}}).png().toBuffer();
 const sha256=createHash('sha256').update(png).digest('hex');
 return validateImageAsset({id:'asset:'+sha256,sha256,mime:'image/png',width,height,bytes:png.length,dataUri:'data:image/png;base64,'+png.toString('base64')});
};
type Kind='root'|'layer';
async function fixture(kind:Kind,fit:CanvasImageFit,align:CanvasImageAlign,asset:Awaited<ReturnType<typeof source>>){
 const extras=kind==='root'?{customBg:{source:asset.id,fit,align}}:{bgLayers:[{type:'image' as const,nodeId:'layer:image-layout-certified',source:asset.id,fit,align}]};
 const d=createBlankDocument();d.width=128;d.height=96;d.layers=[];d.assets=[asset];d.background={...d.background,mode:'color',color:'#163551',transparent:false};d.canvasExtras=validateCanvasExtras(extras);
 const validated=validateDocument(d);
 assert.deepEqual(parseSource(generateSource(validated)).canvasExtras,validated.canvasExtras);
 assert.deepEqual(transactCanvasViaV2(validated,validated.canvasExtras!).document.canvasExtras,validated.canvasExtras);
 assert.ok(projectCanvasGraph(validated).nodes.some(n=>n.id===(kind==='root'?'canvas:background':'canvas:ordered-layer:layer:image-layout-certified')));
 const edit=editCanvasGraph(validated,{op:'image-layout',target:kind,index:0,fit,align});
 assert.deepEqual(edit,validated.canvasExtras);
 const nativeConfig=kind==='root'?{width:128,height:96,customBg:{source:asset.dataUri,fit,align}}:
  {width:128,height:96,colorBg:'#163551',bgLayers:[{type:'image' as const,source:asset.dataUri,fit,align}]};
 const native=await sharp((await api.createCanvas(nativeConfig)).buffer).ensureAlpha().raw().toBuffer();
 const folder=await mkdtemp(join(process.cwd(),'.s13-img-layout-'));
 try{
  const out=join(folder,'out.png'),js=join(folder,'program.mjs');
  await writeFile(js,generateSource(validated).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(out)+', output)'));
  await exec(process.execPath,[js],{cwd:process.cwd(),timeout:30000});
  const exported=await sharp(await readFile(out)).ensureAlpha().raw().toBuffer();
  assert.deepEqual(exported,native,kind+' '+fit+' '+align+' public-v6 Code differs from pinned runtime');
 }finally{await rm(folder,{recursive:true,force:true})}
 return createHash('sha256').update(native).digest('hex');
}
for(const kind of ['root','layer'] as Kind[])test('S13 verified immutable image-fit and alignment complete union '+kind,async()=>{
 const asset=await source(),records:Array<{fit:CanvasImageFit;align:CanvasImageAlign;hash:string}>=[];
 assert.equal(CanvasImageAlignModes.length,9);
 for(const fit of fits){const hash=await fixture(kind,fit,'center',asset);records.push({fit,align:'center',hash})}
 const fitSet=new Set(records.map(r=>r.hash));assert.equal(fitSet.size,3,'All three fit modes must produce distinct native pixels');
 for(const align of CanvasImageAlignModes){
  const contain=await fixture(kind,'contain',align,asset),cover=await fixture(kind,'cover',align,asset);
  records.push({fit:'contain',align,hash:contain},{fit:'cover',align,hash:cover});
 }
 const unique=new Set(CanvasImageAlignModes.map(align=>records.filter(x=>x.align===align).map(x=>x.hash).slice(-2).join('|')));
 assert.equal(unique.size,9,'Nine alignment choices must have separately distinguishable native cases');
 assert.throws(()=>validateCanvasExtras(kind==='root'?{customBg:{source:asset.id,fit:'unsafe'}}:{bgLayers:[{type:'image',source:asset.id,fit:'unsafe'}]}),/unsupported fit/);
 assert.throws(()=>validateCanvasExtras(kind==='root'?{customBg:{source:asset.id,align:'unsafe'}}:{bgLayers:[{type:'image',source:asset.id,align:'unsafe'}]}),/unsupported align/);
 assert.throws(()=>editCanvasGraph(createBlankDocument(),{op:'image-layout',target:kind,index:0,fit:'cover'}),/requires/);
 console.log('S13_IMAGE_UNION_'+kind.toUpperCase()+'='+JSON.stringify({fits:fits.length,aligns:CanvasImageAlignModes.length,records:records.length,unique:unique.size,asset:asset.sha256}));
});
