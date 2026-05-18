import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAnthropicClient } from '@/lib/claude';
import Anthropic from '@anthropic-ai/sdk';

const EXTRACTION_PROMPT = `You are a medical data extraction assistant. Parse the provided medical content (lab report, doctor notes, or image of a lab result) and extract all lab results and health measurements.

For each lab result found, extract:
- date (in YYYY-MM-DD format; if only month/year known, use first of month; if no date found use today's date 2026-05-18)
- test_name (standardized: ALT, AST, GGT, ALP, Total Bilirubin, Albumin, INR, Platelet Count, Creatinine, Sodium, WBC, Hemoglobin, MELD Score, Fibroscan Score, GGT Enzyme, AST/ALT Ratio, eGFR, BUN, Glucose, Total Protein, or other relevant names)
- value (numeric only; null if non-numeric)
- unit (e.g., U/L, g/dL, mg/dL, INR, x10^9/L, kPa, etc.)
- reference_range (if mentioned, e.g., "10-40")
- notes (any relevant clinical context or flags like "elevated", "low", "critical")

Return ONLY a valid JSON array. Skip rows with no extractable numeric value unless it's an imaging/scoring result.

Example output:
[
  {"date": "2024-03-15", "test_name": "ALT", "value": 89, "unit": "U/L", "reference_range": "7-56", "notes": "Elevated"},
  {"date": "2024-03-15", "test_name": "AST", "value": 112, "unit": "U/L", "reference_range": "10-40", "notes": ""}
]

Return only the JSON array, no other text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, image, mediaType } = body;

    if (!text && !image) {
      return NextResponse.json({ error: 'Provide either text or image' }, { status: 400 });
    }

    const client = getAnthropicClient();

    // Build message content — text or vision
    let messageContent: Anthropic.MessageParam['content'];

    if (image) {
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: (mediaType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: image,
          },
        },
        {
          type: 'text',
          text: EXTRACTION_PROMPT,
        },
      ];
    } else {
      messageContent = `${EXTRACTION_PROMPT}\n\nMedical content to parse:\n${text}`;
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: messageContent }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const rawText = textBlock ? (textBlock as { type: 'text'; text: string }).text : '[]';

    let records: Array<{
      date: string;
      test_name: string;
      value: number | null;
      unit: string;
      reference_range?: string;
      notes?: string;
    }> = [];

    try {
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
        message: 'No lab records could be extracted',
        records: [],
        imported: 0
      });
    }

    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT INTO health_records (date, test_name, value, value_text, unit, reference_range, notes, is_abnormal)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    let imported = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        if (!record.date || !record.test_name || !record.unit) {
          errors.push(`Skipped incomplete record: ${JSON.stringify(record)}`);
          continue;
        }
        insertStmt.run(
          record.date,
          record.test_name,
          record.value ?? null,
          null,
          record.unit,
          record.reference_range || null,
          record.notes || null
        );
        imported++;
      } catch (err) {
        errors.push(`Failed to insert: ${err instanceof Error ? err.message : String(err)}`);
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
      error: 'Failed to import. Please check your ANTHROPIC_API_KEY.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
