// Pulls Democrats' odds of controlling the House and Senate after the 2026 midterms
// from three real-money prediction markets, averages them, and writes one document
// per day to Firestore. No API keys required — all three endpoints are public.
import { writeDocument, ELECTION_PATH } from "./lib/firestore-rest.mjs";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function getKalshiDemPct(eventTicker, marketTicker) {
  const data = await fetchJson(`https://api.elections.kalshi.com/trade-api/v2/events/${eventTicker}?with_nested_markets=true`);
  const market = (data.event.markets || []).find((m) => m.ticker === marketTicker);
  if (!market) return null;
  const bid = parseFloat(market.yes_bid_dollars);
  const ask = parseFloat(market.yes_ask_dollars);
  if (!isNaN(bid) && !isNaN(ask) && bid > 0 && ask > 0) return ((bid + ask) / 2) * 100;
  const last = parseFloat(market.last_price_dollars);
  return isNaN(last) ? null : last * 100;
}

async function getPolymarketDemPct(slug, questionIncludes) {
  const events = await fetchJson(`https://gamma-api.polymarket.com/events?slug=${slug}`);
  const event = events[0];
  if (!event) return null;
  const market = (event.markets || []).find((m) => (m.question || "").includes(questionIncludes));
  if (!market || !market.outcomePrices) return null;
  const prices = JSON.parse(market.outcomePrices);
  return parseFloat(prices[0]) * 100; // outcomes are ["Yes", "No"]; Yes = Democratic control
}

async function getPredictItDemPct(marketId) {
  const data = await fetchJson(`https://www.predictit.org/api/marketdata/markets/${marketId}`);
  const contract = (data.contracts || []).find((c) => /democrat/i.test(c.name));
  return contract ? parseFloat(contract.lastTradePrice) * 100 : null;
}

function average(nums) {
  const vals = nums.filter((n) => typeof n === "number" && !isNaN(n));
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

async function buildChamber({ kalshiEvent, kalshiMarket, pmSlug, pmQuestion, predictItId }) {
  const [kalshi, polymarket, predictit] = await Promise.all([
    getKalshiDemPct(kalshiEvent, kalshiMarket).catch((e) => { console.error("Kalshi error:", e.message); return null; }),
    getPolymarketDemPct(pmSlug, pmQuestion).catch((e) => { console.error("Polymarket error:", e.message); return null; }),
    getPredictItDemPct(predictItId).catch((e) => { console.error("PredictIt error:", e.message); return null; })
  ]);
  const round = (v) => (v === null ? null : Math.round(v * 10) / 10);
  return {
    kalshi: round(kalshi),
    polymarket: round(polymarket),
    predictit: round(predictit),
    avg: average([kalshi, polymarket, predictit])
  };
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  const [house, senate] = await Promise.all([
    buildChamber({
      kalshiEvent: "CONTROLH-2026",
      kalshiMarket: "CONTROLH-2026-D",
      pmSlug: "which-party-will-win-the-house-in-2026",
      pmQuestion: "Democratic Party control the House",
      predictItId: 8157
    }),
    buildChamber({
      kalshiEvent: "CONTROLS-2026",
      kalshiMarket: "CONTROLS-2026-D",
      pmSlug: "which-party-will-win-the-senate-in-2026",
      pmQuestion: "Democratic Party control the Senate",
      predictItId: 8155
    })
  ]);

  console.log("House:", house);
  console.log("Senate:", senate);

  await writeDocument(`${ELECTION_PATH}/prediction_markets/${today}`, {
    date: today,
    house,
    senate,
    fetchedAt: new Date().toISOString()
  });
  console.log(`Wrote prediction_markets/${today}`);
}

main().catch((e) => {
  console.error("fetch-prediction-markets failed:", e);
  process.exit(1);
});
