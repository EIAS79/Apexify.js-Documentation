import "server-only";
export async function readWorkspaceRequest(request:Request):Promise<unknown>{
  const origin=request.headers.get("origin"),site=request.headers.get("sec-fetch-site");
  if(site==="cross-site" || (origin && new URL(origin).host!==request.headers.get("host") && origin!==new URL(request.url).origin))throw new Error("Cross-origin requests are not allowed.");
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")throw new Error("Send application/json.");
  if(!request.body)throw new Error("Request body required.");
  const reader=request.body.getReader();let size=0;const chunks:Uint8Array[]=[];
  try{while(true){request.signal.throwIfAborted();const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>6000000){await reader.cancel();throw new Error("Request exceeds 6 MB.");}chunks.push(value);}}finally{reader.releaseLock();}
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
