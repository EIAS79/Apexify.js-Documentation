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
  {
    apexifyImportHref,
    canvasImportHref = '@napi-rs/canvas',
    defaultFontPath,
  }: {
    apexifyImportHref: string;
    canvasImportHref?: string;
    defaultFontPath?: string;
  },
): string {
  let body = code
    .replace(/^import\s*\{\s*ApexPainter\s*\}\s*from\s*['"]apexify\.js['"]\s*;?\s*\r?\n/m, '')
    .replace(/^const\s*\{\s*ApexPainter\s*\}\s*=\s*require\s*\(\s*['"]apexify\.js['"]\s*\)\s*;?\s*\r?\n/m, '')
    .replace(/^const\s+ApexPainter\s*=\s*require\s*\(\s*['"]apexify\.js['"]\s*\)\s*\.(?:default|ApexPainter)\s*;?\s*\r?\n/m, '')
    .trim();

  // Any Apexify import form that survives the legacy ApexPainter-only cleanup
  // is rewritten to the exact package entry bundled with this deployment.
  body = body.replace(
    /(['"])apexify\.js\1/g,
    JSON.stringify(apexifyImportHref),
  );

  body = body
    .replace(/\s*return\s+await\s+main\s*\(\)\s*;?\s*$/m, '')
    .replace(
      /\s*\(\s*async\s*\(\s*\)\s*=>\s*\{\s*await\s+main\s*\(\s*\)\s*;?\s*\}\s*\)\s*\(\s*\)\s*\.catch\s*\(\s*console\.error\s*\)\s*;?\s*$/m,
      '',
    )
    .replace(/\s*main\s*\(\s*\)\s*\.catch\s*\(\s*console\.error\s*\)\s*;?\s*$/m, '')
    .trim();

  const { hoisted, rest: inner } = hoistLeadingImports(body);
  const hoistedBlock = hoisted ? hoisted + '\n\n' : '';
  const declaresApexPainter = /\b(?:const|let|var|class|function)\s+ApexPainter\b/.test(inner);
  const apexPainterBinding = declaresApexPainter
    ? ''
    : '  const ApexPainter = __apexMod.ApexPainter ?? __apexMod.default?.ApexPainter ?? __apexMod.default;\n';
  const declaresPath = /\b(?:const|let|var|class|function|import)\s+path\b/.test(inner);
  const declaresFs = /\b(?:const|let|var|class|function|import)\s+fs\b/.test(inner);
  const pathBinding = !declaresPath && /\bpath\s*\./.test(inner)
    ? '  const path = __studioPath;\n'
    : '';
  const fsBinding = !declaresFs && /\bfs\s*\./.test(inner)
    ? '  const fs = __studioFs;\n'
    : '';
  const frameArrayHint = /\b(?:animate|extractMultipleFrames)\s*\(/.test(body);

  return `import * as __studioFs from 'node:fs';
import { copyFileSync as __studioCopy, existsSync as __studioExists, mkdirSync as __studioMkdir, readFileSync as __studioRead, readdirSync as __studioReadDir, statSync as __studioStat, writeFileSync as __studioWrite } from 'node:fs';
import * as __studioPath from 'node:path';
import * as __studioCanvas from ${JSON.stringify(canvasImportHref)};

${hoistedBlock}
type __StudioFontRegistry = {
  registerFromPath(path: string, family: string): boolean;
};
const __studioGlobalFonts =
  (__studioCanvas as unknown as { GlobalFonts?: __StudioFontRegistry }).GlobalFonts ??
  ((__studioCanvas as unknown as { default?: { GlobalFonts?: __StudioFontRegistry } }).default?.GlobalFonts);
const __studioDefaultFontPath = ${JSON.stringify(defaultFontPath ?? '')};
const __studioFrameArrayHint = ${JSON.stringify(frameArrayHint)};

function __studioFontFamily(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').trim();
  const normalized = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized || 'Studio Font';
}

function __studioRegisterFonts(): void {
  try {
    const ttf =
      __studioDefaultFontPath ||
      __studioPath.join(process.cwd(), 'node_modules', 'dejavu-fonts-ttf', 'ttf', 'DejaVuSans.ttf');
    for (const family of ['DejaVu Sans', 'Arial', 'Helvetica', 'sans-serif', 'Segoe UI', 'system-ui', 'Verdana', 'Tahoma']) {
      try { __studioGlobalFonts?.registerFromPath(ttf, family); } catch {}
    }
  } catch {}

  const manifestPath = process.env.STUDIO_ASSET_MANIFEST;
  if (!manifestPath || !__studioExists(manifestPath)) return;

  try {
    const manifest = JSON.parse(__studioRead(manifestPath, 'utf8')) as {
      assets?: Array<{ name?: unknown; mime?: unknown; path?: unknown }>;
    };
    for (const asset of manifest.assets ?? []) {
      if (
        typeof asset.name !== 'string' ||
        typeof asset.mime !== 'string' ||
        typeof asset.path !== 'string' ||
        !asset.path
      ) {
        continue;
      }
      const fontLike =
        asset.mime.startsWith('font/') ||
        /\.(?:ttf|otf|woff2?|woff)$/i.test(asset.name);
      if (!fontLike) continue;
      try {
        __studioGlobalFonts?.registerFromPath(asset.path, __studioFontFamily(asset.name));
      } catch {}
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

function __studioExtensionForMime(mime: string | undefined): string {
  const normalized = (mime || '').toLowerCase();
  if (normalized === 'image/png') return '.png';
  if (normalized === 'image/jpeg') return '.jpg';
  if (normalized === 'image/webp') return '.webp';
  if (normalized === 'image/gif') return '.gif';
  if (normalized === 'image/avif') return '.avif';
  if (normalized === 'image/tiff') return '.tiff';
  if (normalized === 'image/heif') return '.heif';
  if (normalized === 'image/jp2') return '.jp2';
  if (normalized === 'image/jxl') return '.jxl';
  if (normalized === 'audio/wav') return '.wav';
  if (normalized === 'audio/mpeg') return '.mp3';
  if (normalized === 'audio/ogg') return '.ogg';
  if (normalized === 'video/mp4') return '.mp4';
  if (normalized === 'video/webm') return '.webm';
  return '.bin';
}

function __studioDetectBufferMime(buf: Buffer): string | undefined {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  const sig6 = buf.subarray(0, 6).toString('ascii');
  if (sig6 === 'GIF87a' || sig6 === 'GIF89a') return 'image/gif';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WAVE') return 'audio/wav';
  if (buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brands = new Set<string>();
    const boxSize = Math.min(buf.length, buf.readUInt32BE(0) || 64, 96);
    brands.add(buf.subarray(8, 12).toString('ascii'));
    for (let offset = 16; offset + 4 <= boxSize; offset += 4) {
      brands.add(buf.subarray(offset, offset + 4).toString('ascii'));
    }
    if (brands.has('avif') || brands.has('avis')) return 'image/avif';
    if (['heic','heix','hevc','hevx','heim','heis','hevm','hevs','mif1','msf1'].some((brand) => brands.has(brand))) {
      return 'image/heif';
    }
    return 'video/mp4';
  }
  if (
    buf.length >= 4 &&
    ((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a && buf[3] === 0x00) ||
      (buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00 && buf[3] === 0x2a))
  ) return 'image/tiff';
  if (
    buf.length >= 12 &&
    buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x00 && buf[3] === 0x0c &&
    buf.subarray(4, 8).toString('ascii') === 'jP  ' &&
    buf[8] === 0x0d && buf[9] === 0x0a && buf[10] === 0x87 && buf[11] === 0x0a
  ) return 'image/jp2';
  if (
    (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0x0a) ||
    (buf.length >= 12 &&
      buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x00 && buf[3] === 0x0c &&
      buf.subarray(4, 8).toString('ascii') === 'JXL ' &&
      buf[8] === 0x0d && buf[9] === 0x0a && buf[10] === 0x87 && buf[11] === 0x0a)
  ) return 'image/jxl';
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video/webm';
  return undefined;
}

function __studioJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (Buffer.isBuffer(item)) return { type: 'Buffer', bytes: item.length, mime: __studioDetectBufferMime(item) };
    if (ArrayBuffer.isView(item)) {
      return {
        type: item.constructor?.name || 'TypedArray',
        length: 'length' in item ? Number((item as { length?: unknown }).length ?? 0) : undefined,
        bytes: item.byteLength,
      };
    }
    if (item instanceof ArrayBuffer) return { type: 'ArrayBuffer', bytes: item.byteLength };
    if (typeof item === 'bigint') return item.toString();
    if (
      item &&
      typeof item === 'object' &&
      item.constructor &&
      item.constructor !== Object &&
      !Array.isArray(item)
    ) {
      const own = Object.keys(item);
      if (own.length === 0) return { type: item.constructor.name || 'Object' };
    }
    return item;
  }, 2);
}

void (async () => {
  __studioRegisterFonts();
  const __apexMod = await import(${JSON.stringify(apexifyImportHref)});
${apexPainterBinding}${pathBinding}${fsBinding}
${inner}

  const __artifactDir = process.env.STUDIO_ARTIFACT_DIR!;
  const __manifestPath = process.env.STUDIO_MANIFEST!;
  __studioMkdir(__artifactDir, { recursive: true });

  const __entries: __StudioEntry[] = [];
  const __seen = new WeakSet<object>();
  const __copiedFiles = new Set<string>();
  let __index = 0;

  function __metadataFromRecord(
    obj: Record<string, unknown>,
    excluded: ReadonlySet<string>,
  ): Record<string, unknown> | undefined {
    const metadata: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (excluded.has(key)) continue;
      if (
        value == null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        metadata[key] = value;
      }
    }
    return Object.keys(metadata).length ? metadata : undefined;
  }

  function __pushBuffer(
    buf: Buffer,
    label: string,
    metadata?: Record<string, unknown>,
    mime?: string,
  ) {
    const id = 'artifact-' + String(++__index);
    const resolvedMime = mime || __studioDetectBufferMime(buf);
    const extension = __studioExtensionForMime(resolvedMime);
    const safeLabel = __studioSafeName(label || id);
    const name =
      extension && safeLabel.toLowerCase().endsWith(extension)
        ? safeLabel
        : safeLabel + extension;
    const out = __studioPath.join(__artifactDir, id + extension);
    __studioWrite(out, buf);
    __entries.push({ id, name, path: out, metadata, mime: resolvedMime });
  }

  function __pushFile(
    file: string,
    label: string,
    metadata?: Record<string, unknown>,
  ) {
    if (!__studioExists(file)) return false;
    const stat = __studioStat(file);
    if (!stat.isFile()) return false;

    const canonical = __studioPath.resolve(file);
    if (__copiedFiles.has(canonical)) return true;
    __copiedFiles.add(canonical);

    const id = 'artifact-' + String(++__index);
    const base = __studioSafeName(__studioPath.basename(file) || label || id);
    const out = __studioPath.join(__artifactDir, id + '-' + base);
    __studioCopy(file, out);
    __entries.push({ id, name: base, path: out, metadata });
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

  function __decodeDataUrl(value: string): { bytes: Buffer; mime: string } | null {
    const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/i.exec(value);
    if (!match) return null;
    const mime = match[1] || 'application/octet-stream';
    try {
      const bytes = match[2]
        ? Buffer.from(match[3] || '', 'base64')
        : Buffer.from(decodeURIComponent(match[3] || ''), 'utf8');
      return { bytes, mime };
    } catch {
      return null;
    }
  }

  function __decodeLooseBase64Media(value: string): { bytes: Buffer; mime: string } | null {
    const compact = value.trim();
    if (compact.length < 24 || compact.length % 4 !== 0) return null;
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) return null;
    try {
      const bytes = Buffer.from(compact, 'base64');
      const mime = __studioDetectBufferMime(bytes);
      return mime ? { bytes, mime } : null;
    } catch {
      return null;
    }
  }

  async function __collect(value: unknown, label = 'result'): Promise<void> {
    if (value == null) return;

    if (Buffer.isBuffer(value)) {
      __pushBuffer(value, label);
      return;
    }

    if (ArrayBuffer.isView(value)) {
      const bytes = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
      __pushBuffer(bytes, label, {
        viewType: value.constructor?.name || 'TypedArray',
        byteLength: value.byteLength,
      });
      return;
    }

    if (value instanceof ArrayBuffer) {
      __pushBuffer(Buffer.from(new Uint8Array(value)), label, { byteLength: value.byteLength });
      return;
    }

    if (typeof Blob !== 'undefined' && value instanceof Blob) {
      const bytes = Buffer.from(new Uint8Array(await value.arrayBuffer()));
      __pushBuffer(bytes, label, undefined, value.type || undefined);
      return;
    }

    if (typeof value === 'string') {
      const dataUrl = __decodeDataUrl(value);
      if (dataUrl) {
        __pushBuffer(dataUrl.bytes, label, undefined, dataUrl.mime);
        return;
      }

      const looseMedia = __decodeLooseBase64Media(value);
      if (looseMedia) {
        __pushBuffer(looseMedia.bytes, label, undefined, looseMedia.mime);
        return;
      }

      const resolved = __studioPath.resolve(value);
      if (!__pushFile(resolved, label)) __pushText(value, label);
      return;
    }

    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      __pushText(String(value), label);
      return;
    }

    if (Array.isArray(value)) {
      const frameSequence =
        value.length > 0 &&
        value.every((item) => {
          if (Buffer.isBuffer(item) || item instanceof ArrayBuffer || ArrayBuffer.isView(item)) {
            return __studioFrameArrayHint && Boolean(__studioDetectBufferMime(Buffer.isBuffer(item)
              ? item
              : ArrayBuffer.isView(item)
                ? Buffer.from(item.buffer, item.byteOffset, item.byteLength)
                : Buffer.from(new Uint8Array(item as ArrayBuffer)))?.startsWith('image/'));
          }
          if (!item || typeof item !== 'object') return false;
          const record = item as Record<string, unknown>;
          return (
            typeof record.source === 'string' &&
            (typeof record.frameNumber === 'number' || typeof record.time === 'number')
          );
        });

      if (frameSequence) {
        const collectionId = 'frames-' + String(__index + 1);
        for (let index = 0; index < value.length; index += 1) {
          const item = value[index];
          const metadata: Record<string, unknown> = {
            collection: 'frame-sequence',
            collectionId,
            sequenceIndex: index,
            sequenceCount: value.length,
          };

          if (Buffer.isBuffer(item)) {
            __pushBuffer(item, label + '-frame-' + String(index + 1), metadata);
            continue;
          }
          if (ArrayBuffer.isView(item)) {
            __pushBuffer(
              Buffer.from(item.buffer, item.byteOffset, item.byteLength),
              label + '-frame-' + String(index + 1),
              { ...metadata, viewType: item.constructor?.name || 'TypedArray' },
            );
            continue;
          }
          if (item instanceof ArrayBuffer) {
            __pushBuffer(
              Buffer.from(new Uint8Array(item)),
              label + '-frame-' + String(index + 1),
              metadata,
            );
            continue;
          }

          const record = item as Record<string, unknown>;
          const source = typeof record.source === 'string' ? record.source : '';
          const frameMetadata = {
            ...metadata,
            ...__metadataFromRecord(record, new Set(['source'])),
          };
          if (
            source &&
            __pushFile(
              __studioPath.resolve(source),
              label + '-frame-' + String(index + 1),
              frameMetadata,
            )
          ) {
            continue;
          }
        }
        return;
      }

      const artifactLike = value.some((item) => {
        if (Buffer.isBuffer(item) || item instanceof ArrayBuffer || ArrayBuffer.isView(item)) return true;
        if (typeof Blob !== 'undefined' && item instanceof Blob) return true;
        if (typeof item === 'string') {
          if (/^data:/i.test(item)) return true;
          try { return __studioExists(__studioPath.resolve(item)); } catch { return false; }
        }
        if (!item || typeof item !== 'object') return false;
        const record = item as Record<string, unknown>;
        return (
          Buffer.isBuffer(record.buffer) ||
          Buffer.isBuffer(record.attachment) ||
          Buffer.isBuffer(record.gif) ||
          Buffer.isBuffer(record.static) ||
          typeof record.output === 'string' ||
          typeof record.outputPath === 'string' ||
          typeof record.path === 'string' ||
          typeof record.file === 'string' ||
          Array.isArray(record.frames) ||
          Array.isArray(record.buffers)
        );
      });

      if (!artifactLike) {
        __pushText(__studioJson(value), label, 'json');
        return;
      }

      const before = __entries.length;
      for (let index = 0; index < value.length; index += 1) {
        await __collect(value[index], label + '-' + String(index + 1));
      }
      if (__entries.length === before) __pushText(__studioJson(value), label, 'json');
      return;
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (__seen.has(obj)) return;
      __seen.add(obj);

      if (Buffer.isBuffer(obj.buffer) || ArrayBuffer.isView(obj.buffer) || obj.buffer instanceof ArrayBuffer) {
        let metadata = __metadataFromRecord(obj, new Set(['buffer']));
        if (obj.canvas && typeof obj.canvas === 'object') {
          const canvas = obj.canvas as { width?: unknown; height?: unknown };
          if (typeof canvas.width === 'number') (metadata ??= {}).width = canvas.width;
          if (typeof canvas.height === 'number') (metadata ??= {}).height = canvas.height;
        }

        const declaredMime = typeof obj.mime === 'string' ? obj.mime : undefined;
        const declaredName = typeof obj.name === 'string' ? obj.name : label;
        if (Buffer.isBuffer(obj.buffer)) {
          __pushBuffer(obj.buffer, declaredName, metadata, declaredMime);
        } else if (ArrayBuffer.isView(obj.buffer)) {
          __pushBuffer(
            Buffer.from(obj.buffer.buffer, obj.buffer.byteOffset, obj.buffer.byteLength),
            declaredName,
            { ...(metadata ?? {}), viewType: obj.buffer.constructor?.name || 'TypedArray' },
            declaredMime,
          );
        } else {
          __pushBuffer(
            Buffer.from(new Uint8Array(obj.buffer as ArrayBuffer)),
            declaredName,
            metadata,
            declaredMime,
          );
        }
        return;
      }

      const metadata = __metadataFromRecord(
        obj,
        new Set([
          'source',
          'output',
          'outputPath',
          'path',
          'file',
          'files',
          'frames',
          'buffers',
          'result',
          'attachment',
          'gif',
          'static',
        ]),
      );

      if (Buffer.isBuffer(obj.attachment)) {
        __pushBuffer(
          obj.attachment,
          typeof obj.name === 'string' ? obj.name : label + '-attachment',
          metadata,
          typeof obj.contentType === 'string' ? obj.contentType : undefined,
        );
        return;
      }

      for (const key of ['output', 'outputPath', 'path', 'file'] as const) {
        const candidate = obj[key];
        if (typeof candidate !== 'string') continue;
        if (__pushFile(__studioPath.resolve(candidate), label, metadata)) {
          const remainingKeys = ['files', 'frames', 'buffers', 'result', 'gif', 'static'] as const;
          for (const nestedKey of remainingKeys) {
            if (nestedKey in obj) await __collect(obj[nestedKey], label + '-' + nestedKey);
          }
          return;
        }
      }

      // Video frame APIs return records such as { source, frameNumber, time }.
      // Prefer the actual generated file while retaining the frame metadata.
      if (typeof obj.source === 'string') {
        const sourcePath = __studioPath.resolve(obj.source);
        if (__pushFile(sourcePath, label + '-source', metadata)) return;
      }

      const before = __entries.length;
      const preferred = [
        'output',
        'outputPath',
        'path',
        'file',
        'attachment',
        'gif',
        'static',
        'files',
        'frames',
        'buffers',
        'result',
      ];
      for (const key of preferred) {
        if (!(key in obj)) continue;
        if (
          (key === 'files' || key === 'frames' || key === 'buffers') &&
          !Array.isArray(obj[key])
        ) {
          continue;
        }
        await __collect(obj[key], label + '-' + key);
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
  await __collect(__result);

  // File-producing GIF/video APIs may return void/metadata while writing a
  // temporary Studio artifact. Discover only caller-visible files and never
  // internal inputs/caches.
  if (__entries.length === 0) {
    const __ignoredDiscoveryNames = new Set([
      'snippet.ts',
      'err.txt',
      'artifacts',
      'studio-manifest.json',
      'studio-assets.json',
      'studio-inputs',
      'apexify-tmp',
      'deno-cache',
      'ffmpeg-tmp',
    ]);

    const __discoverGeneratedFiles = (dir: string, depth: number): void => {
      if (depth > 4 || __entries.length >= 24) return;
      let names: string[] = [];
      try { names = __studioReadDir(dir); } catch { return; }

      for (const name of names) {
        if (__entries.length >= 24 || __ignoredDiscoveryNames.has(name)) continue;
        const candidate = __studioPath.join(dir, name);
        try {
          const stat = __studioStat(candidate);
          if (stat.isDirectory()) {
            __discoverGeneratedFiles(candidate, depth + 1);
          } else if (stat.isFile()) {
            __pushFile(candidate, name);
          }
        } catch {}
      }
    };

    __discoverGeneratedFiles(process.cwd(), 0);
  }

  __studioWrite(__manifestPath, JSON.stringify({ schemaVersion: 1, artifacts: __entries }, null, 2));
})().catch((err: unknown) => {
  const base = err instanceof Error ? err.stack || err.message : String(err);
  const stderr =
    err && typeof err === 'object' && 'stderr' in err && typeof (err as { stderr?: unknown }).stderr === 'string'
      ? (err as { stderr: string }).stderr.trim()
      : '';
  const msg = stderr ? base + '\\n\\nMedia stderr:\\n' + stderr : base;
  try {
    if (process.env.GALLERY_ERR) __studioWrite(process.env.GALLERY_ERR, msg);
  } catch {}
  console.error(msg);
  process.exit(1);
});
`;
}
