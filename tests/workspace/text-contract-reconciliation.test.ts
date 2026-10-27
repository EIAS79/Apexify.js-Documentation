import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {promisify} from "node:util";
import {execFile as execFileCallback} from "node:child_process";
import sharp from "sharp";
import {ApexPainter} from "apexify.js";
import {createBlankDocument,newLayer,validateDocument} from "../../features/apex-workspace/model";
import {generateSource,parseSource} from "../../features/apex-workspace/codegen";
import {textArguments,validateTextSettings} from "../../features/apex-workspace/domain/text";

const execFile=promisify(execFileCallback);
const settings=(properties:unknown)=>validateTextSettings({properties});

test("pinned font union: integer 100..900 or named; nonempty explicit family/name",async()=>{
  const painter=new ApexPainter({type:"buffer"});
  for(const weight of [100,350,700,900,"normal","bold","bolder","lighter"] as const){
    const candidate={text:"Weight",x:10,y:20,font:{size:24,family:"DejaVu Sans",weight}} as const;
    assert.equal(settings({font:{weight}})?.properties?.font?.weight,weight);
    assert.ok((await painter.measureText(candidate)).width>0);
  }
  for(const weight of [99,901,400.5,Infinity,"300","heavier"]){
    assert.throws(()=>settings({font:{weight}}),/weight/);
  }
  for(const field of ["family","name"]){
    assert.throws(()=>settings({font:{[field]:" "}}),/non-empty/);
    assert.throws(()=>settings({font:{[field]:""}}),/non-empty/);
    assert.ok(settings({font:{[field]:"DejaVu Sans"}}));
  }
});

test("curve requires native sweep 0 < angle < 360 and mandatory value",async()=>{
  const painter=new ApexPainter({type:"buffer"});
  for(const sweepAngle of [1,120,359.9]){
    const textOnCurve={sweepAngle,radius:125,up:true,layoutMode:"fit" as const};
    assert.equal(settings({textOnCurve})?.properties?.textOnCurve?.sweepAngle,sweepAngle);
    const metric=await painter.measureText({text:"Arc",x:25,y:40,font:{size:24},textOnCurve});
    assert.ok(metric.width>0);
  }
  for(const textOnCurve of [{},{sweepAngle:0},{sweepAngle:360},{sweepAngle:-3},{sweepAngle:361}]){
    assert.throws(()=>settings({textOnCurve}),/sweepAngle/);
  }
  assert.ok(settings({textOnCurve:{sweepAngle:90,radius:Number.MIN_VALUE}}));
  assert.throws(()=>settings({textOnCurve:{sweepAngle:90,radius:0}}),/radius/);
});

test("native integer measurement canvas and canonical nested precedence",async()=>{
  assert.throws(()=>settings({measurementCanvas:{width:128.5}}),/integer/);
  assert.throws(()=>settings({measurementCanvas:{height:99.9}}),/integer/);
  assert.ok(settings({measurementCanvas:{width:128,height:128}}));
  const first=newLayer("text","canonical");
  assert.equal(first.kind,"text");
  const layer={...first,kind:"text" as const,fontSize:48,opacity:0.5,color:"#123456",rotation:19,
    textSettings:{properties:{font:{size:28,weight:600},fill:{color:"#abcdef",opacity:.8},
      placement:{rotation:5},measurementCanvas:{width:256,height:128}}}};
  const {texts}=textArguments(layer);
  const text=Array.isArray(texts)?texts[0]:texts;
  assert.equal(text.font?.size,28);
  assert.equal(text.fill?.color,"#abcdef");
  assert.equal(text.fill?.opacity,.8);
  assert.equal(text.placement?.rotation,5);
  assert.equal((await new ApexPainter({type:"buffer"}).measureText(text)).width>0,true);
});

test("mixed native canvas+image+grouped text: code/visual roundtrip, ordered runs, PNG delta, metrics",async()=>{
  const imageBytes=await readFile(resolve("public/workspace/assets/crystal-lake.webp"));
  const image=newLayer("image","mixed-image","data:image/webp;base64,"+imageBytes.toString("base64"));
  const main=newLayer("text","mixed-text");
  assert.equal(main.kind,"text");
  const text={...main,kind:"text" as const,text:"MAIN TEXT",x:45,y:52,
    textSettings:{properties:{font:{size:48,family:"DejaVu Sans",weight:600},fill:{color:"#ffcc00"}},
      items:[{text:"first additional",x:48,y:130,font:{size:30}},
        {text:"second additional",x:48,y:210,font:{size:24}}],
      group:{isGrouped:true,groupTransform:{translateX:7,translateY:4,rotation:2}}}};
  const doc=validateDocument({...createBlankDocument(),width:640,height:360,
    background:{...createBlankDocument().background,mode:"gradient"},layers:[image,text]});
  const fromCode=parseSource(generateSource(doc));
  assert.deepEqual(fromCode,doc);
  const fromText=fromCode.layers[1];
  assert.equal(fromText.kind,"text");
  if(fromText.kind!=="text")throw Error("Text layer missing after roundtrip");
  assert.deepEqual(fromText.textSettings?.items?.map(x=>x.text),["first additional","second additional"]);
  const swapped=structuredClone(fromCode);
  const reorder=swapped.layers[1];
  if(reorder.kind!=="text"||!reorder.textSettings?.items)throw Error("Text runs missing");
  reorder.textSettings.items.reverse();
  assert.deepEqual(parseSource(generateSource(swapped)).layers[1],reorder);
  reorder.textSettings.items.pop();
  assert.equal((parseSource(generateSource(swapped)).layers[1] as typeof reorder).textSettings?.items?.length,1);
  const {texts,options}=textArguments(fromText);
  assert.ok(Array.isArray(texts)&&texts.length===3);
  assert.ok(options?.isGrouped && options.groupTransform?.translateX===7);
  const painter=new ApexPainter({type:"buffer"});
  const each=await Promise.all(texts.map(x=>painter.measureText(x)));
  assert.equal(each.length,3);
  assert.ok(each.every(m=>m.width>0));
  const projectRoot=resolve(process.cwd());
  const script=join(projectRoot,"text-mixed-contract-"+process.pid+".mjs");
  const tmp=await mkdtemp(join(tmpdir(),"apexify-text-mixed-"));
  try{
    await writeFile(script,generateSource(doc),"utf8");
    const result=await execFile(process.execPath,[script],{cwd:tmp,timeout:25_000,windowsHide:true});
    assert.equal(result.stderr,"");
    const png=await readFile(join(tmp,"output.png"));
    assert.equal((await sharp(png).metadata()).width,640);
    assert.equal((await sharp(png).metadata()).height,360);
    assert.ok(png.length>3000);
    const withoutText=validateDocument({...doc,layers:[image]});
    await writeFile(script,generateSource(withoutText),"utf8");
    await execFile(process.execPath,[script],{cwd:tmp,timeout:25_000,windowsHide:true});
    const imageOnly=await readFile(join(tmp,"output.png"));
    assert.notDeepEqual(png,imageOnly,"Text must alter the mixed native composition PNG");
  }finally{await rm(script,{force:true});await rm(tmp,{force:true,recursive:true});}
});
