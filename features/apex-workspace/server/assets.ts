import 'server-only';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import type { CanvasConfig } from 'apexify.js';
import type { WorkspaceDocument } from '../model';
import { resolveImageReference } from '../asset-store';
import { validateCanvasExtras } from '../canvas-options';

/** Native decode/identity checks are server-only and bounded by the render request's timeout. */
export async function verifyCanvasAssets(doc:WorkspaceDocument,signal?:AbortSignal):Promise<void> {
  let totalPixels=0;
  for(const asset of doc.assets??[]){
    if(signal?.aborted)throw new Error('Canvas asset validation canceled.');
    const input=Buffer.from(asset.dataUri.slice(asset.dataUri.indexOf(',')+1),'base64');
    if(input.byteLength!==asset.bytes)throw new Error('Canvas asset byte size mismatch.');
    if(createHash('sha256').update(input).digest('hex')!==asset.sha256)
      throw new Error('Canvas asset SHA-256 mismatch.');
    const instance=sharp(input,{limitInputPixels:12_000_000,failOn:'error'});
    const metadata=await instance.metadata();
    const name=metadata.format==='jpeg'?'image/jpeg':metadata.format==='png'?'image/png':metadata.format==='webp'?'image/webp':'unsupported';
    if(name!==asset.mime||metadata.width!==asset.width||metadata.height!==asset.height)
      throw new Error('Canvas asset decoded dimensions or format mismatch.');
    totalPixels+=asset.width*asset.height;
    if(totalPixels>16_000_000)throw new Error('Canvas asset aggregate pixel budget exceeded.');
    // Decode an actual sample, not only a header; Sharp applies strict pixel budget.
    await sharp(input,{limitInputPixels:12_000_000,failOn:'error'}).resize(1,1).png().timeout({seconds:5}).toBuffer();
    if(signal?.aborted)throw new Error('Canvas asset validation canceled.');
  }
}
export function makeAssetCanvasConfig(doc:WorkspaceDocument,bundledArtwork?:Buffer):CanvasConfig {
  const extras=validateCanvasExtras(doc.canvasExtras);
  const {gradientBg,patternBg,noiseBg,customBg,bgLayers,...effects}=extras;
  const imagePattern=(pattern:typeof patternBg)=>{
    if(!pattern||pattern.type!=='custom')return pattern;
    return {...pattern,customPatternImage:resolveImageReference(pattern.customPatternImage!,doc.assets??[])};
  };
  const bg=doc.background;
  // The pinned v6 runtime draws patternBg and noiseBg as post-layer overlays,
  // not competing primary backgrounds. Legacy image + overlay must enter
  // createCanvas as its primary image to preserve actual painter ordering.
  const legacyImageOverlay=bg.mode==='image'&&!customBg&&!gradientBg&&!!(patternBg||noiseBg);
  const legacyImage=():string=>{
    if(bg.image==='/workspace/assets/crystal-lake.webp'){
      if(!bundledArtwork?.length)throw new Error('Bundled artwork missing for overlay composition');
      // Source strings are capped at 16 KiB in pinned canvas validation.
      // Only this hardcoded trusted file path is allowed for bundled artwork.
      return resolve(process.cwd(),'public/workspace/assets/crystal-lake.webp');
    }
    return bg.image.startsWith('asset:')?resolveImageReference(bg.image,doc.assets??[]):bg.image;
  };
  const primary=customBg
    ? {customBg:{...customBg,source:resolveImageReference(customBg.source,doc.assets??[])}}
    : gradientBg ? {gradientBg} : legacyImageOverlay ? {customBg:{source:legacyImage(),fit:bg.fit??'cover',...(bg.align===undefined?{}:{align:bg.align}),...(bg.opacity===undefined?{}:{opacity:bg.opacity})}} :
      bg.mode==='image'?{transparentBase:true} :
      bg.mode==='gradient'?{gradientBg:{type:'linear' as const,endX:doc.width,
        colors:[{stop:0,color:bg.startColor},{stop:1,color:bg.endColor}]}} :
      bg.transparent?{transparentBase:true}:{colorBg:bg.color};
  const mappedLayers=bgLayers?.map(raw=>{const {nodeId:_workspaceNodeId,...layer}=raw;return layer.type==='image'||layer.type==='pattern'
    ? {...layer,source:resolveImageReference(layer.source,doc.assets??[])}
    : layer.type==='presetPattern'&&layer.pattern.type==='custom'
      ? {...layer,pattern:imagePattern(layer.pattern)}
      : layer;});
  return {width:doc.width,height:doc.height,...primary,
    ...(mappedLayers?{bgLayers:mappedLayers}:{}),
    ...(patternBg?{patternBg:imagePattern(patternBg)}:{}),
    ...(noiseBg?{noiseBg}:{}),...effects} as CanvasConfig;
}
