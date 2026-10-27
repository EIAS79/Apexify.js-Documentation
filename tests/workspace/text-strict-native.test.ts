/** Isolated TEXT-01 strict native evidence probes (not UI certification). */
import test from 'node:test';
import assert from 'node:assert/strict';
import {appendFileSync,existsSync,mkdirSync,readFileSync,writeFileSync,unlinkSync,mkdtempSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {textPropertiesSpec,textRunSpec,textGroupSpec,decorationSpec,validateTextSettings,textArguments,type TextSpec} from '../../features/apex-workspace/domain/text';
import {createBlankDocument,newLayer,validateDocument,type WorkspaceLayer} from '../../features/apex-workspace/model';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const cwd=process.cwd(), shard=Number(process.env.TEXT_CERT_SHARD_INDEX||0), total=Number(process.env.TEXT_CERT_SHARD_TOTAL||1), withCode=process.env.TEXT_CERT_EXEC_CODE==='1';
assert.ok(Number.isInteger(shard)&&Number.isInteger(total)&&total>0&&shard>=0&&shard<total);
const inv=JSON.parse(readFileSync(resolve(cwd,'docs/workspace/TEXT_OPTION_INVENTORY_TEXT01.json'),'utf8'));
assert.equal(inv.results.length,444);
assert.equal(inv.engine,'379a5248f09ed39c1b1734fe104b6bd73a77857f');
const dir=resolve(cwd,'evidence/workspace-text/strict');mkdirSync(dir,{recursive:true});
const logfile=resolve(dir,`native-shard-${shard}-of-${total}${withCode?'-code':''}${process.env.TEXT_CERT_EVIDENCE_SUFFIX??''}.jsonl`);
const log=(data:any)=>appendFileSync(logfile,JSON.stringify({suite:'TEXT01-NATIVE-STRICT-20261024',...data})+'\n');
const specs=new Map<string,TextSpec>();
function walk(s:TextSpec,p:string):void{
 if(s.kind==='object'){for(const [k,v] of Object.entries(s.fields))walk(v,p+'.'+k);return;}
 if(s.kind==='array'){walk(s.item,p+'[]');return;}
 if(s.kind==='decoration'){specs.set(p+' (boolean)',{kind:'boolean'});walk(decorationSpec,p+' (styled)');return;}
 specs.set(p,s);
}
walk(textPropertiesSpec,'createText.TextProperties');
walk(textRunSpec,'createText.TextProperties[]');
walk(textGroupSpec,'createText.CreateTextOptions');
function seed(s:TextSpec,label:string):any{
 switch(s.kind){
  case 'number':return label==='sweepAngle'?120:label==='radius'?140:label==='stop'?.25:label==='width'?(s.max<=100?5:240):label==='size'?36:label==='opacity'?.8:label==='scaleX'||label==='scaleY'?1.1:label==='maxWidth'||label==='maxHeight'?170:label==='width'||label==='height'?240:label==='lineHeight'?1.25:label==='skewX'||label==='skewY'?5:12;
  case 'string':return label==='text'?'Additional text':label==='family'||label==='name'?'DejaVu Sans':'example';
  case 'color':return '#ff8800';
  case 'boolean':return true;
  case 'enum':return s.choices.length>1?s.choices[1]:s.choices[0];
  case 'font-weight':return 350;
  case 'decoration':return true;
  case 'array':
   if(label==='colors')return [{stop:0,color:'#ff00bb'},{stop:1,color:'#11ffaa'}];
   if(label==='points')return [{x:0,y:0},{x:200,y:0},{x:200,y:100},{x:0,y:100}];
   return [seed(s.item,'item')];
  case 'object':
   if(label==='gradient')return {type:'linear',colors:seed(s.fields.colors,'colors')};
   if(label==='perspective')return {points:seed(s.fields.points,'points')};
   if(label==='textOnCurve')return {sweepAngle:120};
   return {};
 }
}
function setAt(target:any,root:TextSpec,p:string,value:any){
 const keys=p.split('.').filter(Boolean);
 let current=target,s=root;
 for(let i=0;i<keys.length;i++){
  const key=keys[i].replace(/\[\]$/,'');const array=keys[i].endsWith('[]');
  if(s.kind!=='object'||!s.fields[key])throw Error('Unmapped '+p+' key='+key+' kind='+s.kind);
  const child=s.fields[key];const final=i===keys.length-1;
  if(final){if(keys.includes('gradient')){if(['centerX','centerY','startAngle'].includes(key))current.type='conic';if(['startRadius','endRadius'].includes(key))current.type='radial';}current[key]=value===undefined?seed(child,key):value;return;}
  if(current[key]===undefined)current[key]=child.kind==='decoration'?{}:seed(child,key);
  current=array?current[key][0]:current[key];
  s=array&&child.kind==='array'?child.item:child.kind==='decoration'?decorationSpec:child;
 }
}
function variantValues(spec:TextSpec,api:string):any[]{
 if(spec.kind==='enum')return [...new Set(spec.choices)];
 if(spec.kind==='font-weight')return [100,350,400,700,900,'normal','bold','bolder','lighter'];
 if(spec.kind==='boolean'||api.endsWith(' (boolean)'))return [true,false];
 return [undefined];
}
function neutral(){
 const l=newLayer('text','strict-text') as Extract<WorkspaceLayer,{kind:'text'}>;
 l.text='TEXT01 STRICT';l.x=40;l.y=80;l.fontSize=40;l.color='#ffffff';l.opacity=1;
 const d=createBlankDocument();
 return validateDocument({...d,width:640,height:360,background:{...d.background,mode:'color',color:'#0a1328'},layers:[l]});
}
function make(api:string,spec:TextSpec,variant:any){
 const d=neutral(),l=d.layers[0] as Extract<WorkspaceLayer,{kind:'text'}>;
 const group=api.startsWith('createText.CreateTextOptions.'),run=api.startsWith('createText.TextProperties[].');
 const prefix=group?'createText.CreateTextOptions.':run?'createText.TextProperties[].':'createText.TextProperties.';
 const key=api.slice(prefix.length).replace(/ \((boolean|styled)\)/g,'');
 const settings:any={};
 if(group){settings.group={isGrouped:true};setAt(settings.group,textGroupSpec,key,variant);}
 else if(run){settings.items=[{text:'ADDITIONAL RUN',x:30,y:185}];setAt(settings.items[0],textRunSpec,key,variant);}
 else{settings.properties={};setAt(settings.properties,textPropertiesSpec,key,variant);}
 l.textSettings=validateTextSettings(settings);
 return validateDocument(d);
}
async function render(doc:ReturnType<typeof validateDocument>){
 const painter=new ApexPainter({type:'buffer'}),canvas=await painter.createCanvas({width:doc.width,height:doc.height,colorBg:doc.background.color});
 const {texts,options}=textArguments(doc.layers[0] as Extract<WorkspaceLayer,{kind:'text'}>);
 const items=Array.isArray(texts)?texts:[texts];
 const metrics=await Promise.all(items.map(x=>painter.measureText(x)));
 const png=options?await painter.createText(texts,canvas.buffer,options):await painter.createText(texts,canvas.buffer);
 return {png,metrics};
}
async function pixels(png:Buffer){return sharp(png).ensureAlpha().raw().toBuffer();}
function sha(x:Buffer){return createHash('sha256').update(x).digest('hex');}
async function generated(doc:ReturnType<typeof validateDocument>){
 const code=generateSource(doc);
 assert.deepEqual(parseSource(code),doc,'canonical Code -> Visual');
 const tmp=mkdtempSync(join(tmpdir(),'text01-run-'));
 const path=resolve(cwd,`_text01_generated_${process.pid}_${Math.random().toString(36).slice(2)}.mjs`);
 try{
  writeFileSync(path,code);
  execFileSync(process.execPath,[path],{cwd:tmp,timeout:90000,windowsHide:true,stdio:'pipe'});
  return readFileSync(resolve(tmp,'output.png'));
 }finally{if(existsSync(path))unlinkSync(path);rmSync(tmp,{recursive:true,force:true});}
}
const baseline=render(neutral()).then(r=>pixels(r.png));
const leaves=[...specs.entries()].filter(([name])=>inv.results.some((x:any)=>x.api===name));
assert.equal(leaves.length,389);
for(const [i,[api,spec]] of leaves.entries()){
 if(i%total!==shard)continue;
 test(`TEXT01-INVALID ${i+1}/389 ${api}`,()=>{
  const invalid=spec.kind==='number'?spec.max+1:spec.kind==='color'?'javascript:alert(1)':spec.kind==='font-weight'?350.5:
    spec.kind==='boolean'?'invalid':spec.kind==='enum'?'NOT_A_SUPPORTED_MEMBER':spec.kind==='string'?7:
    spec.kind==='array'?Array.from({length:spec.max+1},()=>null):'INVALID_OBJECT';
  assert.throws(()=>make(api,spec,invalid));
  log({evidenceId:`VALIDATION-${String(i+1).padStart(4,'0')}`,api,result:'REJECTED_INVALID_INPUT',invalidKind:spec.kind});
 });
 for(const [vi,value] of variantValues(spec,api).entries()){
  test(`TEXT01-PATH ${i+1}/389 ${api} ${value===undefined?'seed':String(value)}`,async()=>{
   const eid=`NATIVE-${String(i+1).padStart(4,'0')}-${String(vi).padStart(2,'0')}`;
   try{
    const d=make(api,spec,value),r=await render(d);
    assert.ok(r.png.length>100);
    assert.ok(r.metrics.length>0&&r.metrics.every(m=>Number.isFinite(m.width)&&m.width>=0));
    const src=generateSource(d);assert.deepEqual(parseSource(src),d);
    const p=await pixels(r.png);
    const e:any={evidenceId:eid,api,variant:value??'seed',native:'PASS',validation:'PASS',codeRoundtrip:'PASS',
     nativeSha256:sha(r.png),pixelChanged:!p.equals(await baseline),metricsCount:r.metrics.length};
    if(withCode){const g=await generated(d);e.generatedCode='EXECUTED';e.outputEquivalent=p.equals(await pixels(g));assert.equal(e.outputEquivalent,true);}
    else e.generatedCode='NOT_EXECUTED';
    log(e);
   }catch(error){log({evidenceId:eid,api,result:'FAIL',error:String(error)});throw error;}
  });
 }
}
test('TEXT01 strict validator/native boundary parity',async()=>{
 const editor=(p:any)=>validateTextSettings({properties:p});
 for(const weight of [100,350,900,'normal','bold','lighter','bolder'])assert.doesNotThrow(()=>editor({font:{weight}}));
 for(const weight of [99,901,350.5,'heavy'])assert.throws(()=>editor({font:{weight}}));
 for(const font of [{family:''},{family:' '},{name:'  '},{path:'C:\\server\\font.ttf'}])assert.throws(()=>editor({font}));
 for(const curve of [{},{sweepAngle:0},{sweepAngle:360},{sweepAngle:-1},{sweepAngle:361}])assert.throws(()=>editor({textOnCurve:curve}));
 for(const sweepAngle of [.001,90,359.999])assert.doesNotThrow(()=>editor({textOnCurve:{sweepAngle}}));
 for(const invalid of [{width:.5},{height:1.3},{width:0}])assert.throws(()=>editor({measurementCanvas:invalid}));
 assert.doesNotThrow(()=>editor({measurementCanvas:{width:1,height:2}}));
 const p=new ApexPainter({type:'buffer'}),base={text:'Native strict boundaries',x:20,y:50,font:{size:25}};
 for(const weight of [99,901,350.5])assert.throws(()=>p.measureText({...base,font:{size:25,weight}}));
 for(const curve of [{},{sweepAngle:0},{sweepAngle:360}])assert.throws(()=>p.measureText({...base,textOnCurve:curve as any}));
 for(const measurementCanvas of [{width:1.5},{height:20.5}])assert.throws(()=>p.measureText({...base,measurementCanvas}));
 await assert.doesNotReject(()=>p.measureText({...base,font:{size:25,weight:350},textOnCurve:{sweepAngle:120,radius:150},measurementCanvas:{width:320,height:200}}));
 log({evidenceId:'NATIVE-BOUNDARY-001',native:'PASS',editor:'PASS'});
});
test('TEXT01 deprecated alias precedence',async()=>{
 const p=new ApexPainter({type:'buffer'}),c=await p.createCanvas({width:320,height:160,colorBg:'#151515'});
 const alias={text:'Legacy',x:20,y:40,fontSize:75,color:'#00ff00',rotation:30,font:{size:28},fill:{color:'#ff0000'},placement:{rotation:0}};
 const nested={text:'Legacy',x:20,y:40,font:{size:28},fill:{color:'#ff0000'},placement:{rotation:0}};
 const a=await p.createText(alias,c.buffer),b=await p.createText(nested,c.buffer);
 assert.ok((await pixels(a)).equals(await pixels(b)));
 log({evidenceId:'NATIVE-LEGACY-PRECEDENCE-001',native:'PASS',excludedStandaloneUI:true});
});
const baselineRows=inv.results.filter((r:any)=>r.api.includes(' baseline')||r.api.startsWith('text selection bounds.')||['createText.TextProperties.text','createText.TextProperties.x','createText.TextProperties.y'].includes(r.api));
assert.equal(baselineRows.length,10);
for(const [i,row] of baselineRows.entries()){
 test(`TEXT01 baseline ${row.api}`,async()=>{
  const d=neutral(),l=d.layers[0] as any;
  const key=row.model.split('.').at(-1),values:any={text:'Modified text',x:90,y:110,fontSize:50,weight:800,color:'#aaff22',opacity:.4,rotation:15,width:550,height:130};
  assert.ok(key&&Object.hasOwn(values,key));
  l[key]=values[key];const verified=validateDocument(d),r=await render(verified);
  assert.deepEqual(parseSource(generateSource(verified)),verified);
  const e:any={evidenceId:`NATIVE-BASELINE-${i+1}`,api:row.api,native:'PASS',pixelChanged:!(await pixels(r.png)).equals(await baseline),
   geometryOnly:row.api.startsWith('text selection bounds.')};
  if(withCode){const g=await generated(verified);e.generatedCode='EXECUTED';e.outputEquivalent=(await pixels(r.png)).equals(await pixels(g));assert.equal(e.outputEquivalent,true);}
  log(e);
 });
}
test('TEXT01 43 native measurement results',async()=>{
 const rows=inv.results.filter((x:any)=>x.api.startsWith('measureText.TextMetrics.'));
 assert.equal(rows.length,43);
 const p=new ApexPainter({type:'buffer'});
 const cases=[
  {scenario:'plain',input:{text:'Metrics',x:20,y:40,font:{size:27}}},
  {scenario:'multiline-chars',input:{text:'Alpha beta gamma\nDelta text',x:20,y:40,font:{size:27},includeCharMetrics:true,layout:{maxWidth:140,lineHeight:1.25},measurementCanvas:{width:420,height:240}}},
  {scenario:'curved',input:{text:'Curve',x:20,y:40,font:{size:27},includeCharMetrics:true,textOnCurve:{sweepAngle:110,radius:150,layoutMode:'clamp' as const}}}
 ];
 const values=[] as Array<{scenario:string,metrics:any}>;
 for(const c of cases){const m=await p.measureText(c.input);assert.ok(m.width>0);values.push({scenario:c.scenario,metrics:m});}
 const readPath=(v:any,key:string)=>key.replaceAll('[]','[0]').split('.').reduce((a,k)=>{const m=k.match(/^(.+)\[0\]$/);return m?a?.[m[1]]?.[0]:a?.[k]},v);
 for(const [i,row] of rows.entries()){
  const name=row.api.slice('measureText.TextMetrics.'.length),observations=values.map(v=>({scenario:v.scenario,present:readPath(v.metrics,name)!==undefined}));
  log({evidenceId:`METRICS-${String(i+1).padStart(3,'0')}`,api:row.api,result:'NATIVE_OBSERVED',observations});
 }
});
