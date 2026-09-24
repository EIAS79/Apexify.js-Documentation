import packageJson from '../../../package.json';
import type { StudioVirtualAsset } from '../runtime/assets';
import type { VisualProject } from './model';
import { serializeVisualProject, visualProjectFileName } from './persistence';

export const PHASE15_GENERATOR_VERSION = 'STUDIO-VISUAL-15' as const;
export const PHASE15_SINGLE_FILE_LIMIT = 250 * 1024;
export const PHASE15_EXTERNALIZABLE_LITERAL_LIMIT = 64 * 1024;

export type Phase15AssetExportStrategy = 'files' | 'manifest' | 'omit';

export type Phase15ExportOptions = {
  assetStrategy: Phase15AssetExportStrategy;
  includeProjectSource: boolean;
  includePackageJson: boolean;
  includeProvenance: boolean;
};

export type Phase15ExportFile = {
  path: string;
  mime: string;
  bytes: Uint8Array;
};

export type Phase15ExportManifest = {
  schemaVersion: 1;
  generator: typeof PHASE15_GENERATOR_VERSION;
  projectId: string;
  projectName: string;
  projectSchemaVersion: number;
  semanticHash: string;
  sourceHash: string;
  apexifyPackage: string;
  assetStrategy: Phase15AssetExportStrategy;
  singleFileDefault: true;
  files: Array<{ path: string; mime: string; bytes: number; hash: string }>;
  warnings: string[];
};

export type Phase15ProjectExport = {
  fileName: string;
  files: Phase15ExportFile[];
  manifest: Phase15ExportManifest;
  zip: Uint8Array;
};

const encoder = new TextEncoder();
const apexifyPackagePin = String(
  (packageJson.dependencies as Record<string, string> | undefined)?.['apexify.js'] ?? 'apexify.js',
);

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}

function hashBytes(bytes: Uint8Array): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
}

export function phase15TextHash(source: string): string {
  return 'fnv1a64:' + hashBytes(encoder.encode(source));
}

export function phase15SemanticHash(project: VisualProject): string {
  const semantic = {
    format: project.format,
    schemaVersion: project.schemaVersion,
    id: project.id,
    name: project.name,
    document: project.document,
    assets: project.assets,
    palettes: project.palettes,
    variables: project.variables,
    timelines: project.timelines,
    outputs: project.outputs,
    operations: project.operations,
    codegen: project.codegen,
  };
  return phase15TextHash(JSON.stringify(stableValue(semantic)));
}

export function stripStudioSourceMarkers(source: string): string {
  return source
    .replace(/^\/\*\s*apexify-studio-v(?:9|10|11|12|13|14):[^*]+\*\/\s*/u, '')
    .replace(/^\/\*\s*apexify-studio provenance:[^*]+\*\/\s*/u, '');
}

export function formatGeneratedTypeScript(source: string): string {
  const lines = source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''));

  const compact: string[] = [];
  let blankCount = 0;
  for (const line of lines) {
    if (!line.trim()) {
      blankCount += 1;
      if (blankCount > 2) continue;
    } else {
      blankCount = 0;
    }
    compact.push(line);
  }
  return compact.join('\n').trim() + '\n';
}

export type Phase15CodeQualityIssue = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
};

