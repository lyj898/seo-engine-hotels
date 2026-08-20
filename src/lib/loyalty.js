// Loyalty-program participation helpers.
//
// Same shape of decision as lib/brand.js: this is hotels-vertical knowledge
// that deliberately lives in its own module rather than being threaded
// through the generic components, and every helper degrades to "nothing to
// say" for an entity that doesn't carry the field. A races instance calling
// participatesInProgram() gets `true` for every race and nothing changes.
//
// WHY THIS EXISTS
// A property can carry a chain's brand name without being in that chain's
// loyalty program -- most of the Singapore/Jakarta ibis budget estate is
// outside ALL, and Six Senses Krabey Island is outside IHG One Rewards. On a
// site whose entire premise is loyalty-program reviews, counting those in
// "379 ALL hotels", ranking them among the editor's picks, or listing them
// in a "Best ALL hotels in Indonesia" guide states something that isn't
// true. They still deserve a review page -- the research is real and a
// traveller comparing Geylang budget rooms wants it -- so they stay in the
// directory, listed and badged, and drop out of the places that make a
// program claim.

export const NON_PARTICIPATING = 'not_participating';

/**
 * Does this entity participate in the program it's filed under?
 *
 * Absence of the field means yes: participation is the overwhelming default
 * and only a confirmed, sourced exception carries
 * core_facts.loyalty_participation. Erring this way means a missing field
 * can never quietly delete a hotel from its own program's count.
 */
export function participatesInProgram(entity) {
  return entity?.core_facts?.loyalty_participation !== NON_PARTICIPATING;
}

/** The complement, for filters that read better in the positive. */
export function isNonParticipating(entity) {
  return !participatesInProgram(entity);
}

/**
 * Splits a list into the entities that back a program claim and the ones
 * that don't, so a caller can render "372 hotels" and "+7 listed but not in
 * the program" from one pass instead of filtering twice.
 */
export function splitByParticipation(entities = []) {
  const participating = [];
  const nonParticipating = [];
  for (const entity of entities) {
    (participatesInProgram(entity) ? participating : nonParticipating).push(entity);
  }
  return { participating, nonParticipating };
}

/**
 * Short badge text for a non-participating property, e.g. "Not in ALL -
 * Accor Live Limitless". Takes the category record (the program) because
 * the entity itself only knows its category_id; falls back to a
 * program-agnostic phrasing when the caller has no category to hand.
 */
export function nonParticipationBadge(category) {
  return category?.label ? `Not in ${category.label}` : 'Not in this program';
}

/**
 * One sentence explaining the exclusion, used wherever a count or a ranking
 * visibly leaves properties out. Kept here so the homepage, the program
 * hubs and the methodology page can never word it three different ways.
 */
export function participationDisclosure({ count, programLabel, entityLabelPlural = 'hotels' }) {
  if (!count) return null;
  const one = count === 1;
  const noun = one ? entityLabelPlural.replace(/s$/, '') : entityLabelPlural;
  const where = programLabel ? ` in ${programLabel}` : ' in the program it is branded under';
  return one
    ? `1 reviewed ${noun} is not${where}, so it is listed here but not counted.`
    : `${count} reviewed ${noun} are not${where}, so they are listed here but not counted.`;
}
