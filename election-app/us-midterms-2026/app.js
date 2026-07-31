// ============ FIREBASE INIT ============
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const electionRef = db.collection("elections").doc(ELECTION_ID);
const marketsCol = electionRef.collection("prediction_markets");
const pollsCol = electionRef.collection("senate_polls");
const tweetsCol = electionRef.collection("tweets");
const aiOddsCol = electionRef.collection("ai_odds");

let selectedState = SWING_STATES[0].code;
let allPollDocs = [];
let charts = {};

// ============ UTIL ============
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function fmtPct(v) {
  return (v === null || v === undefined || isNaN(v)) ? "—" : `${v.toFixed(1)}%`;
}
function fmtDate(d) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function relTime(dateStr) {
  if (!dateStr) return "no data yet";
  const then = new Date(dateStr + "T00:00:00").getTime();
  const days = Math.round((Date.now() - then) / 86400000);
  if (days <= 0) return "updated today";
  if (days === 1) return "updated yesterday";
  return `updated ${days} days ago`;
}
function avg(nums) {
  const vals = nums.filter((n) => typeof n === "number" && !isNaN(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

// ============ TABS ============
document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tab]");
  if (!btn) return;
  document.querySelectorAll("nav.tabs button").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll("section.panel").forEach((p) => p.classList.remove("active"));
  document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
});

document.querySelectorAll(".toggle-table-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const el = document.getElementById(btn.dataset.target);
    el.classList.toggle("open");
    btn.textContent = el.classList.contains("open") ? "Hide data table" : "Show data table";
  });
});

// ============ PREDICTION MARKETS ============
async function loadPredictionMarkets() {
  const snap = await marketsCol.orderBy("date", "asc").get();
  const docs = snap.docs.map((d) => d.data());
  const badge = document.getElementById("markets-updated");

  if (!docs.length) {
    badge.textContent = "no data yet";
    document.getElementById("markets-stat-row").innerHTML =
      '<div class="empty-state">No prediction market data yet — the daily fetch job will populate this.</div>';
    return;
  }
  badge.textContent = relTime(docs[docs.length - 1].date);

  const latest = docs[docs.length - 1];
  document.getElementById("markets-stat-row").innerHTML = `
    <div class="stat-tile">
      <div class="label">Dem House — Avg Odds</div>
      <div class="value dem-txt">${fmtPct(latest.house && latest.house.avg)}</div>
      <div class="sub">as of ${fmtDate(latest.date)}</div>
    </div>
    <div class="stat-tile">
      <div class="label">Dem Senate — Avg Odds</div>
      <div class="value dem-txt">${fmtPct(latest.senate && latest.senate.avg)}</div>
      <div class="sub">as of ${fmtDate(latest.date)}</div>
    </div>
  `;

  renderMarketChamber("house", docs, "chart-house", "table-house");
  renderMarketChamber("senate", docs, "chart-senate", "table-senate");
}

function renderMarketChamber(chamber, docs, canvasId, tableId) {
  const labels = docs.map((d) => fmtDate(d.date));
  const series = [
    { key: "kalshi", label: "Kalshi", color: cssVar("--series-blue") },
    { key: "polymarket", label: "Polymarket", color: cssVar("--series-orange") },
    { key: "predictit", label: "PredictIt", color: cssVar("--series-aqua") },
    { key: "avg", label: "Avg Odds", color: cssVar("--series-violet") }
  ];

  const datasets = series.map((s) => ({
    label: s.label,
    data: docs.map((d) => (d[chamber] ? d[chamber][s.key] : null)),
    borderColor: s.color,
    backgroundColor: s.color,
    borderWidth: s.key === "avg" ? 3 : 2,
    borderDash: s.key === "avg" ? [] : [],
    pointRadius: 0,
    pointHoverRadius: 5,
    tension: 0.25,
    spanGaps: true
  }));

  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(document.getElementById(canvasId), {
    type: "line",
    data: { labels, datasets },
    options: chartOptions("%")
  });

  const tbl = document.getElementById(tableId);
  let rows = docs.map((d) => `
    <tr>
      <td>${fmtDate(d.date)}</td>
      <td>${fmtPct(d[chamber] && d[chamber].kalshi)}</td>
      <td>${fmtPct(d[chamber] && d[chamber].polymarket)}</td>
      <td>${fmtPct(d[chamber] && d[chamber].predictit)}</td>
      <td><strong>${fmtPct(d[chamber] && d[chamber].avg)}</strong></td>
    </tr>`).join("");
  tbl.innerHTML = `<table class="data-table">
    <thead><tr><th>Date</th><th>Kalshi</th><th>Polymarket</th><th>PredictIt</th><th>Avg Odds</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function chartOptions(unit) {
  const grid = cssVar("--grid-line");
  const axis = cssVar("--axis-line");
  const muted = cssVar("--text-muted");
  const primary = cssVar("--text-primary");
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: cssVar("--text-secondary"), boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 11 } }
      },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y === null ? "—" : ctx.parsed.y.toFixed(1) + unit}` }
      }
    },
    scales: {
      x: { grid: { color: grid, display: false }, ticks: { color: muted, maxRotation: 0, autoSkip: true, font: { size: 10 } } },
      y: { grid: { color: grid }, border: { color: axis }, ticks: { color: muted, callback: (v) => v + unit } }
    }
  };
}

