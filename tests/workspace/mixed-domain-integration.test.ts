import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
import {mkdtemp,writeFile,readFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {promisify} from "node:util";
import {execFile} from "node:child_process";
import {build} from "esbuild";
import sharp from "sharp";
import {createBlankDocument,newLayer,validateDocument} from "../../features/apex-workspace/model";
import {generateSource,parseSource} from "../../features/apex-workspace/codegen";
import {projectCanvasGraph} from "../../features/apex-workspace/canvas-graph";
import {validateImageAsset} from "../../features/apex-workspace/asset-store";
const require=createRequire(import.meta.url),exec=promisify(execFile);
async function fixture(){
  const bytes=await sharp({create:{width:24,height:24,channels:4,background:{r:54,g:180,b:120,alpha:1}}}).png().toBuffer();
  const sha256=createHash("sha256").update(bytes).digest("hex");
  return validateImageAsset({id:"asset:"+sha256,sha256,mime:"image/png",bytes:bytes.length,width:24,height:24,dataUri:"data:image/png;base64,"+bytes.toString("base64")});
}
test("mixed Canvas/Image/Text model, reversible Code, Graph and native PNG parity",async()=>{
  const asset=await fixture(),doc=createBlankDocument();
  doc.width=320;doc.height=240;doc.background.mode="gradient";
  doc.canvasExtras={gradientBg:{type:"linear",endX:320,colors:[{stop:0,color:"#102037"},{stop:1,color:"#253d62"}]}};
  doc.assets=[asset];doc.imageGroups=[{id:"group:mixed",name:"Cluster",transform:{translateX:2,opacity:.9}}];
  const one=newLayer("image","one",asset.id),two=newLayer("image","two",asset.id),txt=newLayer("text","txt");
  Object.assign(one,{x:20,y:18,width:72,height:72,imageGroupId:"group:mixed",imageOptions:{fit:"contain",mask:{source:asset.id,mode:"alpha"}}});
  Object.assign(two,{x:110,y:22,width:56,height:56,imageGroupId:"group:mixed"});
  Object.assign(txt,{text:"Native + Code",x:22,y:110,width:245,height:100,fontSize:27,
    textSettings:{properties:{font:{family:"DejaVu Sans",size:27,weight:"bold"},fill:{color:"#ffffff"},includeCharMetrics:true},
    items:[{text:"extra",x:25,y:150,font:{size:18}}]}});
  doc.layers=[one,two,txt];
  const valid=validateDocument(doc),source=generateSource(valid);
  assert.deepEqual(parseSource(source),valid);
  assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(valid))),valid);
  assert.match(source,/painter\.createText\(items\.length/);
  assert.match(source,/painter\.measureText\(textProps\)/);
  assert.match(source,/isGrouped:true,groupTransform/);
  const graph=projectCanvasGraph(valid);
  assert.ok(graph.nodes.some(n=>n.id==="canvas:image-layer:one"));
  assert.ok(graph.edges.some(e=>e.id==="edge:image-layer-mask:one"));
  assert.ok(graph.edges.some(e=>e.id==="edge:image-group-member:one"));
  assert.throws(()=>parseSource(source+"\nprocess.exit(1);"),/cannot be reconciled/);
  const invalid=JSON.parse(JSON.stringify(valid));invalid.layers[0].imageOptions.mask.source="file:///etc/passwd";
  assert.throws(()=>validateDocument(invalid),/asset/);
  const temp=await mkdtemp(join(process.cwd(),"tests/workspace/.mixed-integration-"));
  try{
    const bundle=join(temp,"server.cjs");
    await build({entryPoints:["features/apex-workspace/server/render.ts"],outfile:bundle,platform:"node",format:"cjs",bundle:true,packages:"external",
      plugins:[{name:"server-only-fixture",setup(b){
        b.onResolve({filter:/^server-only$/},()=>({path:"marker",namespace:"server-marker"}));
        b.onLoad({filter:/.*/,namespace:"server-marker"},()=>({contents:""}));
      }}]});
    const direct=await require(bundle).renderWorkspaceDocument(valid);
    assert.equal((await sharp(direct).metadata()).width,320);
    const destination=join(temp,"generated.png"),script=join(temp,"generated.mjs");
    await writeFile(script,source.replace("writeFile('output.png', output)","writeFile("+JSON.stringify(destination)+", output)"));
    await exec(process.execPath,[script],{cwd:process.cwd(),timeout:30000});
    assert.deepEqual(await readFile(destination),direct);
  }finally{await rm(temp,{recursive:true,force:true});}
});
