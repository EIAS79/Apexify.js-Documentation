import test from 'node:test';import assert from 'node:assert/strict';import {ApexPainter} from 'apexify.js';import sharp from 'sharp';import {createHash} from 'node:crypto';
const painter=new ApexPainter(),colors=[{stop:0,color:'#e54a3c'},{stop:1,color:'#18dafe'}];
async function sha(config:Record<string,unknown>){const x=await painter.createCanvas(config);return createHash('sha256').update(await sharp(x.buffer).ensureAlpha().raw().toBuffer()).digest('hex')}
test('S17 shadow radial startRadius independent geometry matrices',async()=>{
 const configs=[
 {startX:10,startY:10,endX:65,endY:50,endRadius:100},
 {startX:40,startY:30,endX:170,endY:100,endRadius:120},
 {startX:120,startY:90,endX:120,endY:90,endRadius:130},
 {startX:0,startY:0,endX:210,endY:120,endRadius:180}
 ];
 const evidence=[];
 for(let i=0;i<configs.length;i++){
 const results:Record<string,string>={};
 for(const startRadius of [0,15,35,65] as const){
 const g={type:'radial',colors,...configs[i],startRadius};
 const c={width:256,height:184,colorBg:'#214763',borderRadius:30,
 shadow:{gradient:g,offsetX:19,offsetY:21,blur:8,opacity:1}};
 try{results[startRadius]=await sha(c)}
 catch(e){results[startRadius]='ERROR:'+String((e as Error).message).slice(0,140)}
 }
 evidence.push({config:i,distinct:new Set(Object.values(results)).size,results});
 }
 console.log('S17_SHADOW_START_RADIUS_GEOMETRY='+JSON.stringify(evidence));
 assert.equal(evidence.length,4);
});
