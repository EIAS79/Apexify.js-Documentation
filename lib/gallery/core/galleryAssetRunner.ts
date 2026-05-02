/**
 * Regenerates gallery previews that are stored as runnable snippet strings (backgrounds, motion, deck slide).
 * Core PNGs/charts still come from `writeGalleryStaticOutputs.ts`.
 */
import { execSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { legacyBackgroundSnippetBuilds } from '../background/backgroundSnippets';
import { CONIC_DRIFT_GIF_TS, PULSE_BLOOM_MP4_TS } from '../motion/motionSnippets';
import { PRESENTATION_SLIDE_TS } from '../presentation/presentationSlideSnippet';
import { SPIN_WHEEL_GIF_TS, SPIN_WHEEL_VIDEO_TS } from '../spin-wheel/spinWheelSnippets';

const TEMP_DIR = join(process.cwd(), '.gallery-build-temp');

function wrapFlatCanvasSnippet(snippet: string, relOut: string): string {
  const body = snippet
    .replace(/^import \{ ApexPainter \} from 'apexify\.js';\s*\n\s*\n/, '')
    .replace(/^const painter = new ApexPainter\(\);\s*\n/, '')
    .trimEnd()
    .replace(/\s*return canvas\.buffer;\s*$/, '');
  const indented = body
    .split('\n')
    .map((line) => (line.length ? `  ${line}` : line))
    .join('\n');
  const safeRel = relOut.replace(/\\/g, '/');
  return `import { ApexPainter } from 'apexify.js';
import fs from 'fs';
import path from 'path';

(async () => {
  const painter = new ApexPainter();
${indented}
  const dest = path.join(process.cwd(), 'public', 'gallery-outputs', '${safeRel}');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, canvas.buffer);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
`;
}

function wrapPresentationSlide(snippet: string): string {
  const core = snippet.trimEnd().replace(/\s*return await main\(\);\s*$/, '');
  return `import { ApexPainter } from 'apexify.js';
import fs from 'fs';
import path from 'path';

${core}

(async () => {
  const buf = await main();
  const out = path.join(process.cwd(), 'public', 'gallery-outputs', 'images', 'presentation-slide.png');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.isBuffer(buf) ? buf : Buffer.from(buf as Uint8Array));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
`;
}

function runTsxSource(label: string, fileBase: string, source: string): void {
  mkdirSync(TEMP_DIR, { recursive: true });
  const fp = join(TEMP_DIR, `${fileBase}.ts`);
  writeFileSync(fp, source, 'utf8');
  console.log(`ÔåÆ ${label}`);
  execSync(`npx tsx "${fp}"`, { stdio: 'inherit', cwd: process.cwd(), env: process.env });
}

export async function runSnippetBackedGalleryAssets(): Promise<void> {
  mkdirSync(TEMP_DIR, { recursive: true });

  try {
    for (let i = 0; i < legacyBackgroundSnippetBuilds.length; i++) {
      const { rel, ts } = legacyBackgroundSnippetBuilds[i];
      runTsxSource(`background ${rel}`, `legacy-bg-${i}`, wrapFlatCanvasSnippet(ts, rel));
    }

    runTsxSource('presentation slide', 'presentation-slide', wrapPresentationSlide(PRESENTATION_SLIDE_TS));

    runTsxSource('spin-wheel GIF', 'spin-wheel-gif', SPIN_WHEEL_GIF_TS);
    runTsxSource('conic-drift GIF', 'conic-drift-gif', CONIC_DRIFT_GIF_TS);

    const skipVideo = process.env.GALLERY_SKIP_VIDEO === '1' || process.env.GALLERY_SKIP_VIDEO === 'true';
    if (skipVideo) {
      console.warn('[gallery] Skipping MP4 encodes (GALLERY_SKIP_VIDEO set — ffmpeg not required for PNG/GIF check).');
    } else {
      runTsxSource('spin-wheel MP4 (needs FFmpeg on PATH)', 'spin-wheel-mp4', SPIN_WHEEL_VIDEO_TS);
      runTsxSource('pulse-bloom MP4 (needs FFmpeg on PATH)', 'pulse-bloom-mp4', PULSE_BLOOM_MP4_TS);
    }
  } finally {
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}