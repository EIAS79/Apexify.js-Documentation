import test from 'node:test';
import assert from 'node:assert/strict';
import {createHeroDocument} from '../../features/apex-workspace/model';
import {time,timebase,compareTime,addTime,subtractTime,convertTime,frameTime,sourcePTS,audioSample,splitRange,splitSourcedRange,trimRange,trimSourcedRange,range,parseTimeJSON,legacySeconds,quantizeGifCentiseconds} from '../../features/apex-workspace/domain/time';
import {migrateV1,validateProject,prepareProjectImport,toV1,RECORD_SUPPORT,type Frame,type CanonicalProject} from '../../features/apex-workspace/domain/project';
import {createProjectSession,transact,undo,redo} from '../../features/apex-workspace/domain/commands';
const tb={numerator:'1',denominator:'90000'};
const zero=time('0',tb);
const one=time('90000',tb);
const exposure=frameTime('1',{numerator:'30000',denominator:'1001'});
const independent=(id:string):Frame=>({id,kind:'independent',exposure,layerIds:[],overrides:{}});
const empty=()=>migrateV1({...createHeroDocument(),layers:[]},'p:test');
const start=()=>createProjectSession(empty());
function collectionSession(){return transact(createProjectSession(migrateV1(createHeroDocument(),'p:test')),0,'Add collection',[{op:'createCollection',collection:{id:'fc:main',name:'Cells',frames:[independent('f:1')]}}]);}

