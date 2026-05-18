import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const notes = db.prepare(
      'SELECT id, doctor_id, date, note_text, image_media_type, created_at FROM doctor_notes WHERE doctor_id = ? ORDER BY date DESC, created_at DESC'
    ).all(id);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET doctor notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, note_text, image_data, image_media_type } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }
    if (!note_text && !image_data) {
      return NextResponse.json({ error: 'Provide note text or an image' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(
      'INSERT INTO doctor_notes (doctor_id, date, note_text, image_data, image_media_type) VALUES (?, ?, ?, ?, ?)'
    ).run(id, date, note_text || null, image_data || null, image_media_type || null);

    return NextResponse.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    console.error('POST doctor notes error:', error);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { noteId } = await request.json();
    const db = getDb();
    db.prepare('DELETE FROM doctor_notes WHERE id = ? AND doctor_id = ?').run(noteId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE doctor note error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
