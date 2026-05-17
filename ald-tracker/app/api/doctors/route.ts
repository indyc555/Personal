import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const doctors = db.prepare('SELECT * FROM doctors ORDER BY name ASC').all();
    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('GET /api/doctors error:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}
