import { test } from 'node:test';
import assert from 'node:assert/strict';

// Contract-only pure arithmetic specimens for supervisor review; NOT an engine implementation.
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a,b] = [b,a%b]; return a; };
function rational(n, d=1n) {
  n=BigInt(n);d=BigInt(d);
  if(d===0n) throw new RangeError('zero denominator');
  if(d<0n){n=-n;d=-d;}
  const g=gcd(n,d);return {n:n/g,d:d/g};
}
function plus(a,b) {return rational(a.n*b.d+b.n*a.d,a.d*b.d);}
function minus(a,b) {return rational(a.n*b.d-b.n*a.d,a.d*b.d);}
function same(a,b) {return a.n===b.n && a.d===b.d;}
function frameTime(frame, fpsNum, fpsDen) {return rational(BigInt(frame)*BigInt(fpsDen),BigInt(fpsNum));}
function ptsTime(pts, baseNum, baseDen) {return rational(BigInt(pts)*BigInt(baseNum),BigInt(baseDen));}
function toDecimalTime(v){return JSON.parse(JSON.stringify({ticks:v.n.toString(),timebase:{numerator:'1',denominator:v.d.toString()}}));}
function quantizeGifCumulative(frames) {
  let sum=rational(0n), last=0n;
  return frames.map(duration=>{sum=plus(sum,duration);const centi=rational(sum.n*100n,sum.d);const rounded=(centi.n*2n+centi.d)/(2n*centi.d);const out=rounded-last;last=rounded;return out;});
}

test('30000/1001 frame and 1/90000 source PTS agree exactly',()=>{
  assert(same(frameTime(1,30000,1001),ptsTime(3003,1,90000)));
  assert(same(frameTime(3,30000,1001),rational(1001n,10000n)));
});
test('70560000 ticks per second exactly represent 30000/1001 and common audio rates',()=>{
  const rate=70560000n;
  assert.equal(rate*1001n%30000n,0n);
  assert.equal(rate%44100n,0n);
  assert.equal(rate%48000n,0n);
  assert.equal(rate%96000n,0n);
  assert.equal(rate*1001n/30000n,2354352n);
});
test('audio sample time is not quantized to video frame boundaries',()=>{
  const audio=ptsTime(24000,1,48000);
  assert(same(audio,rational(1n,2n)));
  assert(!same(audio,frameTime(15,30000,1001)));
});
test('half-open split exactly preserves original range',()=>{
  const s=frameTime(0,30000,1001),cut=frameTime(2,30000,1001),end=frameTime(5,30000,1001);
  const left=minus(cut,s),right=minus(end,cut);
  assert(same(plus(left,right),minus(end,s)));
  assert(left.n>0n&&right.n>0n);
});
test('VFR PTS preserves irregular source intervals instead of inventing FPS',()=>{
  const pts=[0,3003,6006,10010].map(x=>ptsTime(x,1,90000));
  assert(!same(minus(pts[3],pts[2]),minus(pts[1],pts[0])));
});
test('GIF centisecond rounding uses cumulative exposure to bound drift',()=>{
  const duration=frameTime(1,30000,1001);
  const cs=quantizeGifCumulative([duration,duration,duration]);
  assert.deepEqual(cs,[3n,4n,3n]);
  assert.equal(cs.reduce((a,b)=>a+b,0n),10n);
});
test('JSON persists integer times past Number.MAX_SAFE_INTEGER exactly',()=>{
  const point=rational('9007199254740993123456',70560000n);
  const encoded=JSON.stringify(toDecimalTime(point));
  const decoded=JSON.parse(encoded);
  assert(same(rational(decoded.ticks,decoded.timebase.denominator),point));
});
test('reject denominator zero and normalize negative denominators',()=>{
  assert.throws(()=>rational(1n,0n),/zero denominator/);
  assert.deepEqual(rational(4n,-8n),{n:-1n,d:2n});
});
