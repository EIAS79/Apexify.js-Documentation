import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { exampleDefinitions } from '../../lib/examples/definitions';
import { MAX_OUTPUT_FILES, MAX_TOTAL_OUTPUT_BYTES, runControlled, safeOutputPath, sanitizedExecutionEnv, verifyOutputBuffer } from './doc5-runner-lib';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc12');
fs.mkdirSync(OUT, { recursive: true });
const tarball = process.env.DOC12_PACKAGE_TARBALL;
const packageSha = process.env.DOC12_PACKAGE_MAIN_SHA;
if (!tarball || !fs.existsSync(tarball)) throw new Error('DOC12_PACKAGE_TARBALL must point to the freshly packed Apexify candidate tarball');
if (!packageSha || !/^[0-9a-f]{40}$/i.test(packageSha)) throw new Error('DOC12_PACKAGE_MAIN_SHA must be the exact current package candidate commit');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;
const hash = (b: Buffer) => crypto.createHash('sha256').update(b).digest('hex');
const stable = (v: any): any => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])) : v;
const run = (command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env, timeout = 180_000) => {
  const r = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024 });
  if (r.error || r.status !== 0) throw new Error(`${command} ${args.join(' ')} failed\n${r.stdout ?? ''}\n${r.stderr ?? ''}`);
  return r.stdout;
};
const minimalInstallEnv = (): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'test' };
  for (const key of ['PATH','Path','HOME','SystemRoot','TMPDIR','TMP','TEMP','HTTP_PROXY','HTTPS_PROXY','NO_PROXY','http_proxy','https_proxy','no_proxy','npm_config_cache','npm_config_registry']) if (process.env[key]) env[key] = process.env[key];
  return env;
};
function declarationDigest(root: string) {
  const dir = path.join(root, 'dist');
  const files: string[] = [];
  const walk = (d: string) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name))) { const f=path.join(d,e.name); if(e.isDirectory()) walk(f); else if(e.isFile() && /\.d\.(?:ts|cts)$/.test(e.name)) files.push(f); } };
  walk(dir);
  const h = crypto.createHash('sha256');
  for (const file of files) { const rel=path.relative(root,file).split(path.sep).join('/'); h.update(rel); h.update('\0'); h.update(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')); h.update('\0'); }
  return { sha256:h.digest('hex'), files:files.map((f)=>path.relative(root,f).split(path.sep).join('/')) };
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apexify-doc12-candidate-'));
try {
  const consumer = path.join(temp, 'consumer');
  fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer, 'package.json'), `${JSON.stringify({ private:true, type:'module' }, null, 2)}\n`);
  run(npmCmd, ['install','--no-audit','--no-fund','--package-lock=false',tarball,'typescript@7.0.2','@types/node@22.20.1'], consumer, minimalInstallEnv(), 240_000);
  const candidateRoot = path.join(consumer, 'node_modules', 'apexify.js');
  const candidatePkg = JSON.parse(fs.readFileSync(path.join(candidateRoot, 'package.json'), 'utf8'));
  if (candidatePkg.name !== 'apexify.js' || candidatePkg.version !== '6.0.0') throw new Error(`unexpected candidate identity ${candidatePkg.name}@${candidatePkg.version}`);

  const pinnedRoot = path.join(ROOT, 'node_modules', 'apexify.js');
  if (!fs.existsSync(path.join(pinnedRoot, 'package.json'))) throw new Error('docs pinned apexify.js dependency is not installed');
  const pinnedPkg = JSON.parse(fs.readFileSync(path.join(pinnedRoot, 'package.json'), 'utf8'));
  const candidateDecl = declarationDigest(candidateRoot);
  const pinnedDecl = declarationDigest(pinnedRoot);
  const exportsMatch = JSON.stringify(stable(candidatePkg.exports ?? {})) === JSON.stringify(stable(pinnedPkg.exports ?? {}));
  const declarationsMatch = candidateDecl.sha256 === pinnedDecl.sha256;
  if (!exportsMatch || !declarationsMatch) throw new Error(`current package public surface differs from documented artifact: exportsMatch=${exportsMatch} declarationsMatch=${declarationsMatch}`);

  const results: any[] = [];
  for (const example of exampleDefinitions) {
    const caseDir = path.join(consumer, 'cases', example.id); fs.mkdirSync(caseDir, { recursive:true });
    for (const source of example.sourceFiles) fs.copyFileSync(path.join(ROOT, source), path.join(caseDir, path.basename(source)));
    const tsconfig = { compilerOptions:{ target:'ES2022', lib:['ESNext','DOM','DOM.Iterable'], types:['node'], module:'NodeNext', moduleResolution:'NodeNext', strict:true, skipLibCheck:false, noEmit:true }, files:example.sourceFiles.map((s)=>`./${path.basename(s)}`) };
    fs.writeFileSync(path.join(caseDir,'tsconfig.json'), `${JSON.stringify(tsconfig,null,2)}\n`);
    const tsc = path.join(consumer,'node_modules','typescript','bin','tsc');
    const tc = runControlled(nodeCmd,[tsc,'-p','tsconfig.json'],{cwd:caseDir,timeoutMs:example.verification.timeoutMs,env:sanitizedExecutionEnv(caseDir)});
    if(tc.timedOut || tc.status!==0) throw new Error(`[${example.id}] candidate typecheck failed\n${tc.stdout}\n${tc.stderr}`);
    fs.writeFileSync(path.join(caseDir,'tsconfig.emit.json'), `${JSON.stringify({...tsconfig,compilerOptions:{...tsconfig.compilerOptions,noEmit:false,outDir:'dist'}},null,2)}\n`);
    const compile = runControlled(nodeCmd,[tsc,'-p','tsconfig.emit.json'],{cwd:caseDir,timeoutMs:example.verification.timeoutMs,env:sanitizedExecutionEnv(caseDir)});
    if(compile.timedOut || compile.status!==0) throw new Error(`[${example.id}] candidate compile failed\n${compile.stdout}\n${compile.stderr}`);
    const outputDir=path.join(caseDir,'output');fs.mkdirSync(outputDir);
    const entryJs=path.join(caseDir,'dist',`${path.basename(example.entrypoint,path.extname(example.entrypoint))}.js`);
    const execution=runControlled(nodeCmd,[entryJs],{cwd:caseDir,timeoutMs:example.verification.timeoutMs,env:sanitizedExecutionEnv(outputDir)});
    if(execution.timedOut || execution.status!==0 || execution.error) throw new Error(`[${example.id}] candidate execution failed\n${execution.stdout}\n${execution.stderr}`);
    const outputNames=fs.readdirSync(outputDir).filter((n)=>fs.statSync(path.join(outputDir,n)).isFile());
    if(outputNames.length>MAX_OUTPUT_FILES) throw new Error(`[${example.id}] candidate output count ${outputNames.length} exceeds ${MAX_OUTPUT_FILES}`);
    let total=0; const outputs:any[]=[];
    for(const expected of example.expectedOutput){const file=safeOutputPath(outputDir,expected.path);if(!fs.existsSync(file))throw new Error(`[${example.id}] candidate missing ${expected.path}`);const buffer=fs.readFileSync(file);total+=buffer.length;verifyOutputBuffer(buffer,expected);outputs.push({path:expected.path,bytes:buffer.length,sha256:hash(buffer),verificationMode:expected.verificationMode});}
    if(total>MAX_TOTAL_OUTPUT_BYTES)throw new Error(`[${example.id}] candidate output bytes ${total} exceed ${MAX_TOTAL_OUTPUT_BYTES}`);
    results.push({id:example.id,status:'PASS',typecheck:true,compile:true,execute:true,outputs});
  }

  const payload = {
    schemaVersion:1,
    sourceSha,
    generatedAt:new Date().toISOString(),
    status:'PASS',
    package:{name:candidatePkg.name,version:candidatePkg.version,commit:packageSha,artifactFilename:path.basename(tarball),artifactSha256:hash(fs.readFileSync(tarball))},
    documentedArtifact:{version:pinnedPkg.version,exportsMatch,declarationsMatch,declarationSha256:pinnedDecl.sha256},
    candidatePublicSurface:{exportsMatch,declarationsMatch,declarationSha256:candidateDecl.sha256,declarationFiles:candidateDecl.files.length},
    examples:{total:results.length,passed:results.length,results},
  };
  fs.writeFileSync(path.join(OUT,'package-candidate.json'), `${JSON.stringify(payload,null,2)}\n`);
  console.log(`[DOC-12 package candidate] PASS ${candidatePkg.version} ${packageSha.slice(0,12)}… artifact=${payload.package.artifactSha256.slice(0,12)}… examples=${results.length}`);
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
