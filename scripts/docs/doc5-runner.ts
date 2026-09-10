import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { exampleDefinitions, DOC5_PACKAGE } from '../../lib/examples/definitions';
import { sha256, stableSourceHash } from '../../lib/examples/hash';
import { MAX_OUTPUT_FILES, MAX_TOTAL_OUTPUT_BYTES, runControlled, safeOutputPath, sanitizedExecutionEnv, verifyOutputBuffer } from './doc5-runner-lib';

const root = process.cwd();
const generated = path.join(root, 'generated', 'docs-doc5');
const publicRoot = path.join(root, 'public', 'example-outputs');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;
const runtimeOnly = process.argv.includes('--runtime-only');

function runOrThrow(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(command, args, { cwd, env, encoding:'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 120_000 });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  return result.stdout;
}
function minimalInstallEnv(): NodeJS.ProcessEnv {
  const env = { NODE_ENV: process.env.NODE_ENV ?? 'test' } as NodeJS.ProcessEnv;
  for (const key of ['PATH','Path','HOME','SystemRoot','TMPDIR','TMP','TEMP','HTTP_PROXY','HTTPS_PROXY','NO_PROXY','http_proxy','https_proxy','no_proxy','npm_config_cache','npm_config_registry']) if (process.env[key]) env[key]=process.env[key];
  return env;
}
function copySource(source: string, caseDir: string) { fs.copyFileSync(path.join(root, source), path.join(caseDir, path.basename(source))); }

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apexify-doc5-'));
try {
  const artifactDir = path.join(temp, 'artifact'); fs.mkdirSync(artifactDir);
  const packageDir = path.join(root, 'node_modules', 'apexify.js');
  if (!fs.existsSync(path.join(packageDir, 'package.json'))) throw new Error('Pinned apexify.js dependency is not installed. Run npm ci first.');
  const packOut = runOrThrow(npmCmd, ['pack', packageDir, '--ignore-scripts', '--json', '--pack-destination', artifactDir], root, minimalInstallEnv());
  const pack = JSON.parse(packOut) as Array<{ filename: string }>;
  const artifactFile = path.join(artifactDir, pack[0]?.filename ?? '');
  if (!fs.existsSync(artifactFile)) throw new Error('npm pack did not produce an Apexify.js tarball.');
  const artifactSha256 = sha256(fs.readFileSync(artifactFile));

  const fixture = path.join(temp, 'consumer'); fs.mkdirSync(fixture);
  fs.writeFileSync(path.join(fixture,'package.json'), `${JSON.stringify({ private:true, type:'module' }, null, 2)}\n`);
  runOrThrow(npmCmd, ['install','--no-audit','--no-fund','--package-lock=false',artifactFile,'typescript@7.0.2','@types/node@22.20.1'], fixture, minimalInstallEnv());
  const installed = JSON.parse(fs.readFileSync(path.join(fixture,'node_modules','apexify.js','package.json'),'utf8')) as { name:string; version:string };
  if (installed.name !== DOC5_PACKAGE.name || installed.version !== DOC5_PACKAGE.version) throw new Error(`Packed install identity mismatch: ${installed.name}@${installed.version}`);

  const provenanceExamples: Array<Record<string, unknown>> = [];
  const verificationResults: Array<Record<string, unknown>> = [];
  const runtimeResults: Array<Record<string, unknown>> = [];

  for (const example of exampleDefinitions) {
    const caseDir = path.join(fixture, 'cases', example.id); fs.mkdirSync(caseDir, { recursive:true });
    for (const source of example.sourceFiles) copySource(source, caseDir);
    const sourceRecords = example.sourceFiles.map((source) => ({ path:source, content:fs.readFileSync(path.join(root, source),'utf8').replace(/\r\n/g,'\n') }));
    const sourceHash = stableSourceHash(sourceRecords);
    const tsconfig = {
      compilerOptions: { target:'ES2022', lib:['ESNext','DOM','DOM.Iterable'], types:['node'], module:'NodeNext', moduleResolution:'NodeNext', strict:true, skipLibCheck:false, noEmit:true },
      files: example.sourceFiles.map((source) => `./${path.basename(source)}`),
    };
    fs.writeFileSync(path.join(caseDir,'tsconfig.json'), `${JSON.stringify(tsconfig,null,2)}\n`);
    const tsc = path.join(fixture,'node_modules','typescript','bin','tsc');
    const typecheck = runControlled(nodeCmd, [tsc,'-p','tsconfig.json'], { cwd:caseDir, timeoutMs:example.verification.timeoutMs, env:sanitizedExecutionEnv(caseDir) });
    if (typecheck.timedOut || typecheck.status !== 0) throw new Error(`[${example.id}] typecheck failed\n${typecheck.stdout}\n${typecheck.stderr}`);

    const emitConfig = { ...tsconfig, compilerOptions:{ ...tsconfig.compilerOptions, noEmit:false, outDir:'dist' } };
    fs.writeFileSync(path.join(caseDir,'tsconfig.emit.json'), `${JSON.stringify(emitConfig,null,2)}\n`);
    const compile = runControlled(nodeCmd, [tsc,'-p','tsconfig.emit.json'], { cwd:caseDir, timeoutMs:example.verification.timeoutMs, env:sanitizedExecutionEnv(caseDir) });
    if (compile.timedOut || compile.status !== 0) throw new Error(`[${example.id}] compile failed\n${compile.stdout}\n${compile.stderr}`);

    const outputDir = path.join(caseDir,'output'); fs.mkdirSync(outputDir);
    const entryJs = path.join(caseDir,'dist',`${path.basename(example.entrypoint, path.extname(example.entrypoint))}.js`);
    const started = Date.now();
    const execution = runControlled(nodeCmd, [entryJs], { cwd:caseDir, timeoutMs:example.verification.timeoutMs, env:sanitizedExecutionEnv(outputDir) });
    const durationMs = Date.now() - started;
    if (execution.timedOut) throw new Error(`[${example.id}] execution timed out after ${example.verification.timeoutMs}ms`);
    if (execution.status !== 0 || execution.error) throw new Error(`[${example.id}] execution failed\n${execution.stdout}\n${execution.stderr}`);
    if (/\b(unhandled|uncaught|fatal|exception|error:)\b/i.test(execution.stderr)) throw new Error(`[${example.id}] stderr matched error policy: ${execution.stderr}`);

    const outputNames = fs.readdirSync(outputDir).filter((name) => fs.statSync(path.join(outputDir,name)).isFile());
    if (outputNames.length > MAX_OUTPUT_FILES) throw new Error(`[${example.id}] produced ${outputNames.length} files; max is ${MAX_OUTPUT_FILES}`);
    let totalBytes=0;
    const outputProof: Array<{path:string;sha256:string;bytes:number;verificationMode:string}> = [];
    for (const expected of example.expectedOutput) {
      const file = safeOutputPath(outputDir, expected.path);
      if (!fs.existsSync(file)) throw new Error(`[${example.id}] missing expected output: ${expected.path}`);
      const buffer=fs.readFileSync(file); totalBytes += buffer.length; verifyOutputBuffer(buffer, expected);
      outputProof.push({ path:expected.path, sha256:sha256(buffer), bytes:buffer.length, verificationMode:expected.verificationMode });
      if (expected.public && !runtimeOnly) {
        const targetDir=path.join(publicRoot,example.id); fs.mkdirSync(targetDir,{recursive:true}); fs.copyFileSync(file,path.join(targetDir,expected.path));
      }
    }
    if (totalBytes > MAX_TOTAL_OUTPUT_BYTES) throw new Error(`[${example.id}] output bytes ${totalBytes} exceed ${MAX_TOTAL_OUTPUT_BYTES}`);
    provenanceExamples.push({ id:example.id, packageVersion:DOC5_PACKAGE.version, packageCommit:DOC5_PACKAGE.commit, artifactSha256, sourceHash, outputs:outputProof });
    verificationResults.push({ id:example.id, status:'verified', typecheck:true, executed:true, exitCode:execution.status, timedOut:false, stdoutSha256:sha256(execution.stdout), stderrSha256:sha256(execution.stderr), outputs:outputProof.map((o)=>({path:o.path,sha256:o.sha256,verificationMode:o.verificationMode})) });
    runtimeResults.push({ id:example.id, durationMs, node:process.version, platform:`${process.platform}-${process.arch}` });
  }

  if (!runtimeOnly) {
    fs.mkdirSync(generated,{recursive:true});
    fs.writeFileSync(path.join(generated,'package-artifact.json'), `${JSON.stringify({ schemaVersion:1, packageName:DOC5_PACKAGE.name, packageVersion:DOC5_PACKAGE.version, packageCommit:DOC5_PACKAGE.commit, artifactFilename:path.basename(artifactFile), artifactSha256, installedLocation:'isolated-consumer/node_modules/apexify.js', localSourceShortcut:false },null,2)}\n`);
    fs.writeFileSync(path.join(generated,'output-provenance.json'), `${JSON.stringify({ schemaVersion:1, examples:provenanceExamples },null,2)}\n`);
    fs.writeFileSync(path.join(generated,'verification-results.json'), `${JSON.stringify({ schemaVersion:1, examples:verificationResults },null,2)}\n`);
  }
  const runtimeDir=path.join(generated,'runtime'); fs.mkdirSync(runtimeDir,{recursive:true});
  fs.writeFileSync(path.join(runtimeDir,'verification-runtime.json'), `${JSON.stringify({ schemaVersion:1, node:process.version, npm:runOrThrow(npmCmd,['--version'],root,minimalInstallEnv()).trim(), platform:`${process.platform}-${process.arch}`, examples:runtimeResults },null,2)}\n`);
  console.log(`[doc5-runner] PASS — ${exampleDefinitions.length} examples typechecked/executed against packed ${DOC5_PACKAGE.name}@${DOC5_PACKAGE.version} ${artifactSha256.slice(0,12)}…`);
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
