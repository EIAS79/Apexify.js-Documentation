import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createBlankDocument} from '../../features/apex-workspace/model';
import {validateImageAsset} from '../../features/apex-workspace/asset-store';
import {selectRenderAssets} from '../../features/apex-workspace/render-assets';
async function fixture(r:number,g:number,b:number){
 const bytes=await sharp({create:{width:8,height:8,channels:4,background:{r,g,b,alpha:1}}}).png().toBuffer();
 const sha256=createHash('sha256').update(bytes).digest('hex');
 return validateImageAsset({id:'asset:'+sha256,sha256,mime:'image/png',width:8,height:8,bytes:bytes.length,
   dataUri:'data:image/png;base64,'+bytes.toString('base64')});
}
test('render transport selects only the used content-addressed media assets, without mutating saved data',async()=>{
 const active=await fixture(214,37,66),unused=await fixture(33,56,78);
 const doc=createBlankDocument();doc.assets=[active,unused];doc.layers=[];
 doc.canvasExtras={patternBg:{type:'custom',customPatternImage:active.id,opacity:1}};
 const original=JSON.stringify(doc);
 const transported=selectRenderAssets(doc);
 assert.deepEqual(transported.assets,[active]);
 assert.equal(JSON.stringify(doc),original);
 assert.notEqual(transported,doc);
 assert.deepEqual(transported.canvasExtras,doc.canvasExtras);
});
test('image and ordered image-backed pattern sources retain exactly required verified bytes',async()=>{
 const img=await fixture(44,55,66),pat=await fixture(122,144,166),unused=await fixture(12,23,34);
 const doc=createBlankDocument();doc.assets=[img,pat,unused];
 doc.canvasExtras={customBg:{source:img.id},bgLayers:[{type:'presetPattern',pattern:{type:'custom',customPatternImage:pat.id}}]};
 const transported=selectRenderAssets(doc);
 assert.deepEqual(transported.assets,[img,pat]);
});
test('missing pattern dependencies fail closed before any network render request',async()=>{
 const doc=createBlankDocument();
 doc.canvasExtras={patternBg:{type:'custom',customPatternImage:'asset:'+'0'.repeat(64)}};
 assert.throws(()=>selectRenderAssets(doc),/Render asset dependency is missing/);
});
