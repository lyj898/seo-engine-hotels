/**
 * Schema.org JSON-LD builders. Every builder is a pure function -- data in,
 * plain object out -- so pages call these instead of hand-writing schema,
 * and no page ever defines its breadcrumb/FAQ/list data twice (once for
 * display, once for schema). Whether a page actually includes a given
 * schema is gated by site.config.json.enabledFeatures (faqSchema /
 * itemListSchema) at the call site in each page, not in here, so these
 * stay simple and reusable.
 */

/** items: [{ label, href }] (same shape Breadcrumb.astro renders). */
export function buildBreadcrumbListSchema(items, site) {
  if (!items?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href ? new URL(item.href, site).toString() : undefined,
    })),
  };
}

/** faqs: [{ question, answer }] (same shape FAQSection.astro renders). */
export function buildFaqPageSchema(faqs) {
  if (!faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generic ranked-list schema for hub pages and listicles.
 * items: any array; toUrl(item) and toName(item) extract what's needed --
 * keeps this usable for entities, categories, regions, or listicles alike.
 */
export function buildItemListSchema(items, site, toUrl, toName) {
  if (!items?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: new URL(toUrl(item), site).toString(),
      name: toName(item),
    })),
  };
}

/**
 * Primary entity schema, typed from site.config.json.schemaTypePrimary
 * (e.g. "SportsEvent", "Hotel", "Course", "LocalBusiness", "Service") --
 * never hardcoded per vertical. Property mapping from core_facts is
 * best-effort and generic: a property is only added when the corresponding
 * core_fact actually exists, so this never invents data for a vertical
 * whose core_facts don't happen to include a given concept.
 *
 * Deliberately does NOT map reliability_score to schema.org's
 * `aggregateRating` -- that property specifically means user/reviewer
 * ratings, and reliability_score is a source-verification confidence
 * score, not a review. Misusing aggregateRating would be misleading
 * structured data.
 */
export function buildEntitySchema(entity, siteConfig, url) {
  const facts = entity.core_facts ?? {};
  const schema = {
    '@context': 'https://schema.org',
    '@type': siteConfig.schemaTypePrimary,
    name: entity.name,
    description: entity.short_description,
  };
  if (url) schema.url = url;

  // Hotels carry a single free-text address string in core_facts; schema.org
  // accepts address as Text, so surface it when present (races/other verticals
  // that use venue/city/country instead are handled by the location block).
  if (facts.address) schema.address = facts.address;

  if (facts.date) schema.startDate = facts.date;

  if (facts.venue || facts.city || facts.country) {
    schema.location = {
      '@type': 'Place',
      name: facts.venue || [facts.city, facts.country].filter(Boolean).join(', '),
      address: {
        '@type': 'PostalAddress',
        ...(facts.city ? { addressLocality: facts.city } : {}),
        ...(facts.country ? { addressCountry: facts.country } : {}),
      },
    };
  }

  if (facts.organizer) {
    schema.organizer = { '@type': 'Organization', name: facts.organizer };
  }

  if (facts.price_range) {
    schema.offers = {
      '@type': 'Offer',
      description: facts.price_range,
      ...(url ? { url } : {}),
    };
  }

  // schema.org's `sameAs` means "reference page for this entity", and every
  // record carries an official first-party URL in source_mix. Emitting it
  // lets a consumer resolve WHICH real-world thing this page describes
  // rather than inferring it from the name string -- which matters for
  // machine readers (answer engines, knowledge graphs) that otherwise have
  // to guess between similarly-named properties. Highest-coverage
  // structured-data addition available here: 100% of records have one.
  const officialUrls = (entity.source_mix ?? [])
    .filter((source) => source?.type === 'official' && source?.url)
    .map((source) => source.url);
  if (officialUrls.length > 0) {
    schema.sameAs = officialUrls.length === 1 ? officialUrls[0] : officialUrls;
  }

  // Same best-effort rule as every mapping above: emit only when the fact
  // is actually present and the right shape, so a vertical whose core_facts
  // don't carry these concepts simply never emits them.
  if (facts.brand_sub_brand) {
    schema.brand = { '@type': 'Brand', name: facts.brand_sub_brand };
  }
  if (typeof facts.star_rating === 'number') {
    schema.starRating = { '@type': 'Rating', ratingValue: facts.star_rating };
  }
  if (typeof facts.rooms === 'number') {
    schema.numberOfRooms = facts.rooms;
  }

  return schema;
}

export function buildWebsiteSchema(siteConfig, site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.siteName,
    description: siteConfig.siteTagline,
    url: site,
  };
}
