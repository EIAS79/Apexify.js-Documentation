import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {
  DOMAIN_ORDER,
  PARITY_STATUSES,
  type GapSummary,
  type LegacyStudioEvidence,
  type ParityStatus,
  type PublicSurfaceRecord,
  type RuntimeParityRecord,
  type RuntimeSourcePin,
  type SourceLocation,
} from './model';

type LegacyCapabilityRow = {
  capability: string;
  classification?: string;
  domain?: string;
  editorSection?: string;
  controlSchemaId?: string;
  projectModelField?: string;
  previewRuntimeRoute?: string;
  codegen?: { symbol?: string };
  proofCaseIds?: string[];
  implementationState?: string;
  sourceRoute?: string;
};

type LegacyMatrix = {
  source?: { packagePin?: string | null; totalCapabilities?: number };
  rows?: LegacyCapabilityRow[];
  summary?: {
    totalOptionPaths?: number;
    classifiedOptionPaths?: number;
    unclassifiedOptionPaths?: number;
  };
  optionCoverage?: {
    totalOptionPaths?: number;
    classifiedOptionPaths?: number;
    unclassifiedOptionPaths?: number;
  };
};

type OptionInventory = {
  total?: number;
  options?: Array<{ id?: string; path?: string }>;
};

type SurfaceBuild = {
  record: PublicSurfaceRecord;
  inputRecords: RuntimeParityRecord[];
  outputRecords: RuntimeParityRecord[];
};

const ROOT = process.cwd();
const PHASE = 'STUDIO-PARITY-0' as const;
const DOCS_REPOSITORY = 'EIAS79/Apexify.js-Documentation' as const;
const MAX_TYPE_DEPTH = 14;
const MAX_FACET_DEPTH = 4;

