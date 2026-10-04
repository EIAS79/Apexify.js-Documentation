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
const runtimeFiles = walk(sourceRoot).sort();
const sourceText = new Map(runtimeFiles.map((file) => [file, fs.readFileSync(file, 'utf8')]));

const compilerOptions: ts.CompilerOptions = {
  // Match Apexify.js' own source compiler mode. NodeNext rejects the runtime's
  // extensionless ESM source imports and turns imported option types into unresolved
  // error types, which would make a recursive parity inventory silently shallow.
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  esModuleInterop: true,
  skipLibCheck: true,
  strict: false,
  allowJs: false,
  types: ['node'],
  noEmit: true,
};
const program = ts.createProgram(runtimeFiles, compilerOptions);
const checker = program.getTypeChecker();

const runtimeDiagnostics = ts.getPreEmitDiagnostics(program)
  .filter((diagnostic) => diagnostic.file?.fileName.startsWith(sourceRoot))
  .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
const unresolvedDiagnostics = runtimeDiagnostics.filter((diagnostic) => {
  const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  return /Cannot find module|Cannot find name|Could not find a declaration file/i.test(text);
});
if (unresolvedDiagnostics.length) {
  const preview = unresolvedDiagnostics.slice(0, 12).map((diagnostic) => {
    const file = diagnostic.file ? relRuntime(diagnostic.file.fileName) : '<unknown>';
    const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    return file + ': ' + text;
  });
  throw new Error(
    '[studio-parity] runtime type graph has unresolved compiler references; refusing a shallow inventory:\n' +
      preview.join('\n'),
  );
}

const classDeclarations = new Map<string, ts.ClassDeclaration>();
for (const sourceFile of program.getSourceFiles()) {
  if (!sourceFile.fileName.startsWith(sourceRoot)) continue;
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

function declarationFilesOfSymbol(symbol: ts.Symbol | undefined): string[] {
  if (!symbol) return [];
  return [...new Set(
    (symbol.declarations ?? [])
      .map((decl) => decl.getSourceFile().fileName)
      .filter((file) => file.startsWith(runtimeRoot))
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
  return runtimeFiles
    .filter((file) => /validat|limit|policy|config|runtime/i.test(relRuntime(file)))
    .filter((file) => sourceText.get(file)?.toLowerCase().includes(lower))
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
  const notes = [...(args.notes ?? [])];
  if (!validationFiles.length) notes.push('validation/default/resource semantics still require implementation-source audit');
  if (!legacyEvidence(args.publicSymbol, leaf).legacyOptionInventoryMatches?.length) {
    notes.push('no exact legacy option-path evidence promoted from the old classification matrix');
  }

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
    leafType: checker.typeToString(args.type, undefined, ts.TypeFormatFlags.NoTruncation),
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
    status: deprecation && args.status === 'PARTIAL' ? 'DEPRECATED-COMPAT' : args.status,
    notes,
  };
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
  ancestry: Set<number>;
  depth: number;
  unionVariant?: string | null;
}): void {
  let type = args.type;
  if (args.direction === 'output') type = unwrapPromise(type);

  const typeId = Number((type as unknown as { id?: number }).id ?? -1);
  if (args.depth > MAX_TYPE_DEPTH) {
    args.records.push(makeParityRecord({
      ...args,
      type,
      notes: ['scanner maximum recursive depth reached; explicit manual audit required'],
      status: 'BLOCKED',
    }));
    return;
  }

  const typeText = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
  if (isBuiltinLeaf(type, typeText)) {
    args.records.push(makeParityRecord({ ...args, type }));
    return;
  }

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
        parentType: typeText,
        depth: args.depth + 1,
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
      parentType: typeText,
      depth: args.depth + 1,
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
      const variantText = checker.typeToString(part, undefined, ts.TypeFormatFlags.NoTruncation);
      args.records.push(makeParityRecord({
        ...args,
        type: part,
        unionVariant: variantText,
        notes: ['discriminated/structural union variant inventory marker'],
      }));
      if (!isBuiltinLeaf(part) && !args.ancestry.has(Number((part as unknown as { id?: number }).id ?? -2))) {
        walkType({
          ...args,
          type: part,
          parentType: typeText,
          unionVariant: variantText,
          depth: args.depth + 1,
          ancestry: new Set(args.ancestry),
        });
      }
    }
    return;
  }

  if (typeId >= 0 && args.ancestry.has(typeId)) {
    args.records.push(makeParityRecord({
      ...args,
      type,
      notes: ['recursive type reference detected; recursion recorded without infinite expansion'],
    }));
    return;
  }

  const nextAncestry = new Set(args.ancestry);
  if (typeId >= 0) nextAncestry.add(typeId);

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
        parentType: typeText,
        notes: ['symbol has no source declaration; manual source mapping required'],
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
      parentType: typeText,
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
      parentType: typeText,
      ancestry: nextAncestry,
      depth: args.depth + 1,
    });
  }
}

function capabilityStatus(symbol: string): ParityStatus {
  return legacyStatus(legacyByCapability.get(symbol));
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
  if (surfaceBuilds.has(args.publicSymbol)) return;
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
    sourceFiles: declarationFilesOfSymbol(returnType.getSymbol()),
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

function publicCallSignatures(type: ts.Type): ts.Signature[] {
  return type.getCallSignatures();
}

function typeBelongsToRuntime(type: ts.Type): boolean {
  const symbol = type.aliasSymbol ?? type.getSymbol();
  return Boolean(symbol?.declarations?.some((decl) => decl.getSourceFile().fileName.startsWith(runtimeRoot)));
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
    if (!decl) continue;
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
      const signature = checker.getSignatureFromDeclaration(member);
      const memberType = checker.getTypeAtLocation(member);
      if (signature) {
        const fakeCall = memberType.getCallSignatures()[0];
        if (fakeCall) {
          addSurface({
            owner: className,
            publicSymbol: prefix + '.' + memberName,
            member: memberName,
            kind: 'getter',
            declaration: member,
            signature: fakeCall,
          });
        }
      }
      if (typeBelongsToRuntime(memberType)) enumerateFacetType(className, prefix + '.' + memberName, memberType, 0);
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
      } else if (typeBelongsToRuntime(memberType)) {
        enumerateFacetType(className, prefix + '.' + memberName, memberType, 0);
      }
    }
  }

  // Catch interface/class members that TypeScript exposes on the type but that are not written directly
  // in the declaration body (for example inherited public members).
  for (const prop of checker.getPropertiesOfType(classType)) {
    const symbol = prefix + '.' + prop.getName();
    if (surfaceBuilds.has(symbol)) continue;
    const decl = prop.valueDeclaration ?? prop.declarations?.[0];
    if (!decl || !decl.getSourceFile().fileName.startsWith(runtimeRoot)) continue;
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
for (const rootClass of ['SceneBuilder', 'TemplateHandle', 'VideoPipeline', 'VideoOperations']) {
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
    commit: process.env.GITHUB_SHA ?? null,
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
