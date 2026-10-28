import { validateDocument, type WorkspaceDocument } from "./model";

/** Canonical reversible composition; generated execution uses only public v6 methods. */
export function generateSource(document: WorkspaceDocument): string {
const preamble = [
  "import { ApexPainter } from 'apexify.js';",
  "import { writeFile } from 'node:fs/promises';",
  "import { resolve } from 'node:path';",
  "import { createHash } from 'node:crypto';",
  "",
  "// Modify composition data and Apply to synchronize Visual, Code, and Graph.",
  "const composition = "
].join('\n');
const body = `
const painter = new ApexPainter({ type: 'buffer' });
const verifyAsset = (source) => {
  const asset = (composition.assets || []).find(a => a.id === source);
  if (!asset) throw Error('Missing project asset: ' + source);
  const bytes = Buffer.from(asset.dataUri.slice(asset.dataUri.indexOf(',')+1), 'base64');
  if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw Error('Asset SHA-256 mismatch');
  return bytes;
};
const imageUri = source => {
  const asset = (composition.assets || []).find(a => a.id === source);
  if (!asset) throw Error('Missing canvas asset: ' + source);
  verifyAsset(source);
  return asset.dataUri;
};
const localSource = source => source.startsWith('/workspace/assets/')
  ? resolve('public',source.slice(1)) : source;
const imageSource = source => source.startsWith('asset:') ? verifyAsset(source)
  : source.startsWith('data:') ? Buffer.from(source.slice(source.indexOf(',')+1),'base64')
  : localSource(source);
const imagePattern = pattern => pattern?.type==='custom'
  ? {...pattern,customPatternImage:imageUri(pattern.customPatternImage)} : pattern;
const imageOptions = options => ({
  ...options,
  ...(options?.mask ? {mask:{...options.mask,source:imageSource(options.mask.source)}} : {}),
});
const imageArguments = layer => {
  const common = { x:layer.x, y:layer.y, width:layer.width, height:layer.height,
    rotation:layer.rotation,opacity:layer.opacity };
  const opt = imageOptions(layer.imageOptions || {});
  return layer.kind==='image'
    ? {source:imageSource(layer.source),...common,fit:'cover',...opt}
    : {source:layer.shape,...common,
      shape:{fill:true,color:layer.color,...(opt.shape||{})},
      borderRadius:layer.radius,
      stroke:{color:layer.strokeColor,width:layer.strokeWidth,borderRadius:layer.radius},
      ...opt};
};
const bg = composition.background;
const {gradientBg, patternBg, noiseBg, customBg, bgLayers, ...effects} = composition.canvasExtras || {};
const legacyImageOverlay=bg.mode==='image'&&!customBg&&!gradientBg&&!!(patternBg||noiseBg);
const primary = customBg ? {customBg:{...customBg,source:imageUri(customBg.source)}}
  : gradientBg ? {gradientBg}
  : legacyImageOverlay ? {customBg:{source:bg.image.startsWith('/workspace/assets/')
      ? resolve('public',bg.image.slice(1))
      : bg.image.startsWith('asset:')?imageUri(bg.image):bg.image,fit:bg.fit??'cover',...(bg.align===undefined?{}:{align:bg.align}),...(bg.opacity===undefined?{}:{opacity:bg.opacity})}}
  : bg.mode==='image' ? {transparentBase:true}
  : bg.mode==='gradient' ? {gradientBg:{type:'linear',endX:composition.width,
      colors:[{stop:0,color:bg.startColor},{stop:1,color:bg.endColor}]}}
  : bg.transparent ? {transparentBase:true} : {colorBg:bg.color};
const canvas = await painter.createCanvas({
  width:composition.width,height:composition.height,...primary,
  ...(bgLayers?{bgLayers:bgLayers.map(raw=>{const {nodeId:_authoringId,...layer}=raw;
    return layer.type==='image'||layer.type==='pattern'
      ? {...layer,source:imageUri(layer.source)}
      : layer.type==='presetPattern'&&layer.pattern.type==='custom'
      ? {...layer,pattern:imagePattern(layer.pattern)}:layer;})}:{}),
  ...(patternBg?{patternBg:imagePattern(patternBg)}:{}),
  ...(noiseBg?{noiseBg}:{}),...effects,
});
let output = canvas.buffer;
if(bg.mode==='image'&&!customBg&&!gradientBg&&!patternBg&&!noiseBg){
  output=await painter.createImage({
    source:imageSource(bg.image),x:0,y:0,width:composition.width,height:composition.height,fit:bg.fit??'cover',
    ...(bg.align===undefined?{}:{align:bg.align}),...(bg.opacity===undefined?{}:{opacity:bg.opacity}),...(bg.blur===undefined?{}:{blur:bg.blur}),
  },output);
}
const visibleLayers=composition.layers.filter(layer=>layer.visible);
for(let i=0;i<visibleLayers.length;i++){
  const layer=visibleLayers[i];
  if(layer.kind==='text'){
    const {font:fontOverride,fill:fillOverride,placement:placementOverride,...otherText}=layer.textSettings?.properties||{};
    const textProps={
      text:layer.text,x:layer.x,y:layer.y,
      font:{family:'DejaVu Sans',size:layer.fontSize,weight:layer.weight,...fontOverride},
      fill:{color:layer.color,opacity:layer.opacity,...fillOverride},
      placement:{textBaseline:'top',rotation:layer.rotation,...placementOverride},
      ...otherText,
    };
    const items=layer.textSettings?.items||[];
    if(textProps.includeCharMetrics){
      const metrics=await painter.measureText(textProps);
      console.info('Text metrics',layer.name,{width:metrics.width,height:metrics.height,lineCount:metrics.lineCount});
    }
    output=await painter.createText(items.length?[textProps,...items]:textProps,output,layer.textSettings?.group);
  }else if(layer.kind==='chart'){
    const chart=await painter.createChart(layer.chartType,
      layer.values.map((value,j)=>({value,label:layer.labels[j],color:layer.colors[j],
        ...(layer.chartType==='bar'?{xStart:j,xEnd:j+1}:{})})),
      {dimensions:{width:layer.width,height:layer.height}});
    output=await painter.createImage({source:chart,x:layer.x,y:layer.y,
      width:layer.width,height:layer.height,opacity:layer.opacity,rotation:layer.rotation},output);
  }else{
    const group=layer.imageGroupId?(composition.imageGroups||[]).find(g=>g.id===layer.imageGroupId):undefined;
    const members=[layer];
    if(group){
      while(i+1<visibleLayers.length && visibleLayers[i+1].imageGroupId===group.id &&
        (visibleLayers[i+1].kind==='image'||visibleLayers[i+1].kind==='shape')){
        members.push(visibleLayers[++i]);
      }
    }
    const images=members.map(imageArguments);
    output=group ? await painter.createImage(images,output,{
      isGrouped:true,groupTransform:imageOptions(group.transform)
    }) : await painter.createImage(images[0],output);
  }
}
await writeFile('output.png', output);
`;
return preamble + JSON.stringify(document,null,2) + ';\n\n' + body.trimStart();
}
export function parseSource(source:string):WorkspaceDocument{
  if(source.length>6_000_000)throw Error('Source is too large.');
  const start='const composition = ',end=';\n\nconst painter = ';
  const a=source.indexOf(start),b=source.indexOf(end,a);
  if(a<0||b<0)throw Error('Keep the composition declaration for Visual/Graph reconciliation.');
  const document=validateDocument(JSON.parse(source.slice(a+start.length,b)));
  if(generateSource(document)!==source)
    throw Error('Changes outside composition data cannot be reconciled with Visual. The changes are preserved in Code. Visual synchronization supports the generated program only. Download custom code to run it in your own Node environment.');
  return document;
}
