/** Workspace-owned immutable media storage. No user URLs, paths, network or executables. */
import {validateDocument,type WorkspaceDocument} from './model';
import {verifyBrowserImageAssets,type WorkspaceImageAsset} from './asset-store';

export const WORKSPACE_STORAGE_KEY='apexify-workspace-document-v1';
export const WORKSPACE_BACKUP_KEY='apexify-workspace-document-v1-recovery-backup';
export const DURABLE_DB_NAME='apexify-workspace-immutable-assets-v1';
const PROJECT_KEY='active-project';
const marker={storageKind:'apexify-workspace-indexeddb',version:1,projectKey:PROJECT_KEY};
export type PersistenceMode='indexeddb'|'legacy-localstorage';
export interface DurableAssetMetadata {
  id:string;sha256:string;mime:WorkspaceImageAsset['mime'];bytes:number;width:number;height:number;
}
interface BlobRecord extends DurableAssetMetadata {blob:Blob}
interface SavedProject {id:string;version:1;revision?:number;document:Omit<WorkspaceDocument,'assets'>&{assets:DurableAssetMetadata[]}}
/** Revision is loaded once per tab. CAS in the same IndexedDB write transaction is mandatory;
 * BroadcastChannel/localStorage notifications are advisory only. */
let observedRevision:number|null=null;
export class ProjectSaveConflictError extends Error {
  constructor(readonly expected:number,readonly actual:number){
    super('Project changed in another tab (expected revision '+expected+', committed revision '+actual+'). Export unsaved edits and reload before saving.');
    this.name='ProjectSaveConflictError';
  }
}
export function getObservedProjectRevision():number|null{return observedRevision;}
function revisionOf(project:SavedProject|undefined):number{
  if(!project)return 0;
  if(project.revision===undefined)return 0; // migration from existing v1 IDB manifests
  if(!Number.isSafeInteger(project.revision)||project.revision<0)fail('corrupt project revision');
  return project.revision;
}
function fail(message:string):never {throw new Error('Durable asset store: '+message);}
function object(v:unknown):Record<string,unknown> {
  if(!v||typeof v!=='object'||Array.isArray(v))fail('invalid durable record');
  return v as Record<string,unknown>;
}
function isMarker(v:unknown):boolean {return !!v&&typeof v==='object'&&!Array.isArray(v)&&
  (v as Record<string,unknown>).storageKind===marker.storageKind;}
