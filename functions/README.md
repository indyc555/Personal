# QBR Planner — Firebase Cloud Functions

## Overview

The `inboundEmail` function receives emails forwarded by the **SendGrid Inbound Parse** webhook, matches them to a QBR by subject line, upserts the sender as a member, parses flight info from the email body, and uploads any attachments to Firebase Storage.

---

## One-time Setup

### 1. Firebase project initialisation

From the repo root (`/home/user/Personal`):

```bash
firebase login
firebase use --add          # pick your Firebase project
# If firebase.json doesn't exist yet:
firebase init functions     # choose "Use an existing project", JavaScript, no ESLint
```

Then replace the generated `functions/` directory contents with the files in this directory (or just keep these files and skip `firebase init functions` if `firebase.json` already exists and has a `functions` stanza).

### 2. Install dependencies

```bash
cd functions
npm install
```

### 3. Deploy

```bash
# From the repo root:
firebase deploy --only functions

# Or from the functions directory:
npm run deploy
```

After deploy the console will print the endpoint URL, which looks like:
```
https://<region>-<project-id>.cloudfunctions.net/inboundEmail
```

---

## SendGrid Inbound Parse Configuration

### A. Add MX records

SendGrid will give you an MX record to point a subdomain (e.g. `inbound.yourdomain.com`) at SendGrid's parse servers. Follow the steps in the SendGrid docs:
https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook#set-up-an-mx-record

Typical record:
| Type | Host                     | Value                   | Priority |
|------|--------------------------|-------------------------|----------|
| MX   | inbound.yourdomain.com   | mx.sendgrid.net         | 10       |

### B. Configure the Parse webhook in SendGrid

1. Log in to SendGrid → **Settings → Inbound Parse → Add Host & URL**
2. **Receiving Domain**: the subdomain you set up (e.g. `inbound.yourdomain.com`)
3. **Destination URL**: your Cloud Function URL  
   `https://<region>-<project-id>.cloudfunctions.net/inboundEmail`
4. Enable **POST the raw, full MIME message** — leave **Send Raw** unchecked  
   (the function expects `multipart/form-data`)
5. Save.

### C. Test

Send an email to any address at your inbound subdomain (e.g. `test@inbound.yourdomain.com`). The subject should contain the name of an existing QBR document. Check Cloud Function logs:

```bash
firebase functions:log
```

---

## How QBR Matching Works

The function reads all documents from the `qbrs` Firestore collection and checks whether the email's **Subject** line contains the QBR's `name` field (case-insensitive). If multiple QBRs match it picks the one with the longest name (most specific match).

**Tip**: make sure each QBR's `name` is distinctive enough that it won't accidentally appear in unrelated email subjects.

---

## Flight Parsing

The function looks for lines in the plain-text email body that contain keywords like:

- **Arrival**: `arriving`, `arrive`, `arrival`, `landing`, `flight in`, `lands`
- **Departure**: `departing`, `depart`, `departure`, `flying out`, `flight out`, `taking off`, `leaves`

From matching lines it extracts:
- A **date** (e.g. `July 31`, `7/31`, `7/31/2025`, `Aug 3rd`) → stored as `YYYY-MM-DD`
- A **time** (e.g. `12:11 PM`, `6:00 AM`, `14:30`) → stored as `HH:MM` (24-hour)
- A **3-letter airport code** (e.g. `PDX`, `LAX`)

The raw matched line is stored in `arrivalNotes` / `departureNotes`.

---

## Firebase Storage

Attachments are stored at:
```
qbrs/{qbrId}/members/{memberId}/attachments/{filename}
```

Make sure your Firebase Storage rules allow server-side writes from the Cloud Function (the Admin SDK bypasses client rules by default, so no rule change is needed for the function itself).

---

## Environment / Secrets

No additional environment variables are required. The function uses Application Default Credentials via `firebase-admin`, which are automatically available in the Cloud Functions runtime.

If you need to restrict who can post to the endpoint, you can add a shared secret header check and set it via:

```bash
firebase functions:config:set sendgrid.webhook_secret="your-secret"
```

Then read it in `index.js` with `functions.config().sendgrid.webhook_secret`.
