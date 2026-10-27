import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import sharp from 'sharp';
import {build} from 'esbuild';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {validateImageAsset,resolveImageReference,MAX_ASSET_TOTAL_BYTES} from '../../features/apex-workspace/asset-store';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {projectCanvasGraph,editCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {migrateV1,toV1} from '../../features/apex-workspace/domain/project';
const exec=promisify(execFile);
const require=createRequire(import.meta.url);
async function asset(color:{r:number;g:number;b:number}){
  const png=await sharp({create:{width:24,height:16,channels:4,background:{...color,alpha:1}}}).png().toBuffer();
  const sha256=createHash('sha256').update(png).digest('hex');
  return validateImageAsset({id:'asset:'+sha256,sha256,mime:'image/png',
    bytes:png.length,width:24,height:16,dataUri:'data:image/png;base64,'+png.toString('base64')});
}
async function renderer(){
  const dir=await mkdtemp(join(process.cwd(),'tests/workspace/canvas-asset-fixture-'));
  const entry=join(dir,'renderer.cjs');
  await build({entryPoints:['features/apex-workspace/server/render.ts'],outfile:entry,
    platform:'node',format:'cjs',bundle:true,packages:'external',
    plugins:[{name:'server-only-marker',setup(b){b.onResolve({filter:/^server-only$/},()=>({path:'marker',namespace:'marker'}));
      b.onLoad({filter:/.*/,namespace:'marker'},()=>({contents:''}));}}]});
  return {dir,render:require(entry).renderWorkspaceDocument as (input:unknown)=>Promise<Buffer>};
}
test('content-addressed canvas customBg renders decoded PNG and public-v6 code agrees',async()=>{
  const a=await asset({r:211,g:31,b:53}),doc=createBlankDocument();
  doc.width=64;doc.height=64;doc.layers=[];doc.assets=[a];doc.canvasExtras={customBg:{source:a.id,fit:'fill'}};
  const valid=validateDocument(doc);
  assert.deepEqual(parseSource(generateSource(valid)),valid);
  const migrated=migrateV1(valid,'p:imported-image');
  assert.deepEqual(toV1(migrated),valid,'v1/v2 migration must retain asset bytes and canvas refs');
  const {dir,render}=await renderer();
  try{
    const direct=await render(valid);
    const sample=await sharp(direct).extract({left:32,top:32,width:1,height:1}).raw().toBuffer();
    assert.ok(sample[0]>180&&sample[1]<80&&sample[2]<90);
    const path=join(dir,'output.png');
    const generated=join(dir,'generated.mjs');
    await writeFile(generated,generateSource(valid).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(path)+', output)'));
    await exec(process.execPath,[generated],{cwd:process.cwd(),timeout:30000});
    assert.deepEqual(await readFile(path),direct);
    await assert.rejects(()=>render({...valid,assets:[{...a,sha256:'0'.repeat(64)}]}),/content address/);
    const tampered={...valid,assets:[{...a,dataUri:a.dataUri.replace('A','B')}]};
    await assert.rejects(()=>render(tampered),/SHA-256|MIME|base64/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('ordered color/image background layers render different pixels after reorder',async()=>{
  const a=await asset({r:17,g:225,b:55}),doc=createBlankDocument();
  doc.width=64;doc.height=64;doc.layers=[];doc.assets=[a];
  doc.canvasExtras={bgLayers:[{type:'image',source:a.id,fit:'fill'},{type:'color',value:'#ff0000',opacity:0.8}]};
  const {dir,render}=await renderer();
  try{
    const first=await render(doc);
    doc.canvasExtras.bgLayers!.reverse();
    const second=await render(doc);
    assert.notDeepEqual(first,second);
    assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(doc))),doc);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('typed canvas Graph links a verified image and atomically reorders background ports',async()=>{
  const a=await asset({r:44,g:77,b:233}),doc=createBlankDocument();
  doc.assets=[a];doc.canvasExtras={bgLayers:[{type:'color',value:'#111111'},{type:'noise',intensity:0.07}]};
  const before=JSON.stringify(doc);
  const withAsset=editCanvasGraph(doc,{op:'source',assetId:a.id});
  assert.equal(withAsset.customBg?.source,a.id);
  doc.canvasExtras=withAsset;
  assert.equal(projectCanvasGraph(doc).edges.some(edge=>edge.id==='edge:image-bg'),true);
  const swapped=editCanvasGraph(doc,{op:'layer-order',from:0,to:1});
  assert.equal(swapped.bgLayers?.[0].type,'noise');
  assert.notEqual(JSON.stringify(doc),before);
  assert.throws(()=>editCanvasGraph(doc,{op:'source',assetId:'asset:'+'1'.repeat(64)}),/unverified/);
  assert.throws(()=>editCanvasGraph(doc,{op:'layer-order',from:0,to:9}),/existing/);
});
test('image asset budget leaves room for durable JSON and render transport',async()=>{
  assert.ok(MAX_ASSET_TOTAL_BYTES<=2_000_000);
  const image=await asset({r:5,g:6,b:7}),doc=createBlankDocument();doc.assets=[image];
  assert.ok(JSON.stringify(validateDocument(doc)).length<3_000_000);
  assert.throws(()=>validateDocument({...doc,name:'x'.repeat(3_000_000)}),/name|budget/);
});
test('asset validation fails closed on URLs, paths, mismatched declarations, missing assets and budgets',async()=>{
  const a=await asset({r:1,g:2,b:3});
  const doc=createBlankDocument();doc.layers=[];
  assert.throws(()=>validateCanvasExtras({customBg:{source:'https://example.com/hostile.png'}}),/content-addressed/);
  assert.throws(()=>validateCanvasExtras({bgLayers:[{type:'image',source:'../../private/secret'}]}),/content-addressed/);
  assert.throws(()=>validateDocument({...doc,canvasExtras:{customBg:{source:a.id}}}),/missing referenced/);
  assert.throws(()=>validateDocument({...doc,assets:[{...a,id:'asset:'+'0'.repeat(64)}]}),/content address/);
  assert.throws(()=>validateImageAsset({...a,width:500000}),/dimensions/);
  assert.throws(()=>validateImageAsset({...a,mime:'image/jpeg'}),/MIME/);
  assert.throws(()=>resolveImageReference('file:///etc/passwd',[a]),/content-addressed/);
  assert.throws(()=>validateDocument({...doc,assets:Array.from({length:9},()=>a)}),/collection budget/);
});

test('all 12 pinned procedural pattern variants produce nonuniform decoded pixels',async()=>{
 const variants=['grid','dots','diagonal','stripes','waves','crosses','hexagons','checkerboard','diamonds','triangles','stars','polka'] as const;
 const {dir,render}=await renderer();
 try{
  const outputs=new Set<string>();
  for(const type of variants){
   const doc=createBlankDocument();doc.width=64;doc.height=64;doc.layers=[];
   doc.canvasExtras={patternBg:{type,color:'#ed3344',secondaryColor:'#1144ee',size:12,
     spacing:16,opacity:1,rotation:15,repeat:'repeat',scale:1.2,offsetX:3,offsetY:2}};
   const valid=validateDocument(doc);
   assert.deepEqual(parseSource(generateSource(valid)),valid);
   const png=await render(valid);const raw=await sharp(png).raw().toBuffer({resolveWithObject:true});
   assert.equal(raw.info.width,64);assert.equal(raw.info.height,64);
   const unique=new Set<string>();
   for(let i=0;i<raw.data.length;i+=raw.info.channels)unique.add([...raw.data.subarray(i,i+3)].join(','));
   assert.ok(unique.size>1,type+' should produce a pixel pattern');
   outputs.add(createHash('sha256').update(png).digest('hex'));
  }
  assert.equal(outputs.size,variants.length);
  assert.throws(()=>validateCanvasExtras({patternBg:{type:'custom'}}),/verified image asset/);
  assert.throws(()=>validateCanvasExtras({patternBg:{type:'dots',customPatternImage:'asset:'+'1'.repeat(64)}}),/exclusive/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('custom image pattern works in root and layer with public-v6 Code/Graph parity',async()=>{
 const a=await asset({r:234,g:49,b:13}),doc=createBlankDocument();
 doc.width=64;doc.height=64;doc.layers=[];doc.assets=[a];
 doc.canvasExtras={patternBg:{type:'custom',customPatternImage:a.id,repeat:'repeat',opacity:1}};
 const valid=validateDocument(doc);
 assert.deepEqual(parseSource(generateSource(valid)),valid);
 assert.ok(projectCanvasGraph(valid).edges.some(e=>e.id==='edge:pattern-source'));
 const {dir,render}=await renderer();
 try{
  const direct=await render(valid);
  const pixel=await sharp(direct).extract({left:32,top:32,width:1,height:1}).raw().toBuffer();
  assert.deepEqual([...pixel.subarray(0,3)],[234,49,13]);
  const file=join(dir,'pattern.png'),generated=join(dir,'pattern.mjs');
  await writeFile(generated,generateSource(valid).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(file)+', output)'));
  await exec(process.execPath,[generated],{cwd:process.cwd(),timeout:30000});
  assert.deepEqual(await readFile(file),direct);
  doc.canvasExtras={bgLayers:[{type:'presetPattern',pattern:{type:'custom',customPatternImage:a.id,repeat:'repeat'},opacity:1}]};
  const layered=validateDocument(doc);
  assert.equal((await sharp(await render(layered)).metadata()).width,64);
  assert.equal(editCanvasGraph(layered,{op:'pattern-source',assetId:a.id}).patternBg?.customPatternImage,a.id);
  assert.throws(()=>editCanvasGraph(layered,{op:'pattern-source',assetId:'asset:'+'0'.repeat(64)}),/verified/);
  assert.throws(()=>validateDocument({...doc,assets:[]}),/missing referenced/);
  assert.throws(()=>validateCanvasExtras({patternBg:{type:'custom',customPatternImage:'https://bad.test/a.png'}}),/content-addressed/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('pattern GradientConfig root plus ordered layer generate byte-identical public-v6 source',async()=>{
  const doc=createBlankDocument();doc.width=96;doc.height=96;doc.layers=[];
  doc.canvasExtras={
    patternBg:{type:'dots',size:12,spacing:19,gradient:{type:'linear',
      colors:[{stop:0,color:'#ff0000'},{stop:1,color:'#0000ff'}],startX:1,endX:95}},
    bgLayers:[{type:'presetPattern',opacity:0.7,pattern:{type:'waves',size:17,spacing:24,
      gradient:{type:'radial',startX:6,startY:8,endX:48,endY:48,endRadius:50,
        colors:[{stop:0,color:'#11ffaa'},{stop:1,color:'#110044'}]}}}]
  };
  const valid=validateDocument(doc);
  assert.deepEqual(parseSource(generateSource(valid)),valid);
  assert.deepEqual(toV1(migrateV1(valid,'p:s9-paint')),valid);
  const {dir,render}=await renderer();
  try{
    const real=await render(valid);
    const meta=await sharp(real).metadata();
    assert.equal(meta.width,96);assert.equal(meta.height,96);
    const output=join(dir,'public-gradient-pattern.png'),entry=join(dir,'public-gradient-pattern.mjs');
    await writeFile(entry,generateSource(valid).replace("writeFile('output.png', output)",
      'writeFile('+JSON.stringify(output)+', output)'));
    await exec(process.execPath,[entry],{cwd:process.cwd(),timeout:30000});
    assert.deepEqual(await readFile(output),real,'generated public-v6 calls must exactly reproduce mixed pattern GradientConfig PNG');
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('verified imported tile pattern layer supports true repeat variants and exact public-v6 code parity',async()=>{
 const image=await asset({r:225,g:45,b:80});
 const doc=createBlankDocument();doc.width=96;doc.height=72;doc.layers=[];doc.assets=[image];
 doc.canvasExtras={bgLayers:[{type:'pattern',source:image.id,repeat:'repeat',opacity:1}]};
 const original=validateDocument(doc);
 const projected=projectCanvasGraph(original);
 assert.ok(projected.nodes.some(n=>n.kind==='layer'&&n.inputs.includes('image-asset')));
 assert.deepEqual(parseSource(generateSource(original)),original);
 const {dir,render}=await renderer();
 try{
   const repeated=await render(original);
   const altered=validateDocument({...original,canvasExtras:{bgLayers:[{type:'pattern',source:image.id,repeat:'no-repeat',opacity:1}]}});
   const notRepeated=await render(altered);
   const a=await sharp(repeated).raw().toBuffer(),b=await sharp(notRepeated).raw().toBuffer();
   assert.equal((await sharp(repeated).metadata()).width,96);
   assert.notDeepEqual(a,b,'native image-backed repeat/no-repeat must change real decoded pixels');
   const generated=join(dir,'tile-program.mjs'),output=join(dir,'tile-output.png');
   await writeFile(generated,generateSource(original).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(output)+', output)'));
   await exec(process.execPath,[generated],{cwd:process.cwd(),timeout:30000});
   assert.deepEqual(await readFile(output),repeated,'public-v6 generated image tile output matches Node renderer byte-for-byte');
   const graph=editCanvasGraph(original,{op:'layer-source',index:0,assetId:image.id});
   assert.equal(graph.bgLayers?.[0].type,'pattern');
   assert.throws(()=>editCanvasGraph(original,{op:'layer-source',index:0,assetId:'asset:'+'f'.repeat(64)}),/unverified/);
   assert.throws(()=>validateDocument({...original,assets:[]}),/missing referenced image asset/);
   assert.throws(()=>validateCanvasExtras({bgLayers:[{type:'pattern',source:'https://evil.invalid/source.png'}]}),/content-addressed/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('pinned six-stroke-style and gradient stroke pixel evidence, validated Graph and exact Code parity',async()=>{
 const {ApexPainter}=require('apexify.js');const painter=new ApexPainter();
 const pixel=async (options:Record<string,unknown>)=>{
  const data=(await painter.createCanvas({width:96,height:76,colorBg:'#213047',...options})).buffer;
  return sharp(data).ensureAlpha().raw().toBuffer();
 };
 const baseline=await pixel({});
 const styles=['solid','dashed','dotted','groove','ridge','double'] as const;
 const samples=new Set<string>();
 for(const style of styles){
  const p=await pixel({stroke:{color:'#ff1234',width:9,style,opacity:1}});
  assert.notDeepEqual(p,baseline,style+' must differ from the fill baseline in actual decoded pixels');
  samples.add(createHash('sha256').update(p).digest('hex'));
 }
 assert.equal(samples.size,6,'six v6 stroke styles must produce different decoded pixel configurations');
 const gradient={type:'linear' as const,colors:[{stop:0,color:'#ff0000'},{stop:1,color:'#0000ff'}]};
 const grad=await pixel({stroke:{gradient,width:11,style:'solid'}});
 assert.notDeepEqual(grad,baseline);
 assert.throws(()=>validateCanvasExtras({stroke:{color:'#ff0000',gradient,width:12}}),/mutually exclusive/);
 assert.throws(()=>validateCanvasExtras({stroke:{width:-2}}),/outside supported range/);
 assert.throws(()=>validateCanvasExtras({stroke:{style:'hidden'}}),/unsupported/);
 const doc=createBlankDocument();doc.width=96;doc.height=76;doc.layers=[];
 const extras=editCanvasGraph(doc,{op:'stroke',value:{gradient,width:11,style:'solid',position:1}});
 doc.canvasExtras=extras;
 const verified=validateDocument(doc);
 assert.deepEqual(parseSource(generateSource(verified)),verified);
 assert.ok(projectCanvasGraph(verified).edges.some(edge=>edge.id==='edge:stroke-root'));
 const {dir,render}=await renderer();
 try{
  const server=await render(verified);
  const file=join(dir,'stroke.png'),program=join(dir,'stroke.mjs');
  await writeFile(program,generateSource(verified).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(file)+', output)'));
  await exec(process.execPath,[program],{cwd:process.cwd(),timeout:30000});
  assert.deepEqual(await readFile(file),server,'generated public-v6 gradient stroke exact server PNG');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('nested shadow options and root effects validate strictly and remain reversible via typed Graph',()=>{
 const doc=createBlankDocument();doc.canvasExtras={};
 const shadow={color:'#222244',offsetX:8,offsetY:9,blur:6,opacity:0.7,borderRadius:12,
   roundedCorners:'top-left' as const};
 const x=editCanvasGraph(doc,{op:'shadow',value:shadow});
 assert.deepEqual(x.shadow,shadow);
 assert.deepEqual(doc.canvasExtras,{},'Graph operation may not mutate authoritative document before commit');
 const out=validateDocument({...doc,canvasExtras:x});
 assert.deepEqual(parseSource(generateSource(out)),out);
 assert.ok(projectCanvasGraph(out).edges.some(e=>e.id==='edge:shadow-root'));
 const undone=editCanvasGraph(out,{op:'shadow',value:null});
 assert.equal(undone.shadow,undefined);
 assert.throws(()=>validateCanvasExtras({shadow:{color:'#ff0000',gradient:{type:'linear',colors:[{stop:0,color:'#111111'},{stop:1,color:'#ffffff'}]}}}),/mutually exclusive/);
 assert.throws(()=>validateCanvasExtras({shadow:{offsetX:Infinity}}),/outside supported range/);
 assert.throws(()=>validateCanvasExtras({borderPosition:'file:///secret'}),/unsupported/);
});