function assertMarker(v:unknown):void{
  const m=object(v);
  if(Object.keys(m).sort().join(',')!=='projectKey,storageKind,version'||
    m.projectKey!==PROJECT_KEY||m.storageKind!==marker.storageKind||m.version!==1)
    fail('unsupported project manifest version');
}
function request<T>(req:IDBRequest<T>):Promise<T>{
  return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error??new Error('IndexedDB request failure'));});
}
function finished(tx:IDBTransaction):Promise<void>{
  return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();
    tx.onabort=()=>reject(tx.error??new Error('IndexedDB transaction aborted'));});
}
function open():Promise<IDBDatabase>{
  if(typeof indexedDB==='undefined')return Promise.reject(new Error('IndexedDB unavailable'));
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DURABLE_DB_NAME,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('blobs'))db.createObjectStore('blobs',{keyPath:'id'});
      if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error??new Error('IndexedDB open failed'));
    req.onblocked=()=>reject(new Error('Close other Workspace tabs before storage upgrade'));
  });
}
function metadata(a:WorkspaceImageAsset):DurableAssetMetadata{
  return {id:a.id,sha256:a.sha256,mime:a.mime,bytes:a.bytes,width:a.width,height:a.height};
}
function toBlob(a:WorkspaceImageAsset):Blob{
  const data=a.dataUri.slice(a.dataUri.indexOf(',')+1);
  return new Blob([Uint8Array.from(atob(data),c=>c.charCodeAt(0))],{type:a.mime});
}
function toBase64(bytes:Uint8Array):string{
  let value='';
  for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(value);
}
function validatedMetadata(v:unknown):DurableAssetMetadata{
  const m=object(v);
  if(Object.keys(m).sort().join(',')!=='bytes,height,id,mime,sha256,width')fail('unexpected metadata keys');
  if(typeof m.sha256!=='string'||m.id!=='asset:'+m.sha256||!/^[a-f0-9]{64}$/.test(m.sha256)||
    !['image/png','image/jpeg','image/webp'].includes(String(m.mime))||
    !Number.isInteger(m.bytes)||Number(m.bytes)<1||Number(m.bytes)>2_000_000||
    !Number.isInteger(m.width)||!Number.isInteger(m.height)||
    Number(m.width)<1||Number(m.height)<1||Number(m.width)*Number(m.height)>12_000_000)
    fail('invalid asset manifest metadata');
  return m as unknown as DurableAssetMetadata;
}
async function hydrate(record:BlobRecord,meta:DurableAssetMetadata):Promise<WorkspaceImageAsset>{
  if(!(record.blob instanceof Blob)||record.blob.size!==meta.bytes||record.blob.type!==meta.mime)fail('missing or invalid immutable blob');
  for(const key of ['id','sha256','mime','bytes','width','height'] as const)
    if(record[key]!==meta[key])fail('asset metadata mismatch');
  return {...meta,dataUri:'data:'+meta.mime+';base64,'+toBase64(new Uint8Array(await record.blob.arrayBuffer()))};
}
async function prepared(doc:WorkspaceDocument){
  const valid=validateDocument(doc);
  await verifyBrowserImageAssets(valid.assets??[]);
  const assets=(valid.assets??[]).map(a=>({...metadata(a),blob:toBlob(a)}));
  const project:SavedProject={id:PROJECT_KEY,version:1,document:{...valid,assets:(valid.assets??[]).map(metadata)}};
  return {assets,project};
}
/** Immutable blobs + project manifest are committed in one IDB readwrite transaction. */
async function writeIndexedDB(doc:WorkspaceDocument,expectedRevision:number):Promise<number>{
  const {assets,project}=await prepared(doc);
  const db=await open();
  try{
    // Detect pre-existing tampered or partially restored blobs before a new manifest commit.
    // Never treat a matching ID string alone as a proof of stored byte integrity.
    const verification=db.transaction('blobs','readonly');
    const verificationDone=finished(verification);
    const stored=await Promise.all(assets.map(asset=>
      request(verification.objectStore('blobs').get(asset.id) as IDBRequest<BlobRecord|undefined>)));
    await verificationDone;
    for(let i=0;i<assets.length;i++)if(stored[i]){
      const prior=stored[i]!;
      if(!(prior.blob instanceof Blob)||prior.blob.size!==assets[i].blob.size)fail('existing immutable blob metadata mismatch');
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await prior.blob.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');
      if(digest!==assets[i].sha256)fail('existing immutable blob is corrupted: '+assets[i].id);
    }
    const tx=db.transaction(['blobs','projects'],'readwrite');
    const done=finished(tx);
    const blobStore=tx.objectStore('blobs');
    let conflict=false,staleRevision:number|undefined;
    const current=tx.objectStore('projects').get(PROJECT_KEY) as IDBRequest<SavedProject|undefined>;
    current.onsuccess=()=>{
      try{
        const actual=revisionOf(current.result);
        if(actual!==expectedRevision){
          staleRevision=actual;tx.abort();return;
        }
        // Advance atomically with the project manifest, not in the localStorage pointer.
        project.revision=actual+1;
        tx.objectStore('projects').put(project);
      }catch{tx.abort();}
    };
    for(const asset of assets){
      const lookup=blobStore.get(asset.id) as IDBRequest<BlobRecord|undefined>;
      lookup.onsuccess=()=>{
        const saved=lookup.result;
        if(saved){
          if(['id','sha256','mime','bytes','width','height'].some(key=>
              (saved as unknown as Record<string,unknown>)[key] !== (asset as unknown as Record<string,unknown>)[key])||
            !(saved.blob instanceof Blob)||saved.blob.size!==asset.blob.size){
            conflict=true;tx.abort();
          }
        }else blobStore.add(asset);
      };
    }
    try{await done;}catch(e){
      if(staleRevision!==undefined)throw new ProjectSaveConflictError(expectedRevision,staleRevision);
      if(conflict)fail('immutable blob identity conflict');
      throw e;
    }
    return expectedRevision+1;
  }finally{db.close();}
}
async function readIndexedDB():Promise<WorkspaceDocument>{
  const db=await open();
  let project:SavedProject|undefined;
  let assets:(BlobRecord|undefined)[]=[];
  try{
    const tx=db.transaction(['projects','blobs'],'readonly');
    const done=finished(tx);
    project=await request(tx.objectStore('projects').get(PROJECT_KEY) as IDBRequest<SavedProject|undefined>);
    if(!project||project.version!==1||!Array.isArray(project.document?.assets))
      fail('project manifest missing or unsupported');
    revisionOf(project);
    const records=project.document.assets.map(validatedMetadata);
    assets=await Promise.all(records.map(a=>
      request(tx.objectStore('blobs').get(a.id) as IDBRequest<BlobRecord|undefined>)));
    await done;
  }finally{db.close();}
  const records=project!.document.assets.map(validatedMetadata);
  const hydrated=await Promise.all(records.map((metadata,index)=>{
    const blob=assets[index];
    if(!blob)fail('referenced immutable image blob is missing: '+metadata.id);
    return hydrate(blob,metadata);
  }));
  const valid=validateDocument({...project!.document,assets:hydrated} as WorkspaceDocument);
  await verifyBrowserImageAssets(valid.assets??[]);
  observedRevision=revisionOf(project);
  return valid;
}
let queue=Promise.resolve();
export async function saveWorkspaceProject(doc:WorkspaceDocument):Promise<PersistenceMode>{
  const save=async():Promise<PersistenceMode>=>{
    if(typeof indexedDB==='undefined'){
      const valid=validateDocument(doc);await verifyBrowserImageAssets(valid.assets??[]);
      localStorage.setItem(WORKSPACE_STORAGE_KEY,JSON.stringify(valid));
      return 'legacy-localstorage';
    }
    if(observedRevision===null){
      // A new tab must not overwrite an existing unseen committed project.
      // Fresh installs start at revision 0; imports use readWorkspaceProject first.
      observedRevision=0;
    }
    const next=await writeIndexedDB(doc,observedRevision);
    observedRevision=next; // Commit completed even if writing pointer subsequently throws.
    localStorage.setItem(WORKSPACE_STORAGE_KEY,JSON.stringify(marker));
    return 'indexeddb';
  };
  const task=queue.then(save);
  queue=task.then(()=>{},()=>{});
  return task;
}
export async function readWorkspaceProject():Promise<{document:WorkspaceDocument;legacy:boolean}|null>{
  const raw=localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if(raw===null){
    // The IDB transaction may have completed before the localStorage pointer was
    // written. Prefer the committed manifest, never a newly created default.
    if(typeof indexedDB!=='undefined'){
      const db=await open();
      try{
        const tx=db.transaction('projects','readonly'),done=finished(tx);
        const committed=await request(tx.objectStore('projects').get(PROJECT_KEY) as IDBRequest<SavedProject|undefined>);
        await done;
        if(committed)return {document:await readIndexedDB(),legacy:false};
      }finally{db.close();}
    }
    observedRevision=0;
    return null;
  }
  const value=JSON.parse(raw) as unknown;
  if(isMarker(value)){
    assertMarker(value);
    return {document:await readIndexedDB(),legacy:false};
  }
  const document=validateDocument(value);
  await verifyBrowserImageAssets(document.assets??[]);
  // A leftover legacy inline record is not allowed to roll back a newer
  // committed IDB project after a crash between transaction and pointer swap.
  if(typeof indexedDB!=='undefined'){
    const db=await open();
    try{
      const tx=db.transaction('projects','readonly'),done=finished(tx);
      const existing=await request(tx.objectStore('projects').get(PROJECT_KEY) as IDBRequest<SavedProject|undefined>);
      await done;
      if(existing){
        const committed=await readIndexedDB(); // fully validates corrupt blobs before accepting
        // If old inline record differs, do NOT silently overwrite the committed project.
        return {document:committed,legacy:false};
      }
    }finally{db.close();}
  }
  observedRevision=0;
  return {document,legacy:true};
}
/** Garbage collection is intentionally preview-only: undo + backup references may be live. */
export async function listOrphanAssets(protectedIds:ReadonlySet<string>):Promise<string[]>{
  const db=await open();
  try{
    const tx=db.transaction(['projects','blobs'],'readonly'),done=finished(tx);
    const projects=await request(tx.objectStore('projects').getAll() as IDBRequest<SavedProject[]>);
    const refs=new Set(protectedIds);
    for(const p of projects)for(const a of p.document.assets)refs.add(a.id);
    const keys=await request(tx.objectStore('blobs').getAllKeys());
    await done;
    return keys.map(String).filter(id=>!refs.has(id)).sort();
  }finally{db.close();}
}
/** Preserves the original unvalidated manifest independently before recovery reset.
 * The immutable blob table is never deleted or modified by this operation.
 */
