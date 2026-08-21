import { buildRegionAncestryMap, isPublished } from './data.js';
import { entityMatchesCategory } from './categoryMatch.js';
import { participatesInProgram } from './loyalty.js';

/**
 * Resolves a listicle's `filters` + `manual_entity_ids` into an actual
 * ordered entity list at build time. This is the "generated from
 * structured filters + editorial config, not written manually from
 * scratch" requirement -- editors add a filter (and optionally pin/exclude
 * specific entities); they never hand-maintain the list itself.
 */
export function resolveListicleEntities(listicle, entities, regions, categories = []) {
  const ancestryMap = buildRegionAncestryMap(regions);
  const filters = listicle.filters ?? {};
  const manualIds = listicle.manual_entity_ids ?? [];

  let results = entities.filter((entity) => {
    if (filters.region_id) {
      const chain = ancestryMap.get(entity.region_id) ?? [entity.region_id];
      if (!chain.includes(filters.region_id)) return false;
    }
    if (filters.category_id) {
      // Same membership rule as the category hub pages: an entity counts if
      // the category is its marquee one OR one of its numeric facts falls in
      // that category's range. Otherwise a "Best 5K" guide would be empty
      // while the 5K hub listed 144 entries.
      const target = categories.find((c) => c.category_id === filters.category_id);
      if (target ? !entityMatchesCategory(entity, target, categories) : entity.category_id !== filters.category_id) return false;

      // A category-scoped guide is titled after the category ("Best ALL --
      // Accor Live Limitless hotels in Indonesia"), so its entries have to be
      // able to back that claim. An entity that carries the category's brand
      // without participating in it (hotels' loyalty_participation -- see
      // lib/loyalty.js) is filtered out here rather than via a per-guide
      // filter in each JSON file, so a newly generated guide can't quietly
      // ship without it. participatesInProgram() is true for any entity that
      // doesn't carry the field, so this is inert for other verticals.
      if (!participatesInProgram(entity)) return false;
    }
    if (filters.tags_any?.length) {
      const hasTag = filters.tags_any.some((tag) => entity.tags?.includes(tag));
      if (!hasTag) return false;
    }
    if (filters.core_facts_filters?.length) {
      const allMatch = filters.core_facts_filters.every((cond) => matchesCoreFactsFilter(entity.core_facts, cond));
      if (!allMatch) return false;
    }
    return isPublished(entity);
  });

  // Editorial pins: include manually-listed entities even if they don't
  // match the filters, without duplicating an entity that matched both ways.
  const resultIds = new Set(results.map((e) => e.entity_id));
  for (const id of manualIds) {
    if (resultIds.has(id)) continue;
    const pinned = entities.find((e) => e.entity_id === id);
    if (pinned) {
      results.push(pinned);
      resultIds.add(id);
    }
  }

  if (filters.sort_by) {
    const dir = filters.sort_direction === 'asc' ? 1 : -1;
    results = [...results].sort((a, b) => {
      const av = getSortValue(a, filters.sort_by);
      const bv = getSortValue(b, filters.sort_by);
      // An entity missing the sort value (e.g. a too-new hotel with no
      // sentiment_scores yet) always sorts last, regardless of direction.
      // Without this, `av > bv` and `bv > av` are BOTH false when one side
      // is undefined, so the comparator isn't consistent and an unscored
      // entity can land anywhere the sort algorithm happens to place it --
      // including first, which is exactly backwards for a "best of" list.
      const aMissing = av == null;
      const bMissing = bv == null;
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }

  if (filters.limit) {
    results = results.slice(0, filters.limit);
  }

  return results;
}

/**
 * Every entity a guide's filters match, IGNORING `filters.limit`.
 *
 * This is what a phrase like "57 hotels" in a guide's prose actually means
 * -- the size of the market the guide covers, not the 15 rows it chooses to
 * show. Prose used to hardcode that number, which then silently went stale
 * every time the catalogue grew (and did: three guides shipped an intro and
 * an FAQ stating different counts for the same page). Pair this with
 * fillListicleCounts so the number is derived at build time instead.
 *
 * The display list is just this list sliced to `limit`, since the resolver
 * sorts before slicing -- so a caller needs only this one call.
 */
export function resolveListicleMatchesUnlimited(listicle, entities, regions, categories = []) {
  const { limit, ...withoutLimit } = listicle?.filters ?? {};
  return resolveListicleEntities({ ...listicle, filters: withoutLimit }, entities, regions, categories);
}

/**
 * Replaces the `{{count}}` placeholder in guide copy with the live match
 * count. Every surface that renders a guide's intro has to run this --
 * page body, <meta description>, FAQ answers (both the visible ones and
 * the FAQPage schema built from them), the /best/ index and the home page
 * -- or a raw `{{count}}` leaks to a reader or into a search result.
 */
export function fillListicleCounts(text, count) {
  return typeof text === 'string' ? text.replaceAll('{{count}}', String(count)) : text;
}

function getCoreFactValue(coreFacts, field) {
  return field.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), coreFacts);
}

// Resolves a dotted path against any part of the entity -- not just
// core_facts -- so a vertical whose ranking signal lives elsewhere (e.g.
// hotels' sentiment_scores.overall guest-sentiment score) can be a sort_by
// value without this file knowing what "sentiment_scores" means.
function getSortValue(entity, sortBy) {
  if (sortBy in entity) return entity[sortBy];
  const direct = getCoreFactValue(entity, sortBy);
  if (direct !== undefined) return direct;
  return getCoreFactValue(entity.core_facts, sortBy);
}

function matchesCoreFactsFilter(coreFacts, cond) {
  const value = getCoreFactValue(coreFacts, cond.field);
  switch (cond.op) {
    case 'eq':
      return value === cond.value;
    case 'neq':
      return value !== cond.value;
    case 'gt':
      return value > cond.value;
    case 'gte':
      return value >= cond.value;
    case 'lt':
      return value < cond.value;
    case 'lte':
      return value <= cond.value;
    case 'in':
      return Array.isArray(cond.value) && cond.value.includes(value);
    case 'contains':
      return Array.isArray(value) ? value.includes(cond.value) : String(value ?? '').includes(cond.value);
    default:
      return true;
  }
}
