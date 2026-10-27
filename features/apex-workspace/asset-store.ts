/** Portable, immutable content-addressed workspace image assets.
 * Binary bytes live once per project asset map, never in frame-local snapshots.
 * The public renderer consumes only validated asset references or bundled artwork.
 */
export interface WorkspaceImageAsset {
  id: string;
  sha256: string;
  mime: 'image/png'|'image/jpeg'|'image/webp';
  bytes: number;
  width: number;
  height: number;
  dataUri: string;
}
export const MAX_IMAGE_ASSET_BYTES = 2_000_000;
export const MAX_IMAGE_PIXELS = 12_000_000;
export const MAX_ASSET_TOTAL_BYTES = 2_000_000;
export const MAX_IMAGE_ASSETS = 8;
export const ASSET_REFERENCE = /^asset:([a-f0-9]{64})$/;
const types = ['image/png','image/jpeg','image/webp'] as const;
function fail(reason: string): never {throw new Error('workspace-asset: '+reason);}
function magic(mime: string, bytes: Uint8Array): boolean {
  if(mime==='image/png')return bytes.length>24&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;
  if(mime==='image/jpeg')return bytes.length>4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(mime==='image/webp')return bytes.length>16&&[0,1,2,3].every((i)=>bytes[i]===[82,73,70,70][i])&&[8,9,10,11].every((i)=>bytes[i]===[87,69,66,80][i-8]);
  return false;
}
function decodeDataUri(uri:string,mime:string):Uint8Array {
  const prefix='data:'+mime+';base64,';
  if(!uri.startsWith(prefix))fail('MIME and data URI do not match');
  const data=uri.slice(prefix.length);
  if(!data||data.length>Math.ceil(MAX_IMAGE_ASSET_BYTES/3)*4+8||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))
    fail('invalid or oversized base64 data');
  let text:string;
  try{text=atob(data);}catch{fail('invalid base64 encoding');}
  if(text.length>MAX_IMAGE_ASSET_BYTES||text.length<16)fail('image byte budget exceeded');
  const bytes=Uint8Array.from(text,c=>c.charCodeAt(0));
  if(!magic(mime,bytes))fail('image MIME does not match magic bytes');
  return bytes;
}
export function validateImageAsset(value:unknown):WorkspaceImageAsset {
  if(!value||typeof value!=='object'||Array.isArray(value))fail('expected record');
  const a=value as Record<string,unknown>, keys=Object.keys(a).sort();
  if(keys.join(',')!=='bytes,dataUri,height,id,mime,sha256,width')fail('unsupported asset metadata');
  if(typeof a.sha256!=='string'||!/^[0-9a-f]{64}$/.test(a.sha256)||a.id!=='asset:'+a.sha256)fail('invalid content address');
  if(!types.includes(a.mime as typeof types[number]))fail('unsupported image MIME');
  if(typeof a.width!=='number'||typeof a.height!=='number'||!Number.isInteger(a.width)||!Number.isInteger(a.height)||
    a.width<1||a.height<1||a.width>8192||a.height>8192||a.width*a.height>MAX_IMAGE_PIXELS)
    fail('invalid image dimensions');
  if(typeof a.dataUri!=='string')fail('missing immutable asset bytes');
  const raw=decodeDataUri(a.dataUri,a.mime as string);
  if(a.bytes!==raw.byteLength)fail('declared byte length mismatch');
  return {id:a.id as string,sha256:a.sha256 as string,mime:a.mime as WorkspaceImageAsset['mime'],
    bytes:raw.byteLength,width:a.width,height:a.height,dataUri:a.dataUri};
}
export function validateImageAssets(value:unknown):WorkspaceImageAsset[] {
  if(value===undefined)return [];
  if(!Array.isArray(value)||value.length>MAX_IMAGE_ASSETS)fail('asset collection budget exceeded');
  const seen=new Set<string>();let total=0;
  return value.map(input=>{
    const asset=validateImageAsset(input);if(seen.has(asset.id))fail('duplicate asset ID');
    seen.add(asset.id);total+=asset.bytes;if(total>MAX_ASSET_TOTAL_BYTES)fail('total asset bytes exceeded');
    return asset;
  });
}
export function assertSafeImageReference(source:unknown):string {
  if(typeof source!=='string'||!ASSET_REFERENCE.test(source))fail('only opaque content-addressed asset references are allowed');
  return source;
}
export function resolveImageReference(source:string,assets:readonly WorkspaceImageAsset[]):string {
  assertSafeImageReference(source);
  const match=assets.find(a=>a.id===source);
  if(!match)fail('missing referenced image asset');
  return match.dataUri;
}
/** Decode before committing a browser asset; never trust extension or a declared MIME alone. */
export async function verifyBrowserImageAssets(records:readonly WorkspaceImageAsset[]):Promise<void> {
  const checked=validateImageAssets(records);
  for(const asset of checked){
    const raw=decodeDataUri(asset.dataUri,asset.mime);
    const computed=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',Uint8Array.from(raw))),n=>n.toString(16).padStart(2,'0')).join('');
    if(computed!==asset.sha256)fail('restored asset SHA-256 mismatch');
    if(typeof createImageBitmap!=='function')fail('restored image decoder is unavailable');
    const image=new Blob([new Uint8Array(raw)],{type:asset.mime});
    const bitmap=await createImageBitmap(image);
    try{
      if(bitmap.width!==asset.width||bitmap.height!==asset.height)fail('restored asset decoded dimensions differ');
    }finally{bitmap.close();}
  }
}
export async function importImageAsset(file:File):Promise<WorkspaceImageAsset> {
  if(file.size<16||file.size>MAX_IMAGE_ASSET_BYTES||!types.includes(file.type as typeof types[number]))
    fail('select a PNG, JPEG or WebP no larger than 2 MB');
  const raw=new Uint8Array(await file.arrayBuffer());
  if(!magic(file.type,raw))fail('file magic bytes do not match declared MIME');
  if(typeof createImageBitmap!=='function')fail('this browser does not support safe image decoding');
  const bitmap=await createImageBitmap(file);
  let width:number,height:number;
  try{width=bitmap.width;height=bitmap.height;}finally{bitmap.close();}
  if(width<1||height<1||width>8192||height>8192||width*height>MAX_IMAGE_PIXELS)
    fail('decoded pixel budget exceeded');
  const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),n=>n.toString(16).padStart(2,'0')).join('');
  // Chunk to avoid browser argument-count limits.
  let data='';
  for(let i=0;i<raw.length;i+=8192)data+=String.fromCharCode(...raw.subarray(i,i+8192));
  return validateImageAsset({id:'asset:'+sha256,sha256,mime:file.type,bytes:raw.byteLength,width,height,
    dataUri:'data:'+file.type+';base64,'+btoa(data)});
}
