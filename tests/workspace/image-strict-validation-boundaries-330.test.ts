import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {parseSource,generateSource} from '../../features/apex-workspace/codegen';
import {validateDocument} from '../../features/apex-workspace/model';
const base=process.env.IMG01_FIXTURE_DIR||'D:/ApexifyWorkspaceParallel/IMG01_RECOVERY_20261025/strict-browser-fixtures';
const reportPath=process.env.IMG01_VALIDATION_REPORT||'docs/workspace/IMG01_STRICT_VALIDATION_BOUNDARIES_330.json';
function leaf(doc:any,path:string){
 const bits=path.split('.');
 if(path==='options.isGrouped')return [doc.layers[0],'imageGroupId'];
 if(path==='options.groupTransform')return [doc.imageGroups[0],'transform'];
 const group=bits[0]==='options';
 let root:any=group?doc.imageGroups?.[0]?.transform:doc.layers?.[0];
 const parts=group?bits.slice(2):bits.slice(1);
 if(!group&&!['x','y','width','height','rotation','opacity','source'].includes(parts[0]))root=root?.imageOptions;
 for(let i=0;i<parts.length-1;i++){
  if(Array.isArray(root))root=Array.isArray(root[0])?root[0][0]:root[0];
  root=root?.[parts[i]];
  if(root===undefined||root===null)return null;
 }
 if(Array.isArray(root))root=Array.isArray(root[0])?root[0][0]:root[0];
 return [root,parts.at(-1)];
}
test('IMG01 all 330 exact READY paths validate source, native-required semantic types, invalid boundaries and strict omission',async()=>{
 const m=JSON.parse(await readFile(base+'/manifest.json','utf8'));
 const ledger=JSON.parse(await readFile('docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json','utf8'));
 const records=ledger.records.filter((x:any)=>x.stageAStatus==='WORKSPACE_READY');
 assert.equal(records.length,330);
 const out=[];
 for(const [i,row] of records.entries()){
  const doc=parseSource(await readFile(base+'/'+String(i).padStart(3,'0')+'.ts','utf8'));
  const record:any={id:row.id,path:row.path,seedValidated:false,leafPresent:false,invalidRejected:false,omissionValid:null,boundaryRejected:null,evidenceId:'IMG01-F-VALIDATE-'+i};
  try{
   validateDocument(doc);record.seedValidated=true;
   const at=leaf(doc,row.path);
   if(!at)throw Error('No canonical leaf parent for this variant');
   const [o,k]=at;record.original=o[k];record.leafPresent=record.original!==undefined;
   if(!record.leafPresent)throw Error('Canonical leaf not present');
   const bad=structuredClone(doc),ref=leaf(bad,row.path);if(!ref)throw Error('Cannot reach invalid target');
   const [target,key]=ref;
   const invalidValue=typeof target[key]==='string'?987654321:'__IMG01_INVALID_TYPE__';
   target[key]=invalidValue;
   try{validateDocument(bad);record.invalidError='INVALID_ACCEPTED';}catch(e){
    record.invalidRejected=true;record.invalidError=String(e instanceof Error?e.message:e).slice(0,240);
   }
   try{parseSource(generateSource(bad));record.codeInvalidRejected=false;}
   catch(e){record.codeInvalidRejected=true;record.codeInvalidError=String(e instanceof Error?e.message:e).slice(0,220)}
   assert.deepEqual(validateDocument(doc),doc,'Valid source must remain unchanged after rejected invalid Code');
   const omission=structuredClone(doc),missing=leaf(omission,row.path);
   if(missing){
    delete missing[0][missing[1]];
    try{validateDocument(omission);record.omissionValid=true;}catch(e){record.omissionValid=false;record.omissionError=String(e instanceof Error?e.message:e).slice(0,200)}
   }
   if(typeof record.original==='number'){
    const boundary=structuredClone(doc),loc=leaf(boundary,row.path);
    if(loc){
     loc[0][loc[1]]=Number.POSITIVE_INFINITY;
     try{validateDocument(boundary);record.boundaryRejected=false;}catch(e){record.boundaryRejected=true;record.boundaryError=String(e instanceof Error?e.message:e).slice(0,200)}
    }
   }
  }catch(e){record.issue=String(e instanceof Error?e.message:e).slice(0,350)}
  delete record.original;
  out.push(record);
 }
 const summary={count:out.length,sourceValid:out.filter(x=>x.seedValidated).length,leafPresent:out.filter(x=>x.leafPresent).length,
  invalidRejected:out.filter(x=>x.invalidRejected).length,invalidAccepted:out.filter(x=>x.invalidError==='INVALID_ACCEPTED').length,
  codeInvalidRejected:out.filter(x=>x.codeInvalidRejected).length,
  numericBoundariesTested:out.filter(x=>x.boundaryRejected!==null).length,numericBoundariesRejected:out.filter(x=>x.boundaryRejected===true).length,
  omissionsValidated:out.filter(x=>x.omissionValid===true).length,missingParents:out.filter(x=>x.issue).length};
 await writeFile(reportPath,JSON.stringify({pin:ledger.enginePin,summary,records:out},null,2)+'\n');
 console.log('IMG01_VALIDATION_330',JSON.stringify(summary));
 assert.equal(out.length,330);
});
