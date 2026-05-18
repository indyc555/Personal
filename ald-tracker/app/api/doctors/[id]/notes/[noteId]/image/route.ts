import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const db = getDb();
    const note = db.prepare('SELECT image_data, image_media_type FROM doctor_notes WHERE id = ?').get(noteId) as
      | { image_data: string | null; image_media_type: string | null }
      | undefined;

    if (!note?.image_data) {
      return NextResponse.json({ error: 'No image found' }, { status: 404 });
    }

    const buffer = Buffer.from(note.image_data, 'base64');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': note.image_media_type || 'image/jpeg',
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch (error) {
    console.error('GET note image error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
