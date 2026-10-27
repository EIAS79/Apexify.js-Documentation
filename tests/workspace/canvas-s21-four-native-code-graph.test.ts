import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {mkdtemp,rm,readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import sharp from 'sharp';import {ApexPainter} from 'apexify.js';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {validateCanvasExtras,type CanvasExtras} from '../../features/apex-workspace/canvas-options';
import {validateImageAsset} from '../../features/apex-workspace/asset-store';
import {parseSource,generateSource} from '../../features/apex-workspace/codegen';
import {transactCanvasViaV2} from '../../features/apex-workspace/domain/canvas-bridge';
import {projectCanvasGraph,editCanvasGraph,validateGraphTopology} from '../../features/apex-workspace/canvas-graph';
const run=promisify(execFile),painter=new ApexPainter({type:'buffer'}),root=process.cwd();
const s18=JSON.parse(readFileSync(resolve(root,'docs/workspace/CREATE_CANVAS_STRICT_CERTIFICATION_S18.json'),'utf8'));
const expected=['canvas.patternBg.repeat','canvas.bgLayers.pattern.repeat','canvas.shadow.borderRadius','canvas.shadow.borderPosition'];
const targets=s18.paths.filter((x:any)=>expected.includes(x.optionPath));
assert.equal(targets.length,4);
const targetPaths=targets.map((x:any)=>x.optionPath);
const artifacts=process.env.S21_EVIDENCE_DIR||'D:/ApexifyWorkspaceIntegration/audit/S21_S20_CONTROLLED_INTEGRATION';
const colors=[{stop:0,color:'#ef2469'},{stop:0.48,color:'#31dcc2'},{stop:1,color:'#ffd66e'}];
const g=(kind:'linear'|'radial'|'conic'='linear')=>kind==='radial'?{type:'radial',colors,startX:12,startY:12,endX:60,endY:46,startRadius:0,endRadius:95}:
 kind==='conic'?{type:'conic',colors,centerX:80,centerY:65}:
 {type:'linear',colors,startX:3,startY:0,endX:29,endY:25};
const pattern=(kind='grid',source?:string)=>kind==='custom'?{type:'custom',customPatternImage:source,opacity:1,size:12,spacing:18}:
 {type:kind,color:'#f45388',secondaryColor:'#2673de',size:13,spacing:23,opacity:1,rotation:11,scale:1,offsetX:0,offsetY:0};
type Asset=ReturnType<typeof validateImageAsset>;
let assets:Asset[]=[];
async function init(){
 const variants=['png','jpeg','webp'] as const;
 for(let a=0;a<3;a++){
  const raw=Buffer.alloc(48*32*4);
  for(let y=0;y<32;y++)for(let x=0;x<48;x++){const i=(y*48+x)*4;raw[i]=(a*53+x*4+y*3)%256;raw[i+1]=(x*7+a*36)%256;raw[i+2]=(y*9+a*80)%256;raw[i+3]=255;}
  const format=variants[a];const data=await sharp(raw,{raw:{width:48,height:32,channels:4}})[format]().toBuffer();
  const mime=format==='jpeg'?'image/jpeg':format==='png'?'image/png':'image/webp';
  const sha256=createHash('sha256').update(data).digest('hex');
  assets.push(validateImageAsset({id:'asset:'+sha256,sha256,mime,width:48,height:32,bytes:data.length,dataUri:'data:'+mime+';base64,'+data.toString('base64')}));
 }
}
type Case={path:string;why:string;before:any;after:any;dimensions?:[number,number];beforeDimensions?:[number,number]; expectation?:'pixel'|'semantic';variants?:string[]};
const result:Record<string,any>={};
const id=(i:number)=>assets[i].id;
const L=(type:'color'|'gradient'|'image'|'pattern'|'presetPattern'|'noise',i=0):any=>
 type==='color'?{type,value:'#eb3e73',opacity:0.82,blendMode:'source-over',nodeId:'layer:s18-color'}:
 type==='gradient'?{type,value:g(),opacity:0.85,nodeId:'layer:s18-gradient'}:
 type==='image'?{type,source:id(i),fit:'cover',align:'bottom-right',opacity:0.9,nodeId:'layer:s18-image'}:
 type==='pattern'?{type,source:id(i),repeat:'repeat',opacity:0.8,nodeId:'layer:s18-pattern'}:
 type==='presetPattern'?{type,pattern:pattern('grid'),opacity:0.8,nodeId:'layer:s18-procedural'}:
 {type:'noise',intensity:0.18,nodeId:'layer:s18-noise'};
const suite=(variant=0)=>[L('color'),L('gradient'),L('image',variant),L('pattern',variant),L('presetPattern'),L('noise')];
const stroke=()=>({color:'#fa34a2',width:19,opacity:1,blur:0,position:4,style:'solid',borderRadius:26});
const shadow=()=>({color:'#f46e2d',offsetX:26,offsetY:18,blur:0,opacity:1});
function fixture(path:string):Case{
 if(path==='canvas.patternBg.repeat'){
  const pat={type:'dots',color:'#e9306a',secondaryColor:'#1ce5a8',size:18,spacing:16,opacity:1};
  return {path,why:'S20 viewport vs single procedural cell',before:{patternBg:{...pat,repeat:'repeat'}},after:{patternBg:{...pat,repeat:'no-repeat'}},dimensions:[192,144],beforeDimensions:[192,144],expectation:'pixel'};
 }
 if(path==='canvas.bgLayers.pattern.repeat'){
  const pat={type:'grid',color:'#e9306a',secondaryColor:'#1ce5a8',size:18,spacing:16,opacity:1};
  return {path,why:'S20 ordered preset layer procedural clip',before:{bgLayers:[{type:'presetPattern',nodeId:'layer:s21-native-pattern',pattern:{...pat,repeat:'repeat'},opacity:1}]},after:{bgLayers:[{type:'presetPattern',nodeId:'layer:s21-native-pattern',pattern:{...pat,repeat:'repeat-y'},opacity:1}]},dimensions:[192,144],beforeDimensions:[192,144],expectation:'pixel'};
 }
 if(path==='canvas.shadow.borderRadius'){
  const sh={color:'#fc487c',opacity:1,offsetX:0,offsetY:0,blur:0};
  return {path,why:'S20 explicit shadow radius wins flat root',before:{__transparent:true,borderRadius:0,shadow:{...sh,borderRadius:0}},after:{__transparent:true,borderRadius:0,shadow:{...sh,borderRadius:64}},dimensions:[192,144],beforeDimensions:[192,144],expectation:'pixel'};
 }
 if(path==='canvas.shadow.borderPosition'){
  const sh={color:'#f04375',opacity:1,offsetX:0,offsetY:0,blur:0};
  return {path,why:'S20 deprecated alias wins inherited root borderPosition',before:{__transparent:true,borderRadius:53,shadow:{...sh,borderPosition:'all'}},after:{__transparent:true,borderRadius:53,shadow:{...sh,borderPosition:'top'}},dimensions:[192,144],beforeDimensions:[192,144],expectation:'pixel'};
 }
 let before:any={},after:any={},why='pinned native discriminating option value';let dimensions:[number,number]=[192,144],beforeDimensions=dimensions,expectation:'pixel'|'semantic'='pixel';
 if(path.startsWith('canvas.bgLayers.')){
  const key=path.slice('canvas.bgLayers.'.length);
  if(key==='type'){before={bgLayers:[L('color')]};after={bgLayers:[L('gradient')]};}
  else if(key==='value'){before={bgLayers:[L('color')]};after={bgLayers:[{...L('color'),value:'#198feb'}]};}
  else if(key==='source'){before={bgLayers:[L('image',0),L('pattern',0)]};after={bgLayers:[L('image',1),L('pattern',1)]};}
  else if(key==='repeat'){before={bgLayers:[{...L('pattern'),repeat:'no-repeat'}]};after={bgLayers:[{...L('pattern'),repeat:'repeat-x'}]};}
  else if(key==='pattern'){before={bgLayers:[L('presetPattern')]};after={bgLayers:[{...L('presetPattern'),pattern:pattern('dots')}]};}
  else if(key.startsWith('pattern.')){
    const leaf=key.slice('pattern.'.length);
    const b=pattern('grid',id(0)) as any,a={...b};
    if(leaf==='customPatternImage'){before={bgLayers:[{...L('presetPattern'),pattern:pattern('custom',id(0))}]};after={bgLayers:[{...L('presetPattern'),pattern:pattern('custom',id(1))}]};}
    else if(leaf==='type'){a.type='dots';}
    else if(leaf==='color')a.color='#13e4b8';
    else if(leaf==='secondaryColor')a.secondaryColor='#fd9032';
    else if(leaf==='size')a.size=31;
    else if(leaf==='spacing')a.spacing=48;
    else if(leaf==='rotation')a.rotation=58;
    else if(leaf==='scale')a.scale=1.9;
    else if(leaf==='offsetX')a.offsetX=24;
    else if(leaf==='offsetY')a.offsetY=17;
    else throw Error('Unknown pattern '+leaf);
    if(leaf!=='customPatternImage'){before={bgLayers:[{...L('presetPattern'),pattern:b}]};after={bgLayers:[{...L('presetPattern'),pattern:a}]};}
  }else throw Error('Unknown layer leaf '+key);
 }else if(path==='canvas.bgLayers'){
  before={bgLayers:[L('color'),L('image')]};after={bgLayers:suite()};why='six public discriminants in actual ordered mixed native compositor';
 }else if(path==='canvas.blur'){before={gradientBg:g(),blur:0};after={gradientBg:g(),blur:11};}
 else if(path==='canvas.borderPosition'){before={borderRadius:35,borderPosition:'all',stroke:stroke()};after={borderRadius:35,borderPosition:'left',stroke:stroke()};}
 else if(path==='canvas.borderRadius'){before={borderRadius:0,stroke:stroke()};after={borderRadius:48,stroke:stroke()};}
 else if(path==='canvas.colorBg'){before={colorBg:'#173250'};after={colorBg:'#ab36c6'};}
 else if(path==='canvas.customBg'){before={};after={customBg:{source:id(0),fit:'cover',align:'bottom-right'}};}
 else if(path==='canvas.customBg.inherit'){before={customBg:{source:id(0),fit:'cover',inherit:false}};after={customBg:{source:id(0),fit:'cover',inherit:true}};}
 else if(path==='canvas.customBg.source'){before={customBg:{source:id(0),fit:'cover'}};after={customBg:{source:id(2),fit:'cover'}};}
 else if(path==='canvas.gradientBg'){before={};after={gradientBg:g('radial')};}
 else if(path==='canvas.gradientBg.colors'){before={gradientBg:g()};after={gradientBg:{...g(),colors:[colors[0],{stop:0.31,color:'#adff44'},colors[2]]}};}
 else if(path==='canvas.gradientBg.repeat'){before={gradientBg:{...g(),repeat:'no-repeat'}};after={gradientBg:{...g(),repeat:'reflect'}};}
 else if(path==='canvas.width'){beforeDimensions=[120,144];dimensions=[192,144];expectation='semantic';}
 else if(path==='canvas.height'){beforeDimensions=[192,96];dimensions=[192,144];expectation='semantic';}
 else if(path==='canvas.x'){before={x:0,gradientBg:g()};after={x:45,gradientBg:g()};expectation='semantic';}
 else if(path==='canvas.y'){before={y:0,gradientBg:g()};after={y:35,gradientBg:g()};expectation='semantic';}
 else if(path==='canvas.patternBg'){before={patternBg:pattern('grid')};after={patternBg:pattern('dots')};}
 else if(path==='canvas.patternBg.customPatternImage'){before={patternBg:pattern('custom',id(0))};after={patternBg:pattern('custom',id(1))};}
 else if(path==='canvas.rotation'){before={rotation:0,gradientBg:g()};after={rotation:36,gradientBg:g()};}
 else if(path==='canvas.shadow'){before={borderRadius:30};after={borderRadius:30,shadow:shadow()};}
 else if(path.startsWith('canvas.shadow.')){
   const key=path.slice('canvas.shadow.'.length),base=shadow() as Record<string,any>,changed={...base};
   if(key==='color')changed.color='#3eebfa';
   else if(key==='offsetX')changed.offsetX=52;
   else if(key==='offsetY')changed.offsetY=43;
   else if(key==='blur')changed.blur=15;
   else if(key==='opacity')changed.opacity=0.34;
   else throw Error('Unknown shadow '+key);
   before={borderRadius:38,shadow:base};after={borderRadius:38,shadow:changed};
 }else if(path==='canvas.stroke'){before={borderRadius:31};after={borderRadius:31,stroke:stroke()};}
 else if(path.startsWith('canvas.stroke.')){
   const key=path.slice('canvas.stroke.'.length),base=stroke() as Record<string,any>,changed={...base};
   if(key==='color')changed.color='#1cebd2';
   else if(key==='borderRadius')changed.borderRadius=8;
   else throw Error('Unknown stroke '+key);
   before={borderRadius:32,stroke:base};after={borderRadius:32,stroke:changed};
 }else if(path==='canvas.zoom'){before={zoom:{scale:1},gradientBg:g()};after={zoom:{scale:1.8,centerX:86,centerY:56},gradientBg:g()};}
 else throw Error('No exact path fixture '+path);
 return {path,why,before,after,dimensions,beforeDimensions,expectation};
}
function doc(input:any,dimensions:[number,number]){
 const d=createBlankDocument();d.width=dimensions[0];d.height=dimensions[1];d.layers=[];d.assets=assets;
 d.background={...d.background,mode:'color',transparent:input.__transparent===true,color:input.colorBg||'#17446f'};
 const copy={...input};delete copy.colorBg;delete copy.__transparent;
 d.canvasExtras=validateCanvasExtras(copy);
 return validateDocument(d);
}
function image(pattern:any){return pattern?.type==='custom'?{...pattern,customPatternImage:assets.find(a=>a.id===pattern.customPatternImage)!.dataUri}:pattern}
const hydrated=(v:any):any=>!v||typeof v!=='object'?v:Array.isArray(v)?v.map(hydrated):Object.fromEntries(Object.entries(v).filter(([k])=>k!=='nodeId').map(([k,w])=>[k,typeof w==='string'&&w.startsWith('asset:')?assets.find(a=>a.id===w)?.dataUri??w:hydrated(w)]));
function native(doc:any){
 const ext=doc.canvasExtras||{},bg=doc.background;
 const primary=ext.customBg?{customBg:hydrated(ext.customBg)}:ext.gradientBg?{gradientBg:ext.gradientBg}:bg.transparent?{transparentBase:true}:{colorBg:bg.color};
 const {gradientBg,customBg,bgLayers,patternBg,noiseBg,...effects}=ext;
 return {width:doc.width,height:doc.height,...primary,...(bgLayers?{bgLayers:hydrated(bgLayers)}:{}),...(patternBg?{patternBg:hydrated(patternBg)}:{}),...(noiseBg?{noiseBg}:{}),...effects};
}
const pixels=async(bytes:Buffer)=>sharp(bytes).ensureAlpha().raw().toBuffer();
async function codeRaster(document:any,dir:string){
 const source=generateSource(document),out=join(dir,'canvas.png'),file=join(dir,'code.mjs');
 await writeFile(file,source.replace("writeFile('output.png', output)",'writeFile('+JSON.stringify(out)+', output)'));
 await run(process.execPath,[file],{cwd:root,timeout:30000});
 return pixels(await readFile(out));
}
async function caseRun(c:Case){
 const b=doc(c.before,c.beforeDimensions!),a=doc(c.after,c.dimensions!);
 assert.deepEqual(parseSource(generateSource(a)),a,'Code-to-Visual canonical source');
 assert.deepEqual(transactCanvasViaV2(a,a.canvasExtras??{}).document,a,'Graph/Canonical v2 bridge');
 const graph=projectCanvasGraph(a);assert.ok(graph.nodes.length>0,'Semantic Graph empty');
 validateGraphTopology(graph);
 assert.ok(graph.nodes.some(n=>n.id==='canvas:root')&&graph.edges.some(e=>e.id==='edge:root-output'));
 const extras=a.canvasExtras??{};
 if(extras.gradientBg){
   assert.deepEqual(editCanvasGraph(a,{op:'gradient',value:extras.gradientBg}).gradientBg,extras.gradientBg);
   assert.ok(graph.edges.some(e=>e.id==='edge:gradient-root'));
 }
 if(extras.patternBg){
   assert.deepEqual(editCanvasGraph(a,{op:'root-pattern',value:extras.patternBg}).patternBg,extras.patternBg);
   assert.ok(graph.edges.some(e=>e.id==='edge:pattern-root'));
 }
 if(extras.customBg){
   assert.equal(editCanvasGraph(a,{op:'source',assetId:extras.customBg.source}).customBg?.source,extras.customBg.source);
   assert.ok(graph.edges.some(e=>e.id==='edge:image-bg'));
 }
 if(extras.stroke){
   assert.deepEqual(editCanvasGraph(a,{op:'stroke',value:extras.stroke}).stroke,extras.stroke);
   assert.ok(graph.edges.some(e=>e.id==='edge:stroke-root'));
 }
 if(extras.shadow){
   assert.deepEqual(editCanvasGraph(a,{op:'shadow',value:extras.shadow}).shadow,extras.shadow);
   assert.ok(graph.edges.some(e=>e.id==='edge:shadow-root'));
 }
 if(extras.zoom)assert.deepEqual(editCanvasGraph(a,{op:'zoom',value:extras.zoom}).zoom,extras.zoom);
 for(const [i,layer] of (extras.bgLayers??[]).entries()){
   assert.ok(graph.nodes.some(n=>n.id==='canvas:ordered-layer:'+(layer.nodeId??'legacy-index:'+i)));
   if(layer.type==='presetPattern')
     assert.deepEqual((editCanvasGraph(a,{op:'layer-pattern',index:i,value:layer.pattern}).bgLayers?.[i] as any).pattern,layer.pattern);
   if(layer.type==='gradient')
     assert.deepEqual((editCanvasGraph(a,{op:'layer-gradient',index:i,value:layer.value}).bgLayers?.[i] as any).value,layer.value);
   if(layer.type==='image'||layer.type==='pattern')
     assert.equal((editCanvasGraph(a,{op:'layer-source',index:i,assetId:layer.source}).bgLayers?.[i] as any).source,layer.source);
 }

 const direct=await pixels((await painter.createCanvas(native(a))).buffer);
 const prior=await pixels((await painter.createCanvas(native(b))).buffer);
 const observed=!direct.equals(prior);
 const semantic=a.width!==b.width||a.height!==b.height||a.canvasExtras?.x!==b.canvasExtras?.x||a.canvasExtras?.y!==b.canvasExtras?.y;
 if(c.expectation==='pixel')assert.ok(observed,'Pinned native pixels unaffected by exact leaf '+c.path);
 else assert.ok(semantic,'No semantic change '+c.path);
 const dir=await mkdtemp(join(root,'.s21path-'));
 try{const independent=await codeRaster(a,dir);assert.deepEqual(independent,direct,'independent Code/native RGBA differs '+c.path)}
 finally{await rm(dir,{recursive:true,force:true,maxRetries:10,retryDelay:120})}
 return {nativePixelsDiffer:observed,documentSemanticsDiffer:semantic,codeRawPixelParity:true,canonicalRoundtrip:true,graph:true,width:a.width,height:a.height,description:c.why,expectation:c.expectation};
}
async function main(){
 await init();assert.deepEqual(targetPaths.sort(),targets.map((x:any)=>x.optionPath).sort());
 await mkdir(artifacts,{recursive:true});
 const all=targetPaths.map(fixture),log:any[]=[];
 await writeFile(join(artifacts,'S21_EXACT_4_TARGET_MATRIX.json'),JSON.stringify(all.map((x:{path:string;expectation:string})=>({path:x.path,expected:x.expectation,unprovenRequirement:targets.find((r:any)=>r.optionPath===x.path).unprovenRequirement})),null,2));
 for(const c of all){
  try{const proof=await caseRun(c);log.push({path:c.path,status:'NATIVE_CODE_PASS',...proof});console.log('S21_EXACT_NATIVE_CODE_PASS='+c.path);}
  catch(e){log.push({path:c.path,status:'NATIVE_CODE_FAIL',error:String((e as Error).stack??e).slice(0,1400)});console.log('S21_EXACT_NATIVE_CODE_FAIL='+c.path+' : '+String((e as Error).message).slice(0,220));}
  await writeFile(join(artifacts,'S21_4_NATIVE_CODE_CHECKPOINT.json'),JSON.stringify({total:4,tested:log.length,records:log},null,2));
 }
 console.log('S21_4_NATIVE_CODE_COUNTS='+JSON.stringify({total:4,passed:log.filter(x=>x.status==='NATIVE_CODE_PASS').length,failed:log.filter(x=>x.status==='NATIVE_CODE_FAIL').length}));
 if(log.some(x=>x.status==='NATIVE_CODE_FAIL'))process.exitCode=1;
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
