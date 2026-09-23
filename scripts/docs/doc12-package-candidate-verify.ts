import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import ts from 'typescript';
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


function semanticCompatibilityDiff(expected: any, actual: any, prefix = 'surface', out: string[] = []): string[] {
  if (out.length >= 40) return out;
  if (Object.is(expected, actual)) return out;

  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      out.push(`${prefix}: kind differs`);
      return out;
    }

    const keyOf = (value: any): string => {
      if (value && typeof value === 'object') {
        if (typeof value.entrypoint === 'string') return `entrypoint:${value.entrypoint}`;
        if (typeof value.name === 'string' && value.name !== '__type') return `name:${value.name}`;
        if (typeof value.text === 'string') return `text:${value.text}`;
        if (typeof value.name === 'string') return `name:${value.name}`;
      }
      return `value:${JSON.stringify(stable(value))}`;
    };

    const actualByKey = new Map<string, any>();
    for (const value of actual) actualByKey.set(keyOf(value), value);

    for (const value of expected) {
      if (out.length >= 40) break;
      const key = keyOf(value);
      if (!actualByKey.has(key)) {
        out.push(`${prefix}: documented member missing or changed: ${key}`);
        continue;
      }
      semanticCompatibilityDiff(value, actualByKey.get(key), `${prefix}[${key}]`, out);
    }
    return out;
  }

  if (expected && actual && typeof expected === 'object' && typeof actual === 'object') {
    for (const key of Object.keys(expected).sort()) {
      if (out.length >= 40) break;
      if (!(key in actual)) out.push(`${prefix}.${key}: documented field missing`);
      else semanticCompatibilityDiff(expected[key], actual[key], `${prefix}.${key}`, out);
    }
    return out;
  }

  out.push(`${prefix}: ${JSON.stringify(expected)} -> ${JSON.stringify(actual)}`);
  return out;
}

function publicTypeEntrypoints(pkg: any): string[] {
  const entries = new Set<string>();
  if (typeof pkg.types === 'string') entries.add(pkg.types);
  const visit = (value: any): void => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.types === 'string') entries.add(value.types);
    for (const child of Object.values(value)) visit(child);
  };
  visit(pkg.exports);
  return [...entries].sort();
}