export function lintGeneratedTypeScript(
  source: string,
  options: { requirePortableAssets?: boolean } = {},
): Phase15CodeQualityIssue[] {
  const issues: Phase15CodeQualityIssue[] = [];
  if (!source.trim()) {
    issues.push({ severity: 'error', code: 'empty-source', message: 'Generated source is empty.' });
    return issues;
  }
  if (!/from\s+['"]apexify\.js['"]/.test(source)) {
    issues.push({
      severity: 'error',
      code: 'missing-apexify-import',
      message: 'Generated source must import the public apexify.js package.',
    });
  }
  if (/\r/.test(source)) {
    issues.push({
      severity: 'warning',
      code: 'line-endings',
      message: 'Generated source contains non-canonical line endings.',
    });
  }
  if (/[ \t]+$/m.test(source)) {
    issues.push({
      severity: 'warning',
      code: 'trailing-space',
      message: 'Generated source contains trailing whitespace.',
    });
  }
  if (options.requirePortableAssets && /studio:\/\/asset\//.test(source)) {
    issues.push({
      severity: 'error',
      code: 'studio-asset-reference',
      message: 'Portable project source still contains a Studio-only asset reference.',
    });
  }
  if (/\/api\/gallery\/run|same-origin-isolated|studioResultsJson/.test(source)) {
    issues.push({
      severity: 'error',
      code: 'studio-runtime-leak',
      message: 'Generated user code contains Studio runtime protocol internals.',
    });
  }
  if (/^\s*return\s+await\s+main\(\);\s*$/m.test(source)) {
    issues.push({
      severity: 'error',
      code: 'runner-return',
      message: 'Generated standalone source still contains the Studio runner return statement.',
    });
  }
  return issues;
}

function standaloneModuleSource(source: string): string {
  return source.replace(
    /(^|\n)\s*return\s+await\s+main\(\);\s*(?=\n?$)/u,
    '$1await main();',
  );
}

export function phase15CleanGeneratedSource(source: string): string {
  return formatGeneratedTypeScript(
    standaloneModuleSource(stripStudioSourceMarkers(source)),
  );
}

export function phase15GeneratedCodeProvenance(
  project: VisualProject,
  cleanSource: string,
): string {
  return JSON.stringify({
    generator: PHASE15_GENERATOR_VERSION,
    projectId: project.id,
    schemaVersion: project.schemaVersion,
    semanticHash: phase15SemanticHash(project),
    sourceHash: phase15TextHash(cleanSource),
    apexifyPackage: apexifyPackagePin,
  });
}

export function phase15ExportedCode(
  project: VisualProject,
  linkedSource: string,
  includeProvenance = false,
): string {
  const clean = phase15CleanGeneratedSource(linkedSource);
  if (!includeProvenance) return clean;
  return (
    '/* apexify-studio provenance:' +
    phase15GeneratedCodeProvenance(project, clean) +
    ' */\n' +
    clean
  );
}

export function safePhase15FileStem(value: string): string {
  const stem = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return stem || 'apexify-studio-project';
}

function sanitizeAssetName(name: string, id: string, used: Set<string>): string {
  const base = name
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'asset';
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  let candidate = base;
  let index = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = stem + '-' + index + ext;
    index += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate || ('asset-' + id);
}

function decodeBase64(value: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/\s+/g, '').replace(/=+$/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (const char of clean) {
    const digit = alphabet.indexOf(char);
    if (digit < 0) throw new Error('Invalid Studio asset base64 payload.');
    buffer = (buffer << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[offset++] = (buffer >> bits) & 0xff;
    }
  }
  return out.subarray(0, offset);
}

function textFile(path: string, value: string, mime = 'text/plain;charset=utf-8'): Phase15ExportFile {
  return { path, mime, bytes: encoder.encode(value) };
}

function replaceStudioAssetRefs(
  source: string,
  pathsById: ReadonlyMap<string, string>,
): string {
  let next = source;
  for (const [id, path] of pathsById) {
    next = next.split('studio://asset/' + id).join('../' + path);
  }
  return next;
}

function packageScaffold(project: VisualProject): string {
  const name = safePhase15FileStem(project.name);
  return JSON.stringify(
    {
      name,
      version: '0.0.0',
      private: true,
      type: 'module',
      scripts: {
        start: 'tsx src/index.ts',
        typecheck: 'tsc --noEmit',
      },
      dependencies: {
        'apexify.js': apexifyPackagePin,
      },
      devDependencies: {
        '@types/node': '^22.20.1',
        tsx: '^4.19.2',
        typescript: '^5.3.3',
      },
    },
    null,
    2,
  ) + '\n';
}

function tsconfigScaffold(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        noEmit: true,
        types: ['node'],
      },
      include: ['src/**/*.ts'],
    },
    null,
    2,
  ) + '\n';
}

