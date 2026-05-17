import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, amount_ml, notes } = body;

    if (!date || amount_ml === undefined) {
      return NextResponse.json({ error: 'Missing required fields: date, amount_ml' }, { status: 400 });
    }

    const db = getDb();

    // Check if there's already an entry for this date; if so, update it
    const existing = db.prepare('SELECT id FROM alcohol_log WHERE date = ?').get(date) as { id: number } | undefined;

    if (existing) {
      db.prepare('UPDATE alcohol_log SET amount_ml = ?, notes = ? WHERE date = ?')
        .run(amount_ml, notes || null, date);
    } else {
      db.prepare('INSERT INTO alcohol_log (date, amount_ml, notes) VALUES (?, ?, ?)')
        .run(date, amount_ml, notes || null);
    }

    // Update patient info
    db.prepare('INSERT OR REPLACE INTO patient_info (key, value) VALUES (?, ?)')
      .run('current_intake_ml', String(amount_ml));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/alcohol error:', error);
    return NextResponse.json({ error: 'Failed to log alcohol intake' }, { status: 500 });
  }
}
