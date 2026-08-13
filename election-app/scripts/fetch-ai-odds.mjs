// Asks each configured AI model the same fixed question about the 2026 midterms and
// stores its probability estimates. A model is skipped (left `null` = "pending") if
// its API key secret isn't set, so this degrades gracefully as keys get added.
import { writeDocument, ELECTION_PATH } from "./lib/firestore-rest.mjs";

const PROMPT = `You are forecasting the 2026 US midterm elections (Election Day: Nov 3, 2026).
Based on everything you know — polling, prediction markets, fundamentals, historical trends —
give your own best-estimate probability (0-100, one decimal place) that:
1. Democrats win a majority in the U.S. House of Representatives
2. Democrats win a majority in the U.S. Senate
Respond with ONLY a JSON object, no other text: {"house": <number>, "senate": <number>}`;

function extractJson(text) {
  const match = text.match(/\{[^{}]*\}/s);
  if (!match) throw new Error(`No JSON object found in response: ${text.slice(0, 200)}`);
  const obj = JSON.parse(match[0]);
  return { house: Number(obj.house), senate: Number(obj.senate) };
}

async function askAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 200, messages: [{ role: "user", content: PROMPT }] })
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return extractJson(data.content.map((c) => c.text || "").join(""));
}

async function askOpenAiCompatible({ envKey, baseUrl, modelEnv, defaultModel, temperature }) {
  const key = process.env[envKey];
  if (!key) return null;
  const model = process.env[modelEnv] || defaultModel;
  const body = { model, messages: [{ role: "user", content: PROMPT }] };
  if (temperature !== undefined) body.temperature = temperature;
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${baseUrl} HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return extractJson(data.choices[0].message.content);
}

async function askGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }] })
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return extractJson(data.candidates[0].content.parts.map((p) => p.text || "").join(""));
}

const MODELS = {
  claude: () => askAnthropic(),
  chatgpt: () => askOpenAiCompatible({ envKey: "OPENAI_API_KEY", baseUrl: "https://api.openai.com/v1", modelEnv: "OPENAI_MODEL", defaultModel: "gpt-5" }),
  gemini: () => askGemini(),
  grok: () => askOpenAiCompatible({ envKey: "XAI_API_KEY", baseUrl: "https://api.x.ai/v1", modelEnv: "XAI_MODEL", defaultModel: "grok-4", temperature: 0 }),
  qwen: () => askOpenAiCompatible({ envKey: "DASHSCOPE_API_KEY", baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", modelEnv: "QWEN_MODEL", defaultModel: "qwen-max", temperature: 0 })
};

function average(nums) {
  const vals = nums.filter((n) => typeof n === "number" && !isNaN(n));
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const house = {};
  const senate = {};

  for (const [key, fn] of Object.entries(MODELS)) {
    try {
      const result = await fn();
      house[key] = result ? result.house : null;
      senate[key] = result ? result.senate : null;
      console.log(`${key}:`, result || "skipped (no API key)");
    } catch (e) {
      console.error(`${key} failed:`, e.message);
      house[key] = null;
      senate[key] = null;
    }
  }

  house.avg = average(Object.values(house));
  senate.avg = average(Object.values(senate));

  await writeDocument(`${ELECTION_PATH}/ai_odds/${today}`, {
    date: today,
    house,
    senate,
    fetchedAt: new Date().toISOString()
  });
  console.log(`Wrote ai_odds/${today}`);
}

main().catch((e) => {
  console.error("fetch-ai-odds failed:", e);
  process.exit(1);
});