function readme(project: VisualProject, strategy: Phase15AssetExportStrategy): string {
  return [
    '# ' + project.name,
    '',
    'Exported by Apexify Studio ' + PHASE15_GENERATOR_VERSION + '.',
    '',
    'Run:',
    '  npm install',
    '  npm start',
    '',
    'Asset strategy: ' + strategy + '.',
    strategy === 'files'
      ? 'Studio assets are copied to ./assets/ and generated source references are rewritten to portable relative paths.'
      : strategy === 'manifest'
        ? 'Studio asset bytes are preserved in assets/studio-assets.json; generated source keeps Studio references for archival round trip.'
        : 'Studio asset bytes are intentionally omitted. Supply any referenced assets before running the source.',
    '',
  ].join('\n');
}

function exportFilesBeforeManifest(
  project: VisualProject,
  linkedSource: string,
  assets: readonly StudioVirtualAsset[],
  options: Phase15ExportOptions,
): { files: Phase15ExportFile[]; warnings: string[]; exportedSource: string } {
  const warnings: string[] = [];
  const usedNames = new Set<string>();
  const pathsById = new Map<string, string>();
  const files: Phase15ExportFile[] = [];

  for (const asset of assets) {
    const name = sanitizeAssetName(asset.name, asset.id, usedNames);
    pathsById.set(asset.id, 'assets/' + name);
  }

  let exportedSource = phase15ExportedCode(project, linkedSource, options.includeProvenance);

  if (options.assetStrategy === 'files') {
    exportedSource = replaceStudioAssetRefs(exportedSource, pathsById);
    for (const asset of assets) {
      const path = pathsById.get(asset.id)!;
      files.push({
        path,
        mime: asset.mime || 'application/octet-stream',
        bytes: decodeBase64(asset.base64),
      });
    }
  } else if (options.assetStrategy === 'manifest') {
    files.push(
      textFile(
        'assets/studio-assets.json',
        JSON.stringify(
          {
            schemaVersion: 1,
            assets: assets.map((asset) => ({
              id: asset.id,
              reference: 'studio://asset/' + asset.id,
              name: asset.name,
              mime: asset.mime,
              size: asset.size,
              base64: asset.base64,
              metadata: asset.metadata,
            })),
          },
          null,
          2,
        ) + '\n',
        'application/json',
      ),
    );
    if (assets.length) {
      warnings.push(
        'Manifest asset strategy preserves Studio references for archival round trip; materialize assets before running outside Studio.',
      );
    }
  } else if (assets.length) {
    warnings.push(
      'Asset bytes were omitted by request. Exported source may contain Studio-only asset references.',
    );
  }

  files.unshift(textFile('src/index.ts', exportedSource, 'text/typescript;charset=utf-8'));
  files.push(textFile('README.md', readme(project, options.assetStrategy), 'text/markdown;charset=utf-8'));
  files.push(textFile('tsconfig.json', tsconfigScaffold(), 'application/json'));

  if (options.includePackageJson) {
    files.push(textFile('package.json', packageScaffold(project), 'application/json'));
  }
  if (options.includeProjectSource) {
    files.push(
      textFile(
        visualProjectFileName(project),
        serializeVisualProject(project),
        'application/json',
      ),
    );
  }

  return { files, warnings, exportedSource };
}

