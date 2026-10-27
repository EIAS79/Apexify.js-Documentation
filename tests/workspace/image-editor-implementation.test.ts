import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,newLayer,validateDocument} from '../../features/apex-workspace/model';
import {IMAGE_SHAPES,IMAGE_FILTERS,validateImageOptions,validateImageGroups,sourceForEngine} from '../../features/apex-workspace/image-options';
import {imageArguments,groupArguments} from '../../features/apex-workspace/image-runtime';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import type {WorkspaceImageAsset} from '../../features/apex-workspace/asset-store';
const exec=promisify(execFile);
async function asset():Promise<WorkspaceImageAsset>{
 const bytes=await sharp({create:{width:24,height:24,channels:4,background:{r:210,g:30,b:90,alpha:1}}}).png().toBuffer();
 const sha256=createHash('sha256').update(bytes).digest('hex');
 return {id:'asset:'+sha256,sha256,mime:'image/png',bytes:bytes.length,width:24,height:24,dataUri:'data:image/png;base64,'+bytes.toString('base64')};
}
test('image editor inventory is the pinned public v6 union',()=>{
 assert.equal(IMAGE_SHAPES.length,10);assert.equal(IMAGE_FILTERS.length,17);
 assert.deepEqual([...IMAGE_SHAPES].sort(),['arc','circle','heart','pieSlice','polygon','rectangle','square','star','trapezium','triangle'].sort());
});
test('nested options, filters, mask, mesh, effects and group validate and persist',async()=>{
 const a=await asset(),d=createBlankDocument();
 d.assets=[a];d.layers=[newLayer('image','img',a.id)];
 d.layers[0].imageOptions={
   inherit:false,fit:'contain',align:'bottom-right',blur:2,filterOrder:'pre',
   filters:[{type:'gaussianBlur',intensity:1,radius:2},{type:'sepia'}],mask:{source:a.id,mode:'luminance'},
   clipPath:[{x:0,y:0},{x:24,y:0},{x:24,y:24}],distortion:{type:'warp',
     controlPoints:[{from:{x:5,y:5},to:{x:9,y:10},radius:12,strength:1,falloff:'smooth'}]},
   meshWarp:{gridX:1,gridY:1,controlPoints:[[{x:0,y:0},{x:24,y:0}],[{x:0,y:24},{x:24,y:24}]]},
   effects:{vignette:{intensity:0.4,size:0.7}},borderRadius:6,
 };
 d.imageGroups=[{id:'group:test',name:'Test',transform:{translateX:1,scaleX:1.1,scaleY:1,
   filters:[{type:'grayscale'}],mask:{source:a.id,mode:'alpha'},
   boxBackground:{gradient:{type:'linear',colors:[{stop:0,color:'#223344'},{stop:1,color:'#ddeeff'}]}}}}];
 d.layers[0].imageGroupId='group:test';
 const validated=validateDocument(d);
 assert.deepEqual(validated.layers[0].imageOptions,d.layers[0].imageOptions);
 assert.deepEqual(parseSource(generateSource(validated)),validated);
 const graph=projectCanvasGraph(validated);
 assert.ok(graph.edges.some(e=>e.id==='edge:image-layer-source:img'));
 assert.ok(graph.edges.some(e=>e.id==='edge:image-layer-mask:img'));
 assert.ok(graph.edges.some(e=>e.id==='edge:image-group-member:img'));
 assert.ok(graph.edges.some(e=>e.id==='edge:image-group-mask:group:test'));
});
test('invalid remote sources, unsupported leaves, malformed mesh and unverified masks fail closed',async()=>{
 const a=await asset();
 assert.throws(()=>validateImageOptions({source:'https://example.com/private.jpg'},[a]),/not supported/);
 assert.throws(()=>validateImageOptions({mask:{source:'https://example.com/mask.png'}},[a]),/asset/);
 assert.throws(()=>validateImageOptions({filters:Array(9).fill({type:'sepia'})},[a]),/eight filters/);
 assert.throws(()=>validateImageOptions({distortion:{type:'perspective',points:[{x:0,y:0}]}},[a]),/exactly four/);
 assert.throws(()=>validateImageOptions({distortion:{type:'warp',points:[{x:0,y:0},{x:24,y:0},{x:24,y:24},{x:0,y:24}],controlPoints:[{from:{x:5,y:5},to:{x:8,y:8}}]}},[a]),/either quad points or control handles/);
 assert.doesNotThrow(()=>validateImageOptions({distortion:{type:'warp',controlPoints:[{from:{x:5,y:5},to:{x:8,y:8}}]}},[a]));
 assert.throws(()=>validateImageOptions({meshWarp:{gridX:3,gridY:3,controlPoints:[[{x:0,y:0}]]}},[a]),/Mesh/);
 assert.throws(()=>validateImageGroups([{id:'group:x',name:'x',transform:{mask:{source:'file:///secret'}}}],[a]),/asset/);
 assert.throws(()=>sourceForEngine('https://127.0.0.1/private',[a],Buffer.alloc(20)),/verified image/);
 assert.throws(()=>validateImageOptions({filters:[{type:'sharpen',radius:9}]},[a]),/not supported/);
 assert.throws(()=>validateImageOptions({filters:[{type:'grayscale',radius:2}]},[a]),/not supported/);
});
test('real native image compositing and canonical generated code return equivalent PNG',async()=>{
 const a=await asset(),d=createBlankDocument();
 d.width=128;d.height=96;d.background={...d.background,mode:'color',color:'#102337'};
 d.assets=[a];d.layers=[newLayer('image','img',a.id)];
 const layer=d.layers[0];
 layer.x=12;layer.y=14;layer.width=68;layer.height=62;
 layer.imageOptions={fit:'contain',align:'top-left',borderRadius:5,filters:[{type:'grayscale'}],mask:{source:a.id,mode:'alpha'}};
 const valid=validateDocument(d),painter=new ApexPainter({type:'buffer'});
 const {buffer}=await painter.createCanvas({width:valid.width,height:valid.height,colorBg:'#102337'});
 const artwork=await readFile('public/workspace/assets/crystal-lake.webp');
 const out=await painter.createImage(imageArguments(valid.layers[0] as Extract<typeof layer,{kind:'image'}>,valid,artwork),buffer);
 assert.equal((await sharp(out).metadata()).width,128);
 const folder=await mkdtemp(join(process.cwd(),'tests/workspace/.image-editor-'));
 try{
   const script=join(folder,'program.mjs'),output=join(folder,'result.png');
   await writeFile(script,generateSource(valid).replace("writeFile('output.png', output)","writeFile("+JSON.stringify(output)+", output)"));
   await exec(process.execPath,[script],{cwd:process.cwd(),timeout:30000});
   assert.deepEqual(await readFile(output),out);
 }finally{await rm(folder,{recursive:true,force:true})}
});
test('actual public-v6 group transform renders with two image members',async()=>{
 const a=await asset(),d=createBlankDocument();
 d.width=96;d.height=80;d.background={...d.background,mode:'color'};
 d.assets=[a];d.imageGroups=[{id:'group:demo',name:'Merged',transform:{translateX:8,scaleX:1,scaleY:1,opacity:0.8,boxBackground:{gradient:{type:'linear',colors:[{stop:0,color:'#553322'},{stop:1,color:'#11bbcc'}]}}}}];
 const one=newLayer('image','i1',a.id),two=newLayer('image','i2',a.id);
 Object.assign(one,{x:4,y:4,width:20,height:20,imageGroupId:'group:demo'});
 Object.assign(two,{x:20,y:20,width:20,height:20,imageGroupId:'group:demo'});
 d.layers=[one,two];const valid=validateDocument(d),painter=new ApexPainter({type:'buffer'});
 const artwork=await readFile('public/workspace/assets/crystal-lake.webp');
 const {buffer}=await painter.createCanvas({width:96,height:80,colorBg:'#030916'});
 const png=await painter.createImage(valid.layers.map(l=>imageArguments(l as Extract<typeof l,{kind:'image'}>,valid,artwork)),buffer,
  {isGrouped:true,groupTransform:groupArguments(valid.imageGroups![0].transform,valid,artwork)});
 assert.equal((await sharp(png).metadata()).height,80);
});

