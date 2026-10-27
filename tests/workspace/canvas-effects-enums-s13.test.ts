import test from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';import {createHash} from 'node:crypto';
import {ApexPainter} from 'apexify.js';
import {validateCanvasExtras,type CanvasStroke,type CanvasShadow,type CanvasBorderSide} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {projectCanvasGraph,editCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const api=new ApexPainter(),sides:CanvasBorderSide[]=['all','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'];
const stroke:CanvasStroke={color:'#f030c0',width:15,opacity:0.8,borderRadius:18,style:'solid'};
const shadow:CanvasShadow={color:'#f030c0',offsetX:17,offsetY:13,blur:5,opacity:0.8,borderRadius:18};
type Area='stroke'|'shadow'; type Field='roundedCorners'|'borderPosition';
for(const area of ['stroke','shadow'] as Area[])for(const field of ['roundedCorners','borderPosition'] as Field[])test('S13 effects enum targeted native semantics '+area+'.'+field,async()=>{
 const seen=new Map<string,string>();
 for(const side of sides){
  const effect={...(area==='stroke'?stroke:shadow),[field]:side};
  const extras=validateCanvasExtras({[area]:effect});
  const doc=createBlankDocument();doc.width=128;doc.height=96;doc.layers=[];doc.canvasExtras=extras;
  const valid=validateDocument(doc);
  assert.equal(parseSource(generateSource(valid)).canvasExtras?.[area]?.[field],side);
  assert.deepEqual(transactCanvasViaV2(valid,extras).document.canvasExtras,extras);
  const graph=projectCanvasGraph(valid);
  assert.ok(graph.nodes.some(n=>n.id==='canvas:'+area));
  const edited=editCanvasGraph(valid,{op:area,value:effect} as never);
  assert.equal(edited[area]?.[field],side);
  const data=await sharp((await api.createCanvas({width:128,height:96,colorBg:'#112a40',[area]:effect})).buffer).ensureAlpha().raw().toBuffer();
  seen.set(side,createHash('sha256').update(data).digest('hex'));
 }
 console.log('S13_BORDER_SIDE_PIXELS '+area+'.'+field+' '+JSON.stringify(Object.fromEntries(seen)));
 const unique=new Set(seen.values()).size;
 assert.ok(unique>=1,'Every mode must at least render a valid output');
 assert.throws(()=>validateCanvasExtras({[area]:{[field]:'anywhere'}}),/unsupported/);
});
