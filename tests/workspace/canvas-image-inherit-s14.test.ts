import test from 'node:test';import assert from 'node:assert/strict';
import sharp from 'sharp';import {createHash} from 'node:crypto';
import {ApexPainter} from 'apexify.js';
import {validateImageAsset} from '../../features/apex-workspace/asset-store';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {editCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
test('S14 safe verified image intrinsic native dimension and typed Graph semantics',async()=>{
 const raw=Buffer.alloc(28*12*4);
 for(let y=0;y<12;y++)for(let x=0;x<28;x++){const i=(y*28+x)*4;raw[i]=x*9;raw[i+1]=y*17;raw[i+2]=186;raw[i+3]=255}
 const bytes=await sharp(raw,{raw:{width:28,height:12,channels:4}}).png().toBuffer();
 const sha256=createHash('sha256').update(bytes).digest('hex');
 const record=validateImageAsset({id:'asset:'+sha256,sha256,mime:'image/png',width:28,height:12,bytes:bytes.length,
  dataUri:'data:image/png;base64,'+bytes.toString('base64')});
 const doc=createBlankDocument();doc.width=128;doc.height=96;doc.layers=[];doc.assets=[record];
 doc.canvasExtras=validateCanvasExtras({customBg:{source:record.id,fit:'cover',align:'bottom-right'}});
 const initial=validateDocument(doc);
 const changed=editCanvasGraph(initial,{op:'image-layout',target:'root',inherit:true});
 assert.deepEqual(changed.customBg,{source:record.id,fit:'cover',align:'bottom-right',inherit:true});
 const edited=validateDocument({...initial,canvasExtras:changed});
 assert.deepEqual(parseSource(generateSource(edited)),edited);
 assert.throws(()=>editCanvasGraph(initial,{op:'image-layout',target:'layer',index:0,inherit:true}),/does not support/);
 const painter=new ApexPainter();
 const natural=await sharp((await painter.createCanvas({width:128,height:96,customBg:{source:record.dataUri,fit:'cover',align:'bottom-right',inherit:true}})).buffer).raw().toBuffer();
 const filled=await sharp((await painter.createCanvas({width:128,height:96,customBg:{source:record.dataUri,fit:'cover',align:'bottom-right',inherit:false}})).buffer).raw().toBuffer();
 assert.notDeepEqual(natural,filled,'Intrinsic mode must actually paint different native pixels');
 const naturalFitChanged=await sharp((await painter.createCanvas({width:128,height:96,customBg:{source:record.dataUri,fit:'contain',align:'top-left',inherit:true}})).buffer).raw().toBuffer();
 assert.deepEqual(natural,naturalFitChanged,'Fit and alignment ignored when intrinsic is selected in pinned engine');
});
