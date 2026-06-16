const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export async function askClaude(prompt, useWebSearch = false) {
  const body = {
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  };
  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const text = data.content
    ?.filter(b => b.type === 'text')
    .map(b => b.text)
    .join('') || '';
  return text;
}

export async function askClaudeJSON(prompt, useWebSearch = false) {
  const text = await askClaude(prompt, useWebSearch);
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}
