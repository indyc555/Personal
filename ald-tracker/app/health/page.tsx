'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Plus, RefreshCw, Activity, Wine, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';

interface HealthRecord {
  id: number;
  date: string;
  test_name: string;
  value: number;
  unit: string;
  reference_range: string | null;
  notes: string | null;
  created_at: string;
}

interface AlcoholLog {
  id: number;
  date: string;
  amount_ml: number;
  notes: string | null;
}

interface AiAnalysis {
  id: number;
  created_at: string;
  summary: string;
  confidence_level: number;
  sources: string;
}

const COMMON_LABS = [
  { name: 'ALT', unit: 'U/L', range: '7-56' },
  { name: 'AST', unit: 'U/L', range: '10-40' },
  { name: 'GGT', unit: 'U/L', range: '9-48' },
  { name: 'ALP', unit: 'U/L', range: '44-147' },
  { name: 'Total Bilirubin', unit: 'mg/dL', range: '0.1-1.2' },
  { name: 'Albumin', unit: 'g/dL', range: '3.5-5.0' },
  { name: 'INR', unit: 'INR', range: '0.8-1.1' },
  { name: 'Platelet Count', unit: 'x10⁹/L', range: '150-400' },
  { name: 'Creatinine', unit: 'mg/dL', range: '0.6-1.2' },
  { name: 'Sodium', unit: 'mEq/L', range: '136-145' },
  { name: 'WBC', unit: 'x10⁹/L', range: '4.5-11.0' },
  { name: 'Hemoglobin', unit: 'g/dL', range: '12.0-16.0' },
  { name: 'MELD Score', unit: 'points', range: '<10' },
  { name: 'Fibroscan Score', unit: 'kPa', range: '<7.0' },
];

function isAbnormal(value: number, range: string | null): boolean | null {
  if (!range) return null;
  const parts = range.replace(/[<>]/g, '').split('-');
  if (range.startsWith('<')) return value >= parseFloat(parts[0]);
  if (range.startsWith('>')) return value <= parseFloat(parts[0]);
  if (parts.length === 2) {
    return value < parseFloat(parts[0]) || value > parseFloat(parts[1]);
  }
  return null;
}

