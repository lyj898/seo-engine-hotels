# EliteStay — Work Plan / Backlog

_Last updated 2026-08-04. This is a self-contained handoff: a new session can start with "read docs/WORKPLAN.md and continue"._

## Project context (read first)

- **Site:** elitestay.travel — programmatic-SEO directory of Marriott Bonvoy hotels across 6 SE-Asia cities (Singapore, Bangkok, Phuket, Kuala Lumpur, Bali, Ho Chi Minh City). Astro, image-free, tier-coded typographic cards (see `src/lib/brand.js`).
- **Scope:** Marriott Bonvoy brands only, currently-open properties in the tracked cities. Config in `site.config.json`. Category = `marriott-bonvoy`; region_id = city slug (`kuala-lumpur` covers greater KL / Klang Valley incl. Petaling Jaya).
- **Env constraint:** No local Node on the dev machine. Do NOT `npm run build`/`validate` locally. Validate JSON with PowerShell `ConvertFrom-Json`. The real build/deploy check is GitHub Actions `deploy.yml` (push to `main` → GitHub Pages). Verify live in a browser at https://elitestay.travel.
- **Pipeline:** `scripts/` = discover → research → summaries (all use the Anthropic web-search client `scripts/lib/anthropic-client.js`). `weekly-refresh.yml` currently runs **discover → research → summaries** (grow catalogue only; existing hotels untouched). `deploy.yml` builds on push to main.
- **Guest quality score:** every hotel has `sentiment_scores` {overall 0-100 + 5-cat breakdown: Location/Service/Rooms/Food & breakfast/Value}. Masthead shows "Guest score"; homepage Editor's picks rank by it; `reliability_score` is internal-only. Current scores are **hand-judged and frozen** (research prompt still returns null sentiment — see Workstream 4).
- **Coverage HARD RULE:** `external_coverage` (reviews + YouTube videos) is 100% hand-curated and must be verified — every YouTube `video_id` confirmed via oEmbed (`https://www.youtube.com/oembed?url=...`), every review URL fetched (allow 403/401, drop only 404). Review `summary` = original paraphrase, **≤240 chars** (schema max — subagents overrun this unless told). Proven process: 1 parallel subagent per hotel does search + verification and **writes its JSON to a scratchpad file** (avoids transcription error), then a PowerShell script re-runs the oEmbed gate and inserts `external_coverage` before the `"tags"` line, preserving file formatting.

---

## Workstream 1 — Add the 17 missing hotels (full pages)

Found by the 2026-08-04 catalogue audit (verified open + Bonvoy on marriott.com). **Decision: include all — the KL/Petaling Jaya entries and all Marriott Executive Apartments (MEA) are in scope.** Each needs a complete entity: core_facts, ai_summary/short_description, pros/cons, research_highlights/watchouts/confidence, faqs, **guest score (sentiment_scores)**, source_mix, **verified external_coverage**, tags, cta_links, related_entity_ids, reliability_score, status.

**Bangkok (5)** — region_id `bangkok`
1. Courtyard by Marriott Bangkok — Courtyard — Ratchadamri/Pathumwan — https://www.marriott.com/en-us/hotels/bkkcy-courtyard-bangkok/overview/
2. Public House Bangkok, a Member of Design Hotels — Design Hotels — Sukhumvit 31, Phrom Phong — https://www.marriott.com/en-us/hotels/bkkph-public-house-bangkok-a-member-of-design-hotels/overview/
3. Sathorn Vista, Bangkok - Marriott Executive Apartments — MEA — https://www.marriott.com/en-us/hotels/bkkea-sathorn-vista-bangkok-marriott-executive-apartments/overview/
4. Marriott Executive Apartments, Bangkok Townhall Sukhumvit — MEA — Soi Sukhumvit 49 — https://www.marriott.com/en-us/hotels/bkkts-marriott-executive-apartments-bangkok-townhall-sukhumvit/overview/
5. Mayfair, Bangkok - Marriott Executive Apartments — MEA — near Lumphini Park — https://www.marriott.com/en-us/hotels/bkker-mayfair-bangkok-marriott-executive-apartments/overview/

