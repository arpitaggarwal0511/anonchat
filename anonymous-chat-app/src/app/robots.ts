import type { MetadataRoute } from 'next';
import { absoluteUrl } from './seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/chat/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