function writeU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}
function writeU32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createDeterministicStoredZip(files: readonly Phase15ExportFile[]): Uint8Array {
  const ordered = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const file of ordered) {
    const name = encoder.encode(file.path.replace(/\\/g, '/'));
    const data = file.bytes;
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    writeU32(localView, 0, 0x04034b50);
    writeU16(localView, 4, 20);
    writeU16(localView, 6, 0x0800);
    writeU16(localView, 8, 0);
    writeU16(localView, 10, 0);
    writeU16(localView, 12, 0x0021);
    writeU32(localView, 14, crc);
    writeU32(localView, 18, data.length);
    writeU32(localView, 22, data.length);
    writeU16(localView, 26, name.length);
    writeU16(localView, 28, 0);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    writeU32(centralView, 0, 0x02014b50);
    writeU16(centralView, 4, 20);
    writeU16(centralView, 6, 20);
    writeU16(centralView, 8, 0x0800);
    writeU16(centralView, 10, 0);
    writeU16(centralView, 12, 0);
    writeU16(centralView, 14, 0x0021);
    writeU32(centralView, 16, crc);
    writeU32(centralView, 20, data.length);
    writeU32(centralView, 24, data.length);
    writeU16(centralView, 28, name.length);
    writeU16(centralView, 30, 0);
    writeU16(centralView, 32, 0);
    writeU16(centralView, 34, 0);
    writeU16(centralView, 36, 0);
    writeU32(centralView, 38, 0);
    writeU32(centralView, 42, localOffset);
    central.set(name, 46);
    centralParts.push(central);
    localOffset += local.length;
  }

  const centralOffset = localOffset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeU32(endView, 0, 0x06054b50);
  writeU16(endView, 4, 0);
  writeU16(endView, 6, 0);
  writeU16(endView, 8, ordered.length);
  writeU16(endView, 10, ordered.length);
  writeU32(endView, 12, centralSize);
  writeU32(endView, 16, centralOffset);
  writeU16(endView, 20, 0);

  const total =
    localParts.reduce((sum, part) => sum + part.length, 0) +
    centralSize +
    end.length;
  const zip = new Uint8Array(total);
  let offset = 0;
  for (const part of [...localParts, ...centralParts, end]) {
    zip.set(part, offset);
    offset += part.length;
  }
  return zip;
}

export function createPhase15ProjectExport(
  project: VisualProject,
  linkedSource: string,
  assets: readonly StudioVirtualAsset[],
  options: Phase15ExportOptions,
): Phase15ProjectExport {
  const base = exportFilesBeforeManifest(project, linkedSource, assets, options);
  const quality = lintGeneratedTypeScript(base.exportedSource, {
    requirePortableAssets: options.assetStrategy === 'files',
  });
  const errors = quality.filter((issue) => issue.severity === 'error');
  if (errors.length) {
    throw new Error(errors.map((issue) => issue.message).join(' '));
  }
  const warnings = [
    ...base.warnings,
    ...quality.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
  ];

  const sourceHash = phase15TextHash(base.exportedSource);
  const semanticHash = phase15SemanticHash(project);
  const preliminary = [...base.files].sort((a, b) => a.path.localeCompare(b.path));
  const manifest: Phase15ExportManifest = {
    schemaVersion: 1,
    generator: PHASE15_GENERATOR_VERSION,
    projectId: project.id,
    projectName: project.name,
    projectSchemaVersion: project.schemaVersion,
    semanticHash,
    sourceHash,
    apexifyPackage: apexifyPackagePin,
    assetStrategy: options.assetStrategy,
    singleFileDefault: true,
    files: preliminary.map((file) => ({
      path: file.path,
      mime: file.mime,
      bytes: file.bytes.length,
      hash: 'fnv1a64:' + hashBytes(file.bytes),
    })),
    warnings,
  };
  const files = [
    ...preliminary,
    textFile(
      'apexify-studio.export.json',
      JSON.stringify(manifest, null, 2) + '\n',
      'application/json',
    ),
  ].sort((a, b) => a.path.localeCompare(b.path));

  return {
    fileName: safePhase15FileStem(project.name) + '.zip',
    files,
    manifest,
    zip: createDeterministicStoredZip(files),
  };
}

export function phase15DefaultExportOptions(): Phase15ExportOptions {
  return {
    assetStrategy: 'files',
    includeProjectSource: true,
    includePackageJson: true,
    includeProvenance: false,
  };
}
