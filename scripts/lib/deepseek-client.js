import { extractJson } from './json-extract.js';

// DeepSeek's API is OpenAI-compatible chat completions -- plain fetch is
// enough, no SDK dependency needed (mirrors this repo's existing preference
// for a small dependency footprint).
const API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

/**
 * Single non-streaming call to DeepSeek, returns the response's text content.
 * Same shape as anthropic-client.js's callClaude() by design -- callers
 * (via model-client.js) don't need to know which provider they're talking to.
 */
export async function callDeepSeek({ system, prompt, maxTokens = 2000, model = DEFAULT_MODEL }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      'DEEPSEEK_API_KEY is not set. Locally: export it in your shell. In GitHub Actions: add it as a repository secret (Settings -> Secrets and variables -> Actions).'
    );
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`DeepSeek API error ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    throw new Error(`DeepSeek response had no message content: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return text;
}

/**
 * Like callClaudeForJson: calls DeepSeek and parses the response as JSON,
 * retrying once with a corrective follow-up if the first response isn't
 * parseable. Never silently returns malformed data.
 *
 * DeepSeek has no server-side web-search tool (unlike Claude's
 * web_search_20250305), so this must only ever be used for tasks that hand
 * the model text it already fetched deterministically -- extraction and
 * rewriting, never "go find out" tasks. See model-client.js for the
 * provider-routing rule that enforces this split.
 */
export async function callDeepSeekForJson({ system, prompt, maxTokens = 2000, model, retries = 1 }) {
  let lastError;
  let currentPrompt = prompt;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const text = await callDeepSeek({ system, prompt: currentPrompt, maxTokens, model });
    try {
      return extractJson(text);
    } catch (err) {
      lastError = err;
      currentPrompt =
        `${prompt}\n\n---\nYour previous response could not be parsed as JSON (error: "${err.message}"). ` +
        'Respond again with ONLY valid JSON -- no markdown code fences, no commentary before or after it.';
    }
  }
  throw new Error(`callDeepSeekForJson: exhausted ${retries + 1} attempt(s). Last error: ${lastError.message}`);
}
