import assert from "node:assert/strict";
import test from "node:test";
import {POST} from "../../app/api/workspace/text-metrics/route";

const endpoint="http://127.0.0.1:38498/api/workspace/text-metrics";
const headers={"Content-Type":"application/json","Host":"127.0.0.1:38498"};
const validLayer={
  id:"text-stream",name:"Stream measurement",kind:"text",text:"Hello",
  x:4,y:5,width:200,height:60,rotation:0,opacity:1,visible:true,
  fontSize:24,weight:400,color:"#ffffff",
};
function request(body:BodyInit,signal?:AbortSignal):Request{
  return new Request(endpoint,{
    method:"POST",headers,body,signal,duplex:"half",
  } as RequestInit & {duplex:"half"});
}
function validRequest(){
  return request(JSON.stringify({layer:validLayer}));
}

test("bounded stream cancels before buffering an oversized body without Content-Length",async()=>{
  let produced=0;
  let canceled=false;
  const stream=new ReadableStream<Uint8Array>({
    pull(controller){produced++;controller.enqueue(new Uint8Array(20_000).fill(32));},
    cancel(){canceled=true;},
  },{highWaterMark:0});
  const response=await POST(request(stream));
  assert.equal(response.status,413);
  assert.match((await response.json()).error,/80 KB/);
  assert.equal(canceled,true,"The stream reader must actively cancel upstream");
  assert.equal(produced,5,"The reader must stop at the first over-limit chunk");
  assert.equal((await POST(validRequest())).status,200,"Oversize failure releases its slot");
});

test("two-slot cap rejects a third request and aborted readers release both slots",async()=>{
  function blocked(){
    const abort=new AbortController();
    let controller!:ReadableStreamDefaultController<Uint8Array>;
    const stream=new ReadableStream<Uint8Array>({
      start(next){controller=next;next.enqueue(new TextEncoder().encode('{"layer":'));},
    },{highWaterMark:0});
    return {
      request:request(stream,abort.signal),
      stop(){abort.abort();controller.error(new Error("Client canceled"));},
    };
  }
  const one=blocked(),two=blocked();
  const pendingOne=POST(one.request);
  const pendingTwo=POST(two.request);
  await new Promise(resolve=>setTimeout(resolve,20));
  try{
    assert.equal((await POST(validRequest())).status,429,
      "Third concurrent measurement must be rejected");
  }finally{
    one.stop();
    two.stop();
  }
  const completed=await Promise.all([pendingOne,pendingTwo]);
  assert.deepEqual(completed.map(response=>response.status),[499,499]);
  assert.equal((await POST(validRequest())).status,200,
    "Canceled requests must release both slots");
});

test("valid JSON, multi-run measurement, malformed JSON and forbidden origins",async()=>{
  const multi={...validLayer,textSettings:{items:[{text:"Second run",x:5,y:42}]}};
  const normal=await POST(request(JSON.stringify({layer:multi})));
  assert.equal(normal.status,200);
  const metrics=await normal.json();
  assert.equal(metrics.items.length,2);
  assert.ok(metrics.items[0].width>0&&metrics.items[1].width>0);
  assert.equal((await POST(request('{"layer":'))).status,400);
  const forbidden=new Request(endpoint,{
    method:"POST",
    headers:{...headers,Origin:"https://evil.example"},
    body:JSON.stringify({layer:validLayer}),
  });
  assert.equal((await POST(forbidden)).status,403);
  const fontPath=await POST(request(JSON.stringify({
    layer:{...validLayer,textSettings:{properties:{font:{path:"C:\\Windows\\system.ini"}}}},
  })));
  assert.equal(fontPath.status,400);
});
