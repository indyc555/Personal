import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const notes = db.prepare(`
      SELECT dn.id, dn.doctor_id, dn.date, dn.note_text, dn.image_media_type, dn.created_at,
             d.name as doctor_name
      FROM doctor_notes dn
      JOIN doctors d ON d.id = dn.doctor_id
      ORDER BY dn.date DESC, dn.created_at DESC
    `).all();
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET /api/doctors/notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