export async function preserveDurableRecoveryBackup():Promise<void>{
  const raw=localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if(raw===null)return;
  let markerValue:unknown;
  try{markerValue=JSON.parse(raw);}catch{localStorage.setItem(WORKSPACE_BACKUP_KEY,raw);return;}
  if(isMarker(markerValue)){
    const db=await open();
    try{
      const tx=db.transaction('projects','readwrite'),done=finished(tx);
      const store=tx.objectStore('projects');
      const req=store.get(PROJECT_KEY) as IDBRequest<SavedProject|undefined>;
      req.onsuccess=()=>{
        const previous=req.result;
        if(previous)store.add({...previous,id:'recovery-backup-'+Date.now()+'-'+crypto.randomUUID()});
      };
      await done;
    }finally{db.close();}
  }
  localStorage.setItem(WORKSPACE_BACKUP_KEY,raw);
}
/** A raw recovery bundle includes the exact original marker and best-effort
 * unvalidated project manifest/blob bytes. Never executes or decodes content.
 */
export async function exportRawRecoveryRecord():Promise<string>{
  const raw=localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if(raw===null)return '';
  let value:unknown;
  try{value=JSON.parse(raw);}catch{return raw;}
  if(!isMarker(value))return raw;
  try{
    const db=await open();
    let project:SavedProject|undefined,blobs:(BlobRecord|undefined)[]=[];
    try{
      const tx=db.transaction(['projects','blobs'],'readonly'),done=finished(tx);
      project=await request(tx.objectStore('projects').get(PROJECT_KEY) as IDBRequest<SavedProject|undefined>);
      if(project&&Array.isArray(project.document?.assets)){
        blobs=await Promise.all(project.document.assets.map(a=>
          request(tx.objectStore('blobs').get(a.id) as IDBRequest<BlobRecord|undefined>)));
      }
      await done;
    }finally{db.close();}
    const portable=project?{
      ...project.document,
      assets:await Promise.all(project.document.assets.map(async(a,i)=>{
        const result=blobs[i];
        if(!result?.blob)return {...a,missing:true};
        const bytes=new Uint8Array(await result.blob.arrayBuffer());
        return {...a,dataUri:'data:'+a.mime+';base64,'+toBase64(bytes)};
      }))
    }:null;
    return JSON.stringify({recoveryBundleVersion:1,rawStorageRecord:raw,
      savedManifest:project??null,portableDocument:portable},null,2);
  }catch(e){
    return JSON.stringify({recoveryBundleVersion:1,rawStorageRecord:raw,
      unavailableDetail:e instanceof Error?e.message:'Stored blob could not be read'},null,2);
  }
}

/** Called only after an explicit recovery import/reset AND persisted backup.
 * Adopts current durable revision for a deliberate user-approved replacement. */
export async function acceptRecoveryRevision():Promise<number>{
  if(typeof indexedDB==='undefined'){observedRevision=0;return 0;}
  const db=await open();
  try{
    const tx=db.transaction('projects','readonly'),done=finished(tx);
    const current=await request(tx.objectStore('projects').get(PROJECT_KEY) as IDBRequest<SavedProject|undefined>);
    await done;
    observedRevision=revisionOf(current);
    return observedRevision;
  }finally{db.close();}
}
