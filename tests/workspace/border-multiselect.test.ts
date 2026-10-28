import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {BORDER_TOKENS,validateBorderSelection,selectedBorderParts,toggleBorderPart} from '../../features/apex-workspace/border-selection';
import {validateCanvasExtras} from '../../features/apex-workspace/canvas-options';
import {createBlankDocument,newLayer,validateDocument} from '../../features/apex-workspace/model';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {migrateV1,toV1} from '../../features/apex-workspace/domain/project';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {imageArguments,groupArguments} from '../../features/apex-workspace/image-runtime';

const exec=promisify(execFile);
test('border combinations validate every supported subset and reject malformed selections',()=>{
 for(let mask=1;mask<1<<BORDER_TOKENS.length;mask++){
  const parts=BORDER_TOKENS.filter((_,index)=>mask&(1<<index));
  assert.equal(validateBorderSelection([...parts].reverse().join(', ')),parts.join(','));
 }
 assert.equal(validateBorderSelection('left,bottom,left'),'bottom,left');
 assert.equal(validateBorderSelection('all'),'all');
 for(const value of ['',',','all,left','left,','center','top,center',null,['left','bottom'],42])
  assert.throws(()=>validateBorderSelection(value));
});

test('independent choices preserve legacy aliases and support the requested edge combinations',()=>{
 assert.deepEqual(selectedBorderParts('bottom-left','edges'),['bottom','left']);
 assert.deepEqual(selectedBorderParts('top,left','corners'),['top-left','top-right','bottom-left']);
 let edges=toggleBorderPart('all','top','edges');
 edges=toggleBorderPart(edges,'right','edges');
 assert.equal(edges,'bottom,left');
 edges=toggleBorderPart(edges,'bottom','edges');
 edges=toggleBorderPart(edges,'top','edges');
 edges=toggleBorderPart(edges,'right','edges');
 assert.equal(edges,'top,right,left');
 assert.equal(toggleBorderPart('left','left','edges'),'left','last edge stays selected');
 assert.equal(toggleBorderPart('top-left','bottom-right','corners'),'top-left,bottom-right');
});

test('Canvas, Image and group combinations survive validation, source and project round trips',()=>{
 const doc=createBlankDocument();
 doc.canvasExtras=validateCanvasExtras({borderRadius:24,borderPosition:'top-left,bottom-right',
  stroke:{width:8,borderPosition:'bottom,left',roundedCorners:'top-left,bottom-right'},
  shadow:{blur:0,borderRadius:16,roundedCorners:'top-right,bottom-left',borderPosition:'bottom,left'}});
 doc.layers=[newLayer('shape','corners')];
 doc.layers[0].imageOptions={borderRadius:16,borderPosition:'top-left,bottom-right',
  stroke:{width:6,borderPosition:'top,right,left',roundedCorners:'bottom-left,bottom-right'},
  shadow:{borderRadius:8,roundedCorners:'top-left,bottom-right'}};
 doc.imageGroups=[{id:'group:corners',name:'Corners',transform:{borderRadius:16,borderPosition:'top-right,bottom-left',
  stroke:{width:4,borderPosition:'bottom,left'},shadow:{borderRadius:12,roundedCorners:'top-left,bottom-right'}}}];
 doc.layers[0].imageGroupId='group:corners';
 const valid=validateDocument(doc);
 assert.deepEqual(parseSource(generateSource(valid)),valid);
 assert.deepEqual(toV1(migrateV1(valid,'p:multi-border')),valid);
 assert.deepEqual(transactCanvasViaV2(valid,valid.canvasExtras!).document,valid);
});