// ============ SENATE POLLS ============
function renderStateTabs() {
  const wrap = document.getElementById("state-tabs");
  wrap.innerHTML = SWING_STATES.map((s) =>
    `<button data-code="${s.code}" class="${s.code === selectedState ? "active" : ""}" title="${s.note}">${s.name}</button>`
  ).join("");
  wrap.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedState = btn.dataset.code;
      wrap.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderPollsForState();
    });
  });
}

async function loadSenatePolls() {
  const snap = await pollsCol.orderBy("date", "asc").get();
  allPollDocs = snap.docs.map((d) => d.data());
  const badge = document.getElementById("polls-updated");
  if (!allPollDocs.length) {
    badge.textContent = "no data yet";
  } else {
    badge.textContent = relTime(allPollDocs[allPollDocs.length - 1].date);
  }
  renderStateTabs();
  renderPollsForState();
}

function bucketAvgMargin(bucketData) {
  if (!bucketData || !bucketData.pollsters) return null;
  const margins = Object.values(bucketData.pollsters)
    .filter((p) => p && typeof p.dem === "number" && typeof p.rep === "number")
    .map((p) => p.dem - p.rep);
  return avg(margins);
}

function renderPollsForState() {
  const stateInfo = SWING_STATES.find((s) => s.code === selectedState);
  const docsForState = allPollDocs
    .filter((d) => d.state === selectedState)
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  document.getElementById("poll-trend-title").textContent =
    `${stateInfo.name} — bucket avg margin (Dem − Rep), weekly`;

  const labels = docsForState.map((d) => fmtDate(d.date));
  const bucketKeys = Object.keys(POLL_BUCKETS);
  const datasets = bucketKeys.map((bk) => ({
    label: POLL_BUCKETS[bk].label,
    data: docsForState.map((d) => bucketAvgMargin(d[bk])),
    borderColor: cssVar(POLL_BUCKETS[bk].color.replace("var(", "").replace(")", "")),
    backgroundColor: cssVar(POLL_BUCKETS[bk].color.replace("var(", "").replace(")", "")),
    borderWidth: 2.5,
    pointRadius: 3,
    pointHoverRadius: 6,
    tension: 0.2,
    spanGaps: true
  }));

  const canvasId = "chart-polls";
  if (charts[canvasId]) charts[canvasId].destroy();
  if (!docsForState.length) {
    document.getElementById("bucket-grid").innerHTML =
      `<div class="empty-state">No polls logged yet for ${stateInfo.name}. Use “+ Add a poll” to add one.</div>`;
    return;
  }
  charts[canvasId] = new Chart(document.getElementById(canvasId), {
    type: "line",
    data: { labels, datasets },
    options: chartOptionsMargin()
  });

  // latest snapshot per bucket
  const latest = docsForState[docsForState.length - 1];
  document.getElementById("bucket-grid").innerHTML = bucketKeys.map((bk) => {
    const meta = POLL_BUCKETS[bk];
    const data = latest[bk];
    const rows = Object.entries(meta.pollsters).map(([pk, pname]) => {
      const p = data && data.pollsters && data.pollsters[pk];
      if (!p) return `<tr><td>${pname}</td><td colspan="3" style="color:var(--text-muted)">no poll yet</td></tr>`;
      return `<tr><td>${pname}</td><td class="dem-txt">${fmtPct(p.dem)}</td><td class="rep-txt">${fmtPct(p.rep)}</td><td>${fmtDate(p.date)}</td></tr>`;
    }).join("");
    const m = bucketAvgMargin(data);
    const marginColor = m === null ? cssVar("--text-muted") : m > 0 ? cssVar("--dem") : cssVar("--rep");
    return `<div class="card bucket-card">
      <h4>${meta.label}</h4>
      <div class="bucket-sub">Avg margin: <strong style="color:${marginColor}">${m === null ? "—" : (m > 0 ? "D+" : "R+") + Math.abs(m).toFixed(1)}</strong></div>
      <table class="data-table">
        <thead><tr><th>Pollster</th><th>Dem</th><th>Rep</th><th>Date</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join("");
}

function chartOptionsMargin() {
  const opts = chartOptions("");
  opts.scales.y.ticks.callback = (v) => (v > 0 ? "D+" + v : v < 0 ? "R+" + Math.abs(v) : "EVEN");
  opts.plugins.tooltip.callbacks.label = (ctx) => {
    const v = ctx.parsed.y;
    if (v === null) return `${ctx.dataset.label}: —`;
    return `${ctx.dataset.label}: ${v > 0 ? "D+" : "R+"}${Math.abs(v).toFixed(1)}`;
  };
  return opts;
}

// ============ TOP TWEETERS ============
async function loadTweets() {
  const snap = await tweetsCol.orderBy("postedAt", "desc").limit(60).get();
  const docs = snap.docs.map((d) => d.data());
  const badge = document.getElementById("tweets-updated");
  badge.textContent = docs.length ? relTime(docs[0].postedAt) : "no data yet";

  const feed = document.getElementById("tweet-feed");
  if (!docs.length) {
    feed.innerHTML = '<div class="empty-state">No takes logged yet — use “+ Log a take” to add one.</div>';
    return;
  }
  feed.innerHTML = docs.map((t) => `
    <div class="tweet-card">
      <span class="author">${t.author}</span><span class="handle">${t.handle || ""}</span>
      <div class="text">${(t.text || "").replace(/</g, "&lt;")}</div>
      <div class="meta">
        <span>${fmtDate(t.postedAt)}</span>
        ${t.source ? `<a href="${t.source}" target="_blank" rel="noopener">source ↗</a>` : ""}
      </div>
    </div>
  `).join("");
}

// ============ AI ODDS ============
async function loadAiOdds() {
  const snap = await aiOddsCol.orderBy("date", "asc").get();
  const docs = snap.docs.map((d) => d.data());
  const badge = document.getElementById("ai-updated");

  if (!docs.length) {
    badge.textContent = "no data yet";
    document.getElementById("ai-grid-house").innerHTML = '<div class="empty-state">No AI odds yet.</div>';
    document.getElementById("ai-grid-senate").innerHTML = "";
    return;
  }
  badge.textContent = relTime(docs[docs.length - 1].date);
  const latest = docs[docs.length - 1];

  renderAiGrid("ai-grid-house", latest.house);
  renderAiGrid("ai-grid-senate", latest.senate);

  const labels = docs.map((d) => fmtDate(d.date));
  const datasets = [
    { label: "AI Avg — House", data: docs.map((d) => d.house && d.house.avg), borderColor: cssVar("--series-blue"), backgroundColor: cssVar("--series-blue") },
    { label: "AI Avg — Senate", data: docs.map((d) => d.senate && d.senate.avg), borderColor: cssVar("--series-orange"), backgroundColor: cssVar("--series-orange") }
  ].map((s) => ({ ...s, borderWidth: 3, pointRadius: 0, pointHoverRadius: 5, tension: 0.25, spanGaps: true }));

  const canvasId = "chart-ai";
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(document.getElementById(canvasId), {
    type: "line",
    data: { labels, datasets },
    options: chartOptions("%")
  });
}

function renderAiGrid(elId, chamberData) {
  const el = document.getElementById(elId);
  const tiles = AI_MODELS.map((m) => {
    const v = chamberData ? chamberData[m.key] : null;
    const pending = v === null || v === undefined;
    return `<div class="ai-tile ${pending ? "pending" : ""}">
      <div class="icon">${m.icon}</div>
      <div class="name">${m.label}</div>
      ${pending ? '<div class="pending-label">pending API key</div>' : `<div class="pct dem-txt">${fmtPct(v)}</div>`}
    </div>`;
  }).join("");
  const avgVal = chamberData ? chamberData.avg : null;
  el.innerHTML = tiles + `
    <div class="ai-tile" style="border-color:var(--gold);border-width:2px;">
      <div class="icon">Σ</div>
      <div class="name">AI Avg</div>
      <div class="pct dem-txt">${fmtPct(avgVal)}</div>
    </div>`;
}

// ============ MODALS: ADD POLL ============
document.getElementById("add-poll-btn").addEventListener("click", () => {
  const stateSel = document.getElementById("pf-state");
  stateSel.innerHTML = SWING_STATES.map((s) => `<option value="${s.code}">${s.name}</option>`).join("");
  stateSel.value = selectedState;
  updatePollsterOptions();
  document.getElementById("pf-date").value = new Date().toISOString().slice(0, 10);
  openModal("poll-modal");
});
document.getElementById("pf-bucket").addEventListener("change", updatePollsterOptions);
function updatePollsterOptions() {
  const bucket = document.getElementById("pf-bucket").value;
  const sel = document.getElementById("pf-pollster");
  sel.innerHTML = Object.entries(POLL_BUCKETS[bucket].pollsters)
    .map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
}

async function submitPoll() {
  const state = document.getElementById("pf-state").value;
  const bucket = document.getElementById("pf-bucket").value;
  const pollster = document.getElementById("pf-pollster").value;
  const date = document.getElementById("pf-date").value;
  const dem = parseFloat(document.getElementById("pf-dem").value);
  const rep = parseFloat(document.getElementById("pf-rep").value);
  const sample = document.getElementById("pf-sample").value;
  const source = document.getElementById("pf-source").value;

  if (!date || isNaN(dem) || isNaN(rep)) {
    toast("Please fill in date, Dem % and Rep %");
    return;
  }

  const docId = `${state}_${date}`;
  const docRef = pollsCol.doc(docId);
  const existing = await docRef.get();
  const data = existing.exists ? existing.data() : { state, date, silverTop7: { pollsters: {} }, rightLeaning: { pollsters: {} }, leftLeaning: { pollsters: {} } };
  if (!data[bucket]) data[bucket] = { pollsters: {} };
  if (!data[bucket].pollsters) data[bucket].pollsters = {};
  data[bucket].pollsters[pollster] = {
    dem, rep, date,
    sampleSize: sample ? parseInt(sample, 10) : null,
    source: source || null
  };
  data[bucket].avgDem = avg(Object.values(data[bucket].pollsters).map((p) => p.dem));
  data[bucket].avgRep = avg(Object.values(data[bucket].pollsters).map((p) => p.rep));

  await docRef.set(data, { merge: true });
  closeModal("poll-modal");
  toast("Poll saved");
  ["pf-dem", "pf-rep", "pf-sample", "pf-source"].forEach((id) => (document.getElementById(id).value = ""));
  await loadSenatePolls();
}

// ============ MODALS: ADD TWEET ============
document.getElementById("add-tweet-btn").addEventListener("click", () => {
  const sel = document.getElementById("tf-author");
  sel.innerHTML = PUNDITS.map((p) => `<option value="${p.key}">${p.name}</option>`).join("");
  document.getElementById("tf-date").value = new Date().toISOString().slice(0, 10);
  openModal("tweet-modal");
});

async function submitTweet() {
  const authorKey = document.getElementById("tf-author").value;
  const pundit = PUNDITS.find((p) => p.key === authorKey);
  const text = document.getElementById("tf-text").value.trim();
  const date = document.getElementById("tf-date").value;
  const source = document.getElementById("tf-source").value;

  if (!text || !date) {
    toast("Please add the post text and date");
    return;
  }

  await tweetsCol.add({
    authorKey,
    author: pundit.name,
    handle: pundit.handle,
    text,
    postedAt: date,
    source: source || null,
    fetchedAt: new Date().toISOString()
  });
  closeModal("tweet-modal");
  toast("Take logged");
  document.getElementById("tf-text").value = "";
  document.getElementById("tf-source").value = "";
  await loadTweets();
}

// ============ BOOT ============
window.closeModal = closeModal;
window.submitPoll = submitPoll;
window.submitTweet = submitTweet;

(async function init() {
  try {
    await Promise.all([loadPredictionMarkets(), loadSenatePolls(), loadTweets(), loadAiOdds()]);
  } catch (e) {
    console.error("Failed to load dashboard data:", e);
    toast("Couldn't load data — check console");
  }
})();