**Singapore (5)** — region_id `singapore`
1. Frasers House, a Luxury Collection Hotel, Singapore — Luxury Collection — ex-InterContinental Bugis, opened Jan 2026 — https://www.marriott.com/en-us/hotels/sinlb-frasers-house-a-luxury-collection-hotel-singapore/overview/
2. Maxwell Reserve Singapore, Autograph Collection — Autograph — Tanjong Pagar, since 2021 — https://www.marriott.com/en-us/hotels/sinam-maxwell-reserve-singapore-autograph-collection/overview/
3. The Serangoon House Little India, Singapore, a Tribute Portfolio Hotel — Tribute — Little India, since 2023 — https://www.marriott.com/en-us/hotels/sintg-the-serangoon-house-little-india-singapore-a-tribute-portfolio-hotel/overview/
4. Varel Singapore, a Tribute Portfolio Hotel — Tribute — Selegie Rd, opened Apr 2026 — https://www.marriott.com/en-us/hotels/sintx-varel-singapore-a-tribute-portfolio-hotel/overview/
5. Four Points by Sheraton Singapore, Jurong — Four Points — ex-Genting Hotel Jurong (RWS), opened Jul 2026 — https://www.marriott.com/ (search SINJU / "Four Points Singapore Jurong")

**Kuala Lumpur (5)** — region_id `kuala-lumpur`
1. Moxy Kuala Lumpur Chinatown — Moxy — Oriental Bank Building, opened 2025 — https://www.marriott.com/en-us/hotels/kulok-moxy-kuala-lumpur-chinatown/overview/
2. Fairfield by Marriott Chow Kit Kuala Lumpur — Fairfield — Chow Kit — https://www.marriott.com/en-us/hotels/kulfi-fairfield-chow-kit-kuala-lumpur/overview/
3. Marriott Executive Apartments Kuala Lumpur — MEA — near KLCC, opened Aug 2025 — https://www.marriott.com/en-us/hotels/kulea-marriott-executive-apartments-kuala-lumpur/overview/
4. Sheraton Petaling Jaya Hotel — Sheraton — Petaling Jaya (greater KL) — https://www.marriott.com/en-us/hotels/szbsi-sheraton-petaling-jaya-hotel/overview/
5. Petaling Jaya Marriott Hotel — Marriott Hotels — ex-Eastin, rebranded Dec 2025 (phased reno through 2026) — https://www.marriott.com/ (search "Petaling Jaya Marriott")

**Bali (2)** — region_id `bali`
1. Renaissance Bali Nusa Dua Resort — Renaissance — Nusa Dua (distinct from our Renaissance Bali Uluwatu) — https://www.marriott.com/en-us/hotels/dpsnd-renaissance-bali-nusa-dua-resort/overview/
2. Fairfield by Marriott Bali Kuta Ngurah Rai — Fairfield — near Ngurah Rai airport — https://www.marriott.com/en-us/hotels/dpsnf-fairfield-bali-kuta-ngurah-rai/overview/

_Phuket and HCMC: audited complete, nothing missing._

**How to build them:** mirror the shape of an existing entity in the same city/tier. Research (facts + highlights/watchouts + pros/cons + faqs) can be done by web-search subagents; guest score hand-judged from that research (same rubric as the existing 102, no external reviews in the calc); coverage via the verified-subagent process (Workstream 2). New hotels can start `status: needs_review` or `active`. Ideally batch by city.

## Workstream 2 — External coverage backfill (remaining hotels)

`external_coverage` still missing on ~68 existing hotels (Singapore is done 14/14):
- **Bali 21**, **Bangkok 20**, **Kuala Lumpur 11**, **Phuket 8**, **HCMC 1** — plus the 17 new hotels above.

Use the proven verified process (see HARD RULE). Reuse the scratchpad scripts pattern: `verify-coverage.ps1` (oEmbed + review HTTP gate) and `insert-coverage.ps1` (builds block, inserts before `"tags"`). Remember the ≤240-char summary cap.

## Workstream 3 — Verify JW Marriott Bali Ubud

Audit flagged `jw-marriott-bali-ubud` as **possibly not open** (Payangan construction halted Nov 2025, ~2027 opening; converted from a Sheraton project) — yet we carry a full page + guest score + "3/5 TripAdvisor" research. Resolve the discrepancy: confirm whether it's actually operating. **If not open → archive it** (like Le Méridien Sentosa) — its guest score and research would be bogus.

## Workstream 4 — Hotel-native research prompt + real sentiment

`scripts/lib/prompts.js` (buildResearchPrompt/buildSummaryPrompt) is still race-flavoured ("participant race reports", "course conditions") and tells the model to return `null` sentiment unless sure — so the pipeline never populates guest scores. Rewrite both prompts hotel-native and make them **produce `sentiment_scores`** (overall + the 5-cat breakdown) whenever research exists, gated by `research_confidence`. Add a `--force` flag to `scripts/research-entities.js` (the 60-day freshness guard currently skips everything). Then new hotels the pipeline discovers get a guest score automatically. NOTE: existing 102 scores are hand-set; the null-fallback protects them, but decide whether a fixed prompt should be allowed to regenerate them.

## Workstream 5 — Bake the audit into the weekly task (NEW)

