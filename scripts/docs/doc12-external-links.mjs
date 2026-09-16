import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT=process.cwd();
const OUT=path.join(ROOT,'generated','docs-doc12');
fs.mkdirSync(OUT,{recursive:true});
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
const roots=['app','components','content','lib','DOC10_FUTURE_PHASE_INTEGRATION_PLAYBOOK.md','DOC12_RELEASE_AND_FUTURE_PHASE_CONTRACT.md'];
const allowHosts=new Set(['github.com','raw.githubusercontent.com','npmjs.com','www.npmjs.com','nodejs.org','react.dev','nextjs.org','developer.mozilla.org','vercel.com']);
const files=[];
function walk(p){const full=path.join(ROOT,p);if(!fs.existsSync(full))return;const st=fs.statSync(full);if(st.isFile()){if(/\.(?:md|mdx|ts|tsx|js|jsx)$/.test(full))files.push(full);return;}for(const e of fs.readdirSync(full,{withFileTypes:true})){if(['node_modules','.next','.git','generated'].includes(e.name))continue;walk(path.join(p,e.name));}}
for(const root of roots)walk(root);
const found=new Map();
for(const file of files){const text=fs.readFileSync(file,'utf8');const matches=[...text.matchAll(/https?:\/\/[^\s)\]}>"'`]+/g)];for(const m of matches){const raw=m[0].replace(/[.,;:]+$/,'');if(/[${}<>]/.test(raw))continue;let url;try{url=new URL(raw);}catch{continue;}if(['example.com','www.example.com','localhost','127.0.0.1'].includes(url.hostname))continue;if(/(?:token|signature|sig|key|auth|expires)=/i.test(url.search))continue;const rec=found.get(url.href)||{url:url.href,sources:[]};rec.sources.push(path.relative(ROOT,file).split(path.sep).join('/'));found.set(url.href,rec);}}
const records=[];const failures=[];const transient=[];
async function probe(url){let last=null;for(let attempt=1;attempt<=2;attempt++){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);try{let response=await fetch(url,{method:'HEAD',redirect:'follow',signal:controller.signal,headers:{'user-agent':'Apexify-DOC12-LinkCheck/1.0'}});if(response.status===405||response.status===501){response=await fetch(url,{method:'GET',redirect:'follow',signal:controller.signal,headers:{'user-agent':'Apexify-DOC12-LinkCheck/1.0','range':'bytes=0-0'}});}clearTimeout(timer);last={status:response.status,finalUrl:response.url};if((response.status>=200&&response.status<400)||response.status===401||response.status===403)return{...last,result:'PASS',attempt};if(response.status===404||response.status===410)return{...last,result:'FAIL',attempt};if(response.status===429||response.status>=500){await new Promise(r=>setTimeout(r,750*attempt));continue;}return{...last,result:'FAIL',attempt};}catch(error){clearTimeout(timer);last={status:null,error:error instanceof Error?error.message:String(error)};if(attempt<2)await new Promise(r=>setTimeout(r,750*attempt));}}
return{...last,result:'TRANSIENT'};}
for(const rec of [...found.values()].sort((a,b)=>a.url.localeCompare(b.url))){const u=new URL(rec.url);if(!allowHosts.has(u.hostname)){records.push({...rec,classification:'SYNTAX_ONLY',reason:'host is outside the controlled live-check allowlist; URL parsed successfully'});continue;}const result=await probe(rec.url);const row={...rec,classification:'LIVE_CHECK',...result};records.push(row);if(result.result==='FAIL')failures.push(row);if(result.result==='TRANSIENT')transient.push(row);}
const status=failures.length?'FAIL':transient.length?'PASS WITH EXTERNAL VERIFICATION PENDING':'PASS';
const payload={schemaVersion:1,sourceSha,generatedAt:new Date().toISOString(),status,policy:{liveCheckedHosts:[...allowHosts].sort(),syntaxOnlyReason:'Non-allowlisted hosts are inventoried and syntax-validated to avoid unstable/unbounded network CI.',retryAttempts:2,timeoutMs:12000,passStatuses:'2xx/3xx plus 401/403 as reachable protected resources',hardFailures:'404/410 and stable non-success status',transient:'429/5xx/timeouts after retry are recorded explicitly'},totals:{urls:records.length,liveChecked:records.filter(r=>r.classification==='LIVE_CHECK').length,syntaxOnly:records.filter(r=>r.classification==='SYNTAX_ONLY').length,failures:failures.length,transient:transient.length},failures,transient,records};
fs.writeFileSync(path.join(OUT,'external-links.json'),`${JSON.stringify(payload,null,2)}\n`);
if(failures.length){console.error(`[DOC-12 external links] FAIL broken=${failures.length}`);process.exit(1);}console.log(`[DOC-12 external links] ${status} urls=${records.length} live=${payload.totals.liveChecked} transient=${transient.length}`);
