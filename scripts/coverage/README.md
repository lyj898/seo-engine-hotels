# Coverage curation toolkit

`external_coverage` (independent reviews + YouTube videos on each hotel page) is **100% hand-curated and verified** — the site's whole value is "verified", and LLMs hallucinate video IDs. Do **not** push coverage generation into the automated pipeline. This is the repeatable manual process (used to complete Singapore 14/14 on 2026-08-04).

## The hard rule
- Every YouTube `video_id` confirmed via oEmbed (`https://www.youtube.com/oembed?url=...`).
- Every review URL fetched (allow 403/401 = bot-blocked-but-real; drop only 404).
- Review `summary` = your **own** paraphrase (never the source's copyrighted text), **≤ 240 chars** (schema max).
- Fewer verified items beats more unverified ones.

## Process (per batch of hotels)

**1. Pick a staging dir** for this batch's files, e.g. your session scratchpad. Call it `<DIR>`.

**2. Research — one subagent per hotel** (they run in parallel; each writes its result to a file so nothing is transcribed by hand). Give each agent this prompt (substitute NAME / CITY / SLUG), then, when it returns, message it to `Write` its JSON to `<DIR>/cov-<SLUG>.json`:

> You research independent web coverage for ONE hotel, for a live directory's "Reviews & videos from around the web" section. ACCURACY IS CRITICAL: every link goes live. NEVER fabricate a URL, video_id, title, author, or date.
> Hotel: **NAME** (Marriott Bonvoy), in **CITY**.
> Load web tools first (ToolSearch select:WebSearch,WebFetch).
> A) 3–5 WRITTEN REVIEWS — independent published reviews of THIS hotel (blogs, points/miles sites, magazines). Exclude the hotel's/Marriott's own pages, OTA listings (Booking/Expedia/Agoda/Hotels.com/Trip.com), and TripAdvisor aggregate pages. WebFetch each URL to confirm it loads and is genuinely about THIS hotel. Each `summary` is your own paraphrase, **≤ 240 characters**.
> B) 3–5 YOUTUBE VIDEOS — real room tours / reviews of THIS hotel. For each, verify the id via `https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DVIDEOID&format=json`; if it returns JSON use the EXACT title + author_name, else DISCARD. Never include an unverified id.
> Return ONLY strict JSON: `{ "slug": "SLUG", "reviews": [ {title, source, author?, url, published_date (YYYY-MM-DD), summary} ], "videos": [ {title, channel, url, video_id, published_date?, view_count?} ] }`

**3. Verify** (independent gate — re-checks every id/url, drops failures, makes video titles canonical, warns on >240-char summaries):
```
powershell scripts/coverage/verify-coverage.ps1 -Dir <DIR>
```
Writes `<DIR>/coverage-final.json`. Review the DROPS/WARNINGS. Shorten any flagged summaries in `coverage-final.json` (or have the agent redo them).

**4. Insert** into the entity files (before each `"tags"` line, preserving formatting; refuses >240 summaries; skips hotels that already have coverage):
```
powershell scripts/coverage/insert-coverage.ps1 -Dir <DIR>
```

**5. Validate** everything still parses, then commit:
```
powershell -Command "Get-ChildItem data/entities/*.json | ForEach-Object { $null = [System.IO.File]::ReadAllText($_.FullName) | ConvertFrom-Json }"
```

## Remaining backlog
Coverage still missing on: **Bali 21, Bangkok 20, KL 11, Phuket 8, HCMC 1** (+ any newly added hotels). Singapore is complete. See `docs/WORKPLAN.md` §2.
