import { useEffect } from 'react';
import { site } from '../constants/site';

const SITE_URL = site.productionUrl;
const SITE_NAME = site.name;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const TWITTER_HANDLE = '@kodeaura7';

// eslint-disable-next-line react-refresh/only-export-components
export function upsertMeta(attribute, key, content) {
  let el = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// eslint-disable-next-line react-refresh/only-export-components
export function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// eslint-disable-next-line react-refresh/only-export-components
export function upsertJsonLd(key, data) {
  let el = document.head.querySelector(`script[data-schema="${key}"]`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.dataset.schema = key;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// eslint-disable-next-line react-refresh/only-export-components
export function removeJsonLd(key) {
  document.head.querySelector(`script[data-schema="${key}"]`)?.remove();
}

function toBreadcrumbs(path) {
  const segments = path.split('/').filter(Boolean);
  return [
    { name: SITE_NAME, item: SITE_URL },
    ...segments.map((seg, i) => ({
      name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      item: `${SITE_URL}/${segments.slice(0, i + 1).join('/')}`,
    })),
  ];
}

export default function SEO({
  title,
  description,
  path = '/',
  image,
  keywords,
  type = 'website',
}) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    const ogImage = image || DEFAULT_OG_IMAGE;
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;

    upsertMeta('name', 'description', description);
    if (keywords) upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'robots', 'index, follow');
    upsertMeta('name', 'author', SITE_NAME);

    upsertLink('canonical', url);

    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:image:width', '1200');
    upsertMeta('property', 'og:image:height', '630');
    upsertMeta('property', 'og:image:alt', `${fullTitle} — ${SITE_NAME}`);
    upsertMeta('property', 'og:locale', 'en_IN');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:site', TWITTER_HANDLE);
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);
    upsertMeta('name', 'twitter:image:alt', `${fullTitle} — ${SITE_NAME}`);

    if (path !== '/') {
      upsertJsonLd('breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: toBreadcrumbs(path).map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: item.item,
        })),
      });
    } else {
      removeJsonLd('breadcrumb');
    }
  }, [title, description, path, image, keywords, type]);

  return null;
}
