import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runWebSearchQuery } from '@/lib/claude';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get('refresh') === 'true';
  const db = getDb();

  // Check cache (12 hour TTL unless refresh)
  if (!refresh) {
    const cached = db.prepare(`
      SELECT COUNT(*) as count FROM news_items
      WHERE datetime(created_at) > datetime('now', '-12 hours')
    `).get() as { count: number };

    if (cached.count > 0) {
      const items = db.prepare(`
        SELECT * FROM news_items ORDER BY relevance_score DESC, date DESC LIMIT 50
      `).all();
      return NextResponse.json({ items, cached: true });
    }
  }

  try {
    const prompt = `Search for the latest news and research about Alcoholic Liver Disease (ALD) treatment from 2024-2026. Find:

1. New clinical trial results for ALD treatments
2. FDA approvals or rejections for ALD medications
3. Breakthrough research in ALD management
4. International developments (Europe, Asia) in ALD treatment
5. New guidelines for ALD management
6. Patient advocacy news for ALD
7. Promising drug candidates in Phase 2/3 trials for ALD

For each news item, provide:
- Title
- Source (journal, news outlet, organization)
- Date (YYYY-MM-DD format)
- URL (if available)
- 2-3 sentence summary
- Relevance score 1-10 (10 = most relevant to a patient with established ALD who continues to drink)

Format as a JSON array:
[
  {
    "title": "...",
    "source": "...",
    "date": "2025-03-15",
    "url": "https://...",
    "summary": "...",
    "relevance_score": 8
  }
]

Search comprehensively and return 15-20 items. Return only the JSON array.`;

    const content = await runWebSearchQuery(prompt);

    // Extract JSON from response
    let items: Array<{
      title: string;
      source: string;
      date: string;
      url: string;
      summary: string;
      relevance_score: number;
    }> = [];

    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, create a single item with the raw content
      items = [{
        title: 'ALD Research Update',
        source: 'AI Research Summary',
        date: new Date().toISOString().split('T')[0],
        url: '',
        summary: content.substring(0, 500),
        relevance_score: 7
      }];
    }

    if (!Array.isArray(items)) items = [];

    // Clear old items and insert new ones
    if (refresh) {
      db.prepare('DELETE FROM news_items').run();
    }

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO news_items (title, url, source, date, summary, relevance_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      try {
        insertStmt.run(
          item.title || 'Untitled',
          item.url || null,
          item.source || 'Unknown',
          item.date || new Date().toISOString().split('T')[0],
          item.summary || '',
          item.relevance_score || 5
        );
      } catch {
        // Skip duplicates
      }
    }

    const allItems = db.prepare(`
      SELECT * FROM news_items ORDER BY relevance_score DESC, date DESC LIMIT 50
    `).all();

    return NextResponse.json({ items: allItems, cached: false });
  } catch (error) {
    console.error('GET /api/news error:', error);

    // Return cached data if available
    const cachedItems = db.prepare(`
      SELECT * FROM news_items ORDER BY relevance_score DESC, date DESC LIMIT 50
    `).all();

    if (cachedItems.length > 0) {
      return NextResponse.json({
        items: cachedItems,
        cached: true,
        stale: true,
        error: 'Using cached data due to API error'
      });
    }

    return NextResponse.json({
      error: 'Failed to fetch news. Please check your ANTHROPIC_API_KEY.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
