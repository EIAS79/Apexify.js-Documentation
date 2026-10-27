/** Portable, whitelisted subset of the pinned public CanvasConfig; no native inputs or executable callbacks. */
export const CanvasBlendModes=[
  'source-over','source-in','source-out','source-atop',
  'destination-over','destination-in','destination-out','destination-atop',
  'lighter','copy','xor','multiply','screen','overlay','darken','lighten',
  'color-dodge','color-burn','hard-light','soft-light','difference','exclusion',
  'hue','saturation','color','luminosity'
] as const;
export type CanvasBlendMode=typeof CanvasBlendModes[number];
export type GradientKind='linear'|'radial'|'conic';
export type GradientStop={stop:number;color:string};
export interface CanvasGradient {
  type:GradientKind;colors:GradientStop[];
  startX?:number;startY?:number;endX?:number;endY?:number;
  startRadius?:number;endRadius?:number;centerX?:number;centerY?:number;startAngle?:number;
  rotate?:number;pivotX?:number;pivotY?:number;repeat?:'repeat'|'reflect'|'no-repeat';
}
export type CanvasImageFit='fill'|'contain'|'cover';
export const CanvasImageAlignModes=['center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'] as const;
export type CanvasImageAlign=typeof CanvasImageAlignModes[number];
export interface CanvasCustomBg {
  source:string;inherit?:boolean;fit?:CanvasImageFit;align?:CanvasImageAlign;opacity?:number;
  filters?:CanvasImageFilter[];
}
/** PatternOptions.gradient is GradientConfig, NOT CanvasConfig.gradient; angle/centers use its own runtime contract. */
export interface PatternGradient {
  type:GradientKind;colors:GradientStop[];
  startX?:number;startY?:number;endX?:number;endY?:number;
  startRadius?:number;endRadius?:number;centerX?:number;centerY?:number;startAngle?:number;
  angle?:number;repeat?:'repeat'|'reflect'|'no-repeat';
}
export interface CanvasPattern {
  type:'grid'|'dots'|'diagonal'|'stripes'|'waves'|'crosses'|'hexagons'|'checkerboard'|'diamonds'|'triangles'|'stars'|'polka'|'custom';
  color?:string;secondaryColor?:string;size?:number;spacing?:number;opacity?:number;rotation?:number;
  repeat?:'repeat'|'repeat-x'|'repeat-y'|'no-repeat';scale?:number;offsetX?:number;offsetY?:number;
  blendMode?:CanvasBlendMode;customPatternImage?:string;gradient?:PatternGradient;
}
export type CanvasLayer = (
  |{type:'color';value:string;opacity?:number;blendMode?:CanvasBlendMode}
  |{type:'gradient';value:CanvasGradient;opacity?:number;blendMode?:CanvasBlendMode}
  |{type:'noise';intensity?:number;blendMode?:CanvasBlendMode}
  |{type:'presetPattern';pattern:CanvasPattern;opacity?:number;blendMode?:CanvasBlendMode}
  |{type:'image';source:string;opacity?:number;fit?:CanvasImageFit;align?:CanvasImageAlign;blendMode?:CanvasBlendMode}
  |{type:'pattern';source:string;repeat?:'repeat'|'repeat-x'|'repeat-y'|'no-repeat';opacity?:number;blendMode?:CanvasBlendMode}) & {nodeId?:string};
export type CanvasBorderSide='all'|'top'|'bottom'|'left'|'right'|'top-left'|'top-right'|'bottom-left'|'bottom-right';
export interface CanvasStroke {
  color?:string;gradient?:CanvasGradient;width?:number;position?:number;
  blur?:number;opacity?:number;borderRadius?:number|'circular';
  borderPosition?:CanvasBorderSide;roundedCorners?:CanvasBorderSide;
  style?:'solid'|'dashed'|'dotted'|'groove'|'ridge'|'double';
}
export interface CanvasShadow {
  color?:string;gradient?:CanvasGradient;offsetX?:number;offsetY?:number;
  blur?:number;opacity?:number;borderRadius?:number|'circular';
  roundedCorners?:CanvasBorderSide;borderPosition?:CanvasBorderSide;
}
export interface CanvasExtras {
  x?:number;y?:number;customBg?:CanvasCustomBg;
  gradientBg?:CanvasGradient;patternBg?:CanvasPattern;noiseBg?:{intensity?:number};
  bgLayers?:CanvasLayer[];
  blendMode?:CanvasBlendMode;opacity?:number;blur?:number;rotation?:number;
  borderRadius?:number|'circular';borderPosition?:CanvasBorderSide;
  zoom?:{scale?:number;centerX?:number;centerY?:number};
  stroke?:CanvasStroke;
  shadow?:CanvasShadow;
}
const fail=(s:string):never=>{throw Error('canvas-options: '+s)};

