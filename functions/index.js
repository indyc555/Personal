"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Busboy = require("busboy");
const { parse: parseDate, isValid, format } = require("date-fns");

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a "From" header value such as:
 *   "Indy Chakrabarti <indy@example.com>"
 *   "indy@example.com"
 * Returns { name, email }.
 */
function parseFrom(fromHeader) {
  if (!fromHeader) return { name: "", email: "" };
  const match = fromHeader.match(/^(.+?)\s*<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim().toLowerCase() };
  }
  const email = fromHeader.trim().toLowerCase();
  const name = email.split("@")[0];
  return { name, email };
}

/**
 * Normalise a date string extracted from email text to YYYY-MM-DD.
 * Accepts: "July 31", "7/31", "7/31/2025", "Aug 3", "August 3rd", etc.
 * Falls back to the raw string if parsing fails.
 */
function normaliseDate(raw) {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/(\d+)(st|nd|rd|th)/gi, "$1");
  const year = new Date().getFullYear();

  const formats = [
    "MM/dd/yyyy",
    "M/d/yyyy",
    "MM/dd",
    "M/d",
    "MMMM d yyyy",
    "MMMM d",
    "MMM d yyyy",
    "MMM d",
  ];

  for (const fmt of formats) {
    // date-fns needs a reference date for formats without year
    const ref = new Date(`${year}-01-01`);
    const parsed = parseDate(cleaned, fmt, ref);
    if (isValid(parsed)) {
      // If no year in format string, the year defaults to ref year — keep it
      return format(parsed, "yyyy-MM-dd");
    }
  }
  return raw; // return raw if we couldn't parse
}

/**
 * Normalise a time string to HH:MM 24-hour format.
 * Accepts: "12:11 PM", "6:00 AM", "14:30", "6pm", etc.
 */
