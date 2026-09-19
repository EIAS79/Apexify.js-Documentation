import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, extname, isAbsolute, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const CAPABILITY_DIR = join(tmpdir(), 'apexify-studio-media-caps');
const BLOCKED_PROTOCOL =
  /(?:^|[^a-z0-9+.-])(?:https?|ftp|ftps|gopher|gophers|smb|rtmp|rtmps|rtsp|rtsps|rtp|rist|srt|ssh|tcp|udp|tls|unix|icecast|sap|crypto|subfile|data|file|concat|concatf|tee|fifo|cache|async|bluray|dvd):/i;
const FORBIDDEN_OPTIONS = new Set([
  '-protocol_whitelist',
  '-protocol_blacklist',
  '-protocol_opts',
  '-filter_script',
  '-filter_complex_script',
  '-filter_complex_script:v',
  '-filter_complex_script:a',
]);
const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.m4v', '.mov', '.mkv', '.webm', '.avi', '.mpeg', '.mpg',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp',
  '.wav', '.mp3', '.aac', '.m4a', '.flac', '.ogg', '.oga',
  '.srt', '.ass', '.ssa', '.ttf', '.otf', '.woff', '.woff2',
  '.cube', '.lut', '.txt', '.ffconcat', '.m3u', '.m3u8', '.mpd', '.sdp',
]);

function fail(message) {
  process.stderr.write(`Studio media policy: ${message}\n`);
  process.exit(126);
}

function inside(root, candidate) {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(resolvedRoot + sep);
}

function unquote(value) {
  let out = value.trim();
  if (
    out.length >= 2 &&
    ((out.startsWith("'") && out.endsWith("'")) || (out.startsWith('"') && out.endsWith('"')))
  ) {
    out = out.slice(1, -1);
  }
  return out.replace(/\\'/g, "'").replace(/\\"/g, '"');
}

function validatePath(root, candidate, label) {
  const cleaned = unquote(candidate);
  if (!cleaned || cleaned === '-' || /^pipe:\d*$/i.test(cleaned)) return;
  if (BLOCKED_PROTOCOL.test(cleaned)) fail(`${label} contains a blocked protocol.`);
  if (/(^|[\\/])\.\.([\\/]|$)/.test(cleaned)) fail(`${label} contains path traversal.`);

  const resolved = isAbsolute(cleaned) ? resolve(cleaned) : resolve(root, cleaned);
  if (!inside(root, resolved)) fail(`${label} escapes the disposable Studio workspace.`);
}

