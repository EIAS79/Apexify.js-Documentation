import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import recordsJson from "../../generated/docs-doc6/search-records.json";
import indexJson from "../../generated/docs-doc6/search-index-manifest.json";
import sourceManifests from "../../generated/docs-doc6/source-manifests.json";
import coverage from "../../generated/docs-doc6/search-coverage.json";
import canonical from "../../generated/docs-doc6/canonical-link-verification.json";
import relatedCoverage from "../../generated/docs-doc6/related-content-coverage.json";
import completion from "../../generated/docs-doc6/completion-query-matrix.json";

const root = process.cwd();
const sha = (value: Buffer | string) => crypto.createHash("sha256").update(value).digest("hex");
const records = (recordsJson as any).records as Array<any>;
const index = indexJson as any;
const sources = sourceManifests as any;

assert.equal(recordsJson.schemaVersion, 1);
assert.equal(index.schemaVersion, 1);
assert.equal(index.recordCount, records.length);
assert.equal(recordsJson.sourceChecksum, index.sourceChecksum);
assert.equal(recordsJson.sourceChecksum, sources.sourceChecksum);
assert.equal(new Set(records.map((record) => record.id)).size, records.length);
assert.ok(records.every((record) => record.href === record.canonicalHref || record.canonicalHref.length > 0));
assert.equal((canonical as any).missingCanonicalHref.length, 0);
assert.equal((relatedCoverage as any).selfLinks, 0);
assert.equal((relatedCoverage as any).duplicateTargets, 0);
assert.equal((completion as any).passedApplicable, true);
assert.equal((coverage as any).docs.indexed, (coverage as any).docs.total);
assert.equal((coverage as any).apiSymbols.indexed, (coverage as any).apiSymbols.total);
assert.equal((coverage as any).apiOptions.indexed, (coverage as any).apiOptions.total);
assert.equal((coverage as any).examples.indexed, (coverage as any).examples.total);

for (const source of sources.sources) {
  const absolute = path.join(root, source.path);
  assert.ok(fs.existsSync(absolute), `missing authoritative source ${source.path}`);
  assert.equal(sha(fs.readFileSync(absolute)), source.sha256, `stale source checksum ${source.path}`);
}

const routeSource = fs.readFileSync(path.join(root, "app/api/docs/search/route.ts"), "utf8");
assert.doesNotMatch(routeSource, /node:fs|readdirSync|readFileSync|getAllMdxFiles/, "request-time filesystem search returned");
const relatedAdapter = fs.readFileSync(path.join(root, "lib/search/related.ts"), "utf8");
const relatedComponent = fs.readFileSync(path.join(root, "components/docs/search/RelatedContent.tsx"), "utf8");
assert.match(relatedAdapter, /related-content\.json/);
assert.match(relatedComponent, /NextSteps/);
for (const relative of ["app/docs/[...slug]/page.tsx","app/api-reference/[package]/[...symbol]/page.tsx","app/examples/[id]/page.tsx"]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert.match(source, /RelatedContent/, `${relative} does not consume generated related content`);
}
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as { scripts?: Record<string, string> };
assert.match(packageJson.scripts?.postinstall ?? "", /docs:search:build/);
assert.match(packageJson.scripts?.build ?? "", /doc6-generate\.ts --check/);
const palette = fs.readFileSync(path.join(root, "components/docs/search/SearchCommandPalette.tsx"), "utf8");
assert.match(palette, /role="dialog"/);
assert.match(palette, /aria-modal="true"/);
const globalSearch = fs.readFileSync(path.join(root, "components/docs/search/GlobalDocsSearch.tsx"), "utf8");
for (const required of ["ArrowDown", "ArrowUp", "Enter", "Escape", "runtime", "packageName", "stability"]) {
  assert.ok(globalSearch.includes(required), `missing GlobalDocsSearch behavior: ${required}`);
}
console.log(`[doc6-verify] PASS — ${records.length} generated records, source ${index.sourceChecksum.slice(0, 12)}`);
