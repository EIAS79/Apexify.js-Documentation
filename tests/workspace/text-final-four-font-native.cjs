const {ApexPainter}=require('apexify.js');
const {GlobalFonts,createCanvas}=require('@napi-rs/canvas');
const sharp=require('sharp'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const outDir=path.resolve('evidence/workspace-text/strict/final-four'), p=new ApexPainter({type:'buffer'}),fontSources=[{name:'Arial',file:'C:/Windows/Fonts/arial.ttf',registered:'TEXT01_Registered_Arial'},{name:'Courier New',file:'C:/Windows/Fonts/cour.ttf',registered:'TEXT01_Registered_Courier'}];
function sha(b){return crypto.createHash('sha256').update(b).digest('hex')}
(async()=>{
 fs.mkdirSync(outDir,{recursive:true});
 const fonts=fontSources.map(f=>({...f,fileExists:fs.existsSync(f.file),sourceSha256:fs.existsSync(f.file)?sha(fs.readFileSync(f.file)):null,registeredResult:fs.existsSync(f.file)?GlobalFonts.registerFromPath(f.file,f.registered):null}));
 const sample='WMWM iiiiii 0123456789 ABCDEFG';
 const base=await p.createCanvas({width:940,height:260,colorBg:'#0b1224'});
 const cases=[
 {kind:'family',label:'system Arial',font:{size:52,family:'Arial'}},
 {kind:'family',label:'system Courier New',font:{size:52,family:'Courier New'}},
 {kind:'name',label:'name Arial overrides family Courier',font:{size:52,family:'Courier New',name:'Arial'}},
 {kind:'name',label:'name Courier overrides family Arial',font:{size:52,family:'Arial',name:'Courier New'}},
 {kind:'family',label:'registered Arial',font:{size:52,family:fontSources[0].registered}},
 {kind:'family',label:'registered Courier',font:{size:52,family:fontSources[1].registered}},
 {kind:'name',label:'registered name Arial',font:{size:52,name:fontSources[0].registered,family:fontSources[1].registered}},
 {kind:'name',label:'registered name Courier',font:{size:52,name:fontSources[1].registered,family:fontSources[0].registered}},
 ];
 const actual=[];
 for(const c of cases){
  const options={text:sample,x:35,y:92,font:c.font,fill:{color:'#fff'}};
  const png=await p.createText(options,base.buffer);
  const m=await p.measureText(options);
  const pixels=await sharp(png).ensureAlpha().raw().toBuffer();
  actual.push({kind:c.kind,label:c.label,font:c.font,width:m.width,height:m.height,fontBoundingBoxAscent:m.fontBoundingBoxAscent,fontBoundingBoxDescent:m.fontBoundingBoxDescent,pngSha256:sha(png),pixelsSha256:sha(pixels)});
 }
 const pairs=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3]];
 const comparisons=pairs.map(([a,b])=>({a:actual[a].label,b:actual[b].label,renderPixelsDiffer:actual[a].pixelsSha256!==actual[b].pixelsSha256,measuredWidthDiffer:Math.abs(actual[a].width-actual[b].width)>0.0001,widths:[actual[a].width,actual[b].width]}));
 const canvas=createCanvas(500,120),ctx=canvas.getContext('2d');ctx.font='normal normal 52px "Arial"';const metric=ctx.measureText(sample);const nativeOptional={};for(const k of ['hangingBaseline','ideographicBaseline','alphabeticBaseline','emHeightAscent','emHeightDescent'])nativeOptional[k]={present:Object.prototype.hasOwnProperty.call(metric,k),value:metric[k]??null};
 const result={engine:'379a5248f09ed39c1b1734fe104b6bd73a77857f',fontSources:fonts,cases:actual,comparisons,underlyingCanvasOptionalMetrics:nativeOptional};
 fs.writeFileSync(path.join(outDir,'font-native-registration-and-optional-metrics.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});