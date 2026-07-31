# Election App

One dashboard per election. Static pages (GitHub Pages) backed by the same shared
Firestore project (`personal-apps-19a32`) already used by `hindi-app` and `life-info`.

## Structure

- `index.html` — hub listing each election
- `us-midterms-2026/` — the US Midterms 2026 dashboard (`index.html` + `config.js` + `app.js`)
- `scripts/` — Node scripts that write to Firestore, run daily by
  `.github/workflows/election-daily-update.yml`

## Data model (Firestore)

```
elections/us-midterms-2026/
  prediction_markets/{YYYY-MM-DD}   { date, house:{kalshi,polymarket,predictit,avg}, senate:{...}, fetchedAt }
  ai_odds/{YYYY-MM-DD}              { date, house:{claude,chatgpt,gemini,grok,qwen,avg}, senate:{...}, fetchedAt }
  senate_polls/{STATE_YYYY-MM-DD}   { state, date, silverTop7:{pollsters:{...},avgDem,avgRep}, rightLeaning:{...}, leftLeaning:{...} }
  tweets/{autoId}                   { authorKey, author, handle, text, postedAt, source, fetchedAt }
```

Firestore rules are open (`allow read, write: if true`) — same tradeoff the other
apps in this repo already make. Fine for a personal dashboard; don't copy this
pattern for anything that needs real access control.

## What's actually automated daily vs. manual

| Section | Automation |
|---|---|
| **Prediction Markets** | Fully automatic. Kalshi, Polymarket and PredictIt all expose public, key-free APIs for their House/Senate control markets — `fetch-prediction-markets.mjs` pulls all three and averages them every day. |
| **AI Odds** | Automatic *per model*, once you add its API key as a GitHub Actions secret (below). A model with no key shows "pending" and is excluded from the average. Treat these as illustrative LLM guesses, not real forecasts. |
| **Senate Polls** | Manual, by design. There is no compliant free API for pollster-level state crosstabs (RealClearPolling and similar aggregators block automated fetches), so polls are logged via the **"+ Add a poll"** button on the dashboard, which writes straight to Firestore. Launch data was seeded from real, sourced polls (see commit history). |
| **Top Tweeters** | Manual, by design. X/Twitter's API no longer offers free read access. Use **"+ Log a take"** on the dashboard to add a new post/quote as you see it. |

## GitHub Actions secrets (optional, for AI Odds)

Add whichever of these you have in the repo's Settings → Secrets and variables → Actions.
Any left unset just means that model stays "pending":

- `ANTHROPIC_API_KEY` — Claude
- `OPENAI_API_KEY` — ChatGPT
- `GEMINI_API_KEY` — Gemini
- `XAI_API_KEY` — Grok
- `DASHSCOPE_API_KEY` — Qwen (Alibaba DashScope)

The workflow runs daily at ~7am ET and can also be triggered manually from the
Actions tab (`workflow_dispatch`).

## Adding another election

Duplicate `us-midterms-2026/` into a new folder, update `config.js` for the new
election's states/pollsters/pundits, point the scripts at a new `ELECTION_PATH`,
and add a card to `index.html`.
