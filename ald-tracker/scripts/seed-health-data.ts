/**
 * Seed script: loads Ananya Sarkar's historical health data from image.
 * Run: npx tsx scripts/seed-health-data.ts
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'health.db'));
db.pragma('journal_mode = WAL');

// Ensure tables exist (mirrors db.ts)
db.exec(`
  CREATE TABLE IF NOT EXISTS health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    test_name TEXT NOT NULL,
    value REAL,
    value_text TEXT,
    unit TEXT NOT NULL,
    reference_range TEXT,
    notes TEXT,
    is_abnormal INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patient_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alcohol_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount_ml REAL NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Try adding value_text column if it doesn't exist (migration)
try {
  db.exec(`ALTER TABLE health_records ADD COLUMN value_text TEXT`);
  db.exec(`ALTER TABLE health_records ADD COLUMN is_abnormal INTEGER DEFAULT 0`);
} catch {
  // columns already exist, fine
}

const insertRecord = db.prepare(`
  INSERT OR IGNORE INTO health_records
    (date, test_name, value, value_text, unit, reference_range, notes, is_abnormal)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Check if already seeded
const existing = (db.prepare('SELECT COUNT(*) as cnt FROM health_records').get() as { cnt: number }).cnt;
if (existing > 0) {
  console.log(`Database already has ${existing} records. Run with --force to re-seed.`);
  if (!process.argv.includes('--force')) process.exit(0);
  db.exec('DELETE FROM health_records');
  console.log('Cleared existing records for re-seed.');
}

// ─── PATIENT INFO ─────────────────────────────────────────────────────────────
const upsertInfo = db.prepare(`INSERT OR REPLACE INTO patient_info (key, value) VALUES (?, ?)`);
upsertInfo.run('name', 'Ananya Sarkar');
upsertInfo.run('age', '50');
upsertInfo.run('sex', 'Female');
upsertInfo.run('location', 'Houston, TX');
upsertInfo.run('condition', 'Alcoholic Liver Disease (ALD)');
upsertInfo.run('alcohol_since', '~2011');
upsertInfo.run('medications', 'None');
upsertInfo.run('other_conditions', 'No cancer, no diabetes. Normal otherwise except ALD.');
upsertInfo.run('fibroscan', 'Appears to be Fibroscan Level 2 or 3 (uncertain)');
upsertInfo.run('mri_9_2025', 'Hepatic steatosis, cholelithiasis. Normal stomach/bowel/pancreas/spleen/adrenals/lymph nodes/vessels/kidney. Gallbladder has small stones. No musculoskeletal lesions.');
upsertInfo.run('ald_history', 'Alcoholic since ~2011. Severe physical collapse 2018, went to rehab, quit for a period, restarted. Was drinking 4 glasses wine/day for years. In 2026 reduced to ~2 glasses/day (~300 mL alcohol/day).');
upsertInfo.run('current_intake_ml', '300');

// ─── ALCOHOL LOG ──────────────────────────────────────────────────────────────
const existingAlcohol = db.prepare('SELECT id FROM alcohol_log WHERE date = ?').get('2026-05-17');
if (!existingAlcohol) {
  db.prepare('INSERT INTO alcohol_log (date, amount_ml, notes) VALUES (?, ?, ?)').run(
    '2026-05-17', 300, 'Current daily intake — reduced from ~4 glasses wine/day to ~2 glasses/day in 2026'
  );
}

// ─── HISTORICAL LAB RECORDS ───────────────────────────────────────────────────
// Format: [date, test_name, value, value_text, unit, reference_range, notes, is_abnormal]

const records: [string, string, number | null, string | null, string, string, string, number][] = [

  // ── 12/18/2018 ──────────────────────────────────────────────────────────────
  ['2018-12-18', 'AST', 190, null, 'IU/L', '5–34', '#2 ALD indicator after GGT. Severely elevated — indicative of acute alcoholic hepatitis.', 1],
  ['2018-12-18', 'ALT', 40, null, 'IU/L', '0–55', '#3 indicator; liver-specific. Within normal range despite severe ALD.', 0],
  ['2018-12-18', 'Total Bilirubin', 0.5, null, 'mg/dL', '0.2–1.2', 'Best measure of bilirubin. Normal.', 0],
  ['2018-12-18', 'AST/ALT Ratio', 4.3, null, 'ratio', '<2', '>2 with high GGT strongly indicates ALD. 4.3 is severely elevated — consistent with active alcoholic hepatitis at time of collapse.', 1],

  // ── 10/22/2022 ──────────────────────────────────────────────────────────────
  ['2022-10-22', 'AST', 71, null, 'IU/L', '5–34', 'Elevated; improved from 2018 but still ~2x upper normal. Ongoing liver inflammation.', 1],
  ['2022-10-22', 'ALT', 39, null, 'IU/L', '0–55', 'Within normal range.', 0],
  ['2022-10-22', 'ALK Phos (ALP)', 80, null, 'Unit/L', '40–150', 'Normal. High ALP + high GGT would indicate Stage 4 Cirrhosis.', 0],
  ['2022-10-22', 'Albumin', 4.4, null, 'g/dL', '3.4–5.1', 'Normal. Low albumin indicates poor liver synthetic function.', 0],
  ['2022-10-22', 'Total Bilirubin', 0.2, null, 'mg/dL', '0.2–1.2', 'Normal.', 0],
  ['2022-10-22', 'Indirect Bilirubin', 0.3, null, 'mg/dL', '0–1.2', 'Measure of bile health. Normal.', 0],
  ['2022-10-22', 'GGT Enzyme', 233, null, 'IU/L', '8–40 (female)', '#1 ALD indicator. Severely elevated — 84+ indicates heavy drinking. Liver damage leaking enzyme into blood.', 1],
  ['2022-10-22', 'AST/ALT Ratio', 1.8, null, 'ratio', '<2', 'Borderline. Just below the >2 threshold that strongly indicates ALD.', 1],

  // ── 4/26/2023 ────────────────────────────────────────────────────────────────
  ['2023-04-26', 'AST', 77, null, 'IU/L', '5–34', 'Elevated — continued liver inflammation.', 1],
  ['2023-04-26', 'ALT', 23, null, 'IU/L', '0–55', 'Normal.', 0],
  ['2023-04-26', 'ALK Phos (ALP)', 71, null, 'Unit/L', '40–150', 'Normal.', 0],
  ['2023-04-26', 'Albumin', 4.6, null, 'g/dL', '3.4–5.1', 'Normal. Good synthetic function.', 0],
  ['2023-04-26', 'Total Bilirubin', 0.3, null, 'mg/dL', '0.2–1.2', 'Normal.', 0],
  ['2023-04-26', 'GGT Enzyme', 321, null, 'IU/L', '8–40 (female)', '#1 ALD indicator. Severely elevated — highest recorded value. 8x upper normal.', 1],
  ['2023-04-26', 'AST/ALT Ratio', 2.0, null, 'ratio', '<2', '>2 confirms ALD pattern. Combined with high GGT, strongly indicative of ongoing alcoholic liver damage.', 1],
  ['2023-04-26', 'BUN', 6.9, null, 'mg/dL', '7–25', 'Slightly low (Blood Urea Nitrogen). Low BUN with impaired liver = poor protein synthesis or dilution. BUN Ratio also 9.7 (borderline).', 1],
  ['2023-04-26', 'Glucose', 91, null, 'mg/dL', '70–99', 'Normal.', 0],
  ['2023-04-26', 'Creatinine', 0.71, null, 'mg/dL', '0.57–1.11', 'Normal kidney function.', 0],
  ['2023-04-26', 'Total Protein', 8.3, null, 'g/dL', '6.1–8.2', 'Slightly elevated. Can indicate inflammation or dehydration.', 1],
  ['2023-04-26', 'BUN/Creatinine Ratio', 9.7, null, 'ratio', '<10', 'Low ratio with impaired liver can indicate poor protein metabolism.', 0],

  // ── 8/7/2024 ─────────────────────────────────────────────────────────────────
  ['2024-08-07', 'AST', 68, null, 'IU/L', '5–34', 'Elevated but lower than 4/2023. Modest improvement.', 1],
  ['2024-08-07', 'ALT', 31, null, 'IU/L', '0–55', 'Normal.', 0],
  ['2024-08-07', 'ALK Phos (ALP)', 83, null, 'Unit/L', '40–150', 'Normal.', 0],
  ['2024-08-07', 'Albumin', 4.7, null, 'g/dL', '3.4–5.1', 'Normal and improved. Good synthetic function.', 0],
  ['2024-08-07', 'Total Bilirubin', 0.5, null, 'mg/dL', '0.2–1.2', 'Normal.', 0],
  ['2024-08-07', 'AST/ALT Ratio', 3.0, null, 'ratio', '<2', 'Remains elevated >2, consistent with continued ALD pattern.', 1],
  ['2024-08-07', 'Glucose', 90, null, 'mg/dL', '70–99', 'Normal.', 0],
  ['2024-08-07', 'Total Protein', 8.5, null, 'g/dL', '6.1–8.2', 'Mildly elevated. Monitor.', 1],
  ['2024-08-07', 'eGFR', null, '>60', 'mL/min/1.73m²', '>60', 'Normal kidney filtration rate.', 0],

  // ── 9/11/2025 ─────────────────────────────────────────────────────────────────
  ['2025-09-11', 'Apolipoprotein A1', 219, null, 'mg/dL', '101–198', 'Elevated. ApoA1 is the main HDL cholesterol protein. Elevated in context of ALD may reflect dyslipidemia or alcohol-induced HDL elevation.', 1],
  ['2025-09-11', 'AST', 86, null, 'IU/L', '5–34', 'Elevated — increased from 8/2024. Concerning trend upward despite reported drinking reduction.', 1],
  ['2025-09-11', 'ALT', 12, null, 'IU/L', '0–55', 'Normal and low. Low ALT with high AST = high AST/ALT ratio, ALD pattern.', 0],
  ['2025-09-11', 'ALK Phos (ALP)', 77, null, 'Unit/L', '40–150', 'Normal.', 0],
  ['2025-09-11', 'Albumin', 4.7, null, 'g/dL', '3.4–5.1', 'Normal. Liver synthetic function preserved.', 0],
  ['2025-09-11', 'Alpha-2-Macroglobulin', 262, null, 'mg/dL', '106–279', 'Upper-normal range. Elevated A2M can indicate liver fibrosis/scarring. Borderline but concerning in ALD context.', 1],
  ['2025-09-11', 'Haptoglobin', 92, null, 'mg/dL', '43–212', 'Normal. Haptoglobin is an inflammation marker; normal is reassuring.', 0],
  ['2025-09-11', 'Total Bilirubin', 0.3, null, 'mg/dL', '0.2–1.2', 'Normal.', 0],
  ['2025-09-11', 'GGT Enzyme', 63, null, 'IU/L', '8–40 (female)', 'Still elevated (>1.5x upper normal) but dramatically improved from 321 in 4/2023. Drinking reduction may be contributing.', 1],
  ['2025-09-11', 'Platelets', 235, null, '×10³/μL', '150–400', 'Normal. Low platelets would indicate portal hypertension/splenomegaly in cirrhosis.', 0],
  ['2025-09-11', 'AST/ALT Ratio', 3.0, null, 'ratio', '<2', 'Elevated >2 — ALD pattern persists. AST rising while ALT low widens ratio.', 1],
  ['2025-09-11', 'Glucose', 90, null, 'mg/dL', '70–99', 'Normal.', 0],
  ['2025-09-11', 'Creatinine', 0.54, null, 'mg/dL', '0.57–1.11', 'Slightly below reference. Low creatinine in ALD can reflect reduced muscle mass (sarcopenia). Monitor.', 1],
  ['2025-09-11', 'eGFR', 112, null, 'mL/min/1.73m²', '>60', 'Normal kidney filtration. No hepatorenal syndrome.', 0],

  // ── 9/2025 — MRI/Imaging (stored as imaging record) ────────────────────────
  ['2025-09-01', 'MRI Abdomen', null, 'Abnormal', 'imaging', 'N/A',
   'Hepatic steatosis (fatty liver), cholelithiasis (gallstones). Gallbladder has small stones. Normal: stomach, bowel, pancreas, spleen, adrenals, lymph nodes, vessels, kidney. No musculoskeletal lesions.', 1],
];

const insertMany = db.transaction((rows: typeof records) => {
  for (const r of rows) {
    insertRecord.run(...r);
  }
});

insertMany(records);

console.log(`✓ Seeded ${records.length} health records`);
console.log(`✓ Patient info updated for Ananya Sarkar`);
console.log(`✓ Alcohol log entry for 2026-05-17: 300 mL`);
console.log(`\nDatabase ready at: data/health.db`);
