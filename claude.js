// Thin wrapper around the Anthropic Messages API. Requires ANTHROPIC_API_KEY to be set as an
// environment variable — this file never hardcodes or stores a key.
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';
const API_URL = 'https://api.anthropic.com/v1/messages';

async function callClaude(messages, tools, systemPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('NO_API_KEY');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Claude API error ${res.status}: ${text}`);
    err.code = 'API_ERROR';
    throw err;
  }

  return res.json();
}

module.exports = { callClaude, MODEL };
