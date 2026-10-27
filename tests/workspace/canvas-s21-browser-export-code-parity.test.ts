import test from 'node:test';import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';import {join,resolve} from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import sharp from 'sharp';import {ApexPainter} from 'apexify.js';
import {validateDocument} from '../../features/apex-workspace/model';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {projectCanvasGraph,validateGraphTopology} from '../../features/apex-workspace/canvas-graph';
const exec=promisify(execFile),base='D:/ApexifyWorkspaceIntegration/audit/S21_S20_CONTROLLED_INTEGRATION/S21_BROWSER';
const painter=new ApexPainter({type:'buffer'});
const entries=[
 ['canvas.patternBg.repeat','01_root_repeat'],
 ['canvas.bgLayers.pattern.repeat','02_layer_repeat'],
 ['canvas.shadow.borderRadius','03_shadow_radius'],
 ['canvas.shadow.borderPosition','04_shadow_position']
];
const hydrated=(x:any):any=>Array.isArray(x)?x.map(hydrated):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='nodeId').map(([k,v])=>[k,hydrated(v)])):x;
for(const [name,filename] of entries)test('S21 browser-exported project + generated-Code and independent S20 native RGBA '+name,async()=>{
 const exported=JSON.parse(await readFile(join(base,filename+'.apexify.json'),'utf8'));
 const doc=validateDocument(exported);
 const actualCode=await readFile(join(base,filename+'.ts'),'utf8');
 assert.equal(generateSource(doc),actualCode,'Real Chromium Code download disagrees with canonical state');
 assert.deepEqual(parseSource(actualCode),doc,'Real Chromium Code import back into Visual/Graph');
 const graph=projectCanvasGraph(doc);validateGraphTopology(graph);assert.ok(graph.nodes.some((n:any)=>n.id==='canvas:root'));
 const {gradientBg,patternBg,noiseBg,customBg,bgLayers,...effects}=doc.canvasExtras||{};
 const bg=doc.background;
 const cfg={width:doc.width,height:doc.height,...(customBg?{customBg}:gradientBg?{gradientBg}:bg.transparent?{transparentBase:true}:{colorBg:bg.color}),...(patternBg?{patternBg}:{}),...(noiseBg?{noiseBg}:{}),...(bgLayers?{bgLayers:hydrated(bgLayers)}:{}),...effects};
 const native=(await painter.createCanvas(cfg as any)).buffer;
 const t=await mkdtemp(resolve(process.cwd(),'.s21export-'));
 try{
  const script=join(t,'main.mjs'),output=join(t,'output.png');
  await writeFile(script,actualCode.replace("await writeFile('output.png', output)",'await writeFile('+JSON.stringify(output)+', output)'));
  await exec(process.execPath,[script],{cwd:process.cwd(),timeout:30000,maxBuffer:1048576});
  const generated=await readFile(output);
  const rawNative=await sharp(native).ensureAlpha().raw().toBuffer();
  const rawCode=await sharp(generated).ensureAlpha().raw().toBuffer();
  assert.deepEqual(rawCode,rawNative,'Browser-exported public-v6 Code/native raw pixel discrepancy '+name);
  console.log('S21_BROWSER_EXPORT_CODE_NATIVE_RAW_PARITY='+name+' pixels='+doc.width*doc.height);
 }finally{await rm(t,{recursive:true,force:true,maxRetries:10,retryDelay:140})}
});
