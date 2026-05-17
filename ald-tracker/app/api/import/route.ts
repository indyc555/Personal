import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAnthropicClient } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text field' }, { status: 400 });
    }

    const client = getAnthropicClient();

    const prompt = `You are a medical data extraction assistant. Parse the following medical history text and extract all lab results and health measurements.

For each lab result found, extract:
- date (in YYYY-MM-DD format; if only month/year known, use first of month)
- test_name (standardized: ALT, AST, GGT, ALP, Total Bilirubin, Albumin, INR, Platelet Count, Creatinine, Sodium, WBC, Hemoglobin, MELD Score, Fibroscan Score, or other relevant names)
- value (numeric only)
- unit (e.g., U/L, g/dL, mg/dL, INR, x10^9/L, g/L, kPa, etc.)
- reference_range (if mentioned, e.g., "10-40")
- notes (any relevant clinical context)

Return ONLY a valid JSON array with objects containing these exact fields. If a date is unclear, make a reasonable estimate. If a value cannot be extracted as a number, skip it.

Example output format:
[
  {"date": "2024-03-15", "test_name": "ALT", "value": 89, "unit": "U/L", "reference_range": "7-56", "notes": "Elevated"},
  {"date": "2024-03-15", "test_name": "AST", "value": 112, "unit": "U/L", "reference_range": "10-40", "notes": ""}
]

Medical history text to parse:
${text}

Return only the JSON array, no other text.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const rawText = textBlock ? (textBlock as { type: 'text'; text: string }).text : '[]';

    // Extract JSON from the response
    let records: Array<{
      date: string;
      test_name: string;
      value: number;
      unit: string;
      reference_range?: string;
      notes?: string;
    }> = [];

    try {
      // Try to find JSON array in the response
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        records = JSON.parse(jsonMatch[0]);
      }
    } catch {
      return NextResponse.json({
        error: 'Failed to parse AI response as JSON',
        raw: rawText
      }, { status: 500 });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({
        message: 'No lab records could be extracted from the text',
        records: [],
        imported: 0
      });
    }

    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT INTO health_records (date, test_name, value, unit, reference_range, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        if (!record.date || !record.test_name || record.value === undefined || !record.unit) {
          errors.push(`Skipped incomplete record: ${JSON.stringify(record)}`);
          continue;
        }
        insertStmt.run(
          record.date,
          record.test_name,
          record.value,
          record.unit,
          record.reference_range || null,
          record.notes || null
        );
        imported++;
      } catch (err) {
        errors.push(`Failed to insert record: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${imported} records`,
      records,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('POST /api/import error:', error);
    return NextResponse.json({
      error: 'Failed to import medical history. Please check your ANTHROPIC_API_KEY.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