Goal: the weekly automation should **catch new AND closed/rebranded hotels** so the catalogue can't silently drift (as Le Méridien Sentosa did — closed 2020, still live until 2026).
- **New:** improve/confirm `discover-entities.js` actually surfaces new Bonvoy hotels per city (marriott.com destination pages are JS-rendered; may need the text-rendering fetch or a per-city seed strategy).
- **Closed/rebranded (missing today):** add `scripts/audit-entities.js` using the existing web-search client — for each published entity, verify it still exists as a Marriott/Bonvoy property; if it appears closed/left-Marriott/rebranded, set `status: needs_review` (never auto-archive) and log it. Add an `npm run audit` step to `weekly-refresh.yml` (has `ANTHROPIC_API_KEY`). Rate-limit like research (cost scales with catalogue size — process N per run or only re-check every X days). Keep the human-review gate: audit flags, a person confirms archive.
- Consider a monthly (not weekly) cadence for the full closure sweep to bound cost.

## Workstream 6 — Monetization (affiliate_links)

`affiliate_links` is 0/102. `site.config.json` sets `monetizationModel: "affiliate"` but no outbound links earn. Blocked on choosing an affiliate program (e.g. Booking.com / Stay22 / Marriott affiliate). Once picked, wire links into each entity's `affiliate_links` and confirm `CTABlock.astro` renders them.

## Workstream 7 — Housekeeping

- `src/components/ReliabilityBadge.astro` is **dead code** (imported nowhere) and **mis-calibrated** (tiers high≥85/medium≥65/low<65 — against real data nothing is ever green, ~40% would show red). Remove it, or if reintroduced, recalibrate to the guest-score distribution.
- Monitor **Westin Siray Bay Phuket** → Ritz-Carlton conversion (delayed past 2025; still a Westin). See memory `westin-siray-bay-conversion`.

---

## Status

- ✅ **WS3 done** — JW Marriott Bali Ubud confirmed NOT open (halted Payangan construction, ~2027); set `status: draft` (unpublished). Revisit when it actually opens.
- ✅ **WS5 done** — `scripts/audit-entities.js` + `npm run audit` added and wired into `weekly-refresh.yml` (runs after summaries). Flags suspected closed/rebranded/not-open hotels as `needs_review` (never auto-archives); rate-limited by `sourceConfig.auditPerRunLimit`/`auditIntervalDays`.
- ✅ **WS7 done** — dead/mis-calibrated `ReliabilityBadge.astro` removed. (Westin Siray Bay → Ritz monitoring still open.)
- ✅ **WS4 done** — `scripts/lib/prompts.js` research + summary prompts rewritten hotel-native and now emit `sentiment_scores` with the fixed 5-cat breakdown (`HOTEL_SCORE_LABELS`); `research-entities.js` gained a `--force` flag. So the pipeline now scores new hotels automatically. NOTE: existing 102 hand-set scores are still protected by research-entities.js's null-fallback, but a **forced** re-research WILL now overwrite them — decide before running `npm run research -- --force` broadly.
- ✅ **Coverage toolkit committed** — `scripts/coverage/` (verify + insert PS scripts + README with the subagent prompt) makes WS2 repeatable.
- ✅ **WS1 done** — all 17 missing hotels added (2026-08-04), catalogue **102 → 119**, each a full entity with hand-judged guest scores + **verified external_coverage** (oEmbed/HTTP gate passed). Bangkok 5, Singapore 5, KL 5, Bali 2. Six very-new/rebranding hotels published as **`status: needs_review`** with provisional scores (thin genuine-review base — revisit as reviews accumulate): `frasers-house-a-luxury-collection-hotel-singapore`, `varel-singapore-tribute-portfolio`, `four-points-singapore-jurong`, `marriott-executive-apartments-kuala-lumpur`, `petaling-jaya-marriott-hotel`; the rest `active`. NOTE: since these 17 now HAVE coverage, WS2's remaining count is unchanged (they were never in the ~68). Verified Four Points Jurong's real code is **SINSP** (not SINJU); PJ Marriott is **KULPJ** (ex-Eastin, renovating through Dec 2026).
- ⬜ Remaining: **WS2** (coverage backfill ~68 existing hotels — use `scripts/coverage/`), **WS6** (affiliate monetization).

## Done in the 2026-08-04 session (for reference)
- Guest quality score system: scored all 102, masthead + picks switched to it, reliability made internal. (commit 14cc097)
- Weekly action retargeted to discover+build new hotels only (dropped refresh/listicles). (dc7c449)
- Singapore coverage completed 14/14 (35 reviews + 36 videos, verified); `excerpt_quotes` removed end-to-end; courtyard-bangkok-suvarnabhumi-airport related links fixed. (0199dae)
- Le Méridien Sentosa archived (left Marriott 2020 → Oasia); w-singapore-sentosa-cove related links repointed. (1b878e6)
