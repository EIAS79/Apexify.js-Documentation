import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import sharp from 'sharp';import {ApexPainter} from 'apexify.js';
import {validateCanvasExtras,type CanvasBorderSide} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {editCanvasGraph,projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
const api=new ApexPainter(),exec=promisify(execFile);
const sides:CanvasBorderSide[]=['all','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'];
for(const key of ['roundedCorners','borderPosition'] as const)for(const side of sides)test('S13 exact stroke side Code/native/Graph contract '+key+'='+side,async()=>{
 const stroke={color:'#f030c0',width:16,opacity:0.75,borderRadius:18,style:'solid' as const,[key]:side};
 const extras=validateCanvasExtras({stroke});
 const doc=createBlankDocument();doc.width=128;doc.height=96;doc.layers=[];doc.background={...doc.background,mode:'color',transparent:false,color:'#112a40'};doc.canvasExtras=extras;
 const d=validateDocument(doc);
 assert.equal(d.canvasExtras?.stroke?.[key],side);
 assert.deepEqual(parseSource(generateSource(d)).canvasExtras,extras);
 assert.deepEqual(transactCanvasViaV2(d,extras).document,d);
 assert.ok(projectCanvasGraph(d).edges.some(x=>x.id==='edge:stroke-root'));
 assert.equal(editCanvasGraph(d,{op:'stroke',value:stroke}).stroke?.[key],side);
 const actual=(await api.createCanvas({width:128,height:96,colorBg:'#112a40',stroke})).buffer;
 const folder=await mkdtemp(join(process.cwd(),'.s13-side-'));
 try{
  const out=join(folder,'out.png'),program=join(folder,'program.mjs');
  await writeFile(program,generateSource(d).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(out)+', output)'));
  await exec(process.execPath,[program],{cwd:process.cwd(),timeout:30000});
  assert.deepEqual(await sharp(await readFile(out)).ensureAlpha().raw().toBuffer(),await sharp(actual).ensureAlpha().raw().toBuffer());
 }finally{await rm(folder,{recursive:true,force:true})}
});
