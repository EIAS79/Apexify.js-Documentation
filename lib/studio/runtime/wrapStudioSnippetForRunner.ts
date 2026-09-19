function hoistLeadingImports(src: string): { hoisted: string; rest: string } {
  let rest = src.trimStart();
  const blocks: string[] = [];
  const oneImport = /^import\s[\s\S]*?;\s*/;
  while (rest.length > 0) {
    const match = rest.match(oneImport);
    if (!match) break;
    blocks.push(match[0].trim());
    rest = rest.slice(match[0].length).trimStart();
  }
  return { hoisted: blocks.join('\n'), rest };
}

export function wrapStudioSnippetForRunner(
  code: string,
  { apexifyImportHref }: { apexifyImportHref: string },
): string {
  let body = code
    .replace(/^import\s*\{\s*ApexPainter\s*\}\s*from\s*['"]apexify\.js['"]\s*;?\s*\r?\n/m, '')
    .replace(/^const\s*\{\s*ApexPainter\s*\}\s*=\s*require\s*\(\s*['"]apexify\.js['"]\s*\)\s*;?\s*\r?\n/m, '')
    .replace(/^const\s+ApexPainter\s*=\s*require\s*\(\s*['"]apexify\.js['"]\s*\)\s*\.(?:default|ApexPainter)\s*;?\s*\r?\n/m, '')
    .trim();

  body = body.replace(/\s*return\s+await\s+main\s*\(\)\s*;?\s*$/m, '').trim();

  const { hoisted, rest: inner } = hoistLeadingImports(body);
  const hoistedBlock = hoisted ? hoisted + '\n\n' : '';

  return `import { copyFileSync as __studioCopy, existsSync as __studioExists, mkdirSync as __studioMkdir, readFileSync as __studioRead, readdirSync as __studioReadDir, statSync as __studioStat, writeFileSync as __studioWrite } from 'node:fs';
import * as __studioPath from 'node:path';
import { GlobalFonts as __studioGlobalFonts } from '@napi-rs/canvas';

${hoistedBlock}
function __studioRegisterFonts(): void {
  try {
    const ttf = __studioPath.join(process.cwd(), 'node_modules', 'dejavu-fonts-ttf', 'ttf', 'DejaVuSans.ttf');
    for (const family of ['DejaVu Sans', 'Arial', 'Helvetica', 'sans-serif', 'Segoe UI', 'system-ui', 'Verdana', 'Tahoma']) {
      try { __studioGlobalFonts.registerFromPath(ttf, family); } catch {}
    }
  } catch {}
}

type __StudioEntry = {
  id: string;
  name: string;
  path?: string;
  text?: string;
  mime?: string;
  kind?: string;
  metadata?: Record<string, unknown>;
};

function __studioSafeName(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'artifact';
}

function __studioJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (Buffer.isBuffer(item)) return { type: 'Buffer', bytes: item.length };
    if (typeof item === 'bigint') return item.toString();
    return item;
  }, 2);
}

void (async () => {
  __studioRegisterFonts();
  const __apexMod = await import(${JSON.stringify(apexifyImportHref)});
  const ApexPainter = __apexMod.ApexPainter ?? __apexMod.default?.ApexPainter ?? __apexMod.default;

${inner}

  const __artifactDir = process.env.STUDIO_ARTIFACT_DIR!;
  const __manifestPath = process.env.STUDIO_MANIFEST!;
  __studioMkdir(__artifactDir, { recursive: true });

  const __entries: __StudioEntry[] = [];
  const __seen = new WeakSet<object>();
  let __index = 0;

  function __pushBuffer(buf: Buffer, label: string) {
    const id = 'artifact-' + String(++__index);
    const name = __studioSafeName(label || id) + '.bin';
    const out = __studioPath.join(__artifactDir, id + '.bin');
    __studioWrite(out, buf);
    __entries.push({ id, name, path: out });
  }

  function __pushFile(file: string, label: string) {
    if (!__studioExists(file)) return false;
    const stat = __studioStat(file);
    if (!stat.isFile()) return false;
    const id = 'artifact-' + String(++__index);
    const base = __studioSafeName(__studioPath.basename(file) || label || id);
    const out = __studioPath.join(__artifactDir, id + '-' + base);
    __studioCopy(file, out);
    __entries.push({ id, name: base, path: out });
    return true;
  }

  function __pushText(text: string, label: string, kind: 'text' | 'json' = 'text') {
    const id = 'artifact-' + String(++__index);
    __entries.push({
      id,
      name: __studioSafeName(label || id) + (kind === 'json' ? '.json' : '.txt'),
      text,
      mime: kind === 'json' ? 'application/json' : 'text/plain',
      kind,
    });
  }

  function __collect(value: unknown, label = 'result'): void {
    if (value == null) return;

    if (Buffer.isBuffer(value)) {
      __pushBuffer(value, label);
      return;
    }

    if (typeof value === 'string') {
      const resolved = __studioPath.resolve(value);
      if (!__pushFile(resolved, label)) __pushText(value, label);
      return;
    }

    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      __pushText(String(value), label);
      return;
    }

    if (Array.isArray(value)) {
      const before = __entries.length;
      value.forEach((item, index) => __collect(item, label + '-' + String(index + 1)));
      if (__entries.length === before) __pushText(__studioJson(value), label, 'json');
      return;
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (__seen.has(obj)) return;
      __seen.add(obj);

      if (Buffer.isBuffer(obj.buffer)) {
        __pushBuffer(obj.buffer, label);
        return;
      }

      const before = __entries.length;
      const preferred = ['output', 'outputPath', 'path', 'file', 'files', 'frames', 'buffers', 'result'];
      for (const key of preferred) {
        if (key in obj) __collect(obj[key], label + '-' + key);
      }

      if (__entries.length === before) {
        try {
          __pushText(__studioJson(value), label, 'json');
        } catch {
          __pushText(String(value), label);
        }
      }
    }
  }

  const __result = await main();
  __collect(__result);

  // File-producing operations such as createVideo() may write a relative output
  // and return metadata. Pick up new files in the run workspace as a fallback.
  if (__entries.length === 0) {
    for (const name of __studioReadDir(process.cwd())) {
      if (name === 'snippet.ts' || name === 'err.txt' || name === 'artifacts' || name === 'studio-manifest.json') continue;
      const candidate = __studioPath.join(process.cwd(), name);
      try { __pushFile(candidate, name); } catch {}
    }
  }

  __studioWrite(__manifestPath, JSON.stringify({ schemaVersion: 1, artifacts: __entries }, null, 2));
})().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  try {
    if (process.env.GALLERY_ERR) __studioWrite(process.env.GALLERY_ERR, msg);
  } catch {}
  console.error(msg);
  process.exit(1);
});
`;
}
