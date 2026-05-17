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
      SELECT * FROM treatment_cache
      WHERE datetime(created_at) > datetime('now', '-24 hours')
      ORDER BY created_at DESC LIMIT 1
    `).get() as { content: string } | undefined;

    if (cached) {
      return NextResponse.json({ data: JSON.parse(cached.content), cached: true });
    }
  }

  try {
    const prompt = `Research current treatment options for Alcoholic Liver Disease (ALD) for a patient who continues to drink (reduction but not cessation). The patient is Ananya Sarkar, currently drinking ~300 mL/day (equivalent to ~2 glasses wine), with established ALD and possible Fibroscan Level 2-3 fibrosis.

Please search for and compile:

1. CURRENT STANDARD TREATMENTS for ALD (including for patients who continue drinking):
   - Corticosteroids (prednisolone) for alcoholic hepatitis
   - N-acetylcysteine (NAC)
   - Pentoxifylline
   - Nutritional support
   - Harm reduction approaches

2. EMERGING/EXPERIMENTAL TREATMENTS (2023-2026):
   - FXR agonists (obeticholic acid, tropifexor)
   - IL-1 blockers (anakinra, canakinumab)
   - Anti-CXCL10/CXCR3
   - Microbiome-based therapies
   - Fecal microbiota transplant (FMT) for ALD
   - ASK1 inhibitors
   - Anti-fibrotics

3. INTERNATIONAL OPTIONS (China, Japan, Western Europe):
   - TCM (Traditional Chinese Medicine) hepatoprotective herbs with evidence
   - Japanese kampo medicine for liver disease
   - European EMA-approved treatments not available in US
   - Clinical approaches in EU for ALD harm reduction

4. MASLD/MAFLD DRUGS WITH ALD APPLICABILITY:
   - Resmetirom (Rezdiffra) - thyroid receptor beta agonist
   - Lanifibranor (PPAR agonist)
   - Semaglutide/GLP-1 agonists for liver fibrosis
   - Explain mechanistic reasoning for ALD applicability

5. SUPPLEMENTS WITH CLINICAL EVIDENCE:
   - SAMe (S-adenosyl methionine)
   - Silymarin/Milk thistle
   - Zinc supplementation
   - Thiamine/B vitamins

For EACH treatment, provide:
- Treatment name and class
- Evidence level (RCT, observational, case series)
- Mechanism of action in ALD
- Safety notes for patients still drinking
- Whether it can be used with ongoing alcohol consumption
- Key studies/sources
- Approximate confidence level (%)

Format as structured JSON-friendly text with clear sections.`;

    const content = await runWebSearchQuery(prompt);

    // Parse and structure the content
    const structuredContent = {
      raw: content,
      generated_at: new Date().toISOString(),
      treatments: parseTraeatments(content)
    };

    // Cache the result
    db.prepare('INSERT INTO treatment_cache (content) VALUES (?)')
      .run(JSON.stringify(structuredContent));

    return NextResponse.json({ data: structuredContent, cached: false });
  } catch (error) {
    console.error('GET /api/treatment error:', error);

    // Try to return stale cache if available
    const staleCache = db.prepare('SELECT * FROM treatment_cache ORDER BY created_at DESC LIMIT 1').get() as { content: string } | undefined;
    if (staleCache) {
      return NextResponse.json({
        data: JSON.parse(staleCache.content),
        cached: true,
        stale: true,
        error: 'Using cached data due to API error'
      });
    }

    return NextResponse.json({
      error: 'Failed to fetch treatment information. Please check your ANTHROPIC_API_KEY.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function parseTraeatments(content: string) {
  // Simple extraction - in production you'd use structured output
  const sections = [];
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.match(/^\d+\./)) {
      if (currentSection) {
        sections.push({ title: currentSection, content: currentContent.join('\n') });
      }
      currentSection = line;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    sections.push({ title: currentSection, content: currentContent.join('\n') });
  }

  return sections;
}
