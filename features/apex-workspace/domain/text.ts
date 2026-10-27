import type { CreateTextOptions, TextProperties } from "apexify.js";
import type { WorkspaceLayer } from "../model";

/** Declarative public-v6-only schema: drives controls and rejects unknown/unsafe fields. */
export type TextSpec =
  | {kind:"string"|"color"|"boolean"|"decoration"|"font-weight"; default?:unknown}
  | {kind:"number"; min:number; max:number; default?:number}
  | {kind:"enum"; choices:readonly string[]; default?:string}
  | {kind:"object"; fields:Record<string,TextSpec>}
  | {kind:"array"; item:TextSpec; max:number; min?:number};
const n=(min=-4096,max=4096,def?:number):TextSpec=>({kind:"number",min,max,default:def});
const e=(...choices:string[]):TextSpec=>({kind:"enum",choices,default:choices[0]});
const o=(fields:Record<string,TextSpec>):TextSpec=>({kind:"object",fields});
const color:TextSpec={kind:"color",default:"#ffffff"};
const s:TextSpec={kind:"string",default:""};
const b:TextSpec={kind:"boolean",default:false};
const point=o({x:n(-8192,8192),y:n(-8192,8192)});
const stops:TextSpec={kind:"array",max:32,min:2,item:o({stop:n(0,1),color})};
export const gradientSpec=o({
  type:e("linear","radial","conic"),
  startX:n(-8192,8192),startY:n(-8192,8192),endX:n(-8192,8192),endY:n(-8192,8192),
  startRadius:n(0,8192),endRadius:n(0,8192),
  centerX:n(-8192,8192),centerY:n(-8192,8192),
  startAngle:n(-3600,3600),rotate:n(-3600,3600),pivotX:n(-8192,8192),pivotY:n(-8192,8192),
  repeat:e("no-repeat","repeat","reflect"),colors:stops,
});
export const perspectiveSpec=o({
  points:{kind:"array",min:4,max:4,item:point},
  interpolation:e("nearest","bilinear","bicubic"),edgeMode:e("transparent","clamp","wrap","mirror"),
});
const paint=o({color,gradient:gradientSpec,opacity:n(0,1,1)});
export const decorationSpec=o({color,gradient:gradientSpec,width:n(0,100)});
export const textPropertiesSpec=o({
  font:o({size:n(1,512),family:s,name:s,weight:{kind:"font-weight"},style:e("normal","italic","oblique")}),
  decorations:o({bold:b,italic:b,underline:{kind:"decoration"},overline:{kind:"decoration"},strikethrough:{kind:"decoration"}}),
  effects:o({
    highlight:paint,
    glow:o({color,gradient:gradientSpec,intensity:n(0,100),opacity:n(0,1)}),
    shadow:o({color,gradient:gradientSpec,offsetX:n(-2048,2048),offsetY:n(-2048,2048),blur:n(0,512),opacity:n(0,1)}),
  }),
  layout:o({lineHeight:n(0.01,1000),letterSpacing:n(-200,200),wordSpacing:n(-200,200),maxWidth:n(1,8192),maxHeight:n(1,8192)}),
  placement:o({textAlign:e("left","center","right","start","end"),textBaseline:e("alphabetic","bottom","hanging","ideographic","middle","top"),
    rotation:n(-3600,3600),scaleX:n(-100,100),scaleY:n(-100,100),skewX:n(-89.9,89.9),skewY:n(-89.9,89.9),perspective:perspectiveSpec}),
  fill:paint,
  stroke:o({color,width:n(0,100),gradient:gradientSpec,opacity:n(0,1),style:e("solid","dashed","dotted","groove","ridge","double")}),
  textOnCurve:o({sweepAngle:n(0,360),radius:n(Number.MIN_VALUE,8192),up:b,layoutMode:e("clamp","fit","override"),
    baselineOffset:n(-2048,2048),startAngleDeg:n(-3600,3600)}),
  includeCharMetrics:b,
  measurementCanvas:o({width:n(1,8192),height:n(1,8192)}),
});
const transform=o({rotation:n(-3600,3600),translateX:n(-8192,8192),translateY:n(-8192,8192),
  scaleX:n(-100,100),scaleY:n(-100,100),skewX:n(-89.9,89.9),skewY:n(-89.9,89.9),
  pivotX:n(-8192,8192),pivotY:n(-8192,8192),opacity:n(0,1),
  blendMode:e("source-over","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light",
    "soft-light","difference","exclusion","hue","saturation","color","luminosity","destination-over","source-atop","destination-atop",
    "source-in","destination-in","source-out","destination-out","destination-over","xor","copy","lighter"),
  perspective:perspectiveSpec});
