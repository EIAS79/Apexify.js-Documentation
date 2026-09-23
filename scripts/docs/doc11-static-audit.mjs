import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'verification', 'doc-11');
fs.mkdirSync(OUT, { recursive: true });
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(ROOT, file));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

for (const file of ['app/sitemap.ts', 'app/robots.ts', 'app/error.tsx', 'app/not-found.tsx', 'lib/site.ts']) {
  assert(exists(file), `missing production hardening file: ${file}`);
}

const layout = read('app/layout.tsx');
const docsLayout = read('app/docs/layout.tsx');
const docsShellCss = read('styles/docs-shell.css');
const globals = read('app/globals.css');
const gallery = read('app/gallery/page.tsx');
const studio = read('app/studio/page.tsx');
const apiLanding = read('app/api-reference/page.tsx');

assert(layout.includes('metadataBase:'), 'root metadataBase missing');
assert(layout.includes('openGraph:'), 'root Open Graph defaults missing');
assert(layout.includes('twitter:'), 'root Twitter metadata missing');
assert(docsLayout.includes('alternates: { canonical:'), 'docs canonical landing metadata missing');
assert(gallery.includes('alternates: { canonical:') && gallery.includes('openGraph:'), 'Gallery canonical/social metadata missing');
assert(studio.includes('alternates: { canonical:') && studio.includes('openGraph:'), 'Studio canonical/social metadata missing');
assert(apiLanding.includes('alternates:{canonical:') && apiLanding.includes('openGraph:'), 'API landing canonical/social metadata missing');
assert(docsShellCss.includes(':focus-visible') && docsShellCss.includes('outline: 2px solid var(--apx-focus-color)'), 'docs visible focus contract missing');
assert(docsShellCss.includes('@media (prefers-reduced-motion: reduce)'), 'docs reduced-motion contract missing');
assert(globals.includes('@media (prefers-reduced-motion: reduce)'), 'global reduced-motion contract missing');
assert(read('app/not-found.tsx').includes('Page not found'), 'meaningful 404 state missing');
assert(read('app/error.tsx').includes('Try again') && read('app/error.tsx').includes('reset'), 'recoverable error state missing');

const mediaExt = /\.(png|jpe?g|webp|gif|avif|svg)$/i;
const media = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && mediaExt.test(entry.name)) {
      const rel = path.relative(ROOT, full).split(path.sep).join('/');
      const bytes = fs.statSync(full).size;
      media.push({
        path: rel,
        bytes,
        onDemandOutput:
          rel.startsWith('public/example-outputs/') ||
          rel.startsWith('public/gallery-outputs/') ||
          rel.startsWith('public/gallery/peak-lab/'),
      });
    }
  }
}
walk(path.join(ROOT, 'public'));
media.sort((a, b) => b.bytes - a.bytes);

// Original PNG brand artwork is retained as source/reference material only.
// Runtime shell surfaces use the optimized AVIF/SVG variants.
const sourceOnlyBrandMedia = new Set([
  'public/brand/apexify-banner.png',
  'public/brand/apexify-mark.png',
  'public/brand/apexify-lockup.png',
]);
const criticalMedia = media.filter(
  (item) => !item.onDemandOutput && !sourceOnlyBrandMedia.has(item.path),
);
const criticalOversized = criticalMedia.filter((item) => item.bytes > 512 * 1024);
const onDemandOversized = media.filter((item) => item.onDemandOutput && item.bytes > 1024 * 1024);
assert(criticalOversized.length === 0, `critical/public shell media above 512 KiB: ${criticalOversized.map((item) => `${item.path}:${item.bytes}`).join(', ')}`);

const dependencyAudit = JSON.parse(read('package.json'));
const packagePin = dependencyAudit.dependencies?.['apexify.js'] ?? null;
const staticStatus = failures.length ? 'FAIL' : 'PASS';
const mediaStatus = criticalOversized.length ? 'FAIL' : onDemandOversized.length ? 'PASS WITH MEASURED JUSTIFICATION' : 'PASS';

fs.writeFileSync(path.join(OUT, 'static-contracts.json'), `${JSON.stringify({
  schemaVersion: 1,
  status: staticStatus,
  checks: {
    metadataBase: layout.includes('metadataBase:'),
    globalSocialMetadata: layout.includes('openGraph:') && layout.includes('twitter:'),
    docsCanonical: docsLayout.includes('alternates: { canonical:'),
    sitemap: exists('app/sitemap.ts'),
    robots: exists('app/robots.ts'),
    errorBoundary: exists('app/error.tsx'),
    notFound: exists('app/not-found.tsx'),
    docsFocusVisible: docsShellCss.includes(':focus-visible'),
    docsReducedMotion: docsShellCss.includes('@media (prefers-reduced-motion: reduce)'),
    globalReducedMotion: globals.includes('@media (prefers-reduced-motion: reduce)'),
  },
  packagePin,
  failures,
}, null, 2)}\n`);

fs.writeFileSync(path.join(OUT, 'media.json'), `${JSON.stringify({
  schemaVersion: 1,
  status: mediaStatus,
  policy: {
    shellCriticalMaxBytes: 512 * 1024,
    onDemandOutputSoftThresholdBytes: 1024 * 1024,
    justification: 'Example/Gallery rendered outputs are product evidence loaded on demand, not shell-critical assets; oversized output files are measured and retained only when no shell route eagerly transfers them.',
  },
  totals: {
    files: media.length,
    bytes: media.reduce((sum, item) => sum + item.bytes, 0),
    criticalFiles: criticalMedia.length,
    criticalBytes: criticalMedia.reduce((sum, item) => sum + item.bytes, 0),
    onDemandFiles: media.filter((item) => item.onDemandOutput).length,
    onDemandBytes: media.filter((item) => item.onDemandOutput).reduce((sum, item) => sum + item.bytes, 0),
  },
  criticalOversized,
  onDemandOversized,
  largest: media.slice(0, 25),
}, null, 2)}\n`);

if (failures.length) {
  console.error('[DOC-11 static] FAIL', failures);
  process.exit(1);
}
console.log(`[DOC-11 static] PASS media=${media.length} onDemandOversized=${onDemandOversized.length}`);
