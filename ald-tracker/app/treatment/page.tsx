'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pill, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TreatmentSection {
  title: string;
  content: string;
}

interface TreatmentData {
  raw: string;
  generated_at: string;
  treatments: TreatmentSection[];
}

const EVIDENCE_COLORS: Record<string, string> = {
  'strong': 'bg-green-100 text-green-700',
  'rct': 'bg-green-100 text-green-700',
  'moderate': 'bg-yellow-100 text-yellow-700',
  'limited': 'bg-orange-100 text-orange-700',
  'theoretical': 'bg-slate-100 text-slate-600',
};

function getEvidenceColor(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, cls] of Object.entries(EVIDENCE_COLORS)) {
    if (lower.includes(key)) return cls;
  }
  return 'bg-slate-100 text-slate-600';
}

export default function TreatmentPage() {
  const [data, setData] = useState<TreatmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/treatment${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json.data);
      setIsCached(json.cached || false);
      // Expand all sections by default
      if (json.data?.treatments) {
        const expanded: Record<number, boolean> = {};
        json.data.treatments.forEach((_: TreatmentSection, i: number) => { expanded[i] = true; });
        setExpandedSections(expanded);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load treatment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSection = (i: number) => {
    setExpandedSections(prev => ({ ...prev, [i]: !prev[i] }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex gap-2 text-slate-500">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading treatment data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="text-purple-500" size={24} />
            Treatment Options
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Current and emerging ALD treatments — including for patients who continue drinking</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Researching...' : 'Refresh Research'}
        </button>
      </div>

      {isCached && data && (
        <div className="mb-4 flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-sm">
          <Clock size={14} />
          <span>Cached results from {format(new Date(data.generated_at), 'MMM d, yyyy HH:mm')}. Click &quot;Refresh Research&quot; to update.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Note:</strong> This research focuses on treatments applicable to patients who continue to drink. Always consult your hepatologist before starting any treatment.
      </div>

      {data ? (
        <div className="space-y-4">
          {data.treatments && data.treatments.length > 0 ? (
            data.treatments.map((section, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                  onClick={() => toggleSection(i)}
                >
                  <h2 className="font-semibold text-slate-900">{section.title}</h2>
                  {expandedSections[i] ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>
                {expandedSections[i] && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="pt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            // Show raw content if structured parsing failed
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {data.raw}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-400">
          <Pill size={32} className="mx-auto mb-2 opacity-40" />
          <p className="mb-4">No treatment data yet. Click &quot;Refresh Research&quot; to fetch current ALD treatment information.</p>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
          >
            {refreshing ? 'Loading...' : 'Load Treatment Data'}
          </button>
        </div>
      )}

      {/* Evidence Legend */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">Evidence Level Guide</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EVIDENCE_COLORS).map(([level, cls]) => (
            <span key={level} className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>{level}</span>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Evidence levels from clinical studies. Higher evidence = more reliable data.</p>
      </div>
    </div>
  );
}