export const textGroupSpec=o({isGrouped:b,groupTransform:transform});
export const textRunSpec=o({text:s,x:n(-8192,8192),y:n(-8192,8192),...(textPropertiesSpec as Extract<TextSpec,{kind:'object'}>).fields});
export interface TextRun extends Omit<TextProperties,"text"|"x"|"y"> { text:string; x:number; y:number }
export interface TextSettings {
  properties?: Omit<TextProperties,"text"|"x"|"y">;
  items?: TextRun[];
  group?: CreateTextOptions;
}
const cssNamedColors=new Set("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen transparent".split(" "));
function isSafeCssColor(value:string):boolean{
  if(value.length>96)return false;
  return /^#(?:[a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.test(value)
    || cssNamedColors.has(value.toLowerCase())
    || /^(?:rgb|rgba|hsl|hsla)\(\s*[-+.\d%,\s/]+\)$/i.test(value);
}
const dangerous=new Set(["__proto__","prototype","constructor"]);
function valid(value:unknown,spec:TextSpec,path:string):unknown {
  if(spec.kind==="string"){
    const max=path.endsWith(".text")?5000:200;
    if(typeof value!=="string"||value.length>max)throw Error(path+" must be text <= "+max+" characters");
    if(/\.font\.(family|name)$/.test(path)&&!value.trim())throw Error(path+" must be non-empty");
    if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value))throw Error(path+" contains control characters");
    return value;
  }
  if(spec.kind==="font-weight"){
    if(typeof value==="number"&&Number.isInteger(value)&&value>=100&&value<=900)return value;
    if(typeof value==="string"&&["normal","bold","bolder","lighter"].includes(value))return value;
    throw Error(path+" must be a CSS weight (100-900 or named weight)");
  }
  if(spec.kind==="color"){
    if(typeof value!=="string"||!isSafeCssColor(value))throw Error(path+" requires a supported CSS color (hex, named color, rgb or hsl)");
    return value;
  }
  if(spec.kind==="boolean"){if(typeof value!=="boolean")throw Error(path+" must be boolean");return value;}
  if(spec.kind==="decoration"){
    if(typeof value==="boolean")return value;
    return valid(value,decorationSpec,path);
  }
  if(spec.kind==="number"){
    if(typeof value!=="number"||!Number.isFinite(value)||value<spec.min||value>spec.max)throw Error(path+` must be ${spec.min}..${spec.max}`);
    if(path.endsWith(".textOnCurve.sweepAngle")&&(value<=0||value>=360))throw Error(path+" must be strictly between 0 and 360 degrees");
    if(/\.measurementCanvas\.(width|height)$/.test(path)&&!Number.isInteger(value))throw Error(path+" must be an integer");
    return value;
  }
  if(spec.kind==="enum"){if(typeof value!=="string"||!spec.choices.includes(value))throw Error(path+" has unsupported value");return value;}
  if(spec.kind==="array"){
    if(!Array.isArray(value)||value.length>(spec.max)||value.length<(spec.min??0))throw Error(path+" has invalid item count");
    return value.map((entry,i)=>valid(entry,spec.item,path+"["+i+"]"));
  }
  if(spec.kind!=="object")throw Error(path+" has unknown field type");
  if(!value||typeof value!=="object"||Array.isArray(value))throw Error(path+" must be object");
  const data=value as Record<string,unknown>;
  for(const key of Object.keys(data))if(dangerous.has(key)||!(key in spec.fields))throw Error(path+"."+key+" is not supported");
  const out:Record<string,unknown>={};
  for(const [key,entry] of Object.entries(data))out[key]=valid(entry,spec.fields[key],path+"."+key);
  if(spec===gradientSpec){
    if(!("type" in data)||!("colors" in data))throw Error(path+" requires type and colors");
    const kind=data.type as string;
    const permitted=new Set(kind==="linear"?["type","startX","startY","endX","endY","rotate","pivotX","pivotY","repeat","colors"]:
      kind==="radial"?["type","startX","startY","startRadius","endX","endY","endRadius","rotate","pivotX","pivotY","repeat","colors"]:
      ["type","centerX","centerY","startAngle","rotate","pivotX","pivotY","colors"]);
    for(const key of Object.keys(data))if(!permitted.has(key))throw Error(path+"."+key+" is invalid for "+kind+" gradient");
    const colors=data.colors as Array<{stop:number}>;
    if(colors.some((v,i)=>i>0&&v.stop<colors[i-1].stop))throw Error(path+" gradient stops must be ascending");
  }
  if(path.endsWith(".textOnCurve")&&!("sweepAngle" in data))throw Error(path+" requires sweepAngle");
  if(spec===perspectiveSpec){
    if(!("points" in data))throw Error(path+" needs four points");
  }
  return out;
}
export function validateTextSettings(value:unknown):TextSettings|undefined{
  if(value===undefined)return undefined;
  if(!value||typeof value!=="object"||Array.isArray(value))throw Error("textSettings must be an object");
  const v=value as Record<string,unknown>;
  for(const key of Object.keys(v))if(!["properties","items","group"].includes(key))throw Error("Unsupported textSettings."+key);
  const properties=v.properties===undefined?undefined:valid(v.properties,textPropertiesSpec,"text.properties") as TextSettings["properties"];
  const items=v.items===undefined?undefined:valid(v.items,{kind:"array",item:textRunSpec,max:32},"text.items") as TextRun[];
  if(items?.some(item=>typeof item.text!=="string"||typeof item.x!=="number"||typeof item.y!=="number"))
    throw Error("Text array items require text, x and y");
  const group=v.group===undefined?undefined:valid(v.group,textGroupSpec,"text.group") as CreateTextOptions;
  if(items?.some(item=>item.text.length>5000))throw Error("Text item exceeds 5000 characters");
  if(items?.some(item=>item.text.length===0))throw Error("Text item may not be empty");
  if(v.group&&group?.groupTransform&&!group.isGrouped)throw Error("Enable isGrouped to use groupTransform");
  return {...(properties?{properties}:{}),...(items?{items}:{}),...(group?{group}:{})};
}
/** Reconstruct precisely the supported public createText overload payload. */
export function textArguments(layer:Extract<WorkspaceLayer,{kind:"text"}>):{
  texts:TextProperties|TextProperties[];options?:CreateTextOptions
}{
  const settings=validateTextSettings(layer.textSettings);
  const props:TextProperties={
    text:layer.text,x:layer.x,y:layer.y,
    font:{family:"DejaVu Sans",size:layer.fontSize,weight:layer.weight,...settings?.properties?.font},
    fill:{color:layer.color,opacity:layer.opacity,...settings?.properties?.fill},
    placement:{textBaseline:"top",rotation:layer.rotation,...settings?.properties?.placement},
    ...Object.fromEntries(Object.entries(settings?.properties??{}).filter(([k])=>!["font","fill","placement"].includes(k))),
  };
  const items=settings?.items??[];
  return {texts:items.length?[props,...items]:props,...(settings?.group?{options:settings.group}:{})};
}
export function textSettingsWithPath(settings:TextSettings|undefined,path:string[],value:unknown):TextSettings {
  const next=structuredClone(settings??{});
  let at=next as Record<string,unknown>;
  for(let i=0;i<path.length-1;i++){
    const key=path[i];const slot=at[key];
    if(slot===undefined)at[key]={};
    at=at[key] as Record<string,unknown>;
  }
  at[path[path.length-1]]=value;
  return next;
}
