import path from 'path';
import { GlobalFonts } from '@napi-rs/canvas';

let done = false;

/**
 * Linux/serverless images often lack Arial/Georgia; Skia then draws no glyphs for gallery text.
 * Register DejaVu TTFs from `dejavu-fonts-ttf` and alias common snippet families once per process.
 */
export function ensureGalleryFontsRegistered(): void {
  if (done) return;
  done = true;

  const ttfDir = path.join(process.cwd(), 'node_modules', 'dejavu-fonts-ttf', 'ttf');

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