function object(v:unknown,label:string):Record<string,unknown>{
  if(!v||typeof v!=='object'||Array.isArray(v))fail(label+' must be an object');
  return v as Record<string,unknown>;
}
function keys(v:Record<string,unknown>,allowed:string[]):void{
  const unexpected=Object.keys(v).filter(k=>!allowed.includes(k));
  if(unexpected.length)fail('unsupported keys: '+unexpected.join(', '));
}
function numeric(v:unknown,label:string,min:number,max:number):number{
  if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail(label+' outside supported range');
  return v as number;
}
function color(v:unknown):string{
  if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(v))fail('invalid color');
  return v as string;
}
function choice<T extends string>(v:unknown,values:readonly T[],label:string):T{
  if(typeof v!=='string'||!values.includes(v as T))fail('unsupported '+label);
  return v as T;
}
function selected<T>(v:unknown,parse:(x:unknown)=>T):T|undefined{return v===undefined?undefined:parse(v);}
function numbers(v:Record<string,unknown>,fields:Record<string,[number,number]>) {
  const result:Record<string,number>={};
  for(const [k,[min,max]] of Object.entries(fields))
    if(v[k]!==undefined)result[k]=numeric(v[k],k,min,max);
  return result;
}
export const CanvasFilterTypes=[
 'gaussianBlur','motionBlur','radialBlur','sharpen','noise','grain','edgeDetection','emboss',
 'invert','grayscale','sepia','pixelate','brightness','contrast','saturation','hueShift','posterize'
] as const;
export type CanvasFilterType=typeof CanvasFilterTypes[number];
export type CanvasImageFilter={type:CanvasFilterType;intensity?:number;radius?:number;angle?:number;
  centerX?:number;centerY?:number;value?:number;levels?:number;size?:number;
  x?:number;y?:number;width?:number;height?:number};
