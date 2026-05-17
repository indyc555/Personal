import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runWebSearchQuery } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();

    // Get recent health records (last 30 days or last 20 records)
    const records = db.prepare(`
      SELECT * FROM health_records ORDER BY date DESC LIMIT 20
    `).all() as Array<{
      id: number;
      date: string;
      test_name: string;
      value: number;
      unit: string;
      reference_range: string | null;
      notes: string | null;
    }>;

    const alcoholLogs = db.prepare(`
      SELECT * FROM alcohol_log ORDER BY date DESC LIMIT 10
    `).all() as Array<{ date: string; amount_ml: number }>;

    if (records.length === 0) {
      return NextResponse.json({
        summary: 'No health records found to analyze. Please add lab results first.',
        confidence_level: 0,
        sources: []
      });
    }

    const recordsSummary = records.map(r =>
      `${r.date}: ${r.test_name} = ${r.value} ${r.unit}${r.reference_range ? ` (ref: ${r.reference_range})` : ''}${r.notes ? ` [${r.notes}]` : ''}`
    ).join('\n');

    const alcoholSummary = alcoholLogs.map(a =>
      `${a.date}: ${a.amount_ml} mL`
    ).join('\n');

    const prompt = `You are analyzing lab results for a patient named Ananya Sarkar who has Alcoholic Liver Disease (ALD). She has been drinking since approximately 2011, had a severe collapse in 2018, went through rehab, but restarted drinking. Current alcohol intake: approximately 300 mL/day (2 glasses wine equivalent). Today is 2026-05-17.

Recent lab results:
${recordsSummary}

Recent alcohol intake log:
${alcoholSummary}

Please analyze these results in the context of Alcoholic Liver Disease. Use web search to find current medical literature and guidelines.

Provide:
1. A clear interpretation of each lab value (what it means for ALD)
2. Overall liver health assessment based on these values
3. Trend analysis if multiple values are available
4. Key concerns or red flags
5. Recommendations for monitoring
6. Confidence level (0-100%) for your assessment
7. List specific sources/studies you referenced

Format as a structured medical summary. Be specific about ALD implications. Include confidence levels for major statements.`;

    const analysis = await runWebSearchQuery(prompt);

    // Extract a rough confidence level from the text (look for percentage mentions)
    let confidence = 75; // default
    const confidenceMatch = analysis.match(/(\d{1,3})%\s*confidence/i);
    if (confidenceMatch) {
      confidence = parseInt(confidenceMatch[1]);
    }

    // Store the analysis
    const recordIds = records.map(r => r.id).join(',');
    db.prepare(`
      INSERT INTO ai_analyses (summary, confidence_level, sources, record_ids)
      VALUES (?, ?, ?, ?)
    `).run(analysis, confidence, JSON.stringify([]), recordIds);

    return NextResponse.json({
      summary: analysis,
      confidence_level: confidence,
      sources: []
    });
  } catch (error) {
    console.error('POST /api/analyze error:', error);
    return NextResponse.json({
      error: 'Failed to run AI analysis. Please check your ANTHROPIC_API_KEY.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
