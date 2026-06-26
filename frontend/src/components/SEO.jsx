import { useEffect } from 'react';
import { site } from '../constants/site';

export default function SEO({ title, description, path = '/' }) {
  useEffect(() => {
    const url = `${site.productionUrl}${path}`;
    const fullTitle = title === site.name ? title : `${title} | ${site.name}`;

    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:url', url);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertLink('canonical', url);
    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      url: site.productionUrl,
      email: site.email,
      address: site.location
    });
  }, [title, description, path]);

  return null;
}

function upsertMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function upsertJsonLd(data) {
  let element = document.head.querySelector('script[data-seo-jsonld="true"]');
  if (!element) {
    element = document.createElement('script');
    element.type = 'application/ld+json';
    element.dataset.seoJsonld = 'true';
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}
