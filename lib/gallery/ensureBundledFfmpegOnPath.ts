import fs from 'fs';
import path from 'path';

let done = false;

/**
 * Apexify video helpers shell out to `ffmpeg` / `ffprobe` on PATH. Vercel images omit both.
 * `ffmpeg-static` ships a platform binary under `node_modules`; prepend its dir so gallery MP4 works.
 */
export function ensureBundledFfmpegOnPath(): void {
  if (done) return;
  done = true;
  try {
    // CommonJS so Next keeps the package on disk for serverless tracing (see outputFileTracingIncludes).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegPath = require('ffmpeg-static') as string | null | undefined;
    if (!ffmpegPath || typeof ffmpegPath !== 'string') return;
    if (!fs.existsSync(ffmpegPath)) return;
    const dir = path.dirname(ffmpegPath);
    process.env.PATH = `${dir}${path.delimiter}${process.env.PATH ?? ''}`;
  } catch {
    // Missing optional install — rely on system FFmpeg if present.
  }
}
