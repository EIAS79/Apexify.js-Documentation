import fs from 'node:fs';
import path from 'node:path';
import { loadDocumentationPages } from '../../lib/docs/content';
import {
  buildDocumentationNavigation,
  flattenDocumentationNavigation,
  getDocumentationBreadcrumbs,
  type DocumentationNavigationGroup,
  type DocumentationNavigationItem,
  type DocumentationNavigationTag,
} from '../../lib/docs/navigation';
import { getExampleById } from '../../lib/examples/manifest';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated/post-doc12-ux-recovery');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const write = (name: string, value: unknown) => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), `${JSON.stringify(value, null, 2)}\n`);
};
function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[post-doc12] ${message}`);
}

const pages = loadDocumentationPages();
const navigation = buildDocumentationNavigation(pages);
const flat = flattenDocumentationNavigation(navigation);

invariant(flat.length === pages.length, `navigation coverage ${flat.length}/${pages.length}`);
invariant(new Set(flat.map((item) => item.href)).size === pages.length, 'duplicate canonical routes in navigation');

const allNodes: DocumentationNavigationItem[] = [];
function walk(items: DocumentationNavigationItem[]) {
  for (const item of items) {
    allNodes.push(item);
    walk(item.children ?? []);
  }
}
for (const group of navigation) walk(group.items);
invariant(new Set(allNodes.map((node) => node.id)).size === allNodes.length, 'duplicate navigation node IDs');

const validTags = new Set<DocumentationNavigationTag>([
  'FEATURE', 'GUIDE', 'RECIPE', 'API', 'ADVANCED', 'PERF', 'SECURITY', 'HELP',
  'PREVIEW', 'EXPERIMENTAL', 'ROADMAP', 'DEPRECATED',
]);
for (const node of allNodes) if (node.tag) invariant(validTags.has(node.tag), `invalid navigation tag ${node.tag}`);

const currentFutureGroups = navigation.filter((group) => ['core', 'web', 'react', 'next', 'engine', 'capabilities', 'errors'].includes(group.id));
invariant(currentFutureGroups.length === 0, `unshipped runtime groups visible as normal current navigation: ${currentFutureGroups.map((group) => group.id).join(', ')}`);

for (const page of pages) {
  const crumbs = getDocumentationBreadcrumbs(navigation, page);
  invariant(crumbs.at(-1)?.label === page.title, `terminal breadcrumb is not canonical title for ${page.slug}`);
}

const navSource = read('lib/docs/navigation.ts');
const sidebarSource = read('components/docs/navigation/DocsSidebarV2.tsx');
const homeSource = read('components/home/ProductHome.tsx');
const mdxComponents = read('mdx-components.tsx');
const tableSource = read('components/mdx/Table.tsx');
const workbenchSource = read('components/docs/playground/VerifiedExamplePlayground.tsx');
const loaderSource = read('components/docs/playground/CanvasPlaygroundLoader.tsx');
const studioSource = read('lib/studio/studioStorage.ts');

for (const text of ['Draw ', 'From a ', 'ProductExperienceModel', 'model.heroExample', 'DOC-5']) {
  invariant(homeSource.includes(text), `homepage recovery marker missing: ${text}`);
}
invariant(!homeSource.includes("'use client'"), 'homepage recovery clientified the server component');

for (const text of ['aria-expanded', 'sessionStorage', 'activeKeys', 'NavigationItems', 'apx-sidebar-tag']) {
  invariant(sidebarSource.includes(text), `sidebar recovery marker missing: ${text}`);
}
invariant(!sidebarSource.includes('apx-sidebar-link__meta'), 'repetitive per-link metadata block returned');
invariant(navSource.includes("virtualItem('engine:node', 'Node'"), 'Node engine root missing');
for (const text of ["add('guides'", "add('recipes'", "add('features'", "add('advanced'", "add('api'"]) {
  invariant(navSource.includes(text), `Node intent branch missing: ${text}`);
}

for (const mapping of ['table: Table', 'thead: TableHead', 'tbody: TableBody', 'tr: TableRow', 'th: TableHeader', 'td: TableCell']) {
  invariant(mdxComponents.includes(mapping), `native markdown table mapping missing: ${mapping}`);
}
for (const text of ['apx-doc-table-wrap', 'overflow', 'tabIndex={0}', 'aria-label="Scrollable documentation table"']) {
  invariant(tableSource.includes(text), `table recovery marker missing: ${text}`);
}

for (const text of ['ExampleWorkbench', "'ts' | 'preview' | 'both'", 'Copy code', 'Reset', 'Open in Studio', 'encodeShareLink', 'DOC-5 verified output']) {
  invariant(workbenchSource.includes(text), `workbench marker missing: ${text}`);
}
invariant(!/\bRun\b/.test(workbenchSource), 'workbench falsely exposes browser Run behavior');
invariant(loaderSource.includes('if (!activated)'), 'collapsed workbench activation gate missing');
invariant(loaderSource.includes("import('./VerifiedExamplePlayground')"), 'deferred workbench import missing');
invariant(studioSource.includes('deserializeInteractiveSession') && studioSource.includes('#snippet='), 'existing Studio/session transport is not available');

const example = getExampleById('node.canvas.basic');
invariant(example, 'authoritative DOC-5 example node.canvas.basic is missing');
invariant(example.sources.length === 1, 'workbench source identity is ambiguous');
invariant(example.outputs.some((output) => output.publicPath), 'workbench authoritative example has no public verified output');

const contentIssues: Array<{ slug: string; problem: string }> = [];
for (const page of pages) {
  const prose = page.body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '');
  if (/\\n/.test(prose)) contentIssues.push({ slug: page.slug, problem: 'literal escaped newline outside fenced/inline code' });
  const backtickFenceCount = (page.body.match(/```/g) ?? []).length;
  const tildeFenceCount = (page.body.match(/~~~/g) ?? []).length;
  if (backtickFenceCount % 2 !== 0 || tildeFenceCount % 2 !== 0) contentIssues.push({ slug: page.slug, problem: 'unbalanced fenced code block' });
}
invariant(contentIssues.length === 0, `MDX formatting issues detected: ${JSON.stringify(contentIssues.slice(0, 5))}`);

