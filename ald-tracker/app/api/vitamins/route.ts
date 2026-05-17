import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runWebSearchQuery } from '@/lib/claude';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get('refresh') === 'true';
  const db = getDb();

  // Check cache (24 hour TTL)
  if (!refresh) {
    const cached = db.prepare(`
      SELECT * FROM vitamin_cache
      WHERE datetime(created_at) > datetime('now', '-24 hours')
      ORDER BY created_at DESC LIMIT 1
    `).get() as { content: string } | undefined;

    if (cached) {
      return NextResponse.json({ data: JSON.parse(cached.content), cached: true });
    }
  }

  try {
    const prompt = `Research vitamins and supplements specifically helpful for Alcoholic Liver Disease (ALD) patients. The patient is Ananya Sarkar, drinking ~300 mL/day (2 glasses wine), with established ALD and possible Fibroscan Level 2-3 liver fibrosis.

For each vitamin/supplement, provide detailed information:

1. ESSENTIAL VITAMINS FOR ALD (deficiency is common):
   - Thiamine (B1) - dosage, IV vs oral, when to use
   - Folate (B9)
   - B12
   - Vitamin D3
   - Zinc
   - Magnesium
   - Vitamin K

2. HEPATOPROTECTIVE SUPPLEMENTS WITH EVIDENCE:
   - SAMe (S-adenosyl methionine) - focus on ALD-specific evidence
   - Silymarin/Milk Thistle (Silybum marianum) - dosage, formulation matters
   - Phosphatidylcholine (essential phospholipids)
   - N-acetylcysteine (NAC)
   - Alpha-lipoic acid (with caution notes)
   - Betaine (trimethylglycine)

3. MASLD SUPPLEMENTS WITH MECHANISTIC REASONING FOR ALD:
   - Vitamin E (NASH data, ALD application)
   - Omega-3 fatty acids
   - Probiotics (gut-liver axis)
   - Berberine
   - Resveratrol

For EACH supplement, provide:
- name: exact supplement name
- mechanism: specific mechanism in ALD (e.g., "reduces oxidative stress via GSH pathway")
- dosage: specific dosage recommendation
- bioavailability_tips: how to maximize absorption (e.g., "take with food", "phospholipid complex enhances absorption")
- specific_formulation: exact formulation needed (e.g., "phosphatidylcholine complex", "silybin-phosphatidylcholine", not just "milk thistle")
- side_effects: notable side effects especially with liver disease
- liver_risk: safety assessment for compromised liver (Low/Medium/High risk)
- fibroscan_level2_ok: boolean - safe for Fibroscan Level 2 fibrosis
- fibroscan_level3_ok: boolean - safe for Fibroscan Level 3 fibrosis
- evidence_level: quality of evidence (Strong RCT / Moderate / Limited / Theoretical)
- masld_to_ald_reasoning: if applicable, why MASLD data applies to ALD
- notes: any important notes about interaction with alcohol or ALD-specific considerations

Return as JSON array. Return only the JSON, no other text.

Format:
[
  {
    "name": "...",
    "mechanism": "...",
    "dosage": "...",
    "bioavailability_tips": "...",
    "specific_formulation": "...",
    "side_effects": "...",
    "liver_risk": "Low",
    "fibroscan_level2_ok": true,
    "fibroscan_level3_ok": true,
    "evidence_level": "Moderate",
    "masld_to_ald_reasoning": "...",
    "notes": "..."
  }
]`;

    const content = await runWebSearchQuery(prompt);

    let vitamins = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        vitamins = JSON.parse(jsonMatch[0]);
      }
    } catch {
      vitamins = [];
    }

    const structuredContent = {
      raw: content,
      generated_at: new Date().toISOString(),
      vitamins: Array.isArray(vitamins) ? vitamins : []
    };

    // Cache result
    db.prepare('INSERT INTO vitamin_cache (content) VALUES (?)').run(JSON.stringify(structuredContent));

    return NextResponse.json({ data: structuredContent, cached: false });
  } catch (error) {
    console.error('GET /api/vitamins error:', error);

    const staleCache = db.prepare('SELECT * FROM vitamin_cache ORDER BY created_at DESC LIMIT 1').get() as { content: string } | undefined;
    if (staleCache) {
      return NextResponse.json({
        data: JSON.parse(staleCache.content),
        cached: true,
        stale: true,
        error: 'Using cached data due to API error'
      });
    }

    return NextResponse.json({
      error: 'Failed to fetch vitamin information. Please check your ANTHROPIC_API_KEY.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
