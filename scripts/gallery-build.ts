/**
 * Writes static PNGs and regenerates snippet-backed previews under `public/gallery-outputs/`.
 * Run: `npm run gallery:build`
 */
import { execSync } from 'child_process';
import { runSnippetBackedGalleryAssets } from '../lib/gallery/core/galleryAssetRunner';
import { writeGalleryStaticOutputs } from '../lib/gallery/core/writeGalleryStaticOutputs';

async function main(): Promise<void> {
  await writeGalleryStaticOutputs();
  await runSnippetBackedGalleryAssets();
  execSync('npx tsx scripts/verify-gallery-outputs.ts', { stdio: 'inherit', cwd: process.cwd() });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