function embeddedAbsolutePaths(arg) {
  const matches = [];
  const re = /(?:^|[=,:;'"(\[])(\/[^,;'"\)\]\s]+)/g;
  let match;
  while ((match = re.exec(arg))) {
    if (match[1]) matches.push(match[1]);
  }
  return matches;
}

function looksLikePath(value) {
  const cleaned = unquote(value);
  if (!cleaned || cleaned.startsWith('-') || cleaned.includes('=')) return false;
  if (cleaned.includes('/') || cleaned.includes('\\')) return true;
  return MEDIA_EXTENSIONS.has(extname(cleaned).toLowerCase());
}

function validateConcatList(root, listPath) {
  validatePath(root, listPath, 'concat list');
  const absolute = isAbsolute(listPath) ? resolve(listPath) : resolve(root, listPath);
  if (!existsSync(absolute)) fail('concat list does not exist.');

  const text = readFileSync(absolute, 'utf8');
  if (text.length > 2 * 1024 * 1024) fail('concat list exceeds the Studio policy limit.');

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^file\s+(.+)$/i.exec(line);
    if (!match) fail('concat list contains an unsupported directive.');

    const referenced = unquote(match[1]);
    if (BLOCKED_PROTOCOL.test(referenced)) fail('concat list contains a blocked protocol.');
    const resolved = isAbsolute(referenced)
      ? resolve(referenced)
      : resolve(dirname(absolute), referenced);
    if (!inside(root, resolved)) fail('concat list references a file outside the Studio workspace.');
  }
}

function readCapability(mode) {
  const id = process.env.STUDIO_MEDIA_CAP_ID || '';
  if (!/^[a-f0-9-]{16,80}$/i.test(id)) fail('missing media capability.');

  const capabilityPath = join(CAPABILITY_DIR, `${id}.json`);
  if (!existsSync(capabilityPath)) fail('media capability is no longer valid.');

  let capability;
  try {
    capability = JSON.parse(readFileSync(capabilityPath, 'utf8'));
  } catch {
    fail('media capability is invalid.');
  }

  if (!capability || capability.version !== 1) fail('media capability version is invalid.');
  if (typeof capability.runRoot !== 'string' || !isAbsolute(capability.runRoot)) {
    fail('media capability workspace is invalid.');
  }

  const binary = mode === 'ffmpeg' ? capability.ffmpeg : capability.ffprobe;
  if (typeof binary !== 'string' || !isAbsolute(binary) || !existsSync(binary)) {
    fail(`${mode} binary is unavailable.`);
  }

  const cwd = resolve(process.cwd());
  if (!inside(capability.runRoot, cwd)) fail('media proxy cwd escaped the Studio workspace.');
  return { root: resolve(capability.runRoot), binary: resolve(binary) };
}

function validateArguments(root, args) {
  if (args.length > 768) fail('too many media-process arguments.');
  let totalChars = 0;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    totalChars += arg.length;
    if (totalChars > 1024 * 1024) fail('media-process arguments are too large.');
    if (arg.includes('\0')) fail('media-process argument contains NUL.');
    if (FORBIDDEN_OPTIONS.has(arg.toLowerCase())) {
      fail(`${arg} is controlled by the Studio media boundary.`);
    }
    if (BLOCKED_PROTOCOL.test(arg) && !/^pipe:\d*$/i.test(arg)) {
      fail('external/network protocols are disabled in Studio video.');
    }
    if (/(^|[\\/])\.\.([\\/]|$)/.test(arg)) {
      fail('media-process path traversal is disabled.');
    }

    if (isAbsolute(unquote(arg))) validatePath(root, arg, `argv[${index}]`);
    for (const candidate of embeddedAbsolutePaths(arg)) {
      validatePath(root, candidate, `argv[${index}]`);
    }
    if (looksLikePath(arg)) validatePath(root, arg, `argv[${index}]`);
  }

  for (let index = 0; index < args.length - 1; index += 1) {
    if (args[index] !== '-f' || String(args[index + 1]).toLowerCase() !== 'concat') continue;
    const inputIndex = args.indexOf('-i', index + 2);
    if (inputIndex >= 0 && typeof args[inputIndex + 1] === 'string') {
      validateConcatList(root, args[inputIndex + 1]);
    }
  }
}

function hardenInputProtocols(args) {
  const out = [];
  for (const arg of args) {
    if (arg === '-i') out.push('-protocol_whitelist', 'file,pipe');
    out.push(arg);
  }
  return out;
}

export function runStudioMediaProxy(mode, rawArgs = process.argv.slice(2)) {
  if (mode !== 'ffmpeg' && mode !== 'ffprobe') fail('invalid media proxy mode.');

  const { root, binary } = readCapability(mode);
  const args = [...rawArgs];
  validateArguments(root, args);
  const hardened = hardenInputProtocols(args);

  const temp = join(root, 'ffmpeg-tmp');
  mkdirSync(temp, { recursive: true });

  const child = spawn(binary, hardened, {
    shell: false,
    windowsHide: true,
    cwd: root,
    env: {
      HOME: root,
      TMPDIR: temp,
      TEMP: temp,
      TMP: temp,
      LANG: 'C',
      LC_ALL: 'C',
      PATH: dirname(binary),
      FONTCONFIG_FILE: '/etc/fonts/fonts.conf',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  const forward = (signal) => {
    try { child.kill(signal); } catch {}
  };
  process.once('SIGTERM', () => forward('SIGTERM'));
  process.once('SIGINT', () => forward('SIGINT'));

  child.once('error', (error) => {
    process.stderr.write(`Studio media proxy could not start ${mode}: ${error.message}\n`);
    process.exitCode = 127;
  });
  child.once('close', (code, signal) => {
    if (signal) {
      process.stderr.write(`Studio media process ended by ${signal}.\n`);
      process.exitCode = 1;
      return;
    }
    process.exitCode = typeof code === 'number' ? code : 1;
  });
}
