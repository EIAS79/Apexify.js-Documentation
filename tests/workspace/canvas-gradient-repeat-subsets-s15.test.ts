import test from 'node:test';import {ApexPainter} from 'apexify.js';import sharp from 'sharp';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
const api=new ApexPainter(),colors=[{stop:0,color:'#f54368'},{stop:1,color:'#0d6ede'}];
for(const area of ['gradientBg','patternBg','layerPattern','stroke','shadow'] as const)test('S15 native repeat subset decision '+area,async()=>{
 const versions:Record<string,string>={};
 for(const repeat of ['no-repeat','repeat','reflect'] as const){
  const gradient={type:'linear' as const,startX:0,startY:0,endX:25,endY:10,colors,repeat};
  const patternGradient={type:'linear' as const,startX:0,startY:0,endX:25,endY:10,colors,repeat};
  const p={type:'grid' as const,size:8,spacing:22,gradient:patternGradient};
  const opt=area==='gradientBg'?{gradientBg:gradient}:
    area==='patternBg'?{patternBg:p}:area==='layerPattern'?{bgLayers:[{type:'presetPattern' as const,pattern:p}]}:
    area==='stroke'?{stroke:{width:28,gradient,borderRadius:3}}:
    {shadow:{gradient,offsetX:10,offsetY:12,blur:4,opacity:0.95}};
  const valid=validateCanvasExtras(opt);
  const result=await api.createCanvas({width:360,height:240,...(area==='gradientBg'?{}:{colorBg:'#151d45'}),...valid});
  versions[repeat]=createHash('sha256').update(await sharp(result.buffer).ensureAlpha().raw().toBuffer()).digest('hex');
 }
 const changed=versions['no-repeat']!==versions.repeat;
 console.log('S15_RELIABLE_REPEAT',area,'REPEAT_DIFFERS='+changed,'REFLECT_DIFFERS='+String(versions.reflect!==versions['no-repeat']),JSON.stringify(versions));
 assert.equal(Object.keys(versions).length,3);
});
