import fs from 'node:fs';
import path from 'node:path';
import {
  STUDIO_BROWSER_DIRECT_METHODS,
  STUDIO_FULL_RUNTIME_FACETS,
  STUDIO_FULL_RUNTIME_METHODS,
} from '../../lib/studio/runtime/capabilities';

const root = process.cwd();
const check = process.argv.includes('--check');
const outFile = path.join(root, 'generated', 'studio', 'capability-matrix.json');

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
};

const browserMethods = new Set<string>(STUDIO_BROWSER_DIRECT_METHODS);
const fullMethods = new Set<string>(STUDIO_FULL_RUNTIME_METHODS);
const fullFacets = new Set<string>(STUDIO_FULL_RUNTIME_FACETS);
const persistenceMethods = new Set(['save', 'saveMultiple']);
const ignoredFacets = new Set(['outputFormat']);

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function findDeclaration(): string {
  const candidates = [
    path.join(root, 'node_modules', 'apexify.js', 'dist', 'declarations', 'apex-painter', 'main.d.ts'),
    path.join(root, 'node_modules', 'apexify.js', 'dist', 'declarations-cjs', 'apex-painter', 'main.d.cts'),
  ];
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;

  const declarationRoot = path.join(root, 'node_modules', 'apexify.js', 'dist');
  if (!fs.existsSync(declarationRoot)) {
    throw new Error('Apexify.js declarations are missing. Run npm install before Studio completeness verification.');
  }

  const found = walk(declarationRoot).find((file) => {
    if (!/\.d\.(?:ts|cts)$/.test(file)) return false;
    try {
      return /\bclass\s+ApexPainter\b/.test(fs.readFileSync(file, 'utf8'));
    } catch {
      return false;
    }
  });
  if (!found) throw new Error('Could not locate the ApexPainter declaration in the installed apexify.js package.');
  return found;
}

function classBody(source: string): string {
  const match = /\bclass\s+ApexPainter\b[^\{]*\{/.exec(source);
  if (!match) throw new Error('ApexPainter declaration was not found.');
  const open = match.index + match[0].lastIndexOf('{');
  let depth = 0;
  let quote: "'" | '"' | '`' | null = null;
  let escaped = false;

  for (let index = open; index < source.length; index += 1) {
    const ch = source[index]!;
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  throw new Error('ApexPainter declaration body is unbalanced.');
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function extractSurface(body: string) {
  const methods: string[] = [];
  const facets: string[] = [];

  const methodRe = /^\s{2}([A-Za-z_$][\w$]*)\s*(?:<[^\n(]+>)?\s*\(/gm;
  let methodMatch: RegExpExecArray | null;
  while ((methodMatch = methodRe.exec(body))) {
    const name = methodMatch[1]!;
    if (name !== 'constructor') methods.push(name);
  }

  const readonlyRe = /^\s{2}readonly\s+([A-Za-z_$][\w$]*)\s*:/gm;
  let fieldMatch: RegExpExecArray | null;
  while ((fieldMatch = readonlyRe.exec(body))) facets.push(fieldMatch[1]!);

  const getterRe = /^\s{2}get\s+([A-Za-z_$][\w$]*)\s*\(\)\s*:/gm;
  let getterMatch: RegExpExecArray | null;
  while ((getterMatch = getterRe.exec(body))) facets.push(getterMatch[1]!);

  return {
    methods: uniqueSorted(methods),
    facets: uniqueSorted(facets),
  };
}

const declaration = findDeclaration();
const source = fs.readFileSync(declaration, 'utf8');
const surface = extractSurface(classBody(source));

const methodRows = surface.methods.map((name) => ({
  name,
  route: browserMethods.has(name)
    ? 'browser'
    : fullMethods.has(name)
      ? 'full-runtime'
      : persistenceMethods.has(name)
        ? 'host-persistence'
        : 'missing',
}));

const facetRows = surface.facets.map((name) => ({
  name,
  route: fullFacets.has(name)
    ? 'full-runtime'
    : ignoredFacets.has(name)
      ? 'introspection'
      : 'missing',
}));

const missingMethods = methodRows.filter((row) => row.route === 'missing').map((row) => row.name);
const missingFacets = facetRows.filter((row) => row.route === 'missing').map((row) => row.name);


type FacetSpec = {
  declaration: string;
  kind: 'interface' | 'class';
  excluded?: ReadonlySet<string>;
};

const FACET_SPECS: Record<string, FacetSpec> = {
  createAudio: {
    declaration: 'PainterCreateAudio',
    kind: 'interface',
    excluded: new Set(['save']),
  },
  image: { declaration: 'PainterImageUtils', kind: 'interface' },
  detect: { declaration: 'PainterHitDetect', kind: 'interface' },
  path2d: { declaration: 'PainterPath2D', kind: 'interface' },
  pixels: { declaration: 'PainterPixels', kind: 'interface' },
  output: { declaration: 'PainterOutput', kind: 'interface' },
  assets: { declaration: 'AssetManager', kind: 'class' },
  plugins: { declaration: 'PluginHost', kind: 'class' },
  video: { declaration: 'VideoStack', kind: 'class' },
};

const declarationFiles = walk(path.join(root, 'node_modules', 'apexify.js', 'dist'))
  .filter((file) => /\.d\.(?:ts|cts)$/.test(file));

function declarationBody(name: string, kind: 'interface' | 'class'): string {
  const pattern = new RegExp('(?:export\\s+)?(?:declare\\s+)?' + kind + '\\s+' + name + '\\b[^\\{]*\\{');
  for (const file of declarationFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const match = pattern.exec(source);
    if (!match) continue;
    const open = match.index + match[0].lastIndexOf('{');
    let depth = 0;
    let quote: "'" | '"' | '`' | null = null;
    let escaped = false;

    for (let index = open; index < source.length; index += 1) {
      const ch = source[index]!;
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) return source.slice(open + 1, index);
      }
    }
  }
  throw new Error('Could not locate declaration ' + kind + ' ' + name + ' in apexify.js.');
}

function declarationMethods(body: string): string[] {
  const methods: string[] = [];
  const re = /^\s*(?:public\s+)?(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*(?:<[^\n(]+>)?\s*\(/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body))) {
    if (match[1] !== 'constructor') methods.push(match[1]!);
  }
  return uniqueSorted(methods);
}

function declarationProperties(body: string): string[] {
  const properties: string[] = [];
  const re = /^\s*(?:public\s+)?readonly\s+([A-Za-z_$][\w$]*)\s*:/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body))) properties.push(match[1]!);
  return uniqueSorted(properties);
}

function componentFactories(): string[] {
  const pattern = /(?:export\s+)?(?:declare\s+)?function\s+createPainterComponents\s*\([^)]*\)\s*:\s*\{/;
  for (const file of declarationFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const match = pattern.exec(source);
    if (!match) continue;
    const open = match.index + match[0].lastIndexOf('{');
    let depth = 0;
    for (let index = open; index < source.length; index += 1) {
      const ch = source[index]!;
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          const body = source.slice(open + 1, index);
          return uniqueSorted(
            [...body.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:\s*\{/gm)].map((entry) => entry[1]!),
          );
        }
      }
    }
  }
  return [];
}

