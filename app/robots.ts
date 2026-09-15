import type { MetadataRoute } from 'next';
import { SITE_ORIGIN, absoluteSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/__docs-fixtures/'],
    },
    sitemap: absoluteSiteUrl('/sitemap.xml'),
    host: SITE_ORIGIN,
  };
}
