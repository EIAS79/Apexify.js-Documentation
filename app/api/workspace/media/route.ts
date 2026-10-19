import { NextResponse } from "next/server";
import { renderWorkspaceMedia } from "@/features/apex-workspace/server/media";
import { readWorkspaceRequest } from "@/features/apex-workspace/server/http";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
let active=0;
export async function POST(request:Request){
  if(active>=1)return NextResponse.json({error:"Media encoder is busy. Retry shortly."},{status:429,headers:{"Retry-After":"2"}});
  active++;
  try{const data=await readWorkspaceRequest(request) as {document:unknown;settings:unknown;kind:string};const result=await renderWorkspaceMedia(data.document,data.settings,data.kind,AbortSignal.any([request.signal,AbortSignal.timeout(50000)]));return new NextResponse(new Uint8Array(result.buffer),{headers:{"Content-Type":result.mime,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});}catch(e){return NextResponse.json({error:e instanceof Error?e.message.slice(0,500):"Media render failed."},{status:400});}finally{active--;}
}
