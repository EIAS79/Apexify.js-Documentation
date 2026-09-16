import type { MetadataRoute } from 'next';
import { loadDocumentationPages } from '@/lib/docs/content';
import { getApiManifest } from '@/lib/api-reference/manifest';
import { exampleManifest } from '@/lib/examples/manifest';
import { absoluteSiteUrl } from '@/lib/site';

const STATIC_ROUTES = ['/', '/api-reference', '/gallery', '/studio'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = loadDocumentationPages()
    .filter((page) => !['ROADMAP', 'REMOVED'].includes(page.stability))
    .map((page) => page.canonicalPath);
  const api = getApiManifest().symbols.map((symbol) => symbol.href);
  const examples = exampleManifest.examples.map((example) => `/examples/${example.id}`);
  const routes = [...new Set<string>([...STATIC_ROUTES, ...docs, ...api, ...examples])]
    .filter((route) => route.startsWith('/') && !route.startsWith('/__docs-fixtures/') && !route.startsWith('/api/'))
    .sort((a, b) => a.localeCompare(b));

  return routes.map((route) => ({
    url: absoluteSiteUrl(route),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/docs/getting-started' ? 0.9 : 0.7,
  }));
}
