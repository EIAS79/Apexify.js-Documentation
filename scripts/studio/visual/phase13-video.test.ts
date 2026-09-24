import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createVisualProject } from '../../../lib/studio/visual/project';
import {
  defaultPhase13Timeline,
  phase13Timeline,
  setPhase13Timeline,
  validatePhase13Project,
} from '../../../lib/studio/visual/video-authoring-contract';
import {
  generateVisualProjectCode,
  generateVisualProjectPreviewCode,
} from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { planStudioExecution } from '../../../lib/studio/runtime/capabilities';

function projectFor(mode: 'frames'|'pipeline'|'operations'='frames') {
  const project=createVisualProject({
    id:'project_phase13',
    name:'Phase 13 Video',
    width:640,
    height:360,
    now:'2026-09-24T00:00:00.000Z',
  });
  const timeline=defaultPhase13Timeline();
  timeline.mode=mode;
  if(mode!=='frames') timeline.source={kind:'asset',assetId:'video_source_1'};
  return setPhase13Timeline(project,timeline);
}

test('Phase 13 frame authoring emits deterministic native createVideo code',()=>{
  const project=projectFor('frames');
  const first=generateVisualProjectCode(project).source;
  const second=generateVisualProjectCode(project).source;
  assert.equal(first,second);
  assert.match(first,/apexify-studio-v13:/);
  assert.match(first,/painter\.createVideo\(\{/);
  assert.match(first,/createFromFrames:/);
  assert.match(first,/frames,/);
  assert.match(first,/fps: 2/);
  assert.match(first,/format: "mp4"/);
  const execution=planStudioExecution(first);
  assert.equal(execution.backend,'full-runtime');
  assert.ok(execution.families.includes('video'));
});

test('Phase 13 pipeline codegen preserves source, trim, splice, text and audio layers',()=>{
  const project=projectFor('pipeline');
  const timeline=phase13Timeline(project)!;
  timeline.pipeline.trim={startTime:.25,endTime:3};
  timeline.pipeline.splices=[{
    id:'splice-a',targetStartTime:1,targetEndTime:1.5,
    replacement:{kind:'asset',assetId:'replacement_video_1'},
    durationPolicy:'fit',
  }];
  timeline.pipeline.text=[{
    id:'text-a',startTime:.4,endTime:2.4,text:'APEXIFY STUDIO',
    x:320,y:320,fontSize:24,color:'#f8fafc',bold:true,
  }];
  timeline.pipeline.audio=[{
    id:'audio-a',type:'asset',assetId:'audio_asset_1',startTime:.5,volume:.7,fadeIn:.1,
  },{
    id:'audio-b',type:'preset',preset:'success',startTime:1.2,gain:.4,
  }];
  const source=generateVisualProjectCode(setPhase13Timeline(project,timeline)).source;
  assert.match(source,/readFileSync\("studio:\/\/asset\/video_source_1"\)/);
  assert.match(source,/readFileSync\("studio:\/\/asset\/replacement_video_1"\)/);
  assert.match(source,/readFileSync\("studio:\/\/asset\/audio_asset_1"\)/);
  assert.match(source,/painter\.videoPipeline\(videoAsset1\)/);
  assert.match(source,/pipeline\.trim\(0\.25, 3/);
  assert.match(source,/pipeline\.splice\(/);
  assert.match(source,/replacementVideo: videoAsset2/);
  assert.match(source,/pipeline\.text\(/);
  assert.match(source,/APEXIFY STUDIO/);
  assert.match(source,/pipeline\.audio\(/);
  assert.match(source,/preset: "success"/);
  assert.match(source,/pipeline\.render\(/);
});

test('Phase 13 operation stack emits advanced createVideo operations in order',()=>{
  const project=projectFor('operations');
  const timeline=phase13Timeline(project)!;
  timeline.operations=[
    {id:'op-speed',kind:'speed',speed:1.25},
    {id:'op-effects',kind:'effects',filters:[{type:'contrast',value:1.1},{type:'blur',intensity:.2}]},
    {id:'op-crop',kind:'crop',x:0,y:0,width:480,height:270},
    {id:'op-rotate',kind:'rotate',angle:90},
    {id:'op-pip',kind:'pip',overlayAssetId:'video_overlay_1',position:'bottom-right',width:180,opacity:.9},
    {id:'op-fade',kind:'fade',fadeIn:.3,fadeOut:.3},
    {id:'op-reverse',kind:'reverse'},
    {id:'op-compress',kind:'compress',quality:'medium'},
    {id:'op-transition',kind:'transition',type:'fade',duration:.4,secondAssetId:'video_second_1'},
    {id:'op-watermark',kind:'watermark',assetId:'watermark_1',position:'top-right',opacity:.8},
    {id:'op-merge',kind:'merge',assetIds:['video_merge_1'],mode:'sequential'},
    {id:'op-split',kind:'splitScreen',assetIds:['video_split_1'],layout:'side-by-side'},
    {id:'op-replace',kind:'replaceSegment',replacementAssetId:'video_replace_1',targetStartTime:.5,targetEndTime:1.5,durationPolicy:'fit'},
    {id:'op-loop',kind:'loop',smooth:true},
    {id:'op-stabilize',kind:'stabilize',smoothing:8},
    {id:'op-timelapse',kind:'timeLapse',speed:2},
    {id:'op-mute',kind:'mute'},
    {id:'op-volume',kind:'volume',volume:.8},
    {id:'op-lut',kind:'lut',assetId:'lut_asset_1',intensity:.7},
    {id:'op-mix-audio',kind:'mixAudio',assetId:'audio_mix_1',startTime:0,volume:.7,keepOriginalAudio:true},
    {id:'op-preset',kind:'exportPreset',preset:'web'},
  ];
  const source=generateVisualProjectCode(setPhase13Timeline(project,timeline)).source;
  for(const token of [
    'changeSpeed:','applyEffects:','crop:','rotate:','pictureInPicture:','addFade:','reverse:','compress:',
    'addTransition:','addWatermark:','merge:','splitScreen:','replaceSegment:','createLoop:','stabilize:',
    'createTimeLapse:','mute:','adjustVolume:','applyLUT:','mixAudio:','exportPreset:',
  ]) {
    assert.ok(source.includes(token),token+' missing');
  }
  assert.ok(source.indexOf('changeSpeed:') < source.indexOf('applyEffects:'));
  assert.match(source,/overlayVideo: videoAsset2/);
  assert.match(source,/secondVideo: videoAsset3/);
  assert.match(source,/lutPath: "studio:\/\/asset\/lut_asset_1"/);
});

test('Phase 13 inspection tools emit metadata, frames, previews, scenes and audio artifacts',()=>{
  const project=projectFor('frames');
  const timeline=phase13Timeline(project)!;
  timeline.inspect={
    extractTimes:[0,.25],
    thumbnails:4,
    previewFrames:3,
    probe:true,
    detectScenes:true,
    sceneThreshold:.35,
    extractAudio:true,
  };
  const source=generateVisualProjectCode(setPhase13Timeline(project,timeline)).source;
  for(const token of [
    'extractMultipleFrames(','generateThumbnail:','generatePreview:','getVideoInfo(','detectScenes:','extractAudio:',
    'return [result, extractedFrames, thumbnailResult, previewFrames, videoInfo, sceneDetection, extractedAudio]',
  ]) assert.ok(source.includes(token),token+' missing');
});

test('Phase 13 canonical source round-trips exact video semantics',()=>{
  const project=projectFor('pipeline');
  const timeline=phase13Timeline(project)!;
  timeline.pipeline.trim={startTime:0,endTime:2};
  timeline.pipeline.text=[{id:'text-a',startTime:0,endTime:2,text:'HELLO',x:320,y:300,fontSize:22,color:'#fff'}];
  const normalized=setPhase13Timeline(project,timeline);
  const source=generateVisualProjectCode(normalized).source;
  const empty=createVisualProject({id:project.id,name:project.name,width:1,height:1,now:project.createdAt});
  const result=reconcileVisualProjectFromCode(empty,source);
  assert.equal(result.ok,true,result.ok?undefined:result.error);
  if(!result.ok)return;
  assert.deepEqual(phase13Timeline(result.project),phase13Timeline(normalized));
  assert.equal(result.changed,true);
});

test('Phase 13 preview uses authoritative full-runtime video routing',()=>{
  const source=generateVisualProjectPreviewCode(projectFor('frames')).source;
  assert.match(source,/apexify-studio-v13:/);
  assert.match(source,/painter\.createVideo\(/);
  assert.equal(planStudioExecution(source).backend,'full-runtime');
});

test('Phase 13 validation rejects malformed and unsafe video state without throwing',()=>{
  const malformed=createVisualProject({id:'project_bad_video',name:'Bad video',width:320,height:180,now:'2026-09-24T00:00:00.000Z'});
  malformed.timelines.push({id:'video-timeline-bad',kind:'video-authoring-timeline',name:'Broken video',value:{mode:'pipeline'}});
  assert.doesNotThrow(()=>validateVisualProject(malformed));
  assert.equal(validateVisualProject(malformed).ok,false);
  assert.ok(validateVisualProject(malformed).issues.some((issue)=>issue.code==='phase13-timeline'));

  const project=projectFor('operations');
  const timeline=phase13Timeline(project)!;
  timeline.frames.fps=999;
  timeline.frames.width=10000;
  timeline.operations=[
    {id:'same',kind:'speed',speed:0},
    {id:'same',kind:'pip',overlayAssetId:'../bad'},
  ];
  timeline.inspect.thumbnails=1000;
  const broken=setPhase13Timeline(project,timeline);
  const issues=validatePhase13Project(broken);
  for(const code of ['phase13-fps','phase13-width','phase13-id','phase13-speed','phase13-asset','phase13-thumbnails']) {
    assert.ok(issues.some((item)=>item.code===code),code+' missing');
  }
});

test('Phase 13 permanent Video rail, editor, inspector, Timeline and native player are present',()=>{
  const ui=fs.readFileSync('components/studio/visual/VisualVideoAuthoring.tsx','utf8');
  const shell=fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx','utf8');
  const modal=fs.readFileSync('components/studio/visual/VisualStudioModals.tsx','utf8');

  for(const marker of [
    'data-visual-video-context',
    'data-video-mode',
    'data-video-source-select',
    'data-video-context-player',
    'data-visual-video-inspector',
    'data-visual-video-timeline',
    'data-video-operation',
    'data-video-operation-library',
    'data-video-splice-select',
    'data-video-inspection-options',
  ]) assert.ok(ui.includes(marker),marker+' missing');

  assert.ok(shell.includes("['video', VideoCameraIcon, 'Video']"));
  assert.ok(shell.includes('<VisualVideoContext'));
  assert.ok(shell.includes('<VisualVideoInspector'));
  assert.ok(shell.includes('<VisualVideoTimeline'));
  assert.ok(shell.includes("if (id === 'video')"));
  assert.ok(shell.includes('phase13Active || phase12Active || phase11Active || phase10Active'));
  assert.ok(modal.includes('data-visual-video-player'));
  assert.ok(modal.includes("previewMime.startsWith('video/')"));
});
