import { z } from 'zod';

// core_facts shape for the "hotels" vertical (hotel review / loyalty-program
// guides). See /config-examples/hotels.site.config.json and
// site.config.json (elitestay.travel instance).
//
// Note on what's NOT here: sentiment scores, pros/cons, source mix,
// excerpt quotes, and FAQs are already universal fields on baseEntitySchema
// (see schema/base.js) -- they aren't vertical-specific, so they're never
// duplicated into core_facts. Same for the loyalty program itself: that's
// category_id (site.config.json.categoryLabel = "Loyalty Program"), not a
// core_fact, since it's the hub-page axis, not a per-hotel attribute.
//
// brand_sub_brand is the one exception worth calling out: it's a real
// per-hotel fact (which Marriott brand tier this specific property is --
// Ritz-Carlton vs Courtyard are very different products under the same
// program) but deliberately NOT the category axis. It's used for listicle
// filtering/tagging ("Best Ritz-Carlton hotels in Bangkok" as a /best/
// guide) rather than its own hub tree, so adding a hotel doesn't require a
// new page type -- see generate-listicles.js and listicleFilterSchema's
// core_facts_filters.
export const hotelsCoreFactsSchema = z.object({
  address: z.string().min(1),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  neighborhood: z.string().optional(), // e.g. "Sukhumvit", "Marina Bay" -- used by landmark/area listicles

  // e.g. "The Ritz-Carlton", "JW Marriott", "Marriott Hotels", "Westin",
  // "Courtyard" -- see discoveryConstraints in site.config.json for the
  // full list of Bonvoy-participating brands in scope.
  brand_sub_brand: z.string().min(1),

  elite_benefits: z.array(z.string()).default([]),
  elite_notes: z.string().optional(), // elaboration beyond the bullet list, e.g. upgrade availability patterns
  breakfast: z.string().optional(), // e.g. "Included for Platinum and above"
  lounge: z.string().optional(),
  family_notes: z.string().optional(), // connecting rooms, kids' club, pool, crib availability
  points_value_notes: z.string().optional(), // points-vs-cash redemption value commentary

  // Proximity facts for landmark-style listicles ("hotels near
  // Suvarnabhumi Airport"). distance_from_airport_km covers the single most
  // commonly searched case per city; landmark_distances covers anything
  // else (a specific mall, convention center, beach) without needing a new
  // field per landmark. Both optional -- a listicle can also just pin
  // entities manually via manual_entity_ids when the fact isn't structured.
  distance_from_airport_km: z.number().nonnegative().optional(),
  landmark_distances: z
    .array(
      z.object({
        label: z.string().min(1), // e.g. "Suvarnabhumi Airport", "ICONSIAM"
        km: z.number().nonnegative(),
      })
    )
    .default([]),
});
