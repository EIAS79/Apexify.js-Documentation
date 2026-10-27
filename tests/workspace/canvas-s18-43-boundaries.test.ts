import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {resolve} from 'node:path';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
const inventory=JSON.parse(readFileSync(resolve(process.cwd(),'docs/workspace/CREATE_CANVAS_STRICT_CERTIFICATION_S17.json'),'utf8')).paths;
const list=inventory.filter((r:any)=>r.readinessS17==='WORKSPACE_READY'&&r.strictStatus==='PARTIAL_CERTIFICATION').map((r:any)=>r.optionPath);
assert.equal(list.length,43);
const stops=[{stop:0,color:'#ff3344'},{stop:1,color:'#2255ff'}],src='asset:'+'a'.repeat(64);
const basePattern={type:'grid',color:'#ff7722',secondaryColor:'#4411ef',size:12,spacing:19,opacity:0.8};
function invalid(path:string):any{
 const leaf=path.split('.').at(-1)!;
 if(path==='canvas.width'||path==='canvas.height')return {[leaf]:0};
 if(path==='canvas.colorBg')return {background:{mode:'color',color:'file:///secret',transparent:false}};
 if(path==='canvas.bgLayers')return {bgLayers:Array(13).fill({type:'color',value:'#ffffff'})};
 if(path==='canvas.bgLayers.type')return {bgLayers:[{type:'video',source:'file:///private/video.mp4'}]};
 if(path==='canvas.bgLayers.value')return {bgLayers:[{type:'color',value:'javascript:alert(1)'}]};
 if(path==='canvas.bgLayers.source')return {bgLayers:[{type:'image',source:'https://example.com/a.png'}]};
 if(path==='canvas.bgLayers.repeat')return {bgLayers:[{type:'pattern',source:src,repeat:'invalid'}]};
 if(path==='canvas.bgLayers.pattern')return {bgLayers:[{type:'presetPattern',pattern:{type:'custom'}}]};
 if(path.startsWith('canvas.bgLayers.pattern.')){
  const leaf=path.slice('canvas.bgLayers.pattern.'.length);let value:any=Number.NaN;
  if(leaf==='color'||leaf==='secondaryColor')value='url(https://example.com/image.png)';
  else if(leaf==='type')value='unknown';
  else if(leaf==='customPatternImage')value='file:///private/picture.png';
  else if(leaf==='size')value=0;
  else if(leaf==='spacing')value=0;
  else if(leaf==='scale')value=0;
  else if(leaf==='rotation')value=361;
  else if(leaf==='offsetX'||leaf==='offsetY')value=5000;
  return {bgLayers:[{type:'presetPattern',pattern:leaf==='customPatternImage'?{type:'custom',customPatternImage:value}:{...basePattern,[leaf]:value}}]};
 }
 if(path==='canvas.customBg')return {customBg:{source:'https://example.com/photo.png'}};
 if(path==='canvas.customBg.source')return {customBg:{source:'../../../../etc/passwd'}};
 if(path==='canvas.customBg.inherit')return {customBg:{source:src,inherit:'true'}};
 if(path==='canvas.gradientBg')return {gradientBg:{type:'unknown',colors:stops}};
 if(path==='canvas.gradientBg.colors')return {gradientBg:{type:'linear',endX:60,colors:[stops[0]]}};
 if(path==='canvas.gradientBg.repeat')return {gradientBg:{type:'linear',endX:60,colors:stops,repeat:'repeat-x'}};
 if(path==='canvas.patternBg')return {patternBg:{type:'untrusted-pattern',size:20}};
 if(path==='canvas.patternBg.customPatternImage')return {patternBg:{type:'custom',customPatternImage:'file:///etc/passwd'}};
 if(path==='canvas.shadow')return {shadow:{opacity:1,remoteSource:'https://example.com/evil'}};
 if(path.startsWith('canvas.shadow.')){
  const fields:Record<string,unknown>={blur:101,color:'file:///etc/passwd',offsetX:513,offsetY:-513,opacity:1.01};
  return {shadow:{color:'#cc66ff',[leaf]:fields[leaf]}};
 }
 if(path==='canvas.stroke')return {stroke:{color:'#ff44bb',source:'https://example.com/a.png'}};
 if(path.startsWith('canvas.stroke.')){
  const fields:Record<string,unknown>={color:'javascript:alert(1)',borderRadius:1025};
  return {stroke:{color:leaf==='color'?undefined:'#66ffcc',[leaf]:fields[leaf]}};
 }
 const fields:Record<string,unknown>={
  blur:101,borderPosition:'diagonal',borderRadius:1025,rotation:361,x:4097,y:-4097,
  zoom:{scale:16.1}};
 if(!(leaf in fields))throw Error('no invalid fixture '+path);
 return {[leaf]:fields[leaf]};
}
function reject(path:string,fixture:any){
 if(path==='canvas.width'||path==='canvas.height'||path==='canvas.colorBg'){
  const doc=createBlankDocument();
  assert.throws(()=>validateDocument({...doc,...fixture}),/width|height|color|invalid|range|canvas/i);
 }else assert.throws(()=>validateCanvasExtras(fixture),/unsupported|range|asset|color|limit|gradient|integer|expected|missing|image|unsafe|invalid|canvas/i,path);
}
for(const path of list)test('S18 negative default/discriminant/range '+path,()=>{
 reject(path,invalid(path));
 assert.ok(validateCanvasExtras({}),path+' must accept empty optional Canvas default');
 console.log('S18_BOUNDARY_PATH_PASS='+path);
});
test('S18 discriminated 6 background layer unions and 13 procedural pattern types safe validation',()=>{
 const pat=['grid','dots','diagonal','stripes','waves','crosses','hexagons','checkerboard','diamonds','triangles','stars','polka'];
 const layerType=['color','gradient','noise','image','pattern','presetPattern'];
 const value=(type:string):any=>type==='color'?{type,value:'#eb2366'}:
 type==='gradient'?{type,value:{type:'linear',colors:stops,endX:60}}:
 type==='noise'?{type,intensity:0.15}:
 type==='image'?{type,source:src,fit:'contain',align:'top-right'}:
 type==='pattern'?{type,source:src,repeat:'repeat-y'}:
 {type:'presetPattern',pattern:basePattern};
 const u=validateCanvasExtras({bgLayers:layerType.map(value)});
 assert.deepEqual(u.bgLayers?.map(x=>x.type),layerType);
 for(const type of pat)assert.equal(validateCanvasExtras({patternBg:{...basePattern,type}}).patternBg?.type,type);
 assert.equal(validateCanvasExtras({patternBg:{type:'custom',customPatternImage:src}}).patternBg?.type,'custom');
 for(const repeat of ['no-repeat','repeat','reflect'])assert.equal(validateCanvasExtras({gradientBg:{type:'linear',colors:stops,endX:20,repeat}}).gradientBg?.repeat,repeat);
 for(const pos of ['all','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'])assert.equal(validateCanvasExtras({borderPosition:pos}).borderPosition,pos);
 assert.throws(()=>validateCanvasExtras({bgLayers:[{type:'image',source:'file:///secret.png'}]}),/asset|source/);
 assert.throws(()=>validateCanvasExtras({bgLayers:Array(13).fill(value('color'))}),/limited/);
 console.log('S18_UNION_BOUNDARIES=6+13+3+9');
});
