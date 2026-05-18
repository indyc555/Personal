import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function lastNameKey(name: string): string {
  // Strip "Dr." / "Dr " prefix, then take last word as sort key
  const stripped = name.replace(/^Dr\.?\s*/i, '').trim();
  const parts = stripped.split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM doctors').all() as Array<Record<string, unknown>>;
    const doctors = rows.sort((a, b) =>
      lastNameKey(a.name as string).localeCompare(lastNameKey(b.name as string))
    );
    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('GET /api/doctors error:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, practice, address, phone, specialties, reputation_notes, lat, lng } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO doctors (name, practice, address, phone, specialties, reputation_notes, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      practice?.trim() || null,
      address?.trim() || null,
      phone?.trim() || null,
      specialties?.trim() || null,
      reputation_notes?.trim() || null,
      lat ? parseFloat(lat) : null,
      lng ? parseFloat(lng) : null,
    );

    return NextResponse.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    console.error('POST /api/doctors error:', error);
    return NextResponse.json({ error: 'Failed to add doctor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const db = getDb();
    db.prepare('DELETE FROM doctor_notes WHERE doctor_id = ?').run(id);
    db.prepare('DELETE FROM doctors WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/doctors error:', error);
    return NextResponse.json({ error: 'Failed to delete doctor' }, { status: 500 });
  }
}
