// ============ FIREBASE CONFIG (shared "personal-apps" project, same as hindi-app/life-info) ============
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD0htBJPB0avTwHRuLt56JX4xbjBmqI37o",
  authDomain: "personal-apps-19a32.firebaseapp.com",
  projectId: "personal-apps-19a32",
  storageBucket: "personal-apps-19a32.firebasestorage.app",
  messagingSenderId: "187610351019",
  appId: "1:187610351019:web:1e22ba5f13b50cf324beee"
};

const ELECTION_ID = "us-midterms-2026";

// Key swing Senate races being tracked (per Cook/Sabato/Inside Elections, Jul 2026).
// Add/remove states here as race ratings shift.
const SWING_STATES = [
  { code: "GA", name: "Georgia", note: "Ossoff (D-inc) vs. Mike Collins (R)" },
  { code: "ME", name: "Maine", note: "Susan Collins (R-inc) vs. Graham Platner (D)" },
  { code: "NC", name: "North Carolina", note: "Open (Tillis retiring): Roy Cooper (D) vs. Michael Whatley (R)" },
  { code: "OH", name: "Ohio", note: "Jon Husted (R-inc, appointed) vs. Sherrod Brown (D)" },
  { code: "AK", name: "Alaska", note: "Dan Sullivan (R-inc) vs. Mary Peltola (D)" },
  { code: "IA", name: "Iowa", note: "Open (Ernst retiring): Ashley Hinson (R) vs. Josh Turek (D)" },
  { code: "TX", name: "Texas", note: "Ken Paxton (R) vs. James Talarico (D)" },
  { code: "MI", name: "Michigan", note: "Open (Peters retiring): Mike Rogers (R) vs. TBD Dem nominee (primary Aug 4, 2026)" }
];

// Pollster panels
const POLL_BUCKETS = {
  silverTop7: {
    label: "Nate Silver's Top 7",
    color: "var(--series-violet)",
    pollsters: {
      nytSiena: "NYT/Siena",
      suffolk: "Suffolk University",
      atlasIntel: "AtlasIntel",
      surveyUSA: "SurveyUSA",
      youGov: "YouGov",
      marquette: "Marquette Law School",
      abcNews: "ABC News"
    }
  },
  rightLeaning: {
    label: "Right Leaning",
    color: "var(--rep)",
    pollsters: {
      fox: "Fox News",
      emerson: "Emerson College",
      trafalgar: "Trafalgar Group"
    }
  },
  leftLeaning: {
    label: "Left Leaning",
    color: "var(--dem)",
    pollsters: {
      dataForProgress: "Data for Progress",
      ppp: "PPP",
      morningConsult: "Morning Consult"
    }
  }
};

// Pundits tracked in the Top Tweeters feed
const PUNDITS = [
  { key: "nateSilver", name: "Nate Silver", handle: "@NateSilver538" },
  { key: "nateCohn", name: "Nate Cohn", handle: "@Nate_Cohn" },
  { key: "seanTrende", name: "Sean Trende", handle: "@SeanTrende" },
  { key: "elliottMorris", name: "G. Elliott Morris", handle: "@gelliottmorris" },
  { key: "wasserman", name: "Dave Wasserman", handle: "@Redistrict" },
  { key: "lakshyaJain", name: "Lakshya Jain", handle: "@JainLakshya" },
  { key: "charlieCook", name: "Charlie Cook", handle: "@CookPolitical" },
  { key: "rakich", name: "Nathaniel Rakich", handle: "@baseballot" }
];

// AI models tracked in the AI Odds feed
const AI_MODELS = [
  { key: "claude", label: "Claude", icon: "✦" },
  { key: "chatgpt", label: "ChatGPT", icon: "◉" },
  { key: "gemini", label: "Gemini", icon: "✵" },
  { key: "grok", label: "Grok", icon: "✖" },
  { key: "qwen", label: "Qwen", icon: "◆" }
];
