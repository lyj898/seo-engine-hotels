/**
 * Provider router for the two extraction/rewrite steps that never need live
 * web search -- discover-entities.js and generate-summaries.js. Both hand
 * the model text that was already fetched deterministically (a source page,
 * or an entity's own verified core_facts) and ask it to extract/rewrite,
 * never "go find out" -- so a cheaper, less reliable model is an acceptable
 * trade here, unlike research-entities.js and audit-entities.js which use
 * Claude's server-side web_search tool directly and MUST stay on
 * anthropic-client.js (DeepSeek has no equivalent live-browsing tool).
 *
 * Provider is chosen by site.config.json's sourceConfig.extractionModelProvider
 * ("claude" | "deepseek"), not by merely detecting an API key -- an explicit
 * config toggle so a run never silently switches providers just because a
 * secret happens to be present.
 */
import siteConfig from '../../src/lib/config.js';
import { callClaudeForJson } from './anthropic-client.js';
import { callDeepSeekForJson } from './deepseek-client.js';

export function getExtractionProvider() {
  return siteConfig.sourceConfig?.extractionModelProvider === 'deepseek' ? 'deepseek' : 'claude';
}

/**
 * Same contract as callClaudeForJson/callDeepSeekForJson: { system, prompt,
 * maxTokens, retries } -> parsed JSON, throwing after retries are exhausted.
 * Routes to whichever provider site.config.json currently selects.
 */
export async function callExtractionModelForJson({ system, prompt, maxTokens, retries }) {
  const provider = getExtractionProvider();
  if (provider === 'deepseek') {
    return callDeepSeekForJson({ system, prompt, maxTokens, retries });
  }
  return callClaudeForJson({ system, prompt, maxTokens, retries });
}