function resolveDeclarationSpecifier(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base];
  if (/\.js$/i.test(base)) candidates.unshift(base.replace(/\.js$/i, '.d.ts'));
  if (/\.cjs$/i.test(base)) candidates.unshift(base.replace(/\.cjs$/i, '.d.cts'));
  if (/\.mjs$/i.test(base)) candidates.unshift(base.replace(/\.mjs$/i, '.d.mts'));
  if (!/\.d\.(?:ts|cts|mts)$/i.test(base)) {
    candidates.push(`${base}.d.ts`, `${base}.d.cts`, `${base}.d.mts`);
    candidates.push(path.join(base, 'index.d.ts'), path.join(base, 'index.d.cts'), path.join(base, 'index.d.mts'));
  }
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function declarationDigest(root: string, pkg: any) {
  const entrypoints = publicTypeEntrypoints(pkg);
  if (!entrypoints.length) throw new Error('package has no exported declaration entrypoints');
  const rootResolved = path.resolve(root);
  const queue = entrypoints.map((entry) => path.resolve(root, entry));
  const files = new Set<string>();
  const sourceByFile = new Map<string, string>();
  while (queue.length) {
    const file = queue.shift()!;
    const normalizedFile = path.resolve(file);
    if (files.has(normalizedFile)) continue;
    if (normalizedFile !== rootResolved && !normalizedFile.startsWith(`${rootResolved}${path.sep}`)) throw new Error(`declaration escaped package root: ${normalizedFile}`);
    if (!fs.existsSync(normalizedFile)) throw new Error(`missing exported declaration: ${path.relative(root, normalizedFile)}`);
    const source = fs.readFileSync(normalizedFile, 'utf8').replace(/\r\n/g, '\n');
    files.add(normalizedFile);
    sourceByFile.set(normalizedFile, source);
    const specs = new Set<string>();
    for (const match of source.matchAll(/(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g)) specs.add(match[1]);
    for (const match of source.matchAll(/\/\/\/\s*<reference\s+path=['"]([^'"]+)['"]/g)) specs.add(match[1]);
    for (const specifier of specs) {
      if (!specifier.startsWith('.')) continue;
      const resolved = resolveDeclarationSpecifier(normalizedFile, specifier);
      if (!resolved) throw new Error(`unresolved relative declaration import ${specifier} from ${path.relative(root, normalizedFile)}`);
      queue.push(resolved);
    }
  }
  const ordered = [...files].sort((a, b) => path.relative(root, a).localeCompare(path.relative(root, b)));
  const h = crypto.createHash('sha256');
  for (const file of ordered) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    h.update(rel); h.update('\0'); h.update(sourceByFile.get(file)!); h.update('\0');
  }
  return {
    sha256: h.digest('hex'),
    entrypoints: entrypoints.map((entry) => entry.replace(/^\.\//, '')),
    files: ordered.map((file) => path.relative(root, file).split(path.sep).join('/')),
  };
}


function semanticPublicSurfaceDigest(root: string, pkg: any) {
  const entrypoints = publicTypeEntrypoints(pkg);
  if (!entrypoints.length) throw new Error('package has no exported declaration entrypoints');
  const rootResolved = path.resolve(root);
  const rootNames = entrypoints.map((entry) => path.resolve(root, entry));
  const program = ts.createProgram({
    rootNames,
    options: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      skipLibCheck: true,
    },
  });
  const checker = program.getTypeChecker();
  const formatFlags =
    ts.TypeFormatFlags.NoTruncation |
    ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
  const symbolDeclaration = (symbol: ts.Symbol | undefined): ts.Declaration | undefined =>
    symbol?.valueDeclaration ?? symbol?.declarations?.[0];
  const insidePackage = (declaration: ts.Declaration | undefined) => {
    if (!declaration) return false;
    const file = path.resolve(declaration.getSourceFile().fileName);
    return file === rootResolved || file.startsWith(`${rootResolved}${path.sep}`);
  };
  const targetSymbol = (symbol: ts.Symbol) =>
    symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const modifierShape = (declaration: ts.Declaration | undefined) => {
    if (!declaration) return [];
    const flags = ts.getCombinedModifierFlags(declaration);
    const out: string[] = [];
    if (flags & ts.ModifierFlags.Public) out.push('public');
    if (flags & ts.ModifierFlags.Protected) out.push('protected');
    if (flags & ts.ModifierFlags.Private) out.push('private');
    if (flags & ts.ModifierFlags.Static) out.push('static');
    if (flags & ts.ModifierFlags.Abstract) out.push('abstract');
    if (flags & ts.ModifierFlags.Readonly) out.push('readonly');
    return out;
  };
  const kindOf = (symbol: ts.Symbol) => {
    const flags = targetSymbol(symbol).flags;
    if (flags & ts.SymbolFlags.Class) return 'class';
    if (flags & ts.SymbolFlags.Interface) return 'interface';
    if (flags & ts.SymbolFlags.TypeAlias) return 'type';
    if (flags & ts.SymbolFlags.Function) return 'function';
    if (flags & ts.SymbolFlags.Enum) return 'enum';
    if (flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.BlockScopedVariable)) return 'variable';
    if (flags & ts.SymbolFlags.Module) return 'namespace';
    return 'symbol';
  };

  const typeShape = (
    type: ts.Type,
    node: ts.Node | undefined,
    depth = 0,
    seen = new Set<string>(),
  ): any => {
    const text = normalize(checker.typeToString(type, node, formatFlags));
    if (depth >= 8) return { text };

    if (type.isUnion()) {
      const variants = type.types.map((item) => typeShape(item, node, depth + 1, new Set(seen)));
      variants.sort((a, b) => JSON.stringify(stable(a)).localeCompare(JSON.stringify(stable(b))));
      return { kind: 'union', text, variants };
    }
    if (type.isIntersection()) {
      const variants = type.types.map((item) => typeShape(item, node, depth + 1, new Set(seen)));
      variants.sort((a, b) => JSON.stringify(stable(a)).localeCompare(JSON.stringify(stable(b))));
      return { kind: 'intersection', text, variants };
    }

    const symbol = type.aliasSymbol ?? type.getSymbol();
    const declaration = symbolDeclaration(symbol);
    const packageOwned = insidePackage(declaration);
    const name = packageOwned && symbol ? symbol.getName() : undefined;
    const cycleKey = packageOwned ? `${name ?? '<anonymous>'}:${text}` : null;
    if (cycleKey && seen.has(cycleKey)) return { kind: 'reference', name, text };
    const nextSeen = new Set(seen);
    if (cycleKey) nextSeen.add(cycleKey);

    if (!(type.flags & ts.TypeFlags.Object)) {
      return { kind: 'value', name, text };
    }

    const signatureShape = (signature: ts.Signature, signatureNode: ts.Node | undefined) => ({
      text: normalize(checker.signatureToString(signature, signatureNode, formatFlags)),
      parameters: signature.getParameters().map((parameter) => {
        const parameterDeclaration = symbolDeclaration(parameter);
        const parameterType = checker.getTypeOfSymbolAtLocation(
          parameter,
          parameterDeclaration ?? signatureNode ?? node ?? program.getSourceFiles()[0],
        );
        return {
          name: parameter.getName(),
          optional: Boolean(parameter.flags & ts.SymbolFlags.Optional),
          modifiers: modifierShape(parameterDeclaration),
          type: typeShape(parameterType, parameterDeclaration, depth + 1, new Set(nextSeen)),
        };
      }),
      returnType: typeShape(signature.getReturnType(), signatureNode, depth + 1, new Set(nextSeen)),
    });

    const properties = type
      .getProperties()
      .filter((property) => insidePackage(symbolDeclaration(property)))
      .sort((a, b) => a.getName().localeCompare(b.getName()))
      .map((property) => {
        const propertyDeclaration = symbolDeclaration(property);
        const propertyType = checker.getTypeOfSymbolAtLocation(
          property,
          propertyDeclaration ?? node ?? program.getSourceFiles()[0],
        );
        return {
          name: property.getName(),
          optional: Boolean(property.flags & ts.SymbolFlags.Optional),
          modifiers: modifierShape(propertyDeclaration),
          type: typeShape(propertyType, propertyDeclaration, depth + 1, new Set(nextSeen)),
        };
      });

    let typeArguments: any[] = [];
    if ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
      typeArguments = checker
        .getTypeArguments(type as ts.TypeReference)
        .map((argument) => typeShape(argument, node, depth + 1, new Set(nextSeen)));
    }

    const calls = type
      .getCallSignatures()
      .map((signature) => signatureShape(signature, signature.declaration));
    const constructs = type
      .getConstructSignatures()
      .map((signature) => signatureShape(signature, signature.declaration));
    const indexes = checker
      .getIndexInfosOfType(type)
      .map((info) => ({
        readonly: info.isReadonly,
        keyType: typeShape(info.keyType, node, depth + 1, new Set(nextSeen)),
        valueType: typeShape(info.type, node, depth + 1, new Set(nextSeen)),
      }));

    return {
      kind: 'object',
      name,
      text,
      typeArguments,
      calls,
      constructs,
      indexes,
      properties,
    };
  };

  const exportShape = (symbol: ts.Symbol) => {
    const target = targetSymbol(symbol);
    const declaration = symbolDeclaration(target) ?? symbolDeclaration(symbol);
    let declaredType: ts.Type | undefined;
    try {
      declaredType = checker.getDeclaredTypeOfSymbol(target);
    } catch {}
    const valueType = declaration
      ? checker.getTypeOfSymbolAtLocation(target, declaration)
      : undefined;
    const namespaceExports = target.exports
      ? [...target.exports.values()].map((item) => item.getName()).sort()
      : [];
    return {
      name: symbol.getName(),
      kind: kindOf(symbol),
      modifiers: modifierShape(declaration),
      valueType: valueType ? typeShape(valueType, declaration) : null,
      declaredType: declaredType ? typeShape(declaredType, declaration) : null,
      namespaceExports,
    };
  };

  const entrypointShapes = entrypoints.map((entry) => {
    const file = path.resolve(root, entry);
    const source = program.getSourceFile(file);
    if (!source) throw new Error(`cannot load public declaration entrypoint ${entry}`);
    const moduleSymbol = checker.getSymbolAtLocation(source);
    if (!moduleSymbol) throw new Error(`cannot resolve public declaration module ${entry}`);
    const exports = checker
      .getExportsOfModule(moduleSymbol)
      .sort((a, b) => a.getName().localeCompare(b.getName()))
      .map(exportShape);
    return { entrypoint: entry.replace(/^\.\//, ''), exports };
  });

  const surface = { entrypoints: entrypointShapes };
  const serialized = JSON.stringify(stable(surface));
  return {
    sha256: hash(Buffer.from(serialized)),
    surface,
  };
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
  const candidateDecl = declarationDigest(candidateRoot, candidatePkg);
  const pinnedDecl = declarationDigest(pinnedRoot, pinnedPkg);
  const candidateSemanticSurface = semanticPublicSurfaceDigest(candidateRoot, candidatePkg);
  const pinnedSemanticSurface = semanticPublicSurfaceDigest(pinnedRoot, pinnedPkg);
  const exportsMatch = JSON.stringify(stable(candidatePkg.exports ?? {})) === JSON.stringify(stable(pinnedPkg.exports ?? {}));
  const rawDeclarationFilesMatch = candidateDecl.sha256 === pinnedDecl.sha256;
  const semanticPublicSurfaceExactMatch = candidateSemanticSurface.sha256 === pinnedSemanticSurface.sha256;
  // The documentation snapshot must remain valid against the current candidate.
  // Additive public API is compatible: it does not invalidate any documented symbol,
  // member or signature. Removed or changed documented API still fails immediately.
  const compatibilityDifferences = semanticCompatibilityDiff(
    pinnedSemanticSurface.surface,
    candidateSemanticSurface.surface,
  );
  const declarationsMatch = compatibilityDifferences.length === 0;
  if (!exportsMatch || !declarationsMatch) {
    throw new Error(`current package public surface breaks the documented artifact: exportsMatch=${exportsMatch} declarationsMatch=${declarationsMatch} rawDeclarationFilesMatch=${rawDeclarationFilesMatch} semanticPublicSurfaceExactMatch=${semanticPublicSurfaceExactMatch} candidateReachableDeclarations=${candidateDecl.files.length} documentedReachableDeclarations=${pinnedDecl.files.length} candidateSemanticSha=${candidateSemanticSurface.sha256} documentedSemanticSha=${pinnedSemanticSurface.sha256}\ncompatibility differences:\n- ${compatibilityDifferences.join('\n- ')}`);
  }

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
    documentedArtifact:{version:pinnedPkg.version,exportsMatch,declarationsMatch,rawDeclarationFilesMatch,semanticPublicSurfaceExactMatch,declarationSha256:pinnedDecl.sha256,semanticPublicSurfaceSha256:pinnedSemanticSurface.sha256,declarationEntrypoints:pinnedDecl.entrypoints,declarationFiles:pinnedDecl.files.length},
    candidatePublicSurface:{exportsMatch,declarationsMatch,rawDeclarationFilesMatch,semanticPublicSurfaceExactMatch,declarationSha256:candidateDecl.sha256,semanticPublicSurfaceSha256:candidateSemanticSurface.sha256,declarationEntrypoints:candidateDecl.entrypoints,declarationFiles:candidateDecl.files.length},
    examples:{total:results.length,passed:results.length,results},
  };
  fs.writeFileSync(path.join(OUT,'package-candidate.json'), `${JSON.stringify(payload,null,2)}\n`);
  console.log(`[DOC-12 package candidate] PASS ${candidatePkg.version} ${packageSha.slice(0,12)}… artifact=${payload.package.artifactSha256.slice(0,12)}… publicDeclarations=${candidateDecl.files.length} examples=${results.length}`);
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