async function assertGeneratedParity(doc:ReturnType<typeof createBlankDocument>,png:Buffer){
 const folder=await mkdtemp(join(process.cwd(),'tests/workspace/.border-combinations-'));
 try{
  const output=join(folder,'out.png'),program=join(folder,'program.mjs');
  await writeFile(program,generateSource(doc).replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(output)+', output)'));
  await exec(process.execPath,[program],{cwd:process.cwd(),timeout:30000});
  assert.deepEqual(await readFile(output),png,'generated program must match native PNG exactly');
 }finally{await rm(folder,{recursive:true,force:true});}
}

for(const combination of ['bottom,left','top,right,left'] as const)
 test('native stroke paints only selected edges: '+combination,async()=>{
  const doc=createBlankDocument();doc.width=128;doc.height=96;doc.layers=[];
  doc.background={...doc.background,mode:'color',color:'#112a40',transparent:false};
  doc.canvasExtras={stroke:{color:'#ff0000',width:12,borderPosition:combination}};
  const png=(await new ApexPainter().createCanvas({width:128,height:96,colorBg:'#112a40',...doc.canvasExtras})).buffer;
  const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(const [side,x,y] of [['top',64,2],['right',125,48],['bottom',64,93],['left',2,48]] as const){
   const index=(y*info.width+x)*4;
   assert.deepEqual([...data.subarray(index,index+3)],combination.includes(side)?[255,0,0]:[17,42,64],side);
  }
  await assertGeneratedParity(validateDocument(doc),png);
 });

for(const target of ['canvas','image','group'] as const)
 test('native '+target+' rounds selected diagonal corners with exact generated-code parity',async()=>{
  const doc=createBlankDocument();doc.width=96;doc.height=96;doc.layers=[];
  doc.background={...doc.background,mode:'color',color:'#ffffff',transparent:false};
  const painter=new ApexPainter({type:'buffer'});
  let png:Buffer;
  if(target==='canvas'){
   doc.canvasExtras={borderRadius:24,borderPosition:'top-left,bottom-right'};
   png=(await painter.createCanvas({width:96,height:96,colorBg:'#ffffff',...doc.canvasExtras})).buffer;
  }else{
   doc.background.color='#112a40';
   const layer=newLayer('shape','corner-proof');
   Object.assign(layer,{x:0,y:0,width:96,height:96,color:'#ffffff',radius:0,strokeWidth:0});
   layer.imageOptions=target==='image'?{borderRadius:24,borderPosition:'top-left,bottom-right'}:{};
   if(target==='group'){
    layer.imageGroupId='group:proof';
    doc.imageGroups=[{id:'group:proof',name:'Proof',transform:{borderRadius:24,borderPosition:'top-left,bottom-right'}}];
   }
   doc.layers=target==='group'?[layer,{...layer,id:'corner-proof-2'}]:[layer];
   const valid=validateDocument(doc),background=(await painter.createCanvas({width:96,height:96,colorBg:'#112a40'})).buffer;
   const artwork=await readFile('public/workspace/assets/crystal-lake.webp');
   const images=valid.layers.map(item=>{
    assert.equal(item.kind,'shape');
    if(item.kind!=='shape')throw Error('Expected shape test layer');
    return imageArguments(item,valid,artwork);
   });
   png=target==='image'?await painter.createImage(images[0],background):await painter.createImage(images,background,
    {isGrouped:true,groupTransform:groupArguments(valid.imageGroups![0].transform,valid,artwork)});
  }
  const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const pixel=(x:number,y:number)=>[...data.subarray((y*info.width+x)*4,(y*info.width+x)*4+4)];
  assert.deepEqual(pixel(94,1),[255,255,255,255],'top right stays square');
  assert.deepEqual(pixel(1,94),[255,255,255,255],'bottom left stays square');
  if(target==='canvas'){
   assert.equal(pixel(1,1)[3],0);assert.equal(pixel(94,94)[3],0);
  }else{
   assert.deepEqual(pixel(1,1),[17,42,64,255]);assert.deepEqual(pixel(94,94),[17,42,64,255]);
  }
  await assertGeneratedParity(validateDocument(doc),png);
 });