test('C06 exact NTSC 30000/1001 and VFR PTS preserve provenance',()=>{
  assert.equal(compareTime(frameTime('1',{numerator:'30000',denominator:'1001'}),time('3003',tb)),0);
  const p=sourcePTS('vfr-source','-3003',{numerator:'2',denominator:'180000'});
  assert.equal(p.pts,'-3003');assert.deepEqual(p.timebase,{numerator:'2',denominator:'180000'});
  assert.equal(p.presentation.ticks,'-3003');assert.deepEqual(p.presentation.timebase,tb);
  assert.equal(compareTime(p.presentation,zero),-1);
});
test('C06 timebase invalid, negative source and max precision boundary',()=>{
  assert.throws(()=>timebase('1','0'),/positive/);
  assert.throws(()=>timebase('-1','90000'),/decimal/);
  assert.throws(()=>time('12.3',tb),/decimal/);
  assert.throws(()=>time('9'.repeat(100),tb),/limit/);
  const huge=time('9007199254740993123456',tb);
  assert.deepEqual(parseTimeJSON(JSON.parse(JSON.stringify(huge))),huge);
  assert.equal(compareTime(addTime(huge,time('-1',tb)),huge),-1);
});
test('C06 exact arithmetic, explicit rounding and signed conversion',()=>{
  const p=time('-3',{numerator:'1',denominator:'2'});
  assert.equal(convertTime(p,{numerator:'1',denominator:'1'},'floor').ticks,'-2');
  assert.equal(convertTime(p,{numerator:'1',denominator:'1'},'ceil').ticks,'-1');
  assert.equal(convertTime(p,{numerator:'1',denominator:'1'},'nearest-even').ticks,'-2');
  assert.throws(()=>convertTime(p,{numerator:'1',denominator:'1'}),/rounding required/);
  assert.equal(compareTime(subtractTime(one,one),zero),0);
  assert.equal(compareTime(addTime(audioSample('1','48000'),audioSample('1','48000')),audioSample('1','24000')),0);
});
test('C06 half-open split trim and audio subframe edit',()=>{
  const r=range(zero,one),split=splitRange(r,audioSample('1','48000'));
  assert.equal(compareTime(split.left.end,split.right.start),0);
  assert.equal(compareTime(split.right.end,one),0);
  assert.equal(compareTime(trimRange(r,split.left.end,one).start,split.left.end),0);
  assert.throws(()=>splitRange(r,zero),/strictly/);
  assert.throws(()=>range(one,zero),/start < end/);
});
test('C06 deterministic GIF quantization with zero/minimum edge policies',()=>{
  assert.deepEqual(quantizeGifCentiseconds([exposure,exposure,exposure]),['3','4','3']);
  assert.throws(()=>quantizeGifCentiseconds([time('1',{numerator:'1',denominator:'1000'})]),/minimum/);
  assert.deepEqual(quantizeGifCentiseconds([time('1',{numerator:'1',denominator:'1000'})],0),['0']);
  assert.throws(()=>quantizeGifCentiseconds([zero]),/zero\/negative/);
  assert.throws(()=>quantizeGifCentiseconds([]),/frame count/);
});
test('C06 v1 decimal migration has no hidden float seconds',()=>{
  assert.deepEqual(legacySeconds(0.1),time('1',{numerator:'1',denominator:'10'}));
  assert.deepEqual(legacySeconds(1e-7),time('1',{numerator:'1',denominator:'10000000'}));
  assert.throws(()=>legacySeconds(Infinity),/legacy seconds/);
  assert.throws(()=>parseTimeJSON({ticks:12,timebase:tb}),/invalid/);
});
test('C01 v1 Hero composition migrates and fully round-trips',()=>{
  const doc=createHeroDocument();const p=migrateV1(doc,'p:hero');
  assert.equal(p.schemaVersion,2);assert.equal(p.layers.length,doc.layers.length);
  assert.deepEqual(toV1(p),doc);assert.equal(p.revision,0);
  assert.deepEqual(validateProject(p),p);
});
test('C01 new records: vectors, styles, scenes, assets and keyframes validate',()=>{
  const p=empty();p.layers=[{id:'v:1',kind:'vector',name:'Path',visible:true,styleId:'s:1',strokes:[{id:'stroke:1',stroke:'#00ff00',width:2,commands:[{op:'M',x:0,y:0},{op:'L',x:10,y:11},{op:'Z'}]}]}];
  delete p.legacyDocument;delete p.migration;
  p.scenes=[{id:'scene:main',name:'Main scene',layerIds:['v:1']}];p.styles=[{id:'s:1',fill:'#000000',stroke:'#ffffff',opacity:1}];
  p.assets=[{id:'asset:1',kind:'image',uri:'asset:abc',metadata:{mime:'image/png'}}];
  p.keyframes=[{id:'key:1',layerId:'v:1',property:'opacity',at:zero,value:0.5,interpolation:'linear'}];
  assert.deepEqual(validateProject(p),p);
  assert.equal(RECORD_SUPPORT.graph,'UNSUPPORTED');
});
test('C01 incomplete media kinds fail closed and invalid input cannot mutate current',()=>{
  const p=empty();const bad={...p,tracks:[{id:'audio:1',kind:'audio',name:'Audio',clipIds:[]}]};
  assert.throws(()=>validateProject(bad),/audio\/video/);
  const result=prepareProjectImport(p,JSON.stringify({...p,schemaVersion:3}),'p:incoming');
  assert.equal(result.ok,false);assert.strictEqual(result.project,p);
  if(!result.ok)assert.match(result.recoverableInput,/"schemaVersion":3/);
  assert.deepEqual(prepareProjectImport(p,JSON.stringify(p),'p:incoming'),{ok:true,project:p});
});
test('C01 invalid v1 imports never overwrite valid current',()=>{
  const p=empty(),invalid={...createHeroDocument(),layers:[{...createHeroDocument().layers[0],id:'x'},{...createHeroDocument().layers[0],id:'x'}]};
  const result=prepareProjectImport(p,JSON.stringify(invalid),'p:new');assert.equal(result.ok,false);assert.strictEqual(result.project,p);
});
test('C03 frame create, duplicate, insert, reorder, exposure and delete',()=>{
  let s=collectionSession();assert.equal(s.project.frameCollections[0].frames.length,1);
  s=transact(s,s.project.revision,'Edit frames',[
    {op:'createFrame',collectionId:'fc:main',frame:independent('f:2')},
    {op:'duplicateFrame',collectionId:'fc:main',frameId:'f:1',newId:'f:3',index:1},
    {op:'reorderFrames',collectionId:'fc:main',frameIds:['f:2','f:1','f:3']},
    {op:'setExposure',collectionId:'fc:main',frameId:'f:1',exposure:audioSample('1','48000')},
    {op:'deleteFrame',collectionId:'fc:main',frameId:'f:3'}]);
  assert.deepEqual(s.project.frameCollections[0].frames.map(f=>f.id),['f:2','f:1']);
  assert.equal(compareTime(s.project.frameCollections[0].frames[1].exposure,audioSample('1','48000')),0);
});
test('C03 styles, frame-local overrides, tracks, clips, keyframes and undo/redo',()=>{
  let s=collectionSession(),rev=s.project.revision;
  s=transact(s,rev,'Create authored composition',[
    {op:'setStyle',style:{id:'style:accent',fill:'#0000ff',stroke:'#ffffff',opacity:0.75}},
    {op:'addTrack',track:{id:'track:visual',kind:'visual',name:'Visual',clipIds:[]}},
    {op:'addClip',clip:{id:'clip:1',kind:'frame-collection',trackId:'track:visual',collectionId:'fc:main',range:range(zero,one),sourceOffset:zero}},
    {op:'setKeyframe',keyframe:{id:'key:1',layerId:'title',property:'x',at:zero,value:5,interpolation:'hold'}},
    {op:'setFrameLocal',collectionId:'fc:main',frameId:'f:1',layerId:'title',styleId:'style:accent',visible:false}
  ]);
  assert.equal(s.project.revision,rev+1);assert.equal(s.project.clips.length,1);
  assert.equal(s.project.frameCollections[0].frames[0].overrides.title.styleId,'style:accent');
  const originalRevision=s.project.revision;s=undo(s,originalRevision);
  assert.equal(s.project.clips.length,0);assert.equal(s.project.styles.length,0);
  s=redo(s,s.project.revision);assert.equal(s.project.clips.length,1);assert.equal(s.project.revision,originalRevision+2);
});
test('C03 atomic rollback on invalid middle/end commands, history unaffected',()=>{
  const s=collectionSession();const original=JSON.stringify(s);
  assert.throws(()=>transact(s,s.project.revision,'Bad compound',[
    {op:'createFrame',collectionId:'fc:main',frame:independent('f:2')},
    {op:'setExposure',collectionId:'fc:main',frameId:'f:2',exposure:zero}
  ]),/duration must be positive/);
  assert.equal(JSON.stringify(s),original);
  assert.throws(()=>transact(s,s.project.revision,'Bad local',[
    {op:'setFrameLocal',collectionId:'fc:main',frameId:'f:1',layerId:'missing',visible:false}
  ]),/unknown frame-local layer/);
  assert.equal(JSON.stringify(s),original);
});
test('C03 stale revisions cannot overwrite and linked references prevent orphan',()=>{
  const s=collectionSession();assert.throws(()=>transact(s,0,'stale',[{op:'deleteFrame',collectionId:'fc:main',frameId:'f:1'}]),/stale/);
  const linked:Frame={id:'f:linked',kind:'linked',sourceFrameId:'f:1',exposure,layerIds:[],overrides:{}};
  const n=transact(s,s.project.revision,'add link',[{op:'createFrame',collectionId:'fc:main',frame:linked}]);
  assert.throws(()=>transact(n,n.project.revision,'delete source',[{op:'deleteFrame',collectionId:'fc:main',frameId:'f:1'}]),/referenced/);
  assert.equal(n.project.frameCollections[0].frames.length,2);
});

test('C06 source clip offset remains continuous under split and trim',()=>{
  const clip=range(time('-3003',tb),one),offset=audioSample('-123','48000');
  const cut=audioSample('1000','48000');
  const s=splitSourcedRange(clip,offset,cut);
  assert.equal(compareTime(s.left.range.end,s.right.range.start),0);
  assert.equal(compareTime(s.right.sourceOffset,addTime(offset,subtractTime(cut,clip.start))),0);
  const trimmed=trimSourcedRange(clip,offset,cut,one);
  assert.equal(compareTime(trimmed.sourceOffset,s.right.sourceOffset),0);
});
test('C01 import adapter rejects cyclic records without damaging last good state',()=>{
  const project=empty();const cyclic:any={schemaVersion:2};cyclic.self=cyclic;
  const result=prepareProjectImport(project,cyclic,'p:new');
  assert.equal(result.ok,false);assert.strictEqual(result.project,project);
});
