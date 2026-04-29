import fs from 'fs';
import path from 'path';
import { GlobalFonts } from '@napi-rs/canvas';

let done = false;

function resolveTtfDir(): string | null {
  /** Bundled under `public/` so file tracing on Vercel always ships these paths (unlike `node_modules`). */
  const publicDir = path.join(process.cwd(), 'public', 'gallery-fonts');
  const nmDir = path.join(process.cwd(), 'node_modules', 'dejavu-fonts-ttf', 'ttf');
  for (const dir of [publicDir, nmDir]) {
    if (fs.existsSync(path.join(dir, 'DejaVuSans.ttf'))) return dir;
  }
  return null;
}

/**
 * Linux/serverless images often lack Arial/Georgia; Skia then draws no glyphs for gallery text.
 * Register DejaVu TTFs and alias common snippet families once per process.
 */
export function ensureGalleryFontsRegistered(): void {
  if (done) return;
  done = true;

  const ttfDir = resolveTtfDir();
  if (!ttfDir) {
    console.warn('[gallery-fonts] DejaVu TTFs not found; gallery text may be invisible.');
    return;
  }

  const tryRegister = (file: string) => {
    try {
      GlobalFonts.registerFromPath(path.join(ttfDir, file));
    } catch {
      // duplicate registration or missing file — non-fatal
    }
  };

  tryRegister('DejaVuSans.ttf');
  tryRegister('DejaVuSans-Bold.ttf');
  tryRegister('DejaVuSerif.ttf');
  tryRegister('DejaVuSerif-Italic.ttf');

  try {
    GlobalFonts.setAlias('Arial', 'DejaVu Sans');
    GlobalFonts.setAlias('Georgia', 'DejaVu Serif');
  } catch {
    // ignore if alias unsupported or already set
  }
}