function normaliseTime(raw) {
  if (!raw) return "";
  const cleaned = raw.trim();

  // Try HH:MM AM/PM
  const withAmPm = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (withAmPm) {
    let hours = parseInt(withAmPm[1], 10);
    const minutes = withAmPm[2];
    const meridiem = withAmPm[3].toUpperCase();
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // Try HH:MM (24-hour)
  const plain = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (plain) {
    return `${String(parseInt(plain[1], 10)).padStart(2, "0")}:${plain[2]}`;
  }

  // Try bare "6pm" / "14"
  const bare = cleaned.match(/^(\d{1,2})(AM|PM)?$/i);
  if (bare) {
    let hours = parseInt(bare[1], 10);
    const meridiem = (bare[2] || "").toUpperCase();
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:00`;
  }

  return raw;
}

// Token patterns reused across regex builders
const DATE_PAT =
  "(?:" +
  [
    // Month name variants: July 31st, Aug 3
    "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+\\d{1,2}(?:st|nd|rd|th)?(?:\\s+\\d{4})?",
    // Numeric: 7/31, 7/31/2025
    "\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?",
  ].join("|") +
  ")";

const TIME_PAT =
  "(?:\\d{1,2}:\\d{2}\\s*(?:AM|PM)|\\d{1,2}\\s*(?:AM|PM)|\\d{1,2}:\\d{2})";
const AIRPORT_PAT = "[A-Z]{3}";

/**
 * Build a regex that matches a flight-related keyword followed by
 * an optional date, optional time, optional airport code — in any
 * reasonable order across the same line segment.
 *
 * Returns { date, time, airport } strings (raw) or null if no match.
 */
function extractFlight(text, keywords) {
  const keywordPat = keywords.map((k) => k.replace(/\s+/g, "\\s+")).join("|");

  // We scan each line for the keyword, then try to pull date/time/airport
  // from the rest of that line (and the next line for overflow).
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kwRe = new RegExp(`(?:${keywordPat})`, "i");
    if (!kwRe.test(line)) continue;

    // Grab the matched line plus the next line for context
    const context = `${line} ${lines[i + 1] || ""}`;

    const dateMatch = context.match(new RegExp(DATE_PAT, "i"));
    const timeMatch = context.match(new RegExp(TIME_PAT, "i"));
    const airportMatch = context.match(new RegExp(AIRPORT_PAT));

    if (dateMatch || timeMatch || airportMatch) {
      return {
        rawLine: line.trim(),
        date: dateMatch ? dateMatch[0] : "",
        time: timeMatch ? timeMatch[0] : "",
        airport: airportMatch ? airportMatch[0] : "",
      };
    }
  }
  return null;
}

/**
 * Parse flight info from plain-text email body.
 * Returns { arrival: {...}, departure: {...} } — values may be empty strings.
 */
function parseFlightInfo(text) {
  if (!text) {
    return { arrival: null, departure: null };
  }

  const arrivalKeywords = [
    "arriving",
    "arrive",
    "arrival",
    "landing",
    "flight in",
    "lands",
  ];
  const departureKeywords = [
    "departing",
    "depart",
    "departure",
    "flying out",
    "flight out",
    "taking off",
    "leaves",
  ];

  const arrRaw = extractFlight(text, arrivalKeywords);
  const depRaw = extractFlight(text, departureKeywords);

  const arrival = arrRaw
    ? {
        arrivalDate: normaliseDate(arrRaw.date),
        arrivalTime: normaliseTime(arrRaw.time),
        arrivalAirport: arrRaw.airport,
        arrivalNotes: arrRaw.rawLine,
      }
    : null;

  const departure = depRaw
    ? {
        departureDate: normaliseDate(depRaw.date),
        departureTime: normaliseTime(depRaw.time),
        departureAirport: depRaw.airport,
        departureNotes: depRaw.rawLine,
      }
    : null;

  return { arrival, departure };
}

// ---------------------------------------------------------------------------
// Multipart parser — returns a Promise that resolves to { fields, files }
// files: [{ fieldname, filename, mimetype, buffer }]
// ---------------------------------------------------------------------------
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers });
    const fields = {};
    const files = [];

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("file", (fieldname, stream, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        files.push({
          fieldname,
          filename,
          mimetype: mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    bb.on("finish", () => resolve({ fields, files }));
    bb.on("error", reject);

    // Firebase Functions v2 / v1 both expose rawBody on the request when
    // the body has already been consumed by the runtime. Fall back to piping.
    if (req.rawBody) {
      bb.write(req.rawBody);
      bb.end();
    } else {
      req.pipe(bb);
    }
  });
}

// ---------------------------------------------------------------------------
// QBR matching
// ---------------------------------------------------------------------------
async function findMatchingQbr(subject) {
  if (!subject) return null;
  const subjectLower = subject.toLowerCase();

  const snapshot = await db.collection("qbrs").get();
  let best = null;

  for (const doc of snapshot.docs) {
    const name = (doc.data().name || "").toLowerCase();
    if (name && subjectLower.includes(name)) {
      // Pick the longest-matching name (most specific)
      if (!best || name.length > (best.data().name || "").length) {
        best = doc;
      }
    }
  }

  return best || null;
}

// ---------------------------------------------------------------------------
// Member upsert
// ---------------------------------------------------------------------------
async function upsertMember(qbrRef, senderEmail, senderName) {
  const membersRef = qbrRef.collection("members");
  const existing = await membersRef.where("email", "==", senderEmail).limit(1).get();

  if (!existing.empty) {
    return existing.docs[0];
  }

  // Count existing members for order
  const countSnap = await membersRef.count().get();
  const order = countSnap.data().count;

  const newDocRef = membersRef.doc(); // auto-ID
  const memberData = {
    id: newDocRef.id,
    name: senderName || senderEmail.split("@")[0],
    email: senderEmail,
    rsvp: "maybe",
    order,
    arrivalAirport: "",
    arrivalDate: "",
    arrivalTime: "",
    arrivalNotes: "",
    departureAirport: "",
    departureDate: "",
    departureTime: "",
    departureNotes: "",
    comments: "",
    attachments: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await newDocRef.set(memberData);
  // Return a mock doc-like object consistent with QueryDocumentSnapshot
  return { id: newDocRef.id, ref: newDocRef, data: () => memberData };
}

// ---------------------------------------------------------------------------
// Attachment upload
// ---------------------------------------------------------------------------
async function uploadAttachments(qbrId, memberId, files, attachmentInfo) {
  if (!files || files.length === 0) return [];

  // attachment-info is a JSON string keyed by attachment1, attachment2…
  let infoMap = {};
  try {
    infoMap = attachmentInfo ? JSON.parse(attachmentInfo) : {};
  } catch (_) {
    // ignore parse errors
  }

  const bucket = storage.bucket();
  const uploaded = [];

  for (const file of files) {
    const filename = file.filename || file.fieldname;
    const storagePath = `qbrs/${qbrId}/members/${memberId}/attachments/${filename}`;
    const fileRef = bucket.file(storagePath);

    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype || "application/octet-stream",
      },
    });

    uploaded.push({
      name: filename,
      path: storagePath,
      contentType: file.mimetype || "application/octet-stream",
    });

    functions.logger.info(`Uploaded attachment: ${storagePath}`);
  }

  return uploaded;
}

// ---------------------------------------------------------------------------
// Cloud Function — inboundEmail
// ---------------------------------------------------------------------------
exports.inboundEmail = functions.https.onRequest(async (req, res) => {
  // SendGrid expects 200; always respond 200 to prevent retries
  if (req.method !== "POST") {
    res.status(200).send("ok");
    return;
  }

  try {
    // 1. Parse multipart body
    const { fields, files } = await parseMultipart(req);

    const fromHeader = fields["from"] || "";
    const subject = fields["subject"] || "";
    const bodyText = fields["text"] || "";
    const attachmentInfoRaw = fields["attachment-info"] || "";

    functions.logger.info("inboundEmail received", {
      from: fromHeader,
      subject,
      attachmentCount: files.length,
    });

    // 2. Parse sender
    const { name: senderName, email: senderEmail } = parseFrom(fromHeader);

    if (!senderEmail) {
      functions.logger.warn("Could not parse sender email — ignoring");
      res.status(200).send("ok");
      return;
    }

    // 3. Match QBR by subject
    const qbrDoc = await findMatchingQbr(subject);
    if (!qbrDoc) {
      functions.logger.info(`No QBR matched subject: "${subject}" — ignoring`);
      res.status(200).send("ok");
      return;
    }

    const qbrId = qbrDoc.id;
    const qbrRef = db.collection("qbrs").doc(qbrId);
    functions.logger.info(`Matched QBR: ${qbrId} (${qbrDoc.data().name})`);

    // 4. Upsert member
    const memberDoc = await upsertMember(qbrRef, senderEmail, senderName);
    const memberId = memberDoc.id;
    const memberRef = memberDoc.ref || qbrRef.collection("members").doc(memberId);

    // 5. Parse flight info
    const { arrival, departure } = parseFlightInfo(bodyText);
    const flightUpdate = {};

    if (arrival) {
      if (arrival.arrivalDate) flightUpdate.arrivalDate = arrival.arrivalDate;
      if (arrival.arrivalTime) flightUpdate.arrivalTime = arrival.arrivalTime;
      if (arrival.arrivalAirport) flightUpdate.arrivalAirport = arrival.arrivalAirport;
      if (arrival.arrivalNotes) flightUpdate.arrivalNotes = arrival.arrivalNotes;
      functions.logger.info("Parsed arrival", arrival);
    }

    if (departure) {
      if (departure.departureDate) flightUpdate.departureDate = departure.departureDate;
      if (departure.departureTime) flightUpdate.departureTime = departure.departureTime;
      if (departure.departureAirport) flightUpdate.departureAirport = departure.departureAirport;
      if (departure.departureNotes) flightUpdate.departureNotes = departure.departureNotes;
      functions.logger.info("Parsed departure", departure);
    }

    // 6. Upload attachments
    // Only consider files from attachment1, attachment2… fields
    const attachmentFiles = files.filter((f) => /^attachment\d+$/.test(f.fieldname));
    const uploadedAttachments = await uploadAttachments(
      qbrId,
      memberId,
      attachmentFiles,
      attachmentInfoRaw
    );

    // 7. Write updates to Firestore
    const update = {
      ...flightUpdate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (uploadedAttachments.length > 0) {
      update.attachments = admin.firestore.FieldValue.arrayUnion(...uploadedAttachments);
    }

    if (Object.keys(update).length > 1) {
      // >1 because updatedAt is always present
      await memberRef.update(update);
      functions.logger.info(`Updated member ${memberId} in QBR ${qbrId}`, update);
    } else {
      functions.logger.info(
        `No flight info or attachments to update for member ${memberId}`
      );
    }

    res.status(200).send("ok");
  } catch (err) {
    // Log but still return 200 so SendGrid doesn't retry
    functions.logger.error("inboundEmail error", err);
    res.status(200).send("ok");
  }
});
