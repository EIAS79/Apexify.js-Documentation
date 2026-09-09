import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, '.doc1-runtime-evidence');
fs.mkdirSync(OUT_DIR, { recursive: true });

const started = performance.now();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const build = spawnSync(npmCommand, ['run', 'build'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
  },
});
const buildMs = performance.now() - started;

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const manifestPath = path.join(ROOT, '.next', 'app-build-manifest.json');
if (!fs.existsSync(manifestPath)) {
  throw new Error('[doc1-measure] .next/app-build-manifest.json is missing after build');
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const pages = manifest.pages ?? {};

function measureManifestKey(key) {
  const files = Array.from(new Set(pages[key] ?? []));
  const measuredFiles = files.map((file) => {
    const full = path.join(ROOT, '.next', file);
    return {
      file,
      bytes: fs.existsSync(full) ? fs.statSync(full).size : 0,
    };
  });
  return {
    manifestKey: key,
    files: measuredFiles,
    totalBytes: measuredFiles.reduce((sum, entry) => sum + entry.bytes, 0),
  };
}

const legacyKey = pages['/docs/page'] ? '/docs/page' : null;
const catchAllKey =
  Object.keys(pages).find((key) => key.includes('/docs/[...slug]/page')) ??
  Object.keys(pages).find((key) => key.includes('[...slug]')) ??
  null;

if (!catchAllKey) {
  throw new Error(
    `[doc1-measure] catch-all docs route missing from app-build-manifest; keys: ${Object.keys(pages).join(', ')}`,
  );
}

const evidence = {
  schemaVersion: 1,
  methodology:
    'one clean production build; unique JS chunk bytes referenced by Next app-build-manifest',
  baseline: {
    doc0CleanBuildMedianMs: 37544.622,
    doc0DocsManifestBytes: 1498887,
  },
  build: {
    wallMs: Number(buildMs.toFixed(3)),
    deltaVsDoc0MedianMs: Number((buildMs - 37544.622).toFixed(3)),
    percentVsDoc0Median: Number((((buildMs / 37544.622) - 1) * 100).toFixed(2)),
  },
  bundles: {
    routedDocs: measureManifestKey(catchAllKey),
    legacyDocs: legacyKey ? measureManifestKey(legacyKey) : null,
  },
};

const routedBytes = evidence.bundles.routedDocs.totalBytes;
evidence.bundles.routedDocs.deltaVsDoc0DocsBytes = routedBytes - 1498887;
evidence.bundles.routedDocs.percentVsDoc0Docs = Number(
  (((routedBytes / 1498887) - 1) * 100).toFixed(2),
);

fs.writeFileSync(
  path.join(OUT_DIR, 'build-bundle.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
);

console.log('[doc1-measure] ' + JSON.stringify({
  buildMs: evidence.build.wallMs,
  routedDocsManifestBytes: routedBytes,
  legacyDocsManifestBytes: evidence.bundles.legacyDocs?.totalBytes ?? null,
  baselineDocsManifestBytes: 1498887,
}));
