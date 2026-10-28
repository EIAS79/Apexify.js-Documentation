import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHeroDocument,validateDocument,type WorkspaceDocument} from '../../features/apex-workspace/model';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {migrateV1,toV1} from '../../features/apex-workspace/domain/project';
const require=createRequire(import.meta.url),exec=promisify(execFile);
function document(background:Partial<WorkspaceDocument['background']>={}){
 const doc=createHeroDocument();doc.width=160;doc.height=112;doc.layers=[];
 return validateDocument({...doc,background:{...doc.background,...background}});
}
test('image-background controls validate bounds and survive project/code/v2 round trips',()=>{
 const doc=document({fit:'contain',align:'bottom-right',opacity:.65,blur:4});
 assert.deepEqual(parseSource(generateSource(doc)),doc);
 assert.deepEqual(toV1(migrateV1(doc,'p:background-controls')),doc);
 for(const patch of [{fit:'invalid'},{align:'invalid'},{opacity:1.1},{blur:-1},{blur:Infinity}])
  assert.throws(()=>document(patch as never));
 assert.throws(()=>validateDocument({...doc,canvasExtras:{noiseBg:{intensity:.05}}}),/Remove background image blur/);
});
test('fit/alignment/opacity/blur change actual native pixels and generated programs remain byte exact',async()=>{
 const dir=await mkdtemp(join(process.cwd(),'tests/workspace/.background-controls-'));
 try{
  const outfile=join(dir,'server.cjs');
  await build({entryPoints:['features/apex-workspace/server/render.ts'],outfile,platform:'node',format:'cjs',bundle:true,packages:'external',plugins:[{name:'server-marker',setup(b){b.onResolve({filter:/^server-only$/},()=>({path:'marker',namespace:'marker'}));b.onLoad({filter:/.*/,namespace:'marker'},()=>({contents:''}));}}]});
  const {renderWorkspaceDocument}=require(outfile);
  const baseline=await renderWorkspaceDocument(document());
  const variants:WorkspaceDocument[]=[document({fit:'contain'}),document({align:'left'}),document({opacity:.4}),document({blur:6}),
   validateDocument({...document({fit:'contain',align:'right',opacity:.7}),canvasExtras:{patternBg:{type:'grid',color:'#ff0000',size:8,spacing:16,opacity:.3}}})];
  for(let index=0;index<variants.length;index++){
   const doc=variants[index],direct=await renderWorkspaceDocument(doc);
   assert.notDeepEqual(direct,baseline,'control '+index+' must affect actual pixels');
   const target=join(dir,index+'.png'),program=join(dir,index+'.mjs');
   await writeFile(program,generateSource(doc).replace("writeFile('output.png', output)","writeFile("+JSON.stringify(target)+", output)"));
   await exec(process.execPath,[program],{cwd:process.cwd(),timeout:30000});
   assert.deepEqual(await readFile(target),direct,'native/source parity for control '+index);
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
