import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import recordsJson from "../../generated/docs-doc6/search-records.json";
import indexJson from "../../generated/docs-doc6/search-index-manifest.json";
import completion from "../../generated/docs-doc6/completion-query-matrix.json";
import filters from "../../generated/docs-doc6/filter-verification.json";
import related from "../../generated/docs-doc6/related-content.json";
import diagnostics from "../../generated/docs-doc6/diagnostic-contract.json";
import coverage from "../../generated/docs-doc6/search-coverage.json";
import { searchRecords } from "../../lib/search/query";
import type { SearchIndexArtifact, SearchRecord } from "../../lib/search/schema";

const records = (recordsJson as { records: SearchRecord[] }).records;
const index = indexJson as SearchIndexArtifact;

test("DOC-6 records have stable unique IDs and canonical hrefs", () => {
  assert.equal(new Set(records.map((record) => record.id)).size, records.length);
  assert.ok(records.every((record) => record.canonicalHref.length > 0));
  assert.equal(index.recordCount, records.length);
});

test("exact API symbols outrank prose matches", () => {
  const symbol = records.find((record) => record.kind === "api-symbol");
  if (!symbol) throw new Error("No API symbol record generated");
  const results = searchRecords(index, records, symbol.title, {}, 10).results;
  assert.equal(results[0]?.id, symbol.id);
  assert.equal(results[0]?.matchReason, "exact symbol");
});

test("nested API options are searchable and navigate to DOC-4 deep links", () => {
  const option = records.find((record) => record.kind === "api-option" && record.optionPath?.includes("."))
    ?? records.find((record) => record.kind === "api-option");
  if (!option) throw new Error("No API option record generated");
  const results = searchRecords(index, records, option.optionPath ?? option.title, {}, 10).results;
  assert.equal(results[0]?.id, option.id);
  assert.ok(results[0]?.canonicalHref.startsWith("/api-reference/"));
  assert.ok(results[0]?.canonicalHref.includes("#"), "nested option result should retain the DOC-4 anchor");
});

test("concept and goal discovery work without sidebar knowledge", () => {
  assert.ok(searchRecords(index, records, "canvas", {}, 20).results.length > 0);
  assert.ok(searchRecords(index, records, "create canvas", {}, 20).results.length > 0);
});

test("runtime/package filters are real data filters, not cosmetic controls", () => {
  const symbol = records.find((record) => record.kind === "api-symbol" && record.runtime.includes("node"));
  if (!symbol) throw new Error("No Node API symbol record generated");
  assert.ok(searchRecords(index, records, symbol.title, { runtime: "node", package: "apexify.js" }, 10).results.length > 0);
  assert.ok(searchRecords(index, records, "node", {}, 10).results.length > 0);
  assert.ok(searchRecords(index, records, "apexify.js", {}, 10).results.length > 0);
  assert.equal(searchRecords(index, records, symbol.title, { package: "@apexify/web" }, 10).results.length, 0);
  assert.deepEqual((filters as any).futurePackagesExposedAsCurrent, []);
});

test("fuzzy fallback never displaces an exact symbol", () => {
  const symbol = records.find((record) => record.kind === "api-symbol" && record.title.length >= 6);
  if (!symbol) throw new Error("No API symbol suitable for fuzzy test");
  const exact = searchRecords(index, records, symbol.title, {}, 5).results[0];
  assert.equal(exact?.id, symbol.id);
  const typo = `${symbol.title.slice(0, -1)}x`;
  assert.ok(searchRecords(index, records, typo, {}, 10).results.length > 0);
});

test("related content is explainable, duplicate-free, and never self-links", () => {
  for (const entry of (related as any).records) {
    const ids = entry.targets.map((target: any) => target.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(!ids.includes(entry.sourceId));
    assert.ok(entry.targets.every((target: any) => target.reasons.length > 0));
  }
});

test("diagnostic lookup uses only real current DOC-4 data", () => {
  assert.deepEqual((diagnostics as any).fabricatedCodes, []);
  for (const item of (diagnostics as any).publicCurrentCodes) {
    const result = searchRecords(index, records, item.code, {}, 5).results[0];
    assert.equal(result?.errorCode, item.code);
  }
});

test("completion query matrix passes every applicable category", () => {
  const matrix = completion as any;
  assert.equal(matrix.passedApplicable, true);
  for (const item of matrix.categories) {
    if (item.applicable) assert.equal(item.pass, true, item.category);
  }
});

test("coverage is complete for authoritative DOC-1/DOC-4/DOC-5 sources", () => {
  const value = coverage as any;
  assert.equal(value.docs.indexed, value.docs.total);
  assert.equal(value.apiSymbols.indexed, value.apiSymbols.total);
  assert.equal(value.apiOptions.indexed, value.apiOptions.total);
  assert.equal(value.apiTypes.indexed, value.apiTypes.total);
  assert.equal(value.examples.indexed, value.examples.total);
});

test("normal production search route contains no request-time filesystem traversal", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/docs/search/route.ts"), "utf8");
  assert.doesNotMatch(route, /node:fs|readdirSync|readFileSync|getAllMdxFiles|content\/docs/);
  assert.match(route, /generated\/docs-doc6/);
});

test("generated related content is consumed by routed docs, API, and example surfaces", () => {
  for (const relative of [
    "app/docs/[...slug]/page.tsx",
    "app/api-reference/[package]/[...symbol]/page.tsx",
    "app/examples/[id]/page.tsx",
  ]) {
    const source = fs.readFileSync(path.join(process.cwd(), relative), "utf8");
    assert.match(source, /RelatedContent/);
  }
  const component = fs.readFileSync(path.join(process.cwd(), "components/docs/search/RelatedContent.tsx"), "utf8");
  assert.match(component, /NextSteps/);
});
