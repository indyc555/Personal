// Minimal Firestore REST client — no service account needed because this project's
// Firestore rules are open (`allow read, write: if true`), same as the other apps
// in this repo (hindi-app, life-info). Good enough for a personal dashboard; do not
// reuse this pattern for anything that needs real access control.

const PROJECT_ID = "personal-apps-19a32";
const API_KEY = "AIzaSyD0htBJPB0avTwHRuLt56JX4xbjBmqI37o";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "number") return { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === "object") return { mapValue: { fields: toFirestoreFields(v) } };
  return { stringValue: String(v) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, val] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(val);
  }
  return fields;
}

/**
 * Fully replace a document at the given path (e.g. "elections/us-midterms-2026/prediction_markets/2026-07-31").
 * Full replace is intentional: callers pass the complete document each time, using
 * null for any field that's pending, so there is no partial-write drift to reason about.
 */
export async function writeDocument(path, data) {
  const url = `${BASE}/${path}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFirestoreFields(data) })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore write failed (${res.status}): ${body}`);
  }
  return res.json();
}

export const ELECTION_PATH = "elections/us-midterms-2026";
