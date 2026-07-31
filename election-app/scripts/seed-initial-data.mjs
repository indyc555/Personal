// One-time seed of real, sourced launch data so the dashboard isn't empty on day one.
// Safe to re-run (each write fully replaces that date/state document with the same values).
import { writeDocument, ELECTION_PATH } from "./lib/firestore-rest.mjs";

function avg(nums) {
  const vals = nums.filter((n) => typeof n === "number" && !isNaN(n));
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
}

function bucket(pollsters) {
  return {
    pollsters,
    avgDem: avg(Object.values(pollsters).map((p) => p.dem)),
    avgRep: avg(Object.values(pollsters).map((p) => p.rep))
  };
}

// state -> date -> { bucketKey: { pollsterKey: {dem, rep, date, sampleSize, source} } }
const POLLS = [
  // --- Nate Silver's Top 7 (NYT/Siena wave, conducted Jun 15-29 2026, released Jul 1 2026) ---
  { state: "AK", date: "2026-07-01", bucket: "silverTop7", pollster: "nytSiena", dem: 45, rep: 47, source: "https://sri.siena.edu/2026/07/01/new-york-times-siena-polls-in-alaska-iowa-north-carolina-and-ohio/" },
  { state: "IA", date: "2026-07-01", bucket: "silverTop7", pollster: "nytSiena", dem: 46, rep: 48, source: "https://sri.siena.edu/2026/07/01/new-york-times-siena-polls-in-alaska-iowa-north-carolina-and-ohio/" },
  { state: "NC", date: "2026-07-01", bucket: "silverTop7", pollster: "nytSiena", dem: 50, rep: 43, source: "https://sri.siena.edu/2026/07/01/new-york-times-siena-polls-in-alaska-iowa-north-carolina-and-ohio/" },
  { state: "OH", date: "2026-07-01", bucket: "silverTop7", pollster: "nytSiena", dem: 47, rep: 50, source: "https://sri.siena.edu/2026/07/01/new-york-times-siena-polls-in-alaska-iowa-north-carolina-and-ohio/" },
  { state: "ME", date: "2026-07-01", bucket: "silverTop7", pollster: "nytSiena", dem: 49, rep: 47, source: "https://thehill.com/homenews/campaign/5949463-texas-maine-iowa-ohio-alaska-senate-races/" },
  { state: "TX", date: "2026-07-01", bucket: "silverTop7", pollster: "nytSiena", dem: 47, rep: 47, source: "https://thehill.com/homenews/campaign/5949463-texas-maine-iowa-ohio-alaska-senate-races/" },

  // --- Right Leaning: Fox News ---
  { state: "GA", date: "2026-07-01", bucket: "rightLeaning", pollster: "fox", dem: 56, rep: 43, sampleSize: null, source: "https://www.foxnews.com/politics/fox-news-poll-early-look-georgia-senate-race" },
  { state: "ME", date: "2026-07-01", bucket: "rightLeaning", pollster: "fox", dem: 47, rep: 50, sampleSize: 1003, source: "https://www.foxnews.com/politics/fox-news-poll-maine-senate-race-tight-concerns-about-both-candidates" },
  { state: "IA", date: "2026-07-01", bucket: "rightLeaning", pollster: "fox", dem: 50, rep: 46, sampleSize: 1003, source: "https://www.foxnews.com/politics/fox-news-poll-close-senate-contest-brewing-iowa" },
  { state: "OH", date: "2026-06-01", bucket: "rightLeaning", pollster: "fox", dem: 53, rep: 45, sampleSize: 1015, source: "https://www.foxnews.com/politics/fox-news-poll-democratic-unity-republican-crossovers-shape-ohio-senate-race" },
  { state: "NC", date: "2026-07-27", bucket: "rightLeaning", pollster: "fox", dem: 53, rep: 44, sampleSize: 1005, source: "https://www.foxnews.com/politics/fox-news-poll-democratic-enthusiasm-shapes-north-carolina-senate-race" },

  // --- Right Leaning: Emerson College ---
  { state: "GA", date: "2026-03-02", bucket: "rightLeaning", pollster: "emerson", dem: 48, rep: 43, sampleSize: 1000, source: "https://emersoncollegepolling.com/georgia-2026-poll-senator-ossoff-starts-re-election-near-50-and-outpaces-gop-field/" },
  { state: "NC", date: "2026-07-29", bucket: "rightLeaning", pollster: "emerson", dem: 47, rep: 41, sampleSize: 1000, source: "https://x.com/EmersonPolling/status/1951223975763181588" },

  // --- Left Leaning: PPP ---
  { state: "AK", date: "2026-01-15", bucket: "leftLeaning", pollster: "ppp", dem: 49, rep: 47, source: "https://www.publicpolicypolling.com/polls/" }
];

