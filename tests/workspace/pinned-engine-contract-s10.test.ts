import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
const painter=new ApexPainter();
const gradient={type:'linear' as const,colors:[{stop:0,color:'#ff0055'},{stop:1,color:'#0033ff'}],startX:0,startY:0,endX:96,endY:48};
async function rgba(o:Record<string,unknown>):Promise<Buffer>{
 const result=await painter.createCanvas({width:96,height:64,...('gradientBg' in o?{}:{colorBg:'#151932'}),...o});
 return sharp(result.buffer).ensureAlpha().raw().toBuffer();
}
function differences(a:Buffer,b:Buffer){let count=0;assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)count+=Number(a[i]!==b[i]);return count;}
test('S22 engine: procedural pattern repeat modes remain native-effective',async()=>{
 const p={type:'stripes',color:'#ff4c12',secondaryColor:'#1768dc',size:9,spacing:13,rotation:13};
 const normal=await rgba({patternBg:{...p,repeat:'repeat'}});
 for(const repeat of ['no-repeat','repeat-x','repeat-y']){
  const other=await rgba({patternBg:{...p,repeat}});
  assert.ok(differences(normal,other)>100,'S20 procedural '+repeat+' must affect native pixels');
 }
});
test('S22 engine: PatternOptions.GradientConfig.angle rotates procedural paint',async()=>{
 const p={type:'dots',size:14,spacing:20,gradient};
 const normal=await rgba({patternBg:p});
 for(const angle of [0,30,45,90,180]){
  const other=await rgba({patternBg:{...p,gradient:{...gradient,angle}}});
  if(angle===0)assert.equal(differences(normal,other),0,'zero angle preserves default');
  else assert.ok(differences(normal,other)>100,'S22 pattern gradient angle '+angle+' changes native paint');
 }
});
test('pinned counterexamples: image-backed repeat modes and CanvasGradient.rotate are effective',async()=>{
 const source=await sharp({create:{width:8,height:8,channels:4,background:{r:229,g:43,b:76,alpha:1}}}).png().toBuffer();
 const uri='data:image/png;base64,'+source.toString('base64');
 const repeated=await rgba({bgLayers:[{type:'pattern',source:uri,repeat:'repeat'}]});
 const isolated=await rgba({bgLayers:[{type:'pattern',source:uri,repeat:'no-repeat'}]});
 assert.ok(differences(repeated,isolated)>100,'pinned native image-tile repeat is effective');
 const original=await rgba({gradientBg:gradient});
 const rotated=await rgba({gradientBg:{...gradient,rotate:55}});
 assert.ok(differences(original,rotated)>100,'pinned CanvasGradient.rotate is effective');
});
