import test from 'node:test';import assert from 'node:assert/strict';
import sharp from 'sharp';import {ApexPainter} from 'apexify.js';
import {createHash} from 'node:crypto';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {CanvasFilterDefaults,validateCanvasExtras,type CanvasImageFilter} from '../../features/apex-workspace/canvas-options';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const png=async(noisy=false)=>{
 const bytes=Buffer.alloc((noisy?120*120:40*24)*4);
 const width=noisy?120:40,height=noisy?120:24;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;
  bytes[i]=noisy?((i*53+x*191+y*71)%256):x*5;
  bytes[i+1]=noisy?((i*31+x*17+y*137)%256):y*9;
  bytes[i+2]=noisy?((i*139+x*37+y*11)%256):80;
  bytes[i+3]=255;
 }
 return sharp(bytes,{raw:{width,height,channels:4}}).png().toBuffer();
};
const record=(bytes:Buffer,w:number,h:number)=>{
 const sha256=createHash('sha256').update(bytes).digest('hex');
 return {id:'asset:'+sha256,sha256,mime:'image/png' as const,width:w,height:h,bytes:bytes.length,
  dataUri:'data:image/png;base64,'+bytes.toString('base64')};
};
const rgba=async(b:Buffer)=>sharp(b).ensureAlpha().raw().toBuffer();
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
test('S16 bounded pinned native filter variants with verified assets and canonical Code',async()=>{
 const bytes=await png();const asset=record(bytes,40,24);
 assert.ok(asset.dataUri.length<16384);
 const painter=new ApexPainter();
 const original=await rgba((await painter.createCanvas({width:128,height:96,customBg:{source:asset.dataUri,fit:'cover'}})).buffer);
 let affected=0;
 for(const def of Object.values(CanvasFilterDefaults)){
  const f={...def} as CanvasImageFilter;
  if(f.type==='motionBlur')f.angle=32;
  if(f.type==='radialBlur'){f.centerX=18;f.centerY=22;}
  if(f.type==='pixelate'){f.x=2;f.y=2;f.width=70;f.height=60;}
  const d=createBlankDocument();d.width=128;d.height=96;d.assets=[asset];
  d.canvasExtras={customBg:{source:asset.id,fit:'cover',filters:[f]}};
  const validated=validateDocument(d);
  assert.deepEqual(parseSource(generateSource(validated)),validated,'Source round trip '+f.type);
  const config=validated.canvasExtras!.customBg!;
  assert.deepEqual(config.filters,[f]);
  const rendered=await rgba((await painter.createCanvas({width:128,height:96,
    customBg:{source:asset.dataUri,fit:'cover',filters:[f]}})).buffer);
  if(hash(rendered)!==hash(original))affected++;
  else throw Error('Pinned native filter was inert for tested '+f.type);
 }
 assert.equal(affected,Object.keys(CanvasFilterDefaults).length);
 console.log('S16_NATIVE_FILTER_VARIANTS='+affected);
});
test('S16 input validation fails closed and 16KiB source cap rejects large filtered assets',async()=>{
 const good=record(await png(),40,24);
 assert.throws(()=>validateCanvasExtras({customBg:{source:good.id,filters:[{type:'posterize',levels:1}]}}),/outside supported range/);
 assert.throws(()=>validateCanvasExtras({customBg:{source:good.id,filters:[{type:'invert',radius:10}]}}),/unsupported keys/);
 assert.throws(()=>validateCanvasExtras({customBg:{source:good.id,filters:Array(4).fill({type:'invert'})}}),/limited/);
 assert.throws(()=>validateCanvasExtras({customBg:{source:good.id,filters:[{type:'pixelate',size:2.3}]}}),/integer/);
 const d=createBlankDocument();d.width=128;d.height=96;d.assets=[good];
 d.canvasExtras={customBg:{source:good.id,filters:[{type:'pixelate',size:5,x:110,width:25}]}};
 assert.throws(()=>validateDocument(d),/exceeds canvas dimensions/);
 const big=record(await png(true),120,120);
 assert.ok(big.dataUri.length>16384);
 const d2=createBlankDocument();d2.width=128;d2.height=96;d2.assets=[big];
 d2.canvasExtras={customBg:{source:big.id,filters:[{type:'invert'}]}};
 assert.throws(()=>validateDocument(d2),/16,384-character/);
 d2.canvasExtras={customBg:{source:big.id}};
 assert.ok(validateDocument(d2)); // unfiltered verified import is not penalized
 console.log('S16_FILTER_SECURITY_FAIL_CLOSED_PASS');
});
