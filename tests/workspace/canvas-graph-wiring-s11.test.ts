import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,validateDocument,type WorkspaceDocument} from '../../features/apex-workspace/model';
import {projectCanvasGraph,canvasGraphPortId,editCanvasGraph,editCanvasGraphDocument,validateGraphTopology,type CanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
const exec=promisify(execFile);
async function image(r:number,g:number,b:number){
 const png=await sharp({create:{width:16,height:14,channels:4,background:{r,g,b,alpha:1}}}).png().toBuffer();
 const sha256=createHash('sha256').update(png).digest('hex');
 return {id:'asset:'+sha256,sha256,mime:'image/png' as const,width:16,height:14,bytes:png.length,
   dataUri:'data:image/png;base64,'+png.toString('base64')};
}
async function sample(){
 const a=await image(235,27,63),b=await image(34,178,239);
 const document=createBlankDocument();document.width=96;document.height=80;document.layers=[];document.assets=[a,b];
 document.canvasExtras={bgLayers:[
  {type:'pattern',source:a.id,repeat:'repeat',nodeId:'layer:stable-alpha'},
  {type:'image',source:b.id,fit:'contain',nodeId:'layer:stable-beta'}
 ]};
 return validateDocument(document);
}
test('stable graph node and port identities survive layer reorder, duplicate content and reload',async()=>{
 const doc=await sample();
 const graph=projectCanvasGraph(doc);
 assert.equal(new Set(graph.nodes.map(n=>n.id)).size,graph.nodes.length);
 assert.equal(new Set(graph.ports.map(n=>n.id)).size,graph.ports.length);
 assert.ok(graph.ports.some(p=>p.id===canvasGraphPortId('canvas:ordered-layer:layer:stable-alpha','input','image-asset')));
 const rearranged=validateDocument({...doc,canvasExtras:editCanvasGraph(doc,{op:'layer-order',from:0,to:1})});
 const ports=projectCanvasGraph(rearranged).ports.map(x=>x.id);
 assert.ok(ports.includes(canvasGraphPortId('canvas:ordered-layer:layer:stable-alpha','input','image-asset')));
 assert.deepEqual(rearranged.canvasExtras?.bgLayers?.map(x=>x.nodeId),['layer:stable-beta','layer:stable-alpha']);
 assert.deepEqual(parseSource(generateSource(rearranged)),rearranged);
 const restored=validateDocument(JSON.parse(JSON.stringify(rearranged)));
 assert.deepEqual(projectCanvasGraph(restored).ports.map(x=>x.id),ports);
 assert.throws(()=>validateCanvasExtras({bgLayers:[
  {type:'color',value:'#ff0000',nodeId:'layer:same-one'},
  {type:'color',value:'#0000ff',nodeId:'layer:same-one'}]}),/duplicate/);
 assert.throws(()=>validateCanvasExtras({bgLayers:[{type:'color',value:'#ffffff',nodeId:'file:///etc/passwd'}]}),/invalid/);
});
test('typed graph connect, disconnect and incompatible cycles reject atomically and preserve canonical project',async()=>{
 const doc=await sample();
 const graph=projectCanvasGraph(doc);
 const source=canvasGraphPortId('canvas:image:'+doc.assets![1].id,'output','image-asset');
 const layer=canvasGraphPortId('canvas:ordered-layer:layer:stable-alpha','input','image-asset');
 const before=JSON.stringify(doc);
 const options=editCanvasGraph(doc,{op:'connect',fromPort:source,toPort:layer});
 assert.equal(options.bgLayers?.[0].type,'pattern');
 if(options.bgLayers?.[0].type==='pattern')assert.equal(options.bgLayers[0].source,doc.assets![1].id);
 assert.equal(JSON.stringify(doc),before);
 const updated=validateDocument({...doc,canvasExtras:options});
 assert.equal(projectCanvasGraph(updated).edges.find(e=>e.id==='edge:layer-source:layer:stable-alpha')?.from,
  'canvas:image:'+doc.assets![1].id);
 const rootTarget=canvasGraphPortId('canvas:background','input','image-asset');
 const root=editCanvasGraph(doc,{op:'connect',fromPort:source,toPort:rootTarget});
 assert.equal(root.customBg?.source,doc.assets![1].id);
 const active=validateDocument({...doc,canvasExtras:root});
 assert.equal(editCanvasGraph(active,{op:'disconnect',toPort:rootTarget}).customBg,undefined);
 assert.throws(()=>editCanvasGraph(doc,{op:'disconnect',toPort:layer}),/required layer source/);
 assert.throws(()=>editCanvasGraph(doc,{op:'connect',fromPort:'canvas:root|output|canvas',toPort:layer}),/type mismatch/);
 assert.throws(()=>editCanvasGraph(doc,{op:'connect',fromPort:source,toPort:'unknown|input|image-asset'}),/target port/);
 assert.throws(()=>editCanvasGraph(doc,{op:'connect',fromPort:'missing|output|image-asset',toPort:layer}),/source port/);
 assert.throws(()=>editCanvasGraph(doc,{op:'connect',fromPort:source,toPort:canvasGraphPortId('canvas:root','input','ordered-layer')}),/mismatch/);
 assert.equal(graph.nodes.length,projectCanvasGraph(doc).nodes.length);
});
test('content-addressed graph rewiring renders actual pixels and generated public-v6 source is byte exact',async()=>{
 const doc=await sample();
 const painter=new ApexPainter();
 const asset=doc.assets![1].id;
 const graph=projectCanvasGraph(doc);
 const source=canvasGraphPortId('canvas:image:'+asset,'output','image-asset');
 const target=canvasGraphPortId('canvas:ordered-layer:layer:stable-alpha','input','image-asset');
 const changed=validateDocument({...doc,canvasExtras:editCanvasGraph(doc,{op:'connect',fromPort:source,toPort:target})});
 const view=async(d:WorkspaceDocument)=>{
  const layers=d.canvasExtras!.bgLayers!.map(layer=>{
   const {nodeId:_authoring,...api}=layer;
   return api.type==='image'||api.type==='pattern'
    ? {...api,source:d.assets!.find(a=>a.id===api.source)!.dataUri}:api;
  });
  return (await painter.createCanvas({width:d.width,height:d.height,colorBg:d.background.color,bgLayers:layers})).buffer;
 };
 const first=await view(doc),second=await view(changed);
 assert.notDeepEqual(await sharp(first).raw().toBuffer(),await sharp(second).raw().toBuffer());
 const dir=await mkdtemp(join(process.cwd(),'.s11-graph-'));
 try{
  const code=generateSource(changed).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(join(dir,'output.png'))+', output)');
  const f=join(dir,'s11.mjs');await writeFile(f,code);
  await exec(process.execPath,[f],{cwd:process.cwd(),timeout:30000});
  const generated=await readFile(join(dir,'output.png'));
  assert.deepEqual(generated,second,'Graph project -> portable public-v6 code must match direct decoded source');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('active Graph transaction bridges v1 through validated canonical v2 without a second mutable state',async()=>{
 const doc=await sample();
 const next=editCanvasGraph(doc,{op:'layer-order',from:0,to:1});
 const original=JSON.stringify(doc);
 const tx=transactCanvasViaV2(doc,next);
 assert.equal(tx.canonical.schemaVersion,2);
 assert.equal(tx.canonical.canvas.extras?.bgLayers?.[0].nodeId,'layer:stable-beta');
 assert.equal(tx.document.schemaVersion,1);
 assert.deepEqual(tx.document.canvasExtras,next);
 assert.equal(JSON.stringify(doc),original,'v1 state not mutated before commit');
 assert.deepEqual(parseSource(generateSource(tx.document)),tx.document);
 assert.equal(tx.document.assets?.[0].dataUri,doc.assets?.[0].dataUri,'immutable asset references preserved');
 assert.throws(()=>transactCanvasViaV2(doc,{bgLayers:[{type:'image',source:'https://invalid.test/x.png'}]}),/content-addressed/);
 assert.throws(()=>transactCanvasViaV2({...doc,schemaVersion:3 as never},next),/Unsupported workspace document version/);
});

test('FULL candidate: solid-color and transparent background contract across public v6, v2 bridge and typed Graph',async()=>{
 const blank=createBlankDocument();blank.width=96;blank.height=80;blank.layers=[];blank.canvasExtras={};
 const doc=validateDocument(blank);
 const target=canvasGraphPortId('canvas:background','input','color');
 const from=canvasGraphPortId('canvas:color:root','output','color');
 const initial=JSON.stringify(doc);
 const colored=editCanvasGraphDocument(doc,{op:'set-color',color:'#7b139e'});
 assert.equal(colored.background.color,'#7b139e');
 assert.equal(colored.background.mode,'color');
 assert.equal(colored.background.transparent,false);
 const canonical=transactCanvasViaV2(colored,colored.canvasExtras??{});
 assert.equal(canonical.canonical.schemaVersion,2);
 assert.equal(canonical.canonical.canvas.background.color,'#7b139e');
 assert.deepEqual(canonical.document,colored);
 assert.equal(JSON.stringify(doc),initial,'Graph changes must not mutate prior undo history');
 assert.ok(projectCanvasGraph(colored).edges.some(e=>e.id==='edge:color-bg'));
 const transparent=editCanvasGraphDocument(colored,{op:'disconnect-color',toPort:target});
 assert.equal(transparent.background.transparent,true);
 assert.equal(projectCanvasGraph(transparent).edges.some(e=>e.id==='edge:color-bg'),false);
 const connected=editCanvasGraphDocument(transparent,{op:'connect-color',fromPort:from,toPort:target});
 assert.equal(connected.background.transparent,false);
 assert.equal(connected.background.color,'#7b139e');
 assert.throws(()=>editCanvasGraphDocument(doc,{op:'connect-color',fromPort:'canvas:root|output|canvas',toPort:target}),/type mismatch/);
 assert.throws(()=>editCanvasGraphDocument(doc,{op:'set-color',color:'url(http://evil.test)'}),/opaque hex/);
 assert.throws(()=>editCanvasGraphDocument(doc,{op:'disconnect-color',toPort:'wrong'}),/exact input/);
 const painter=new ApexPainter();
 const solid=(await painter.createCanvas({width:96,height:80,colorBg:'#7b139e'})).buffer;
 const clear=(await painter.createCanvas({width:96,height:80,transparentBase:true})).buffer;
 const raw1=await sharp(solid).ensureAlpha().raw().toBuffer();
 const raw2=await sharp(clear).ensureAlpha().raw().toBuffer();
 assert.equal(raw1[0],0x7b);assert.equal(raw1[1],0x13);assert.equal(raw1[2],0x9e);assert.equal(raw1[3],255);
 assert.equal(raw2[3],0);
 assert.notDeepEqual(raw1,raw2);
 const dir=await mkdtemp(join(process.cwd(),'.s11-bg-'));
 try{
  for(const [version,expected] of [[colored,solid],[transparent,clear]] as const){
    assert.deepEqual(parseSource(generateSource(version)),version);
    const file=join(dir,'out-'+(version.background.transparent?'clear':'solid')+'.png');
    const program=join(dir,'code-'+(version.background.transparent?'clear':'solid')+'.mjs');
    const source=generateSource(version).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(file)+', output)');
    await writeFile(program,source);await exec(process.execPath,[program],{cwd:process.cwd(),timeout:30000});
    assert.deepEqual(await readFile(file),expected,'generated public-v6 canvas must be byte exact for solid and alpha');
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('typed graph topology rejects explicit cycles, missing refs and type-incompatible edges',()=>{
 const graph:CanvasGraph={nodes:[
  {id:'A',kind:'image',name:'A',inputs:['image-asset'],outputs:['image-asset']},
  {id:'B',kind:'image',name:'B',inputs:['image-asset'],outputs:['image-asset']}
 ],ports:[
  {id:canvasGraphPortId('A','input','image-asset'),nodeId:'A',direction:'input',type:'image-asset'},
  {id:canvasGraphPortId('A','output','image-asset'),nodeId:'A',direction:'output',type:'image-asset'},
  {id:canvasGraphPortId('B','input','image-asset'),nodeId:'B',direction:'input',type:'image-asset'},
  {id:canvasGraphPortId('B','output','image-asset'),nodeId:'B',direction:'output',type:'image-asset'}
 ],edges:[{id:'edge:A:B',from:'A',to:'B',type:'image-asset'}]};
 assert.doesNotThrow(()=>validateGraphTopology(graph));
 assert.throws(()=>validateGraphTopology(graph,{id:'edge:B:A',from:'B',to:'A',type:'image-asset'}),/cycle/);
 assert.throws(()=>validateGraphTopology(graph,{id:'edge:missing',from:'missing',to:'B',type:'image-asset'}),/missing/);
 assert.throws(()=>validateGraphTopology(graph,{id:'edge:wrong',from:'A',to:'B',type:'canvas'}),/type mismatch/);
 assert.throws(()=>validateGraphTopology({...graph,ports:[...graph.ports,graph.ports[0]]}),/duplicate port/);
});

test('transparentBase Boolean with ordered translucent layers, absence/false default, and forbidden conflicting primaries',async()=>{
 const painter=new ApexPainter();
 const a={width:96,height:80,bgLayers:[{type:'color' as const,value:'#ff3322',opacity:0.5}]};
 const none=(await painter.createCanvas({...a})).buffer;
 const falseValue=(await painter.createCanvas({...a,transparentBase:false})).buffer;
 const trueValue=(await painter.createCanvas({...a,transparentBase:true})).buffer;
 assert.deepEqual(none,falseValue,'omitted transparentBase equals explicit false');
 const rgbOpaque=await sharp(falseValue).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const rgbTransparent=await sharp(trueValue).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const p=4*(40*96+40)+3;
 assert.equal(rgbOpaque.data[p],255,'nontransparent base remains fully opaque');
 assert.ok(rgbTransparent.data[p]>0&&rgbTransparent.data[p]<255,'transparent canvas retains ordered layer alpha');
 assert.throws(()=>painter.createCanvas({width:96,height:80,colorBg:'#123456',transparentBase:true}),/background|only one primary/i);
});
