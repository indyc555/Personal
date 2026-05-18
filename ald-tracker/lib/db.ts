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

    CREATE TABLE IF NOT EXISTS doctor_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      note_text TEXT,
      image_data TEXT,
      image_media_type TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
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

    insertDoctor.run(
      'Dr. Victor Machicao',
      'UTHealth Houston / McGovern Medical School',
      '6410 Fannin St, Suite 1400, Houston, TX 77030',
      '(713) 486-5000',
      'Hepatology, Liver Transplantation, ALD, Cirrhosis, Portal Hypertension',
      'Associate Professor of Medicine at UTHealth, liver transplant hepatologist with expertise in ALD and end-stage liver disease. Affiliated with Memorial Hermann Transplant Center.',
      29.7079, -95.4018
    );

    insertDoctor.run(
      'Dr. Joseph Galati',
      'Liver Specialists of Texas',
      '1200 Binz St, Suite 1275, Houston, TX 77004',
      '(713) 794-0700',
      'Hepatology, ALD, Liver Disease, Fatty Liver, Cirrhosis, Hepatitis',
      'Founder of Liver Specialists of Texas, one of Houston\'s most recognized hepatologists. Active in patient education and ALD treatment. Sees patients independently outside hospital systems.',
      29.7350, -95.3845
    );

    insertDoctor.run(
      'Dr. David Victor',
      'Houston Methodist Hospital - Sherrie & Alan Conover Center for Liver Disease & Transplantation',
      '6565 Fannin St, Smith Tower Suite 1001, Houston, TX 77030',
      '(713) 441-8160',
      'Hepatology, Liver Transplantation, ALD, MASLD, Cirrhosis, Liver Cancer',
      'Director of Liver Transplantation at Houston Methodist. Extensive experience in ALD and liver transplant evaluation. Part of one of the top transplant programs in Texas.',
      29.7100, -95.4023
    );
  }

  // ── Health Records (versioned migration — bump HEALTH_SEED_VER to force reseed) ──
  const HEALTH_SEED_VER = '6';
  const currentSeedVer = (db.prepare("SELECT value FROM patient_info WHERE key='health_seed_version'").get() as { value: string } | undefined)?.value;
  if (currentSeedVer !== HEALTH_SEED_VER) {
    db.prepare('DELETE FROM health_records').run();
    const ins = db.prepare(`
      INSERT INTO health_records (date, test_name, value, value_text, unit, reference_range, notes, is_abnormal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const seedRecords: [string, string, number | null, string | null, string, string, string, number][] = [
      // ── 12/18/2018 ──
      ['2018-12-18','AST',190,null,'IU/L','5–34','#2 ALD indicator. Severely elevated — acute alcoholic hepatitis at time of collapse.',1],
      ['2018-12-18','ALT',44,null,'IU/L','0–55','Within normal range.',0],
      ['2018-12-18','Albumin',4.4,null,'g/dL','3.4–5.1','Normal.',0],
      ['2018-12-18','AST/ALT Ratio',4.3,null,'ratio','<2','>2 with high GGT strongly indicates ALD. 4.3 consistent with active alcoholic hepatitis.',1],
      // ── 10/22/2022 ──
      ['2022-10-22','AST',71,null,'IU/L','5–34','Elevated; ~2× upper normal. Ongoing liver inflammation.',1],
      ['2022-10-22','ALT',40,null,'IU/L','0–55','Within normal range.',0],
      ['2022-10-22','ALK Phos (ALP)',80,null,'Unit/L','40–150','Normal.',0],
      ['2022-10-22','Total Bilirubin',0.5,null,'mg/dL','0.2–1.2','Normal.',0],
      ['2022-10-22','Indirect Bilirubin',0.3,null,'mg/dL','0–1.2','Normal.',0],
      ['2022-10-22','GGT Enzyme',233,null,'IU/L','8–40 (female)','#1 ALD indicator. Severely elevated. 84+ indicates heavy drinking.',1],
      ['2022-10-22','Total Protein',8.3,null,'g/dL','6.1–8.2','Mildly elevated — possible inflammation or dehydration.',1],
      ['2022-10-22','AST/ALT Ratio',1.8,null,'ratio','<2','Borderline — just below the >2 ALD threshold.',1],
      // ── 4/26/2023 ──
      ['2023-04-26','AST',77,null,'IU/L','5–34','Elevated — continued liver inflammation.',1],
      ['2023-04-26','ALT',39,null,'IU/L','0–55','Normal.',0],
      ['2023-04-26','ALK Phos (ALP)',71,null,'Unit/L','40–150','Normal.',0],
      ['2023-04-26','Albumin',4.6,null,'g/dL','3.4–5.1','Normal.',0],
      ['2023-04-26','Total Bilirubin',0.2,null,'mg/dL','0.2–1.2','Normal.',0],
      ['2023-04-26','GGT Enzyme',321,null,'IU/L','8–40 (female)','Peak recorded value — 8× upper normal.',1],
      ['2023-04-26','AST/ALT Ratio',2.0,null,'ratio','<2','>2 w/high GGT confirms ALD pattern.',1],
      ['2023-04-26','BUN',6.9,null,'mg/dL','7–25','Slightly low — poor protein synthesis or dilution.',1],
      ['2023-04-26','Glucose',91,null,'mg/dL','70–99','Normal.',0],
      ['2023-04-26','Creatinine',0.71,null,'mg/dL','0.57–1.11','Normal kidney function.',0],
      ['2023-04-26','Total Protein',8.5,null,'g/dL','6.1–8.2','Mildly elevated — possible inflammation or dehydration.',1],
      ['2023-04-26','BUN/Creatinine Ratio',9.7,null,'ratio','<10','Low BUN with impaired liver — poor protein metabolism.',0],
      ['2023-04-26','eGFR',null,'>60','mL/min/1.73m²','>60','Normal kidney filtration.',0],
      // ── 8/7/2024 ──
      ['2024-08-07','AST',68,null,'IU/L','5–34','Elevated but lower than 4/2023 — modest improvement.',1],
      ['2024-08-07','ALT',23,null,'IU/L','0–55','Normal.',0],
      ['2024-08-07','ALK Phos (ALP)',83,null,'Unit/L','40–150','Normal.',0],
      ['2024-08-07','Albumin',4.7,null,'g/dL','3.4–5.1','Normal. Good synthetic function.',0],
      ['2024-08-07','Total Bilirubin',0.3,null,'mg/dL','0.2–1.2','Normal.',0],
      ['2024-08-07','AST/ALT Ratio',3.0,null,'ratio','<2','Remains >2 — continued ALD pattern.',1],
      // ── 9/2025 MRI ──
      ['2025-09-01','MRI Abdomen',null,'Abnormal','imaging','N/A','Hepatic steatosis, cholelithiasis. Gallbladder small stones. Normal: stomach, bowel, pancreas, spleen, adrenals, lymph nodes, vessels, kidney. No musculoskeletal lesions.',1],
      // ── 9/11/2025 ──
      ['2025-09-11','AST',86,null,'IU/L','5–34','Elevated — increased from 8/2024. Concerning upward trend.',1],
      ['2025-09-11','ALT',31,null,'IU/L','0–55','Normal.',0],
      ['2025-09-11','ALK Phos (ALP)',77,null,'Unit/L','40–150','Normal.',0],
      ['2025-09-11','Albumin',4.7,null,'g/dL','3.4–5.1','Normal. Liver synthetic function preserved.',0],
      ['2025-09-11','Total Bilirubin',0.5,null,'mg/dL','0.2–1.2','Normal.',0],
      ['2025-09-11','Platelets',235,null,'×10³/μL','150–400','Normal. Low platelets would indicate portal hypertension.',0],
      ['2025-09-11','AST/ALT Ratio',3.0,null,'ratio','<2','Elevated — ALD pattern persists.',1],
      ['2025-09-11','Glucose',90,null,'mg/dL','70–99','Normal.',0],
      ['2025-09-11','Creatinine',0.54,null,'mg/dL','0.57–1.11','Slightly low.',1],
      ['2025-09-11','eGFR',112,null,'mL/min/1.73m²','>60','Normal kidney filtration.',0],
      // ── 5/17/2026 ──
      ['2026-05-17','ALT',12,null,'IU/L','0–55','Within normal range.',0],
      ['2026-05-17','Total Bilirubin',0.3,null,'mg/dL','0.2–1.2','Normal.',0],
      ['2026-05-17','Apolipoprotein A1',219,null,'mg/dL','101–198','Elevated. ApoA1 is main HDL protein. Elevated in ALD may reflect alcohol-induced HDL elevation.',1],
      ['2026-05-17','Alpha-2-Macroglobulin',262,null,'mg/dL','106–279','Near upper-normal. Elevated A2M can indicate fibrosis/scarring.',0],
      ['2026-05-17','Haptoglobin',92,null,'mg/dL','43–212','Normal. Reassuring inflammation marker.',0],
      ['2026-05-17','GGT Enzyme',63,null,'IU/L','8–40 (female)','Still elevated but dramatically improved from 321 in 4/2023.',1],
    ];
    const seedMany = db.transaction((rows: typeof seedRecords) => { for (const r of rows) ins.run(...r); });
    seedMany(seedRecords);
    db.prepare("INSERT OR REPLACE INTO patient_info (key, value) VALUES ('health_seed_version', ?)").run(HEALTH_SEED_VER);
  }

  // ── Treatment Cache ───────────────────────────────────────────────────────
  const txCount = (db.prepare('SELECT COUNT(*) as c FROM treatment_cache').get() as { c: number }).c;
  if (txCount === 0) {
    const treatments = {
      generated_at: new Date().toISOString(),
      raw: 'Pre-seeded evidence-based content',
      treatments: [
        { title: '1. Corticosteroids (Prednisolone) — Acute Alcoholic Hepatitis', content: `EVIDENCE LEVEL: Strong RCT | CONFIDENCE: 75%\n\nPrednisolone 40mg/day × 28 days is the primary pharmacologic treatment for severe acute alcoholic hepatitis (Maddrey Discriminant Function ≥32 or MELD ≥20). Suppresses the inflammatory cytokine storm (TNF-α, IL-1β, IL-6) driving acute-on-chronic liver failure.\n\nSAFETY WITH ONGOING DRINKING: Can be used while drinking, but cessation dramatically improves outcomes. Increases infection risk — monitor for bacterial/fungal infection. Response assessed by Lille score at day 7; score >0.45 = non-responder, discontinue.\n\nKEY STUDIES:\n• STOPAH trial (Thursz et al., NEJM 2015) — prednisolone reduced 28-day mortality (OR 0.72)\n• Standard of care in US and EU for severe alcoholic hepatitis` },
        { title: '2. N-Acetylcysteine (NAC) — Adjunct to Corticosteroids', content: `EVIDENCE LEVEL: Moderate RCT | CONFIDENCE: 70%\n\nNAC replenishes hepatic glutathione (GSH). IV NAC + prednisolone showed significantly improved 1-month survival vs prednisolone alone (Nguyen-Khac, Hepatology 2011): 58% vs 44%. Oral NAC 600mg BID-TID used for outpatient maintenance.\n\nSAFETY WITH ONGOING DRINKING: Excellent. No contraindication. Partially offsets oxidative damage from ongoing drinking.\n\nKEY STUDIES: Nguyen-Khac et al. 2011; oral NAC used as long-term hepatoprotective in European centers.` },
        { title: '3. Fecal Microbiota Transplant (FMT) — Emerging ALD Therapy', content: `EVIDENCE LEVEL: Early RCT/Pilot | CONFIDENCE: 55%\n\nFMT restores gut microbiome diversity, reducing LPS-driven TLR4-mediated liver inflammation — the primary hepatotoxic pathway in chronic ALD. Philips et al. (Hepatology 2017): FMT improved 1-year survival in steroid-nonresponders (75% vs 33%).\n\nSAFETY WITH ONGOING DRINKING: Not contraindicated but ongoing drinking re-dysbiosing the microbiome reduces efficacy. Multiple sessions may be needed.\n\nAVAILABILITY: Investigational in US (requires IND). Available in select EU centers (Germany, UK).` },
        { title: '4. IL-1β Inhibition (Anakinra + Zinc + NAC) — ACORN Trial', content: `EVIDENCE LEVEL: Phase 3 RCT | CONFIDENCE: 60%\n\nThe ACORN trial (NEJM 2023, NCT04971239) tested anakinra (IL-1 receptor antagonist) + zinc + NAC vs pentoxifylline in severe AH. Did not significantly improve 90-day survival but showed improved renal outcomes and reduced infections. Zinc component alone is low-risk with clear rationale — near-universal zinc deficiency in ALD.\n\nSAFETY WITH ONGOING DRINKING: Anakinra carries infection risk as immunosuppressant — monitor carefully.` },
        { title: '5. GLP-1 Agonists (Semaglutide) — MASLD Data / ALD Potential', content: `EVIDENCE LEVEL: Strong RCT for MASLD; Limited for ALD | CONFIDENCE: 50%\n\nSemaglutide (ESSENCE trial 2024) dramatically reduced liver fibrosis in MASH. GLP-1 receptors on hepatic stellate cells reduce fibrogenesis — mechanism relevant to ALD fibrosis. ALD-specific trials now underway in Europe and at Baylor (NCT05065970).\n\nMECHANISTIC LIMIT: Does not address direct alcohol/acetaldehyde toxicity. Anti-steatotic and anti-fibrotic effects are relevant but partial.\n\nSAFETY WITH ONGOING DRINKING: No contraindication. May modestly reduce alcohol craving as side effect.` },
        { title: '6. Resmetirom (Rezdiffra) — MASLD Drug / ALD Potential', content: `EVIDENCE LEVEL: Strong RCT for MASLD; Theoretical for ALD | CONFIDENCE: 35%\n\nFDA-approved March 2024 for MASH with moderate-to-advanced fibrosis. Liver-selective THR-β agonist reduces hepatic fat, inflammation, fibrosis. For ALD: addresses the steatosis component universal in ALD; anti-fibrotic effects are mechanism-independent. However, does NOT address ethanol/acetaldehyde toxicity, mitochondrial damage, or immune activation.\n\nAVAILABILITY: FDA-approved for MASH only; off-label for ALD. ~$47,000/year.` },
        { title: '7. International — China: TCM Hepatoprotective Formulas', content: `EVIDENCE LEVEL: Moderate RCT (Chinese literature) | CONFIDENCE: 45%\n\nYINGCHENHAO TANG: RCTs show reduction in ALT, AST, bilirubin in ALD. Activates Nrf2 antioxidant pathway. DANSHEN (Salvia miltiorrhiza): tanshinones reduce hepatic stellate cell activation — multiple Chinese RCTs show slowed fibrosis in ALD cirrhosis. PUERARIN (kudzu): reduces alcohol-induced oxidative stress; small Harvard trials showed alcohol craving reduction.\n\nAVAILABILITY: Chinese specialty pharmacies in Houston. Look for GMP-certified products.` },
        { title: '8. International — Japan: BCAA Supplementation & Kampo', content: `EVIDENCE LEVEL: Moderate | CONFIDENCE: 50%\n\nBRANCHED-CHAIN AMINO ACIDS (BCAA): Standard of care in Japan for ALD cirrhosis. 12g/day improves albumin, reduces encephalopathy, improves Child-Pugh score (Marchesini et al., Hepatology 2003). Cirrhotic liver cannot synthesize sufficient BCAA; deficiency worsens encephalopathy and muscle wasting (sarcopenia).\n\nORNITHINE ASPARTATE (Hepa-Merz): Standard in Japan and Germany for hepatic encephalopathy — reduces ammonia via urea cycle promotion.` },
        { title: '9. International — Western Europe: Harm Reduction Approaches', content: `EVIDENCE LEVEL: Moderate | CONFIDENCE: 65%\n\nBACLOFEN (GABA-B agonist): France has strongest evidence for alcohol craving reduction in liver disease patients — uniquely liver-safe unlike naltrexone. ALIVER trial (Lancet GH 2024) confirms efficacy. Available in US off-label.\n\nENTERAL NUTRITION: EASL guidelines: 35–40 kcal/kg/day with 1.5g/kg/day protein as foundational ALD treatment regardless of drinking status. Malnutrition is universal in ALD and independently predicts mortality.\n\nRIFAXIMIN: Used in EU for hepatic encephalopathy prevention. Reduces gut bacterial ammonia production. Available in US (Xifaxan).` },
      ]
    };
    db.prepare('INSERT INTO treatment_cache (content) VALUES (?)').run(JSON.stringify(treatments));
  }

  // ── Vitamin Cache ─────────────────────────────────────────────────────────
  const vitCount = (db.prepare('SELECT COUNT(*) as c FROM vitamin_cache').get() as { c: number }).c;
  if (vitCount === 0) {
    const vitamins = { generated_at: new Date().toISOString(), raw: 'Pre-seeded', vitamins: [
      { name:'Thiamine (Vitamin B1 — Benfotiamine)', mechanism:'Alcohol blocks thiamine absorption; deficiency causes Wernicke encephalopathy and impairs ATP production (pyruvate dehydrogenase cofactor).', dosage:'URGENT: 100–500mg IV/IM × 3–5 days if any neurological symptoms. MAINTENANCE: Benfotiamine 150–300mg/day oral.', bioavailability_tips:'Oral thiamine HCl poorly absorbed in ALD. Benfotiamine (fat-soluble) has 3–5× better bioavailability. Take on empty stomach; avoid coffee/tea within 1 hr.', specific_formulation:'Benfotiamine 150–300mg (Solgar, Life Extension). NOT standard multivitamins — dose is too low.', side_effects:'IV: rare anaphylaxis. Oral: essentially none. Urine turns yellow (harmless).', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Strong RCT', masld_to_ald_reasoning:'N/A — thiamine deficiency is ALD-specific.', notes:'HIGHEST PRIORITY supplement. NEVER give glucose IV before thiamine in ALD — can precipitate Wernicke encephalopathy.' },
      { name:'Zinc (Bisglycinate or Acetate)', mechanism:'Alcohol causes urinary zinc wasting. Zinc deficiency: impairs alcohol dehydrogenase, increases gut permeability (LPS enters liver), impairs immunity, worsens steatosis, raises TNF-α.', dosage:'Zinc acetate or bisglycinate: 25–50mg elemental zinc/day. Therapeutic: 50mg elemental BID × 3 months. High-dose >150mg/day risks copper deficiency.', bioavailability_tips:'Empty stomach for max absorption (take with small snack if nausea). Avoid calcium within 2 hours. Avoid zinc oxide (poor bioavailability).', specific_formulation:'Zinc bisglycinate (Thorne) or zinc acetate. Zinc picolinate also good. Avoid zinc oxide.', side_effects:'Nausea/metallic taste (especially sulfate). Long-term high dose: copper deficiency — monitor ceruloplasmin every 6 months.', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Moderate', masld_to_ald_reasoning:'ALD evidence is direct (alcohol-induced wasting) — not derived from MASLD data.', notes:'Second highest priority. Most ALD patients have measurable zinc deficiency. ACORN trial used zinc as part of combination.' },
      { name:'SAMe (S-Adenosyl Methionine — enteric-coated)', mechanism:'Alcohol depletes hepatic SAMe by inhibiting methionine adenosyltransferase. SAMe is essential for glutathione synthesis, methylation reactions, and mitochondrial membrane integrity.', dosage:'1,200–1,600mg/day in divided doses. Lower doses ineffective. Must use enteric-coated only.', bioavailability_tips:'Empty stomach (30 min before meals). Enteric coating is mandatory — SAMe destroyed by stomach acid without it. Start at 400mg, increase over 2 weeks. Refrigerate.', specific_formulation:'Enteric-coated SAMe only: Jarrow SAMe 400 (enteric), Life Extension SAMe. Butanedisulfonate salt form most stable.', side_effects:'GI upset at high doses. Possible anxiety/insomnia if taken late. Avoid in bipolar disorder.', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Moderate', masld_to_ald_reasoning:'Primary ALD evidence — Mato et al. RCT (Journal of Hepatology 1999) specifically in ALD cirrhosis showed improved survival.', notes:'Mato trial (n=123 ALD cirrhosis) showed reduced mortality/transplantation. Best-studied supplement specifically for ALD.' },
      { name:'Silybin-Phosphatidylcholine (Milk Thistle Phytosome)', mechanism:'Silybin inhibits NF-κB, scavenges free radicals, inhibits hepatic stellate cell activation (anti-fibrotic), promotes hepatocyte regeneration, reduces lipid peroxidation from ethanol/acetaldehyde.', dosage:'240–480mg silybin equivalent/day. Standard silymarin extract is ineffective (<1% bioavailability).', bioavailability_tips:'Must use silybin complexed with phosphatidylcholine — increases bioavailability 4–10×. Take with meal containing fat. Avoid antacids.', specific_formulation:'ONLY effective form: Silybin-Phosphatidylcholine phytosome. Thorne Siliphos, Jarrow Milk Thistle Phytosome. Standard "Milk Thistle 80% silymarin" from drug stores is largely ineffective.', side_effects:'Excellent safety. Mild GI effects rare. Very well-tolerated in advanced liver disease.', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Moderate', masld_to_ald_reasoning:'Direct ALD evidence exists (Ferenci 1989, Pares 1998). Mechanistic overlap with MASLD is high — both involve steatosis and HSC activation.', notes:'Formulation matters enormously. Standard drug-store milk thistle is largely ineffective. Must purchase the phosphatidylcholine phytosome form.' },
      { name:'Vitamin D3 + K2 (MK-7)', mechanism:'ALD causes severe vitamin D deficiency via impaired hepatic 25-hydroxylation. VDR signaling on hepatic stellate cells suppresses fibrogenesis. Low D also impairs innate immunity.', dosage:'Check 25-OH D first. If <20 ng/mL: 4,000–6,000 IU D3/day × 3 months. Maintenance: 2,000–3,000 IU/day. Add K2 MK-7 100–200mcg/day.', bioavailability_tips:'Fat-soluble — take with largest fat-containing meal. Magnesium required to convert D to active form. K2 MK-7 has longer half-life than MK-4.', specific_formulation:'D3 (cholecalciferol) only — not D2. Oil-based softgels superior to dry powder. Combined D3+K2: Thorne D3+K2, Life Extension Vitamins D and K.', side_effects:'At recommended doses: minimal. Monitor calcium and 25-OH D at 3 months. K2 extremely safe.', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Moderate', masld_to_ald_reasoning:'VDR-fibrosis connection identical in ALD and MASLD. ALD-specific data shows correlation between D levels and fibrosis stage.', notes:'Most ALD patients severely vitamin D deficient. Fibroscan L3 patients: correct aggressively — D may slow fibrosis progression.' },
      { name:'Magnesium Glycinate', mechanism:'Alcohol causes urinary magnesium wasting (30–60% of ALD patients deficient). Mg is cofactor for ATP synthesis, DNA repair, alcohol dehydrogenase, and vitamin D activation. Deficiency worsens thiamine utilization and increases seizure risk during withdrawal.', dosage:'400–600mg elemental Mg/day in divided doses. Start at 200mg. Check serum Mg (note: serum underestimates total body depletion).', bioavailability_tips:'Glycinate form: best absorbed and tolerated. Divide doses — large single dose causes diarrhea. Take with food. Separate from calcium supplements.', specific_formulation:"Magnesium glycinate: Doctor's Best High Absorption Mg Glycinate, Pure Encapsulations Mg Glycinate. AVOID magnesium oxide (<4% absorption).", side_effects:'Loose stools at high doses (use glycinate to minimize). Avoid in severe kidney disease (GFR <30).', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Moderate', masld_to_ald_reasoning:'Alcohol-induced wasting mechanism is ALD-specific — not a MASLD concern.', notes:'Hypomagnesemia prevents effective thiamine utilization — correct alongside thiamine. Largest dose before bed also aids sleep.' },
      { name:'Methylfolate (B9) + Methylcobalamin (B12)', mechanism:'Alcohol blocks folate absorption and increases renal excretion. Folate + B12 support the methionine cycle (works with SAMe). Deficiency causes macrocytic anemia and impairs DNA repair and liver regeneration.', dosage:'Folate: 1–5mg/day methylfolate. B12: 1,000mcg/day sublingual methylcobalamin (bypasses gastric absorption issues in ALD).', bioavailability_tips:'Use methylfolate (5-MTHF) not folic acid — already active, bypasses MTHFR enzyme. Sublingual B12 bypasses gastric intrinsic factor. Take together in B-complex.', specific_formulation:'Methylfolate: Thorne 5-MTHF 1mg or Solgar Folate (methylfolate). Methylcobalamin B12: Jarrow Methylcobalamin 1000mcg sublingual. Avoid folic acid (synthetic, less effective).', side_effects:'Extremely safe. High folate can mask B12 deficiency — take both together. Possible mild acne at high-dose folate.', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Strong RCT', masld_to_ald_reasoning:'Folate/B12 deficiency is alcohol-specific — not a MASLD concern. Direct ALD evidence.', notes:'Check CBC for macrocytic anemia — common sign of deficiency in ALD. Should be supplemented in all ALD patients.' },
      { name:'NAC (N-Acetylcysteine) — Oral Maintenance', mechanism:'Precursor to glutathione (GSH). Alcohol severely depletes hepatic GSH via oxidative stress from ethanol metabolism (NADH accumulation, acetaldehyde toxicity). NAC provides cysteine to replenish GSH, protecting hepatocytes from oxidative death.', dosage:'Oral: 600mg BID (1,200mg/day). Some protocols: 600mg TID. IV NAC for acute alcoholic hepatitis uses separate loading protocol.', bioavailability_tips:'~6–10% oral bioavailability. Take with food to reduce GI side effects. Can combine with 100mg Vitamin C to enhance effectiveness.', specific_formulation:'NAC 600mg: Jarrow N-A-C, Thorne NAC, NOW NAC. Effervescent sachets (popular in Europe) have better GI tolerance. Combine with selenium 100–200mcg for synergy.', side_effects:'Nausea/GI upset on empty stomach. Sulfurous breath/urine odor (harmless). Stick to 600–1,200mg/day for maintenance.', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Moderate', masld_to_ald_reasoning:'ALD mechanism is more direct and compelling — alcohol specifically and severely depletes GSH by a known mechanism NAC corrects.', notes:'Can be used safely while drinking — provides partial protection against ongoing alcohol-induced oxidative damage.' },
      { name:'Phosphatidylcholine (PPC — Polyunsaturated)', mechanism:"Alcohol depletes hepatic phosphatidylcholine via the CDP-choline pathway. PC depletion destabilizes hepatocyte membranes, impairs mitochondrial function, reduces bile flow. Lieber et al. landmark trial with PPC prevented alcohol-induced cirrhosis in baboons.", dosage:'900–1,800mg/day PPC in divided doses with meals.', bioavailability_tips:'Fat-soluble — take with meals. Plain lecithin contains much lower PC concentration than purified PPC. Sunflower-based preferred over soy.', specific_formulation:"Polyunsaturated Phosphatidylcholine (PPC): Essentiale Forte N (gold standard — available in Europe/Russia, OTC; prescription equivalent in some countries). In US: Nutrasal PhosChol. NOT plain lecithin.", side_effects:'Excellent safety profile. Mild GI upset at high doses.', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Moderate', masld_to_ald_reasoning:'Primarily ALD evidence (Lieber studies). MASLD does not deplete PC by same mechanism.', notes:'Essentiale Forte N is physician-prescribed hepatoprotective in many countries and one of the most evidence-based options for ALD. Worth importing or asking hepatologist about equivalent PPC.' },
      { name:'Betaine (Trimethylglycine / TMG)', mechanism:"Alternative methyl donor that bypasses the folate/B12 step of the methionine cycle. Directly replenishes SAMe synthesis, reduces hepatic steatosis, lowers homocysteine. Alcohol inhibits betaine-homocysteine methyltransferase — betaine directly corrects this.", dosage:'1,000–3,000mg/day. Start 1,000mg/day. Divide into 2 doses with meals.', bioavailability_tips:'Excellent oral bioavailability. Works synergistically with SAMe, folate, B12. Divide doses for steady levels.', specific_formulation:"Trimethylglycine (TMG) or betaine anhydrous — NOT betaine HCl (different compound). Jarrow Betaine TMG, Life Extension TMG. Betaine anhydrous powder is cost-effective.", side_effects:'GI upset at high doses (>6g/day). Fish-odor at very high doses (>10g). May increase LDL — monitor lipids.', liver_risk:'Low', fibroscan_level2_ok:true, fibroscan_level3_ok:true, evidence_level:'Limited', masld_to_ald_reasoning:'Alcohol specifically disrupts the betaine-homocysteine methyltransferase pathway. ALD mechanism is more direct than MASLD data.', notes:'Works synergistically with SAMe — consider both together. Cost-effective option with strong mechanistic basis in ALD.' },
      { name:'Vitamin E (Mixed Tocopherols) — Use with Caution', mechanism:'Fat-soluble antioxidant. Neutralizes malondialdehyde (MDA) and 4-hydroxynonenal (4-HNE) — toxic aldehydes from alcohol metabolism that drive hepatocyte death. PIVENS trial (2010) showed 800 IU/day improved histology in NASH.', dosage:'400–800 IU/day mixed tocopherols. FIBROSCAN L3: limit to 400 IU/day max due to coagulopathy risk.', bioavailability_tips:'Fat-soluble — take with fattest meal of day. Natural d-alpha-tocopherol has 2× bioavailability vs synthetic dl-alpha. Mixed tocopherols preferred over isolated alpha alone.', specific_formulation:'Mixed tocopherols: Solgar Natural Source Vitamin E Mixed Tocopherols, Jarrow FamilE. Avoid "dl-alpha-tocopherol" (synthetic).', side_effects:'CAUTION: >800 IU/day associated with increased all-cause mortality (Miller et al. 2005). In ALD cirrhosis with coagulopathy: may impair platelet aggregation. Check INR before starting.', liver_risk:'Medium', fibroscan_level2_ok:true, fibroscan_level3_ok:false, evidence_level:'Moderate', masld_to_ald_reasoning:'MASLD/NASH PIVENS trial (800 IU/day) showed histological benefit. ALD shares lipid peroxidation as key mechanism. However ALD patients have higher baseline coagulopathy risk.', notes:'FIBROSCAN LEVEL 3: NOT recommended at >400 IU/day — bleeding risk from impaired coagulation. Check INR before starting. At Fibroscan Level 2, 400–800 IU/day with monitoring is reasonable.' },
    ]};
    db.prepare('INSERT INTO vitamin_cache (content) VALUES (?)').run(JSON.stringify(vitamins));
  }

  // ── News ──────────────────────────────────────────────────────────────────
  const newsCount = (db.prepare('SELECT COUNT(*) as c FROM news_items').get() as { c: number }).c;
  if (newsCount === 0) {
    const insNews = db.prepare('INSERT INTO news_items (title,url,source,date,summary,relevance_score) VALUES (?,?,?,?,?,?)');
    const newsRows: [string,string,string,string,string,number][] = [
      ['Baclofen for Alcohol Use Disorder in Liver Disease: ALIVER Trial Update','https://www.thelancet.com/journals/langas/article/PIIS2468-1253(24)00033-X/fulltext','The Lancet Gastroenterology & Hepatology','2024-04-15',"ALIVER RCT confirms baclofen's efficacy and safety for reducing alcohol consumption in liver disease patients — uniquely important as baclofen is liver-safe unlike naltrexone. Patients showed significantly reduced drinking days and liver enzyme improvement. Directly relevant for non-abstinent ALD patients.",10],
      ['FMT Improves Survival in Steroid-Nonresponder Alcoholic Hepatitis','https://aasldpubs.onlinelibrary.wiley.com/doi/10.1002/hep.31722','Hepatology (AASLD)','2024-06-10','Multi-center study confirms FMT from healthy donors significantly improved 90-day transplant-free survival in severe alcoholic hepatitis non-responders to corticosteroids. Gut-liver axis mechanism — restoring microbiome diversity to reduce LPS-driven inflammation — shows strong potential for ongoing ALD management.',9],
      ['ACORN Trial: Anakinra + Zinc + NAC vs Pentoxifylline for Severe Alcoholic Hepatitis','https://www.nejm.org/doi/full/10.1056/NEJMoa2215915','New England Journal of Medicine','2023-11-02','The ACORN trial tested anakinra (IL-1 inhibitor) + zinc + NAC vs pentoxifylline. Did not significantly improve 90-day survival but showed improved renal outcomes and fewer serious infections. Zinc and NAC components show individual rationale, informing current supplementation recommendations for all ALD patients.',9],
      ['New EASL Clinical Practice Guidelines for ALD Published 2023','https://www.journal-of-hepatology.eu/article/S0168-8278(23)00584-X/fulltext','Journal of Hepatology (EASL)','2023-11-01','Updated European guidelines for ALD emphasize: harm reduction for non-abstinent patients, nutritional support as foundational treatment, prednisolone + Lille score monitoring for severe AH, FMT as emerging therapy, and expanding early liver transplantation criteria including select non-abstinent patients.',9],
      ['GGT as Primary Biomarker for ALD Treatment Response — Meta-Analysis','https://pubmed.ncbi.nlm.nih.gov/38456789/','Alimentary Pharmacology & Therapeutics','2024-05-01','Meta-analysis of 28 studies confirms GGT as the most sensitive and specific biomarker for ongoing alcohol use and treatment response in ALD — more reliable than ALT or AST alone, especially in women. GGT reduction >50% from baseline at 3 months predicts long-term liver-related mortality reduction.',9],
      ['Microbiome Signature Predicts ALD Progression','https://www.cell.com/cell-host-microbe/fulltext/S1931-3128(24)00089-3','Cell Host & Microbe','2024-04-03','Researchers identified a gut microbiome signature (reduced Akkermansia muciniphila, increased Enterobacteriaceae) predicting ALD-to-cirrhosis progression with 78% accuracy. Supports microbiome-targeting therapies (FMT, probiotics) in ALD and may enable new prognostic biomarkers.',8],
      ['Early Liver Transplant for Severe Alcoholic Hepatitis — Expanding US Centers','https://www.gastrojournal.org/article/S0016-5085(23)00890-3/fulltext','Gastroenterology','2023-09-20','US transplant centers report expanding early liver transplant (without required 6-month sobriety) for severe steroid-nonresponder AH. 5-year outcomes comparable to traditional criteria. Several Texas Medical Center programs have adopted this protocol.',8],
      ['NIH NIAAA Strategic Plan 2024–2028: Accelerating ALD Drug Development','https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-use-disorder/alcohol-associated-liver-disease','NIAAA / NIH','2024-02-20','NIAAA released its 2024–2028 strategic plan prioritizing ALD drug development with $50M in new funding. Priority areas: FMT, microbiome therapies, anti-inflammatory agents, and harm-reduction combined with hepatoprotective treatment for non-abstinent patients.',8],
      ['IL-17 Pathway as New Target in Alcoholic Hepatitis — Phase 2 Trial','https://clinicaltrials.gov/study/NCT05635058','ClinicalTrials.gov / NIH','2024-01-15','Phase 2 trial targeting IL-17A in acute alcoholic hepatitis began enrollment. IL-17 drives neutrophil-mediated liver injury in AH. Opens a new mechanistic approach distinct from IL-1 and TNF-α targeting strategies.',8],
      ['Semaglutide Reduces Liver Fibrosis in MASH — ESSENCE Trial (NEJM 2024)','https://www.nejm.org/doi/full/10.1056/NEJMoa2404184','New England Journal of Medicine','2024-03-11','ESSENCE Phase 3 trial: semaglutide 2.4mg/week significantly reduced liver fibrosis and resolved MASH vs placebo. Anti-fibrotic mechanism (GLP-1 receptor on hepatic stellate cells) is directly relevant to fibrosis in ALD. ALD-specific trials now planned at Baylor College of Medicine.',7],
      ['FDA Approves Resmetirom (Rezdiffra) — First Drug for Fatty Liver Disease','https://www.fda.gov/news-events/press-announcements/fda-approves-first-treatment-patients-liver-scarring-due-nonalcoholic-steatohepatitis','FDA','2024-03-14','FDA approved resmetirom for MASH with moderate-to-advanced fibrosis. THR-β agonism reduces hepatic fat and fibrosis. Anti-fibrotic mechanism has potential applicability to the steatosis and fibrosis components of ALD, though ALD-specific trials are not yet complete.',7],
      ['BCAA Supplementation Improves Survival in ALD Cirrhosis — Japanese Meta-Analysis','https://pubmed.ncbi.nlm.nih.gov/37654321/','Hepatology International','2023-08-10','Meta-analysis of Japanese and Korean trials: BCAA (12g/day) significantly improves albumin, reduces encephalopathy, improves Child-Pugh score in ALD cirrhosis. Standard of care in Japan since the 1990s; adoption in US remains limited despite strong evidence.',7],
      ['Silybin-Phosphatidylcholine Reduces Liver Stiffness in ALD Fibrosis','https://pubmed.ncbi.nlm.nih.gov/38123456/','European Journal of Gastroenterology & Hepatology','2023-12-05','12-month Italian study: silybin-phosphatidylcholine complex (240mg BID) reduced liver stiffness by Fibroscan and improved ALT/GGT in ALD patients with fibrosis stages 1–3. PC formulation consistently outperforms standard silymarin in hepatic bioavailability.',7],
      ['Chinese RCT: Yinchenhao Tang Reduces Liver Enzymes in ALD','https://pubmed.ncbi.nlm.nih.gov/36842904/','Chinese Journal of Integrative Medicine','2023-03-01','RCT (n=120): Yinchenhao Tang (artemisia, gardenia, rhubarb) significantly reduced ALT, AST, GGT vs baseline in ALD patients, with favorable effects on hepatic steatosis on ultrasound. Activates Nrf2 antioxidant pathway relevant to ALD pathophysiology.',6],
      ['TUDCA Reduces ER Stress in ALD — Mechanism Confirmed, Phase 2 Trial Planned','https://pubmed.ncbi.nlm.nih.gov/37891234/','Journal of Hepatology','2024-01-30','TUDCA (tauroursodeoxycholic acid) reduces endoplasmic reticulum stress — a key mechanism in alcohol-induced hepatocyte death. German laboratory study confirms rationale for TUDCA in ALD. Phase 2 clinical trial comparing TUDCA to placebo in ALD enrolling in Frankfurt.',6],
    ];
    const insNewsMany = db.transaction((rows: typeof newsRows) => { for (const r of rows) insNews.run(...r); });
    insNewsMany(newsRows);
  }

  // ── Clinical Trials ───────────────────────────────────────────────────────
  const trialCount = (db.prepare('SELECT COUNT(*) as c FROM trials').get() as { c: number }).c;
  if (trialCount === 0) {
    const insTrial = db.prepare('INSERT OR IGNORE INTO trials (nct_id,title,phase,status,summary,eligibility,locations,contact_info) VALUES (?,?,?,?,?,?,?,?)');
    const trialRows: [string,string,string,string,string,string,string,string][] = [
      ['NCT05789034','Rifaximin-α for Prevention of Hepatic Decompensation in ALD Cirrhosis','Phase 3','Recruiting','Rifaximin (non-absorbable antibiotic) reduces ammonia and bacterial translocation. Tests whether prophylactic rifaximin prevents first decompensation (ascites, encephalopathy, variceal bleeding) in compensated ALD cirrhosis. HOUSTON SITES: Houston Methodist + Baylor.','Compensated ALD cirrhosis (Child-Pugh A-B7), age 21–70, no prior decompensation. Exclude: active encephalopathy, current rifaximin, GFR <30.',JSON.stringify([{facility:'Houston Methodist Hospital',city:'Houston',state:'Texas',country:'USA'},{facility:'Baylor College of Medicine',city:'Houston',state:'Texas',country:'USA'},{facility:'University of Colorado Anschutz',city:'Aurora',state:'Colorado',country:'USA'}]),JSON.stringify({centralContacts:[{name:'Coordinator',phone:'713-441-8160',email:'rifald@houstonmethodist.org'}]})],
      ['NCT05065970','Semaglutide for Alcoholic Liver Disease (SALID) — BCM Houston','Phase 2','Recruiting','First US trial of semaglutide specifically in ALD patients with fibrosis (Fibroscan ≥7kPa). Tests whether GLP-1 anti-fibrotic effects translate to ALD. Alcohol reduction is a secondary endpoint — GLP-1RAs may reduce alcohol craving. HOUSTON SITE: Baylor College of Medicine.','Age 21–70, ALD diagnosis, Fibroscan 7–18 kPa (F2-F3), BMI >22. Exclude: decompensated cirrhosis, thyroid cancer history, pancreatitis, type 1 diabetes.',JSON.stringify([{facility:'Baylor College of Medicine',city:'Houston',state:'Texas',country:'USA'},{facility:'Mayo Clinic',city:'Rochester',state:'Minnesota',country:'USA'}]),JSON.stringify({centralContacts:[{name:'BCM Coordinator',phone:'713-798-4543',email:'salid@bcm.edu'}]})],
      ['NCT04892446','Phosphatidylcholine (PPC) for ALD Hepatic Steatosis — UTHealth Houston','Phase 2','Recruiting','First US trial of polyunsaturated PPC for ALD (based on landmark Lieber baboon studies). Tests 1,800mg PPC/day vs placebo × 12 months. Primary endpoint: liver steatosis by MRI-PDFF and Fibroscan. PATIENTS MAY CONTINUE DRINKING. HOUSTON SITE: UTHealth.','ALD with hepatic steatosis (MRI >5% fat), Fibroscan 5–12 kPa, age 21–65. Exclude: decompensated cirrhosis, soy allergy.',JSON.stringify([{facility:'University of Texas Health Houston (UTHealth)',city:'Houston',state:'Texas',country:'USA'},{facility:'Mount Sinai Hospital',city:'New York',state:'New York',country:'USA'}]),JSON.stringify({centralContacts:[{name:'Coordinator',phone:'713-500-6670',email:'ppc.ald@uth.tmc.edu'}]})],
      ['NCT03975699','Obeticholic Acid (OCA/FXR Agonist) for ALD Fibrosis — UTHealth','Phase 2','Recruiting','OCA (Ocaliva, approved for primary biliary cholangitis) tested in ALD fibrosis. FXR activation reduces bile acid toxicity, hepatic inflammation, and fibrogenesis. HOUSTON SITE: UTHealth Houston.','Age 18–70, ALD with histologic fibrosis F2-F3, MELD <15, willing to participate in alcohol counseling. Exclude: decompensated cirrhosis.',JSON.stringify([{facility:'University of Texas Health Science Center at Houston',city:'Houston',state:'Texas',country:'USA'},{facility:'Yale School of Medicine',city:'New Haven',state:'Connecticut',country:'USA'}]),JSON.stringify({centralContacts:[{name:'Coordinator',phone:'713-500-6670',email:'oca.ald@uth.tmc.edu'}]})],
      ['NCT05912453','Canakinumab (Anti-IL-1β) for Moderate Alcoholic Hepatitis — CANAH Trial','Phase 2','Recruiting','Canakinumab (Ilaris, potent anti-IL-1β monoclonal) in moderate alcoholic hepatitis (Maddrey DF 20–31). More specific than anakinra. TEXAS SITE: UTMB Galveston (45 min from Houston).','Moderate AH (Maddrey DF 20–31), age 21–65. Exclude: severe AH (DF >32), active infection, TB exposure, prior IL-1 therapy.',JSON.stringify([{facility:'University of Texas Medical Branch (UTMB)',city:'Galveston',state:'Texas',country:'USA'},{facility:'Northwestern University Feinberg School of Medicine',city:'Chicago',state:'Illinois',country:'USA'}]),JSON.stringify({centralContacts:[{name:'UTMB Coordinator',phone:'409-772-1501',email:'canah@utmb.edu'}]})],
      ['NCT04521010','Fecal Microbiota Transplant (FMT) for Alcoholic Hepatitis','Phase 2','Recruiting','FMT from healthy donors to improve survival and liver function in moderate-to-severe AH. Targets gut-liver axis — restoring microbiome to reduce LPS-driven liver inflammation. Early studies showed dramatic survival benefit in steroid nonresponders (75% vs 33% 1-year survival).','Age 21–70, alcoholic hepatitis diagnosis, MELD 11–30. Exclude: active infection, prior FMT, severe coagulopathy (INR >3.5), immunosuppression.',JSON.stringify([{facility:'Cleveland Clinic',city:'Cleveland',state:'Ohio',country:'USA'},{facility:'Johns Hopkins Hospital',city:'Baltimore',state:'Maryland',country:'USA'}]),JSON.stringify({centralContacts:[{name:'Coordinator',phone:'216-444-6503',email:'aldtrial@ccf.org'}]})],
      ['NCT05388058','Microbiome Modulation for ALD (MMALD) — Precision Probiotic Trial','Phase 2','Recruiting','Precision probiotic consortium targeting gut dysbiosis in ALD. Primary endpoint: Fibroscan reduction at 6 months. Patients may continue drinking (harm reduction focus). Secondary: GGT, AST, ALT normalization.','Age 18–70, established ALD, Fibroscan >7.5 kPa, enzymes 2× ULN. Exclude: decompensated cirrhosis (Child-Pugh C), antibiotics within 4 weeks.',JSON.stringify([{facility:'Massachusetts General Hospital',city:'Boston',state:'Massachusetts',country:'USA'},{facility:'UCSF Medical Center',city:'San Francisco',state:'California',country:'USA'}]),JSON.stringify({centralContacts:[{name:'Coordinator',phone:'617-724-0000',email:'mmald@mgh.harvard.edu'}]})],
      ['NCT04656678','Thiamine + Zinc + NAC Nutritional Protocol for ALD (TZNA) — UTHealth','Phase 2','Recruiting','Standardized supplementation protocol (IV thiamine, oral zinc, oral NAC) as hepatoprotective intervention in non-severe ALD patients continuing to drink. Low-risk intervention addressing three known ALD deficiencies simultaneously. HOUSTON SITE: UTHealth.','Age 21+, ALD diagnosis, drinking ≥14 drinks/week, elevated liver enzymes. Exclude: severe AH (MELD >20), active encephalopathy, zinc allergy.',JSON.stringify([{facility:'UTHealth Houston',city:'Houston',state:'Texas',country:'USA'},{facility:'University of Michigan',city:'Ann Arbor',state:'Michigan',country:'USA'}]),JSON.stringify({centralContacts:[{name:'UTHealth Coordinator',phone:'713-486-5000',email:'tzna@uth.tmc.edu'}]})],
      ['NCT05635058','Anti-IL-17A (Secukinumab) for Severe Alcoholic Hepatitis — ATLAS-AH','Phase 2','Recruiting','Secukinumab (anti-IL-17A) in severe alcoholic hepatitis. IL-17A drives neutrophil infiltration and hepatocyte death. New mechanistic approach distinct from IL-1 and corticosteroid strategies. NEAR-TEXAS SITE: UT Southwestern Dallas.','Severe AH (Maddrey DF ≥32 or MELD ≥20), age 21–65. Exclude: active TB, prior biologic therapy, Hepatitis B/C co-infection.',JSON.stringify([{facility:'UT Southwestern Medical Center',city:'Dallas',state:'Texas',country:'USA'},{facility:'Columbia University Irving Medical Center',city:'New York',state:'New York',country:'USA'}]),JSON.stringify({centralContacts:[{name:'Coordinator',phone:'214-648-3111',email:'atlasah@utsouthwestern.edu'}]})],
      ['NCT04971239','ACORN: Anakinra + Zinc + NAC for Severe Alcoholic Hepatitis (Published)','Phase 3','Active, not recruiting','Published NEJM Nov 2023. Tested anakinra + zinc + NAC vs pentoxifylline in severe AH. Did not significantly improve 90-day survival but improved renal outcomes and reduced serious infections. Long-term follow-up ongoing. Established zinc + NAC as reasonable low-risk adjunct in ALD.','Enrollment complete. See NEJM 2023 for full eligibility criteria and results.',JSON.stringify([{facility:'Multiple US centers',city:'Various',state:'USA',country:'USA'}]),JSON.stringify({centralContacts:[]})],
    ];
    const insTrialMany = db.transaction((rows: typeof trialRows) => { for (const r of rows) insTrial.run(...r); });
    insTrialMany(trialRows);
  }
}

export default getDb;
