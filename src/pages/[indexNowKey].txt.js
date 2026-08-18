/**
 * Serves the IndexNow ownership-proof key file at
 * https://<domain>/<indexNowKey>.txt, whose body must be exactly the key.
 *
 * IndexNow requires this file to exist before it will accept submissions:
 * it's how the API proves the submitter controls the domain. Generated from
 * site.config.json.indexNowKey rather than committed as a static file in
 * public/, for the same reason robots.txt and sitemap.xml are generated --
 * a static file would hardcode the key in its filename, so rotating the key
 * in config would silently leave the old file served and every submission
 * rejected. Here the route's filename IS the configured key, so the served
 * file and scripts/submit-indexnow.js can never disagree.
 *
 * An empty/absent indexNowKey emits no route at all (getStaticPaths returns
 * []), which is the correct behaviour for a vertical instance that hasn't
 * set one up -- rather than serving an empty key file that would make
 * submissions fail in a confusing way.
 */
import siteConfig from '../lib/config.js';

export function getStaticPaths() {
  const key = siteConfig.indexNowKey;
  if (typeof key !== 'string' || key.trim() === '') return [];
  return [{ params: { indexNowKey: key.trim() } }];
}

export function GET({ params }) {
  return new Response(params.indexNowKey, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
