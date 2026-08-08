import siteConfig from '../lib/config.js';
import { urls } from '../lib/urls.js';
import { loadEntities, loadCategories, loadRegions, loadListicles, stripMeta, isPublished } from '../lib/data.js';

/**
 * Build-time-generated sitemap, enumerating every real route this engine
 * produces -- static pages, plus every active entity/category/region/
 * listicle from /data. Uses the same `urls` helpers every page/component
 * uses, so the sitemap can never drift out of sync with actual routes.
 */

// ISO date -> "YYYY-MM-DD", the <lastmod> format the sitemap spec wants.
// Guards against a malformed data date producing an invalid tag rather than
// just omitting <lastmod> for that one URL.
function toLastmod(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export async function GET({ site }) {
  const entities = loadEntities().map(stripMeta).filter(isPublished);
  const categories = loadCategories().map(stripMeta).filter(isPublished);
  const regions = loadRegions().map(stripMeta).filter(isPublished);
  const listicles = loadListicles().map(stripMeta).filter(isPublished);

  // The most recent last_updated across all published content -- used as
  // <lastmod> for static hub pages (home, categories index, regions index),
  // since those pages' content changes whenever anything they list does.
  const allLastUpdated = [...entities, ...categories, ...regions, ...listicles]
    .map((item) => toLastmod(item.last_updated))
    .filter(Boolean)
    .sort();
  const siteLastmod = allLastUpdated[allLastUpdated.length - 1] ?? null;

  const staticPaths = [
    urls.home(),
    urls.categoriesIndex(),
    urls.regionsIndex(),
    ...(siteConfig.enabledFeatures?.listicles ? [urls.listiclesIndex()] : []),
    urls.about(),
    urls.privacy(),
    urls.terms(),
    urls.contact(),
  ].map((path) => ({ path, lastmod: siteLastmod }));

  const dynamicPaths = [
    ...categories.map((c) => ({ path: urls.category(c.slug), lastmod: toLastmod(c.last_updated) })),
    ...regions.map((r) => ({ path: urls.region(r.slug), lastmod: toLastmod(r.last_updated) })),
    ...entities.map((e) => ({
      path: urls.entity(e.slug),
      lastmod: toLastmod(e.research_last_updated ?? e.last_updated),
    })),
    ...(siteConfig.enabledFeatures?.listicles
      ? listicles.map((l) => ({ path: urls.listicle(l.slug), lastmod: toLastmod(l.last_updated) }))
      : []),
  ];

  const urlEntries = [...staticPaths, ...dynamicPaths]
    .map(({ path, lastmod }) => {
      const loc = `<loc>${new URL(path, site).toString()}</loc>`;
      return `  <url>${loc}${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
