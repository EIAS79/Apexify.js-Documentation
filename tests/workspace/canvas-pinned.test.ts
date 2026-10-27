import test from 'node:test';
import assert from 'node:assert/strict';
import {ApexPainter} from 'apexify.js';
import sharp from 'sharp';
const painter=new ApexPainter();
const png=Buffer.from([137,80,78,71,13,10,26,10]);
const create=async (config:Parameters<ApexPainter['createCanvas']>[0])=>{
  const result=await painter.createCanvas(config);assert.ok(Buffer.isBuffer(result.buffer));
  assert.deepEqual(result.buffer.subarray(0,8),png);
  const {data,info}=await sharp(result.buffer).raw().toBuffer({resolveWithObject:true});
  return {result,data,info};
};
test('pinned v6 createCanvas basic color uses real 64x64 PNG buffer',async()=>{
  const {data,info}=await create({width:64,height:64,colorBg:'#ff0000'});
  assert.equal(info.width,64);assert.equal(info.height,64);
  assert.deepEqual([...data.subarray(0,3)],[255,0,0]);
});
test('pinned v6 createCanvas transparent base yields alpha zero',async()=>{
  const {data,info}=await create({width:64,height:64,transparentBase:true});
  assert.equal(info.channels,4);assert.equal(data[3],0);
});
test('pinned v6 createCanvas linear gradient produces different edge colors',async()=>{
  const {data,info}=await create({width:64,height:64,gradientBg:{type:'linear',endX:64,colors:[{stop:0,color:'#ff0000'},{stop:1,color:'#0000ff'}]}});
  assert.notDeepEqual([...data.subarray(0,3)],[...data.subarray((63)*info.channels,(63)*info.channels+3)]);
});
test('pinned v6 createCanvas invalid dimension rejects before rendering',async()=>{
  assert.throws(()=>painter.createCanvas({width:0,height:64,colorBg:'#ff0000'}),/canvas\.width/);
});
