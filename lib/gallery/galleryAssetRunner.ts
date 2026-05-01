/**
 * Regenerates gallery previews that are stored as runnable snippet strings (backgrounds, motion, deck slide).
 * Core PNGs/charts still come from `writeGalleryStaticOutputs.ts`.
 */
import { execSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { legacyBackgroundSnippetBuilds } from './backgroundSnippets';
import { CONIC_DRIFT_GIF_TS, PULSE_BLOOM_MP4_TS } from './motionSnippets';
import { PRESENTATION_SLIDE_TS } from './presentationSlideSnippet';
import { SPIN_WHEEL_GIF_TS, SPIN_WHEEL_VIDEO_TS } from './spinWheelSnippets';

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
  console.log(`→ ${label}`);
  execSync(`npx tsx "${fp}"`, { stdio: 'inherit', cwd: process.cwd(), env: process.env });
}

function tryRun(label: string, fileBase: string, source: string): void {
  try {
    runTsxSource(label, fileBase, source);
  } catch (e) {
    console.warn(`⚠ Skipped (${label}):`, e instanceof Error ? e.message : e);
  }
}

export async function runSnippetBackedGalleryAssets(): Promise<void> {
  mkdirSync(TEMP_DIR, { recursive: true });

  try {
    for (let i = 0; i < legacyBackgroundSnippetBuilds.length; i++) {
      const { rel, ts } = legacyBackgroundSnippetBuilds[i];
      runTsxSource(`background ${rel}`, `legacy-bg-${i}`, wrapFlatCanvasSnippet(ts, rel));
    }

    runTsxSource('presentation slide', 'presentation-slide', wrapPresentationSlide(PRESENTATION_SLIDE_TS));

    tryRun('spin-wheel GIF', 'spin-wheel-gif', SPIN_WHEEL_GIF_TS);
    tryRun('conic-drift GIF', 'conic-drift-gif', CONIC_DRIFT_GIF_TS);
    tryRun('spin-wheel MP4 (needs FFmpeg)', 'spin-wheel-mp4', SPIN_WHEEL_VIDEO_TS);
    tryRun('pulse-bloom MP4 (needs FFmpeg)', 'pulse-bloom-mp4', PULSE_BLOOM_MP4_TS);
  } finally {
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
