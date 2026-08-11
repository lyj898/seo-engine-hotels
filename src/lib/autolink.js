/**
 * Auto-links the first mention of another entity's exact name inside a
 * page's own prose to that entity's page -- so an ai_summary sentence like
 * "...the same embassy-district pocket as The Ritz-Carlton, Bangkok" becomes
 * a real link instead of a dead-end plain-text name, without hand-editing
 * every data file (research/refresh passes write this prose, so a manual
 * link is guaranteed to rot).
 *
 * createEntityLinker(...) returns a linker scoped to ONE page render. It
 * carries state across every field it touches (ai_summary, pros/cons,
 * research highlights/watchouts, ...) so:
 *
 *   - each OTHER entity is linked at most once per page, however many
 *     fields or times its name recurs there -- a second or third mention of
 *     the same hotel stays plain text. Multiple DIFFERENT link targets on
 *     one page are fine (it happens); repeating the identical link is the
 *     overlinking this exists to prevent.
 *
 *   - the current entity's OWN name is never linked to itself, and is
 *     matched (and its span claimed) *before* other candidates so that when
 *     one hotel's name is a literal substring of another's -- e.g. "Four
 *     Points by Sheraton Johor Bahru" contains "Sheraton Johor Bahru" --
 *     the embedded substring is never mistaken for a mention of the other
 *     property. This falls out of the same longest-name-first rule below
 *     rather than needing special-case code, since a self-name is always at
 *     least as long as any name embedded inside it.
 *
 *   - matching is longest-name-first over a single left-to-right pass, so a
 *     longer, more specific name ("Mercure Bangkok Siam Ratchathewi") claims
 *     its span before a shorter name that happens to be its own prefix
 *     ("Mercure Bangkok Siam") can wrongly match inside it.
 *
 * Output is an HTML string (everything but the inserted <a> tags is
 * escaped), meant for Astro's set:html. Only fields that currently render as
 * plain text with no other markup should be passed through this -- it's
 * additive, not a formatting change.
 */
export function createEntityLinker(allEntities, currentEntity, entityHref) {
  const candidates = allEntities
    .filter((e) => e.slug && e.name)
    .map((e) => ({ id: e.entity_id, name: e.name, slug: e.slug, isSelf: e.entity_id === currentEntity.entity_id }))
    .sort((a, b) => b.name.length - a.name.length);

  if (candidates.length === 0) {
    return (text) => escapeHtml(text ?? '');
  }

  const pattern = new RegExp(candidates.map((c) => escapeRegExp(c.name)).join('|'), 'g');
  const byName = new Map(candidates.map((c) => [c.name, c]));
  const alreadyLinked = new Set();

  return function linkMentions(text) {
    if (!text) return '';
    let result = '';
    let lastIndex = 0;
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const candidate = byName.get(match[0]);
      result += escapeHtml(text.slice(lastIndex, match.index));
      if (!candidate.isSelf && !alreadyLinked.has(candidate.id)) {
        result += `<a href="${entityHref(candidate.slug)}" class="link-inline">${escapeHtml(match[0])}</a>`;
        alreadyLinked.add(candidate.id);
      } else {
        result += escapeHtml(match[0]);
      }
      lastIndex = pattern.lastIndex;
    }
    result += escapeHtml(text.slice(lastIndex));
    return result;
  };
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
