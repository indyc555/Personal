'use client';

import { useState, useEffect, useCallback } from 'react';
import { Beaker, RefreshCw, AlertCircle, Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

interface Vitamin {
  name: string;
  mechanism: string;
  dosage: string;
  bioavailability_tips: string;
  specific_formulation: string;
  side_effects: string;
  liver_risk: string;
  fibroscan_level2_ok: boolean;
  fibroscan_level3_ok: boolean;
  evidence_level: string;
  masld_to_ald_reasoning?: string;
  notes: string;
}

interface VitaminData {
  raw: string;
  generated_at: string;
  vitamins: Vitamin[];
}

const RISK_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
};

const EVIDENCE_COLORS: Record<string, string> = {
  'Strong RCT': 'bg-green-100 text-green-700',
  'Moderate': 'bg-blue-100 text-blue-700',
  'Limited': 'bg-yellow-100 text-yellow-700',
  'Theoretical': 'bg-slate-100 text-slate-600',
};

function EvidenceBadge({ level }: { level: string }) {
  const cls = Object.entries(EVIDENCE_COLORS).find(([k]) => level?.includes(k))?.[1] || 'bg-slate-100 text-slate-600';
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>{level || 'Unknown'}</span>;
}

function RiskBadge({ risk }: { risk: string }) {
  const cls = RISK_COLORS[risk] || 'bg-slate-100 text-slate-600';
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>{risk} risk</span>;
}

export default function VitaminsPage() {
  const [data, setData] = useState<VitaminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState('');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/vitamins${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json.data);
      setIsCached(json.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vitamin data');
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
          <span>Loading vitamin data...</span>
        </div>
      </div>
    );
  }

  const vitamins = data?.vitamins || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Beaker className="text-green-500" size={24} />
            Vitamins & Supplements
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Evidence-based supplements for ALD liver support</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg text-sm transition-colors"
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

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <strong>Fibroscan Level 2:</strong> Mild-moderate fibrosis. Most supplements shown safe.
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <strong>Fibroscan Level 3:</strong> Advanced fibrosis. More caution required; consult hepatologist.
        </div>
      </div>

      {vitamins.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {vitamins.map((v, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-semibold text-slate-900">{v.name}</h2>
                  <div className="flex flex-col items-end gap-1">
                    <EvidenceBadge level={v.evidence_level} />
                    <RiskBadge risk={v.liver_risk} />
                  </div>
                </div>

                {/* Fibroscan compatibility */}
                <div className="flex gap-3 mb-3">
                  <div className="flex items-center gap-1 text-xs">
                    {v.fibroscan_level2_ok !== false
                      ? <CheckCircle size={14} className="text-green-500" />
                      : <XCircle size={14} className="text-red-500" />}
                    <span className={v.fibroscan_level2_ok !== false ? 'text-green-700' : 'text-red-700'}>
                      Fibroscan L2
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {v.fibroscan_level3_ok !== false
                      ? <CheckCircle size={14} className="text-green-500" />
                      : <XCircle size={14} className="text-red-500" />}
                    <span className={v.fibroscan_level3_ok !== false ? 'text-green-700' : 'text-red-700'}>
                      Fibroscan L3
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-2 leading-relaxed">{v.mechanism}</p>

                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-1.5">
                    <span className="font-semibold text-slate-700 w-28 flex-shrink-0">Dosage:</span>
                    <span className="text-slate-600">{v.dosage}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="font-semibold text-slate-700 w-28 flex-shrink-0">Formulation:</span>
                    <span className="text-slate-600">{v.specific_formulation}</span>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                  className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Info size={12} />
                  {expandedCard === i ? 'Show less' : 'Show more details'}
                </button>

                {expandedCard === i && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">Bioavailability tips:</span>
                      <p className="text-slate-600 mt-0.5">{v.bioavailability_tips}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Side effects:</span>
                      <p className="text-slate-600 mt-0.5">{v.side_effects}</p>
                    </div>
                    {v.masld_to_ald_reasoning && (
                      <div>
                        <span className="font-semibold text-blue-700">MASLD→ALD reasoning:</span>
                        <p className="text-slate-600 mt-0.5">{v.masld_to_ald_reasoning}</p>
                      </div>
                    )}
                    {v.notes && (
                      <div>
                        <span className="font-semibold text-slate-700">Notes:</span>
                        <p className="text-slate-600 mt-0.5">{v.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : data ? (
        // Fallback: show raw text if JSON parsing failed
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {data.raw}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-400">
          <Beaker size={32} className="mx-auto mb-2 opacity-40" />
          <p className="mb-4">No vitamin data yet. Click &quot;Refresh Research&quot; to fetch recommendations.</p>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
          >
            {refreshing ? 'Loading...' : 'Load Vitamin Data'}
          </button>
        </div>
      )}
    </div>
  );
}