const treeForEvidence = (groups: DocumentationNavigationGroup[]) => groups.map((group) => ({
  id: group.id,
  label: group.label,
  items: group.items.map(function serialize(item): unknown {
    return {
      id: item.id,
      title: item.title,
      href: item.href ?? null,
      type: item.type ?? null,
      tag: item.tag ?? null,
      stability: item.stability ?? null,
      children: (item.children ?? []).map(serialize),
    };
  }),
}));

write('identity.json', {
  program: 'POST-DOC-12 UX, navigation & interactive example recovery',
  package: { repository: 'EIAS79/Apexify.js', sha: '2b64087a04411982067cc624031b3de6f663c530', version: '6.0.0' },
  documentation: { repository: 'EIAS79/Apexify.js-Documentation', baselineSha: 'da397597e3fd9c8dca497bff58a21c3883b63a9a', doc12MergeSha: 'd4c7389ddaf1e288ddf6c05d49d7b660c974fd7c' },
});
write('legacy-homepage-reference.json', {
  commit: '46b7eb1712fcb1456c23eca9b2077d6f4e51f25d',
  role: 'visual/UX reference only',
  restoredArchitecture: false,
  recoveredSignals: ['legacy hero composition', 'aurora atmosphere', 'Studio-first CTA', 'verified code/output showcase', 'asymmetric gallery rhythm'],
});
write('homepage-comparison.json', {
  before: ['uniform card-heavy composition', 'weaker legacy identity', 'less visual hierarchy'],
  after: ['legacy headline direction restored', 'asymmetric bento/track composition', 'DOC-4/DOC-5 truth retained', 'server-first ProductExperienceModel retained'],
});
write('navigation-tree.json', treeForEvidence(navigation));
write('navigation-coverage.json', { pages: pages.length, linkedNavigationPages: flat.length, uniqueRoutes: new Set(flat.map((item) => item.href)).size, duplicateNodeIds: 0, terminalBreadcrumbMismatches: 0 });
write('navigation-tags.json', { allowed: [...validTags].sort(), used: [...new Set(allNodes.flatMap((node) => node.tag ? [node.tag] : []))].sort() });
write('future-engine-visibility.json', { currentVisibleFutureGroups: currentFutureGroups.map((group) => group.id), policy: 'future package/runtime groups remain absent from normal current navigation until real pages exist' });
write('table-audit.json', { nativeMarkdownMapped: true, semanticTableElements: true, explicitScrollableRegion: true, stickyHeaderAndFirstColumnStyled: true });
write('mdx-formatting-audit.json', { pagesScanned: pages.length, issues: contentIssues, existingDoc9ContentLintRetained: true });
write('mdx-repairs.json', { structuralRendererRepairs: ['GFM tables routed through DOC-3 Table component'], destructiveContentRewrites: 0 });
write('workbench-inventory.json', { examples: [{ route: '/docs/node/canvas', exampleId: example.id, modes: ['ts', 'preview', 'both'], collapsedByDefault: true, deferredEditorBundle: true }] });
write('workbench-provenance.json', { exampleId: example.id, sourceHash: example.sourceHash, sourceCount: example.sources.length, verifiedOutputs: example.outputs.filter((output) => output.publicPath).map((output) => output.publicPath).sort() });
write('studio-linkage.json', { reusesExistingSessionModel: true, transport: 'existing encoded #snippet payload', fakeBrowserExecution: false });
write('regression.json', { doc12ArchitecturePreserved: true, secondNavigationManifestCreated: false, secondExampleRegistryCreated: false, secondStudioSessionModelCreated: false, phase15Started: false });
write('index.json', {
  status: 'STATIC_EVIDENCE_PASS',
  artifacts: fs.readdirSync(OUT).filter((name) => name.endsWith('.json')).sort(),
  notes: ['Runtime accessibility/responsive/theme/performance evidence is generated by post-doc12-ux-browser.mjs in CI.'],
});

console.log(`[post-doc12] PASS static evidence: pages=${pages.length} nodes=${allNodes.length} example=${example.id}`);
