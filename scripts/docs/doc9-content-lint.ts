import fs from 'node:fs';
import path from 'node:path';
import { DOC3_REGISTERED_COMPONENTS } from '../../components/mdx/doc3-contract';
import { loadDocumentationPages } from '../../lib/docs/content';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc9', 'content-lint-full.json');
const pages = loadDocumentationPages();
const pageByRoute = new Map(pages.map((page) => [page.canonicalPath, page]));
const registered = new Set<string>(DOC3_REGISTERED_COMPONENTS);
const apiManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'generated/docs-doc4/api-manifest.json'), 'utf8')) as any;
const exampleManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'generated/docs-doc5/example-manifest.json'), 'utf8')) as any;
const apiRoutes = new Set<string>([
  '/api-reference',
  ...apiManifest.symbols.map((symbol: any) => symbol.href),
  ...apiManifest.symbols.flatMap((symbol: any) => symbol.members.map((member: any) => member.href)),
]);
const exampleRoutes = new Set<string>(exampleManifest.examples.map((example: any) => example.canonicalRoute));
const siteRoutes = new Set<string>(['/', '/gallery', '/studio', ...apiRoutes, ...exampleRoutes]);

type Finding = { source: string; rule: string; detail: string };
const errors: Finding[] = [];
const warnings: Finding[] = [];

function addError(source: string, rule: string, detail: string) {
  errors.push({ source, rule, detail });
}
function addWarning(source: string, rule: string, detail: string) {
  warnings.push({ source, rule, detail });
}
function safeDecode(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}
function stripCode(body: string): string {
  return body.replace(/```[\s\S]*?```/g, '');
}

for (const page of pages) {
  const body = page.body;
  const prose = stripCode(body);
  const headings = page.headings;

  if (!headings.length || headings[0].level !== 1) {
    addError(page.sourcePath, 'heading-root', 'active page must start with an H1');
  }
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index].level > headings[index - 1].level + 1) {
      addError(page.sourcePath, 'heading-level', `heading level jumps from H${headings[index - 1].level} to H${headings[index].level}: ${headings[index].text}`);
    }
  }
  const headingIds = headings.map((heading) => heading.id);
  for (const id of new Set(headingIds.filter((id, index) => headingIds.indexOf(id) !== index))) {
    addError(page.sourcePath, 'duplicate-heading-id', id);
  }

  for (const match of prose.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (!match[1].trim()) addError(page.sourcePath, 'missing-alt', `Markdown image ${match[2]} has empty alt text`);
  }
  for (const match of prose.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt\s*=\s*(['"])[^'"]+\1/i.test(match[1])) addError(page.sourcePath, 'missing-alt', 'raw <img> is missing non-empty alt text');
  }

  for (const match of prose.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)) {
    const name = match[1];
    if (!registered.has(name)) addError(page.sourcePath, 'unsupported-component', name);
  }

  for (const match of prose.matchAll(/<(script|style|iframe|object|embed|form|input|textarea|button)\b/gi)) {
    addError(page.sourcePath, 'unsafe-raw-html', match[1].toLowerCase());
  }
  for (const match of prose.matchAll(/<([a-z][a-z0-9-]*)\b/gi)) {
    const tag = match[1].toLowerCase();
    if (!['a', 'br', 'code', 'kbd', 'sub', 'sup', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'].includes(tag)) {
      addWarning(page.sourcePath, 'raw-html-review', tag);
    }
  }

  const fenceLines = body.split('\n').filter((line) => line.startsWith('```'));
  if (fenceLines.length % 2 !== 0) addError(page.sourcePath, 'code-fence', 'unbalanced fenced code block');
  for (const line of fenceLines.filter((_line, index) => index % 2 === 0)) {
    const metadata = line.slice(3).trim();
    if ((metadata.match(/"/g)?.length ?? 0) % 2 !== 0 || (metadata.match(/'/g)?.length ?? 0) % 2 !== 0) {
      addError(page.sourcePath, 'code-metadata', `unbalanced quotes in fence metadata: ${metadata}`);
    }
  }

  const hrefs = [
    ...[...prose.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]),
    ...[...prose.matchAll(/href=(['"])([^'"]+)\1/g)].map((match) => match[2]),
  ];
  for (const rawHref of hrefs) {
    if (!rawHref || /^(?:https?:|mailto:|tel:)/i.test(rawHref)) continue;
    if (rawHref.startsWith('/docs#')) {
      addError(page.sourcePath, 'legacy-link', rawHref);
      continue;
    }
    if (rawHref.startsWith('#')) {
      const anchor = safeDecode(rawHref.slice(1));
      if (anchor && !headingIds.includes(anchor)) addError(page.sourcePath, 'broken-anchor', rawHref);
      continue;
    }
    if (!rawHref.startsWith('/')) continue;
    const [pathPart, fragmentPart] = rawHref.split('#', 2);
    if (pathPart.startsWith('/docs/')) {
      const target = pageByRoute.get(pathPart);
      if (!target) {
        addError(page.sourcePath, 'broken-internal-link', rawHref);
        continue;
      }
      if (fragmentPart) {
        const targetIds = target.headings.map((heading) => heading.id);
        const anchor = safeDecode(fragmentPart);
        if (!targetIds.includes(anchor)) addError(page.sourcePath, 'broken-anchor', rawHref);
      }
      continue;
    }
    if (!siteRoutes.has(pathPart) && !pathPart.startsWith('/api-reference/') && !pathPart.startsWith('/examples/')) {
      addWarning(page.sourcePath, 'unverified-site-link', rawHref);
    }
  }
}

errors.sort((a, b) => `${a.source}:${a.rule}:${a.detail}`.localeCompare(`${b.source}:${b.rule}:${b.detail}`));
warnings.sort((a, b) => `${a.source}:${a.rule}:${a.detail}`.localeCompare(`${b.source}:${b.rule}:${b.detail}`));
const artifact = {
  schemaVersion: 1,
  phase: 'DOC-9',
  pageCount: pages.length,
  rules: [
    'heading-root',
    'heading-level',
    'duplicate-heading-id',
    'missing-alt',
    'unsupported-component',
    'unsafe-raw-html',
    'code-fence',
    'code-metadata',
    'legacy-link',
    'broken-internal-link',
    'broken-anchor',
  ],
  errorCount: errors.length,
  warningCount: warnings.length,
  errors,
  warnings,
  status: errors.length ? 'FAIL' : 'PASS',
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(artifact, null, 2)}\n`);
if (errors.length) {
  console.error(`[doc9-content-lint] FAIL — ${errors.length} errors, ${warnings.length} review warnings`);
  for (const finding of errors.slice(0, 50)) console.error(`${finding.source} [${finding.rule}] ${finding.detail}`);
  process.exit(1);
}
console.log(`[doc9-content-lint] PASS — ${pages.length} canonical pages, ${warnings.length} review warnings`);
