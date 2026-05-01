import { runSnippetBackedGalleryAssets } from './lib/gallery/galleryAssetRunner';
import { writeGalleryStaticOutputs } from './lib/gallery/writeGalleryStaticOutputs';

async function main() {
  await writeGalleryStaticOutputs();
  await runSnippetBackedGalleryAssets();
  console.log(
    'Gallery assets rebuilt under public/gallery-outputs/ (charts, comparison/collage, backgrounds, motion where FFmpeg/GIF succeeded).'
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
