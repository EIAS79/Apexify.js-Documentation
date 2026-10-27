import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
const shapes=['rectangle','square','circle','triangle','trapezium','star','heart','polygon','arc','pieSlice'];
const filters=['gaussianBlur','motionBlur','radialBlur','sharpen','noise','grain','edgeDetection','emboss','invert','grayscale','sepia','pixelate','brightness','contrast','saturation','hueShift','posterize'];
const distortions=['perspective','warp','bulge','pinch','twirl','wave'];
const painter=new ApexPainter({type:'buffer'}),sha=b=>createHash('sha256').update(b).digest('hex');
const cases=[];let base,source;
const draw=(x,opts)=>painter.createImage(x,base,opts);
async function probe(id,fn,baseline=base){
 try{const png=await fn(),meta=await sharp(png).metadata(); const result={id,status:'EXECUTED',png:png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),width:meta.width,height:meta.height,sha256:sha(png),pixelChanged:sha(png)!==sha(baseline)};cases.push(result);return png;}
 catch(e){cases.push({id,status:'REJECTED',error:String(e?.message||e).slice(0,500)});return null;}
}
const img=x=>({source,x:7,y:8,width:80,height:75,fit:'fill',...x});
const shapeArgs={
 star:{sides:7,innerRadius:12,outerRadius:34},
 polygon:{points:[{x:0,y:0},{x:70,y:0},{x:55,y:64},{x:9,y:58}]},
 arc:{radius:28,startAngle:20,endAngle:290},
 pieSlice:{radius:28,startAngle:20,endAngle:290}
};
const filterArgs={
 gaussianBlur:{intensity:1,radius:3},motionBlur:{intensity:1,radius:5,angle:35},
 radialBlur:{intensity:1,radius:4,centerX:36,centerY:35},
 sharpen:{intensity:2},noise:{intensity:0.9},grain:{intensity:0.9},
 edgeDetection:{intensity:1},emboss:{intensity:1},pixelate:{size:7,x:0,y:0,width:80,height:75},
 brightness:{value:1.4},contrast:{value:1.6},saturation:{value:0.4},hueShift:{value:90},posterize:{levels:4}
};
const quad=[{x:6,y:4},{x:73,y:7},{x:76,y:68},{x:4,y:72}];
const distortArgs={
 perspective:{points:quad,interpolation:'bilinear',edgeMode:'clamp'},
 warp:{controlPoints:[{from:{x:23,y:22},to:{x:38,y:34},radius:26,strength:0.9,falloff:'smooth'}],interpolation:'bilinear',edgeMode:'clamp'},
 bulge:{intensity:0.9,centerX:40,centerY:34,radius:31},pinch:{intensity:0.9,centerX:40,centerY:34,radius:31},
 twirl:{intensity:0.9,centerX:40,centerY:34,radius:31,angle:120},
 wave:{amplitudeX:8,amplitudeY:5,wavelengthX:27,wavelengthY:30,phaseX:12,phaseY:21}
};
const colors=[{stop:0,color:'#ff0000'},{stop:0.5,color:'#00ff00'},{stop:1,color:'#0000ff'}];
const gradient=(type,additional={})=>type==='linear'?{type,colors,startX:0,startY:0,endX:32,endY:40,...additional}
:type==='radial'?{type,colors,startX:15,startY:15,startRadius:1,endX:37,endY:37,endRadius:52,...additional}
:{type,colors,centerX:34,centerY:30,...additional};
test('IMG-01 pinned native strict variant and interaction probes',async()=>{
 base=(await painter.createCanvas({width:96,height:96,colorBg:'#17212c'})).buffer;
 const svg=Buffer.from('<svg width="80" height="75"><rect width="80" height="75" fill="#b9336f"/><rect x="5" y="7" width="23" height="38" fill="#39ec42"/><circle cx="48" cy="28" r="18" fill="#1227dc"/><path d="M0 57L80 17" stroke="white" stroke-width="6"/></svg>');
 source=await sharp(svg).png().toBuffer();
 const raw=await probe('baseline:image',()=>draw(img()));
 for(const s of shapes)await probe('shape:'+s,()=>draw({source:s,x:7,y:8,width:80,height:75,shape:{fill:true,color:'#ff6a18',...(shapeArgs[s]||{})}}));
 for(const f of filters)await probe('filter:'+f,()=>draw(img({filters:[{type:f,...(filterArgs[f]||{})}]})),raw||base);
 for(const type of distortions)await probe('distortion:'+type,()=>draw(img({distortion:{type,...distortArgs[type]}})),raw||base);
 const mask=await sharp({create:{width:80,height:75,channels:4,background:{r:150,g:150,b:150,alpha:0.45}}}).png().toBuffer();
 for(const mode of ['alpha','luminance','inverse'])await probe('mask:'+mode,()=>draw(img({mask:{source:mask,mode}})),raw||base);
 await probe('clip:polygon',()=>draw(img({clipPath:[{x:0,y:0},{x:70,y:0},{x:35,y:68}]})),raw||base);
 await probe('mesh:2x2',()=>draw(img({meshWarp:{gridX:1,gridY:1,controlPoints:[[{x:2,y:0},{x:70,y:4}],[{x:2,y:75},{x:80,y:65}]],interpolation:'bilinear',edgeMode:'clamp'}})),raw||base);
 for(const kind of ['vignette','lensFlare','chromaticAberration','filmGrain']){
  const args=kind==='vignette'?{intensity:0.9,size:0.5}:kind==='lensFlare'?{x:33,y:27,intensity:0.9}:{intensity:0.9};
  await probe('effect:'+kind,()=>draw(img({effects:{[kind]:args}})),raw||base);
 }
 for(const order of ['pre','post'])await probe('filterOrder:'+order,()=>draw(img({filters:[{type:'grayscale'},{type:'brightness',value:1.3}],filterIntensity:1,filterOrder:order})),raw||base);
 for(const type of ['linear','radial','conic'])await probe('gradient:'+type,()=>draw({source:'rectangle',x:7,y:8,width:80,height:75,shape:{fill:true,gradient:gradient(type)}}));
 for(const context of ['shape','stroke','shadow','boxBackground','groupTransform.stroke','groupTransform.shadow','groupTransform.boxBackground']){
  const group=context.startsWith('groupTransform.'),key=context.split('.').at(-1);
  const paint=async(g)=>{
   const obj={source:'rectangle',x:7,y:8,width:80,height:75,shape:{fill:true,color:'#ffffff'}};
   const options=key==='shape'?{shape:{fill:true,gradient:g}}:key==='boxBackground'?{boxBackground:{gradient:g}}:{[key]:{gradient:g,...(key==='stroke'?{width:9}:{offsetX:6,offsetY:4,blur:7})}};
   return group?draw([obj],{isGrouped:true,groupTransform:options}):draw({...obj,...options});
  };
  const angleZero=await probe('conicAngle:'+context+':zero',()=>paint(gradient('conic',{startAngle:0})));
  if(angleZero)await probe('conicAngle:'+context+':180',()=>paint(gradient('conic',{startAngle:180})),angleZero);
  const noRepeat=await probe('gradientRepeat:'+context+':none',()=>paint(gradient('linear',{repeat:'no-repeat'})));
  if(noRepeat)for(const repeat of ['repeat','reflect'])await probe('gradientRepeat:'+context+':'+repeat,()=>paint(gradient('linear',{repeat})),noRepeat);
 }
 const rect={source:'rectangle',x:7,y:8,width:80,height:75,shape:{fill:true,color:'#ffeecc'}};
 for(const context of ['image','group'])for(const key of ['borderPosition','roundedCorners']){
  const sh={color:'#ff4a17',offsetX:7,offsetY:4,blur:7,opacity:1,borderRadius:14};
  const render=v=>context==='image'?draw({...rect,shadow:{...sh,[key]:v}}):draw([rect],{isGrouped:true,groupTransform:{shadow:{...sh,[key]:v}}});
  const all=await probe('shadow:'+context+':'+key+':all',()=>render('all'));
  if(all)await probe('shadow:'+context+':'+key+':top-left',()=>render('top-left'),all);
 }
 await probe('arrays:two-ordered',()=>draw([{source:'rectangle',x:6,y:7,width:52,height:49,shape:{color:'#ff3300'}},{source:'circle',x:31,y:25,width:43,height:43,shape:{color:'#0044ee'}}]));
 await probe('groups:native-transform',()=>draw([{source:'rectangle',x:6,y:7,width:52,height:49,shape:{color:'#ff3300'}},{source:'circle',x:31,y:25,width:43,height:43,shape:{color:'#0044ee'}}],{isGrouped:true,groupTransform:{translateX:7,opacity:0.8}}));
 const baselineStroke={color:'#e94b32',width:9,opacity:0.85,borderRadius:10};
 const baselineShadow={color:'#fa7719',offsetX:7,offsetY:5,blur:6,opacity:0.85,borderRadius:8};
 const fieldCases=[
 ['align',{align:'top-left'}],['blendMode',{blendMode:'multiply'}],['blur',{blur:3}],
 ['borderPosition',{borderPosition:'top-left'}],['borderRadius',{borderRadius:13}],
 ['boxBackground',{boxBackground:{color:'#ffee34'}}],['boxBackground.color',{boxBackground:{color:'#ff2233'}}],
 ['fit',{fit:'contain'}],['inherit',{inherit:false}],['opacity',{opacity:0.6}],['rotation',{rotation:24}],
 ['shadow',{shadow:baselineShadow}],['shadow.blur',{shadow:{...baselineShadow,blur:12}}],
 ['shadow.borderRadius',{shadow:{...baselineShadow,borderRadius:22}}],
 ['shadow.color',{shadow:{...baselineShadow,color:'#15ce78'}}],
 ['shadow.offsetX',{shadow:{...baselineShadow,offsetX:13}}],
 ['shadow.offsetY',{shadow:{...baselineShadow,offsetY:13}}],
 ['shadow.opacity',{shadow:{...baselineShadow,opacity:0.4}}],
 ['stroke',{stroke:baselineStroke}],['stroke.blur',{stroke:{...baselineStroke,blur:4}}],
 ['stroke.borderPosition',{stroke:{...baselineStroke,borderPosition:'top-left'}}],
 ['stroke.borderRadius',{stroke:{...baselineStroke,borderRadius:18}}],
 ['stroke.color',{stroke:{...baselineStroke,color:'#17e59f'}}],
 ['stroke.opacity',{stroke:{...baselineStroke,opacity:0.4}}],
 ['stroke.position',{stroke:{...baselineStroke,position:3}}],
 ['stroke.roundedCorners',{stroke:{...baselineStroke,roundedCorners:'top-left'}}],
 ['stroke.style',{stroke:{...baselineStroke,style:'dashed'}}],
 ['stroke.width',{stroke:{...baselineStroke,width:15}}]
 ];
 for(const [key,opts] of fieldCases){
  const shapeField=/^shadow|^stroke|^boxBackground/.test(key);
  await probe('field:images.'+key,()=>draw(shapeField?{source:'rectangle',x:7,y:8,width:80,height:75,shape:{fill:true,color:'#ffffff'},...opts}:img(opts)));
 }
 const summary={total:cases.length,executed:cases.filter(c=>c.status==='EXECUTED').length,rejected:cases.filter(c=>c.status==='REJECTED').length,changed:cases.filter(c=>c.pixelChanged===true).length,inertComparisons:cases.filter(c=>c.pixelChanged===false&&(/conicAngle.*180|gradientRepeat.*repeat|shadow.*top-left/.test(c.id))).map(c=>c.id)};
 await writeFile('docs/workspace/IMG01_STRICT_NATIVE_PROBES.json',JSON.stringify({schemaVersion:1,enginePin:'379a5248f09ed39c1b1734fe104b6bd73a77857f',cases,summary},null,2)+'\n');
 console.log(JSON.stringify(summary));
 assert.equal(cases.filter(c=>c.id.startsWith('shape:')).length,10);
 assert.equal(cases.filter(c=>c.id.startsWith('filter:')).length,17);
 assert.equal(cases.filter(c=>c.id.startsWith('distortion:')).length,6);
});
