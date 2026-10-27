import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import sharp from 'sharp';import {ApexPainter} from 'apexify.js';import {createHash} from 'node:crypto';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {editCanvasGraph,projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
const run=promisify(execFile),painter=new ApexPainter();
const corners=['all','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'] as const;
const raw=async(b:Buffer)=>sharp(b).ensureAlpha().raw().toBuffer();
const digest=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
function makeDoc(roundedCorners:typeof corners[number],borderRadius=36){
 const d=createBlankDocument();d.width=240;d.height=160;d.layers=[];
 d.background={...d.background,mode:'color',color:'#277aca',transparent:false};
 d.canvasExtras=validateCanvasExtras({borderRadius,shadow:{
   color:'#ff55ba',offsetX:26,offsetY:19,opacity:1,blur:0,roundedCorners}});
 return validateDocument(d);
}
test('S17 native conditional roundedCorners & Code parity for all 9 selectors',async()=>{
 const effects=new Set<string>(),flat=new Set<string>(),codeIds:string[]=[];
 for(const side of corners){
  const d=makeDoc(side),parsed=parseSource(generateSource(d));
  assert.deepEqual(parsed,d,'Reversible generated Code '+side);
  const opts=d.canvasExtras!;
  assert.deepEqual(transactCanvasViaV2(d,opts).document.canvasExtras,opts);
  assert.ok(projectCanvasGraph(d).nodes.some(x=>x.id==='canvas:shadow'));
  const graph=editCanvasGraph(d,{op:'shadow',value:{...opts.shadow!,roundedCorners:side}});
  assert.equal(graph.shadow?.roundedCorners,side);
  const valid={width:d.width,height:d.height,colorBg:'#277aca',...opts};
  const native=await raw((await painter.createCanvas(valid)).buffer);
  effects.add(digest(native));
  const flatCfg={...valid,borderRadius:0};
  flat.add(digest(await raw((await painter.createCanvas(flatCfg)).buffer)));
  const temp=await mkdtemp(join(process.cwd(),'.s17-shadow-cert-'));
  try{
    const out=join(temp,'result.png'),file=join(temp,'program.mjs');
    const code=generateSource(d);
    assert.ok(code.includes("writeFile('output.png', output)"),'Emitter output marker');
    await writeFile(file,code.replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(out)+', output)'));
    await run(process.execPath,[file],{cwd:process.cwd(),timeout:30000});
    const standalone=await raw(await readFile(out));
    assert.deepEqual(standalone,native,'Public-v6 generated Code raster differs for '+side);
    codeIds.push(digest(standalone));
  }finally{await rm(temp,{recursive:true,force:true})}
 }
 assert.ok(effects.size>=4,'Nonzero root radius must produce actual distinct effects');
 assert.equal(flat.size,1,'Zero root radius must remain visually inert');
 assert.equal(codeIds.length,9);
 console.log('S17_ROUNDED_SHADOW_CODE_PIXEL_EQUALITY='+JSON.stringify({cornerSelectors:corners.length,effectiveDistinct:effects.size,flatDistinct:flat.size,codeCases:codeIds.length}));
});
test('S17 invalid rounded-corner selector is fail-closed',()=>{
 assert.throws(()=>validateCanvasExtras({shadow:{roundedCorners:'unknown',color:'#00ddff'}}),/rounded|unsupported|canvas-options/i);
});