function arg(name: string): string | null {
  const direct = process.argv.find((item) => item.startsWith('--' + name + '='));
  if (direct) return direct.slice(name.length + 3);
  const index = process.argv.indexOf('--' + name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

const CHECK = process.argv.includes('--check');
const pinPath = path.join(ROOT, 'scripts', 'studio', 'parity', 'runtime-source.json');
const pin = JSON.parse(fs.readFileSync(pinPath, 'utf8')) as RuntimeSourcePin;
const runtimeRoot = path.resolve(
  arg('runtime-root') ?? process.env.APEXIFY_RUNTIME_ROOT ?? path.join(ROOT, '..', 'Apexify.js'),
);
const requestedCommit = (
  arg('runtime-commit') ?? process.env.APEXIFY_RUNTIME_COMMIT ?? pin.commit
).trim();
const outDir = path.resolve(
  arg('out') ?? path.join(ROOT, 'generated', 'studio', 'runtime-parity'),
);

if (requestedCommit !== pin.commit) {
  throw new Error(
    '[studio-parity] runtime commit ' + requestedCommit +
      ' does not match pinned STUDIO-PARITY-0 commit ' + pin.commit +
      '. Rebase the parity pin explicitly instead of scanning a moving target.',
  );
}

const sourceRoot = path.join(runtimeRoot, pin.sourceRoot);
if (!fs.existsSync(sourceRoot)) {
  throw new Error(
    '[studio-parity] Apexify runtime source is missing at ' + sourceRoot +
      '. Checkout ' + pin.repository + '@' + pin.commit +
      ' and pass --runtime-root <path>.',
  );
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(?:ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

function fsKey(file: string): string {
  const normalized = path.resolve(file).replaceAll(path.sep, '/');
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

const runtimeRootKey = fsKey(runtimeRoot);
const sourceRootKey = fsKey(sourceRoot);

function isRuntimePath(file: string): boolean {
  return fsKey(file) === runtimeRootKey || fsKey(file).startsWith(runtimeRootKey + '/');
}

function isRuntimeSourcePath(file: string): boolean {
  return fsKey(file) === sourceRootKey || fsKey(file).startsWith(sourceRootKey + '/');
}

function relRuntime(file: string): string {
  return path.relative(runtimeRoot, file).replaceAll(path.sep, '/');
}

function relDocs(file: string): string {
  return path.relative(ROOT, file).replaceAll(path.sep, '/');
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableId(value: string): string {
  return 'parity:' + sha256(value).slice(0, 24);
}

function normalizeToken(value: string): string {
  return value
    .replace(/\[(?:\d+|\*)\]/g, '')
    .replace(/[^A-Za-z0-9_$]+/g, '.')
    .split('.')
    .filter(Boolean)
    .at(-1)
    ?.toLowerCase() ?? '';
}

function domainFor(symbol: string, legacy?: LegacyCapabilityRow): string {
  if (legacy?.domain) {
    const domain = legacy.domain;
    if (domain === 'chart') return 'charts';
    if (domain === 'template' || domain === 'components' || domain === 'assets') {
      return 'templates-components-assets';
    }
    if (domain === 'path' || domain === 'pixels' || domain === 'detect') return 'paths-pixels-detect';
    if (domain === 'gif' || domain === 'animation') return 'gif-animation';
    if (domain === 'plugins' || domain === 'batch-chain') return 'batch-chain-plugins';
    return domain;
  }

  if (/createCanvas/.test(symbol)) return 'canvas';
  if (/createImage/.test(symbol)) return 'image';
  if (/createText|measureText/.test(symbol)) return 'text';
  if (/Chart/.test(symbol)) return 'charts';
  if (/SceneBuilder|createScene|renderScene/.test(symbol)) return 'scene';
  if (/Template|components|assets/.test(symbol)) return 'templates-components-assets';
  if (/path2d|pixels|detect/.test(symbol)) return 'paths-pixels-detect';
  if (/\.image\./.test(symbol)) return 'image-utils';
  if (/GIF|animate/.test(symbol)) return 'gif-animation';
  if (/Audio|createAudio/.test(symbol)) return 'audio';
  if (/Video|video|extractFrame|getVideoInfo/.test(symbol)) return 'video';
  if (/output|outPut|save/.test(symbol)) return 'output';
  if (/batch|chain|plugins|\.use$/.test(symbol)) return 'batch-chain-plugins';
  if (/prepareForRender/.test(symbol)) return 'rendering';
  return 'other';
}

function legacyStatus(row?: LegacyCapabilityRow): ParityStatus {
  if (!row) return 'MISSING';
  if (row.classification === 'hosted-runtime-exclusion') return 'EXCLUDED-WITH-REASON';
  if (row.classification === 'not-applicable') return 'RUNTIME-ONLY';
  // STUDIO-PARITY-0 deliberately refuses to promote old classification/proof claims to FULL.
  return 'PARTIAL';
}

const legacyMatrixPath = path.join(ROOT, 'generated', 'studio', 'visual-capability-matrix.json');
const optionInventoryPath = path.join(ROOT, 'generated', 'docs-doc4', 'option-inventory.json');
const legacyMatrix = readJson<LegacyMatrix>(legacyMatrixPath, {});
const optionInventory = readJson<OptionInventory>(optionInventoryPath, {});
const legacyRows = legacyMatrix.rows ?? [];
const legacyByCapability = new Map(legacyRows.map((row) => [row.capability, row]));

const optionPaths = (optionInventory.options ?? [])
  .map((item) => item.path)
  .filter((item): item is string => typeof item === 'string' && item.length > 0);
const optionPathsByLeaf = new Map<string, string[]>();
for (const item of optionPaths) {
  const key = normalizeToken(item);
  if (!key) continue;
  const list = optionPathsByLeaf.get(key) ?? [];
  list.push(item);
  optionPathsByLeaf.set(key, list);
}

const docsPackage = readJson<{ dependencies?: Record<string, string> }>(
  path.join(ROOT, 'package.json'),
  {},
);
const installedPin = docsPackage.dependencies?.['apexify.js'] ?? null;
const installedPinCommit = /#([0-9a-f]{40})\b/i.exec(installedPin ?? '')?.[1] ?? null;

const runtimePackage = readJson<{ version?: string }>(path.join(runtimeRoot, 'package.json'), {});
const runtimeTsconfig = path.join(runtimeRoot, 'tsconfig.json');
const runtimeConfigRead = ts.readConfigFile(runtimeTsconfig, ts.sys.readFile);
if (runtimeConfigRead.error) {
  throw new Error(
    '[studio-parity] failed to read pinned runtime tsconfig: ' +
      ts.flattenDiagnosticMessageText(runtimeConfigRead.error.messageText, ' '),
  );
}
const parsedRuntimeConfig = ts.parseJsonConfigFileContent(
  runtimeConfigRead.config,
  ts.sys,
  runtimeRoot,
  { noEmit: true, skipLibCheck: true, noUnusedLocals: false, noUnusedParameters: false },
  runtimeTsconfig,
);
const runtimeFiles = parsedRuntimeConfig.fileNames
  .filter((file) => isRuntimeSourcePath(file) && /\.ts$/.test(file) && !/\.d\.ts$/.test(file))
  .sort();
if (!runtimeFiles.length) {
  throw new Error('[studio-parity] pinned runtime tsconfig resolved zero lib-next TypeScript files.');
}
const sourceText = new Map(runtimeFiles.map((file) => [file, fs.readFileSync(file, 'utf8')]));
const sourceTextLower = new Map([...sourceText].map(([file, value]) => [file, value.toLowerCase()]));
const validationCandidateFiles = runtimeFiles.filter((file) =>
  /validat|limit|policy|config|runtime/i.test(relRuntime(file)),
);

const compilerOptions: ts.CompilerOptions = {
  ...parsedRuntimeConfig.options,
  noEmit: true,
  skipLibCheck: true,
  noUnusedLocals: false,
  noUnusedParameters: false,
  typeRoots: [
    path.join(ROOT, 'node_modules', '@types'),
    ...(parsedRuntimeConfig.options.typeRoots ?? []),
  ],
};
const compilerHost = ts.createCompilerHost(compilerOptions, true);
compilerHost.resolveModuleNames = (moduleNames, containingFile) =>
  moduleNames.map((moduleName) => {
    const primary = ts.resolveModuleName(moduleName, containingFile, compilerOptions, ts.sys).resolvedModule;
    if (primary) return primary;
    if (moduleName.startsWith('.') || path.isAbsolute(moduleName)) return undefined;
    // CI checks out Apexify.js beside the Studio repo. Runtime package dependencies are
    // installed in Studio for the scanner, so bare external modules get one deterministic
    // fallback lookup from the Studio root. Internal relative imports never use this fallback.
    return ts.resolveModuleName(
      moduleName,
      path.join(ROOT, '__studio_parity_module_resolution__.ts'),
      compilerOptions,
      ts.sys,
    ).resolvedModule;
  });
const program = ts.createProgram({
  rootNames: runtimeFiles,
  options: compilerOptions,
  host: compilerHost,
});
const checker = program.getTypeChecker();

const runtimeDiagnostics = ts.getPreEmitDiagnostics(program)
  .filter((diagnostic) => diagnostic.file ? isRuntimeSourcePath(diagnostic.file.fileName) : false)
  .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
const unresolvedInternalDiagnostics = runtimeDiagnostics.filter((diagnostic) => {
  const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  return /Cannot find module ['"]\.{1,2}\//i.test(text);
});
if (unresolvedInternalDiagnostics.length) {
  const preview = unresolvedInternalDiagnostics.slice(0, 12).map((diagnostic) => {
    const file = diagnostic.file ? relRuntime(diagnostic.file.fileName) : '<unknown>';
    const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    return file + ': ' + text;
  });
  throw new Error(
    '[studio-parity] internal runtime imports are unresolved; refusing a shallow inventory:\n' +
      preview.join('\n'),
  );
}

const classDeclarations = new Map<string, ts.ClassDeclaration>();
for (const sourceFile of program.getSourceFiles()) {
  if (!isRuntimeSourcePath(sourceFile.fileName)) continue;
  ts.forEachChild(sourceFile, function visit(node) {
    if (ts.isClassDeclaration(node) && node.name) classDeclarations.set(node.name.text, node);
    ts.forEachChild(node, visit);
  });
}

const omissions: string[] = [];
const surfaceBuilds = new Map<string, SurfaceBuild>();
const seenFacetObjects = new Set<string>();

function sourceLocation(node: ts.Node): SourceLocation {
  const file = node.getSourceFile();
  const pos = file.getLineAndCharacterOfPosition(node.getStart(file));
  return {
    file: relRuntime(file.fileName),
    line: pos.line + 1,
    character: pos.character + 1,
  };
}

function hasModifier(node: ts.Node, kind: ts.ModifierSyntaxKind): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  return Boolean(ts.getModifiers(node)?.some((modifier) => modifier.kind === kind));
}

function isPublicMember(node: ts.ClassElement): boolean {
  return !hasModifier(node, ts.SyntaxKind.PrivateKeyword) && !hasModifier(node, ts.SyntaxKind.ProtectedKeyword);
}

function isPublicDeclaration(node: ts.Declaration): boolean {
  if (
    ts.isMethodDeclaration(node) ||
    ts.isPropertyDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  ) {
    return isPublicMember(node);
  }
  return true;
}

function declarationFilesOfSymbol(symbol: ts.Symbol | undefined): string[] {
  if (!symbol) return [];
  return [...new Set(
    (symbol.declarations ?? [])
      .map((decl) => decl.getSourceFile().fileName)
      .filter((file) => isRuntimePath(file))
      .map(relRuntime),
  )].sort();
}

function jsDocDeprecation(symbol: ts.Symbol | undefined): string | null {
  if (!symbol) return null;
  const tag = symbol.getJsDocTags().find((item) => item.name === 'deprecated');
  if (!tag) return null;
  if (!tag.text) return '@deprecated';
  return tag.text.map((part) => part.text).join('').trim() || '@deprecated';
}

function literalValue(type: ts.Type): string | number | boolean | null | undefined {
  if (type.flags & ts.TypeFlags.StringLiteral) return (type as ts.StringLiteralType).value;
  if (type.flags & ts.TypeFlags.NumberLiteral) return (type as ts.NumberLiteralType).value;
  if (type.flags & ts.TypeFlags.BooleanLiteral) return checker.typeToString(type) === 'true';
  if (type.flags & ts.TypeFlags.Null) return null;
  return undefined;
}

function literalValues(type: ts.Type): Array<string | number | boolean | null> {
  const values: Array<string | number | boolean | null> = [];
  const parts = type.isUnion() ? type.types : [type];
  for (const part of parts) {
    const value = literalValue(part);
    if (value !== undefined) values.push(value);
  }
  return [...new Set(values)];
}

function isBuiltinLeaf(type: ts.Type, text = checker.typeToString(type)): boolean {
  const flags = type.flags;
  if (
    flags &
    (
      ts.TypeFlags.StringLike |
      ts.TypeFlags.NumberLike |
      ts.TypeFlags.BooleanLike |
      ts.TypeFlags.BigIntLike |
      ts.TypeFlags.ESSymbolLike |
      ts.TypeFlags.Null |
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Any |
      ts.TypeFlags.Unknown |
      ts.TypeFlags.Never |
      ts.TypeFlags.Void
    )
  ) return true;

  if (/^(?:Buffer|Uint8Array|ArrayBuffer|Date|RegExp|URL|AbortSignal|Function|unknown|any|never|void)(?:\b|<)/.test(text)) {
    return true;
  }
  if (type.getCallSignatures().length > 0 && type.getProperties().length === 0) return true;
  return false;
}

function arrayElement(type: ts.Type): ts.Type | null {
  if (!checker.isArrayType(type)) return null;
  const args = checker.getTypeArguments(type as ts.TypeReference);
  return args[0] ?? null;
}

function unwrapPromise(type: ts.Type): ts.Type {
  const symbolName = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName();
  if (symbolName !== 'Promise') return type;
  const args = checker.getTypeArguments(type as ts.TypeReference);
  return args[0] ?? type;
}

function validationFilesFor(leaf: string): string[] {
  if (!leaf || leaf.length < 2) return [];
  const lower = leaf.toLowerCase();
  return validationCandidateFiles
    .filter((file) => sourceTextLower.get(file)?.includes(lower))
    .slice(0, 12)
    .map(relRuntime);
}

function implementationFilesFor(member: string, primary: string): string[] {
  const results = new Set<string>([primary]);
  if (member.length >= 3) {
    for (const file of runtimeFiles) {
      if (results.size >= 12) break;
      if (sourceText.get(file)?.includes(member)) results.add(relRuntime(file));
    }
  }
  return [...results].sort();
}

function legacyEvidence(publicSymbol: string, leaf?: string): LegacyStudioEvidence {
  const row = legacyByCapability.get(publicSymbol);
  const matches = leaf ? (optionPathsByLeaf.get(normalizeToken(leaf)) ?? []).slice(0, 20) : [];
  return {
    capabilityRowFound: Boolean(row),
    capabilityClassification: row?.classification,
    implementationState: row?.implementationState,
    editorSection: row?.editorSection,
    controlSchemaId: row?.controlSchemaId,
    projectModelField: row?.projectModelField,
    previewRuntimeRoute: row?.previewRuntimeRoute,
    codegenSymbol: row?.codegen?.symbol,
    proofCaseIds: row?.proofCaseIds ?? [],
    legacyOptionInventoryMatches: matches,
  };
}

function studioFields(publicSymbol: string, leaf: string) {
  const evidence = legacyEvidence(publicSymbol, leaf);
  const claimed = evidence.capabilityRowFound ? 'claimed' as const : 'unknown' as const;
  const excluded =
    evidence.capabilityClassification === 'not-applicable' ||
    evidence.capabilityClassification === 'hosted-runtime-exclusion';
  return {
    modelPath: evidence.projectModelField ?? null,
    controlId: evidence.controlSchemaId ?? null,
    controlSurface: evidence.editorSection ?? null,
    visualValidation: null,
    previewRoute: evidence.previewRuntimeRoute ?? null,
    codegenMapping: evidence.codegenSymbol ?? null,
    visualToCode: excluded ? 'not-applicable' as const : claimed,
    codeToVisual: excluded ? 'not-applicable' as const : claimed,
    undoRedo: excluded ? 'not-applicable' as const : claimed,
    persistence: excluded ? 'not-applicable' as const : claimed,
    export: excluded ? 'not-applicable' as const : claimed,
    proofIds: evidence.proofCaseIds ?? [],
  };
}

function displayType(type: ts.Type): string {
  const symbol = type.aliasSymbol ?? type.getSymbol();
  const name = symbol?.getName();
  if (name && !/^__/.test(name)) return name;
  const text = checker.typeToString(type, undefined, ts.TypeFormatFlags.None);
  return text.length <= 512 ? text : text.slice(0, 509) + '...';
}

function makeParityRecord(args: {
  publicSymbol: string;
  optionPath: string;
  direction: 'input' | 'output';
  parentType: string | null;
  type: ts.Type;
  unionVariant?: string | null;
  sourceFiles: string[];
  implementationFiles: string[];
  symbol?: ts.Symbol;
  status: ParityStatus;
  notes?: string[];
}): RuntimeParityRecord {
  const leaf = normalizeToken(args.optionPath);
  const acceptedValues = literalValues(args.type);
  const deprecation = jsDocDeprecation(args.symbol);
  const validationFiles = validationFilesFor(leaf);
  const evidence = legacyEvidence(args.publicSymbol, leaf);
  const hasLeafEvidence = Boolean(evidence.legacyOptionInventoryMatches?.length);
  let recordStatus = args.status;
  if (recordStatus === 'PARTIAL' && !hasLeafEvidence) recordStatus = 'UNKNOWN';
  const notes = [...(args.notes ?? [])];
  if (!validationFiles.length) notes.push('VALIDATION_AUDIT_PENDING');
  if (!hasLeafEvidence && evidence.capabilityRowFound) notes.push('CAPABILITY_EVIDENCE_ONLY_LEAF_UNPROVEN');
  if (!evidence.capabilityRowFound) notes.push('LEGACY_CAPABILITY_ROW_ABSENT');

  return {
    id: stableId([
      args.publicSymbol,
      args.direction,
      args.optionPath,
      args.unionVariant ?? '',
      checker.typeToString(args.type),
    ].join('|')),
    publicSymbol: args.publicSymbol,
    optionPath: args.optionPath,
    direction: args.direction,
    parentType: args.parentType,
    leafType: displayType(args.type),
    unionVariant: args.unionVariant ?? null,
    sourceFiles: [...new Set(args.sourceFiles)].sort(),
    implementationFiles: [...new Set(args.implementationFiles)].sort(),
    validationFiles,
    runtimeDefault: null,
    acceptedValues,
    constraints: [],
    deprecation,
    runtimeInteractions: [],
    resourceLimits: [],
    runtimeSupport: {
      node: 'supported',
      browser: 'unknown',
    },
    studio: studioFields(args.publicSymbol, leaf),
    status: deprecation && recordStatus === 'PARTIAL' ? 'DEPRECATED-COMPAT' : recordStatus,
    notes,
  };
}

function isRuntimeClassType(type: ts.Type): boolean {
  const symbol = type.aliasSymbol ?? type.getSymbol();
  return Boolean(
    symbol?.declarations?.some(
      (decl) =>
        isRuntimePath(decl.getSourceFile().fileName) &&
        ts.isClassDeclaration(decl),
    ),
  );
}

function semanticTypeKey(type: ts.Type, typeText: string): string {
  const symbol = type.aliasSymbol ?? type.getSymbol();
  const declaration = symbol?.declarations?.[0];
  if (symbol && declaration) {
    const file = declaration.getSourceFile().fileName;
    const location = declaration.getStart(declaration.getSourceFile());
    return 'symbol:' + symbol.getName() + '@' + file + ':' + location;
  }
  return 'type:' + typeText;
}

function walkType(args: {
  publicSymbol: string;
  optionPath: string;
  direction: 'input' | 'output';
  type: ts.Type;
  parentType: string | null;
  symbol?: ts.Symbol;
  sourceFiles: string[];
  implementationFiles: string[];
  status: ParityStatus;
  records: RuntimeParityRecord[];
  ancestry: Set<string>;
  depth: number;
  unionVariant?: string | null;
}): void {
  let type = args.type;
  if (args.direction === 'output') type = unwrapPromise(type);

  if (args.depth > MAX_TYPE_DEPTH) {
    args.records.push(makeParityRecord({
      ...args,
      type,
      notes: ['MAX_RECURSIVE_DEPTH_MANUAL_AUDIT'],
      status: 'BLOCKED',
    }));
    return;
  }

  const typeText = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
  if (isBuiltinLeaf(type, typeText)) {
    args.records.push(makeParityRecord({ ...args, type }));
    return;
  }

  if (isRuntimeClassType(type)) {
    args.records.push(makeParityRecord({
      ...args,
      type,
      notes: ['RUNTIME_HANDLE_MEMBERS_SCANNED_SEPARATELY'],
    }));
    return;
  }

  const semanticKey = semanticTypeKey(type, typeText);
  if (args.ancestry.has(semanticKey)) {
    args.records.push(makeParityRecord({
      ...args,
      type,
      notes: ['RECURSIVE_TYPE_REFERENCE'],
    }));
    return;
  }
  const nextAncestry = new Set(args.ancestry);
  nextAncestry.add(semanticKey);

  if (checker.isTupleType(type)) {
    const tupleItems = checker.getTypeArguments(type as ts.TypeReference);
    if (!tupleItems.length) {
      args.records.push(makeParityRecord({ ...args, type }));
      return;
    }
    tupleItems.forEach((tupleType, index) => {
      walkType({
        ...args,
        optionPath: args.optionPath + '[' + index + ']',
        type: tupleType,
        parentType: displayType(type),
        depth: args.depth + 1,
        ancestry: nextAncestry,
      });
    });
    return;
  }

  const element = arrayElement(type);
  if (element) {
    walkType({
      ...args,
      optionPath: args.optionPath + '[]',
      type: element,
      parentType: displayType(type),
      depth: args.depth + 1,
      ancestry: nextAncestry,
    });
    return;
  }

  if (type.isUnion()) {
    const values = literalValues(type);
    if (values.length === type.types.length) {
      args.records.push(makeParityRecord({ ...args, type }));
      return;
    }

    for (const part of type.types) {
      const variantText = displayType(part);
      if (isBuiltinLeaf(part)) {
        args.records.push(makeParityRecord({
          ...args,
          type: part,
          unionVariant: variantText,
          notes: ['DISCRETE_UNION_VARIANT'],
        }));
        continue;
      }
      // Structural variants are represented by their variant-tagged recursive leaves.
      // This avoids storing both a giant object-union marker and the same semantic tree.
      walkType({
        ...args,
        type: part,
        parentType: displayType(type),
        unionVariant: variantText,
        depth: args.depth + 1,
        ancestry: nextAncestry,
      });
    }
    return;
  }

  if (!typeBelongsToRuntime(type)) {
    args.records.push(makeParityRecord({
      ...args,
      type,
      notes: ['EXTERNAL_PLATFORM_TYPE_BOUNDARY'],
    }));
    return;
  }

  const properties = checker.getPropertiesOfType(type);
  const indexInfos = checker.getIndexInfosOfType(type);
  if (!properties.length && !indexInfos.length) {
    args.records.push(makeParityRecord({ ...args, type }));
    return;
  }

  for (const prop of properties) {
    const decl = prop.valueDeclaration ?? prop.declarations?.[0];
    if (!decl) {
      args.records.push(makeParityRecord({
        ...args,
        optionPath: args.optionPath + '.' + prop.getName(),
        type: checker.getDeclaredTypeOfSymbol(prop),
        symbol: prop,
        parentType: displayType(type),
        notes: ['SOURCE_DECLARATION_MANUAL_AUDIT'],
      }));
      continue;
    }

    const propType = checker.getTypeOfSymbolAtLocation(prop, decl);
    const sourceFiles = [...new Set([...args.sourceFiles, ...declarationFilesOfSymbol(prop)])];
    walkType({
      ...args,
      optionPath: args.optionPath + '.' + prop.getName(),
      type: propType,
      symbol: prop,
      parentType: displayType(type),
      sourceFiles,
      ancestry: nextAncestry,
      depth: args.depth + 1,
    });
  }

  for (const info of indexInfos) {
    walkType({
      ...args,
      optionPath: args.optionPath + '[*]',
      type: info.type,
      parentType: displayType(type),
      ancestry: nextAncestry,
      depth: args.depth + 1,
    });
  }
}

function capabilityStatus(symbol: string): ParityStatus {
  return legacyStatus(legacyByCapability.get(symbol));
}

function mergeUniqueRecords(
  target: RuntimeParityRecord[],
  incoming: RuntimeParityRecord[],
): void {
  const ids = new Set(target.map((record) => record.id));
  for (const record of incoming) {
    if (!ids.has(record.id)) {
      target.push(record);
      ids.add(record.id);
    }
  }
}

function addSurface(args: {
  owner: string;
  publicSymbol: string;
  member: string;
  kind: PublicSurfaceRecord['kind'];
  declaration: ts.Declaration;
  signature: ts.Signature;
  status?: ParityStatus;
}): void {
  const legacy = legacyByCapability.get(args.publicSymbol);
  const status = args.status ?? capabilityStatus(args.publicSymbol);
  const source = sourceLocation(args.declaration);
  const implementationFiles = implementationFilesFor(args.member, source.file);
  const inputRecords: RuntimeParityRecord[] = [];
  const outputRecords: RuntimeParityRecord[] = [];
  const signatureText = checker.signatureToString(
    args.signature,
    args.declaration,
    ts.TypeFormatFlags.NoTruncation,
  );

  for (const parameter of args.signature.parameters) {
    const decl = parameter.valueDeclaration ?? parameter.declarations?.[0];
    if (!decl) continue;
    const parameterType = checker.getTypeOfSymbolAtLocation(parameter, decl);
    const sourceFiles = declarationFilesOfSymbol(parameter);
    walkType({
      publicSymbol: args.publicSymbol,
      optionPath: args.publicSymbol + '.' + parameter.getName(),
      direction: 'input',
      type: parameterType,
      parentType: null,
      symbol: parameter,
      sourceFiles,
      implementationFiles,
      status,
      records: inputRecords,
      ancestry: new Set(),
      depth: 0,
    });
  }

  const returnType = checker.getReturnTypeOfSignature(args.signature);
  walkType({
    publicSymbol: args.publicSymbol,
    optionPath: args.publicSymbol + '.return',
    direction: 'output',
    type: returnType,
    parentType: null,
    sourceFiles: declarationFilesOfSymbol(returnType.aliasSymbol ?? returnType.getSymbol()),
    implementationFiles,
    status,
    records: outputRecords,
    ancestry: new Set(),
    depth: 0,
  });

  const existing = surfaceBuilds.get(args.publicSymbol);
  if (existing) {
    mergeUniqueRecords(existing.inputRecords, inputRecords);
    mergeUniqueRecords(existing.outputRecords, outputRecords);
    existing.record.inputRecordCount = existing.inputRecords.length;
    existing.record.outputRecordCount = existing.outputRecords.length;
    const signatures = new Set(existing.record.signature.split('\nOVERLOAD: '));
    if (!signatures.has(signatureText)) {
      existing.record.signature += '\nOVERLOAD: ' + signatureText;
    }
    for (const file of implementationFiles) {
      if (!existing.record.implementationFiles.includes(file)) existing.record.implementationFiles.push(file);
    }
    existing.record.implementationFiles.sort();
    return;
  }

  const record: PublicSurfaceRecord = {
    id: stableId(args.publicSymbol),
    publicSymbol: args.publicSymbol,
    owner: args.owner,
    member: args.member,
    kind: args.kind,
    domain: domainFor(args.publicSymbol, legacy),
    signature: signatureText,
    source,
    implementationFiles,
    validationFiles: validationFilesFor(args.member),
    inputRecordCount: inputRecords.length,
    outputRecordCount: outputRecords.length,
    legacyStudio: legacyEvidence(args.publicSymbol),
    status,
    notes: legacy
      ? ['legacy Studio row imported as evidence only; old implementation/classification does not satisfy FULL']
      : ['no matching legacy Studio capability row'],
  };

  surfaceBuilds.set(args.publicSymbol, { record, inputRecords, outputRecords });
}

function addPropertySurface(args: {
  owner: string;
  publicSymbol: string;
  member: string;
  kind: 'property' | 'getter';
  declaration: ts.Declaration;
  type: ts.Type;
  status?: ParityStatus;
}): void {
  if (surfaceBuilds.has(args.publicSymbol)) return;
  const legacy = legacyByCapability.get(args.publicSymbol);
  const status = args.status ?? capabilityStatus(args.publicSymbol);
  const source = sourceLocation(args.declaration);
  const implementationFiles = implementationFilesFor(args.member, source.file);
  const outputRecords: RuntimeParityRecord[] = [];

  walkType({
    publicSymbol: args.publicSymbol,
    optionPath: args.publicSymbol + '.value',
    direction: 'output',
    type: args.type,
    parentType: null,
    sourceFiles: declarationFilesOfSymbol(args.type.aliasSymbol ?? args.type.getSymbol()),
    implementationFiles,
    status,
    records: outputRecords,
    ancestry: new Set(),
    depth: 0,
  });

  const record: PublicSurfaceRecord = {
    id: stableId(args.publicSymbol),
    publicSymbol: args.publicSymbol,
    owner: args.owner,
    member: args.member,
    kind: args.kind,
    domain: domainFor(args.publicSymbol, legacy),
    signature: checker.typeToString(args.type, args.declaration, ts.TypeFormatFlags.NoTruncation),
    source,
    implementationFiles,
    validationFiles: validationFilesFor(args.member),
    inputRecordCount: 0,
    outputRecordCount: outputRecords.length,
    legacyStudio: legacyEvidence(args.publicSymbol),
    status,
    notes: legacy
      ? ['legacy Studio row imported as evidence only; old implementation/classification does not satisfy FULL']
      : ['public property/getter has no matching legacy Studio capability row'],
  };

  surfaceBuilds.set(args.publicSymbol, { record, inputRecords: [], outputRecords });
}

function publicCallSignatures(type: ts.Type): readonly ts.Signature[] {
  return type.getCallSignatures();
}

function typeBelongsToRuntime(type: ts.Type): boolean {
  const symbol = type.aliasSymbol ?? type.getSymbol();
  return Boolean(symbol?.declarations?.some((decl) => isRuntimePath(decl.getSourceFile().fileName)));
}

function enumerateFacetType(
  owner: string,
  prefix: string,
  type: ts.Type,
  depth: number,
): void {
  if (depth > MAX_FACET_DEPTH) return;
  const typeText = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
  const key = prefix + '|' + typeText;
  if (seenFacetObjects.has(key)) return;
  seenFacetObjects.add(key);

  for (const prop of checker.getPropertiesOfType(type)) {
    const decl = prop.valueDeclaration ?? prop.declarations?.[0];
    if (!decl || !isPublicDeclaration(decl)) continue;
    const propType = checker.getTypeOfSymbolAtLocation(prop, decl);
    const symbol = prefix + '.' + prop.getName();
    const calls = publicCallSignatures(propType);

    if (calls.length) {
      for (const signature of calls) {
        addSurface({
          owner,
          publicSymbol: symbol,
          member: prop.getName(),
          kind: 'facet-method',
          declaration: decl,
          signature,
        });
      }
      continue;
    }

    addPropertySurface({
      owner,
      publicSymbol: symbol,
      member: prop.getName(),
      kind: 'property',
      declaration: decl,
      type: propType,
    });

    if (
      depth < MAX_FACET_DEPTH &&
      typeBelongsToRuntime(propType) &&
      !isBuiltinLeaf(propType) &&
      !checker.isArrayType(propType)
    ) {
      enumerateFacetType(owner, symbol, propType, depth + 1);
    }
  }
}

function enumerateClass(className: string, prefix = className): void {
  const declaration = classDeclarations.get(className);
  if (!declaration) {
    omissions.push('missing public root class: ' + className);
    return;
  }

  const classType = checker.getTypeAtLocation(declaration);
  for (const member of declaration.members) {
    if (!isPublicMember(member) || ts.isConstructorDeclaration(member)) continue;
    const nameNode = (member as ts.MethodDeclaration | ts.PropertyDeclaration | ts.GetAccessorDeclaration).name;
    if (!nameNode) continue;
    const memberName = nameNode.getText(declaration.getSourceFile()).replace(/^['"]|['"]$/g, '');
    if (!memberName || memberName.startsWith('#')) continue;

    if (ts.isMethodDeclaration(member)) {
      const signature = checker.getSignatureFromDeclaration(member);
      if (!signature) {
        omissions.push(prefix + '.' + memberName + ': method signature unavailable');
        continue;
      }
      addSurface({
        owner: className,
        publicSymbol: prefix + '.' + memberName,
        member: memberName,
        kind: hasModifier(member, ts.SyntaxKind.StaticKeyword) ? 'static-method' : 'method',
        declaration: member,
        signature,
      });
      continue;
    }

    if (ts.isGetAccessorDeclaration(member)) {
      const memberType = checker.getTypeAtLocation(member);
      addPropertySurface({
        owner: className,
        publicSymbol: prefix + '.' + memberName,
        member: memberName,
        kind: 'getter',
        declaration: member,
        type: memberType,
      });
      if (typeBelongsToRuntime(memberType)) {
        enumerateFacetType(className, prefix + '.' + memberName, memberType, 0);
      }
      continue;
    }

    if (ts.isPropertyDeclaration(member)) {
      const memberType = checker.getTypeAtLocation(member);
      const calls = publicCallSignatures(memberType);
      if (calls.length) {
        for (const signature of calls) {
          addSurface({
            owner: className,
            publicSymbol: prefix + '.' + memberName,
            member: memberName,
            kind: 'facet-method',
            declaration: member,
            signature,
          });
        }
      } else {
        addPropertySurface({
          owner: className,
          publicSymbol: prefix + '.' + memberName,
          member: memberName,
          kind: 'property',
          declaration: member,
          type: memberType,
        });
        if (typeBelongsToRuntime(memberType)) {
          enumerateFacetType(className, prefix + '.' + memberName, memberType, 0);
        }
      }
    }
  }

  // Catch interface/class members that TypeScript exposes on the type but that are not written directly
  // in the declaration body (for example inherited public members).
  for (const prop of checker.getPropertiesOfType(classType)) {
    const symbol = prefix + '.' + prop.getName();
    if (surfaceBuilds.has(symbol)) continue;
    const decl = prop.valueDeclaration ?? prop.declarations?.[0];
    if (!decl || !isRuntimePath(decl.getSourceFile().fileName)) continue;
    const propType = checker.getTypeOfSymbolAtLocation(prop, decl);
    const calls = propType.getCallSignatures();
    if (calls.length) {
      for (const signature of calls) {
        addSurface({
          owner: className,
          publicSymbol: symbol,
          member: prop.getName(),
          kind: 'method',
          declaration: decl,
          signature,
        });
      }
    }
  }
}

enumerateClass('ApexPainter');

// These returned/public builder types are part of Studio's authorable surface even when users reach them
// through ApexPainter methods instead of root package exports.
for (const rootClass of ['SceneBuilder', 'TemplateHandle', 'VideoPipeline', 'VideoOperations', 'VideoCreator']) {
  if (classDeclarations.has(rootClass)) enumerateClass(rootClass);
}

if (!classDeclarations.has('ApexPainter')) {
  throw new Error('[studio-parity] ApexPainter was not found in pinned runtime source.');
}

const surfaces = [...surfaceBuilds.values()]
  .map((build) => build.record)
  .sort((a, b) => a.publicSymbol.localeCompare(b.publicSymbol));

const records = [...surfaceBuilds.values()]
  .flatMap((build) => [...build.inputRecords, ...build.outputRecords])
  .sort((a, b) =>
    a.publicSymbol.localeCompare(b.publicSymbol) ||
    a.optionPath.localeCompare(b.optionPath) ||
    a.direction.localeCompare(b.direction) ||
    (a.unionVariant ?? '').localeCompare(b.unionVariant ?? ''),
  );

type DeepInventoryRequirement = {
  symbol: string;
  minInputRecords: number;
  requiredPathFragments: string[];
};

const deepInventoryRequirements: DeepInventoryRequirement[] = [
  {
    symbol: 'ApexPainter.createCanvas',
    minInputRecords: 50,
    requiredPathFragments: [
      '.canvas.customBg.filters',
      '.canvas.videoBg',
      '.canvas.bgLayers',
      '.canvas.zoom.scale',
      '.canvas.stroke',
      '.canvas.shadow',
    ],
  },
  {
    symbol: 'ApexPainter.createImage',
    minInputRecords: 60,
    requiredPathFragments: [
      '.images',
      '.distortion',
      '.meshWarp',
      '.effects',
      '.filters',
      '.groupTransform',
    ],
  },
  {
    symbol: 'ApexPainter.createText',
    minInputRecords: 25,
    requiredPathFragments: [
      '.textArray',
      '.font',
      '.shadow',
    ],
  },
];

const deepTypeFailures: string[] = [];
for (const requirement of deepInventoryRequirements) {
  const input = records.filter(
    (record) => record.publicSymbol === requirement.symbol && record.direction === 'input',
  );
  if (input.length < requirement.minInputRecords) {
    deepTypeFailures.push(
      requirement.symbol + ': expected at least ' + requirement.minInputRecords +
        ' recursive input records, found ' + input.length,
    );
  }
  for (const fragment of requirement.requiredPathFragments) {
    if (!input.some((record) => record.optionPath.includes(fragment))) {
      deepTypeFailures.push(requirement.symbol + ': missing recursive path fragment ' + fragment);
    }
  }
}

const runtimeSurfaceSymbols = new Set(surfaces.map((surface) => surface.publicSymbol));
const runtimeSourceCorpus = [...sourceText.values()].join('\n');
const reconciliationLegacy = legacyRows.map((row) => {
  if (runtimeSurfaceSymbols.has(row.capability)) {
    return {
      capability: row.capability,
      result: 'exact-current-runtime-surface',
      runtimeSymbol: row.capability,
      reason: 'Exact public symbol exists in the pinned runtime inventory.',
    };
  }

  const codegenSymbol = row.codegen?.symbol;
  if (codegenSymbol && runtimeSurfaceSymbols.has(codegenSymbol)) {
    return {
      capability: row.capability,
      result: 'legacy-alias-to-current-runtime-surface',
      runtimeSymbol: codegenSymbol,
      reason: 'Legacy capability maps to its recorded codegen symbol, which exists in the pinned runtime.',
    };
  }

  if (row.classification === 'hosted-runtime-exclusion') {
    return {
      capability: row.capability,
      result: 'intentional-hosted-exclusion',
      runtimeSymbol: null,
      reason: 'Legacy matrix explicitly classifies this capability as a hosted-runtime exclusion.',
    };
  }

  if (row.classification === 'not-applicable' || row.sourceRoute === 'introspection') {
    return {
      capability: row.capability,
      result: 'legacy-introspection-or-nonauthorable',
      runtimeSymbol: null,
      reason: 'Legacy matrix explicitly classifies this row as introspection/not-applicable rather than an authorable runtime operation.',
    };
  }

  const leaf = row.capability.split('.').at(-1) ?? row.capability;
  const suffixMatches = surfaces
    .filter((surface) => surface.publicSymbol.endsWith('.' + leaf))
    .map((surface) => surface.publicSymbol)
    .slice(0, 12);
  if (suffixMatches.length) {
    return {
      capability: row.capability,
      result: 'public-name-drift-or-reachable-alias',
      runtimeSymbol: suffixMatches[0] ?? null,
      candidates: suffixMatches,
      reason: 'The legacy leaf still exists on the pinned public runtime, but under a different reachable symbol path.',
    };
  }

  if (!runtimeSourceCorpus.includes(leaf)) {
    return {
      capability: row.capability,
      result: 'removed-from-current-runtime',
      runtimeSymbol: null,
      reason: 'The legacy capability leaf is absent from the pinned runtime source corpus.',
    };
  }

  return {
    capability: row.capability,
    result: 'legacy-row-not-current-public-surface',
    runtimeSymbol: null,
    reason: 'The capability leaf exists somewhere in implementation source but is not exposed by the pinned public/reachable runtime surface scanner.',
  };
});

const exactLegacyCapabilities = new Set(
  reconciliationLegacy
    .filter((item) => item.result === 'exact-current-runtime-surface')
    .map((item) => item.capability),
);
const aliasRuntimeSymbols = new Set(
  reconciliationLegacy
    .map((item) => item.runtimeSymbol)
    .filter((item): item is string => Boolean(item)),
);
const reconciliationRuntimeOnly = surfaces
  .filter(
    (surface) =>
      !exactLegacyCapabilities.has(surface.publicSymbol) &&
      !aliasRuntimeSymbols.has(surface.publicSymbol),
  )
  .map((surface) => ({
    runtimeSymbol: surface.publicSymbol,
    kind: surface.kind,
    domain: surface.domain,
    result:
      surface.kind === 'property' || surface.kind === 'getter'
        ? 'current-runtime-property-not-modeled-as-legacy-capability'
        : 'current-runtime-surface-missing-from-legacy-matrix',
    reason:
      surface.kind === 'property' || surface.kind === 'getter'
        ? 'Pinned runtime exposes this readable property/getter; the old capability matrix did not model it as an executable capability row.'
        : 'Pinned runtime exposes this callable surface, but the old capability matrix contains no exact or codegen-alias row for it.',
  }));

const reconciliationCounts = {
  legacyRows: legacyRows.length,
  runtimeSurfaces: surfaces.length,
  exactMatches: reconciliationLegacy.filter((item) => item.result === 'exact-current-runtime-surface').length,
  aliasMatches: reconciliationLegacy.filter((item) => item.result === 'legacy-alias-to-current-runtime-surface').length,
  intentionalHostedExclusions: reconciliationLegacy.filter((item) => item.result === 'intentional-hosted-exclusion').length,
  introspectionOrNonauthorable: reconciliationLegacy.filter((item) => item.result === 'legacy-introspection-or-nonauthorable').length,
  publicNameDriftOrReachableAlias: reconciliationLegacy.filter((item) => item.result === 'public-name-drift-or-reachable-alias').length,
  removedFromCurrentRuntime: reconciliationLegacy.filter((item) => item.result === 'removed-from-current-runtime').length,
  legacyNotCurrentPublicSurface: reconciliationLegacy.filter((item) => item.result === 'legacy-row-not-current-public-surface').length,
  runtimeOnly: reconciliationRuntimeOnly.length,
};
const surfaceReconciliationComplete =
  reconciliationLegacy.length === legacyRows.length &&
  reconciliationRuntimeOnly.every((item) => item.reason.length > 0) &&
  reconciliationLegacy.every((item) => item.reason.length > 0);
const surfaceReconciliationArtifact = {
  schemaVersion: 1,
  phase: PHASE,
  runtime: {
    repository: pin.repository,
    commit: pin.commit,
  },
  policy: 'Every old-matrix/runtime-surface discrepancy receives a source-backed category; no count difference is treated as completeness evidence.',
  summary: reconciliationCounts,
  legacy: reconciliationLegacy,
  runtimeOnly: reconciliationRuntimeOnly,
};

const statusCounts = Object.fromEntries(PARITY_STATUSES.map((status) => [status, 0])) as Record<ParityStatus, number>;
for (const surface of surfaces) statusCounts[surface.status] += 1;
for (const record of records) statusCounts[record.status] += 1;

const domains: GapSummary['domains'] = {};
for (const domain of DOMAIN_ORDER) {
  const domainSurfaces = surfaces.filter((surface) => surface.domain === domain);
  const domainSymbols = new Set(domainSurfaces.map((surface) => surface.publicSymbol));
  const domainRecords = records.filter((record) => domainSymbols.has(record.publicSymbol));
  if (!domainSurfaces.length && !domainRecords.length) continue;
  const counts: Partial<Record<ParityStatus, number>> = {};
  for (const item of [...domainSurfaces, ...domainRecords]) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  domains[domain] = {
    surfaces: domainSurfaces.length,
    records: domainRecords.length,
    status: counts,
  };
}

const drift: GapSummary['drift'] = [];
if (installedPinCommit !== pin.commit) {
  drift.push({
    code: 'PARITY-RUNTIME-PIN-DRIFT',
    severity: 'error',
    message:
      'Studio package dependency is pinned to ' + String(installedPinCommit) +
      ' while STUDIO-PARITY-0 audits runtime ' + pin.commit + '.',
  });
}
if ((legacyMatrix.source?.packagePin ?? null) !== installedPin) {
  drift.push({
    code: 'PARITY-LEGACY-MATRIX-PIN-DRIFT',
    severity: 'warning',
    message: 'Legacy visual capability matrix package pin does not match package.json dependency pin.',
  });
}
if (deepTypeFailures.length) {
  drift.push({
    code: 'PARITY-DEEP-TYPE-RESOLUTION',
    severity: 'error',
    message: deepTypeFailures.join(' | '),
  });
}
drift.push({
  code: 'PARITY-SURFACE-RECONCILIATION',
  severity: reconciliationCounts.runtimeOnly || reconciliationCounts.legacyNotCurrentPublicSurface || reconciliationCounts.removedFromCurrentRuntime ? 'warning' : 'info',
  message:
    'Legacy/runtime surface audit: ' +
    reconciliationCounts.exactMatches + ' exact, ' +
    reconciliationCounts.aliasMatches + ' alias, ' +
    reconciliationCounts.publicNameDriftOrReachableAlias + ' name-drift, ' +
    reconciliationCounts.removedFromCurrentRuntime + ' removed, ' +
    reconciliationCounts.legacyNotCurrentPublicSurface + ' legacy non-public, ' +
    reconciliationCounts.runtimeOnly + ' runtime-only.',
});
drift.push({
  code: 'PARITY-LEGACY-COMPLETE-NOT-PROOF',
  severity: 'warning',
  message:
    'Legacy capability/option classification is imported only as evidence. No old implemented/classified row is promoted to FULL.',
});

const gapSummary: GapSummary = {
  schemaVersion: 1,
  phase: PHASE,
  runtime: {
    repository: pin.repository,
    commit: pin.commit,
    packageVersion: runtimePackage.version ?? null,
  },
  studio: {
    repository: DOCS_REPOSITORY,
    // Generated parity evidence must be identical on push, PR merge refs, and local runs.
    // The Studio branch/head SHA belongs in the phase report, not in deterministic artifacts.
    commit: null,
    installedApexifyPin: installedPin,
    installedPinCommit,
    runtimePinMatchesInstalledPackage: installedPinCommit === pin.commit,
  },
  counts: {
    publicSurfaces: surfaces.length,
    recursiveRecords: records.length,
    inputRecords: records.filter((record) => record.direction === 'input').length,
    outputRecords: records.filter((record) => record.direction === 'output').length,
    unionVariants: records.filter((record) => record.unionVariant !== null).length,
    status: statusCounts,
    legacyCapabilities: legacyRows.length,
    legacyOptionPaths:
      legacyMatrix.optionCoverage?.totalOptionPaths ??
      legacyMatrix.summary?.totalOptionPaths ??
      optionPaths.length,
    legacyUnclassifiedOptionPaths:
      legacyMatrix.optionCoverage?.unclassifiedOptionPaths ??
      legacyMatrix.summary?.unclassifiedOptionPaths ??
      0,
  },
  drift,
  domains,
  gates: {
    deterministicSourcePin: requestedCommit === pin.commit,
    runtimeSourceReadable: fs.existsSync(sourceRoot),
    apexPainterFound: classDeclarations.has('ApexPainter'),
    zeroSilentPublicSurfaceOmissions: omissions.length === 0,
    deepRecursiveTypeResolution: deepTypeFailures.length === 0,
    surfaceReconciliationComplete,
    noBootstrapFullClaims: statusCounts.FULL === 0,
    everyRecordHasStatus: [...surfaces, ...records].every((item) => PARITY_STATUSES.includes(item.status)),
    baselineComplete: false,
  },
};
gapSummary.gates.baselineComplete = Object.entries(gapSummary.gates)
  .filter(([key]) => key !== 'baselineComplete')
  .every(([, value]) => value === true);

const publicSurfaceArtifact = {
  schemaVersion: 1,
  phase: PHASE,
  runtime: gapSummary.runtime,
  policy: 'Actual runtime source is authoritative. Legacy Studio evidence is non-authoritative.',
  omissions,
  surfaces,
};

const sourceMapArtifact = {
  schemaVersion: 1,
  phase: PHASE,
  runtime: gapSummary.runtime,
  surfaces: Object.fromEntries(
    surfaces.map((surface) => [
      surface.publicSymbol,
      {
        source: surface.source,
        implementationFiles: surface.implementationFiles,
        validationFiles: surface.validationFiles,
      },
    ]),
  ),
  recursiveRecords: Object.fromEntries(
    records.map((record) => [
      record.id,
      {
        publicSymbol: record.publicSymbol,
        optionPath: record.optionPath,
        sourceFiles: record.sourceFiles,
        implementationFiles: record.implementationFiles,
        validationFiles: record.validationFiles,
      },
    ]),
  ),
};

const domainArtifacts = new Map<string, unknown>();
for (const [domain, summary] of Object.entries(domains)) {
  const domainSymbols = new Set(
    surfaces.filter((surface) => surface.domain === domain).map((surface) => surface.publicSymbol),
  );
  domainArtifacts.set(domain, {
    schemaVersion: 1,
    phase: PHASE,
    domain,
    runtime: gapSummary.runtime,
    summary,
    surfaces: surfaces.filter((surface) => surface.domain === domain),
    records: records.filter((record) => domainSymbols.has(record.publicSymbol)),
  });
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

const outputs = new Map<string, string>();
outputs.set(path.join(outDir, 'public-surface.json'), json(publicSurfaceArtifact));
outputs.set(path.join(outDir, 'runtime-source-map.json'), json(sourceMapArtifact));
outputs.set(path.join(outDir, 'surface-reconciliation.json'), json(surfaceReconciliationArtifact));
outputs.set(path.join(outDir, 'gap-summary.json'), json(gapSummary));
for (const [domain, artifact] of domainArtifacts) {
  outputs.set(path.join(outDir, 'domains', domain + '.json'), json(artifact));
}

const indexPayload = {
  schemaVersion: 1,
  phase: PHASE,
  runtime: gapSummary.runtime,
  generatedAtPolicy: 'deterministic-no-wall-clock-field',
  artifacts: [...outputs.entries()]
    .map(([file, value]) => ({
      file: relDocs(file),
      sha256: sha256(value),
    }))
    .sort((a, b) => a.file.localeCompare(b.file)),
  gates: gapSummary.gates,
};
outputs.set(path.join(outDir, 'index.json'), json(indexPayload));

function writeOrCheck(file: string, value: string): void {
  if (CHECK) {
    if (!fs.existsSync(file)) {
      throw new Error('[studio-parity] generated artifact missing: ' + relDocs(file));
    }
    const current = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    if (current !== value) {
      throw new Error(
        '[studio-parity] generated artifact is stale: ' + relDocs(file) +
          '. Run npm run studio:parity:scan with the pinned runtime checkout.',
      );
    }
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

for (const [file, value] of outputs) writeOrCheck(file, value);

const mode = CHECK ? 'verified' : 'wrote';
console.log(
  '[studio-parity] ' + mode + ' runtime parity baseline: ' +
    surfaces.length + ' public surfaces, ' +
    records.length + ' recursive records, ' +
    omissions.length + ' explicit scanner omissions, runtime ' +
    pin.commit.slice(0, 12) + '.',
);

if (!gapSummary.gates.baselineComplete) {
  console.error('[studio-parity] baseline gates failed:', gapSummary.gates, omissions);
  process.exitCode = 1;
}
