import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'health.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
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

    CREATE TABLE IF NOT EXISTS alcohol_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount_ml REAL NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      summary TEXT NOT NULL,
      confidence_level INTEGER,
      sources TEXT,
      record_ids TEXT
    );

    CREATE TABLE IF NOT EXISTS treatment_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vitamin_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS news_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT,
      source TEXT,
      date TEXT,
      summary TEXT,
      relevance_score INTEGER DEFAULT 5,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nct_id TEXT UNIQUE,
      title TEXT,
      phase TEXT,
      status TEXT,
      summary TEXT,
      eligibility TEXT,
      locations TEXT,
      contact_info TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      practice TEXT,
      address TEXT,
      phone TEXT,
      specialties TEXT,
      reputation_notes TEXT,
      lat REAL,
      lng REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patient_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );
  `);

  // Seed patient info
  const insertPatient = db.prepare(`
    INSERT OR IGNORE INTO patient_info (key, value) VALUES (?, ?)
  `);
  insertPatient.run('name', 'Ananya Sarkar');
  insertPatient.run('location', 'Houston, TX');
  insertPatient.run('condition', 'Alcoholic Liver Disease (ALD)');
  insertPatient.run('alcohol_since', '~2011');
  insertPatient.run('current_intake_ml', '300');

  // Seed today's alcohol log (2026-05-17)
  const existingLog = db.prepare('SELECT id FROM alcohol_log WHERE date = ?').get('2026-05-17');
  if (!existingLog) {
    db.prepare('INSERT INTO alcohol_log (date, amount_ml, notes) VALUES (?, ?, ?)').run(
      '2026-05-17', 300, 'Current daily intake as of 2026-05-17'
    );
  }

  // Seed Houston hepatologists
  const doctorCount = (db.prepare('SELECT COUNT(*) as count FROM doctors').get() as { count: number }).count;
  if (doctorCount === 0) {
    const insertDoctor = db.prepare(`
      INSERT INTO doctors (name, practice, address, phone, specialties, reputation_notes, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoctor.run(
      'Dr. Hashem El-Serag',
      'Baylor College of Medicine / Michael E. DeBakey VA',
      '2002 Holcombe Blvd, Houston, TX 77030',
      '(713) 798-0950',
      'Hepatology, Liver Disease, Cirrhosis, ALD',
      'World-renowned hepatologist, former chief of gastroenterology at BCM, extensive ALD research',
      29.7022, -95.4437
    );

    insertDoctor.run(
      'Dr. John Vierling',
      'Baylor St. Luke\'s Medical Center - Liver Center',
      '6720 Bertner Ave, Houston, TX 77030',
      '(713) 798-8780',
      'Hepatology, Liver Transplant, ALD, Cirrhosis, Autoimmune Liver Disease',
      'Director of Hepatology and Liver Transplantation at BCM, leading transplant hepatologist',
      29.7098, -95.4006
    );

    insertDoctor.run(
      'Dr. Fasiha Kanwal',
      'Baylor College of Medicine',
      '7200 Cambridge St, Houston, TX 77030',
      '(713) 798-0950',
      'Hepatology, Liver Fibrosis, MASLD, ALD, Quality of Care',
      'Chief of Gastroenterology/Hepatology at BCM, extensive liver disease research',
      29.7094, -95.3983
    );

    insertDoctor.run(
      'Dr. Howard Monsour Jr.',
      'Houston Methodist Hospital',
      '6565 Fannin St, Houston, TX 77030',
      '(713) 441-6200',
      'Hepatology, Liver Transplant, ALD, Viral Hepatitis',
      'Chief of Hepatology at Houston Methodist, experienced in ALD management',
      29.7100, -95.4023
    );

    insertDoctor.run(
      'Dr. Nihal Younes',
      'UTHealth Houston - UT Physicians',
      '6410 Fannin St, Houston, TX 77030',
      '(713) 486-5000',
      'Hepatology, ALD, Cirrhosis, Liver Biopsy',
      'UTHealth hepatologist specializing in ALD and advanced liver disease',
      29.7079, -95.4018
    );

    insertDoctor.run(
      'MD Anderson Cancer Center - Liver Team',
      'UT MD Anderson Cancer Center',
      '1515 Holcombe Blvd, Houston, TX 77030',
      '(713) 792-2121',
      'Hepatocellular Carcinoma, ALD-related liver cancer, Liver Tumors',
      'World-class cancer center; essential for ALD patients at HCC risk',
      29.7059, -95.3989
    );

    insertDoctor.run(
      'Dr. Pierre Gholam (Memorial Hermann referral)',
      'Memorial Hermann - Texas Medical Center',
      '6411 Fannin St, Houston, TX 77030',
      '(713) 704-4000',
      'Hepatology, ALD, Non-Alcoholic Fatty Liver Disease, Liver Transplant Evaluation',
      'Memorial Hermann liver program, comprehensive ALD care including transplant evaluation',
      29.7074, -95.4026
    );
  }
}

export default getDb;