const facetMembers = Object.fromEntries(
  Object.entries(FACET_SPECS).map(([facet, spec]) => {
    const body = declarationBody(spec.declaration, spec.kind);
    const methods = declarationMethods(body).map((name) => ({
      name,
      route: spec.excluded?.has(name) ? 'host-persistence' : 'full-runtime',
    }));
    return [
      facet,
      {
        declaration: spec.declaration,
        methods,
        properties: declarationProperties(body),
        missing: methods.filter((row) => row.route === 'missing').map((row) => row.name),
      },
    ];
  }),
);

const componentMembers = componentFactories().map((name) => ({
  name,
  method: 'toLayers',
  route: 'full-runtime',
}));

const artifact = {
  schemaVersion: 1,
  packagePin: packageJson.dependencies?.['apexify.js'] ?? null,
  declaration: path.relative(root, declaration).replaceAll(path.sep, '/'),
  topLevel: {
    methods: methodRows,
    facets: facetRows,
    missingMethods,
    missingFacets,
  },
  facetMembers,
  componentMembers,
  excludedFromStudioManipulation: [
    'save',
    'saveMultiple',
    'createAudio.save',
  ],
  complete:
    missingMethods.length === 0 &&
    missingFacets.length === 0 &&
    Object.values(facetMembers).every(
      (facet) => (facet as { missing: string[] }).missing.length === 0,
    ),
};

if (!artifact.complete) {
  console.error('[studio-completeness] UNROUTED APEXIFY SURFACE');
  if (missingMethods.length) console.error('methods:', missingMethods.join(', '));
  if (missingFacets.length) console.error('facets:', missingFacets.join(', '));
  for (const [facet, detail] of Object.entries(facetMembers)) {
    const missing = (detail as { missing: string[] }).missing;
    if (missing.length) console.error('facet ' + facet + ':', missing.join(', '));
  }
  process.exitCode = 1;
}

const expected = JSON.stringify(artifact, null, 2) + '\n';
if (check) {
  if (!fs.existsSync(outFile)) {
    console.error('[studio-completeness] missing generated/studio/capability-matrix.json');
    process.exit(1);
  }
  const current = fs.readFileSync(outFile, 'utf8');
  if (current !== expected) {
    console.error('[studio-completeness] stale generated/studio/capability-matrix.json');
    process.exit(1);
  }
  console.log('[studio-completeness] CHECK PASS');
} else {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, expected);
  console.log('[studio-completeness] wrote generated/studio/capability-matrix.json');
}
