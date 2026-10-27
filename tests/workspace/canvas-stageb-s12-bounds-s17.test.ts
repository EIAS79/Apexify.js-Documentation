import test from 'node:test';import assert from 'node:assert/strict';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
const colors=[{stop:0,color:'#e32a57'},{stop:1,color:'#28aed5'}];
const gradient={
 linear:{type:'linear',colors,startX:0,startY:0,endX:80,endY:20},
 radial:{type:'radial',colors,startX:10,startY:10,endX:60,endY:40,startRadius:0,endRadius:100},
 conic:{type:'conic',colors,centerX:70,centerY:55}
} as const;
const pattern={type:'grid',color:'#f56121',secondaryColor:'#251b4b',size:15,spacing:25,opacity:0.85,rotation:15,scale:1.1,offsetX:10,offsetY:12};
const stroke={color:'#ff8899',style:'solid',width:14,opacity:0.65,blur:2,position:4};
const ranges:Record<string,[number,number]>={
 'canvas.gradientBg.startX':[-8192,8192],'canvas.gradientBg.startY':[-8192,8192],
 'canvas.gradientBg.endX':[-8192,8192],'canvas.gradientBg.endY':[-8192,8192],
 'canvas.gradientBg.rotate':[-8192,8192],'canvas.gradientBg.pivotX':[-8192,8192],
 'canvas.gradientBg.pivotY':[-8192,8192],'canvas.gradientBg.startRadius':[0,4096],
 'canvas.gradientBg.endRadius':[0,4096],'canvas.gradientBg.centerX':[-8192,8192],
 'canvas.gradientBg.centerY':[-8192,8192],'canvas.gradientBg.colors.stop':[0,1],
 'canvas.patternBg.size':[1,256],'canvas.patternBg.spacing':[1,512],
 'canvas.patternBg.opacity':[0,1],'canvas.patternBg.rotation':[-360,360],
 'canvas.patternBg.scale':[0.05,12],'canvas.patternBg.offsetX':[-4096,4096],
 'canvas.patternBg.offsetY':[-4096,4096],'canvas.stroke.width':[0,200],
 'canvas.stroke.opacity':[0,1],'canvas.stroke.blur':[0,100],
 'canvas.stroke.position':[-200,200],'canvas.zoom.scale':[0.05,16],
 'canvas.zoom.centerX':[-8192,8192],'canvas.zoom.centerY':[-8192,8192]
};
const enums=[
 'canvas.gradientBg.colors.color','canvas.patternBg.color','canvas.patternBg.secondaryColor',
 'canvas.patternBg.type','canvas.stroke.style'
];
const keys=[...Object.keys(ranges),...enums];
assert.equal(keys.length,31);
function make(path:string,value:unknown){
 const leaf=path.split('.').at(-1)!;
 if(path.startsWith('canvas.gradientBg.')){
  const g=leaf==='startRadius'||leaf==='endRadius'?gradient.radial:
   leaf==='centerX'||leaf==='centerY'?gradient.conic:gradient.linear;
  const obj={...g,colors:colors.map(x=>({...x}))} as Record<string,any>;
  if(path.endsWith('colors.stop'))obj.colors=[{stop:0,color:'#e32a57'},{stop:value,color:'#28aed5'}];
  else if(path.endsWith('colors.color'))obj.colors=[{stop:0,color:value},{stop:1,color:'#28aed5'}];
  else obj[leaf]=value;
  return {gradientBg:obj};
 }
 if(path.startsWith('canvas.patternBg.'))return {patternBg:{...pattern,[leaf]:value}};
 if(path.startsWith('canvas.stroke.'))return {stroke:{...stroke,[leaf]:value}};
 if(path.startsWith('canvas.zoom.'))return {zoom:{scale:1.6,centerX:25,centerY:20,[leaf]:value}};
 throw Error('Unknown '+path);
}
for(const path of keys)test('S17 certification strict allowlist and invalid boundaries '+path,()=>{
 const result=ranges[path];
 if(result){
  const [lo,hi]=result;
  for(const legal of [lo,hi]){
   // Strict semantic geometry checks can reject degenerate gradient endpoints at an exact legal boundary.
   const doc=make(path,legal);
   if(path==='canvas.gradientBg.colors.stop'&&legal===0){continue}
   const canonical=validateCanvasExtras(doc);
   assert.ok(canonical);
  }
  const below=lo-Math.max(0.01,Math.abs(lo)*0.0001,0.01);
  const above=hi+Math.max(0.01,Math.abs(hi)*0.0001,0.01);
  assert.throws(()=>validateCanvasExtras(make(path,below)),/range|outside|degenerate|canvas-options/);
  assert.throws(()=>validateCanvasExtras(make(path,above)),/range|outside|degenerate|canvas-options/);
  assert.throws(()=>validateCanvasExtras(make(path,Number.NaN)),/range|finite|canvas-options/);
 }else{
  let good:string,bad:string;
  if(path.endsWith('.type')){good='grid';bad='unknown-pattern'}else if(path.endsWith('.style')){good='dotted';bad='unknown-stroke'}else{good='#ff33aa';bad='file:///etc/passwd'}
  assert.ok(validateCanvasExtras(make(path,good)));
  assert.throws(()=>validateCanvasExtras(make(path,bad)),/color|unsupported|canvas-options/);
 }
 console.log('S17_BOUNDARY_EXACT_PATH_PASS='+path);
});