/** Deliberately tighter than engine defaults: avoid costly native filters in untrusted editing. */
export const CanvasFilterFields:Record<CanvasFilterType,Record<string,readonly [number,number]>>={
 gaussianBlur:{intensity:[0.1,12],radius:[0.3,12]},motionBlur:{intensity:[1,13],angle:[-360,360]},
 radialBlur:{intensity:[1,16],centerX:[0,1024],centerY:[0,1024]},
 sharpen:{intensity:[0.1,8]},noise:{intensity:[0.01,0.5]},grain:{intensity:[0.01,0.5]},
 edgeDetection:{intensity:[0.1,3]},emboss:{intensity:[0.1,3]},
 invert:{},grayscale:{},sepia:{},
 pixelate:{size:[2,64],x:[0,1023],y:[0,1023],width:[1,1024],height:[1,1024]},
 brightness:{value:[-100,100]},contrast:{value:[-100,100]},saturation:{value:[-100,100]},
 hueShift:{value:[-360,360]},posterize:{levels:[2,32]}
};
export const CanvasFilterDefaults:Record<CanvasFilterType,CanvasImageFilter>={
 gaussianBlur:{type:'gaussianBlur',intensity:2},motionBlur:{type:'motionBlur',intensity:5,angle:0},
 radialBlur:{type:'radialBlur',intensity:5},sharpen:{type:'sharpen',intensity:2},
 noise:{type:'noise',intensity:0.2},grain:{type:'grain',intensity:0.2},
 edgeDetection:{type:'edgeDetection',intensity:1},emboss:{type:'emboss',intensity:1},
 invert:{type:'invert'},grayscale:{type:'grayscale'},sepia:{type:'sepia'},
 pixelate:{type:'pixelate',size:5},brightness:{type:'brightness',value:35},
 contrast:{type:'contrast',value:35},saturation:{type:'saturation',value:35},
 hueShift:{type:'hueShift',value:80},posterize:{type:'posterize',levels:5}
};
export function validateCanvasImageFilters(v:unknown,width?:number,height?:number):CanvasImageFilter[]{
 if(!Array.isArray(v)||v.length>3)fail('image filters limited to 3 bounded native operations');
 return (v as unknown[]).map((raw:unknown,i:number)=>{
  const f=object(raw,'filter '+i),type=choice(f.type,CanvasFilterTypes,'filter type');
  const ranges=CanvasFilterFields[type],allowed=['type',...Object.keys(ranges)];
  keys(f,allowed);
  if(type==='gaussianBlur'&&f.radius!==undefined&&f.intensity!==undefined)
    fail('gaussianBlur radius and intensity are mutually exclusive');
  const out:CanvasImageFilter={type};
  for(const [field,[min,max]] of Object.entries(ranges)){
   if(f[field]===undefined)continue;
   const val=numeric(f[field],'filter '+type+' '+field,min,max);
   if(['size','levels','x','y','width','height'].includes(field)&&!Number.isInteger(val))
     fail('image filter '+field+' must be an integer');
   (out as unknown as Record<string,unknown>)[field]=val;
  }
  if(type==='radialBlur'&&width!==undefined&&height!==undefined){
   if((out.centerX??width/2)>width||(out.centerY??height/2)>height)
     fail('radial filter center exceeds canvas dimensions');
  }
  if(type==='pixelate'&&width!==undefined&&height!==undefined){
   const x=out.x??0,y=out.y??0;
   if((out.size??1)>Math.max(width,height)||x>=width||y>=height||
      x+(out.width??width-x)>width||y+(out.height??height-y)>height)
     fail('pixelate region exceeds canvas dimensions');
  }
  return out;
 });
}

