import Anthropic from '@anthropic-ai/sdk';

export function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export async function runWebSearchQuery(prompt: string): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }],
  });

  // Collect all text from the response
  const textParts: string[] = [];
  for (const block of response.content) {
    if (block.type === 'text') {
      textParts.push(block.text);
    }
  }

  return textParts.join('\n\n');
}

export async function runChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string
): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt || `You are a medical research assistant helping manage care for Ananya Sarkar who has Alcoholic Liver Disease (ALD). She has been drinking since approximately 2011, had a severe collapse in 2018, went through rehab, quit, but restarted. Previously drinking 4 glasses of wine/day for years; in 2026 reduced to 2 glasses/day. Current alcohol intake: 300 mL/day as of 2026-05-17. Today is 2026-05-17. Focus on evidence-based information and always indicate confidence levels. Be compassionate and non-judgmental. Provide practical information about managing ALD, treatments, and quality of life.`,
    messages,
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock ? (textBlock as { type: 'text'; text: string }).text : '';
}
