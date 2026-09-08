import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-baseline');
const SAMPLES = Math.max(2, Number(process.env.DOC0_BUILD_SAMPLES || 2));
fs.mkdirSync(OUT, { recursive: true });
const envInfo = () => ({ platform: process.platform, arch: process.arch, node: process.version, npm: (() => { try { return execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(); } catch { return 'UNKNOWN'; } })(), osRelease: os.release(), cpuModel: os.cpus()?.[0]?.model || 'UNKNOWN', cpuCount: os.cpus()?.length || null, totalMemoryBytes: os.totalmem() });
const median = (values) => { const s=[...values].sort((a,b)=>a-b),m=Math.floor(s.length/2); return s.length%2?s[m]:(s[m-1]+s[m])/2; };
const percentile = (values,p) => { const s=[...values].sort((a,b)=>a-b); return s[Math.min(s.length-1,Math.max(0,Math.ceil(p/100*s.length)-1))]; };
const warningsFrom = (text) => [...new Set(text.split(/\r?\n/).filter(l=>/warn|warning|deprecated|deprecat|error/i.test(l)).map(l=>l.trim()).filter(Boolean))].slice(0,100);
const samples=[];
for(let i=0;i<SAMPLES;i++){
  fs.rmSync(path.join(ROOT,'.next'),{recursive:true,force:true});
  const start=process.hrtime.bigint();
  const run=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run','build'],{cwd:ROOT,encoding:'utf8',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},maxBuffer:64*1024*1024});
  const elapsedMs=Number(process.hrtime.bigint()-start)/1e6,output=`${run.stdout||''}\n${run.stderr||''}`;
  samples.push({sample:i+1,elapsedMs:Number(elapsedMs.toFixed(3)),exitCode:run.status,signal:run.signal||null,warningLines:warningsFrom(output),routeTableLines:output.split(/\r?\n/).filter(l=>/[○●ƒ]|Route \(app\)|First Load JS|\/docs|\/studio|\/gallery|\/api\//.test(l)).slice(0,200)});
  if(run.status!==0){fs.writeFileSync(path.join(OUT,'build.json'),JSON.stringify({schemaVersion:1,environment:envInfo(),samples,status:'FAILED'},null,2)+'\n');process.stderr.write(output);process.exit(run.status||1);}
}
const appFile=path.join(ROOT,'.next/server/app-paths-manifest.json'),preFile=path.join(ROOT,'.next/prerender-manifest.json');
const app=fs.existsSync(appFile)?JSON.parse(fs.readFileSync(appFile,'utf8')):{},pre=fs.existsSync(preFile)?JSON.parse(fs.readFileSync(preFile,'utf8')):{routes:{},dynamicRoutes:{}};
function routeOf(key){let v=key.endsWith('/page')?key.slice(0,-5):key.endsWith('/route')?key.slice(0,-6):key;v=v.replace(/\/\([^/]+\)/g,'').replace(/\/+/g,'/');return v||'/';}
const built=Object.keys(app).map(key=>{const route=routeOf(key),handler=key.endsWith('/route'),st=!handler&&Object.hasOwn(pre.routes||{},route);return{key,route,type:handler?'api/route-handler':'page',rendering:handler?'server':st?'static/prerendered':'dynamic/non-prerendered'}}).sort((a,b)=>(a.route+':'+a.type).localeCompare(b.route+':'+b.type));
const times=samples.map(s=>s.elapsedMs),artifact={schemaVersion:1,environment:envInfo(),methodology:{cleanBeforeEachSample:true,samples:SAMPLES,command:'npm run build',telemetryDisabled:true,timing:'monotonic wall-clock process time'},status:'PASS',samples,summary:{medianMs:Number(median(times).toFixed(3)),minMs:Math.min(...times),maxMs:Math.max(...times),p95Ms:percentile(times,95)},builtRoutes:built,builtRouteCounts:{total:built.length,pages:built.filter(r=>r.type==='page').length,apiRoutes:built.filter(r=>r.type!=='page').length,staticPages:built.filter(r=>r.rendering==='static/prerendered').length,dynamicPages:built.filter(r=>r.rendering==='dynamic/non-prerendered').length}};
fs.writeFileSync(path.join(OUT,'build.json'),JSON.stringify(artifact,null,2)+'\n');console.log(JSON.stringify(artifact.summary,null,2));
