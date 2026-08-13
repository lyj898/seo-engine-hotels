# Accor Southeast Asia gap-fill — progress tracker

Working doc for an ongoing project: fill in Accor "ALL – Accor Live Limitless"
hotels missing from `data/entities/`, found by cross-checking against
Accor's official directories. Not part of the site build — pure project
tracking so a fresh session (or this one, after a context reset / rate
limit) can pick up exactly where things left off without re-deriving state
from conversation history.

**Status as of 2026-08-13: 91 of ~165 identified gaps done and live on
main. ~74 remain.**

## How to resume a batch

1. Pick the next unchecked group below (aim for ~15-20 hotels per batch,
   split across 4 parallel agents of 3-5 hotels each — small groups so a
   crash loses little).
2. Give each agent the standard prompt shape used in prior batches: the
   `novotel-phuket-kamala-beach.json` schema example, the CLAUDE.md data
   rules (verify every fact, `external_coverage` empty is fine if nothing
   checks out, `source`/`published_date` field names not
   `publisher`/`date_published`, `source_mix[].type` enum only), and this
   explicit instruction: **write each entity file as soon as you've
   gathered its facts — do not research all N hotels before writing any.**
   This is what makes a mid-batch crash recoverable instead of a total loss.
3. Check `data/regions/` first (list below) — most destinations already
   have a region file. Only create a new one if genuinely missing.
4. After each parallel group finishes (or after ~10-15 min if using
   background agents — check `git status` / `ListAgents` rather than
   waiting indefinitely on a notification that may never arrive if the
   agent died silently), validate and checkpoint-commit that group's
   output before waiting for the rest:
   ```
   npm run validate   # must hold at 0 errors, 197 warnings (main's baseline)
   git add data/entities data/regions
   git commit -m "..."
   git push origin claude/accor-hotels-southeast-asia-npek5o
   ```
5. If an agent dies with **zero files written and zero notification**,
   don't wait — it's dead. Relaunch the same group fresh.
6. When a full batch is validated and pushed, open/update the PR and merge
   when asked to "deploy live" (this project's established pattern: PR
   stays open across batches on the same branch, gets merged on request,
   `deploy.yml` auto-publishes to GitHub Pages on merge to `main`).
7. Update this file's checkboxes and the "done" count before ending a
   session, so the next resume starts from an accurate state.

## Status by country

- **Thailand — DONE (28/28)** ✅
- **Vietnam — DONE (25/25)** ✅
- **Philippines — DONE (4/4)** ✅
- **Cambodia — DONE (1/1)** ✅
- **Malaysia — DONE** (all individually-verified gaps closed; the one
  remaining item, ibis Styles Johor Bahru City Centre, is pipeline/not yet
  open — exclude until it opens)
- **Singapore — 10 done, ~20 remaining**
- **Indonesia — 12 done, ~56 remaining** (mostly lower-confidence bundles)

## Singapore — remaining (~20)

Individually verifiable, high confidence — do these first:
- [ ] Grand Mercure Singapore Roxy
- [ ] Mercure Singapore on Stevens
- [ ] Mercure Singapore Tyrwhitt
- [ ] ibis Singapore Novena
- [ ] ibis Singapore on Bencoolen
- [ ] ibis Styles Singapore Albert
- [ ] ibis Styles Singapore on Macpherson

Confirmed as a set on Accor's Singapore city directory but **not yet
individually verified** — verify each on its own all.accor.com page before
writing an entity, per CLAUDE.md's fact-verification rule:
- [ ] ibis budget Singapore Selegie
- [ ] ibis budget Singapore Imperial
- [ ] ibis budget Singapore Bugis
- [ ] ibis budget Singapore Gold
- [ ] ibis budget Singapore Emerald
- [ ] ibis budget Singapore Clarke Quay
- [ ] ibis budget Singapore Sapphire
- [ ] ibis budget Singapore Ametrine
- [ ] ibis budget Singapore Pearl
- [ ] ibis budget Singapore Ruby
- [ ] ibis budget Singapore Crystal
- [ ] ibis budget Singapore West Coast
- [ ] ibis budget Singapore Mount Faber
- [ ] ibis budget Singapore Joo Chiat

Region: `singapore.json` already exists — use it, don't recreate.

## Indonesia — remaining (~56)

Individually verifiable, high confidence — do these first (13):
- [ ] ibis Yogyakarta International Airport Kulon Progo (region: `yogyakarta`)
- [ ] Novotel Yogyakarta International Airport Kulon Progo (region: `yogyakarta`)
- [ ] ibis budget Surabaya Diponegoro (region: `surabaya`)
- [ ] Novotel Jakarta Mangga Dua Square (region: `jakarta`)
- [ ] ibis Styles Jakarta Mangga Dua Square (region: `jakarta`)
- [ ] Novotel Jakarta Cikini (region: `jakarta`)
- [ ] all seasons Jakarta Thamrin (region: `jakarta`)
- [ ] ibis Makassar City Center (region: `makassar`)
- [ ] Mercure Makassar Nexa Pettarani (region: `makassar`)
- [ ] ibis Semarang Simpang Lima (region: `semarang`)
- [ ] ibis Styles Semarang Simpang Lima (region: `semarang`)
- [ ] ibis budget Semarang Tendean (region: `semarang`)
- [ ] ibis Styles Malang (region: `malang`)