export default function HealthPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [alcoholLogs, setAlcoholLogs] = useState<AlcoholLog[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AiAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAlcoholForm, setShowAlcoholForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [labForm, setLabForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    test_name: 'ALT',
    value: '',
    unit: 'U/L',
    reference_range: '7-56',
    notes: '',
    custom_test: '',
  });

  const [alcoholForm, setAlcoholForm] = useState({
    date: '2026-05-17',
    amount_ml: '300',
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setRecords(data.records || []);
      setAlcoholLogs(data.alcoholLogs || []);
      setLatestAnalysis(data.latestAnalysis || null);
    } catch {
      setErrorMsg('Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLabPreset = (name: string) => {
    const preset = COMMON_LABS.find(l => l.name === name);
    if (preset) {
      setLabForm(f => ({ ...f, test_name: preset.name, unit: preset.unit, reference_range: preset.range }));
    }
  };

  const submitLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const testName = labForm.test_name === 'Other' ? labForm.custom_test : labForm.test_name;
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: labForm.date,
          test_name: testName,
          value: parseFloat(labForm.value),
          unit: labForm.unit,
          reference_range: labForm.reference_range || null,
          notes: labForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg('Lab result saved!');
      setShowAddForm(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const submitAlcohol = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/alcohol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: alcoholForm.date,
          amount_ml: parseFloat(alcoholForm.amount_ml),
          notes: alcoholForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg('Alcohol intake logged!');
      setShowAlcoholForm(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to log');
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/analyze', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      fetchData();
      setShowAnalysis(true);
      setSuccessMsg('AI analysis complete!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Analysis failed. Check ANTHROPIC_API_KEY.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Group records by test name
  const groupedRecords: Record<string, HealthRecord[]> = {};
  for (const r of records) {
    if (!groupedRecords[r.test_name]) groupedRecords[r.test_name] = [];
    groupedRecords[r.test_name].push(r);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex gap-2 text-slate-500">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading health data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-blue-500" size={24} />
            Health Data
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Track lab results and alcohol intake</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowAlcoholForm(v => !v); setShowAddForm(false); }}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
          >
            <Wine size={16} />
            Log Alcohol
          </button>
          <button
            onClick={() => { setShowAddForm(v => !v); setShowAlcoholForm(false); }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            Add Lab Result
          </button>
        </div>
      </div>

      {/* Success/Error messages */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Add Lab Form */}
      {showAddForm && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Add Lab Result</h2>
          <form onSubmit={submitLab} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={labForm.date}
                  onChange={e => setLabForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Test</label>
                <select
                  value={labForm.test_name}
                  onChange={e => handleLabPreset(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COMMON_LABS.map(l => (
                    <option key={l.name} value={l.name}>{l.name}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            {labForm.test_name === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Test Name</label>
                <input
                  type="text"
                  value={labForm.custom_test}
                  onChange={e => setLabForm(f => ({ ...f, custom_test: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter test name"
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
                <input
                  type="number"
                  step="any"
                  value={labForm.value}
                  onChange={e => setLabForm(f => ({ ...f, value: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={labForm.unit}
                  onChange={e => setLabForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference Range</label>
                <input
                  type="text"
                  value={labForm.reference_range}
                  onChange={e => setLabForm(f => ({ ...f, reference_range: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 10-40"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={labForm.notes}
                onChange={e => setLabForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any context or notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save Result</button>
            </div>
          </form>
        </div>
      )}

      {/* Alcohol Form */}
      {showAlcoholForm && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Log Alcohol Intake</h2>
          <form onSubmit={submitAlcohol} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={alcoholForm.date}
                  onChange={e => setAlcoholForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (mL)</label>
                <input
                  type="number"
                  step="any"
                  value={alcoholForm.amount_ml}
                  onChange={e => setAlcoholForm(f => ({ ...f, amount_ml: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={alcoholForm.notes}
                onChange={e => setAlcoholForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAlcoholForm(false)} className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Records */}
        <div className="col-span-2 space-y-4">
          {/* Alcohol Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Wine className="text-purple-500" size={18} />
              <h2 className="font-semibold text-slate-900">Alcohol Intake Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-2 text-slate-600 font-medium">Date</th>
                    <th className="text-left px-4 py-2 text-slate-600 font-medium">Amount (mL)</th>
                    <th className="text-left px-4 py-2 text-slate-600 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {alcoholLogs.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-slate-400 text-center">No alcohol logs yet</td></tr>
                  ) : alcoholLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-700">{log.date}</td>
                      <td className="px-4 py-2 font-medium text-purple-700">{log.amount_ml} mL</td>
                      <td className="px-4 py-2 text-slate-500">{log.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lab Records grouped by test */}
          {Object.entries(groupedRecords).map(([testName, testRecords]) => {
            const latest = testRecords[0];
            const abnormal = isAbnormal(latest.value, latest.reference_range);
            return (
              <div key={testName} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{testName}</h2>
                    {abnormal === true && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Abnormal</span>
                    )}
                    {abnormal === false && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Normal</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${abnormal === true ? 'text-red-600' : abnormal === false ? 'text-green-600' : 'text-slate-700'}`}>
                      {latest.value} {latest.unit}
                    </span>
                    {latest.reference_range && (
                      <p className="text-xs text-slate-400">ref: {latest.reference_range}</p>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2 text-slate-600 font-medium">Date</th>
                        <th className="text-left px-4 py-2 text-slate-600 font-medium">Value</th>
                        <th className="text-left px-4 py-2 text-slate-600 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testRecords.map(r => {
                        const ab = isAbnormal(r.value, r.reference_range);
                        return (
                          <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-500">{r.date}</td>
                            <td className={`px-4 py-2 font-medium ${ab === true ? 'text-red-600' : ab === false ? 'text-green-600' : 'text-slate-700'}`}>
                              {r.value} {r.unit}
                            </td>
                            <td className="px-4 py-2 text-slate-400 text-xs">{r.notes || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {records.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-10 text-center text-slate-400">
              <Activity size={32} className="mx-auto mb-2 opacity-40" />
              <p>No lab results yet. Add your first result or use Import Data to bulk import.</p>
            </div>
          )}
        </div>

        {/* Right: AI Analysis */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">AI Analysis</h2>
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs transition-colors"
              >
                <RefreshCw size={12} className={analyzing ? 'animate-spin' : ''} />
                {analyzing ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>

            {latestAnalysis ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      latestAnalysis.confidence_level >= 75 ? 'bg-green-100 text-green-700' :
                      latestAnalysis.confidence_level >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {latestAnalysis.confidence_level}% confidence
                    </span>
                  </div>
                  <button onClick={() => setShowAnalysis(v => !v)} className="text-slate-400 hover:text-slate-600">
                    {showAnalysis ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Generated {format(new Date(latestAnalysis.created_at), 'MMM d, yyyy HH:mm')}
                </p>
                {showAnalysis && (
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {latestAnalysis.summary}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-sm text-slate-400 text-center py-8">
                <Activity size={24} className="mx-auto mb-2 opacity-40" />
                <p>No analysis yet. Add lab results then click &quot;Run Analysis&quot;</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
