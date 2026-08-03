import { z } from 'zod';

/**
 * Universal fields every entity/category/region/listicle has, in every
 * vertical. Nothing vertical-specific lives in this file -- that's the
 * whole point of the engine. Vertical differences live entirely in
 * `core_facts`, validated per-vertical via /src/lib/schema/core-facts.
 */

export const STATUS_VALUES = ['active', 'draft', 'needs_review', 'archived'];

// Lowercase kebab-case, used for entity_id/category_id/region_id/listicle_id
// AND slug -- keeping ids and slugs in the same format means URLs, file
// names, and ids can stay identical, which keeps routing (Step 4) simple.
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugSchema = z.string().regex(slugPattern, 'must be lowercase kebab-case, e.g. "half-marathon"');

export const sourceRefSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1),
  type: z.enum(['official', 'registration_platform', 'aggregator', 'review', 'social', 'other']),
  last_checked: z.string().min(1).optional(), // ISO date string, e.g. "2026-07-20"
});

export const excerptQuoteSchema = z.object({
  quote: z.string().min(1).max(400),
  attribution: z.string().min(1),
  source_url: z.string().url().optional(),
});

export const faqSchema = z.object({
  question: z.string().min(1),
  // SEO requirement: every FAQ answer should open with a direct 40-60 word
  // answer before any elaboration. Word count isn't enforced here (too
  // brittle for a schema -- a good 39-word answer shouldn't fail a build)
  // but validate-data.js emits a warning outside that range so it gets
  // caught in review rather than silently shipping a bad FAQ.
  answer: z.string().min(1),
});

export const ctaLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  // Free-form on purpose: matches site.config.json's primaryCTAType for the
  // main CTA, but an entity can carry secondary CTA types too (e.g. a race
  // might have "official_website" and "registration" both).
  type: z.string().min(1),
});

export const affiliateLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  network: z.string().optional(),
  disclosure: z.string().optional(),
});

export const sentimentBreakdownItemSchema = z.object({
  // e.g. "Value for money", "Response time", "Lounge quality" -- the
  // vertical instance decides the labels via its seed data; the engine
  // itself has no opinion on what breakdown categories exist.
  label: z.string().min(1),
  score: z.number().min(0).max(100),
});

export const sentimentScoresSchema = z.object({
  overall: z.number().min(0).max(100),
  breakdown: z.array(sentimentBreakdownItemSchema).default([]),
});

// 2026-08-03: curated links to independent, real-world coverage -- a named
// blogger's written review or a real YouTube creator's video, each found on
// the open web and linked back to its original source (never rehosted or
// quoted at length -- see ExternalCoverage.astro). Deliberately separate
// from source_mix (which is the research pipeline's internal fact-sourcing
// trail, often including aggregators like TripAdvisor) -- this is reader-
// facing "see what real people said elsewhere" content, capped and curated
// for recency (last ~1-2 years) and credibility, not an exhaustive log.
export const externalReviewSchema = z.object({
  title: z.string().min(1),
  source: z.string().min(1), // publication/site name, e.g. "The Travel Temple"
  author: z.string().optional(),
  url: z.string().url(),
  published_date: z.string().min(1), // ISO date, e.g. "2025-06-09"
  // Our own short paraphrase of what the piece covers -- never a verbatim
  // excerpt of the source's copyrighted text.
  summary: z.string().min(1).max(240),
});

export const externalVideoSchema = z.object({
  title: z.string().min(1),
  channel: z.string().min(1),
  url: z.string().url(),
  video_id: z.string().min(1), // YouTube video id, used to build the embed
  published_date: z.string().min(1).optional(), // ISO date if known
  view_count: z.number().int().nonnegative().optional(),
});

export const externalCoverageSchema = z
  .object({
    reviews: z.array(externalReviewSchema).default([]),
    videos: z.array(externalVideoSchema).default([]),
  })
  .optional();

// A single lead/hero image for an entity. Deliberately provider-agnostic:
// `url` points at whatever licensed source supplies it (an affiliate image
// CDN like Hotellook/Expedia, or a CC-licensed source such as Wikimedia).
// Images are hotlinked from that source per the provider's terms -- never
// downloaded and rehosted here. `credit`/`source_url` carry attribution for
// licenses that require it (CC-BY and friends); affiliate-CDN images that
// don't require visible credit simply omit them. `alt` is required whenever
// an image is present, so a populated image can never ship without the alt
// text that both accessibility and image SEO depend on.
export const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1),
  credit: z.string().optional(),
  source_url: z.string().url().optional(),
});

