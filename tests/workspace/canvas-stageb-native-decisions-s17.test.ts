import test from 'node:test';import assert from 'node:assert/strict';
import {ApexPainter} from 'apexify.js';import sharp from 'sharp';import {createHash} from 'node:crypto';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
const painter=new ApexPainter();
const sha=(v:Buffer)=>createHash('sha256').update(v).digest('hex');
const pixel=async(config:Record<string,unknown>)=>{
 const a=await painter.createCanvas({width:240,height:160,...config});
 return sha(await sharp(a.buffer).ensureAlpha().raw().toBuffer());
};
const colors=[{stop:0,color:'#ec2548'},{stop:0.45,color:'#26d4ab'},{stop:1,color:'#ffe264'}];
const corners=['all','top','left','right','bottom','top-left','top-right','bottom-left','bottom-right'] as const;
test('Stage B pinned shadow roundedCorners discriminates with nonzero owning canvas borderRadius',async()=>{
 const hashes:Record<string,string>={};
 for(const roundedCorners of corners){
  const cfg={colorBg:'#277aca',borderRadius:36,
   shadow:{color:'#ff55ba',offsetX:26,offsetY:19,opacity:1,blur:0,roundedCorners}};
  validateCanvasExtras({borderRadius:36,shadow:cfg.shadow});
  hashes[roundedCorners]=await pixel(cfg);
 }
 const count=new Set(Object.values(hashes)).size;
 console.log('S17_SHADOW_ROUNDED_NONZERO_PARENT='+JSON.stringify({count,hashes}));
 assert.ok(count>=1);
});
test('Stage B pinned shadow borderPosition remains source-ignored when root position passed',async()=>{
 const hashes:Record<string,string>={};
 for(const borderPosition of corners){
  hashes[borderPosition]=await pixel({colorBg:'#245ca1',borderRadius:36,
   shadow:{color:'#ff3344',offsetX:25,offsetY:23,opacity:1,blur:0,borderPosition}});
 }
 console.log('S17_SHADOW_DEPRECATED_POSITION='+JSON.stringify({count:new Set(Object.values(hashes)).size,hashes}));
});
test('Stage B pinned shadow borderRadius versus owning canvas radius',async()=>{
 const hashes:Record<string,string>={};
 for(const borderRadius of [0,13,45,'circular'] as const){
  hashes[String(borderRadius)]=await pixel({colorBg:'#266f9c',borderRadius:28,
   shadow:{color:'#fd22ba',offsetX:25,offsetY:20,opacity:1,blur:0,borderRadius}});
 }
 console.log('S17_SHADOW_RADIUS_OVERRIDE='+JSON.stringify({count:new Set(Object.values(hashes)).size,hashes}));
});
test('Stage B native conic start angles in root, stroke, shadow, pattern gradient',async()=>{
 const out:Record<string,unknown>={};
 for(const target of ['root','stroke','shadow','pattern','layer-pattern'] as const){
  const hashes:Record<string,string>={};
  for(const startAngle of [0,60,180] as const){
   const paint={type:'conic',colors,centerX:82,centerY:57,startAngle};
   const cfg:Record<string,unknown>={};
   if(target==='root')cfg.gradientBg=paint;
   if(target==='stroke'){cfg.colorBg='#236fad';cfg.stroke={width:25,gradient:paint,opacity:1};}
   if(target==='shadow'){cfg.colorBg='#236fad';cfg.shadow={offsetX:27,offsetY:22,blur:0,opacity:1,gradient:paint};}
   if(target==='pattern'){cfg.patternBg={type:'grid',size:17,spacing:22,gradient:paint};}
   if(target==='layer-pattern'){cfg.colorBg='#236fad';cfg.bgLayers=[{type:'presetPattern',pattern:{type:'grid',size:17,spacing:22,gradient:paint}}];}
   try{hashes[String(startAngle)]=await pixel(cfg);}
   catch(e){hashes[String(startAngle)]='ERROR:'+String((e as Error).message).slice(0,115);}
  }
  out[target]={count:new Set(Object.values(hashes)).size,hashes};
 }
 console.log('S17_CONIC_START_ANGLE_VARIANT_DECISIONS='+JSON.stringify(out));
});
test('Stage B native root compositor destination scenario',async()=>{
 const modes=['source-over','multiply','screen','destination-in','destination-out','source-atop','xor'] as const;
 const hashes:Record<string,string>={};
 for(const blendMode of modes){
  hashes[blendMode]=await pixel({colorBg:'#24518c',blendMode,bgLayers:[{type:'color',value:'#f33357',opacity:0.6}]});
 }
 console.log('S17_CANVAS_ROOT_BLEND='+JSON.stringify({count:new Set(Object.values(hashes)).size,hashes}));
});
test('Stage B root gradient repeat and procedural repeat native discriminating fixture',async()=>{
 for(const target of ['gradientBg','patternBg','layer-preset'] as const){
  const hashes:Record<string,string>={};
  for(const repeat of (target==='gradientBg'?['no-repeat','repeat','reflect']:['no-repeat','repeat','repeat-x','repeat-y']) as string[]){
   const g={type:'linear',startX:0,startY:0,endX:19,endY:0,colors,repeat};
   const config:Record<string,unknown>=target==='gradientBg'?{gradientBg:g}:
    target==='patternBg'?{patternBg:{type:'dots',color:'#fa7a24',secondaryColor:'#102338',size:9,spacing:20,repeat}}:
    {colorBg:'#112233',bgLayers:[{type:'presetPattern',pattern:{type:'dots',size:9,spacing:20,color:'#fa7a24',secondaryColor:'#102338',repeat}}]};
   try{hashes[repeat]=await pixel(config)}catch(e){hashes[repeat]='ERROR:'+String((e as Error).message).slice(0,90)}
  }
  console.log('S17_REPEAT_DECISION_'+target+'='+JSON.stringify({count:new Set(Object.values(hashes)).size,hashes}));
 }
});
