# Research packet for Kun — Accor batch 3 (bigger batch: Bali + Bangkok)

## Feedback on batch 2 first — two things to fix going forward

**1. Two files had fabricated numbers with a false verification claim.**
`pullman-bandung-grand-central.json` stated "4.5/5 (818 reviews), loaded
successfully August 2026, confirmed on Accor.com" — the real page (which I
loaded) shows 4.7/5, 1,263 reviews, 5-star, 279 rooms, and a completely
different address than what was drafted. `ibis-bandung-trans-studio.json`
stated "904 reviews... confirmed from Accor nearby-hotels listing" — real
figure is 908, and the address given was vague, not the real street
address. Both have been corrected already; you don't need to redo them.

The pattern to watch for: 10 of the 12 new hotels in that batch handled
"I can't load this page" honestly (`research_confidence: "low"`, no invented
numbers) — that was exactly right. These 2 instead wrote a specific,
plausible-sounding number *and claimed to have verified it directly*, when
you've told us your fetch tool can't reliably reach these pages. Never
write "loaded successfully" or "confirmed on [site]" unless that's
literally true for your tool. If you're inferring or estimating a number,
say that plainly — don't state it as a confirmed fact.

**2. TripAdvisor's main hotel-review page doesn't satisfy this site's
schema — dated review needed.** The `published_date` field on a review is
*required*, not optional — a real ISO date string, not null. TripAdvisor's
aggregate `Hotel_Review-...` URL (the one most of batch 2 cited) is a live
rating page with no single publish date, so it can't be used to fill that
field. A specific individual TripAdvisor user review (a `ShowUserReviews-...`
URL) or a dated blog article works — the aggregate hotel page does not. 5
of batch 2's reviews got reverted to empty arrays for exactly this reason.
Going forward: before citing a review, check it actually has a date on the
page. If it's an aggregate/live page with no date, it's not a usable
source for this field — leave it out rather than writing null.

## New hotels this round — 36 confirmed, real, with Accor codes

These were found by browsing Accor's own Bali and Bangkok destination
pages directly (JS-rendered content, extracted via DOM query) — genuinely
existing hotels, not search snippets. Fetch each one's own page yourself
to draft it; if your tool can't reach it, mark `research_confidence: "low"`
honestly rather than guessing — same rule as always.

### Bali — 9 new (14 already live, ~28 total per TripAdvisor's Accor count)
1. Buahan A Banyan Tree Escape — https://all.accor.com/hotel/B9B5/index.en.shtml
2. Homm Saranam Baturiti — https://all.accor.com/hotel/C1H6/index.en.shtml
3. ibis Styles Bali Denpasar — https://all.accor.com/hotel/7538/index.en.shtml
4. Peppers Seminyak — https://all.accor.com/hotel/B3U5/index.en.shtml
5. Grand Seminyak Lifestyle Boutique Bali Resort — https://all.accor.com/hotel/C4D5/index.en.shtml
6. Mercure Bali Legian — https://all.accor.com/hotel/8450/index.en.shtml (distinct from the already-live ibis Styles Bali Legian — different brand, same area)
7. TRIBE Bali Kuta Beach — https://all.accor.com/hotel/B777/index.en.shtml
8. The Kuta Beach Heritage Hotel Bali - Managed by Accor — https://all.accor.com/hotel/8151/index.en.shtml
9. Mercure Kuta Bali — https://all.accor.com/hotel/3713/index.en.shtml

### Bangkok — 27 new (14 already live)
1. Mercure Bangkok Siam Ratchathewi — https://all.accor.com/hotel/C0I3/index.en.shtml
2. ibis Bangkok Siam Ratchathewi — https://all.accor.com/hotel/C0I2/index.en.shtml
3. ibis Styles Bangkok Silom — https://all.accor.com/hotel/B6N1/index.en.shtml
4. Mercure Bangkok Surawong — https://all.accor.com/hotel/C0Q6/index.en.shtml
5. Pullman Bangkok Hotel G — https://all.accor.com/hotel/3616/index.en.shtml
6. Novotel Bangkok Sukhumvit 4 — https://all.accor.com/hotel/A246/index.en.shtml
7. ibis Styles Bangkok Sukhumvit 4 — https://all.accor.com/hotel/A237/index.en.shtml
8. ibis Bangkok Sukhumvit 4 — https://all.accor.com/hotel/7295/index.en.shtml
9. Banyan Tree Bangkok — https://all.accor.com/hotel/B1U6/index.en.shtml
10. Mercure Bangkok Sukhumvit 11 — https://all.accor.com/hotel/A247/index.en.shtml
11. Mövenpick Hotel Sukhumvit 15 Bangkok — https://all.accor.com/hotel/B4K2/index.en.shtml
12. ibis Bangkok Sathorn — https://all.accor.com/hotel/6537/index.en.shtml
13. Grand Mercure Bangkok Asoke Residence — https://all.accor.com/hotel/6162/index.en.shtml
14. greet Bangkok Sukhumvit 16 Jono — https://all.accor.com/hotel/C7B4/index.en.shtml
15. Novotel Living Bangkok Sukhumvit Legacy — https://all.accor.com/hotel/B776/index.en.shtml
16. TRIBE Living Bangkok Sukhumvit 39 — https://all.accor.com/hotel/C0G7/index.en.shtml
17. Mercure Bangkok Sukhumvit 24 — https://all.accor.com/hotel/B0M2/index.en.shtml
18. Homm Sukhumvit34 Bangkok — https://all.accor.com/hotel/C0H0/index.en.shtml
19. Cassia Rama 9 Bangkok — https://all.accor.com/hotel/C3L2/index.en.shtml
20. ibis Styles Bangkok Ratchada — https://all.accor.com/hotel/A9G9/index.en.shtml
21. ibis Styles Bangkok Sukhumvit Phra Khanong — https://all.accor.com/hotel/9790/index.en.shtml
22. ibis Styles Bangkok Sukhumvit 50 — https://all.accor.com/hotel/9308/index.en.shtml
23. Novotel Bangkok Bangna — https://all.accor.com/hotel/1738/index.en.shtml
24. Novotel Bangkok Impact — https://all.accor.com/hotel/8059/index.en.shtml
25. ibis Bangkok Impact — https://all.accor.com/hotel/9060/index.en.shtml
26. Novotel Bangkok Future Park Rangsit — https://all.accor.com/hotel/B346/index.en.shtml

**Skip this one — pre-opening, same as TRIBE Bali Legian:**
- Fairmont Bangkok Sukhumvit (Opening Second Half 2026) — https://all.accor.com/hotel/C1G0/index.en.shtml
  — draft it the same honest way as TRIBE Bali Legian: no reviews, no
  sentiment claims, explicitly note pre-opening status, or skip it entirely
  for this round and pick it up closer to its opening date.

Both lists are large — work through them at whatever pace is sustainable,
and keep flagging blocked pages rather than guessing. Report back which
ones you could and couldn't reach.
