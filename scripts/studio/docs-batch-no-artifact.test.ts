import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { composeStudioSnippetFromDocs } from '../../lib/studio/studioConfig';
import { wrapStudioSnippetForRunner } from '../../lib/studio/runtime/wrapStudioSnippetForRunner';

const root = process.cwd();
const docs = fs.readFileSync(
  path.join(root, 'content/docs/03-feature-guides/raster-batch-output/01-batch-and-chain.mdx'),
  'utf8',
);
const executor = fs.readFileSync(
  path.join(root, 'lib/studio/runtime/isolatedNodeExecutor.ts'),
  'utf8',
);
const snippet = docs.match(/\x60{3}typescript\n(import \{ ApexPainter \}[\s\S]*?)\n\x60{3}/)?.[1];
if (!snippet) throw new Error('Batch documentation Studio entrypoint is missing');

test('the published batch example is valid TypeScript and declares its entrypoint', () => {
  const source = ts.createSourceFile('docs-batch.ts', snippet, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  assert.deepEqual(source.parseDiagnostics, []);
  const main = source.statements.find(
    (statement): statement is ts.FunctionDeclaration => ts.isFunctionDeclaration(statement) &&
      statement.name?.text === 'main',
  );
  assert.ok(main?.body, 'main() must be defined');
  assert.ok(main.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword));
  const returns = main.body.statements.filter(ts.isReturnStatement);
  assert.equal(returns.length, 1, 'the batch example must explicitly return its output');
  const output = returns[0]!.expression;
  assert.ok(output && ts.isArrayLiteralExpression(output), 'batch output must be an array');
  assert.deepEqual(output.elements.map(element => element.getText(source)), ['badge', 'label']);
  assert.match(snippet, /await painter\.batch\s*\(/);
  assert.match(snippet, /colorBg:\s*'#0f172a'/);
});

test('Docs to Studio handoff retains main() and both preview buffers', () => {
  const handoff = composeStudioSnippetFromDocs(snippet, 'typescript');
  assert.ok(handoff);
  assert.equal(handoff.lang, 'ts');
  assert.equal(handoff.ts, snippet.trim());
  const wrapped = wrapStudioSnippetForRunner(handoff.ts, {
    apexifyImportHref: 'file:///verified-runtime/dist/esm/index.js',
  });
  assert.match(wrapped, /const __result = await main\(\)/);
  assert.match(wrapped, /await __collect\(__result\)/);
  assert.match(wrapped, /return \[badge, label\]/);
});

test('the isolated runtime emits actionable 422 for missing outputs without exposing runtime debug', () => {
  assert.match(executor, /manifest\.artifacts\.length === 0/);
  assert.match(executor, /main\(\) finished without a previewable result/);
  assert.match(executor, /return \[badge, label\];/);
  const emptyBranch = executor.split('if (manifest.artifacts.length === 0)')[1]!
    .split('if (manifest.artifacts.length >')[0]!;
  assert.match(emptyBranch, /status: 422/);
  assert.doesNotMatch(emptyBranch, /runtimeDebug:/);
});
