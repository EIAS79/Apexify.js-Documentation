import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import recordsJson from '../../generated/docs-doc6/search-records.json';
import indexJson from '../../generated/docs-doc6/search-index-manifest.json';
import completionJson from '../../generated/docs-doc6/completion-query-matrix.json';
import { searchRecords } from '../../lib/search/query';
import type { SearchIndexArtifact, SearchRecord } from '../../lib/search/schema';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc6', 'runtime');
const DOC5_BUILD_BASELINE_MS = 39293.854;
const records = (recordsJson as { records: SearchRecord[] }).records;
const index = indexJson as SearchIndexArtifact;
const completion = completionJson as { categories: Array<{ category: string; query?: string | null; applicable: boolean }> };
fs.mkdirSync(OUT, { recursive: true });

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}
function summary(values: number[]) {
  return {
    samples: values.length,
    medianMs: Number(percentile(values, 50).toFixed(4)),
    p95Ms: Number(percentile(values, 95).toFixed(4)),
    maxMs: Number(Math.max(...values).toFixed(4)),
  };
}
function routeBytes(needle: string): number {
  const manifestPath = path.join(ROOT, '.next', 'app-build-manifest.json');
  if (!fs.existsSync(manifestPath)) return 0;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { pages?: Record<string, string[]> };
  const files = new Set<string>();
  for (const [route, chunks] of Object.entries(manifest.pages ?? {})) {
    if (!route.includes(needle)) continue;
    for (const chunk of chunks) files.add(chunk);
  }
  let total = 0;
  for (const chunk of files) {
    const file = path.join(ROOT, '.next', chunk);
    if (fs.existsSync(file)) total += fs.statSync(file).size;
  }
  return total;
}

const recordsPath = path.join(ROOT, 'generated', 'docs-doc6', 'search-records.json');
const indexPath = path.join(ROOT, 'generated', 'docs-doc6', 'search-index-manifest.json');
const recordsRaw = fs.readFileSync(recordsPath);
const indexRaw = fs.readFileSync(indexPath);
const parseSamples: number[] = [];
for (let i = 0; i < 20; i += 1) {
  const started = performance.now();
  JSON.parse(recordsRaw.toString('utf8'));
  JSON.parse(indexRaw.toString('utf8'));
  parseSamples.push(performance.now() - started);
}

const queries = completion.categories.filter((item) => item.applicable && typeof item.query === 'string' && item.query.length > 0).map((item) => item.query as string);
const benchmarkQueries = [...new Set([...queries, 'canvas', 'create canvas', 'node', 'apexify.js'])];
const querySamples: number[] = [];
const perQuery: Record<string, ReturnType<typeof summary>> = {};
for (const query of benchmarkQueries) {
  const samples: number[] = [];
  for (let i = 0; i < 100; i += 1) {
    const started = performance.now();
    searchRecords(index, records, query, {}, 30);
    const elapsed = performance.now() - started;
    samples.push(elapsed);
    querySamples.push(elapsed);
  }
  perQuery[query] = summary(samples);
}

fs.rmSync(path.join(ROOT, '.next'), { recursive: true, force: true });
const buildStart = performance.now();
const build = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
const buildWallMs = performance.now() - buildStart;
if (build.status !== 0) process.exit(build.status ?? 1);

const combined = Buffer.concat([recordsRaw, indexRaw]);
const buildDeltaPercent = ((buildWallMs - DOC5_BUILD_BASELINE_MS) / DOC5_BUILD_BASELINE_MS) * 100;
const performanceEvidence = {
  schemaVersion: 1,
  phase: 'DOC-6',
  build: { baseline: { source: 'DOC-5 merged main run 34544698911', wallMs: DOC5_BUILD_BASELINE_MS }, after: { wallMs: Number(buildWallMs.toFixed(3)) }, deltaPercent: Number(buildDeltaPercent.toFixed(2)), allowedRegressionPercent: 35, pass: buildDeltaPercent <= 35 },
  indexInitialization: summary(parseSamples),
  query: { aggregate: summary(querySamples), perQuery, budgetP95Ms: 75, pass: percentile(querySamples, 95) <= 75 },
  indexSize: { recordsRawBytes: recordsRaw.length, indexRawBytes: indexRaw.length, combinedRawBytes: combined.length, combinedGzipBytes: gzipSync(combined).length, combinedBrotliBytes: brotliCompressSync(combined).length },
};
function walkClientChunks(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkClientChunks(full, out);
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}
const clientChunks = walkClientChunks(path.join(ROOT, '.next', 'static', 'chunks'));
const sourceChecksum = (recordsJson as { sourceChecksum: string }).sourceChecksum;
const leakingClientChunks = clientChunks.filter((file) => fs.readFileSync(file, 'utf8').includes(sourceChecksum)).map((file) => ({ file: path.relative(ROOT, file).split(path.sep).join('/'), bytes: fs.statSync(file).size }));
const fullSearchIndexClientBytes = leakingClientChunks.reduce((sum, item) => sum + item.bytes, 0);
const bundleEvidence = {
  schemaVersion: 1,
  phase: 'DOC-6',
  methodology: 'Next app-build-manifest route bytes plus static-client-chunk scan for the generated DOC-6 source checksum',
  docsRouteJsBytes: routeBytes('/docs/[...slug]/page'),
  docsIndexJsBytes: routeBytes('/docs/page'),
  galleryRouteJsBytes: routeBytes('/gallery/page'),
  clientChunksScanned: clientChunks.length,
  leakingClientChunks,
  fullSearchIndexClientBytes,
  fullSearchRecordsClientBytes: fullSearchIndexClientBytes,
  reason: leakingClientChunks.length ? 'Generated DOC-6 search data was detected in client chunks.' : 'Generated DOC-6 search records/index remain server-only; clients receive bounded result JSON after interaction.',
  eagerFullIndexOnOrdinaryRoutes: leakingClientChunks.length > 0,
};
fs.writeFileSync(path.join(OUT, 'performance.json'), `${JSON.stringify(performanceEvidence, null, 2)}\n`);
fs.writeFileSync(path.join(OUT, 'bundle-comparison.json'), `${JSON.stringify(bundleEvidence, null, 2)}\n`);
console.log('[doc6-measure]', JSON.stringify({ performance: performanceEvidence, bundle: bundleEvidence }));
if (!performanceEvidence.build.pass) throw new Error('[doc6-measure] clean build exceeded inherited DOC-5 +35% tolerance');
if (!performanceEvidence.query.pass) throw new Error('[doc6-measure] search query P95 exceeded 75ms budget');
if (bundleEvidence.fullSearchIndexClientBytes !== 0 || bundleEvidence.eagerFullIndexOnOrdinaryRoutes) throw new Error('[doc6-measure] full search index leaked into client route bundles');
