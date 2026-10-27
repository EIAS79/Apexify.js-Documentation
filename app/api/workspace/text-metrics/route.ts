import {NextResponse} from "next/server";
import {ApexPainter} from "apexify.js";
import {createBlankDocument,validateDocument} from "@/features/apex-workspace/model";
import {textArguments} from "@/features/apex-workspace/domain/text";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=15;
const MAX_BYTES=80_000;
class OversizedTextPayloadError extends Error {}

// Never allocate an unbounded request body, even with a missing or false Content-Length.
async function readBoundedBody(request:Request):Promise<Uint8Array>{
  if(!request.body)return new Uint8Array(0);
  const reader=request.body.getReader();
  const chunks:Uint8Array[]=[];
  let total=0;
  try{
    while(true){
      if(request.signal.aborted){
        await reader.cancel("Request canceled").catch(()=>{});
        throw Error("Request canceled");
      }
      const {done,value}=await reader.read();
      if(done)break;
      if(total+value.byteLength>MAX_BYTES){
        await reader.cancel("Text measurement request exceeds 80 KB").catch(()=>{});
        throw new OversizedTextPayloadError("Text measurement request exceeds 80 KB");
      }
      total+=value.byteLength;
      chunks.push(value);
    }
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return bytes;
}
let running=0;
export async function POST(request:Request){
  const origin=request.headers.get("origin");
  const site=request.headers.get("sec-fetch-site");
  const host=request.headers.get("host");
  let allowed=!origin;
  try{allowed=!origin||new URL(origin).host===host||origin===new URL(request.url).origin;}catch{allowed=false;}
  if(!allowed||site==="cross-site")return NextResponse.json({error:"Cross-origin requests are forbidden"},{status:403});
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")
    return NextResponse.json({error:"Expected JSON"},{status:415});
  if(Number(request.headers.get("content-length"))>MAX_BYTES)
    return NextResponse.json({error:"Text measurement request exceeds 80 KB"},{status:413});
  if(running>=2)return NextResponse.json({error:"Text measurement busy"},{status:429});
  running++;
  try{
    const bytes=await readBoundedBody(request);
    const input=JSON.parse(new TextDecoder().decode(bytes)) as {layer?:unknown};
    const document=validateDocument({...createBlankDocument(),layers:[input.layer]});
    const layer=document.layers[0];
    if(layer.kind!=="text")throw Error("A text layer is required");
    const {texts}=textArguments(layer);
    const runs=Array.isArray(texts)?texts:[texts];
    if(runs.reduce((total,run)=>total+run.text.length,0)>12_000)
      throw Error("Text measurement exceeds the 12,000 character aggregate limit");
    const painter=new ApexPainter({type:"buffer"});
    const items=[];
    for(const run of runs){
      if(request.signal.aborted)return new NextResponse(null,{status:499});
      items.push(await painter.measureText(run));
    }
    if(request.signal.aborted)return new NextResponse(null,{status:499});
    return NextResponse.json({metrics:items[0],items:items.length>1?items:undefined},{
      headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  }catch(e){
    if(e instanceof OversizedTextPayloadError)
      return NextResponse.json({error:e.message},{status:413});
    if(request.signal.aborted)return new NextResponse(null,{status:499});
    return NextResponse.json({error:e instanceof Error?e.message.slice(0,300):"Unable to measure text"},{status:400});
  }finally{running--;}
}
