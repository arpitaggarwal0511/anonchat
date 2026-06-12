import type { MetadataRoute } from 'next';
import { siteConfig } from './seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/favicon1.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}
