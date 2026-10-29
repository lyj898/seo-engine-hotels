// Picks one of a small set of original line-art drawings for a hotel, from
// words already in its data (name, description, tags, neighbourhood). Part
// of the 2026-10-29 "Members' Lounge" redesign: the site has no
// photography, so each hotel card and masthead gets a drawing by hotel
// TYPE rather than a photo. Rules are deliberately simple and ordered;
// anything unmatched is a city tower.
const RULES = [
  ['cliff', /\bcliff/],
  ['grand', /\braffles\b|\bpalace\b|since 18\d\d/],
  ['heritage', /heritage|colonial|\blegend\b|historic|since 19[0-4]\d|restored/],
  ['beach', /villa|beach|resort|\bbay\b|island|seafront|oceanfront|lagoon|\bsea\b/],
];

export function hotelArtType(entity) {
  const facts = entity?.core_facts ?? {};
  const text = [entity?.name, entity?.short_description, facts.neighborhood, ...(entity?.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  for (const [type, pattern] of RULES) {
    if (pattern.test(text)) return type;
  }
  return 'tower';
}
