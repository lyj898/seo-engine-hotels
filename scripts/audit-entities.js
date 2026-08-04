#!/usr/bin/env node
/**
 * audit-entities.js
 *
 * Catalogue-integrity guard: periodically re-checks that each PUBLISHED
 * entity still exists as a live property under its stated brand, catching
 * hotels that have quietly closed, left the loyalty program, or turned out
 * to be pre-opening -- the exact drift that left "Le Meridien Sentosa" on
 * the site for ~6 years after it exited Marriott in 2020. Discovery finds
 * NEW hotels; this is the other half -- detecting ones that should come off.
 *
 * Conservative by design (mirrors refresh-entities.js): it NEVER auto-
 * archives. A property that looks closed / left / not-open is flagged
 * status: "needs_review" for a human to confirm before it's retired. A clear
 * "open" or an "uncertain" result just stamps audit_last_checked so the same
 * entity isn't re-audited (and re-paid-for) every run. Removing a live hotel
 * on a single LLM web-search verdict is exactly the false-positive risk this
 * flag-don't-delete posture avoids.
 *
 * Cost control: web search costs money per entity, so an entity is only
 * re-audited when it has never been audited or its audit_last_checked is
 * older than sourceConfig.auditIntervalDays. --limit caps entities per run so
 * weekly spend stays flat rather than scaling with the size of the directory;
 * least-recently-audited entities come first, so the whole catalogue is
 * covered over successive runs. --force ignores the interval.
 */
import siteConfig from '../src/lib/config.js';
import { getEntitySchema } from '../src/lib/schema/index.js';
import { loadEntities, stripMeta, isPublished } from '../src/lib/data.js';
import { writeIfValid } from './lib/write-entity.js';
import { callClaudeWithWebSearchForJson } from './lib/anthropic-client.js';
import { buildAuditPrompt } from './lib/prompts.js';

const today = () => new Date().toISOString().slice(0, 10);

function daysBetween(isoA, isoB) {
  const a = Date.parse(isoA);
  const b = Date.parse(isoB);
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity;
  return Math.abs(b - a) / 86400000;
}

/** Reads `--flag value` style args without pulling in a CLI dependency. */
function argValue(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i === process.argv.length - 1) return fallback;
  const parsed = Number(process.argv[i + 1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

async function run() {
  const { verticalKey, sourceConfig } = siteConfig;
  const entitySchema = getEntitySchema(verticalKey);
  const intervalDays = sourceConfig?.auditIntervalDays ?? 30;
  const limit = argValue('limit', sourceConfig?.auditPerRunLimit ?? 20);
  const force = hasFlag('force');

  const raw = loadEntities();
  const stats = { considered: 0, ok: 0, flagged: 0, skippedFresh: 0, failed: 0, invalidSkipped: 0 };

  // Least-recently-audited first (never-audited sorts as oldest), so every
  // published entity comes round over successive runs.
  const targets = raw
    .filter((r) => isPublished(stripMeta(r)))
    .sort((a, b) => String(a.audit_last_checked ?? '').localeCompare(String(b.audit_last_checked ?? '')));

  const queue = [];
  for (const item of targets) {
    const entity = stripMeta(item);
    stats.considered++;
    if (!force && entity.audit_last_checked && daysBetween(entity.audit_last_checked, today()) < intervalDays) {
      stats.skippedFresh++;
      continue;
    }
    queue.push(item);
    if (queue.length >= limit) break;
  }

  console.log(
    `[audit-entities] ${stats.considered} published, ${stats.skippedFresh} still fresh ` +
      `(< ${intervalDays} days), auditing ${queue.length} this run (limit ${limit}${force ? ', --force' : ''}).`
  );

  for (const item of queue) {
    const entity = stripMeta(item);
    const { system, prompt } = buildAuditPrompt({ siteConfig, entity });

    let result;
    try {
      result = await callClaudeWithWebSearchForJson({ system, prompt, maxTokens: 1200 });
    } catch (err) {
      console.warn(`[audit-entities] ${entity.slug}: audit call failed: ${err.message} -- leaving unchanged.`);
      stats.failed++;
      continue;
    }

    const status = typeof result?.status === 'string' ? result.status : 'uncertain';
    const detail = typeof result?.detail === 'string' ? result.detail : '';
    // "not_open" and "closed_or_left" both mean "should not be a published,
    // bookable listing right now" -- flag both for a human. "uncertain" and
    // "open" are left published; we just record that we looked.
    const flag = status === 'closed_or_left' || status === 'not_open';

    const updated = {
      ...entity,
      audit_last_checked: today(),
      // Only escalates active -> needs_review; never auto-archives, and never
      // downgrades an entity a human has already moved past needs_review.
      ...(flag && entity.status === 'active' ? { status: 'needs_review', last_updated: today() } : {}),
    };

    if (!writeIfValid(item.__file, updated, entitySchema)) {
      stats.invalidSkipped++;
      continue;
    }

    if (flag) {
      stats.flagged++;
      console.warn(
        `[audit-entities] FLAG ${entity.slug}: reported "${status}" -> needs_review. ${detail} ` +
          `(${result?.source_url || 'no source'})`
      );
    } else {
      stats.ok++;
    }
  }

  console.log(
    `\n[audit-entities] done. OK: ${stats.ok}, flagged for review: ${stats.flagged}, ` +
      `already fresh: ${stats.skippedFresh}, failed: ${stats.failed}, invalid (skipped write): ${stats.invalidSkipped}.`
  );
  if (stats.flagged > 0) {
    console.log(
      `[audit-entities] ${stats.flagged} entit${stats.flagged === 1 ? 'y' : 'ies'} flagged -- ` +
        'a human must confirm closure/removal and set status: "archived" (this script never auto-archives).'
    );
  }
}

run().catch((err) => {
  console.error('[audit-entities] fatal:', err);
  process.exitCode = 1;
});
