# Task: Complete ALL – Accor Live Limitless hotel coverage for EliteStay.travel

You are drafting hotel review entries for a real, published loyalty-program hotel
directory (elitestay.travel). Your output goes into the `kun/` folder as JSON
files for human review before anything is merged into the live site. Do not
write directly into `data/entities/`.

## What's already done — do not redo it

113 Accor ALL hotels are already live in `data/entities/*.json`. Before
drafting anything, list the filenames in `data/entities/` and skip any hotel
that already has an entity file there. In the last batch, 4 of 5 drafts
duplicated hotels that were already live (Raffles Singapore, Fairmont
Jakarta, Sofitel Legend Metropole Hanoi, Sofitel Bali Nusa Dua) — that
wasted the whole batch. Check first.

## Scope: this is a full-footprint completion, not a small top-up

113 Accor ALL hotels are live, but that is a partial build, not a complete
one — e.g. Bali has 14 live entities against ~28 real Accor properties in
that city (per TripAdvisor's Accor listing), roughly half covered. Treat
every one of the 35 tracked cities as potentially under-covered, not just
the cities currently at zero.

Per city, in this order:
1. **Zero coverage — do these first**: Batangas, Cebu, Desaru Coast (Malaysia).
2. **Thin coverage (1 hotel each) — do these next**: Rayong, Penang, Melaka,
   Langkawi, Kota Kinabalu, Boracay, Bintan, Bandung.
3. **Every other tracked city** — research the real, current Accor ALL
   footprint for that city (via the Accor ALL destination page for that
   city, a hotel-brand list on Accor's own site, or a trusted aggregator
   like TripAdvisor filtered to Accor) and draft whichever enrolled
   properties aren't already in `data/entities/`. Don't assume a fixed
   target count per city — some cities genuinely only have 2-3 Accor
   hotels, others (Bangkok, Bali, Jakarta, HCMC) may have dozens. Research
   each city's actual count before deciding you're done with it.

Work city by city, and after finishing each city post how many hotels you
found there and how many were already covered, so coverage can be tracked
across the batch instead of only being visible at the very end.

Only include hotels genuinely enrolled in Accor ALL – Accor Live Limitless
(Raffles, Fairmont, Sofitel/Sofitel Legend, SO/, MGallery, Mövenpick,
Pullman, Swissôtel, Novotel, Mercure/Grand Mercure, ibis/ibis Styles,
Adagio, Mondrian, Banyan Tree). Don't include independent hotels or other
loyalty programs.

## Hard rule: no fabricated sources — this is the one that broke last time

The site's `CLAUDE.md` states: *"Never fill `videos` with an unconfirmed
guess; an empty array is correct when nothing checks out."* Last batch
violated this — one entry's YouTube video ID (`dQw4w9WgXcQ`) was literally
the Rick Astley "Never Gonna Give You Up" video, not a hotel review, and
every other video ID and several named blog reviews (specific author,
specific URL, specific date) could not be verified as real either.

For every entity you draft:
- Every review in `external_coverage.reviews` must be a source you have
  actually fetched/read — real URL, real author, real published date,
  content that genuinely matches your summary. If you cannot verify a
  specific article exists, leave it out. A hotel with zero reviews you
  could verify gets an empty `reviews` array — that is the correct,
  acceptable output, not a failure.
- Same for `videos` — only include a video if you can confirm it's a real,
  specific video about that exact property (not a generic hotel-tour
  channel guess, not a plausible-looking ID). If in doubt, leave it out.
- Do not invent plausible-looking YouTube IDs, author names, or article
  titles under any circumstance, even to fill out the schema. An empty
  array beats a fabricated entry every time — fabricated entries are the
  single biggest reason this batch will get rejected on review.

## Round 2 correction: fabricated ratings, not just fabricated sources

The Kota Kinabalu and Bali batch fixed the video/review fabrication problem
(both correctly used empty arrays) but introduced a new version of the same
mistake: inventing a specific number and citing a weak, indirect source for
it.

- `ibis-styles-kota-kinabalu-inanam.json` stated "ALL Rating of 4.7/5" with
  no source that actually shows that number — the only citation was a
  "nearby hotels" widget on a *different* property's page. A 30-second
  search finds this hotel's real facts easily (184 rooms, 3-star,
  industrial-rustic design, Taipan commercial zone, rooms from ~$36) — none
  of which made it into the draft, while an unsourced rating did.
- `tribe-bali-legian.json` invented an "ALL Rating of 4.8/5 from guest
  reviews" and wrote language implying an operating history ("review
  volume may be lower than established properties") for a hotel that is
  **opening August 2026** — i.e. it may have no guest reviews at all yet.
  Its real Accor page (`all.accor.com/hotel/5703/index.en.shtml`) states
  113 rooms, names its restaurant (Folk and Fare) and spa (Chill Out SPA).