Confirmed as bundles on directory/city-listing pages but **not individually
verified** — treat as leads, verify each hotel's own all.accor.com page
before writing an entity (some names/counts may be imprecise):

- [ ] **Mercure Jakarta network** (~8): Kota, Cikini, Sabang, Grogol, Pantai
      Indah Kapuk, Gatot Subroto, Simatupang, Convention Center Ancol
- [ ] **ibis Jakarta network** (~3): Senen, Harmoni, Raden Saleh
- [ ] **ibis budget Jakarta network** (~3): Cikini, Menteng, Airport
- [ ] **ibis Styles Jakarta network** (~4): Sunter, Tanah Abang, Airport,
      Simatupang
- [ ] **Greater Jakarta cluster** (~6): ibis Styles Bekasi Jatibening,
      Novotel Tangerang, Mercure Tangerang BSD, Mercure Serpong Alam
      Sutera, ibis Gading Serpong, ibis Styles Serpong BSD — needs new
      region(s), e.g. `bekasi`/`tangerang`, or reuse `jakarta` if these
      turn out to be metro-area properties like the KL precedent
- [ ] **Bogor/Sukabumi cluster** (~5): Novotel Bogor Golf Resort, ibis
      Styles Bogor Raya, ibis Styles Bogor Pajajaran, Pullman Ciawi Vimala
      Hills, Mercure Cibadak Sukabumi Resort — needs new region `bogor`
- [ ] **Kalimantan cluster** (~8): Swissôtel Nusantara (new capital IKN),
      Novotel Banjarmasin Airport, Novotel Pontianak, ibis Pontianak,
      Mercure Samarinda, ibis Samarinda, Mercure Berau, Mercure Pangkalan
      Bun — needs new regions (`banjarmasin`, `pontianak`, `samarinda`,
      `berau`, `pangkalan-bun`, or a shared `kalimantan` if these are
      genuinely one metro cluster — verify before assuming)

Excluded (confirmed pipeline, not yet open): Swissôtel Bali Nusa Dua.
Confirmed no Accor property exists: Labuan Bajo / Komodo.

## All region files that already exist (do not recreate)

bali, balikpapan, bandung, bangka-belitung, bangkok, batam, batangas,
bintan, boracay, cam-ranh, cambodia, cebu, chiang-mai, clark, da-lat,
da-nang, desaru, ha-long-bay, hai-phong, hanoi, ho-chi-minh-city, ho-tram,
hoi-an, hua-hin, indonesia, jakarta, johor-bahru, khao-lak, khao-yai, klia,
ko-samui, koh-chang, koh-si-chang, kota-bharu, kota-kinabalu, krabi,
kuala-lumpur, kuching, lang-co, langkawi, lombok, makassar, malang,
malaysia, manado, manila, medan, melaka, miri, mu-cang-chai, nha-trang,
ninh-binh, padang, palembang, panglao, pattaya, penang, phan-thiet,
philippines, phnom-penh, phu-quoc, phuket, putrajaya, rayong, sapa,
semarang, siem-reap, sihanoukville, singapore, solo, sriracha, subic-bay,
surabaya, thailand, uong-bi, vietnam, vung-tau, yogyakarta

## Batch history

- Batch 1 (20): TH Khao Lak/Koh Chang/Sriracha/Bangkok, VN Hoi An/Vung
  Tau/Ha Long Bay/Sapa/Lang Co, ID Makassar/Manado/Malang/Balikpapan/
  Yogyakarta, MY/SG/PH/KH Kuching/Singapore x2/Clark/Sihanoukville — PR #35
- Batch 2 (20): TH Bangkok/Phuket/Khao Yai, VN Hanoi/Da Lat/Hai Phong/Ninh
  Binh/Mu Cang Chai, ID Bangka/Surabaya/Jakarta/Padang/Semarang, MY/SG/PH
  Miri/Singapore x2/Cebu/Panglao — folded into PR #35
- Batch 3 (10): TH Phuket x2, VN Ho Tram/Hanoi, ID Jakarta/Balikpapan, MY
  KLIA/Putrajaya, SG Faber Park, PH Subic — folded into PR #35
- Batch 4 (20): TH Phuket cluster + Koh Si Chang, VN Da Nang/Phu Quoc/Vung
  Tau/Cam Ranh/Lang Co, MY Klang Valley x5, SG Novotel/Mercure/Mama Shelter
  — PR #36
- Batch 5 (21): TH rest of Phuket cluster, VN rest of Phu Quoc/Vung
  Tau/Ho Tram/Phan Thiet/Hai Phong/Ha Long Bay/Uong Bi, MY Kota
  Bharu/Miri — PR #36

PR #35 merged 2026-08-12 (50 hotels live). PR #36 merged 2026-08-13
(41 more hotels live, 91 total).
