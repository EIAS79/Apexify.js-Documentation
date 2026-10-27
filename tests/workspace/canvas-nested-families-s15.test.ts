import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {validateCanvasExtras,type CanvasExtras} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {editCanvasGraph,projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
const painter=new ApexPainter(), colors=[{stop:0,color:'#e52964'},{stop:0.46,color:'#25ddf0'},{stop:1,color:'#ffde55'}];
const paint={type:'linear' as const,startX:0,startY:0,endX:220,endY:70,colors};
const pattern={type:'grid' as const,size:24,spacing:36,opacity:0.85,gradient:paint};
const stroke={width:24,style:'solid' as const,borderRadius:12,opacity:1,gradient:paint};
const shadow={offsetX:20,offsetY:18,blur:7,opacity:1,gradient:paint};
function document(extras:CanvasExtras){const d=createBlankDocument();d.width=320;d.height=210;d.layers=[];d.background={...d.background,mode:'color',transparent:false,color:'#253d65'};d.canvasExtras=validateCanvasExtras(extras);return validateDocument(d)}
async function pix(extras:CanvasExtras){const e=validateCanvasExtras(extras);const {bgLayers,...other}=e;const layers=bgLayers?.map(({nodeId:_id,...l})=>l);const x=await painter.createCanvas({width:320,height:210,colorBg:'#253d65',...other,...(layers?{bgLayers:layers}: {})});return sharp(x.buffer).ensureAlpha().raw().toBuffer()}
function sha(p:Buffer){return createHash('sha256').update(p).digest('hex')}
const cases:Array<[string,CanvasExtras]>=[
 ['root-pattern-gradient',{patternBg:pattern}],
 ['nested-pattern-gradient',{bgLayers:[{type:'presetPattern',nodeId:'layer:nested',pattern}]}],
 ['stroke-gradient',{stroke}],
 ['shadow-gradient',{shadow}],
 ['canvas-root-blend',{blendMode:'multiply',bgLayers:[{type:'color',nodeId:'layer:blend',value:'#f23242',opacity:0.7}]}]
];for(const [family,extras] of cases)test('S15 actual v6 nested Workspace family '+family,async()=>{
 const d=document(extras);assert.deepEqual(parseSource(generateSource(d)),d);
 assert.deepEqual(transactCanvasViaV2(d,d.canvasExtras!).document.canvasExtras,d.canvasExtras);
 assert.ok(projectCanvasGraph(d).nodes.length>0);
 const result=await pix(d.canvasExtras!),standard=await pix({bgLayers:[{type:'color',value:'#66da3f',opacity:0.6}]});
 assert.notEqual(sha(result),sha(standard),'Native painter is not a blank mock');
 console.log('S15_REAL_NATIVE_'+family+'='+sha(result));
});
test('S15 root compositing Graph editing is native config, not a decorative field',async()=>{
 const d=document({blendMode:'multiply',bgLayers:[{type:'color',value:'#fcaf18',opacity:0.55}]});
 assert.equal(d.canvasExtras?.blendMode,'multiply');
 const e=editCanvasGraph(d,{op:'canvas-blend',value:'screen'});
 assert.equal(e.blendMode,'screen');
 assert.deepEqual(transactCanvasViaV2(d,e).document.canvasExtras,e);
 assert.throws(()=>validateCanvasExtras({...e,blendMode:'foobar'}),/unsupported/);
 const a=sha(await pix({...e,blendMode:'multiply'})),b=sha(await pix({...e,blendMode:'screen'}));
 console.log('S15_ROOT_BLEND_NATIVE_HASHES',a,b,'PIXEL_DIFFERENCE',a!==b);
});
test('S15 nested stroke and shadow gradient Graph validated and mutually exclusive',()=>{
 for(const key of ['stroke','shadow'] as const){
  const d=document({[key]:key==='stroke'?stroke:shadow});
  assert.throws(()=>validateCanvasExtras({[key]:{color:'#f02034',gradient:paint}}),/mutually exclusive/);
  const out=key==='stroke'?editCanvasGraph(d,{op:'stroke',value:{...stroke,width:32}}):editCanvasGraph(d,{op:'shadow',value:{...shadow,blur:15}});
  assert.ok(out[key]?.gradient);
  assert.deepEqual(parseSource(generateSource({...d,canvasExtras:out})).canvasExtras,out);
 }
});
