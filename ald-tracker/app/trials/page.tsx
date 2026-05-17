'use client';

import { useState, useEffect, useCallback } from 'react';
import { FlaskConical, RefreshCw, AlertCircle, ExternalLink, MapPin, Star } from 'lucide-react';

interface Trial {
  id: number;
  nct_id: string;
  title: string;
  phase: string;
  status: string;
  summary: string;
  eligibility: string;
  locations: string;
  contact_info: string;
}

interface LocationData {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
}

function isTexasTrial(locations: string): boolean {
  try {
    const locs: LocationData[] = JSON.parse(locations || '[]');
    return locs.some(l => l.state === 'Texas' || l.state === 'TX' || l.city === 'Houston');
  } catch {
    return false;
  }
}

function parseLocations(locStr: string): LocationData[] {
  try {
    return JSON.parse(locStr || '[]');
  } catch {
    return [];
  }
}

function PhaseTag({ phase }: { phase: string }) {
  const colors: Record<string, string> = {
    'PHASE1': 'bg-slate-100 text-slate-600',
    'PHASE2': 'bg-blue-100 text-blue-700',
    'PHASE3': 'bg-green-100 text-green-700',
    'PHASE4': 'bg-purple-100 text-purple-700',
    'N/A': 'bg-slate-100 text-slate-500',
  };
  const parts = phase?.split(',').map(p => p.trim()) || ['N/A'];
  return (
    <div className="flex gap-1">
      {parts.map(p => (
        <span key={p} className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[p] || 'bg-slate-100 text-slate-600'}`}>
          {p.replace('PHASE', 'Phase ')}
        </span>
      ))}
    </div>
  );
}

export default function TrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/trials${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setTrials(json.trials || []);
      if (json.total) setTotal(json.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const texasTrials = trials.filter(t => isTexasTrial(t.locations));
  const otherTrials = trials.filter(t => !isTexasTrial(t.locations));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex gap-2 text-slate-500">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading clinical trials from ClinicalTrials.gov...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="text-teal-500" size={24} />
            Clinical Trials
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Active recruiting ALD trials from ClinicalTrials.gov
            {total && <span> — {total} found</span>}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Fetching...' : 'Refresh Trials'}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {trials.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-400">
          <FlaskConical size={32} className="mx-auto mb-2 opacity-40" />
          <p className="mb-4">No trials loaded. Click &quot;Refresh Trials&quot; to fetch from ClinicalTrials.gov.</p>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm">
            {refreshing ? 'Loading...' : 'Fetch Trials'}
          </button>
        </div>
      ) : (
        <>
          {/* Texas trials highlighted */}
          {texasTrials.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="text-yellow-500 fill-yellow-500" size={18} />
                <h2 className="font-bold text-slate-900">Texas / Houston Trials</h2>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">{texasTrials.length} nearby</span>
              </div>
              <div className="space-y-3">
                {texasTrials.map(trial => (
                  <TrialCard
                    key={trial.id}
                    trial={trial}
                    isExpanded={expandedId === trial.id}
                    onToggle={() => setExpandedId(expandedId === trial.id ? null : trial.id)}
                    highlight
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other trials */}
          <div>
            <h2 className="font-bold text-slate-900 mb-3">
              All Active Trials {otherTrials.length > 0 && `(${otherTrials.length})`}
            </h2>
            <div className="space-y-3">
              {otherTrials.map(trial => (
                <TrialCard
                  key={trial.id}
                  trial={trial}
                  isExpanded={expandedId === trial.id}
                  onToggle={() => setExpandedId(expandedId === trial.id ? null : trial.id)}
                  highlight={false}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TrialCard({
  trial,
  isExpanded,
  onToggle,
  highlight,
}: {
  trial: Trial;
  isExpanded: boolean;
  onToggle: () => void;
  highlight: boolean;
}) {
  const locations = parseLocations(trial.locations);

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-colors ${highlight ? 'border-yellow-300 bg-yellow-50/30' : 'border-slate-200'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <PhaseTag phase={trial.phase} />
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">{trial.status}</span>
              {highlight && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <MapPin size={10} /> Texas
                </span>
              )}
            </div>
            <p className="font-semibold text-slate-900 text-sm leading-snug">{trial.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{trial.nct_id}</p>
          </div>
          <a
            href={`https://clinicaltrials.gov/study/${trial.nct_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        {trial.summary && (
          <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">{trial.summary}</p>
        )}

        {locations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {locations.slice(0, 3).map((loc, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                <MapPin size={10} />
                {loc.city}{loc.state ? `, ${loc.state}` : ''}
              </span>
            ))}
            {locations.length > 3 && (
              <span className="text-xs text-slate-400">+{locations.length - 3} more</span>
            )}
          </div>
        )}

        <button
          onClick={onToggle}
          className="mt-2 text-xs text-teal-600 hover:text-teal-800 font-medium"
        >
          {isExpanded ? 'Hide eligibility details' : 'Show eligibility criteria'}
        </button>

        {isExpanded && trial.eligibility && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-700 mb-1">Eligibility Criteria:</p>
            <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {trial.eligibility}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
