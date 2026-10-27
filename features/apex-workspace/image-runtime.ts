import type { ImageProperties,GroupTransformOptions } from 'apexify.js';
import type {WorkspaceLayer,WorkspaceDocument} from './model';
import {hydrateImageOptions,sourceForEngine,type ImageEditorOptions} from './image-options';
/** Real server-side public-v6 image calls; never accepts arbitrary paths, URLs or executable source. */
export function imageArguments(layer:Extract<WorkspaceLayer,{kind:'image'|'shape'}>,document:WorkspaceDocument,bundled:Buffer):ImageProperties {
 const options=hydrateImageOptions(layer.imageOptions??{},document.assets??[],bundled) as ImageEditorOptions;
 const common={x:layer.x,y:layer.y,width:layer.width,height:layer.height,rotation:layer.rotation,opacity:layer.opacity};
 if(layer.kind==='image')return {
   source:sourceForEngine(layer.source,document.assets??[],bundled),
   ...common,fit:'cover',...options,
 } as ImageProperties;
 return {
   source:layer.shape,...common,
   shape:{fill:true,color:layer.color,...(options.shape??{})},
   borderRadius:layer.radius,
   stroke:{color:layer.strokeColor,width:layer.strokeWidth,borderRadius:layer.radius},
   ...options,
 } as ImageProperties;
}
export function groupArguments(transform:GroupTransformOptions,document:WorkspaceDocument,bundled:Buffer):GroupTransformOptions {
 return hydrateImageOptions(transform,document.assets??[],bundled) as GroupTransformOptions;
}
