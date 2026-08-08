# Project rules

## New pages/routes

Whenever a new page or route is added (any file under `src/pages/`, including
dynamic `getStaticPaths()` routes), do both of the following in the *same*
change — never deferred to a follow-up:

1. **Mobile responsive check**: verify the layout at ~375px, 768px, and
   1024px widths — no horizontal overflow, tap targets sized appropriately,
   text/images scale correctly. Wrap any table in `overflow-x-auto`. Every
   `grid` container needs an explicit base `grid-cols-1` (e.g.
   `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`) — without it, the
   implicit mobile track has no `minmax(0,1fr)` constraint and can size to a
   card's content instead of the viewport (this actually happened: an
   `aspect-[4/3]` + `flex-col` card panel rendered 516px wide on a 375px
   screen). Reading the Tailwind classes isn't enough to catch this — verify
   with a real browser check (e.g. Playwright at 375px, confirm
   `document.body.scrollWidth` equals the viewport width), not just a visual
   skim.
2. **Sitemap**: the sitemap is build-generated at `src/pages/sitemap.xml.js`
   from `loadEntities`/`loadCategories`/`loadRegions`/`loadListicles` plus a
   `staticPaths` array — never hand-edit XML. A new dynamic route that reads
   from `/data` is included automatically as long as it uses the `urls.js`
   helpers; a new static page must be added to `staticPaths` in that file.

## New hotel/entity data (data/entities/*.json)

Whenever a new entity is added or researched, in the *same* change:

1. **Verify every fact against a real source** — never invent a fact,
   including numbers (ratings, review counts, distances). `hyatt.com` and
   `marriott.com` block direct fetches (429) — use WebSearch plus an
   independent aggregator/review/street-directory site to cross-check
   instead, and prefer fetching the actual page when a source *does* allow
   it over trusting a search snippet alone.
2. **Populate `external_coverage`** — every entity needs at least one real,
   dated written review (fetch the article directly to confirm its actual
   publish date and content) and, where a genuine YouTube video about that
   *specific* property can be confirmed to exist, at least one video. Direct
   `youtube.com/watch` fetches are bot-blocked and search-result titles
   don't reliably state the channel — resolve the channel name via
   `https://www.youtube.com/oembed?url=<video-url>&format=json` instead.
   Never fill `videos` with an unconfirmed guess; an empty array is correct
   when nothing checks out.
3. **`externalReviewSchema.summary` has a hard 240-character limit** —
   check the length before committing; it's a common miss when
   paraphrasing a review.
4. **Run `npm run validate`** before committing and confirm the error/
   warning count matches (or improves on) whatever `main` currently has —
   never introduce a new failure. A schema failure in one entity also
   breaks `related_entity_ids` cross-reference checks in every *other*
   entity that links to it, so a single bad file can produce a wall of
   unrelated-looking warnings elsewhere.
