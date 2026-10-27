import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';

const sha=(v:Buffer)=>createHash('sha256').update(v).digest('hex');
const gradColors=[{stop:0,color:'#ed1c24'},{stop:0.45,color:'#1ee48b'},{stop:1,color:'#145cf2'}];
const gradient=(type='linear')=>type==='conic'
 ?{type,centerX:31,centerY:29,colors:structuredClone(gradColors)}
 :type==='radial'
  ?{type,startX:8,startY:9,startRadius:3,endX:34,endY:28,endRadius:52,colors:structuredClone(gradColors)}
  :{type,startX:0,startY:0,endX:50,endY:50,colors:structuredClone(gradColors)};
const anyGradient=(path:string)=>{
 const f=path.split('.').at(-1)??'';
 const kind=['startRadius','endRadius'].includes(f)?'radial':['centerX','centerY'].includes(f)?'conic':'linear';
 const a:any=gradient(kind),b:any=structuredClone(a);
 if(f==='pivotX'||f==='pivotY'){a.rotate=73;b.rotate=73;a.pivotX=0;a.pivotY=0;b.pivotX=0;b.pivotY=0;}
 const mapped:Record<string,number|string>={startX:24,startY:31,endX:55,endY:9,pivotX:32,pivotY:31,rotate:110,startRadius:14,endRadius:24,centerX:8,centerY:16};
 if(f==='gradient'||f==='boxBackground'){b.type='radial';Object.assign(b,gradient('radial'));}
 else if(f==='type'){Object.assign(b,gradient('radial'));}
 else if(f==='colors'||f==='color'){b.colors[0].color='#fff71a';}
 else if(f==='stop'){b.colors[1].stop=0.78;}
 else if(f in mapped)b[f]=mapped[f];
 return [a,b];
};
test('IMG01 discriminating native raster re-evaluation of all 34 Stage C baseline-equivalent READY path fixtures',async()=>{
 const ledger=JSON.parse(await readFile('docs/workspace/IMG01_READY_OPTION_MATRIX.json','utf8'));
 const target=ledger.records.filter((x:any)=>x.assertions?.nativePixelDiffFromDefault===false);
 assert.equal(target.length,34);
 const painter=new ApexPainter({type:'buffer'});
 const base=(await painter.createCanvas({width:128,height:112,colorBg:'#1a314e'})).buffer;
 const opaque=await sharp(Buffer.from('<svg width="64" height="46"><rect width="64" height="46" fill="#e31565"/><rect x="6" y="4" width="20" height="31" fill="#20ed73"/><circle cx="45" cy="24" r="16" fill="#1b2ff1"/><path d="M0 40L64 10" stroke="#fff" stroke-width="5"/></svg>')).png().toBuffer();
 const transparent=await sharp(Buffer.from('<svg width="64" height="46"><rect width="64" height="46" fill="#f43a29" fill-opacity=".2"/><circle cx="31" cy="22" r="20" fill="#f730e0" fill-opacity=".5"/></svg>')).png().toBuffer();
 const alt=await sharp(Buffer.from('<svg width="64" height="46"><rect width="64" height="46" fill="#52cceb"/><circle cx="41" cy="18" r="17" fill="#fba200"/></svg>')).png().toBuffer();
 const maskA=await sharp(Buffer.from('<svg width="64" height="46"><rect width="32" height="46" fill="#fff" fill-opacity="1"/><rect x="32" width="32" height="46" fill="#fff" fill-opacity=".18"/></svg>')).png().toBuffer();
 const maskB=await sharp(Buffer.from('<svg width="64" height="46"><rect width="32" height="46" fill="#fff" fill-opacity=".16"/><rect x="32" width="32" height="46" fill="#fff" fill-opacity="1"/></svg>')).png().toBuffer();
 const img=(other:Record<string,unknown>={},source=opaque)=>({source,x:18,y:12,width:79,height:77,fit:'contain' as const,...other});
 const groupImages=[
 {source:opaque,x:7,y:8,width:59,height:61,fit:'fill' as const},
 {source:transparent,x:38,y:19,width:67,height:64,fit:'fill' as const}
 ];
 const results=[];
 for(const record of target){
  const path=record.path;
  let before:Buffer|undefined,after:Buffer|undefined,fixture='none';
  try{
   const group=path.startsWith('options.groupTransform');
   const compare=async(o:Record<string,unknown>)=>group
    ?painter.createImage(groupImages,base,{isGrouped:true,groupTransform:o})
    :painter.createImage(img(o,(path.includes('boxBackground')?transparent:opaque)),base);
   if(path.includes('boxBackground')&&path.includes('gradient')){
    const [a,b]=anyGradient(path);
    before=await compare({boxBackground:{gradient:a}});
    after=await compare({boxBackground:{gradient:b}});
    fixture='transparent-source+changed-'+path.split('.').at(-1);
   }else if(path.endsWith('boxBackground')){
    before=await compare({});after=await compare({boxBackground:{color:'#23f1e4'}});fixture='translucent-alpha-background';
   }else if(path.endsWith('boxBackground.color')){
    before=await compare({boxBackground:{color:'#fa2ab3'}});
    after=await compare({boxBackground:{color:'#21ffd9'}});
    fixture='transparent-image-color';
   }else if(path==='images.align'||path==='images.fit'){
    before=await compare({fit:'contain',align:'center'});
    after=await compare({fit:path==='images.fit'?'cover':'contain',align:path==='images.align'?'top-left':'center'});
    fixture='non-square-bitmap-on-square-bounds';
   }else if(path==='images.source'){
    before=await painter.createImage(img({},opaque),base);
    after=await painter.createImage(img({},alt),base);
    fixture='two-distinct-verified-bitmap-bytes';
   }else if(path==='images.inherit'){
    before=await compare({inherit:false});
    after=await compare({inherit:true});
    fixture='intrinsic-64x46-vs-bounds-79x77';
   }else if(path.includes('filterIntensity')){
    const pipeline=[{type:'gaussianBlur',radius:4,intensity:1},{type:'sharpen',intensity:3}];
    before=await compare({filters:pipeline,filterIntensity:0.3});
    after=await compare({filters:pipeline,filterIntensity:2.7});
    fixture='strong-multi-filter-pipeline';
   }else if(path.includes('filterOrder')){
    const pipeline=[{type:'posterize',levels:3},{type:'gaussianBlur',radius:4,intensity:1}];
    const distortion={type:'twirl',angle:130,intensity:0.9,centerX:39,centerY:38,radius:31};
    before=await compare({filters:pipeline,filterOrder:'pre',distortion});
    after=await compare({filters:pipeline,filterOrder:'post',distortion});
    fixture='noncommutative-filter-order';
   }else if(path.includes('mask')){
    before=await compare({mask:{source:maskA,mode:'alpha'}});
    after=await compare({mask:{source:maskB,mode:'alpha'}});
    fixture='opposing-alpha-half-planes';
   }else if(path.endsWith('borderPosition')){
    before=await compare({borderPosition:'all',stroke:{color:'#ffdb00',width:12,position:2}});
    after=await compare({borderPosition:'top-left',stroke:{color:'#ffdb00',width:12,position:2}});
    fixture='thick-border-selective-corners';
   }else if(path.endsWith('pivotX')||path.endsWith('pivotY')){
    before=await compare({rotation:53,pivotX:0,pivotY:0});
    after=await compare({rotation:53,pivotX:path.endsWith('pivotX')?50:0,pivotY:path.endsWith('pivotY')?43:0});
    fixture='non-zero-rotation-with-shifted-pivot';
   }else{
    fixture='no-discriminating-fixture-defined';
   }
   results.push({id:record.id,path,fixture,executed:!!before&&!!after,pixelChanged:!!before&&!!after?sha(before)!==sha(after):null,
    beforeSha256:before?sha(before):null,afterSha256:after?sha(after):null});
  }catch(e){results.push({id:record.id,path,fixture,executed:false,error:String(e instanceof Error?e.message:e).slice(0,400)})}
 }
 const report={schemaVersion:1,enginePin:'379a5248f09ed39c1b1734fe104b6bd73a77857f',caseCount:target.length,
  summary:{executed:results.filter(x=>x.executed).length,changed:results.filter(x=>x.pixelChanged===true).length,unchanged:results.filter(x=>x.pixelChanged===false).length,rejected:results.filter(x=>!x.executed).length},results};
 await writeFile('docs/workspace/IMG01_DISCRIMINATING_RASTER_34.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report.summary));
 assert.equal(results.length,34);
});
