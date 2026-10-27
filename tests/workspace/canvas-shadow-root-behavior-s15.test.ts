import test from 'node:test';import assert from 'node:assert/strict';import {ApexPainter} from 'apexify.js';import sharp from 'sharp';import {createHash} from 'node:crypto';
test('S15 shadow border radius is inert in pinned native tested configuration',async()=>{
 const painter=new ApexPainter(),codes:Record<string,string>={};
 for(const borderRadius of [0,15,40,'circular'] as const){
  const c=await painter.createCanvas({width:240,height:160,colorBg:'#225588',
    shadow:{color:'#fe20b9',opacity:1,offsetX:19,offsetY:17,blur:4,borderRadius}});
  codes[String(borderRadius)]=createHash('sha256').update(await sharp(c.buffer).ensureAlpha().raw().toBuffer()).digest('hex');
 }
 console.log('S15_SHADOW_RADIUS_NATIVE',JSON.stringify(codes));
 assert.equal(new Set(Object.values(codes)).size,1,"Shadow radius is unexpectedly effective: revisit disabled UI and contract");
});
test('S15 root blend mode paints destination operators differently but multiply/screen are inert',async()=>{
 const painter=new ApexPainter(),codes:Record<string,string>={};
 for(const blendMode of ['source-over','multiply','screen','destination-in','destination-out','copy','xor'] as const){
  const c=await painter.createCanvas({width:240,height:160,colorBg:'#225588',blendMode,
    bgLayers:[{type:'color',value:'#e04567',opacity:0.75}]});
  codes[blendMode]=createHash('sha256').update(await sharp(c.buffer).ensureAlpha().raw().toBuffer()).digest('hex');
 }
 console.log('S15_ROOT_COMPOSITING_NATIVE_VARIANTS',JSON.stringify(codes));
 assert.equal(codes['multiply'],codes['screen']);assert.notEqual(codes['destination-in'],codes['source-over']);
});
