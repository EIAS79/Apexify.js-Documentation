import test from 'node:test';
import assert from 'node:assert/strict';
import {ApexPainter} from 'apexify.js';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {migrateV1,toV1,validateProject} from '../../features/apex-workspace/domain/project';
const require=createRequire(import.meta.url),exec=promisify(execFile);
const gradient=(type:'linear'|'radial'|'conic')=>({type,colors:[{stop:0,color:'#ff0000'},{stop:1,color:'#0000ff'}]});
test('canvas options are validated, forward-unknown fields rejected, and v1/v2 preserve editor values',()=>{
  const extras=validateCanvasExtras({gradientBg:gradient('radial'),bgLayers:[{type:'color',value:'#ff0000',opacity:1},{type:'noise',intensity:0.1}],zoom:{scale:1.1},stroke:{color:'#cccccc',width:2}});
  const d=validateDocument({...createBlankDocument(),canvasExtras:extras});
  assert.deepEqual(parseSource(generateSource(d)),d);
  const migrated=migrateV1(d,'p:canvas');
  assert.deepEqual(validateProject(migrated),migrated);
  assert.deepEqual(toV1(migrated),d);
  assert.throws(()=>validateCanvasExtras({videoBg:{source:'https://external.invalid/a.mp4'}}),/unsupported keys/);
  assert.throws(()=>validateCanvasExtras({bgLayers:[{type:'image',source:'https://external.invalid/a.png'}]}),/content-addressed imported asset/);
  assert.throws(()=>validateCanvasExtras({patternBg:{type:'custom',customPatternImage:'file:///secret'}}),/content-addressed imported asset/);
  assert.throws(()=>validateCanvasExtras({gradientBg:{...gradient('linear'),colors:[{stop:1,color:'#123456'},{stop:0,color:'#654321'}]}}),/ordered/);
  assert.throws(()=>validateCanvasExtras({bgLayers:Array(13).fill({type:'color',value:'#000000'})}),/limited/);
  assert.throws(()=>validateCanvasExtras({opacity:Infinity}),/range/);
  assert.throws(()=>validateCanvasExtras({x:NaN}),/range/);
});
test('pinned runtime: gradient variants, mixed layer order and procedural preset render actual buffers',async()=>{
  const painter=new ApexPainter({type:'buffer'});
  const base={width:80,height:60};
  const cases=[
    {...base,gradientBg:gradient('linear')},
    {...base,gradientBg:gradient('radial')},
    {...base,gradientBg:gradient('conic')},
    {...base,bgLayers:[{type:'color',value:'#ff0000'},{type:'color',value:'#0000ff',opacity:0.5}]},
    {...base,bgLayers:[{type:'color',value:'#0000ff',opacity:0.5},{type:'color',value:'#ff0000'}]},
    {...base,patternBg:{type:'grid',color:'#ff0000',size:8,spacing:16}},
    {...base,noiseBg:{intensity:0.15}},
  ];
  const buffers:Buffer[]=[];
  for(const config of cases){
    const {buffer}=await painter.createCanvas(config as Parameters<typeof painter.createCanvas>[0]);
    assert.equal(buffer.subarray(1,4).toString(),'PNG');
    assert.equal(buffer.readUInt32BE(16),80);assert.equal(buffer.readUInt32BE(20),60);
    buffers.push(buffer);
  }
  assert.notDeepEqual(buffers[3],buffers[4],'layer reordering must change actual pixels');
  assert.notDeepEqual(buffers[0],buffers[1]);assert.notDeepEqual(buffers[1],buffers[2]);
});
test('Visual/Code/Graph document data generates same bytes as server for gradient and layer authoring',async()=>{
  const temp=await mkdtemp(join(process.cwd(),'tests/workspace/canvas-advanced-proof-'));
  try{
    const outfile=join(temp,'server.cjs');
    await build({entryPoints:['features/apex-workspace/server/render.ts'],outfile,platform:'node',format:'cjs',bundle:true,packages:'external',plugins:[{name:'server-marker',setup(b){b.onResolve({filter:/^server-only$/},()=>({path:'marker',namespace:'marker'}));b.onLoad({filter:/.*/,namespace:'marker'},()=>({contents:''}));}}]});
    const {renderWorkspaceDocument}=require(outfile);
    const doc=createBlankDocument();doc.width=160;doc.height=112;
    doc.background={...doc.background,mode:'color',color:'#080f25'};
    doc.canvasExtras=validateCanvasExtras({gradientBg:gradient('conic'),bgLayers:[{type:'color',value:'#ff0000',opacity:0.4},{type:'noise',intensity:0.06}],opacity:0.95});
    const direct=await renderWorkspaceDocument(doc);
    const target=join(temp,'proof.png'),program=join(temp,'program.mjs');
    await writeFile(program,generateSource(doc).replace("writeFile('output.png', output)","writeFile("+JSON.stringify(target)+", output)"));
    await exec(process.execPath,[program],{cwd:process.cwd(),timeout:30000});
    const generated=await readFile(target);
    assert.deepEqual(direct,generated);
    const changed=validateDocument({...doc,canvasExtras:{...doc.canvasExtras,bgLayers:[...doc.canvasExtras.bgLayers!].reverse()}});
    assert.notDeepEqual(direct,await renderWorkspaceDocument(changed));
    assert.deepEqual(parseSource(generateSource(changed)),changed);
  }finally{await rm(temp,{recursive:true,force:true});}
});
