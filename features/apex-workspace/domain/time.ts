/** Portable exact timing, independent of rendering, DOM and Node. */
export interface Timebase { numerator: string; denominator: string }
export interface TimePoint { ticks: string; timebase: Timebase }
export interface FrameRate { numerator: string; denominator: string }
export interface SourcePTS { sourceId: string; pts: string; timebase: Timebase; presentation: TimePoint }
export interface TimeRange { start: TimePoint; end: TimePoint }
export type RoundMode = 'exact' | 'floor' | 'ceil' | 'trunc' | 'nearest-even';
export const DEFAULT_PROJECT_TIMEBASE: Timebase = Object.freeze({ numerator:'1', denominator:'70560000' });
const MAX_BITS = 256n;
const MAX_COLLECTION = 100_000;
function fail(message: string): never { throw new RangeError(`media-time: ${message}`); }
function integer(value: string, signed=false): bigint {
  if (typeof value !== 'string' || !(signed ? /^-?(0|[1-9]\d*)$/ : /^(0|[1-9]\d*)$/).test(value)) fail('invalid decimal integer');
  const digits = value.replace(/^-/, '').length;
  // Check digit length before parsing an attacker-controlled giant BigInt.
  if (digits > 78) fail('integer size limit');
  const parsed = BigInt(value);
  if ((parsed < 0n ? -parsed : parsed).toString(2).length > Number(MAX_BITS)) fail('integer size limit');
  return parsed;
}
function abs(n: bigint): bigint { return n < 0n ? -n : n; }
function gcd(a: bigint, b: bigint): bigint { a=abs(a);b=abs(b);while(b){[a,b]=[b,a%b];}return a||1n; }
function bound(n: bigint): bigint { if(abs(n).toString(2).length>Number(MAX_BITS)) fail('arithmetic size limit');return n; }
export function timebase(numerator: string, denominator: string): Timebase {
  const n=integer(numerator),d=integer(denominator);if(n<=0n||d<=0n)fail('timebase must be positive');
  const g=gcd(n,d);return {numerator:(n/g).toString(),denominator:(d/g).toString()};
}
export function time(ticks: string, base: Timebase): TimePoint {
  const t=integer(ticks,true),b=timebase(base.numerator,base.denominator);
  return {ticks:t.toString(),timebase:b};
}
function fraction(point: TimePoint): {n:bigint;d:bigint} {
  const t=time(point.ticks,point.timebase);
  let n=bound(BigInt(t.ticks)*BigInt(t.timebase.numerator)),d=BigInt(t.timebase.denominator);
  const g=gcd(n,d);return {n:n/g,d:d/g};
}
function pointFromFraction(n: bigint,d: bigint): TimePoint {
  if(d<=0n)fail('invalid denominator');const g=gcd(n,d);n=bound(n/g);d=bound(d/g);
  return time(n.toString(),{numerator:'1',denominator:d.toString()});
}
export function compareTime(a:TimePoint,b:TimePoint): -1|0|1 {
  const x=fraction(a),y=fraction(b),diff=x.n*y.d-y.n*x.d;
  return diff<0n?-1:diff>0n?1:0;
}
export function addTime(a:TimePoint,b:TimePoint):TimePoint {const x=fraction(a),y=fraction(b);return pointFromFraction(x.n*y.d+y.n*x.d,x.d*y.d);}
export function subtractTime(a:TimePoint,b:TimePoint):TimePoint {const y=fraction(b);return addTime(a,pointFromFraction(-y.n,y.d));}
function divideRounded(n:bigint,d:bigint,mode:RoundMode):bigint {
  if(d<=0n) fail('denominator must be positive');const q=n/d,r=n%d;if(r===0n)return q;
  if(mode==='exact')fail('nonintegral timebase conversion: explicit rounding required');
  if(mode==='trunc')return q;
  if(mode==='floor')return n<0n?q-1n:q;
  if(mode==='ceil')return n>0n?q+1n:q;
  const twice=abs(r)*2n;
  return twice>d || (twice===d && (q%2n!==0n)) ? q+(n<0n?-1n:1n):q;
}
export function convertTime(point:TimePoint,to:Timebase,rounding:RoundMode='exact'):TimePoint {
  const base=timebase(to.numerator,to.denominator),v=fraction(point);
  const n=v.n*BigInt(base.denominator),d=v.d*BigInt(base.numerator);
  return time(bound(divideRounded(n,d,rounding)).toString(),base);
}
export function frameTime(frameIndex:string, fps:FrameRate):TimePoint {
  const n=integer(fps.numerator),d=integer(fps.denominator);
  if(n<=0n||d<=0n)fail('fps must be positive');
  return time(bound(integer(frameIndex,true)*d).toString(),timebase('1',n.toString()));
}
export function sourcePTS(sourceId:string,pts:string,base:Timebase):SourcePTS {
  if(!/^[a-zA-Z0-9][\w:.-]{0,127}$/.test(sourceId))fail('invalid source ID');
  // Preserve original input strings and source timebase identity even if fraction reduces.
  const presentation=time(pts,base);integer(pts,true);
  return {sourceId,pts,timebase:{numerator:base.numerator,denominator:base.denominator},presentation};
}
export function audioSample(sampleIndex:string,sampleRate:string):TimePoint {
  const rate=integer(sampleRate);if(rate<=0n)fail('sample rate must be positive');
  return time(sampleIndex,{numerator:'1',denominator:rate.toString()});
}
export function range(start:TimePoint,end:TimePoint):TimeRange {
  if(compareTime(start,end)>=0)fail('half-open range requires start < end');return {start:time(start.ticks,start.timebase),end:time(end.ticks,end.timebase)};
}
export function splitRange(r:TimeRange,at:TimePoint):{left:TimeRange;right:TimeRange} {
  if(compareTime(at,r.start)<=0||compareTime(at,r.end)>=0)fail('split must be strictly inside range');
  return {left:range(r.start,at),right:range(at,r.end)};
}
/** Split a timeline interval while keeping the right-hand source offset sample-accurate. */
export function splitSourcedRange(r:TimeRange,sourceOffset:TimePoint,cut:TimePoint):{
  left:{range:TimeRange;sourceOffset:TimePoint};right:{range:TimeRange;sourceOffset:TimePoint}
} {
  const pieces=splitRange(r,cut);
  return {left:{range:pieces.left,sourceOffset:time(sourceOffset.ticks,sourceOffset.timebase)},
    right:{range:pieces.right,sourceOffset:addTime(sourceOffset,subtractTime(cut,r.start))}};
}
/** A trim changes source offset by precisely the amount removed from the left. */
export function trimSourcedRange(r:TimeRange,sourceOffset:TimePoint,start:TimePoint,end:TimePoint):{
  range:TimeRange;sourceOffset:TimePoint
} {
  return {range:trimRange(r,start,end),sourceOffset:addTime(sourceOffset,subtractTime(start,r.start))};
}
export function trimRange(r:TimeRange,start:TimePoint,end:TimePoint):TimeRange {
  if(compareTime(start,r.start)<0||compareTime(end,r.end)>0)fail('trim must remain inside range');return range(start,end);
}
export function timeJSON(point:TimePoint):TimePoint {return time(point.ticks,point.timebase);}
export function parseTimeJSON(value:unknown):TimePoint {
  if(!value||typeof value!=='object'||Array.isArray(value))fail('expected time object');
  const v=value as Record<string,unknown>,b=v.timebase;
  if(Object.keys(v).sort().join(',')!=='ticks,timebase'||!b||typeof b!=='object'||Array.isArray(b))fail('unexpected time fields');
  const o=b as Record<string,unknown>;
  if(Object.keys(o).sort().join(',')!=='denominator,numerator'||typeof v.ticks!=='string'||typeof o.numerator!=='string'||typeof o.denominator!=='string')fail('invalid serialized time');
  return time(v.ticks,{numerator:o.numerator,denominator:o.denominator});
}
/** Exact interpretation of a finite JSON decimal number; migration metadata must disclose its precision source. */
export function legacySeconds(value:number):TimePoint {
  if(!Number.isFinite(value))fail('invalid legacy seconds');
  const s=value.toString().toLowerCase(),m=/^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(s);
  if(!m)fail('invalid legacy seconds');
  const exponent=Number(m[4]??'0')-(m[3]?.length??0);
  if(Math.abs(exponent)>75)fail('legacy decimal exponent beyond precision budget');
  const n=BigInt(`${m[1]}${m[2]}${m[3]??''}`);
  return exponent>=0?pointFromFraction(n*10n**BigInt(exponent),1n):pointFromFraction(n,10n**BigInt(-exponent));
}
export function quantizeGifCentiseconds(durations:readonly TimePoint[],minDelay=1):string[] {
  if(durations.length===0||durations.length>MAX_COLLECTION)fail('invalid GIF frame count');
  if(!Number.isInteger(minDelay)||minDelay<0||minDelay>65535)fail('invalid GIF minimum delay');
  let total:TimePoint=time('0',{numerator:'1',denominator:'1'}),previous=0n;
  const output:string[]=[];
  for(const duration of durations){
    if(compareTime(duration,time('0',{numerator:'1',denominator:'1'}))<=0)fail('zero/negative frame exposure is not encodable');
    total=addTime(total,duration);
    const rounded=convertTime(total,{numerator:'1',denominator:'100'},'nearest-even');
    const delay=BigInt(rounded.ticks)-previous;
    if(delay<BigInt(minDelay)||delay>65535n)fail('GIF delay below minimum or above 65535; coalesce/re-time explicitly');
    previous=BigInt(rounded.ticks);output.push(delay.toString());
  }
  return output;
}
