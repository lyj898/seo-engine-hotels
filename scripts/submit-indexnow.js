#!/usr/bin/env node
/**
 * submit-indexnow.js
 *
 * Pings the IndexNow API so Bing (and Yandex, Seznam, Naver -- they share
 * one endpoint) learn about changed URLs immediately instead of waiting to
 * recrawl. Google does NOT participate in IndexNow; Googlebot finds these
 * pages via sitemap.xml as before, so this is purely additive.
 *
 * WHY BING SPECIFICALLY IS WORTH THE TROUBLE
 * ChatGPT's search is Bing-backed, so absence from Bing's index means
 * absence from a whole class of AI answers regardless of how extractable
 * the pages are. This is the cheapest available fix for that.
 *
 * TWO WAYS TO GET THE URL LIST
 * By default it reads dist/sitemap.xml (needs a local build). Pass
 * --sitemap-url to fetch a live one instead, which is what deploy.yml does:
 * pinging only after the deployed sitemap actually serves a URL means Bing
 * is never sent to a page that isn't live yet, and it saves CI a rebuild
 * purely to regenerate a file the site already serves.
 *
 * WHY IT READS dist/sitemap.xml
 * Submitting exactly what the sitemap advertises means the two can never
 * disagree about what exists -- no second copy of the "which routes are
 * real" logic to drift out of sync with src/pages/sitemap.xml.js. It does
 * mean `npm run build` must have run first; the script says so and exits
 * cleanly rather than guessing if dist/ is missing.
 *
 * WHY IT SUBMITS A WINDOW, NOT EVERYTHING
 * IndexNow is for *changed* URLs. Re-submitting all 700+ pages on every
 * deploy would be both pointless and the kind of thing that gets a host
 * throttled, so by default only URLs whose sitemap <lastmod> falls within
 * --days (default 7) are sent. Use --all for a first run, when the whole
 * site genuinely is new to Bing.
 *
 * FAILURE IS NON-FATAL BY DESIGN
 * A refused ping is not a broken deploy -- the pages are live either way
 * and the sitemap still advertises them. Every failure path logs loudly
 * and exits 0 so this can sit at the end of deploy.yml without ever being
 * the reason a good build goes red. Only a genuine misuse of the script
 * (an unparseable --days) exits non-zero.
 *
 * Usage:
 *   node scripts/submit-indexnow.js                # last 7 days of changes
 *   node scripts/submit-indexnow.js --all          # every URL (first run)
 *   node scripts/submit-indexnow.js --days 30
 *   node scripts/submit-indexnow.js --dry-run
 *   node scripts/submit-indexnow.js --sitemap-url https://elitestay.travel/sitemap.xml
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import siteConfig from '../src/lib/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITEMAP = path.resolve(__dirname, '../dist/sitemap.xml');
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_PER_REQUEST = 10000; // IndexNow's documented per-submission cap.

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
function numArg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const parsed = Number(argv[i + 1]);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.error(`[indexnow] --${name} needs a non-negative number, got: ${argv[i + 1]}`);
    process.exit(1);
  }
  return parsed;
}

function strArg(name) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const value = argv[i + 1];
  if (!value || value.startsWith('--')) {
    console.error(`[indexnow] --${name} needs a value.`);
    process.exit(1);
  }
  return value;
}

const sitemapUrl = strArg('sitemap-url');
const submitAll = hasFlag('all');
const dryRun = hasFlag('dry-run');
const days = numArg('days', 7);

function done(message) {
  console.log(`[indexnow] ${message}`);
  process.exit(0);
}

const key = typeof siteConfig.indexNowKey === 'string' ? siteConfig.indexNowKey.trim() : '';
if (!key) {
  done('site.config.json.indexNowKey is empty -- IndexNow disabled for this instance, nothing to do.');
}

let xml;
if (sitemapUrl) {
  try {
    const res = await fetch(sitemapUrl, { headers: { 'User-Agent': siteConfig.sourceConfig?.userAgent ?? 'indexnow-submitter' } });
    if (!res.ok) done(`could not fetch ${sitemapUrl} -- HTTP ${res.status}. Skipping.`);
    xml = await res.text();
    console.log(`[indexnow] read sitemap from ${sitemapUrl}`);
  } catch (err) {
    done(`could not fetch ${sitemapUrl}: ${err.message}. Skipping.`);
  }
} else {
  if (!fs.existsSync(SITEMAP)) {
    done(`no sitemap at ${SITEMAP} -- run \`npm run build\` first, or pass --sitemap-url. Skipping.`);
  }
  // Deliberately a plain regex rather than an XML parser: this reads one
  // file that this very repo generates, whose shape is fixed by
  // src/pages/sitemap.xml.js, so a dependency buys nothing here.
  xml = fs.readFileSync(SITEMAP, 'utf8');
}
const entries = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => ({
  url: m[1].trim(),
  lastmod: m[2]?.trim() ?? null,
}));

if (entries.length === 0) {
  done('sitemap parsed but contained no <url> entries -- nothing to submit.');
}

let selected;
if (submitAll) {
  selected = entries;
} else {
  const cutoff = new Date(Date.now() - days * 86400000);
  // A URL with no <lastmod> is included: the sitemap couldn't vouch for its
  // age, and under-submitting is the worse error of the two here.
  selected = entries.filter((e) => {
    if (!e.lastmod) return true;
    const d = new Date(e.lastmod);
    return Number.isNaN(d.getTime()) ? true : d >= cutoff;
  });
}

console.log(
  `[indexnow] sitemap has ${entries.length} URLs; ${selected.length} selected ` +
    (submitAll ? '(--all).' : `(<lastmod> within ${days} days, or missing).`)
);

if (selected.length === 0) {
  done('nothing changed in the window -- no submission needed.');
}

const host = new URL(siteConfig.siteDomain.startsWith('http') ? siteConfig.siteDomain : `https://${siteConfig.siteDomain}`)
  .hostname;
const keyLocation = `https://${host}/${key}.txt`;

if (dryRun) {
  console.log(`[indexnow] DRY RUN -- would POST ${selected.length} URLs to ${ENDPOINT}`);
  console.log(`[indexnow]   host=${host} keyLocation=${keyLocation}`);
  selected.slice(0, 10).forEach((e) => console.log(`[indexnow]   ${e.url}${e.lastmod ? `  (${e.lastmod})` : ''}`));
  if (selected.length > 10) console.log(`[indexnow]   ... and ${selected.length - 10} more`);
  done('dry run complete, nothing submitted.');
}

let submitted = 0;
let failed = 0;

for (let i = 0; i < selected.length; i += MAX_PER_REQUEST) {
  const batch = selected.slice(i, i + MAX_PER_REQUEST);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation, urlList: batch.map((e) => e.url) }),
    });
    // 200 = accepted, 202 = accepted but key validation pending (normal on a
    // first submission, before Bing has fetched the key file).
    if (res.ok || res.status === 202) {
      submitted += batch.length;
      console.log(`[indexnow] submitted ${batch.length} URLs -- HTTP ${res.status}.`);
    } else {
      failed += batch.length;
      const body = await res.text().catch(() => '');
      console.warn(`[indexnow] batch REFUSED -- HTTP ${res.status}. ${body.slice(0, 300)}`);
      if (res.status === 403) {
        console.warn(`[indexnow] 403 usually means ${keyLocation} isn't reachable yet. Confirm it's deployed and serves exactly the key.`);
      }
    }
  } catch (err) {
    failed += batch.length;
    console.warn(`[indexnow] batch FAILED to send: ${err.message}`);
  }
}

console.log(`[indexnow] done. Submitted: ${submitted}, failed: ${failed}.`);
if (failed > 0) {
  console.log('[indexnow] Failures are non-fatal -- the pages are live and sitemap.xml still advertises them.');
}
