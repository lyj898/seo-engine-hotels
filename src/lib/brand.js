// Presentation helpers for loyalty-program hotels. Deliberately kept OUT of
// the generic EntityCard/[slug] components so the engine stays vertical-
// agnostic: brandPresentation() returns null for any entity without a
// `core_facts.brand_sub_brand`, and those callers fall back to their generic
// treatment. Only entities that actually carry a sub-brand (i.e. this
// hotels instance) light up the tier-coded panel.
//
// Since 2026-08-03 the site is image-free by design -- the card panel and
// the detail-page band are typographic, and the Bonvoy tier is the colour
// signal that replaces photography. See EntityCard.astro / [slug].astro.

// Chain -> tier. Order matters: the SELECT test runs first so
// "Four Points by Sheraton" isn't caught by the "sheraton" that would
// otherwise read as premium. Everything not luxury or select is premium.
const SELECT = /four points|courtyard|aloft|element|fairfield|moxy|ac hotels|springhill|protea|city express/i;
const LUXURY = /ritz-carlton|st\.?\s*regis|jw marriott|w hotels|luxury collection|\bedition\b|bulgari|w bali|w singapore|w kuala/i;

export function hotelTier(subBrand) {
  const s = subBrand ?? '';
  if (SELECT.test(s)) return 'select';
  if (LUXURY.test(s)) return 'luxury';
  return 'premium';
}

// The card wordmark: the hotel's own name with the redundant brand chrome
// removed (the sub-brand is already shown as its own label). Only strips
// unambiguous appositive chrome -- never enough to erase a name that IS the
// brand (e.g. "The Ritz-Carlton, Bali" keeps "Ritz-Carlton, Bali").
export function hotelDisplayName(name) {
  return name
    .replace(/,?\s+a\s+Luxury Collection Hotel/gi, '')
    .replace(/,?\s+a\s+Luxury Collection Resort(\s*&\s*Spa)?/gi, '')
    .replace(/,?\s+an?\s+Tribute Portfolio (Hotel|Resort)/gi, '')
    .replace(/,?\s+a\s+Member of Design Hotels/gi, '')
    .replace(/,?\s+Autograph Collection/gi, '')
    .replace(/,?\s+a\s+Ritz-Carlton Reserve/gi, '')
    .replace(/\s+by Marriott\b/gi, '')
    .replace(/^The\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/[,\s]+$/, '')
    .trim();
}

export function brandPresentation(entity) {
  const subBrand = entity?.core_facts?.brand_sub_brand;
  if (!subBrand) return null;
  const displayName = hotelDisplayName(entity.name);
  const monogram = (displayName.match(/[A-Za-z0-9]/)?.[0] ?? entity.name.charAt(0) ?? '?').toUpperCase();
  return {
    tier: hotelTier(subBrand),
    // The sub-brand as a label -- "The " dropped so "The Luxury Collection"
    // reads "Luxury Collection".
    label: subBrand.replace(/^The\s+/i, ''),
    displayName,
    monogram,
  };
}

const TIER_LABEL = { luxury: 'Luxury', premium: 'Premium', select: 'Select-service' };
export function tierLabel(tier) {
  return TIER_LABEL[tier] ?? '';
}

// Tailwind class strings for each tier's panel register, shared by the card
// panel and the detail-page masthead so there is one source of truth. This
// file is inside Tailwind's content globs, so the classes are picked up in
// the build. Palette = "black-tie": darker reads as higher tier.
//   luxury  -> near-black + gold (a black-tie plate; dark in both themes so
//              it stays "luxury" rather than flipping to a light panel)
//   premium -> gold wash
//   select  -> pale neutral + a gold hairline
// Colours are brand-* tokens so the palette stays config-driven; the two
// non-flipping tokens (text-brand-primary-ink cream, primary-hover-dark
// gold) are used as fixed values on the always-dark luxury plate.
export const TIER_REGISTER = {
  luxury: {
    panel: 'bg-brand-text text-brand-primary-ink dark:bg-black',
    label: 'text-brand-primary-hover-dark',
    tex: true,
  },
  premium: {
    panel: 'bg-brand-primary text-brand-primary-ink dark:bg-brand-primary-hover-dark dark:text-brand-primary-ink-dark',
    label: '',
    tex: true,
  },
  select: {
    panel: 'border-t-[3px] border-brand-primary bg-brand-panel-b text-brand-text dark:border-brand-primary-hover-dark dark:bg-brand-panel-b-dark dark:text-brand-text-dark',
    label: 'text-brand-primary-hover dark:text-brand-primary-hover-dark',
    tex: false,
  },
};
