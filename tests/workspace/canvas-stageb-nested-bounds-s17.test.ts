import test from 'node:test';import assert from 'node:assert/strict';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
type Group='rootPattern'|'layerPattern'|'stroke'|'shadow';
const roots:Record<Group,string>={rootPattern:'canvas.patternBg.gradient',layerPattern:'canvas.bgLayers.pattern.gradient',stroke:'canvas.stroke.gradient',shadow:'canvas.shadow.gradient'};
const colors=[{stop:0,color:'#ed237a'},{stop:1,color:'#218ce3'}];
const shared=['gradient','type','colors','colors.color','colors.stop','startX','startY','endX','endY','startRadius','endRadius','centerX','centerY','repeat'] as const;
const extra=['rotate','pivotX','pivotY'] as const;
function compose(group:Group,g:Record<string,unknown>){
 const pattern={type:'grid',size:14,spacing:22,...(g?{gradient:g}:{color:'#e448ff'})};
 if(group==='rootPattern')return {patternBg:pattern};
 if(group==='layerPattern')return {bgLayers:[{type:'presetPattern',nodeId:'layer:s17-bounds-pattern',pattern}]};
 if(group==='stroke')return {stroke:{gradient:g,width:25,opacity:1}};
 return {borderRadius:40,shadow:{gradient:g,offsetX:25,offsetY:15}};
}
function make(group:Group,field:string,invalid:unknown){
 const type=['centerX','centerY'].includes(field)?'conic':['startRadius','endRadius'].includes(field)?'radial':'linear';
 const g:Record<string,any>=type==='conic'?{type,colors,centerX:65,centerY:62}:
 type==='radial'?{type,colors,startX:20,startY:15,endX:85,endY:45,startRadius:0,endRadius:100}:
 {type,colors,startX:0,startY:0,endX:170,endY:40};
 if(field==='gradient')return compose(group,{...g,missingExternalKey:1});
 if(field==='colors')g.colors=[{stop:0,color:'#ed237a'}];
 else if(field==='colors.color')g.colors=[{stop:0,color:invalid},{stop:1,color:'#218ce3'}];
 else if(field==='colors.stop')g.colors=[{stop:0,color:'#ed237a'},{stop:invalid,color:'#218ce3'}];
 else if(field==='type')g.type=invalid;
 else g[field]=invalid;
 return compose(group,g);
}
const numberRange:Record<string,[number,number]>={
 startX:[-8192,8192],startY:[-8192,8192],endX:[-8192,8192],endY:[-8192,8192],
 startRadius:[0,4096],endRadius:[0,4096],centerX:[-8192,8192],centerY:[-8192,8192],
 rotate:[-8192,8192],pivotX:[-8192,8192],pivotY:[-8192,8192]
};
const cases:{group:Group;field:string;path:string}[]=[];
for(const group of ['rootPattern','layerPattern','stroke','shadow'] as const){
 for(const field of [...shared,...((group==='stroke'||group==='shadow')?extra:[])]){
  if(group==='shadow'&&field==='repeat')continue;
  cases.push({group,field,path:roots[group]+(field==='gradient'?'':'.'+field)});
 }
}
assert.equal(cases.length,61);
for(const {group,field,path} of cases)test('Stage B nested native validation and discriminant '+path,()=>{
 const invalid=field in numberRange?numberRange[field][1]+1:
  field==='colors.stop'?1.4:
  field==='colors.color'?'file:///etc/passwd':
  field==='type'?'invalid-variant':
  field==='repeat'?'repeat-both-ways':0;
 assert.throws(()=>validateCanvasExtras(make(group,field,invalid)),/unsupported|range|outside|needs|gradient|color|invalid|canvas-options|stops/i,path);
 assert.throws(()=>validateCanvasExtras(make(group,field,Number.NaN)),/unsupported|range|outside|needs|gradient|color|invalid|canvas-options|stops/i);
 console.log('S17_NESTED_CONTRACT_BOUNDARY='+path);
});