test('S23 upgraded native image conic startAngle produces discriminating pixels',async()=>{
 const d=createBlankDocument(),a=await asset();d.assets=[a];
 const first=newLayer('shape','conic-shape');
 Object.assign(first,{x:0,y:0,width:96,height:96});
 const common={type:'conic' as const,centerX:48,centerY:48,colors:[{stop:0,color:'#ff0000'},{stop:0.5,color:'#00ff00'},{stop:1,color:'#0000ff'}]};
 const painter=new ApexPainter({type:'buffer'});
 const {buffer}=await painter.createCanvas({width:96,height:96,colorBg:'#101010'});
 const render=async(startAngle:number)=>{
  const layer=structuredClone(first);
  layer.imageOptions={shape:{fill:true,gradient:{...common,startAngle}}};
  const valid=validateDocument({...d,layers:[layer]});
  const artwork=await readFile('public/workspace/assets/crystal-lake.webp');
  const png=await painter.createImage(imageArguments(valid.layers[0] as Extract<typeof first,{kind:'shape'}>,valid,artwork),buffer);
  return (await sharp(png).ensureAlpha().raw().toBuffer()).toString('hex');
 };
 const a0=await render(0),a180=await render(180);
 assert.notEqual(a0,a180,'S23 native createImage must rotate conic gradients when startAngle changes');
});
test('interleaved native image groups retain text/chart layer order and generated-code PNG parity',async()=>{
 const a=await asset(),d=createBlankDocument();d.assets=[a];
 d.width=128;d.height=104;d.background={...d.background,mode:'color',color:'#151d2b'};
 d.imageGroups=[{id:'group:split',name:'split',transform:{translateX:5,opacity:0.9}}];
 const makeImage=(id:string,x:number,y:number)=>{const l=newLayer('image',id,a.id);Object.assign(l,{x,y,width:28,height:28,imageGroupId:'group:split'});return l;};
 const first=makeImage('a',5,5),second=makeImage('b',29,5),third=makeImage('c',5,45),fourth=makeImage('d',86,55);
 const middle=newLayer('text','txt');Object.assign(middle,{text:'Z',x:40,y:40,fontSize:30,color:'#ffff00',visible:true});
 const chart=newLayer('chart','bar');Object.assign(chart,{x:70,y:5,width:47,height:35,chartType:'bar',values:[2,4],labels:['A','B'],colors:['#ff0000','#00ff00'],visible:true});
 if(middle.kind!=='text'||chart.kind!=='chart')throw Error('test fixture discriminants changed');
 d.layers=[first,second,middle,third,chart,fourth];
 const valid=validateDocument(d),source=generateSource(valid);
 assert.deepEqual(parseSource(source),valid);
 assert.deepEqual(valid.layers.map(l=>l.id),d.layers.map(l=>l.id));
 const painter=new ApexPainter({type:'buffer'});
 let output=(await painter.createCanvas({width:128,height:104,colorBg:'#151d2b'})).buffer;
 const art=await readFile('public/workspace/assets/crystal-lake.webp');
 const images=(...layers:(typeof first)[])=>layers.map(l=>imageArguments(l as Extract<typeof l,{kind:'image'}>,valid,art));
 output=await painter.createImage(images(first,second),output,{isGrouped:true,groupTransform:groupArguments(valid.imageGroups![0].transform,valid,art)});
 output=await painter.createText({text:middle.text,x:middle.x,y:middle.y,font:{family:'DejaVu Sans',size:middle.fontSize,weight:middle.weight},fill:{color:middle.color,opacity:middle.opacity},placement:{textBaseline:'top',rotation:middle.rotation}},output);
 output=await painter.createImage(images(third),output,{isGrouped:true,groupTransform:groupArguments(valid.imageGroups![0].transform,valid,art)});
 const chartPng=await painter.createChart(chart.chartType,chart.values.map((value,i)=>({value,label:chart.labels[i],color:chart.colors[i],xStart:i,xEnd:i+1})),{dimensions:{width:chart.width,height:chart.height}});
 output=await painter.createImage({source:chartPng,x:chart.x,y:chart.y,width:chart.width,height:chart.height,rotation:chart.rotation,opacity:chart.opacity},output);
 output=await painter.createImage(images(fourth),output,{isGrouped:true,groupTransform:groupArguments(valid.imageGroups![0].transform,valid,art)});
 const folder=await mkdtemp(join(process.cwd(),'tests/workspace/.image-order-'));
 try{
  const script=join(folder,'program.mjs'),out=join(folder,'rendered.png');
  await writeFile(script,source.replace("writeFile('output.png', output)","writeFile("+JSON.stringify(out)+", output)"));
  await exec(process.execPath,[script],{cwd:process.cwd(),timeout:30000});
  assert.deepEqual(await readFile(out),output);
 }finally{await rm(folder,{recursive:true,force:true})}
});
