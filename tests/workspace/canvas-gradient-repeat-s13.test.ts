import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasExtras,type CanvasGradient} from '../../features/apex-workspace/canvas-options';
import {projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const api=new ApexPainter();
const colors=[{stop:0,color:'#ef2445'},{stop:1,color:'#20facc'}];
const families:CanvasGradient[]=[
 {type:'linear',startX:0,startY:0,endX:22,endY:9,colors},
 {type:'radial',startX:18,startY:26,endX:18,endY:26,startRadius:0,endRadius:20,colors}
];
async function rgba(g:CanvasGradient){return sharp((await api.createCanvas({width:112,height:84,gradientBg:g})).buffer).ensureAlpha().raw().toBuffer();}
function doc(g:CanvasGradient){const d=createBlankDocument();d.width=112;d.height=84;d.layers=[];d.canvasExtras=validateCanvasExtras({gradientBg:g});return validateDocument(d)}
for(const base of families)test('S13 root gradient repeat all 3 modes are pinned-effective, bounded, history/code compatible: '+base.type,async()=>{
 const variants=['no-repeat','repeat','reflect'] as const,seen=new Map<string,Buffer>();
 for(const repeat of variants){
  const g={...base,repeat},d=doc(g);
  assert.equal(d.canvasExtras?.gradientBg?.repeat,repeat);
  assert.deepEqual(parseSource(generateSource(d)),d);
  assert.deepEqual(transactCanvasViaV2(d,d.canvasExtras!).document,d);
  assert.ok(projectCanvasGraph(d).edges.some(x=>x.id==='edge:gradient-root'));
  seen.set(repeat,await rgba(g));
 }
 assert.notDeepEqual(seen.get('no-repeat'),seen.get('repeat'));
 assert.notDeepEqual(seen.get('no-repeat'),seen.get('reflect'));
 assert.notDeepEqual(seen.get('repeat'),seen.get('reflect'));
 const omitted=await rgba(base),explicit=await rgba({...base,repeat:'no-repeat'});
 assert.deepEqual(omitted,explicit);
 assert.throws(()=>validateCanvasExtras({gradientBg:{...base,repeat:'repeat-x'}}),/unsupported gradient repeat/);
});

test('S13 pinned full-workspace-dimension repeat regression isolates native output',async()=>{
 const samples:Record<string,string>={};
 for(const repeat of ['no-repeat','repeat','reflect'] as const){
  const v={type:'linear' as const,colors:[{stop:0,color:'#221160'},{stop:1,color:'#006ca8'}],endX:120,repeat};
  const output=(await api.createCanvas({width:1280,height:720,gradientBg:v})).buffer;
  const {createHash}=await import('node:crypto');
  samples[repeat]=createHash('sha256').update(await sharp(output).raw().toBuffer()).digest('hex');
 }
 console.log('S13_PIN_1280_GRADIENT_REPEAT_HASHES='+JSON.stringify(samples));
 assert.notEqual(samples.repeat,samples['no-repeat']);
 assert.equal(samples.reflect,samples['no-repeat'],'Known installed engine defect: reflect collapses to no-repeat for 1280x720 narrow linear gradient');
});
