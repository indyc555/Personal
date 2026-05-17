'use client';

import { useState, useEffect, useCallback } from 'react';
import { Newspaper, RefreshCw, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface NewsItem {
  id: number;
  title: string;
  url: string | null;
  source: string;
  date: string;
  summary: string;
  relevance_score: number;
  created_at: string;
}

function RelevanceBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? 'bg-green-100 text-green-700' :
    score >= 6 ? 'bg-blue-100 text-blue-700' :
    score >= 4 ? 'bg-yellow-100 text-yellow-700' :
    'bg-slate-100 text-slate-600';
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${color}`}>
      {score}/10 relevance
    </span>
  );
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/news${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setItems(json.items || []);
      setIsCached(json.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex gap-2 text-slate-500">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading news...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Newspaper className="text-orange-500" size={24} />
            ALD News & Research
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Latest developments in Alcoholic Liver Disease treatment</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Searching...' : 'Refresh News'}
        </button>
      </div>

      {isCached && items.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-sm">
          <Clock size={14} />
          <span>Showing cached results. Click &quot;Refresh News&quot; to fetch latest.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{item.source}</span>
                    <span className="text-xs text-slate-400">{item.date}</span>
                    <RelevanceBadge score={item.relevance_score} />
                  </div>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-900 text-sm hover:text-blue-600 transition-colors flex items-start gap-1 group"
                    >
                      {item.title}
                      <ExternalLink size={12} className="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{item.summary}</p>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-400">
          <Newspaper size={32} className="mx-auto mb-2 opacity-40" />
          <p className="mb-4">No news yet. Click &quot;Refresh News&quot; to fetch the latest ALD research.</p>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm"
          >
            {refreshing ? 'Loading...' : 'Load News'}
          </button>
        </div>
      )}
    </div>
  );
}