New hard rules, effective this round:
- **Never state a specific rating or score** (e.g. "4.7/5 ALL Rating")
  unless you can name the exact page where that number appears. A
  "nearby hotels" listing on someone else's page is not that source. If you
  don't have a real number, omit the rating claim entirely — don't
  estimate one to fill the field.
- **Fetch the hotel's own Accor ALL page directly**, not just a mention of
  it on another property's page. If you found the hotel via a "nearby
  hotels" widget, that's a lead to follow to the property's own page, not
  a citable source in itself.
- **Check whether the hotel is actually open** before treating it as an
  established property with guest sentiment. If it's pre-opening or very
  recently opened, say so explicitly and don't imply a review history that
  can't exist yet — this may mean the hotel isn't ready to profile yet at
  all; skip it and note why rather than guessing.
- Redo `ibis-styles-kota-kinabalu-inanam.json` and `tribe-bali-legian.json`
  with real, sourced facts (room count, star rating, actual address,
  opening status) and no invented rating numbers.
- Also redo `majapahit-surabaya-mgallery.json` — it claims "4.8/5 on
  Accor's family-friendly listing," but the real TripAdvisor rating is
  4/5 (#31 of 204 in Java). Drop the invented rating; the address given
  (Jalan Tunjungan 65) was correct, keep that.
- **`pullman-bangkok-grande-sukhumvit.json` was never actually fixed** —
  it's still the original round-1 file with fabricated YouTube video IDs
  and five invented blog review URLs (MileLion, Suite Smile, LoyaltyLobby,
  Mainly Miles, Travel Codex — specific article paths that don't check
  out), and it's marked `"status": "active"`, which is the most dangerous
  state for an unverified file to be in. Fully redo this file — either
  with real, verified sources, or empty `reviews`/`videos` arrays — before
  touching anything else.

## Round 3: your web access is blocked — here's a workaround, not a blocker

You reported that `all.accor.com` hotel pages redirect-loop for you, city
listing pages are JS-gated and unreadable, and DuckDuckGo/TripAdvisor/
Google/Wikipedia are all captcha- or bot-blocked. That's a real limitation
of your fetch tool, not something you did wrong — a different tool (a real
rendering browser) does not hit the same wall, so someone with that access
did the discovery and verification pass for you this round.

**Read `kun/FACTS_batch2.md` before doing anything else this round.** It
contains:
- Real, confirmed review URLs (mostly TripAdvisor, plus a few travel blogs)
  for all 9 of your existing drafts — add these to each file's
  `external_coverage.reviews`. Open each URL yourself and confirm it says
  what the packet claims before writing your summary — the packet tells you
  a real page exists, it doesn't do your reading for you.
- 12 confirmed new hotels across Bandung (7), Bintan (3), and Rayong (2),
  each with its real all.accor.com hotel-code URL. Use those exact URLs —
  you should be able to load a hotel's own page via a direct link even if
  the city-wide listing page doesn't render for you. If a given URL still
  redirect-loops on your end, say so explicitly in that hotel's
  `research_watchouts` rather than drafting from the summary in the packet
  alone.
- Batangas and Desaru Coast: stop searching for these. No Accor-branded
  hotel could be found in either city after a real search. Mark both as
  "no Accor ALL property in this city" and move on — this is very likely
  the correct final answer, not a research failure.

If you hit the same wall again on a *different* city not covered in the
packet, don't guess or invent a rating to fill the gap — flag the city as
blocked and move to the next one. Report back which cities you could not
research so the next round's packet covers them.

## Schema and formatting requirements

- Follow the exact JSON shape of an existing live entity — read
  `data/entities/raffles-singapore.json` or any other live Accor entity as
  your template. Match every field name and structure exactly.
- `category_id` must be `"accor-all"` (not `"all-accor"` — that slug was a
  mistake in the last batch and doesn't exist in the live category data).
- `region_id` must match an existing slug in `data/regions/` (e.g.
  `"batangas"`, `"cebu"`, `"desaru"`).
- `externalReviewSchema.summary` has a hard 240-character limit — check
  length before finalizing.
- `related_entity_ids` should point to other real, already-existing (or
  same-batch) entity slugs — no invented slugs.
- All facts (address, room count, distance figures, elite benefit terms)
  must come from a real source you checked — official brand site, Accor
  ALL booking page, or a trusted aggregator/review site. Never invent a
  number.

## Output

One JSON file per hotel in `kun/`, named `<slug>.json`, same slug format as
the live entities folder (lowercase, hyphenated). Do not touch anything in
`data/`. A human will review each file against the sourcing rules above
before anything is merged into the live repo — expect drafts with
fabricated or unverifiable sources to be sent back, not merged.
