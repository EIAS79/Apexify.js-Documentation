import type { VisualProject } from './model';
import {
  hasPhase13Authoring,
  phase13Timeline,
  type Phase13AssetSource,
  type Phase13AudioTrack,
  type Phase13FrameSource,
  type Phase13Operation,
  type Phase13Timeline,
} from './video-authoring-contract';

export const PHASE13_SOURCE_MARKER = 'apexify-studio-v13:';

function semanticPayload(project: VisualProject) {
  return encodeURIComponent(JSON.stringify(project)).replace(/\*/g, '%2A');
}

function emitValue(value: unknown, indent = 0): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const body=value.map((item)=>' '.repeat(indent+2)+emitValue(item,indent+2)).join(',\n');
    return '[\n'+body+',\n'+' '.repeat(indent)+']';
  }
  if (typeof value === 'object') {
    const entries=Object.entries(value as Record<string,unknown>).filter(([,item])=>item!==undefined);
    if (!entries.length) return '{}';
    const body=entries.map(([key,item])=>' '.repeat(indent+2)+(/^[A-Za-z_$][\w$]*$/.test(key)?key:JSON.stringify(key))+': '+emitValue(item,indent+2)).join(',\n');
    return '{\n'+body+',\n'+' '.repeat(indent)+'}';
  }
  throw new Error('Unsupported Phase 13 code value: '+String(value));
}

type AssetBinding={assetId:string;variable:string};
function collectAssetIds(timeline:Phase13Timeline): string[] {
  const ids:string[]=[];
  const add=(id:string|undefined)=>{ if(id && !ids.includes(id)) ids.push(id); };
  add(timeline.source?.assetId);
  timeline.frames.items.forEach((frame)=>{ if(frame.source.kind==='asset') add(frame.source.assetId); });
  timeline.pipeline.splices.forEach((splice)=>add(splice.replacement.assetId));
  timeline.pipeline.audio.forEach((track)=>{ if(track.type==='asset') add(track.assetId); });
  timeline.operations.forEach((op)=> {
    if(op.kind==='pip') add(op.overlayAssetId);
    if(op.kind==='transition') add(op.secondAssetId);
  });
  return ids;
}
function bindings(timeline:Phase13Timeline):AssetBinding[] {
  return collectAssetIds(timeline).map((assetId,index)=>({assetId,variable:'videoAsset'+(index+1)}));
}
function variableFor(source:Phase13AssetSource,assets:readonly AssetBinding[]) {
  const binding=assets.find((item)=>item.assetId===source.assetId);
  if(!binding) throw new Error('Missing Phase 13 video asset binding for '+source.assetId+'.');
  return binding.variable;
}
function frameExpression(source:Phase13FrameSource,assets:readonly AssetBinding[],index:number,timeline:Phase13Timeline):string[] {
  if(source.kind==='asset') {
    return ['  frames.push('+variableFor(source,assets)+');'];
  }
  const label=source.label ?? 'FRAME '+String(index+1).padStart(2,'0');
  return [
    '  {',
    '    const canvas = await painter.createCanvas('+emitValue({width:timeline.frames.width,height:timeline.frames.height,colorBg:source.color},4).replace(/\n/g,'\n    ')+');',
    '    const frame = await painter.createText('+emitValue({
      text:label,x:Math.round(timeline.frames.width/2),y:Math.round(timeline.frames.height/2),
      font:{family:'Arial',size:Math.max(18,Math.round(Math.min(timeline.frames.width,timeline.frames.height)*0.1))},
      bold:true,fill:{color:'#f8fafc'},textAlign:'center',textBaseline:'middle',
    },4).replace(/\n/g,'\n    ')+', canvas);',
    '    frames.push(frame);',
    '  }',
  ];
}
function textValue(overlay:Phase13Timeline['pipeline']['text'][number]) {
  return {
    startTime:overlay.startTime,endTime:overlay.endTime,text:overlay.text,
    x:overlay.x,y:overlay.y,
    font:{family:'Arial',size:overlay.fontSize},
    bold:overlay.bold ?? false,
    fill:{color:overlay.color},
  };
}
function audioValue(track:Phase13AudioTrack,assets:readonly AssetBinding[]) {
  if(track.type==='asset') {
    const {id:_id,type:_type,assetId,...rest}=track;
    return {type:'file',source:{__assetVariable:variableFor({kind:'asset',assetId},assets)},...rest};
  }
  const {id:_id,...rest}=track;
  return rest;
}
function emitAssetAware(value:unknown,indent=0):string {
  if(value && typeof value==='object' && !Array.isArray(value) && '__assetVariable' in (value as Record<string,unknown>)) {
    return String((value as Record<string,unknown>).__assetVariable);
  }
  if(Array.isArray(value)) {
    if(!value.length) return '[]';
    return '[\n'+value.map((item)=>' '.repeat(indent+2)+emitAssetAware(item,indent+2)).join(',\n')+',\n'+' '.repeat(indent)+']';
  }
  if(value && typeof value==='object') {
    const entries=Object.entries(value as Record<string,unknown>).filter(([,item])=>item!==undefined);
    if(!entries.length) return '{}';
    return '{\n'+entries.map(([key,item])=>' '.repeat(indent+2)+(/^[A-Za-z_$][\w$]*$/.test(key)?key:JSON.stringify(key))+': '+emitAssetAware(item,indent+2)).join(',\n')+',\n'+' '.repeat(indent)+'}';
  }
  return emitValue(value,indent);
}
function operationOptions(op:Phase13Operation,outputPath:string,assets:readonly AssetBinding[]) {
  switch(op.kind) {
    case 'speed': return {changeSpeed:{speed:op.speed,outputPath}};
    case 'effects': return {applyEffects:{filters:op.filters,outputPath}};
    case 'crop': return {crop:{x:op.x,y:op.y,width:op.width,height:op.height,outputPath}};
    case 'rotate': return {rotate:{angle:op.angle,flip:op.flip,outputPath}};
    case 'compress': return {compress:{quality:op.quality,targetSize:op.targetSize,maxBitrate:op.maxBitrate,outputPath}};
    case 'fade': return {addFade:{fadeIn:op.fadeIn,fadeOut:op.fadeOut,outputPath}};
    case 'reverse': return {reverse:{outputPath}};
    case 'color': return {colorCorrect:{brightness:op.brightness,contrast:op.contrast,saturation:op.saturation,hue:op.hue,temperature:op.temperature,outputPath}};
    case 'pip': return {pictureInPicture:{overlayVideo:{__assetVariable:variableFor({kind:'asset',assetId:op.overlayAssetId},assets)},position:op.position,size:op.width||op.height?{width:op.width,height:op.height}:undefined,opacity:op.opacity,outputPath}};
    case 'freeze': return {freezeFrame:{time:op.time,duration:op.duration,outputPath}};
    case 'transition': return {addTransition:{type:op.type,duration:op.duration,direction:op.direction,secondVideo:op.secondAssetId?{__assetVariable:variableFor({kind:'asset',assetId:op.secondAssetId},assets)}:undefined,outputPath}};
    case 'removeAudio': return {removeAudio:{outputPath}};
    case 'normalizeAudio': return {normalizeAudio:{targetLevel:op.targetLevel,method:op.method,outputPath}};
    case 'exportPreset': return {exportPreset:{preset:op.preset,outputPath}};
  }
}

