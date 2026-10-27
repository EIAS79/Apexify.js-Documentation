import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createHash} from 'node:crypto';
const painter=new ApexPainter({type:'buffer'});
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const pix=async(b:Buffer)=>sha(await sharp(b).ensureAlpha().raw().toBuffer());
const pattern={type:'grid',size:18,spacing:12,color:'#23a1dd',secondaryColor:'#f260c4',opacity:1};
const chartOptions=(repeat?:string):any=>({dimensions:{width:290,height:180},appearance:{backgroundColor:'#fef3de',patternBg:{...pattern,...(repeat?{repeat}:{})}}});
test('S21 exact installed S20 package Chart background consumes new procedural repeat modes and preserves omitted default',async()=>{
 const data=[{label:'A',value:4,xStart:0,xEnd:1},{label:'B',value:2,xStart:1,xEnd:2}];
 const make=async(r?:string)=>pix(await painter.createChart('bar',data,chartOptions(r)));
 const omission=await make(),full=await make('repeat'),x=await make('repeat-x'),y=await make('repeat-y'),none=await make('no-repeat');
 assert.equal(omission,full,'Chart default repeat changed');
 assert.equal(new Set([full,x,y,none]).size,4,'Chart must propagate all four procedural repeat values to native raster');
 console.log('S21_INSTALLED_CHART_REPEAT_FOUR_DISTINCT_DEFAULT_IDENTICAL=TRUE');
});
test('S21 public installed S20 package Image shadow unchanged first overload for absent explicit override and roundedCorners precedence',async()=>{
 const base=(await painter.createCanvas({width:190,height:150,transparentBase:true})).buffer;
 const source=(await painter.createCanvas({width:70,height:50,colorBg:'#338acc'})).buffer;
 const shadow={color:'#d04b81',offsetX:9,offsetY:8,opacity:1,blur:0};
 const make=async(shadowProperties:any)=>pix(await painter.createImage({source,x:28,y:32,width:70,height:50,shadow:shadowProperties},base));
 assert.equal(await make(shadow),await make({...shadow,borderRadius:0}));
 assert.equal(await make({...shadow,roundedCorners:'top'}),await make({...shadow,roundedCorners:'top',borderPosition:'bottom'}));
 console.log('S21_INSTALLED_IMAGE_SHADOW_FIRST_OVERLOAD_LEGACY_PARITY=TRUE');
});
test('S21 public package Text plus Canvas mixed compositing remains deterministic with S20 engine',async()=>{
 const base=await painter.createCanvas({width:300,height:120,colorBg:'#f3e9cd'});
 const textProps:any={text:'S21 MIXED',x:13,y:13,font:{family:'Arial',size:31},fill:{color:'#192c84'}};
 const a=await painter.createText(textProps,base.buffer);
 const b=await painter.createText(textProps,base.buffer);
 assert.equal(await pix(a),await pix(b));
 assert.notEqual(await pix(a),await pix(base.buffer));
 console.log('S21_INSTALLED_MIXED_CANVAS_TEXT_DETERMINISTIC=TRUE');
});
