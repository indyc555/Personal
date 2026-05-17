import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const records = db.prepare(`
      SELECT * FROM health_records ORDER BY date DESC, created_at DESC
    `).all();
    const alcoholLogs = db.prepare(`
      SELECT * FROM alcohol_log ORDER BY date DESC
    `).all();
    const latestAnalysis = db.prepare(`
      SELECT * FROM ai_analyses ORDER BY created_at DESC LIMIT 1
    `).get();

    return NextResponse.json({ records, alcoholLogs, latestAnalysis });
  } catch (error) {
    console.error('GET /api/health error:', error);
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, test_name, value, unit, reference_range, notes } = body;

    if (!date || !test_name || value === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO health_records (date, test_name, value, unit, reference_range, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(date, test_name, value, unit, reference_range || null, notes || null);

    return NextResponse.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    console.error('POST /api/health error:', error);
    return NextResponse.json({ error: 'Failed to save health record' }, { status: 500 });
  }
}