function resultReturnLine(timeline:Phase13Timeline): string {
  const values = ['result'];
  if (timeline.inspect.extractTimes.length) values.push('extractedFrames');
  if (timeline.inspect.thumbnails > 0) values.push('thumbnailResult');
  return values.length === 1 ? '  return result;' : '  return [' + values.join(', ') + '];';
}

function inspectionLines(timeline:Phase13Timeline,currentPath:string):string[] {
  const lines:string[]=[];
  if(timeline.inspect.extractTimes.length) {
    lines.push('  const extractedFrames = await painter.extractMultipleFrames('+currentPath+', '+emitValue(timeline.inspect.extractTimes)+', \'png\');');
  }
  if(timeline.inspect.thumbnails>0) {
    lines.push('  const thumbnailResult = await painter.createVideo({ source: '+currentPath+', generateThumbnail: '+emitValue({count:timeline.inspect.thumbnails,outputFormat:'png',quality:2})+' });');
  }
  return lines;
}

function generatedBody(timeline:Phase13Timeline):string {
  const assets=bindings(timeline);
  const lines:string[]=["import { ApexPainter } from 'apexify.js';"];
  if(assets.length) lines.push("import { readFileSync } from 'node:fs';");
  lines.push('','const painter = new ApexPainter();','','async function main() {');
  for(const binding of assets) lines.push('  const '+binding.variable+' = readFileSync('+JSON.stringify('studio://asset/'+binding.assetId)+');');
  if(assets.length) lines.push('');

  let finalPathLiteral=JSON.stringify('phase13-video.'+timeline.render.format);

  if(timeline.mode==='frames') {
    lines.push('  const frames = [];');
    timeline.frames.items.forEach((frame,index)=>lines.push(...frameExpression(frame.source,assets,index,timeline)));
    lines.push(
      '  const result = await painter.createVideo({',
      '    source: frames[0],',
      '    createFromFrames: {',
      '      frames,',
      '      outputPath: '+JSON.stringify('phase13-video.'+timeline.render.format)+',',
      '      fps: '+String(timeline.frames.fps)+',',
      '      format: '+JSON.stringify(timeline.render.format)+',',
      '      quality: '+JSON.stringify(timeline.frames.quality)+',',
      '      resolution: '+emitValue({ width: timeline.frames.width, height: timeline.frames.height, fit: 'contain' })+',',
      '    },',
      '  });',
    );
    finalPathLiteral='result.outputPath';
    lines.push(...inspectionLines(timeline,finalPathLiteral));
    lines.push(resultReturnLine(timeline));
  } else if(timeline.mode==='pipeline') {
    if(!timeline.source) throw new Error('Phase 13 pipeline mode requires a source asset.');
    const sourceVar=variableFor(timeline.source,assets);
    lines.push('  const pipeline = painter.videoPipeline('+sourceVar+');');
    if(timeline.pipeline.trim) lines.push('  pipeline.trim('+timeline.pipeline.trim.startTime+', '+timeline.pipeline.trim.endTime+', \'trim\');');
    for(const splice of timeline.pipeline.splices) {
      lines.push('  pipeline.splice('+emitAssetAware({
        targetStartTime:splice.targetStartTime,targetEndTime:splice.targetEndTime,
        replacementVideo:{__assetVariable:variableFor(splice.replacement,assets)},
        replacementStartTime:splice.replacementStartTime,replacementDuration:splice.replacementDuration,durationPolicy:splice.durationPolicy,
      },4).replace(/\n/g,'\n  ')+', '+JSON.stringify(splice.id)+');');
    }
    if(timeline.pipeline.text.length) lines.push('  pipeline.text('+emitValue(timeline.pipeline.text.map(textValue),4).replace(/\n/g,'\n  ')+', \'text\');');
    if(timeline.pipeline.audio.length) lines.push('  pipeline.audio('+emitAssetAware(timeline.pipeline.audio.map((track)=>audioValue(track,assets)),4).replace(/\n/g,'\n  ')+', '+emitValue({
      keepOriginalAudio:timeline.pipeline.keepOriginalAudio,
      originalVolume:timeline.pipeline.originalVolume,
      durationPolicy:timeline.pipeline.durationPolicy,
    })+', \'audio\');');
    lines.push('  const result = await pipeline.render({ outputPath: '+finalPathLiteral+', preset: '+JSON.stringify(timeline.render.preset)+' });');
    finalPathLiteral='result.outputPath';
    lines.push(...inspectionLines(timeline,finalPathLiteral));
    lines.push(resultReturnLine(timeline));
  } else {
    if(!timeline.source) throw new Error('Phase 13 operations mode requires a source asset.');
    lines.push('  let currentSource = '+variableFor(timeline.source,assets)+';','  let result = { outputPath: '+JSON.stringify('phase13-video.'+timeline.render.format)+' };');
    timeline.operations.forEach((op,index)=>{
      const outputPath='phase13-op-'+String(index+1)+'.'+timeline.render.format;
      lines.push('  result = await painter.createVideo('+emitAssetAware({source:{__assetVariable:'currentSource'},...operationOptions(op,outputPath,assets)},4).replace(/\n/g,'\n  ')+');');
      lines.push('  currentSource = result.outputPath;');
    });
    if(!timeline.operations.length) {
      lines.push('  result = await painter.createVideo({ source: currentSource, convert: '+emitValue({outputPath:'phase13-video.'+timeline.render.format,format:timeline.render.format,quality:'medium'})+' });');
    }
    finalPathLiteral='result.outputPath';
    lines.push(...inspectionLines(timeline,finalPathLiteral));
    lines.push(resultReturnLine(timeline));
  }
  lines.push('}','','return await main();','');
  return lines.join('\n');
}

export function phase13ProjectFromSourceMarker(source:string):VisualProject|null {
  const match=source.match(/\/\*\s*apexify-studio-v13:([^*]+)\*\//);
  if(!match?.[1]) return null;
  try { return JSON.parse(decodeURIComponent(match[1].trim())) as VisualProject; } catch { return null; }
}

export { hasPhase13Authoring };

export function generatePhase13NativeSource(project:VisualProject):string {
  const timeline=phase13Timeline(project);
  if(!timeline) throw new Error('Phase 13 code generation requires a video timeline.');
  return '/* '+PHASE13_SOURCE_MARKER+semanticPayload(project)+' */\n'+generatedBody(timeline);
}
export function generatePhase13PreviewSource(project:VisualProject):string {
  return generatePhase13NativeSource(project);
}
