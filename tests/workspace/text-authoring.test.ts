import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {promisify} from "node:util";
import {execFile as execFileCallback} from "node:child_process";
import sharp from "sharp";
import {ApexPainter} from "apexify.js";
import {createBlankDocument,newLayer,validateDocument,type WorkspaceDocument} from "../../features/apex-workspace/model";
import {generateSource,parseSource} from "../../features/apex-workspace/codegen";
import {textArguments,validateTextSettings,type TextSettings} from "../../features/apex-workspace/domain/text";

const execFile=promisify(execFileCallback);
const layer=()=>newLayer("text","text-test") as Extract<ReturnType<typeof newLayer>,{kind:"text"}>;
function documentWith(settings:TextSettings):WorkspaceDocument{
  return validateDocument({...createBlankDocument(),layers:[{...layer(),textSettings:settings}]});
}
const advanced:TextSettings={
  properties:{
    font:{family:"DejaVu Sans",size:56,weight:"bold",style:"italic"},
    layout:{maxWidth:330,lineHeight:1.2,letterSpacing:1.5,wordSpacing:2,maxHeight:230},
    placement:{textAlign:"left",textBaseline:"top",rotation:5,scaleX:1,scaleY:1,skewX:3,skewY:-2},
    decorations:{bold:true,italic:true,underline:{color:"#ffffff",width:1},strikethrough:false,overline:true},
    fill:{color:"#ff00aa",opacity:0.9},
    stroke:{color:"#020304",width:1,opacity:0.7,style:"solid"},
    effects:{shadow:{color:"#000000",offsetX:2,offsetY:3,blur:4,opacity:.5},
      highlight:{color:"#232323",opacity:.3},glow:{color:"#ff44ff",intensity:2,opacity:.4}},
    includeCharMetrics:true,
    measurementCanvas:{width:640,height:320}
  },
  items:[{text:"Second string مرحبا दुनिया 😄",x:30,y:140,font:{family:"DejaVu Sans",size:24},fill:{color:"#00ff99"}}],
  group:{isGrouped:true,groupTransform:{translateX:3,translateY:2,rotation:0,opacity:0.96}}
};
test("schema validates every nested editable type and persists Unicode safely",()=>{
  const doc=documentWith(advanced);
  assert.deepEqual(doc.layers[0].kind,"text");
  assert.deepEqual(JSON.parse(JSON.stringify(doc)),doc);
  assert.equal((doc.layers[0] as ReturnType<typeof layer>).textSettings?.items?.[0].text,"Second string مرحبا दुनिया 😄");
  assert.deepEqual(parseSource(generateSource(doc)),doc);
  assert.match(generateSource(doc),/painter\.createText\(items\.length/);
  assert.match(generateSource(doc),/painter\.measureText\(textProps\)/);
});
test("text option allowlist rejects unsafe paths, invalid unions and malformed arrays",()=>{
  assert.throws(()=>validateTextSettings({properties:{font:{path:"C:\\Windows\\system.ini"}}}),/not supported/);
  assert.throws(()=>validateTextSettings({properties:{fill:{gradient:{type:"linear",colors:[]}}}}),/invalid item count/);
  assert.throws(()=>validateTextSettings({properties:{placement:{perspective:{points:[{x:0,y:0}]}}}}),/invalid item count/);
  assert.throws(()=>validateTextSettings({properties:{stroke:{style:"not-real"}}}),/unsupported/);
  assert.throws(()=>validateTextSettings({items:Array.from({length:33},(_,i)=>({text:"line",x:i,y:0}))}),/invalid item count/);
  assert.throws(()=>validateTextSettings({group:{isGrouped:false,groupTransform:{rotation:10}}}),/Enable isGrouped/);
  assert.throws(()=>validateTextSettings({properties:{layout:{maxWidth:Infinity}}}),/must be/);
});
test("gradient variants, curve and grouped perspective are canonical API objects",()=>{
  const settings:TextSettings={properties:{
    fill:{gradient:{type:"radial",colors:[{stop:0,color:"#aa0000"},{stop:1,color:"#0000aa"}],startRadius:2,endRadius:140}},
    textOnCurve:{sweepAngle:90,radius:160,up:true,layoutMode:"clamp",baselineOffset:1,startAngleDeg:0}
  },group:{isGrouped:true,groupTransform:{perspective:{points:[{x:0,y:0},{x:200,y:0},{x:200,y:80},{x:0,y:80}],interpolation:"bilinear",edgeMode:"clamp"}}}};
  const result=validateTextSettings(settings);
  assert.equal(result?.properties?.textOnCurve?.layoutMode,"clamp");
  assert.equal(result?.group?.groupTransform?.perspective?.points.length,4);
});
test("real v6 native rendering and measurement produce a changed PNG",async()=>{
  const painter=new ApexPainter({type:"buffer"});
  const canvas=await painter.createCanvas({width:640,height:360,colorBg:"#081126"});
  const testLayer={...layer(),text:"Apexify.js مرحبا Świat 日本語 🎨",x:20,y:25,fontSize:38,width:500,height:120,
    textSettings:{...advanced,items:[],group:undefined,properties:{...advanced.properties,
      font:{family:"DejaVu Sans",size:38,weight:"bold",style:"italic"},
      layout:{maxWidth:570,lineHeight:1.2},placement:{textBaseline:"top"},effects:{shadow:{color:"#222222",blur:2,offsetX:1,offsetY:1}}}}} as ReturnType<typeof layer>;
  const {texts,options}=textArguments(testLayer);
  const text=Array.isArray(texts)?texts[0]:texts;
  const metrics=await painter.measureText(text);
  assert.ok(Number.isFinite(metrics.width)&&metrics.width>0);
  assert.ok(Number.isFinite(metrics.height)&&metrics.height>0);
  const rendered=options?await painter.createText(texts,canvas.buffer,options):
    await painter.createText(texts,canvas.buffer);
  const a=await sharp(canvas.buffer).raw().toBuffer();
  const output=await sharp(rendered).raw().toBuffer();
  assert.equal((await sharp(rendered).metadata()).width,640);
  assert.ok(!a.equals(output),"real pixels must change after createText");
});
test("generated source executes actual pinned ApexPainter createText",async()=>{
  const doc=documentWith({...advanced,items:[],group:undefined});
  doc.background.mode="color";
  const dir=await mkdtemp(join(tmpdir(),"apexify-text-code-"));
  const projectRoot=resolve(process.cwd());
  const script=join(projectRoot,`text-generated-${process.pid}-${Date.now()}.mjs`);
  try{
    await writeFile(script,generateSource(doc),"utf8");
    const result=await execFile(process.execPath,[script],{cwd:dir,timeout:20_000,windowsHide:true});
    assert.equal(result.stderr,"");
    const png=await readFile(join(dir,"output.png"));
    const metadata=await sharp(png).metadata();
    assert.equal(metadata.width,1280);
    assert.equal(metadata.height,720);
  }finally{await rm(script,{force:true});await rm(dir,{force:true,recursive:true});}
});

test("native grouped array overload draws additional texts and group transform",async()=>{
  const painter=new ApexPainter({type:"buffer"});
  const canvas=await painter.createCanvas({width:460,height:260,colorBg:"#000000"});
  const base={...layer(),x:24,y:24,text:"First"};
  const enhanced={...base,textSettings:{
    properties:{font:{family:"DejaVu Sans",size:39},fill:{color:"#faff18"}},
    items:[{text:"Second",x:24,y:110,font:{size:35,family:"DejaVu Sans"},fill:{color:"#ff00aa"}}],
    group:{isGrouped:true,groupTransform:{translateX:4,translateY:4,opacity:1}}
  } as TextSettings};
  const {texts,options}=textArguments(enhanced as ReturnType<typeof layer>);
  assert.ok(Array.isArray(texts)&&texts.length===2);
  assert.ok(options?.isGrouped);
  const png=await painter.createText(texts,canvas.buffer,options!);
  assert.notDeepEqual(png,canvas.buffer);
  assert.equal((await sharp(png).metadata()).width,460);
});
test("native curved, perspective and gradient text exercise public options",async()=>{
  const painter=new ApexPainter({type:"buffer"});
  const canvas=await painter.createCanvas({width:500,height:350,colorBg:"#050514"});
  const props={
    text:"Curved typography",x:240,y:190,
    font:{family:"DejaVu Sans",size:34},
    fill:{gradient:{type:"linear" as const,startX:0,startY:0,endX:300,endY:0,
      colors:[{stop:0,color:"#ff0000"},{stop:1,color:"#00ffaa"}]}},
    textOnCurve:{sweepAngle:120,radius:180,up:true,layoutMode:"clamp" as const},
    placement:{textBaseline:"middle" as const}
  };
  const measured=await painter.measureText(props);
  assert.ok(measured.width>0);
  const rendered=await painter.createText(props,canvas.buffer);
  assert.equal((await sharp(rendered).metadata()).height,350);
  const transformed=await painter.createText({
    text:"Perspective",x:45,y:65,font:{family:"DejaVu Sans",size:30},
    fill:{color:"#ffee00"},
    placement:{perspective:{points:[{x:5,y:5},{x:300,y:15},{x:310,y:90},{x:15,y:90}] as
      [{x:number;y:number},{x:number;y:number},{x:number;y:number},{x:number;y:number}],interpolation:"bilinear" as const}}
  },rendered);
  assert.equal((await sharp(transformed).metadata()).width,500);
});

test("CSS color forms supported by pinned native backend remain authorable without accepting arbitrary strings",()=>{
  for(const color of ["red","rebeccapurple","transparent","#abc","#aabbccdd","rgb(255,0,0)","rgba(255,0,0,0.8)","hsl(0,100%,50%)"]){
    assert.equal(validateTextSettings({properties:{fill:{color}}})?.properties?.fill?.color,color);
  }
  for(const color of ["gibberish","url(http://unsafe)","calc(1+1)"]){
    assert.throws(()=>validateTextSettings({properties:{fill:{color}}}),/supported CSS color/);
  }
});
