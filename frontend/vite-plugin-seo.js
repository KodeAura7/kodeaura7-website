import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SITE_URL = 'https://kodeaura7.in';

const PUBLIC_ROUTES = [
  { path: '/',          changefreq: 'weekly',  priority: '1.0' },
  { path: '/services',  changefreq: 'monthly', priority: '0.9' },
  { path: '/portfolio', changefreq: 'monthly', priority: '0.8' },
  { path: '/about',     changefreq: 'monthly', priority: '0.7' },
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urls = PUBLIC_ROUTES.map(({ path, changefreq, priority }) =>
    [
      '  <url>',
      `    <loc>${SITE_URL}${path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n')
  ).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
    '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    urls,
    '</urlset>',
  ].join('\n');
}

function generateRobots() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /sign-in',
    'Disallow: /sign-up',
    'Disallow: /forgot-password',
    'Disallow: /reset-password/',
    'Disallow: /welcome',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join('\n');
}

export function viteSeoPlugin() {
  let outDir;
  return {
    name: 'vite-seo',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      try {
        writeFileSync(resolve(outDir, 'sitemap.xml'), generateSitemap(), 'utf-8');
        writeFileSync(resolve(outDir, 'robots.txt'), generateRobots(), 'utf-8');
        console.log('\n  ✓ SEO: generated sitemap.xml and robots.txt');
      } catch (err) {
        console.warn('\n  ✗ SEO plugin failed:', err.message);
      }
    },
  };
}
