import test from 'node:test';
import assert from 'node:assert/strict';
import {createHeroDocument} from '../../features/apex-workspace/model';
import {migrateV1,toV1,validateProject,resolveFrameLayers,type CanonicalProject,type Frame} from '../../features/apex-workspace/domain/project';
import {frameTime} from '../../features/apex-workspace/domain/time';
import {createProjectSession,transact,undo,redo} from '../../features/apex-workspace/domain/commands';
const exposure=frameTime('1',{numerator:'24',denominator:'1'});
function fixture(){
  return createProjectSession(migrateV1(createHeroDocument(),'p:scope'));
}
function change(layer:ReturnType<typeof resolveFrameLayers>[number],value:string){
  const result=JSON.parse(JSON.stringify(layer)) as typeof layer;
  if(result.kind!=='legacy'||result.data.kind!=='text')throw Error('expected text');
  result.data.text=value;return result;
}
function text(project:CanonicalProject,id:string){
  const layer=resolveFrameLayers(project,'fc:8',id)[0];
  if(layer.kind!=='legacy'||layer.data.kind!=='text')throw Error('text missing');
  return layer.data.text;
}
test('independent eight-frame snapshots isolate frame 3 text from other frames',()=>{
  let s=fixture();const frames:Frame[]=Array.from({length:8},(_,i)=>({id:'f:'+(i+1),kind:'independent',exposure,layerIds:['title'],overrides:{}}));
  s=transact(s,0,'eight frames',[{op:'createCollection',collection:{id:'fc:8',name:'Eight',frames}}]);
  const edited=change(resolveFrameLayers(s.project,'fc:8','f:3')[0],'Only frame 3');
  s=transact(s,s.project.revision,'edit 3',[{op:'setFrameContent',scope:'frame-local',collectionId:'fc:8',frameId:'f:3',layerId:'title',data:edited}]);
  for(let i=1;i<=8;i++)assert.equal(text(s.project,'f:'+i),i===3?'Only frame 3':'Apexify');
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(s.project))),s.project);
  const prev=s; s=undo(s,s.project.revision);assert.equal(text(s.project,'f:3'),'Apexify');
  s=redo(s,s.project.revision);assert.equal(text(s.project,'f:3'),'Only frame 3');
  assert.throws(()=>transact(s,s.project.revision,'bad',[{op:'setFrameContent',scope:'instance-override',collectionId:'fc:8',frameId:'f:3',layerId:'title',data:edited}]),/linked/);
  assert.equal(text(prev.project,'f:3'),'Only frame 3');
});
test('linked source scope and instance override preserve independent ownership',()=>{
  let s=fixture();const frame:Frame={id:'f:1',kind:'independent',exposure,layerIds:['title'],overrides:{}};
  s=transact(s,0,'collection',[{op:'createCollection',collection:{id:'fc:8',name:'Linked',frames:[frame]}}]);
  s=transact(s,s.project.revision,'linked',[{op:'duplicateLinkedFrame',collectionId:'fc:8',frameId:'f:1',newId:'f:2'}]);
  const shared=change(resolveFrameLayers(s.project,'fc:8','f:1')[0],'Source');
  s=transact(s,s.project.revision,'shared edit',[{op:'setFrameContent',scope:'linked-source',collectionId:'fc:8',frameId:'f:2',layerId:'title',data:shared}]);
  assert.equal(text(s.project,'f:1'),'Source');assert.equal(text(s.project,'f:2'),'Source');
  const local=change(shared,'Linked instance only');
  s=transact(s,s.project.revision,'local edit',[{op:'setFrameContent',scope:'instance-override',collectionId:'fc:8',frameId:'f:2',layerId:'title',data:local}]);
  assert.equal(text(s.project,'f:1'),'Source');assert.equal(text(s.project,'f:2'),'Linked instance only');
  s=transact(s,s.project.revision,'independent fork',[{op:'duplicateFrame',collectionId:'fc:8',frameId:'f:2',newId:'f:3'}]);
  assert.equal(text(s.project,'f:3'),'Linked instance only');
  assert.throws(()=>transact(s,s.project.revision,'delete source',[{op:'deleteFrame',collectionId:'fc:8',frameId:'f:1'}]),/referenced/);
  s=transact(s,s.project.revision,'remove link',[{op:'deleteFrame',collectionId:'fc:8',frameId:'f:2'}]);
  assert.equal(text(s.project,'f:3'),'Linked instance only');
});
test('v2-to-v1 rejects unrepresentable assets styles scenes timing export and unknown records',()=>{
  const original=migrateV1(createHeroDocument(),'p:lossless');
  assert.deepEqual(toV1(original),createHeroDocument());
  const variants:Array<(p:CanonicalProject)=>void>=[
    p=>p.assets.push({id:'asset:1',kind:'image',uri:'asset:abc',metadata:{}}),
    p=>p.styles.push({id:'style:1',fill:'#000000',stroke:'#ffffff',opacity:1}),
    p=>{p.scenes[0].name='Renamed scene'},
    p=>{p.sequence.fps={numerator:'24',denominator:'1'}},
    p=>{p.exportSettings.width-=1},
  ];
  for(const mutate of variants){
    const p=JSON.parse(JSON.stringify(original)) as CanonicalProject;mutate(p);
    const before=JSON.stringify(p);
    assert.throws(()=>toV1(p),/cannot be projected/);
    assert.equal(JSON.stringify(p),before);
  }
  assert.throws(()=>validateProject({...original,unknownState:{code:'non-executable'}}),/unsupported/);
});
