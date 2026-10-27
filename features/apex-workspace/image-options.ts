import type { ImageProperties, GroupTransformOptions } from 'apexify.js';
import { validateCanvasGradient, validateCanvasShadow, validateCanvasStroke, CanvasBlendModes } from './canvas-options';
import { ASSET_REFERENCE, resolveImageReference, type WorkspaceImageAsset } from './asset-store';

/** The installed v6 ImageProperties contract, restricted to JSON-safe local image authoring. */
export type ImageEditorOptions = Partial<Omit<ImageProperties, 'source' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'opacity' | 'mask'>> & {
  mask?: { source: string; mode?: 'alpha' | 'luminance' | 'inverse' };
};
export type ImageEditorGroup = { id: string; name: string; transform: GroupTransformOptions };
export const IMAGE_SHAPES = ['rectangle','square','circle','triangle','trapezium','star','heart','polygon','arc','pieSlice'] as const;
export const IMAGE_FILTERS = ['gaussianBlur','motionBlur','radialBlur','sharpen','noise','grain','edgeDetection','emboss','invert','grayscale','sepia','pixelate','brightness','contrast','saturation','hueShift','posterize'] as const;
export const IMAGE_DISTORTIONS = ['perspective','warp','bulge','pinch','twirl','wave'] as const;
export const IMAGE_FITS = ['fill','contain','cover'] as const;
export const IMAGE_ALIGNS = ['center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'] as const;
export const IMAGE_EDGES = ['transparent','clamp','wrap','mirror'] as const;
export const IMAGE_INTERPOLATIONS = ['nearest','bilinear','bicubic'] as const;
export const IMAGE_COMPOSITES = CanvasBlendModes;
export const IMAGE_FILTER_FIELDS: Record<string, readonly string[]> = {
  gaussianBlur:['intensity','radius'], motionBlur:['intensity','radius','angle'], radialBlur:['intensity','radius','centerX','centerY'],
  sharpen:['intensity'], noise:['intensity'],grain:['intensity'],edgeDetection:['intensity'],emboss:['intensity'],
  invert:[],grayscale:[],sepia:[],pixelate:['size','x','y','width','height'],
  brightness:['value'],contrast:['value'],saturation:['value'],hueShift:['value'],posterize:['levels'],
};
function object(v:unknown,label:string):Record<string,unknown> {
  if (!v || typeof v!=='object' || Array.isArray(v)) throw Error(label+' must be an object');
  return v as Record<string,unknown>;
}
function exact(v:Record<string,unknown>, keys:readonly string[],label:string):void {
  for(const key of Object.keys(v)) if(!keys.includes(key)) throw Error(label+'.'+key+' is not supported by pinned createImage');
}
function finite(v:unknown,label:string,min=-4096,max=4096):number {
  if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(label+' must be finite, '+min+' to '+max);
  return v;
}
function choice<T extends string>(v:unknown,list:readonly T[],label:string):T {
  if(typeof v!=='string'||!list.includes(v as T))throw Error(label+' has an unsupported value');
  return v as T;
}
function boolean(v:unknown,label:string):boolean{
  if(typeof v!=='boolean')throw Error(label+' must be true or false');return v;
}
function hex(v:unknown,label:string):string{
  if(typeof v!=='string'||!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(v))throw Error(label+' must be a hex color');return v;
}
function numberFields(v:Record<string,unknown>,keys:readonly string[],label:string,min=-4096,max=4096):void{
  for(const key of keys)if(v[key]!==undefined)finite(v[key],label+'.'+key,min,max);
}
function point(v:unknown,label:string):{x:number;y:number}{
  const p=object(v,label);exact(p,['x','y'],label);return {x:finite(p.x,label+'.x'),y:finite(p.y,label+'.y')};
}
function points(v:unknown,label:string,max=24):{x:number;y:number}[]{
  if(!Array.isArray(v)||v.length>max||v.length<3)throw Error(label+' needs 3–'+max+' points');
  return v.map((p,i)=>point(p,label+'['+i+']'));
}
function filter(v:unknown,i:number){
  const f=object(v,'filters['+i+']'), type=choice(f.type,IMAGE_FILTERS,'filter type');
  exact(f,['type',...IMAGE_FILTER_FIELDS[type]],'filters['+i+']');
  numberFields(f,IMAGE_FILTER_FIELDS[type],type,-2048,2048);
  if(f.radius!==undefined)finite(f.radius,'filter radius',0,2048);
  if(f.levels!==undefined)finite(f.levels,'posterize levels',2,64);
  if(f.size!==undefined)finite(f.size,'pixel size',1,256);
  return {...f,type};
}
function shape(v:unknown){
  const s=object(v,'shape');
  exact(s,['fill','color','gradient','points','radius','sides','innerRadius','outerRadius','startAngle','endAngle','centerX','centerY'],'shape');
  if(s.fill!==undefined)boolean(s.fill,'shape.fill');
  if(s.color!==undefined)hex(s.color,'shape.color');
  if(s.gradient!==undefined)s.gradient=validateCanvasGradient(s.gradient);
  numberFields(s,['radius','sides','innerRadius','outerRadius','startAngle','endAngle','centerX','centerY'],'shape');
  if(s.points!==undefined)s.points=points(s.points,'shape.points',32);
  if(s.sides!==undefined)finite(s.sides,'shape.sides',3,64);
  return s;
}
function distortion(v:unknown){
  const a=object(v,'distortion');
  exact(a,['type','points','controlPoints','intensity','centerX','centerY','radius','angle','amplitudeX','amplitudeY','wavelengthX','wavelengthY','phaseX','phaseY','interpolation','edgeMode'],'distortion');
  a.type=choice(a.type,IMAGE_DISTORTIONS,'distortion.type');
  numberFields(a,['intensity','centerX','centerY','radius','angle','amplitudeX','amplitudeY','wavelengthX','wavelengthY','phaseX','phaseY'],'distortion');
  if(a.radius!==undefined)finite(a.radius,'distortion.radius',0.1,2048);
  for(const k of ['wavelengthX','wavelengthY'])if(a[k]!==undefined)finite(a[k],k,0.01,2048);
  if(a.type==='warp'&&a.points!==undefined&&a.controlPoints!==undefined)
    throw Error('Warp accepts either quad points or control handles, not both');
  if(a.interpolation!==undefined)choice(a.interpolation,IMAGE_INTERPOLATIONS,'interpolation');
  if(a.edgeMode!==undefined)choice(a.edgeMode,IMAGE_EDGES,'edgeMode');
  if(a.points!==undefined) {
    if(!Array.isArray(a.points)||a.points.length!==4)throw Error('Distortion requires exactly four ordered corners');
    a.points=a.points.map((p,i)=>point(p,'distortion.points['+i+']'));
  }
  if(a.controlPoints!==undefined){
    if(!Array.isArray(a.controlPoints)||a.controlPoints.length>12)throw Error('Maximum 12 warp handles');
    a.controlPoints=a.controlPoints.map((raw,i)=>{
      const c=object(raw,'warp handle');exact(c,['from','to','radius','strength','falloff'],'warp handle');
      c.from=point(c.from,'from');c.to=point(c.to,'to');
      if(c.radius!==undefined)finite(c.radius,'radius',0.1,2048);
      if(c.strength!==undefined)finite(c.strength,'strength',-4,4);
      if(c.falloff!==undefined)choice(c.falloff,['linear','smooth','gaussian'],'falloff');
      return c;
    });
  }
  return a;
}
function mesh(v:unknown){
  const m=object(v,'meshWarp');
  exact(m,['gridX','gridY','controlPoints','interpolation','edgeMode'],'meshWarp');
  for(const k of ['gridX','gridY'])if(m[k]!==undefined){
    finite(m[k],k,1,8);if(!Number.isInteger(m[k]))throw Error(k+' must be integer');
  }
  if(m.interpolation!==undefined)choice(m.interpolation,IMAGE_INTERPOLATIONS,'mesh interpolation');
  if(m.edgeMode!==undefined)choice(m.edgeMode,IMAGE_EDGES,'mesh edge');
  if(m.controlPoints!==undefined){
    if(!Array.isArray(m.controlPoints)||m.controlPoints.length>9)throw Error('Too many mesh rows');
    m.controlPoints=m.controlPoints.map((row,i)=>{
      if(!Array.isArray(row)||row.length>9)throw Error('Too many mesh columns');
      return row.map((p,j)=>point(p,'mesh['+i+']['+j+']'));
    });
    const gx=(m.gridX as number|undefined)??((m.controlPoints as unknown[][])[0]?.length??0)-1;
    const gy=(m.gridY as number|undefined)??(m.controlPoints as unknown[][]).length-1;
    if(gx<1||gy<1||(m.controlPoints as unknown[][]).length!==gy+1||
      (m.controlPoints as unknown[][]).some(row=>row.length!==gx+1))throw Error('Mesh must contain (gridY+1) by (gridX+1) vertices');
  }
  return m;
}
function effects(v:unknown){
  const e=object(v,'effects');exact(e,['vignette','lensFlare','chromaticAberration','filmGrain'],'effects');
  for(const [kind,fields] of Object.entries({vignette:['intensity','size'],lensFlare:['x','y','intensity'],chromaticAberration:['intensity'],filmGrain:['intensity']})){
    if(e[kind]===undefined)continue;
    const item=object(e[kind],kind);exact(item,fields,kind);
    for(const field of fields){if(item[field]===undefined)throw Error(kind+'.'+field+' is required');finite(item[field],kind+'.'+field,field==='intensity'?0:-4096,field==='intensity'?5:4096);}
  }
  return e;
}
const COMMON = ['blur','blendMode','borderRadius','borderPosition','filters','filterIntensity','filterOrder','mask','clipPath','distortion','meshWarp','effects','shadow','stroke','boxBackground'] as const;
const LAYER = [...COMMON,'inherit','fit','align','shape'] as const;
const GROUP = [...COMMON,'rotation','translateX','translateY','scaleX','scaleY','pivotX','pivotY','opacity'] as const;
function validateOptions(v:unknown,assets:readonly WorkspaceImageAsset[],group:boolean):Record<string,unknown>{
  const a=object(v,group?'groupTransform':'imageOptions');
  exact(a,group?GROUP:LAYER,group?'groupTransform':'imageOptions');
  for(const key of ['blur','filterIntensity'])if(a[key]!==undefined)finite(a[key],key,0,50);
  if(a.blendMode!==undefined)choice(a.blendMode,IMAGE_COMPOSITES,'blendMode');
  if(a.borderRadius!==undefined&&a.borderRadius!=='circular')finite(a.borderRadius,'borderRadius',0,2048);
  if(a.borderPosition!==undefined)choice(a.borderPosition,['all','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'],'borderPosition');
  if(a.filterOrder!==undefined)choice(a.filterOrder,['pre','post'],'filterOrder');
  if(a.filters!==undefined){
    if(!Array.isArray(a.filters)||a.filters.length>8)throw Error('At most eight filters');
    a.filters=a.filters.map(filter);
  }
  if(a.mask!==undefined){
    const m=object(a.mask,'mask');exact(m,['source','mode'],'mask');
    resolveImageReference(m.source as string,assets);
    if(m.mode!==undefined)choice(m.mode,['alpha','luminance','inverse'],'mask mode');
  }
  if(a.clipPath!==undefined)a.clipPath=points(a.clipPath,'clipPath');
  if(a.distortion!==undefined)a.distortion=distortion(a.distortion);
  if(a.meshWarp!==undefined)a.meshWarp=mesh(a.meshWarp);
  if(a.effects!==undefined)a.effects=effects(a.effects);
  if(a.shape!==undefined){if(group)throw Error('Groups cannot declare shape');a.shape=shape(a.shape);}
  if(a.stroke!==undefined)a.stroke=validateCanvasStroke(a.stroke);
  if(a.shadow!==undefined)a.shadow=validateCanvasShadow(a.shadow);
  if(a.boxBackground!==undefined){
    const box=object(a.boxBackground,'boxBackground');exact(box,['color','gradient'],'boxBackground');
    if(box.color!==undefined)box.color=hex(box.color,'boxBackground.color');
    if(box.gradient!==undefined)box.gradient=validateCanvasGradient(box.gradient);
    if(box.color===undefined&&box.gradient===undefined)throw Error('boxBackground needs paint');
  }
  if(!group){
    if(a.inherit!==undefined)boolean(a.inherit,'inherit');
    if(a.fit!==undefined)choice(a.fit,IMAGE_FITS,'fit');
    if(a.align!==undefined)choice(a.align,IMAGE_ALIGNS,'align');
  }else{
    numberFields(a,['rotation','translateX','translateY','pivotX','pivotY'],'group');
    for(const k of ['scaleX','scaleY'])if(a[k]!==undefined)finite(a[k],k,-8,8);
    if(a.opacity!==undefined)finite(a.opacity,'group.opacity',0,1);
  }
  return a;
}
export function validateImageOptions(value:unknown,assets:readonly WorkspaceImageAsset[]):ImageEditorOptions{
  if(value===undefined)return {};
  return validateOptions(structuredClone(value),assets,false) as ImageEditorOptions;
}
export function validateImageGroups(value:unknown,assets:readonly WorkspaceImageAsset[]):ImageEditorGroup[]{
  if(value===undefined)return [];
  if(!Array.isArray(value)||value.length>12)throw Error('Maximum 12 groups');
  const ids=new Set<string>();
  return value.map(raw=>{
    const g=object(raw,'image group');exact(g,['id','name','transform'],'image group');
    if(typeof g.id!=='string'||!/^group:[a-z0-9-]{1,72}$/i.test(g.id)||ids.has(g.id))throw Error('Invalid or duplicate group ID');
    ids.add(g.id);
    if(typeof g.name!=='string'||g.name.length>100)throw Error('Group name must be under 100 characters');
    return {id:g.id,name:g.name,transform:validateOptions(structuredClone(g.transform),assets,true) as GroupTransformOptions};
  });
}
export function sourceForEngine(source:string,assets:readonly WorkspaceImageAsset[],bundled:Buffer):Buffer{
  if(source==='/workspace/assets/crystal-lake.webp')return bundled;
  // Compatibility with existing Workspace v1 projects. New editor uploads use SHA-256 refs.
  if(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(source) && source.length<=2_700_000) {
    const decoded=Buffer.from(source.split(',')[1],'base64');
    if(decoded.byteLength>2_000_000||decoded.byteLength<24)throw Error('Legacy image byte budget exceeded');
    const png=decoded[0]===137&&decoded[1]===80&&decoded[2]===78;
    const jpg=decoded[0]===255&&decoded[1]===216&&decoded[2]===255;
    const webp=decoded.toString('ascii',0,4)==='RIFF'&&decoded.toString('ascii',8,12)==='WEBP';
    if(!(png||jpg||webp))throw Error('Unsupported legacy image content');
    return decoded;
  }
  if(!ASSET_REFERENCE.test(source))throw Error('Only verified image assets or bundled artwork are executable');
  return Buffer.from(resolveImageReference(source,assets).split(',')[1],'base64');
}
export function hydrateImageOptions(options:ImageEditorOptions|GroupTransformOptions,assets:readonly WorkspaceImageAsset[],bundled:Buffer){
  const source=(options as ImageEditorOptions).mask?.source;
  return {...options,...(source?{mask:{...(options as ImageEditorOptions).mask,source:sourceForEngine(source,assets,bundled)}}:{})};
}