export const baseEntitySchema = z.object({
  entity_id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  category_id: z.string().min(1),
  region_id: z.string().min(1),
  // One-sentence direct-answer intro, used as the entity page's opening
  // line and in listicle cards. Kept short deliberately.
  short_description: z.string().min(1).max(220),
  ai_summary: z.string().min(1),
  // Shape validated separately per verticalKey -- see
  // src/lib/schema/core-facts/index.js and getEntitySchema() below.
  core_facts: z.record(z.any()),
  pros: z.array(z.string().min(1)).default([]),
  cons: z.array(z.string().min(1)).default([]),
  sentiment_scores: sentimentScoresSchema.optional(),
  excerpt_quotes: z.array(excerptQuoteSchema).default([]),
  external_coverage: externalCoverageSchema,
  // Optional lead image; entities without one fall back to the duotone
  // placeholder panel in EntityCard. See imageSchema above.
  image: imageSchema.optional(),

  // Output of the web-research stage (scripts/research-entities.js), kept
  // deliberately separate from core_facts. core_facts is what a named
  // source page states and is re-verified weekly; these are what the wider
  // web says about the entity -- useful, but opinion rather than record.
  // Mixing the two would let commentary quietly acquire the authority of a
  // verified fact.
  //
  // zod strips undeclared keys on parse, so a stage that wants to persist
  // something new must declare it here first or the write silently drops it.
  research_highlights: z.array(z.string().min(1)).default([]),
  research_watchouts: z.array(z.string().min(1)).default([]),
  research_confidence: z.enum(['high', 'medium', 'low']).optional(),
  // ISO date of the last web-research pass. Drives the re-research
  // interval, and is separate from last_updated (which any stage bumps).
  research_last_updated: z.string().min(1).optional(),
  faqs: z.array(faqSchema).default([]),
  reliability_score: z.number().min(0).max(100),
  tags: z.array(z.string().min(1)).default([]),
  source_mix: z.array(sourceRefSchema).default([]),
  affiliate_links: z.array(affiliateLinkSchema).default([]),
  cta_links: z.array(ctaLinkSchema).default([]),
  related_entity_ids: z.array(z.string().min(1)).default([]),
  last_updated: z.string().min(1), // ISO date, e.g. "2026-07-29"
  status: z.enum(STATUS_VALUES),
});

export const categorySchema = z.object({
  category_id: z.string().min(1),
  slug: slugSchema,
  label: z.string().min(1), // display label, e.g. "Full Marathon" / "Marriott Bonvoy"
  short_description: z.string().min(1),
  intro: z.string().min(1).optional(), // longer unique hub-page intro paragraph
  related_category_ids: z.array(z.string()).default([]),
  faqs: z.array(faqSchema).default([]),
  // Optional numeric range [min, max|null] this category corresponds to on
  // whatever scale a vertical's core_facts uses a number for (e.g. race
  // distance in km, hotel star rating, course duration in hours). null max
  // means unbounded above. Lets a page classify a raw core_facts number
  // (e.g. one entry of races' distance_km array) against the nearest
  // matching category without any vertical-specific logic living in /src --
  // see src/lib/categoryMatch.js. Omit entirely for verticals/categories
  // that don't bucket entities along a numeric axis.
  matchRange: z.tuple([z.number(), z.number().nullable()]).optional(),
  // Optional visual-emphasis hint a vertical can set per category (e.g. the
  // marquee/most-searched option), used by pill/badge rendering wherever a
  // category label is shown as a chip. Purely presentational.
  badgeVariant: z.enum(['success', 'warning', 'neutral']).default('neutral'),
  last_updated: z.string().min(1),
  status: z.enum(STATUS_VALUES),
});

export const regionSchema = z.object({
  region_id: z.string().min(1),
  slug: slugSchema,
  label: z.string().min(1), // e.g. "Thailand" / "Nong Khai" / "Bangkok"
  // Free-form on purpose, but should use the vocabulary implied by
  // site.config.json.regionGranularity (e.g. "country", "city", "district").
  granularity: z.string().min(1),
  // Supports hierarchical regions (country -> city -> district) so a single
  // regionGranularity like "country+city" can have real parent/child pages
  // without the engine needing separate route types per level.
  parent_region_id: z.string().nullable().optional(),
  short_description: z.string().min(1),
  intro: z.string().min(1).optional(),
  // Optional hero image for the region hub page (e.g. a city skyline). Same
  // provider-agnostic shape as entities -- see imageSchema.
  image: imageSchema.optional(),
  faqs: z.array(faqSchema).default([]),
  last_updated: z.string().min(1),
  status: z.enum(STATUS_VALUES),
});

export const listicleFilterSchema = z.object({
  region_id: z.string().optional(),
  category_id: z.string().optional(),
  tags_any: z.array(z.string()).optional(),
  // Generic filter predicates over core_facts, so a listicle can express
  // vertical-specific conditions ("distance_km contains 42.195", "price
  // under X") without the engine needing per-vertical filter code.
  core_facts_filters: z
    .array(
      z.object({
        field: z.string().min(1),
        op: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
        value: z.any(),
      })
    )
    .optional(),
  sort_by: z.string().optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().positive().optional(),
});

export const listicleSchema = z.object({
  listicle_id: z.string().min(1),
  slug: slugSchema,
  title: z.string().min(1),
  intro: z.string().min(1),
  filters: listicleFilterSchema,
  // Editorial pin/override: entities listed here are included regardless of
  // (or in addition to, per Step 4's implementation) the filters above. This
  // is what makes listicles "generated from structured filters + editorial
  // config, not written manually from scratch" -- editors add a filter and
  // optionally pin/exclude specific entities, they don't hand-write the list.
  manual_entity_ids: z.array(z.string()).default([]),
  editorial_notes: z.string().optional(),
  faqs: z.array(faqSchema).default([]),
  last_updated: z.string().min(1),
  status: z.enum(STATUS_VALUES),
});