async function main() {
  // Group by state+date so each doc is a single write
  const docs = new Map();
  for (const p of POLLS) {
    const id = `${p.state}_${p.date}`;
    if (!docs.has(id)) docs.set(id, { state: p.state, date: p.date });
    const doc = docs.get(id);
    if (!doc[p.bucket]) doc[p.bucket] = {};
    doc[p.bucket][p.pollster] = { dem: p.dem, rep: p.rep, date: p.date, sampleSize: p.sampleSize ?? null, source: p.source ?? null };
  }
  for (const [id, doc] of docs) {
    const payload = { state: doc.state, date: doc.date };
    for (const bk of ["silverTop7", "rightLeaning", "leftLeaning"]) {
      if (doc[bk]) payload[bk] = bucket(doc[bk]);
    }
    await writeDocument(`${ELECTION_PATH}/senate_polls/${id}`, payload);
    console.log(`Wrote senate_polls/${id}`);
  }

  // --- Top Tweeters seed ---
  const TWEETS = [
    { authorKey: "nateSilver", author: "Nate Silver", handle: "@NateSilver538", text: "Democrats have lost some of their lead on the generic congressional ballot. After it peaked at D+7.1 in early June, it dropped down to D+5.9. But after a string of excellent polls over the past week, Democrats are back up to D+6.4.", postedAt: "2026-07-31", source: "https://www.natesilver.net/p/generic-ballot-average-2026-nate-silver-bulletin-congress-polls" },
    { authorKey: "nateCohn", author: "Nate Cohn", handle: "@Nate_Cohn", text: "Democrats now need to win the national House popular vote by roughly 5 points just for a 50/50 shot at the majority, thanks to the post-redistricting House map (est. 2.5-3.9 pt GOP structural edge).", postedAt: "2026-07-15", source: "https://thehill.com/opinion/campaign/5558908-democrats-might-be-doomed-to-a-2026-disappointment/" },
    { authorKey: "seanTrende", author: "Sean Trende", handle: "@SeanTrende", text: "The RCP Average generic ballot has gone from D+8 to D+5 over the past six weeks. Probably just inevitable 'soft Rs coming home,' but this starts to get into territory where it is conceivable Rs hold the House.", postedAt: "2026-07-15", source: "https://x.com/SeanTrende/status/2077395313145303269" },
    { authorKey: "elliottMorris", author: "G. Elliott Morris", handle: "@gelliottmorris", text: "Democrats lead by 26 points among 'double haters' in the 2026 House midterms vote per Strength In Numbers/Verasight — the Dem edge looks built on anti-incumbent independents, not party love.", postedAt: "2026-07-14", source: "https://www.gelliottmorris.com/p/2026-07-14-double-haters-2026" },
    { authorKey: "wasserman", author: "Dave Wasserman", handle: "@Redistrict", text: "NEW @CookPolitical House rating changes: 18 races move in Dems' direction, including four key races from Lean R to Toss Up.", postedAt: "2026-07-16", source: "https://x.com/Redistrict/status/2011848637286842653" },
    { authorKey: "lakshyaJain", author: "Lakshya Jain", handle: "@JainLakshya", text: "Moved GOP Senate odds to 61% — can't call this a tossup any longer. Dems would likely need to flip at least two of TX/OH/IA/FL to take the Senate; an extraordinarily difficult, uphill challenge.", postedAt: "2026-07-05", source: "https://www.270towin.com/2026-senate-election/split-ticket-2026-senate-ratings" },
    { authorKey: "charlieCook", author: "Charlie Cook", handle: "@CookPolitical", text: "The question isn't whether Republicans are going to have a bad night on Nov. 3. The question now is just how bad it will be.", postedAt: "2026-06-20", source: "https://www.charliecookpolitics.com/p/for-republicans-is-it-about-the-environment" },
    { authorKey: "rakich", author: "Nathaniel Rakich", handle: "@baseballot", text: "New congressional maps haven't boosted Republicans' overall midterm chances, but they will make a lot more individual races less competitive.", postedAt: "2026-07-10", source: "https://baseballot.substack.com/" }
  ];

  for (const t of TWEETS) {
    await writeDocument(`${ELECTION_PATH}/tweets/seed_${t.authorKey}`, { ...t, fetchedAt: new Date().toISOString() });
    console.log(`Wrote tweets/seed_${t.authorKey}`);
  }
}

main().catch((e) => {
  console.error("seed-initial-data failed:", e);
  process.exit(1);
});
