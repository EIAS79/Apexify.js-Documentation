/** Minimize the hydrated wire payload for one bounded Node render request.
 * The saved project/undo history retains its full immutable asset manifest.
 * No object URLs, external media URLs or filesystem paths may be inserted.
 */
import type {WorkspaceDocument} from './model';
import {ASSET_REFERENCE} from './asset-store';
export function selectRenderAssets(document:WorkspaceDocument):WorkspaceDocument {
  const used=new Set<string>();
  const reference=(source:unknown)=>{
    if(typeof source!=='string'||!ASSET_REFERENCE.test(source))return;
    used.add(source);
  };
  const extras=document.canvasExtras;
  reference(extras?.customBg?.source);
  if(extras?.patternBg?.type==='custom')reference(extras.patternBg.customPatternImage);
  for(const layer of extras?.bgLayers??[]){
    if(layer.type==='image'||layer.type==='pattern')reference(layer.source);
    else if(layer.type==='presetPattern'&&layer.pattern.type==='custom')
      reference(layer.pattern.customPatternImage);
  }
  if(document.background.mode==='image')reference(document.background.image);
  for(const layer of document.layers){
    if(layer.kind==='image')reference(layer.source);
  }
  const assets=(document.assets??[]).filter(asset=>used.has(asset.id));
  for(const id of used)if(!assets.some(a=>a.id===id))
    throw new Error('Render asset dependency is missing: '+id);
  return {...document,assets};
}