export function validateCanvasGradient(value:unknown):CanvasGradient {
  const g=object(value,'gradient'),type=choice(g.type,['linear','radial','conic'] as const,'gradient type');
  const dimensions=type==='conic'
    ?['centerX','centerY','startAngle','rotate','pivotX','pivotY']
    :type==='radial'
    ?['startX','startY','endX','endY','startRadius','endRadius','rotate','pivotX','pivotY']
    :['startX','startY','endX','endY','rotate','pivotX','pivotY'];
  keys(g,['type','colors',...dimensions,...(type==='conic'?[]:['repeat'])]);
  const rawColors=g.colors;
  if(!Array.isArray(rawColors)||rawColors.length<2||rawColors.length>12)fail('gradient needs 2-12 stops');
  const colors=(rawColors as unknown[]).map(v=>{
    const s=object(v,'gradient stop');keys(s,['stop','color']);
    return {stop:numeric(s.stop,'gradient stop',0,1),color:color(s.color)};
  });
  for(let i=1;i<colors.length;i++)if(colors[i].stop<colors[i-1].stop)fail('gradient stops must be ordered');
  const gfields=Object.fromEntries(dimensions.map(x=>[x,x.endsWith('Radius')?[0,4096]:[-8192,8192]])) as Record<string,[number,number]>;
  const result={type,colors,...numbers(g,gfields)} as CanvasGradient;
  // The pinned raster backend rejects identical linear endpoints and identical
  // radial circles. Detect these before an edit can commit to durable project state.
  if(type==='linear'){
    const sx=result.startX??0, sy=result.startY??0;
    if(result.endX!==undefined&&sx===result.endX&&sy===(result.endY??0))
      fail('linear gradient start/end geometry is degenerate');
  }
  if(type==='radial'){
    const samePosition=
      (result.startX===undefined&&result.endX===undefined||
        result.startX!==undefined&&result.endX!==undefined&&result.startX===result.endX) &&
      (result.startY===undefined&&result.endY===undefined||
        result.startY!==undefined&&result.endY!==undefined&&result.startY===result.endY);
    if(samePosition&&result.endRadius!==undefined&&
      (result.startRadius??0)===result.endRadius)fail('radial gradient start/end circles are degenerate');
  }
  if(type!=='conic'&&g.repeat!==undefined)result.repeat=choice(g.repeat,['repeat','reflect','no-repeat'] as const,'gradient repeat');
  return result;
}
export function validatePatternGradient(value:unknown):PatternGradient {
  const g=object(value,'pattern gradient');
  const type=choice(g.type,['linear','radial','conic'] as const,'pattern gradient type');
  const geometry=type==='linear'?['startX','startY','endX','endY','angle']
    :type==='radial'?['startX','startY','endX','endY','startRadius','endRadius','angle']
    :['centerX','centerY','startAngle','angle'];
  keys(g,['type','colors',...geometry,...(type==='conic'?[]:['repeat'])]);
  const rawColors=g.colors;
  if(!Array.isArray(rawColors)||rawColors.length<2||rawColors.length>12)fail('pattern gradient needs 2-12 stops');
  const colors=(rawColors as unknown[]).map((raw:unknown)=>{
    const x=object(raw,'pattern gradient stop');keys(x,['stop','color']);
    return {stop:numeric(x.stop,'pattern gradient stop',0,1),color:color(x.color)};
  });
  for(let i=1;i<colors.length;i++)if(colors[i].stop<colors[i-1].stop)fail('pattern gradient stops must be ordered');
  return {type,colors,...numbers(g,Object.fromEntries(geometry.map(key=>[key,key.endsWith('Radius')?[0,4096]:[-8192,8192]])) as Record<string,[number,number]>),
    ...(g.repeat===undefined?{}:{repeat:choice(g.repeat,['repeat','reflect','no-repeat'] as const,'pattern gradient repeat')})};
}
export function validateCanvasPattern(value:unknown):CanvasPattern {
  const p=object(value,'pattern');
  keys(p,['type','color','secondaryColor','size','spacing','opacity','rotation','repeat','scale','offsetX','offsetY','blendMode','customPatternImage','gradient']);
  if(p.gradient!==undefined&&(p.color!==undefined||p.secondaryColor!==undefined))fail('pattern gradient paint and solid colors are mutually exclusive');
  const type=choice(p.type,['grid','dots','diagonal','stripes','waves','crosses','hexagons','checkerboard','diamonds','triangles','stars','polka','custom'] as const,'pattern');
  if(type==='custom'&&p.customPatternImage===undefined)fail('custom pattern requires a verified image asset');
  if(type==='custom'&&p.gradient!==undefined)fail('custom pattern gradient paint is unsupported with image sources');
  if(type!=='custom'&&p.customPatternImage!==undefined)fail('custom image source is exclusive to custom patterns');
  return {type,
    ...(type==='custom'?{customPatternImage:assetSource(p.customPatternImage)}:{}),
    ...(p.repeat===undefined?{}:{repeat:choice(p.repeat,['repeat','repeat-x','repeat-y','no-repeat'] as const,'pattern repeat')}),
    ...(p.blendMode===undefined?{}:{blendMode:choice(p.blendMode,CanvasBlendModes,'pattern blend')}),
    ...(p.gradient===undefined?{}:{gradient:validatePatternGradient(p.gradient)}),
    ...numbers(p,{scale:[0.05,12],offsetX:[-4096,4096],offsetY:[-4096,4096]}),
    ...(p.color===undefined?{}:{color:color(p.color)}),
    ...(p.secondaryColor===undefined?{}:{secondaryColor:color(p.secondaryColor)}),
    ...numbers(p,{size:[1,256],spacing:[1,512],opacity:[0,1],rotation:[-360,360]})};
}
function assetSource(source:unknown):string {
  if(typeof source!=='string'||!/^asset:[0-9a-f]{64}$/.test(source))fail('background source must be a content-addressed imported asset');
  return source as string;
}
function imageOptions(v:Record<string,unknown>):CanvasCustomBg {
  keys(v,['source','inherit','fit','align','opacity','filters']);
  if(v.inherit!==undefined&&typeof v.inherit!=='boolean')fail('inherit must be boolean');
  const fit=v.fit===undefined?undefined:choice(v.fit,['fill','contain','cover'] as const,'fit');
  const align=v.align===undefined?undefined:choice(v.align,['center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'] as const,'align');
  return {source:assetSource(v.source),...(v.inherit===undefined?{}:{inherit:v.inherit as boolean}),...(fit?{fit}:{}),
    ...(align?{align}:{}),...(v.opacity===undefined?{}:{opacity:numeric(v.opacity,'asset opacity',0,1)}),
    ...(v.filters===undefined?{}:{filters:validateCanvasImageFilters(v.filters)})};
}
function layer(value:unknown):CanvasLayer {
  const v=object(value,'background layer');
  const nodeId=v.nodeId===undefined?undefined:
    typeof v.nodeId==='string'&&/^layer:[a-zA-Z0-9-]{4,90}$/.test(v.nodeId)
      ?v.nodeId:fail('invalid persisted layer node ID');
  const tagged=nodeId?{nodeId}:{};
  const blendMode=v.blendMode===undefined?undefined:choice(v.blendMode,CanvasBlendModes,'blend mode');
  const opacity=v.opacity===undefined?undefined:numeric(v.opacity,'layer opacity',0,1);
  if(v.type==='color'){keys(v,['type','value','opacity','blendMode','nodeId']);return {type:'color',...tagged,value:color(v.value),...(opacity===undefined?{}:{opacity}),...(blendMode?{blendMode}:{})};}
  if(v.type==='gradient'){keys(v,['type','value','opacity','blendMode','nodeId']);return {type:'gradient',...tagged,value:validateCanvasGradient(v.value),...(opacity===undefined?{}:{opacity}),...(blendMode?{blendMode}:{})};}
  if(v.type==='noise'){keys(v,['type','intensity','blendMode','nodeId']);return {type:'noise',...tagged,...(v.intensity===undefined?{}:{intensity:numeric(v.intensity,'noise intensity',0,1)}),...(blendMode?{blendMode}:{})};}
  if(v.type==='image'){
    keys(v,['type','source','fit','align','opacity','blendMode','nodeId']);
    const fit=v.fit===undefined?undefined:choice(v.fit,['fill','contain','cover'] as const,'fit');
    const align=v.align===undefined?undefined:choice(v.align,['center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'] as const,'align');
    return {type:'image',...tagged,source:assetSource(v.source),...(fit?{fit}:{}),...(align?{align}:{}),
      ...(opacity===undefined?{}:{opacity}),...(blendMode?{blendMode}:{})};
  }
  if(v.type==='presetPattern'){keys(v,['type','pattern','opacity','blendMode','nodeId']);return {type:'presetPattern',...tagged,pattern:validateCanvasPattern(v.pattern),...(opacity===undefined?{}:{opacity}),...(blendMode?{blendMode}:{})};}
  if(v.type==='pattern'){
    keys(v,['type','source','repeat','opacity','blendMode','nodeId']);
    return {type:'pattern',...tagged,source:assetSource(v.source),
      ...(v.repeat===undefined?{}:{repeat:choice(v.repeat,['repeat','repeat-x','repeat-y','no-repeat'] as const,'background pattern repeat')}),
      ...(opacity===undefined?{}:{opacity}),...(blendMode?{blendMode}:{})};
  }
  return fail('unsupported background-layer type or unsafe native media source');
}
const canvasBorders=['all','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'] as const;
function radius(value:unknown,label:string):number|'circular' {
  return value==='circular'?'circular':numeric(value,label,0,1024);
}
export function validateCanvasStroke(value:unknown):CanvasStroke{
  const x=object(value,'stroke');
  keys(x,['color','gradient','width','position','blur','opacity','borderRadius','borderPosition','roundedCorners','style']);
  if(x.gradient!==undefined&&x.color!==undefined)fail('stroke solid color and gradient are mutually exclusive');
  return {
    ...(x.color===undefined?{}:{color:color(x.color)}),
    ...(x.gradient===undefined?{}:{gradient:validateCanvasGradient(x.gradient)}),
    ...numbers(x,{width:[0,200],position:[-200,200],blur:[0,100],opacity:[0,1]}),
    ...(x.borderRadius===undefined?{}:{borderRadius:radius(x.borderRadius,'stroke border radius')}),
    ...(x.borderPosition===undefined?{}:{borderPosition:choice(x.borderPosition,canvasBorders,'stroke border position')}),
    ...(x.roundedCorners===undefined?{}:{roundedCorners:choice(x.roundedCorners,canvasBorders,'stroke rounded corners')}),
    ...(x.style===undefined?{}:{style:choice(x.style,['solid','dashed','dotted','groove','ridge','double'] as const,'stroke style')})
  };
}
export function validateCanvasShadow(value:unknown):CanvasShadow{
  const x=object(value,'shadow');
  keys(x,['color','gradient','offsetX','offsetY','blur','opacity','borderRadius','roundedCorners','borderPosition']);
  if(x.color!==undefined&&x.gradient!==undefined)fail('shadow solid color and gradient are mutually exclusive');
  return {
    ...(x.color===undefined?{}:{color:color(x.color)}),
    ...(x.gradient===undefined?{}:{gradient:validateCanvasGradient(x.gradient)}),
    ...numbers(x,{offsetX:[-512,512],offsetY:[-512,512],blur:[0,100],opacity:[0,1]}),
    ...(x.borderRadius===undefined?{}:{borderRadius:radius(x.borderRadius,'shadow border radius')}),
    ...(x.roundedCorners===undefined?{}:{roundedCorners:choice(x.roundedCorners,canvasBorders,'shadow rounded corners')}),
    ...(x.borderPosition===undefined?{}:{borderPosition:choice(x.borderPosition,canvasBorders,'shadow border position')})
  };
}
export function validateCanvasExtras(value:unknown):CanvasExtras {
  if(value===undefined)return {};
  const v=object(value,'canvas extras');
  keys(v,['x','y','customBg','gradientBg','patternBg','noiseBg','bgLayers','blendMode','opacity','blur','rotation','borderRadius','borderPosition','zoom','stroke','shadow']);
  const out:CanvasExtras={...numbers(v,{x:[-4096,4096],y:[-4096,4096],opacity:[0,1],blur:[0,100],rotation:[-360,360]}),
    ...(v.blendMode===undefined?{}:{blendMode:choice(v.blendMode,CanvasBlendModes,'root canvas blend mode')})};
  if(v.customBg!==undefined)out.customBg=imageOptions(object(v.customBg,'custom image background'));
  if(v.gradientBg!==undefined)out.gradientBg=validateCanvasGradient(v.gradientBg);
  if(v.patternBg!==undefined)out.patternBg=validateCanvasPattern(v.patternBg);
  if(v.noiseBg!==undefined){const n=object(v.noiseBg,'noise');keys(n,['intensity']);out.noiseBg={...numbers(n,{intensity:[0,1]})};}
  if(v.bgLayers!==undefined){
    const rawLayers=v.bgLayers;
    if(!Array.isArray(rawLayers)||rawLayers.length>12)fail('background layers limited to 12');
    out.bgLayers=(rawLayers as unknown[]).map(layer);
    const nodeIds=out.bgLayers.map(x=>x.nodeId).filter((v):v is string=>v!==undefined);
    if(new Set(nodeIds).size!==nodeIds.length)fail('duplicate background-layer node IDs');
  }
  if(v.borderRadius!==undefined)out.borderRadius=v.borderRadius==='circular'?'circular':numeric(v.borderRadius,'border radius',0,1024);
  if(v.borderPosition!==undefined)out.borderPosition=choice(v.borderPosition,canvasBorders,'border position');
  if(v.zoom!==undefined){const z=object(v.zoom,'zoom');keys(z,['scale','centerX','centerY']);out.zoom={...numbers(z,{scale:[0.05,16],centerX:[-8192,8192],centerY:[-8192,8192]})};}
  if(v.stroke!==undefined)out.stroke=validateCanvasStroke(v.stroke);
  if(v.shadow!==undefined)out.shadow=validateCanvasShadow(v.shadow);
  // Pinned canvas-creator paints patternBg and noiseBg AFTER bgLayers as
  // independent overlays. Only customBg and gradientBg compete for the
  // primary image/gradient slot; silently dropping overlays loses valid work.
  const primaries=['customBg','gradientBg'].filter(key=>v[key]!==undefined);
  if(primaries.length>1)fail('only one primary background is allowed');
  return out;
}
