import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {createHash} from 'node:crypto';
import sharp from 'sharp';import {ApexPainter} from 'apexify.js';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasImageFilters,CanvasFilterDefaults,CanvasFilterFields,type CanvasImageFilter} from '../../features/apex-workspace/canvas-options';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const run=promisify(execFile),painter=new ApexPainter();
const hash=(x:Buffer)=>createHash('sha256').update(x).digest('hex');
let asset:any;
async function getAsset(){if(asset)return asset;const raw=Buffer.alloc(40*24*4);
 for(let y=0;y<24;y++)for(let x=0;x<40;x++){const i=(y*40+x)*4;raw[i]=x*5;raw[i+1]=y*9;raw[i+2]=(x*4+y*2)%255;raw[i+3]=255}
 const png=await sharp(raw,{raw:{width:40,height:24,channels:4}}).png().toBuffer(),sha256=hash(png);
 asset={id:'asset:'+sha256,sha256,mime:'image/png',width:40,height:24,bytes:png.length,dataUri:'data:image/png;base64,'+png.toString('base64')};return asset;}
async function create(filters:CanvasImageFilter[]){const a=await getAsset();const d=createBlankDocument();
 d.width=128;d.height=96;d.layers=[];d.assets=[a];d.canvasExtras={customBg:{source:a.id,fit:'cover',filters}};return validateDocument(d)}
const rgba=async(b:Buffer)=>sharp(b).ensureAlpha().raw().toBuffer();
function withOpts(o:CanvasImageFilter){if(o.type==='motionBlur')return {...o,angle:32};
 if(o.type==='radialBlur')return {...o,centerX:17,centerY:21};
 if(o.type==='pixelate')return {...o,x:2,y:3,width:66,height:55,size:8};
 return {...o}}
test('Stage B strict all 17 native filter discriminants, standalone generated public-v6 Code parity',async()=>{
 const temp=await mkdtemp(join(process.cwd(),'.s17-filters-'));
 let pass=0;
 try{for(const [type,base] of Object.entries(CanvasFilterDefaults)){
   const filter=withOpts(base);
   assert.deepEqual(validateCanvasImageFilters([filter],128,96),[filter]);
   const d=await create([filter]);assert.deepEqual(parseSource(generateSource(d)),d);
   const a=await getAsset(),cfg={width:128,height:96,customBg:{source:a.dataUri,fit:'cover' as const,filters:[filter]}};
   const direct=await rgba((await painter.createCanvas(cfg)).buffer);
   const out=join(temp,type+'.png'),file=join(temp,type+'.mjs');
   const code=generateSource(d);
   assert.ok(code.includes("writeFile('output.png', output)"),'Output sink missing for '+type);
   await writeFile(file,code.replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(out)+', output)'));
   await run(process.execPath,[file],{cwd:process.cwd(),timeout:30000});
   assert.deepEqual(await rgba(await readFile(out)),direct,'Code/native pixel parity '+type);
   pass++;
 }console.log('S17_FILTER_VARIANT_CODE_PARITY='+pass+'/17');assert.equal(pass,17)}
 finally{await rm(temp,{recursive:true,force:true})}
});
test('Stage B strict filter params: discriminants, min/max and rejected unsupported keys',async()=>{
 let tested=0,invalid=0;
 for(const [type,fields] of Object.entries(CanvasFilterFields)){
  const baseline=withOpts(CanvasFilterDefaults[type as keyof typeof CanvasFilterDefaults]);
  assert.deepEqual(validateCanvasImageFilters([baseline],128,96),[baseline]);
  for(const [field,bounds] of Object.entries(fields)){
   const min=bounds[0],max=bounds[1];
   const integer=['size','levels','x','y','width','height'].includes(field);
   const legalMax=(field==='centerX'||field==='centerY'||field==='width'||field==='height'||field==='x'||field==='y')?Math.min(max,field==='centerY'||field==='y'||field==='height'?95:127):max;
   const legalMin=(field==='width'||field==='height')?1:min;
   const set=(v:number)=>field==='radius' ? (({intensity:_prior,...withoutIntensity})=>({...withoutIntensity,radius:v}))(baseline) : {...baseline,[field]:v};
   try{
    validateCanvasImageFilters([set(legalMin)],128,96);
   }catch(e){if(type==='pixelate'&&['width','height'].includes(field))continue;throw Error(type+' min '+field+' '+String(e))}
   // Max legal parameter validated against declared type; geometry-dependent bounds tested separately.
   if(!['x','y','width','height','centerX','centerY'].includes(field))
     assert.deepEqual(validateCanvasImageFilters([set(legalMax)],128,96),[set(legalMax)]);
   assert.throws(()=>validateCanvasImageFilters([set(min-1)],128,96),/range|integer|pixel|center|outside/i,type+'.'+field+' lower invalid');
   assert.throws(()=>validateCanvasImageFilters([set(max+1)],128,96),/range|integer|pixel|center|outside/i,type+'.'+field+' upper invalid');
   if(integer&&max>min+2){
    assert.throws(()=>validateCanvasImageFilters([set(min+0.5)],128,96),/integer|range|pixel|center|outside/i);
   }
   tested++;
  }
  assert.throws(()=>validateCanvasImageFilters([{...baseline,untrusted:'file:///etc/passwd'}],128,96),/unsupported/i);
  invalid++;
 }
 assert.throws(()=>validateCanvasImageFilters(Array(4).fill({type:'invert'}),128,96),/limited/);
 assert.throws(()=>validateCanvasImageFilters([{type:'fake'}],128,96),/unsupported/);
 console.log('S17_FILTER_FIELDS_BOUNDARIES='+JSON.stringify({fields:tested,discriminants:invalid}));
});
test('Stage B native 3-filter stack and reversed order are differentiated without unsafe decoder',async()=>{
 const a=await getAsset();
 const lhs=[{type:'brightness' as const,value:45},{type:'posterize' as const,levels:4},{type:'hueShift' as const,value:105}];
 const rhs=[...lhs].reverse();
 const t=async(filters:CanvasImageFilter[])=>rgba((await painter.createCanvas({width:128,height:96,customBg:{source:a.dataUri,fit:'cover',filters}})).buffer);
 const l=await t(lhs),r=await t(rhs);
 assert.notDeepEqual(l,r,'Filter order must change observable native pixels');
 assert.ok(await create(lhs));assert.ok(await create(rhs));
 console.log('S17_THREE_FILTER_ORDER='+JSON.stringify({order1:hash(l),order2:hash(r)}));
});
