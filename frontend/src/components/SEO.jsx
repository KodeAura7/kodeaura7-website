import { Helmet } from 'react-helmet-async';
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
  const url = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

  const breadcrumbJsonLd = path !== '/'
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: toBreadcrumbs(path).map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: item.item,
        })),
      }
    : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow" />
      <meta name="author" content={SITE_NAME} />

      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${fullTitle} — ${SITE_NAME}`} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${fullTitle} — ${SITE_NAME}`} />

      {breadcrumbJsonLd && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      )}
    </Helmet>
  );
}
