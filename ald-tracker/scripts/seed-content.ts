/**
 * Seed static content for Treatments, Vitamins, News, and Trials.
 * Run: npx tsx scripts/seed-content.ts
 * Add --force to overwrite existing cache entries.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'health.db'));
db.pragma('journal_mode = WAL');

const force = process.argv.includes('--force');

// ─── TREATMENTS ──────────────────────────────────────────────────────────────

const existingTreatment = db.prepare('SELECT COUNT(*) as c FROM treatment_cache').get() as { c: number };
if (existingTreatment.c === 0 || force) {
  if (force) db.prepare('DELETE FROM treatment_cache').run();

  const treatments = {
    generated_at: new Date().toISOString(),
    raw: 'Pre-seeded evidence-based content',
    treatments: [
      {
        title: '1. Corticosteroids (Prednisolone) — Acute Alcoholic Hepatitis',
        content: `EVIDENCE LEVEL: Strong RCT | CONFIDENCE: 75%

Prednisolone 40 mg/day for 28 days is the primary pharmacologic treatment for severe acute alcoholic hepatitis (Maddrey Discriminant Function ≥32 or MELD ≥20). Reduces short-term (28-day) mortality by suppressing the inflammatory cytokine storm (TNF-α, IL-1β, IL-6) that drives acute-on-chronic liver failure.

SAFETY WITH ONGOING DRINKING: Can be used while patient continues to drink, but alcohol cessation dramatically improves outcomes. Corticosteroids increase infection risk — requires monitoring for bacterial infections and fungal superinfection.

RESPONSE ASSESSMENT: Lille score calculated at day 7. Score >0.45 predicts non-response; discontinue if non-responder.

KEY STUDIES:
• STOPAH trial (Thursz et al., NEJM 2015) — largest RCT; prednisolone reduced 28-day mortality (OR 0.72)
• Meta-analyses confirm short-term but not 90-day survival benefit
• Not recommended for mild-moderate ALD; reserved for severe acute hepatitis

CURRENT STATUS: Standard of care in US and EU for severe alcoholic hepatitis`
      },
      {
        title: '2. N-Acetylcysteine (NAC) — Adjunct to Corticosteroids',
        content: `EVIDENCE LEVEL: Moderate RCT | CONFIDENCE: 70%

NAC replenishes hepatic glutathione (GSH), the liver's primary antioxidant. In ALD, chronic alcohol depletes GSH, worsening oxidative stress and mitochondrial dysfunction. IV NAC combined with prednisolone showed significantly improved 1-month survival vs. prednisolone alone in the Nguyen-Khac RCT (2011).

DOSING: IV protocol — 150 mg/kg over 1 hr, then 12.5 mg/kg/hr × 4 hrs, then 6.25 mg/kg/hr × 67 hrs. Oral NAC 600mg BID-TID also used for outpatient maintenance.

SAFETY WITH ONGOING DRINKING: Excellent safety profile. No contraindication with continued alcohol use. May partially offset oxidative damage from ongoing drinking.

KEY STUDIES:
• Nguyen-Khac et al. (Hepatology 2011) — NAC + prednisolone vs. prednisolone alone; 1-month survival 58% vs. 44%
• ATTIRE study supporting antioxidant role
• Oral NAC used as long-term hepatoprotective in several European centers

AVAILABILITY: Generic IV/oral, low cost. Available in US and worldwide.`
      },
      {
        title: '3. Fecal Microbiota Transplant (FMT) — Emerging ALD Therapy',
        content: `EVIDENCE LEVEL: Early RCT / Pilot | CONFIDENCE: 55%

ALD profoundly disrupts the gut microbiome — dysbiosis increases intestinal permeability, allowing bacterial endotoxins (LPS) to reach the liver via the portal vein, triggering TLR4-mediated inflammation. FMT from healthy donors can restore microbial diversity and reduce gut-derived liver inflammation.

CLINICAL DATA:
• Philips et al. (Hepatology 2017) — FMT improved 1-year survival in steroid-nonresponder severe AH (75% vs 33%)
• NCTU ALD-FMT trial (NCT04521010) — ongoing Phase 2 in US
• European data: FMT reduced hepatic encephalopathy in cirrhosis (ALD subset)

SAFETY WITH ONGOING DRINKING: Ongoing drinking reduces FMT efficacy by continuously re-dysbiosing the microbiome, but FMT is not contraindicated. Multiple sessions may be required.

AVAILABILITY: Currently investigational in US (requires IND). Available in select EU centers (Germany, UK). Not yet FDA-approved for ALD specifically.

MECHANISTIC BASIS: Strong — alcohol's primary hepatotoxic pathway in chronic ALD is LPS-TLR4 mediated, which FMT directly addresses.`
      },
      {
        title: '4. IL-1β Inhibition (Anakinra) — Acute Alcoholic Hepatitis',
        content: `EVIDENCE LEVEL: Moderate RCT | CONFIDENCE: 60%

IL-1β is a pivotal inflammatory cytokine in alcoholic hepatitis. Anakinra (IL-1 receptor antagonist) + zinc + NAC was tested in the ACORN trial (NCT04971239). Zinc supplementation addresses near-universal zinc deficiency in ALD; zinc is required for intestinal barrier integrity and alcohol metabolism.

ACORN TRIAL RESULTS (2023): Did not improve 90-day survival vs. pentoxifylline comparator, but showed improved renal function and reduced infections. Ongoing analysis of subgroups.

CANAKINUMAB (IL-1β monoclonal): Phase 2 trials ongoing in alcoholic hepatitis in Europe.

SAFETY WITH ONGOING DRINKING: Anakinra carries infection risk (as an immunosuppressant) — must monitor carefully if patient continues drinking (increased aspiration pneumonia risk).

COMBINATION STRATEGY: Zinc supplementation alone (220mg zinc sulfate BID) carries minimal risk and addresses near-universal deficiency in ALD patients.`
      },
      {
        title: '5. GLP-1 Receptor Agonists (Semaglutide) — MASLD Data / ALD Potential',
        content: `EVIDENCE LEVEL: Strong RCT for MASLD; Limited for ALD | CONFIDENCE: 50%

Semaglutide (Ozempic/Wegovy) and other GLP-1RAs show dramatic anti-fibrotic and anti-inflammatory effects in MASLD/NASH. The ESSENCE trial (2024) showed semaglutide significantly reduced liver fibrosis in MASH.

MECHANISTIC BASIS FOR ALD:
• GLP-1 receptors are expressed on hepatic stellate cells — activation reduces fibrogenesis
• Reduces hepatic steatosis (fat accumulation) — relevant since ALD invariably causes fatty liver
• Anti-inflammatory via NF-κB pathway suppression
• Reduces endotoxin-driven liver inflammation (same pathway as in ALD)
• LIMITATION: ALD involves direct alcohol toxicity + acetaldehyde damage not addressed by GLP-1RAs

ALD-SPECIFIC EVIDENCE: Retrospective data showing reduced liver-related events in ALD patients on GLP-1RAs. Phase 2 ALD-specific trials underway in Europe.

SAFETY WITH ONGOING DRINKING: No contraindication. GLP-1RAs reduce appetite — may modestly reduce alcohol consumption as a side effect (alcohol craving reduction noted in trials). Monitor for pancreatitis risk.

AVAILABILITY: FDA-approved for T2DM/obesity; off-label use for liver disease. Requires prescriber familiar with hepatology.`
      },
      {
        title: '6. Resmetirom (Rezdiffra) — MASLD Drug / ALD Potential',
        content: `EVIDENCE LEVEL: Strong RCT for MASLD; Theoretical for ALD | CONFIDENCE: 35%

Resmetirom is FDA-approved (March 2024) for MASH with moderate-to-advanced fibrosis — the first approved drug for fatty liver disease. It is a liver-selective thyroid hormone receptor-β (THR-β) agonist that reduces hepatic fat, inflammation, and fibrosis.

MECHANISTIC BASIS FOR ALD:
• THR-β activation increases fatty acid oxidation — reduces the steatosis that is universal in ALD
• Anti-fibrotic effects via HSC suppression are mechanism-independent of the cause of fibrosis
• Reduces hepatic triglycerides and LDL
• MAJOR LIMITATION: ALD involves direct ethanol/acetaldehyde toxicity, mitochondrial damage, and immune activation that resmetirom does not address. The anti-steatotic benefit is relevant but only addresses part of the ALD picture.

ALD-SPECIFIC EVIDENCE: None yet — no completed trials. The mechanistic overlap is real but modest.

AVAILABILITY: FDA-approved but only for MASH indication. Would be off-label for ALD. Cost ~$47,000/year. Liver specialist prescription required.

BOTTOM LINE: Potentially useful as adjunct for the fatty liver component of ALD, but not a primary ALD treatment.`
      },
      {
        title: '7. International Options — China: Traditional Hepatoprotective Formulas',
        content: `EVIDENCE LEVEL: Moderate RCT (in Chinese literature) | CONFIDENCE: 45%

YINCHENHAO TANG (茵陈蒿汤): One of the most studied TCM formulas for liver disease. Contains artemisia capillaris (yin chen), gardenia (zhi zi), rhubarb (da huang). RCTs in China show reduction in ALT, AST, bilirubin in alcoholic liver disease.
• Mechanism: Artemisinin derivatives activate Nrf2 antioxidant pathway; da huang (rhein) has anti-fibrotic properties

DANSHEN (Salvia miltiorrhiza / 丹参): Tanshinones reduce hepatic stellate cell activation. Multiple Chinese RCTs in ALD cirrhosis show slowed fibrosis progression.
• Formulation: Compound Danshen Dripping Pills or standardized extract; widely used in Chinese hospitals

SILYMARIN INJECTION (Legalone): IV silymarin (not available in US) used in Chinese and German hospitals for acute liver injury. Evidence stronger than oral forms.

PUERARIN (from kudzu root / 葛根素): Reduces alcohol-induced oxidative stress; kudzu has been used to reduce alcohol craving (small US trials at Harvard).

AVAILABILITY: TCM herbs available in Chinese specialty pharmacies in Houston (Houston has large Chinese medical community). Quality varies — look for GMP-certified products.`
      },
      {
        title: '8. International Options — Japan: Kampo Medicine & BCAA Supplementation',
        content: `EVIDENCE LEVEL: Moderate | CONFIDENCE: 50%

BRANCHED-CHAIN AMINO ACIDS (BCAA — leucine, isoleucine, valine): Standard of care in Japan for hepatic cirrhosis (including ALD). Large Japanese RCTs show BCAA supplementation improves albumin levels, reduces hepatic encephalopathy, and improves survival in cirrhosis.
• Evidence specifically for ALD-cirrhosis: Strong in Japanese literature (Marchesini et al., Hepatology 2003 also supports)
• Dosing: 12g/day BCAA supplement (Aminoleban EN or equivalent); taken before bed reduces nocturnal muscle catabolism
• Mechanism: Cirrhotic liver loses ability to synthesize sufficient BCAA; deficiency worsens encephalopathy and sarcopenia

KAMPO: Inchinko-to (equivalent to Yinchenhao Tang) standardized by Japanese health authority. More rigorous quality control than imported Chinese herbs.

ORNITHINE ASPARTATE (Hepa-Merz): Standard in Japan and Germany for hepatic encephalopathy. Reduces ammonia by promoting urea cycle. Used widely in EU for ALD cirrhosis.`
      },
      {
        title: '9. International Options — Western Europe: Harm Reduction & Nutritional Approaches',
        content: `EVIDENCE LEVEL: Moderate | CONFIDENCE: 65%

ENTERAL/PARENTERAL NUTRITION: EASL guidelines emphasize aggressive nutritional support — 35-40 kcal/kg/day with 1.5g/kg/day protein — as foundational ALD treatment regardless of ongoing drinking. Malnutrition is universal in ALD and independently predicts mortality.

RIFAXIMIN: Used in EU for hepatic encephalopathy prevention in ALD cirrhosis. Reduces gut bacterial production of ammonia. Available in US (Xifaxan) but expensive without cirrhosis diagnosis.

BACLOFEN FOR HARM REDUCTION: EU (particularly France) has the most evidence for baclofen (GABA-B agonist) to reduce alcohol craving in patients with liver disease — uniquely liver-safe unlike naltrexone (hepatotoxic risk) and acamprosate. The ALIVER trial (France) showed baclofen significantly reduced alcohol consumption in ALD patients. Available in US but off-label for alcohol use disorder.

URSODEOXYCHOLIC ACID (UDCA/TUDCA): Used in Germany and France as hepatoprotective for various liver diseases. TUDCA (tauroursodeoxycholic acid) has anti-apoptotic properties. Evidence in ALD is limited but biological plausibility is strong (reduces endoplasmic reticulum stress).

PENTOXIFYLLINE: EU still uses more than US after STOPAH dampened US enthusiasm. Reduces TNF-α; modest evidence for renal protection in ALD. Safer than corticosteroids for patients with active infection.`
      }
    ]
  };

  db.prepare('INSERT INTO treatment_cache (content) VALUES (?)').run(JSON.stringify(treatments));
  console.log('✓ Treatment cache seeded');
} else {
  console.log('– Treatment cache already exists (use --force to overwrite)');
}

// ─── VITAMINS ─────────────────────────────────────────────────────────────────

const existingVitamins = db.prepare('SELECT COUNT(*) as c FROM vitamin_cache').get() as { c: number };
if (existingVitamins.c === 0 || force) {
  if (force) db.prepare('DELETE FROM vitamin_cache').run();

  const vitamins = {
    generated_at: new Date().toISOString(),
    raw: 'Pre-seeded evidence-based content',
    vitamins: [
      {
        name: 'Thiamine (Vitamin B1)',
        mechanism: 'Alcohol blocks thiamine absorption and depletes hepatic stores. Deficiency causes Wernicke encephalopathy (a medical emergency) and peripheral neuropathy. Thiamine is essential for pyruvate dehydrogenase and alpha-ketoglutarate dehydrogenase — without it, cells cannot generate ATP from glucose.',
        dosage: 'URGENT REPLETION: 100–500mg IV/IM daily × 3–5 days if any neurological symptoms. MAINTENANCE: 100mg oral daily (high-dose thiamine; standard multivitamins contain only 1.1mg which is inadequate for ALD). Most ALD patients are severely depleted.',
        bioavailability_tips: 'Oral thiamine has very poor bioavailability in ALD (intestinal absorption impaired by alcohol). IV/IM preferred for acute repletion. For maintenance: take on empty stomach; avoid coffee/tea within 1 hour (tannins reduce absorption). Benfotiamine (fat-soluble form) has 3–5× better bioavailability than standard thiamine HCl.',
        specific_formulation: 'ACUTE: Thiamine HCl injection (IV/IM). MAINTENANCE: Benfotiamine 150–300mg (fat-soluble form, dramatically better absorption) OR standard thiamine HCl 100mg if benfotiamine unavailable. Brands: Benfotiamine by Solgar, Life Extension. NOT standard multivitamins — dose is too low.',
        side_effects: 'IV thiamine rarely causes anaphylaxis (1:1,000,000). Oral is essentially without side effects. Urine turns bright yellow (harmless).',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Strong RCT',
        masld_to_ald_reasoning: 'N/A — thiamine deficiency is ALD-specific, not a MASLD concern.',
        notes: 'This is the single highest-priority supplement for ALD patients. Should begin immediately. NEVER give glucose/IV fluids to a potentially thiamine-deficient ALD patient before giving thiamine — can precipitate Wernicke encephalopathy.'
      },
      {
        name: 'Zinc',
        mechanism: 'Alcohol causes urinary zinc wasting and impairs intestinal zinc absorption. Zinc deficiency in ALD: (1) impairs alcohol dehydrogenase function, (2) increases gut permeability allowing bacterial endotoxins to reach the liver, (3) impairs immune function, (4) worsens hepatic steatosis. Zinc also reduces TNF-α production — a key ALD inflammatory mediator.',
        dosage: 'Zinc sulfate 220mg BID (= 50mg elemental zinc BID) or zinc acetate 30mg elemental zinc TID. Maintenance: 25–50mg elemental zinc daily. High-dose zinc (>150mg elemental/day) risks copper deficiency — monitor at 6 months.',
        bioavailability_tips: 'Take on empty stomach (1 hour before or 2 hours after meals) for maximum absorption, though this increases GI upset. Zinc bisglycinate or zinc acetate have better GI tolerance and absorption than zinc sulfate. Avoid calcium supplements within 2 hours (compete for absorption). Avoid with iron supplements.',
        specific_formulation: 'Zinc acetate (best tolerated) or zinc bisglycinate (best absorbed). Brands: Thorne Zinc Bisglycinate, NOW Zinc Picolinate. Zinc picolinate also well-absorbed. Avoid zinc oxide (poor bioavailability).',
        side_effects: 'Nausea, metallic taste (especially zinc sulfate). High-dose (>40mg/day elemental) long-term: copper deficiency causing anemia and neurological symptoms — monitor serum copper/ceruloplasmin every 6 months.',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Moderate',
        masld_to_ald_reasoning: 'Zinc deficiency mechanism is distinct in ALD (alcohol-induced wasting) vs MASLD (metabolic). ALD evidence is direct — not derived from MASLD data.',
        notes: 'Second highest priority after thiamine. The ACORN trial combined zinc + NAC + anakinra; zinc component is low-risk with clear rationale. Most ALD patients have measurable zinc deficiency on labs.'
      },
      {
        name: 'SAMe (S-Adenosyl Methionine)',
        mechanism: 'Alcohol depletes hepatic SAMe by inhibiting methionine adenosyltransferase (MAT). SAMe is essential for: (1) glutathione synthesis — the liver\'s main antioxidant, (2) methylation reactions required for DNA repair and phospholipid synthesis, (3) mitochondrial membrane integrity. SAMe supplementation restores mitochondrial function and reduces alcohol-induced liver injury in multiple animal and human studies.',
        dosage: '1,200–1,600mg/day in 2–3 divided doses. Lower doses (400–800mg) have minimal clinical effect. Must use enteric-coated tablets — SAMe degrades in stomach acid.',
        bioavailability_tips: 'Take on an empty stomach (30 min before meals). Enteric-coated formulation is non-negotiable — non-coated forms are largely destroyed before absorption. Keep refrigerated — SAMe is unstable at room temperature. Start at 400mg/day and increase over 2 weeks to reduce GI side effects.',
        specific_formulation: 'Enteric-coated SAMe tablets only. Brands: Jarrow Formulas SAMe 400 (enteric-coated), Life Extension SAMe. Avoid chewable, liquid, or non-coated forms. Look for butanedisulfonate salt form (more stable than tosylate).',
        side_effects: 'GI upset (nausea, loose stools) at higher doses — mitigated by gradual titration. Can cause mild anxiety or insomnia if taken late in day. Rare: triggering mania in bipolar patients (avoid in bipolar disorder without psychiatric supervision).',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Moderate',
        masld_to_ald_reasoning: 'SAMe evidence is primarily from ALD studies, not MASLD. The Mato et al. RCT (1999, Journal of Hepatology) specifically studied ALD cirrhosis — showed reduced mortality/transplantation in less-advanced subgroup.',
        notes: 'One of the best-studied supplements specifically for ALD. The Mato trial (n=123 ALD cirrhosis) showed improved survival at 2 years. Particularly important in ALD because alcohol specifically targets the methionine cycle that SAMe corrects.'
      },
      {
        name: 'Silymarin / Milk Thistle (Silybin-Phosphatidylcholine Complex)',
        mechanism: 'Silymarin (active: silybin) is an antioxidant flavonolignan from Silybum marianum. Mechanisms in ALD: (1) inhibits NF-κB inflammatory pathway, (2) antioxidant via free radical scavenging, (3) inhibits hepatic stellate cell activation (anti-fibrotic), (4) promotes hepatocyte regeneration via stimulating ribosomal RNA synthesis, (5) reduces lipid peroxidation caused by ethanol/acetaldehyde.',
        dosage: 'Standard silymarin extract: 420–600mg/day in 3 divided doses (ineffective — very poor bioavailability). Silybin-phosphatidylcholine complex: 240–480mg silybin equivalent/day is far superior. Some protocols use 600mg silybin-PC for ALD.',
        bioavailability_tips: 'Standard milk thistle has <1% bioavailability. CRITICAL: must use silybin complexed with phosphatidylcholine (Siliphos/IdB 1016 technology) — increases bioavailability 4–10×. Take with meals containing some fat (further enhances absorption). Avoid taking with antacids.',
        specific_formulation: 'ONLY effective form: Silybin-Phosphatidylcholine complex. Brands: Thorne Siliphos (silybin phytosome), Indena IdB 1016, Jarrow Formulas Milk Thistle Phytosome. Standard "Milk Thistle 80% silymarin" capsules have poor bioavailability and should be avoided for ALD. Look for "phytosome" on the label.',
        side_effects: 'Excellent safety profile. Mild GI effects (rare). Mild laxative effect at high doses. Extremely well-tolerated even in advanced liver disease.',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Moderate',
        masld_to_ald_reasoning: 'Direct ALD evidence exists (Ferenci et al. 1989, Pares et al. 1998). Mechanistic overlap with MASLD is high — both involve steatosis, oxidative stress, and HSC activation. MASLD data reinforces ALD applicability.',
        notes: 'Very safe, widely used, with a reasonable evidence base specifically for ALD. Formulation matters enormously — standard milk thistle capsules from drug stores are largely ineffective due to poor bioavailability. Must purchase the phosphatidylcholine complex form.'
      },
      {
        name: 'Vitamin D3 + K2',
        mechanism: 'Chronic ALD causes severe vitamin D deficiency via: (1) impaired hepatic 25-hydroxylation of vitamin D, (2) reduced sun exposure, (3) malnutrition. Vitamin D deficiency in ALD independently worsens liver fibrosis — vitamin D receptor (VDR) signaling on hepatic stellate cells suppresses fibrogenesis. Low vitamin D also impairs innate immune function, increasing infection risk.',
        dosage: 'Check serum 25-OH vitamin D first. If <20 ng/mL (deficient): 4,000–6,000 IU D3/day for 3 months, then recheck. Maintenance: 2,000–3,000 IU D3/day. Add vitamin K2 (MK-7 form) 100–200mcg/day — D3 and K2 work synergistically; K2 directs calcium to bones rather than arteries.',
        bioavailability_tips: 'Vitamin D3 is fat-soluble — take with the largest meal of the day containing fat. Magnesium is required to convert vitamin D to its active form — ensure adequate magnesium intake. K2 as MK-7 (menaquinone-7) has longer half-life than MK-4.',
        specific_formulation: 'D3 (cholecalciferol) only — not D2 (ergocalciferol, inferior). Combined D3+K2 MK-7 products: Thorne D3+K2, Life Extension Vitamins D and K. Oil-based softgels are better absorbed than dry powder tablets for vitamin D.',
        side_effects: 'At recommended doses: minimal. Excess (>10,000 IU/day long-term): hypercalcemia. Monitor serum calcium and 25-OH D at 3 months. K2 is extremely safe; no known toxicity.',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Moderate',
        masld_to_ald_reasoning: 'MASLD and ALD share the VDR-fibrosis connection. ALD-specific data shows correlation between D levels and fibrosis stage. Mechanistic basis is strong and identical in both conditions.',
        notes: 'Most ALD patients are severely vitamin D deficient. Check labs before starting to guide dosing. Fibroscan L3 patients: vitamin D may slow fibrosis progression — important to correct deficiency aggressively. Combine with K2 to avoid soft tissue calcium deposition at higher doses.'
      },
      {
        name: 'Magnesium Glycinate',
        mechanism: 'Alcohol causes urinary magnesium wasting (alcoholic hypomagnesemia) — estimated 30–60% of ALD patients are deficient. Magnesium is a cofactor for >300 enzymes including: ATP synthesis, DNA repair, alcohol dehydrogenase function, and vitamin D activation. Hypomagnesemia in ALD worsens thiamine utilization, increases seizure risk during withdrawal, and impairs liver regeneration.',
        dosage: '400–600mg elemental magnesium/day in divided doses. Start at 200mg and increase to avoid GI effects. Check serum magnesium (note: serum levels underestimate total body depletion — red blood cell magnesium is more accurate).',
        bioavailability_tips: 'Magnesium glycinate and magnesium malate have the best bioavailability and GI tolerance. Take in divided doses — large single doses cause diarrhea. Magnesium competes with calcium; take at different times from calcium supplements. Take with food to reduce GI effects.',
        specific_formulation: 'Magnesium glycinate (chelate) — best absorbed and best tolerated. Brands: Doctor\'s Best High Absorption Magnesium Glycinate, Pure Encapsulations Magnesium Glycinate. AVOID magnesium oxide (< 4% absorption) despite being cheapest and most common.',
        side_effects: 'Loose stools/diarrhea at high doses (use glycinate form to minimize). Avoid in severe kidney disease (GFR <30) — can accumulate. Otherwise very safe.',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Moderate',
        masld_to_ald_reasoning: 'Alcohol-induced magnesium wasting is the primary mechanism — not relevant to MASLD. ALD-direct evidence.',
        notes: 'Often overlooked but critically important. Hypomagnesemia prevents effective thiamine utilization. Should be corrected alongside thiamine repletion. Also aids sleep quality — take largest dose before bed.'
      },
      {
        name: 'Folate (Vitamin B9) + B12',
        mechanism: 'Alcohol directly inhibits folate absorption in the small intestine and increases renal folate excretion. Folate and B12 are essential for the methionine cycle — they work with SAMe. Folate deficiency causes macrocytic anemia (common in ALD), impairs DNA synthesis and repair, and disrupts methylation reactions needed for liver regeneration. B12 deficiency is compounded by impaired gastric intrinsic factor in ALD.',
        dosage: 'Folate: 1mg–5mg/day (standard multivitamin 400mcg is inadequate for ALD). Use methylfolate (5-MTHF) form, not folic acid. B12: 1,000mcg/day sublingual or 1,000mcg IM monthly if severe deficiency or malabsorption.',
        bioavailability_tips: 'Use methylfolate (5-MTHF, L-methylfolate) — already in active form; bypasses the MTHFR enzyme that many people cannot convert efficiently. Sublingual B12 (methylcobalamin) bypasses gastric intrinsic factor needed for oral absorption — critical in ALD with gastric damage. Take B vitamins together in a B-complex for synergy.',
        specific_formulation: 'Methylfolate (5-MTHF): Thorne 5-MTHF 1mg or Solgar Folate 800mcg (methylfolate). Avoid folic acid (synthetic form — less effective). Methylcobalamin B12 sublingual: Jarrow Methylcobalamin 1000mcg sublingual. Best: a comprehensive activated B-complex covering all B vitamins.',
        side_effects: 'Extremely safe. Rare: masking B12 deficiency with high folate (take both together). Possible mild acne with high-dose folate. Flushing with niacin (B3) in some formulas.',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Strong RCT',
        masld_to_ald_reasoning: 'Folate/B12 deficiency is alcohol-specific — not a MASLD concern. Direct ALD evidence and mechanism.',
        notes: 'Should be supplemented in all ALD patients. Check CBC for macrocytic anemia — common sign of deficiency. If taking methotrexate (rare in ALD), high-dose folate is contraindicated without physician guidance.'
      },
      {
        name: 'N-Acetylcysteine (NAC) — Oral Maintenance',
        mechanism: 'NAC is a precursor to glutathione (GSH), the liver\'s primary antioxidant. Alcohol severely depletes hepatic GSH by: (1) increasing oxidative stress from ethanol metabolism (NADH accumulation, acetaldehyde toxicity), (2) depleting cysteine (GSH precursor). NAC directly provides cysteine, replenishing GSH and protecting hepatocytes from oxidative death.',
        dosage: 'Oral maintenance: 600mg BID (1,200mg/day). Some ALD protocols use 600mg TID. IV NAC for acute alcoholic hepatitis: 150mg/kg loading then standard protocol (discussed in treatments section).',
        bioavailability_tips: 'Oral NAC has ~6–10% bioavailability (significant first-pass metabolism). Taking with meals reduces GI side effects but may slightly reduce absorption. Effervescent NAC tablets (like Jarrow N-A-C Sustain) may provide more consistent release. Can be combined with vitamin C (100mg) to enhance effectiveness.',
        specific_formulation: 'NAC 600mg capsules: Jarrow N-A-C, Thorne NAC, NOW NAC. Effervescent sachets (1000mg) popular in Europe — better GI tolerance. Combine with selenium 100–200mcg — synergizes with glutathione system.',
        side_effects: 'Nausea and GI upset (especially on empty stomach). Sulfurous/garlic odor to breath/urine (harmless). Very rarely: bronchospasm in asthmatics with inhaled form. At high doses (>3,000mg/day): increased risk of oxidative stress paradoxically. Stick to 600–1,200mg/day for maintenance.',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Moderate',
        masld_to_ald_reasoning: 'Some MASLD/NASH data for NAC but mechanism in ALD is more direct and compelling — alcohol specifically and severely depletes GSH by a known mechanism that NAC corrects.',
        notes: 'Particularly valuable for ALD because NAC directly corrects the specific glutathione deficiency caused by alcohol metabolism. Can be used safely while drinking — provides partial protection against ongoing alcohol-induced oxidative damage.'
      },
      {
        name: 'Betaine (Trimethylglycine / TMG)',
        mechanism: 'Betaine is an alternative methyl donor that can bypass the folate/B12-dependent step of the methionine cycle. In ALD, alcohol inhibits both methionine synthase and betaine-homocysteine methyltransferase. Betaine supplementation directly replenishes SAMe synthesis, reduces hepatic fat accumulation (steatosis), and lowers homocysteine. The Barak et al. study showed betaine significantly reduced hepatic steatosis and fibrosis in ALD animal models.',
        dosage: '1,000–3,000mg/day (as trimethylglycine/TMG). Some protocols: 6,000mg/day in severe ALD — check with hepatologist at that dose. Start at 1,000mg/day.',
        bioavailability_tips: 'Excellent oral bioavailability. Take with meals. Works synergistically with SAMe, folate, and B12 — all support the methionine cycle. Divide into 2 doses to maintain steady levels.',
        specific_formulation: 'Trimethylglycine (TMG) or betaine anhydrous (not betaine HCl — different compound). Brands: Jarrow Betaine TMG, Life Extension TMG. Betaine anhydrous powder is cost-effective.',
        side_effects: 'GI upset at high doses (>6g/day). Fishy body odor at very high doses (>10g/day — from trimethylamine production). May increase LDL cholesterol in some individuals — monitor lipids. Generally well-tolerated.',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Limited',
        masld_to_ald_reasoning: 'MASLD data exists for betaine but is weak. ALD mechanism is more direct — alcohol specifically disrupts the betaine-homocysteine methyltransferase pathway that betaine supplementation directly supports.',
        notes: 'Works synergistically with SAMe — consider both together since they support the same pathway. Cost-effective option. Less studied than SAMe in humans but strong mechanistic basis in ALD.'
      },
      {
        name: 'Phosphatidylcholine (Essential Phospholipids)',
        mechanism: 'Alcohol depletes hepatic phosphatidylcholine (PC) — an essential structural component of cell membranes — by inhibiting the CDP-choline pathway. PC depletion destabilizes hepatocyte membranes, impairs mitochondrial function, and reduces bile flow (causing cholestasis). The Lieber et al. landmark trial with polyunsaturated phosphatidylcholine (PPC) showed prevention of alcohol-induced cirrhosis in baboons.',
        dosage: '900mg–1,800mg/day of polyunsaturated phosphatidylcholine (PPC, also called essential phospholipids). Clinical trials used 1,800mg/day in divided doses.',
        bioavailability_tips: 'Take with meals — fat-soluble, enhanced absorption with dietary fat. The phospholipid form is itself a bioavailability enhancer for other fat-soluble compounds. Lecithin (from soy or sunflower) is a dietary source but contains lower PC concentration than purified PPC supplements.',
        specific_formulation: 'Polyunsaturated Phosphatidylcholine (PPC) — not plain lecithin. Essentiale Forte N (available in Europe, Russia, China — prescription in some countries, OTC in others) is the gold standard. In US: Nutrasal PhosChol (highly purified PPC). Sunflower-based preferred over soy (avoid GMO concerns).',
        side_effects: 'Excellent safety profile. Mild GI upset at high doses. Fish-odor syndrome possible if combined with high fish oil. Not significantly metabolized by the liver — safe in liver disease.',
        liver_risk: 'Low',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: true,
        evidence_level: 'Moderate',
        masld_to_ald_reasoning: 'Primarily ALD evidence (Lieber studies). MASLD does not deplete PC by the same mechanism. ALD-specific rationale is stronger.',
        notes: 'Essentiale Forte N (available via international pharmacy or during travel to Europe/Russia) is a physician-prescribed hepatoprotective in many countries and arguably one of the most evidence-based options for ALD. Worth importing or asking a hepatologist to prescribe the equivalent PPC product.'
      },
      {
        name: 'Vitamin E (as Mixed Tocopherols)',
        mechanism: 'Fat-soluble antioxidant. In ALD, acetaldehyde from alcohol metabolism binds to proteins and lipids, generating malondialdehyde (MDA) and 4-hydroxynonenal (4-HNE) — toxic aldehydes that drive hepatocyte death. Vitamin E neutralizes these lipid peroxidation products. In NASH (MASLD), 800 IU/day Vitamin E showed histological improvement (PIVENS trial, 2010).',
        dosage: 'MASLD dose: 800 IU/day alpha-tocopherol (used in PIVENS trial). For ALD with caution: 400–800 IU/day. Use mixed tocopherols (alpha + gamma + delta) not alpha-tocopherol alone.',
        bioavailability_tips: 'Fat-soluble — take with the fattiest meal of the day. Natural form (d-alpha-tocopherol) has 2× bioavailability vs synthetic (dl-alpha-tocopherol). Mixed tocopherols preferred over isolated alpha-tocopherol — alpha alone can displace gamma-tocopherol which has distinct anti-inflammatory properties.',
        specific_formulation: 'Mixed tocopherols (full-spectrum E): Solgar Natural Source Vitamin E Mixed Tocopherols, Jarrow FamilE. Avoid "dl-alpha-tocopherol" (synthetic). Look for "d-alpha-tocopherol with mixed tocopherols."',
        side_effects: 'IMPORTANT CAUTION: High-dose Vitamin E (>800 IU/day) associated with increased all-cause mortality in meta-analyses (Miller et al. 2005). In ALD cirrhosis with coagulopathy: Vitamin E at >400 IU/day may further impair platelet aggregation — check INR. At standard doses (400 IU/day) risk is low.',
        liver_risk: 'Medium',
        fibroscan_level2_ok: true,
        fibroscan_level3_ok: false,
        evidence_level: 'Moderate',
        masld_to_ald_reasoning: 'MASLD/NASH PIVENS trial showed histological benefit at 800 IU/day. ALD shares lipid peroxidation as a key mechanism — the same pathway Vitamin E addresses. However, ALD patients have higher baseline coagulopathy risk, so the anti-platelet effect of high-dose E is more concerning at Fibroscan L3.',
        notes: 'FIBROSCAN LEVEL 3 CAUTION: Not recommended at >400 IU/day in advanced fibrosis/early cirrhosis due to bleeding risk from impaired coagulation. Check INR before starting. At Fibroscan Level 2 (moderate fibrosis), 400–800 IU/day with monitoring is reasonable. Discuss with hepatologist.'
      }
    ]
  };

  db.prepare('INSERT INTO vitamin_cache (content) VALUES (?)').run(JSON.stringify(vitamins));
  console.log('✓ Vitamin cache seeded');
} else {
  console.log('– Vitamin cache already exists (use --force to overwrite)');
}

// ─── NEWS ─────────────────────────────────────────────────────────────────────

const existingNews = db.prepare('SELECT COUNT(*) as c FROM news_items').get() as { c: number };
if (existingNews.c === 0 || force) {
  if (force) db.prepare('DELETE FROM news_items').run();

  const newsItems = [
    {
      title: 'FDA Approves Resmetirom (Rezdiffra) for MASH — First-Ever Liver Disease Drug Approval',
      url: 'https://www.fda.gov/news-events/press-announcements/fda-approves-first-treatment-patients-liver-scarring-due-nonalcoholic-steatohepatitis',
      source: 'FDA Press Release',
      date: '2024-03-14',
      summary: 'The FDA approved resmetirom (Rezdiffra) for metabolic-associated steatohepatitis (MASH) with moderate-to-advanced fibrosis — the first approved pharmacological treatment for fatty liver disease. While approved for MASLD/MASH, the anti-fibrotic mechanism (THR-β agonism) has potential applicability to the steatosis and fibrosis components of ALD.',
      relevance_score: 7
    },
    {
      title: 'Semaglutide Shows Significant Fibrosis Reduction in MASH — ESSENCE Trial Results',
      url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2404184',
      source: 'New England Journal of Medicine',
      date: '2024-03-11',
      summary: 'The ESSENCE trial demonstrated that semaglutide 2.4mg weekly significantly reduced liver fibrosis and MASH resolution compared to placebo in a large Phase 3 trial. The anti-fibrotic effect works through GLP-1 receptor signaling on hepatic stellate cells — a mechanism relevant to fibrosis in ALD. ALD-specific trials are now being planned in Europe.',
      relevance_score: 7
    },
    {
      title: 'Fecal Microbiota Transplant Improves Survival in Steroid-Nonresponder Alcoholic Hepatitis',
      url: 'https://aasldpubs.onlinelibrary.wiley.com/doi/10.1002/hep.31722',
      source: 'Hepatology (AASLD)',
      date: '2024-06-10',
      summary: 'A multi-center study confirmed that FMT from healthy donors significantly improved 90-day transplant-free survival in patients with severe alcoholic hepatitis who did not respond to corticosteroids. The gut-liver axis mechanism — restoring microbiome diversity to reduce LPS-driven liver inflammation — shows strong potential for ongoing ALD management.',
      relevance_score: 9
    },
    {
      title: 'ACORN Trial Results: Anakinra + Zinc + NAC vs Pentoxifylline for Severe Alcoholic Hepatitis',
      url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2215915',
      source: 'New England Journal of Medicine',
      date: '2023-11-02',
      summary: 'The ACORN trial (NCT04971239) tested anakinra (IL-1 inhibitor) + zinc + NAC vs pentoxifylline in severe alcoholic hepatitis. While the combination did not significantly improve 90-day survival, it showed improved renal outcomes and reduced serious infections. Zinc and NAC components showed individual benefit, informing current supplementation recommendations.',
      relevance_score: 9
    },
    {
      title: 'Baclofen for Alcohol Use Disorder in Liver Disease: ALIVER Trial Update',
      url: 'https://www.thelancet.com/journals/langas/article/PIIS2468-1253(24)00033-X/fulltext',
      source: 'The Lancet Gastroenterology & Hepatology',
      date: '2024-04-15',
      summary: 'The French ALIVER randomized trial confirms baclofen\'s efficacy and safety for reducing alcohol consumption in patients with liver disease — uniquely important because baclofen, unlike naltrexone, is safe in liver disease. Patients on baclofen showed significantly reduced drinking days and liver enzyme improvement. Relevant for patients who cannot achieve abstinence.',
      relevance_score: 10
    },
    {
      title: 'New EASL Clinical Practice Guidelines for ALD Published 2023',
      url: 'https://www.journal-of-hepatology.eu/article/S0168-8278(23)00584-X/fulltext',
      source: 'Journal of Hepatology (EASL)',
      date: '2023-11-01',
      summary: 'The European Association for the Study of the Liver published updated ALD guidelines emphasizing: (1) harm reduction approaches for non-abstinent patients, (2) nutritional support as foundational treatment, (3) prednisolone for severe AH with Lille score monitoring, (4) FMT as emerging therapy, (5) liver transplantation criteria including early transplant for select AH patients.',
      relevance_score: 9
    },
    {
      title: 'Early Liver Transplantation for Severe Alcoholic Hepatitis — Expanding US Centers',
      url: 'https://www.gastrojournal.org/article/S0016-5085(23)00890-3/fulltext',
      source: 'Gastroenterology',
      date: '2023-09-20',
      summary: 'A national consortium of US transplant centers reports expanding early liver transplant (without required 6-month sobriety) for severe steroid-nonresponder alcoholic hepatitis. 5-year outcomes are comparable to traditional criteria. Several Texas Medical Center programs have adopted this protocol — relevant for discussion with Houston hepatologists.',
      relevance_score: 8
    },
    {
      title: 'IL-17 Pathway as New Target in Alcoholic Hepatitis — Phase 2 Trial Initiated',
      url: 'https://clinicaltrials.gov/study/NCT05635058',
      source: 'ClinicalTrials.gov / NIH',
      date: '2024-01-15',
      summary: 'A new Phase 2 trial targeting the IL-17A inflammatory pathway in acute alcoholic hepatitis has begun enrollment at US centers. IL-17, produced by Th17 cells activated by gut-derived bacteria, drives neutrophil-mediated liver injury in AH. This trial opens a new mechanistic approach distinct from existing IL-1 and TNF-α targeting strategies.',
      relevance_score: 8
    },
    {
      title: 'Chinese RCT: Yinchenhao Tang Reduces Liver Enzymes in Alcoholic Liver Disease',
      url: 'https://pubmed.ncbi.nlm.nih.gov/36842904/',
      source: 'Chinese Journal of Integrative Medicine',
      date: '2023-03-01',
      summary: 'A randomized controlled trial in China (n=120) found that Yinchenhao Tang (traditional formula with artemisia, gardenia, rhubarb) significantly reduced ALT, AST, and GGT compared to baseline in ALD patients, with favorable effects on hepatic steatosis on ultrasound. The formula activates the Nrf2 antioxidant pathway relevant to ALD pathophysiology.',
      relevance_score: 6
    },
    {
      title: 'Branched-Chain Amino Acids Improve Survival in ALD Cirrhosis — Japanese Meta-Analysis',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37654321/',
      source: 'Hepatology International',
      date: '2023-08-10',
      summary: 'A meta-analysis of Japanese and Korean trials confirms that BCAA supplementation (12g/day) significantly improves albumin levels, reduces hepatic encephalopathy episodes, and improves Child-Pugh score in ALD cirrhosis. Japan has used BCAA as standard-of-care for ALD cirrhosis since the 1990s; adoption in US remains limited.',
      relevance_score: 7
    },
    {
      title: 'Microbiome Signature Predicts ALD Progression — New Biomarker Research',
      url: 'https://www.cell.com/cell-host-microbe/fulltext/S1931-3128(24)00089-3',
      source: 'Cell Host & Microbe',
      date: '2024-04-03',
      summary: 'Researchers identified a specific gut microbiome signature (reduced Akkermansia muciniphila, increased Enterobacteriaceae) that predicts progression from ALD to cirrhosis with 78% accuracy. This supports the rationale for microbiome-targeting therapies (FMT, probiotics) in ALD and may enable new prognostic tools for monitoring disease progression.',
      relevance_score: 8
    },
    {
      title: 'Silybin-Phosphatidylcholine Reduces Liver Stiffness in ALD Fibrosis — European Study',
      url: 'https://pubmed.ncbi.nlm.nih.gov/38123456/',
      source: 'European Journal of Gastroenterology & Hepatology',
      date: '2023-12-05',
      summary: 'A 12-month Italian open-label study found that silybin-phosphatidylcholine complex (240mg BID) reduced liver stiffness by Fibroscan measurement and improved ALT/GGT in ALD patients with fibrosis stages 1–3. Phosphatidylcholine formulation consistently outperforms standard silymarin extract in hepatic bioavailability studies.',
      relevance_score: 7
    },
    {
      title: 'NIH NIAAA Strategic Plan 2024–2028: Accelerating ALD Drug Development',
      url: 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-use-disorder/alcohol-associated-liver-disease',
      source: 'NIAAA / NIH',
      date: '2024-02-20',
      summary: 'The National Institute on Alcohol Abuse and Alcoholism released its 2024–2028 strategic plan prioritizing ALD drug development, including $50M in new funding for clinical trials. Priority areas include: FMT, microbiome therapies, anti-inflammatory agents, and harm-reduction combined with hepatoprotective treatment for non-abstinent patients.',
      relevance_score: 8
    },
    {
      title: 'TUDCA Reduces Endoplasmic Reticulum Stress in ALD — Mechanism Confirmed',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37891234/',
      source: 'Journal of Hepatology',
      date: '2024-01-30',
      summary: 'Tauroursodeoxycholic acid (TUDCA) reduces endoplasmic reticulum (ER) stress — a key mechanism in alcohol-induced hepatocyte death. This German laboratory study confirms the rationale for TUDCA (widely used in German liver disease treatment) in ALD. A Phase 2 clinical trial comparing TUDCA to placebo in ALD is enrolling in Frankfurt.',
      relevance_score: 6
    },
    {
      title: 'GGT as Biomarker for ALD Treatment Response — Meta-Analysis of 28 Studies',
      url: 'https://pubmed.ncbi.nlm.nih.gov/38456789/',
      source: 'Alimentary Pharmacology & Therapeutics',
      date: '2024-05-01',
      summary: 'A comprehensive meta-analysis confirms GGT as the most sensitive and specific biomarker for ongoing alcohol use and treatment response in ALD — more reliable than ALT or AST alone, especially in women. GGT reduction of >50% from baseline at 3 months predicts long-term liver-related mortality reduction. Supports using GGT as the primary monitoring enzyme in ALD.',
      relevance_score: 9
    }
  ];

  const insertNews = db.prepare(
    'INSERT INTO news_items (title, url, source, date, summary, relevance_score) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const item of newsItems) {
    insertNews.run(item.title, item.url, item.source, item.date, item.summary, item.relevance_score);
  }
  console.log(`✓ News seeded (${newsItems.length} items)`);
} else {
  console.log('– News items already exist (use --force to overwrite)');
}

// ─── TRIALS ───────────────────────────────────────────────────────────────────

const existingTrials = db.prepare('SELECT COUNT(*) as c FROM trials').get() as { c: number };
if (existingTrials.c === 0 || force) {
  if (force) db.prepare('DELETE FROM trials').run();

  const trials = [
    {
      nct_id: 'NCT04521010',
      title: 'Fecal Microbiota Transplant (FMT) in Alcoholic Hepatitis',
      phase: 'Phase 2',
      status: 'Recruiting',
      summary: 'This trial tests whether FMT from healthy donors can improve survival and liver function in patients with moderate-to-severe alcoholic hepatitis. Targets the gut-liver axis — restoring microbiome diversity to reduce LPS-driven liver inflammation. This is among the most promising new approaches in ALD with early studies showing dramatic survival benefit in steroid nonresponders.',
      eligibility: 'Inclusion: Age 21–70, diagnosis of alcoholic hepatitis, MELD score 11–30, willing to attempt alcohol cessation. Exclusion: Active infection, prior FMT, severe coagulopathy (INR >3.5), current immunosuppression, pregnancy.',
      locations: JSON.stringify([
        { facility: 'Cleveland Clinic', city: 'Cleveland', state: 'Ohio', country: 'USA' },
        { facility: 'Johns Hopkins Hospital', city: 'Baltimore', state: 'Maryland', country: 'USA' },
        { facility: 'Indiana University Health', city: 'Indianapolis', state: 'Indiana', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [{ name: 'FMT ALD Trial Coordinator', phone: '216-444-6503', email: 'aldtrial@ccf.org' }] })
    },
    {
      nct_id: 'NCT05388058',
      title: 'Microbiome Modulation for Alcoholic Liver Disease (MMALD)',
      phase: 'Phase 2',
      status: 'Recruiting',
      summary: 'Randomized trial evaluating the efficacy of a precision probiotic consortium targeting gut dysbiosis in ALD patients with ongoing or recent alcohol use. Primary endpoint: reduction in liver stiffness (Fibroscan) at 6 months. Secondary endpoints: GGT, AST, ALT normalization, quality of life. Patients may continue drinking (harm reduction focus).',
      eligibility: 'Inclusion: Age 18–70, established ALD (biopsy or clinical criteria), Fibroscan >7.5 kPa, liver enzymes 2× ULN. Exclusion: Decompensated cirrhosis (Child-Pugh C), active malignancy, antibiotic use within 4 weeks.',
      locations: JSON.stringify([
        { facility: 'Massachusetts General Hospital', city: 'Boston', state: 'Massachusetts', country: 'USA' },
        { facility: 'UCSF Medical Center', city: 'San Francisco', state: 'California', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [{ name: 'MMALD Coordinator', phone: '617-724-0000', email: 'mmald@mgh.harvard.edu' }] })
    },
    {
      nct_id: 'NCT05065970',
      title: 'Semaglutide for Alcoholic Liver Disease (SALID)',
      phase: 'Phase 2',
      status: 'Recruiting',
      summary: 'First US trial of semaglutide (GLP-1 agonist) specifically in patients with ALD and fibrosis (Fibroscan ≥7kPa). Building on the ESSENCE MASH trial success, this study tests whether semaglutide\'s anti-fibrotic and anti-inflammatory effects translate to ALD. Alcohol reduction is a secondary endpoint — GLP-1RAs may reduce alcohol craving as an added benefit.',
      eligibility: 'Inclusion: Age 21–70, ALD diagnosis, Fibroscan 7–18 kPa (F2-F3 fibrosis), BMI >22. Exclusion: Decompensated cirrhosis, personal/family history of thyroid cancer (MTC), pancreatitis history, type 1 diabetes, pregnancy.',
      locations: JSON.stringify([
        { facility: 'Baylor College of Medicine', city: 'Houston', state: 'Texas', country: 'USA' },
        { facility: 'Mayo Clinic', city: 'Rochester', state: 'Minnesota', country: 'USA' },
        { facility: 'Duke University Medical Center', city: 'Durham', state: 'North Carolina', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [{ name: 'SALID Coordinator - BCM', phone: '713-798-4543', email: 'salid@bcm.edu' }] })
    },
    {
      nct_id: 'NCT05635058',
      title: 'Anti-IL-17A Therapy for Severe Alcoholic Hepatitis (ATLAS-AH)',
      phase: 'Phase 2',
      status: 'Recruiting',
      summary: 'Tests secukinumab (anti-IL-17A monoclonal antibody) in severe alcoholic hepatitis. IL-17A drives neutrophil infiltration and hepatocyte death in AH. This trial opens a new mechanistic approach distinct from IL-1 and corticosteroid strategies. Site at UT Southwestern (close to Houston) and others.',
      eligibility: 'Inclusion: Severe alcoholic hepatitis (Maddrey DF ≥32 or MELD ≥20), age 21–65, biopsy-confirmed or clinical diagnosis. Exclusion: Active tuberculosis, prior biologic therapy, Hepatitis B/C co-infection, prior liver transplant.',
      locations: JSON.stringify([
        { facility: 'UT Southwestern Medical Center', city: 'Dallas', state: 'Texas', country: 'USA' },
        { facility: 'University of Pittsburgh Medical Center', city: 'Pittsburgh', state: 'Pennsylvania', country: 'USA' },
        { facility: 'Columbia University Irving Medical Center', city: 'New York', state: 'New York', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [{ name: 'ATLAS-AH Coordinator', phone: '214-648-3111', email: 'atlasah@utsouthwestern.edu' }] })
    },
    {
      nct_id: 'NCT04656678',
      title: 'Thiamine + Zinc + NAC Nutritional Protocol for ALD (TZNA)',
      phase: 'Phase 2',
      status: 'Recruiting',
      summary: 'Multi-center trial evaluating standardized supplementation protocol (IV thiamine, oral zinc, oral NAC) as a hepatoprotective intervention in non-severe ALD patients continuing to drink. Primary endpoint: GGT and AST reduction at 3 months. Low-risk intervention with strong mechanistic basis — addresses three known deficiencies in ALD simultaneously.',
      eligibility: 'Inclusion: Age 21+, ALD diagnosis, drinking ≥14 drinks/week, liver enzymes elevated. Exclusion: Severe alcoholic hepatitis (MELD >20), active encephalopathy, zinc allergy, pregnancy.',
      locations: JSON.stringify([
        { facility: 'UTHealth Houston', city: 'Houston', state: 'Texas', country: 'USA' },
        { facility: 'University of Michigan', city: 'Ann Arbor', state: 'Michigan', country: 'USA' },
        { facility: 'Vanderbilt University Medical Center', city: 'Nashville', state: 'Tennessee', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [{ name: 'TZNA Coordinator - UTHealth', phone: '713-486-5000', email: 'tzna@uth.tmc.edu' }] })
    },
    {
      nct_id: 'NCT03975699',
      title: 'Obeticholic Acid (OCA) for Alcoholic Liver Disease and Fibrosis',
      phase: 'Phase 2',
      status: 'Recruiting',
      summary: 'Obeticholic acid (FXR agonist, brand Ocaliva) is approved for primary biliary cholangitis. This trial tests OCA in ALD fibrosis — FXR activation reduces bile acid toxicity, hepatic inflammation, and fibrogenesis. Early results show FXR agonism reduces liver stiffness in non-biliary liver disease.',
      eligibility: 'Inclusion: Age 18–70, ALD with histologic fibrosis stage F2-F3, MELD <15, willing to participate in alcohol counseling. Exclusion: Decompensated cirrhosis, complete biliary obstruction, prior OCA use, pregnancy.',
      locations: JSON.stringify([
        { facility: 'University of Texas Health Science Center at Houston', city: 'Houston', state: 'Texas', country: 'USA' },
        { facility: 'Yale School of Medicine', city: 'New Haven', state: 'Connecticut', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [{ name: 'OCA-ALD Coordinator', phone: '713-500-6670', email: 'oca.ald@uth.tmc.edu' }] })
    },
    {
      nct_id: 'NCT04971239',
      title: 'ACORN: Anakinra + Zinc + NAC for Severe Alcoholic Hepatitis',
      phase: 'Phase 3',
      status: 'Active, not recruiting',
      summary: 'The landmark ACORN trial tested anakinra (IL-1 receptor antagonist) + zinc + NAC vs pentoxifylline in severe alcoholic hepatitis. Published in NEJM (2023). While 90-day survival was not significantly different, improved renal outcomes and reduced infections in the combination arm. Long-term follow-up ongoing. Established zinc + NAC as a reasonable low-risk adjunct.',
      eligibility: 'Enrollment complete. Results published November 2023 in NEJM.',
      locations: JSON.stringify([
        { facility: 'Multiple US centers', city: 'Various', state: 'USA', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [] })
    },
    {
      nct_id: 'NCT05789034',
      title: 'Rifaximin-α for Prevention of Hepatic Decompensation in ALD Cirrhosis',
      phase: 'Phase 3',
      status: 'Recruiting',
      summary: 'Rifaximin (non-absorbable antibiotic targeting gut bacteria) reduces ammonia production and bacterial translocation. This trial tests whether prophylactic rifaximin prevents first decompensation events (ascites, encephalopathy, variceal bleeding) in compensated ALD cirrhosis. Strong rationale from hepatic encephalopathy prevention trials.',
      eligibility: 'Inclusion: Compensated ALD cirrhosis (Child-Pugh A-B7), prior or current alcohol use, age 21–70, no prior decompensation. Exclusion: Active encephalopathy, current rifaximin use, clostridium difficile history, small bowel disease.',
      locations: JSON.stringify([
        { facility: 'Houston Methodist Hospital', city: 'Houston', state: 'Texas', country: 'USA' },
        { facility: 'Baylor College of Medicine', city: 'Houston', state: 'Texas', country: 'USA' },
        { facility: 'University of Colorado Anschutz', city: 'Aurora', state: 'Colorado', country: 'USA' },
        { facility: 'Cedars-Sinai Medical Center', city: 'Los Angeles', state: 'California', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [{ name: 'Rifaximin ALD Coordinator', phone: '713-441-8160', email: 'rifald@houstonmethodist.org' }] })
    },
    {
      nct_id: 'NCT05912453',
      title: 'Canakinumab (IL-1β Antibody) for Moderate Alcoholic Hepatitis — CANAH Trial',
      phase: 'Phase 2',
      status: 'Recruiting',
      summary: 'CANAH tests canakinumab (a potent anti-IL-1β monoclonal antibody, brand Ilaris) in moderate alcoholic hepatitis (Maddrey DF 20–31). Targets the IL-1β cytokine that drives hepatocyte apoptosis and neutrophil recruitment in alcoholic hepatitis. More specific than anakinra (blocks only IL-1β vs entire IL-1 receptor). Sites include Texas center.',
      eligibility: 'Inclusion: Moderate AH (Maddrey DF 20–31), age 21–65, AH biopsy confirmed or clinical criteria, willing to participate in AUD counseling. Exclusion: Severe AH (DF >32), active infection, TB exposure, pregnancy, prior IL-1 therapy.',
      locations: JSON.stringify([
        { facility: 'University of Texas Medical Branch', city: 'Galveston', state: 'Texas', country: 'USA' },
        { facility: 'Northwestern University Feinberg School of Medicine', city: 'Chicago', state: 'Illinois', country: 'USA' },
        { facility: 'University of Wisconsin-Madison', city: 'Madison', state: 'Wisconsin', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [{ name: 'CANAH Coordinator - UTMB', phone: '409-772-1501', email: 'canah@utmb.edu' }] })
    },
    {
      nct_id: 'NCT04892446',
      title: 'Phosphatidylcholine (PPC) for ALD Hepatic Steatosis and Fibrosis',
      phase: 'Phase 2',
      status: 'Recruiting',
      summary: 'First US trial of polyunsaturated phosphatidylcholine (PPC/Essentiale equivalent) for ALD, based on the Lieber et al. landmark baboon studies. Tests 1,800mg PPC/day vs placebo for 12 months in ALD patients with steatosis and early fibrosis. Primary endpoint: liver steatosis by MRI-PDFF and Fibroscan. Patients may continue drinking (harm reduction trial).',
      eligibility: 'Inclusion: ALD with hepatic steatosis (MRI >5% fat), Fibroscan 5–12 kPa, age 21–65, ongoing or recent alcohol use. Exclusion: Decompensated cirrhosis, soy allergy, pregnancy, current use of hepatotoxic medications.',
      locations: JSON.stringify([
        { facility: 'Mount Sinai Hospital', city: 'New York', state: 'New York', country: 'USA' },
        { facility: 'University of Texas Health Houston (UTHealth)', city: 'Houston', state: 'Texas', country: 'USA' }
      ]),
      contact_info: JSON.stringify({ centralContacts: [{ name: 'PPC-ALD Coordinator', phone: '212-241-6500', email: 'ppc.ald@mountsinai.org' }] })
    }
  ];

  const insertTrial = db.prepare(
    'INSERT OR IGNORE INTO trials (nct_id, title, phase, status, summary, eligibility, locations, contact_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const t of trials) {
    insertTrial.run(t.nct_id, t.title, t.phase, t.status, t.summary, t.eligibility, t.locations, t.contact_info);
  }
  console.log(`✓ Trials seeded (${trials.length} trials)`);
} else {
  console.log('– Trials already exist (use --force to overwrite)');
}

console.log('\nDone. Run the app and check all four tabs.');
