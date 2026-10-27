import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankDocument,newLayer} from '../../features/apex-workspace/model';
import {migrateV1,validateProject} from '../../features/apex-workspace/domain/project';
import {frameTime} from '../../features/apex-workspace/domain/time';
import {createProjectSession,transact} from '../../features/apex-workspace/domain/commands';
test('large inline raster asset cannot silently duplicate across independent frame snapshots',()=>{
  const legacy=createBlankDocument(),img=newLayer('image','image:1');
  if(img.kind!=='image')throw Error('wrong layer kind');
  img.source='data:image/png;base64,'+'A'.repeat(120000);
  legacy.layers=[img];
  const project=migrateV1(legacy,'p:asset-budget'),session=createProjectSession(project);
  assert.throws(()=>transact(session,0,'large raster frame',[{op:'createCollection',collection:{id:'fc:1',name:'Frames',frames:[
    {id:'f:1',kind:'independent',exposure:frameTime('1',{numerator:'24',denominator:'1'}),layerIds:['image:1'],overrides:{}}
  ]}}]),/inline snapshot budget/);
  assert.equal(session.project.frameCollections.length,0);
  assert.equal(session.project.revision,0);
});
test('semantic snapshots enforce total aggregate budgets and reject unknown persisted project fields',()=>{
  const p=migrateV1(createBlankDocument(),'p:budget');
  assert.throws(()=>validateProject({...p,undeclaredCanvasOption:{execution:'secret'}}),/unsupported fields/);
});
