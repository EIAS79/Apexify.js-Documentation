/* Real running Next.js Node handler integration smoke for Workspace text and PNG. */
import assert from "node:assert/strict";

const root=process.env.TEXT_WORKSPACE_ORIGIN??"http://127.0.0.1:38498";
const layer={
  id:"smoke-text",name:"Measured string",kind:"text",text:"Hello, مرحبا, 你好",
  x:20,y:30,width:400,height:120,rotation:0,opacity:1,visible:true,
  fontSize:32,weight:400,color:"#ffffff",
  textSettings:{properties:{
    font:{family:"DejaVu Sans",style:"italic"},
    fill:{color:"rebeccapurple"},layout:{letterSpacing:1.25},includeCharMetrics:true
  },items:[{text:"Second run Świat",x:30,y:105,font:{size:22,family:"DejaVu Sans"},fill:{color:"#00ffcc"}}]},
};
const metrics=await fetch(root+"/api/workspace/text-metrics",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({layer}),
});
assert.equal(metrics.status,200,"Native per-run measurement route must succeed");
const result=await metrics.json();
assert.ok(result.metrics.width>0);
assert.equal(result.items?.length,2);
assert.ok(result.items[1].width>0);
console.log("API_NATIVE_METRICS_PASS",result.items.map(x=>x.width.toFixed(2)).join(","));
const invalid=await fetch(root+"/api/workspace/text-metrics",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    layer:{...layer,textSettings:{properties:{font:{path:"C:\\Windows\\system.ini"}}}},
  }),
});
assert.equal(invalid.status,400);
const rejected=await invalid.json();assert.match(rejected.error,/not supported/);
console.log("API_FONT_PATH_REJECTED");
const forbidden=await fetch(root+"/api/workspace/text-metrics",{
  method:"POST",headers:{"Content-Type":"application/json","Origin":"https://evil.example"},
  body:JSON.stringify({layer}),
});
assert.equal(forbidden.status,403);
console.log("API_CROSS_ORIGIN_REJECTED");

// An HTTP streamed request has no Content-Length; enforce the limit as bytes arrive.
const oversizedWithoutLength=await fetch(root+"/api/workspace/text-metrics",{
  method:"POST",headers:{"Content-Type":"application/json"},duplex:"half",
  body:new ReadableStream({
    pull(controller){
      controller.enqueue(new Uint8Array(25_000).fill(32));
      this.count=(this.count??0)+1;
      if(this.count===5)controller.close();
    },
  }),
});
assert.equal(oversizedWithoutLength.status,413,
  "A chunked, oversized body without Content-Length must receive HTTP 413");
assert.match((await oversizedWithoutLength.json()).error,/80 KB/);
console.log("API_CHUNKED_WITHOUT_CONTENT_LENGTH_413_PASS");

const invalidJson=await fetch(root+"/api/workspace/text-metrics",{
  method:"POST",headers:{"Content-Type":"application/json"},body:'{"layer":',
});
assert.equal(invalidJson.status,400,"Invalid JSON remains HTTP 400");
console.log("API_INVALID_JSON_400_PASS");

const characterLimit=await fetch(root+"/api/workspace/text-metrics",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({layer:{...layer,text:"x".repeat(12_001),textSettings:undefined}}),
});
assert.equal(characterLimit.status,400,"12,000 aggregate character limit is preserved");
console.log("API_CHARACTER_LIMIT_400_PASS");

const siteRejected=await fetch(root+"/api/workspace/text-metrics",{
  method:"POST",headers:{"Content-Type":"application/json","Sec-Fetch-Site":"cross-site"},
  body:JSON.stringify({layer}),
});
assert.equal(siteRejected.status,403,"Fetch metadata cross-site policy is preserved");
console.log("API_FETCH_SITE_403_PASS");

const afterFailures=await fetch(root+"/api/workspace/text-metrics",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({layer}),
});
assert.equal(afterFailures.status,200,"Oversized and invalid requests must release capacity");
console.log("API_FAILURES_RELEASE_SLOTS_PASS");

const doc={schemaVersion:1,name:"Rendered typography",width:640,height:360,
  background:{mode:"color",color:"#141c2c",startColor:"#000000",endColor:"#ffffff",
    image:"/workspace/assets/crystal-lake.webp",transparent:false},layers:[layer]};
const render=await fetch(root+"/api/workspace/render",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(doc),
});
assert.equal(render.status,200,"Real native full-workspace PNG export");
assert.match(render.headers.get("content-type"),/image\/png/);
const binary=Buffer.from(await render.arrayBuffer());
assert.deepEqual([...binary.subarray(0,8)],[137,80,78,71,13,10,26,10]);
console.log("API_RENDER_EXPORT_PNG_PASS",binary.length);
