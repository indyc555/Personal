import { NextRequest, NextResponse } from 'next/server';
import { runChat } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages array' }, { status: 400 });
    }

    const systemPrompt = `You are a medical research assistant helping manage care for Ananya Sarkar who has Alcoholic Liver Disease (ALD). She has been drinking since approximately 2011, had a severe collapse in 2018, went through rehab, quit, but restarted. Previously drinking 4 glasses of wine/day for years; in 2026 reduced to 2 glasses/day. Current alcohol intake: 300 mL/day as of 2026-05-17. Today is 2026-05-17.

Focus on evidence-based information and always indicate confidence levels. Be compassionate and non-judgmental. Provide practical information about managing ALD, treatments, medications, vitamins, clinical trials, and quality of life. When discussing treatments, consider that Ananya continues to drink and provide information relevant to that context. Always recommend consulting her hepatologist for medical decisions.`;

    const reply = await runChat(messages, systemPrompt);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json({
      error: 'Failed to get chat response. Please check your ANTHROPIC_API_KEY.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
