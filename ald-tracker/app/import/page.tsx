'use client';

import { useState } from 'react';
import { Upload, RefreshCw, AlertCircle, CheckCircle, FileText } from 'lucide-react';

interface ImportedRecord {
  date: string;
  test_name: string;
  value: number;
  unit: string;
  reference_range?: string;
  notes?: string;
}

interface ImportResult {
  message: string;
  records: ImportedRecord[];
  imported: number;
  errors?: string[];
}

const EXAMPLE_TEXT = `Patient: Ananya Sarkar
Date of Visit: March 15, 2025

Laboratory Results:
ALT: 89 U/L (reference: 7-56 U/L)
AST: 112 U/L (reference: 10-40 U/L)
GGT: 187 U/L (reference: 9-48 U/L) - elevated
ALP: 95 U/L (normal)
Total Bilirubin: 1.8 mg/dL (reference: 0.1-1.2)
Albumin: 3.2 g/dL (low, reference: 3.5-5.0)
INR: 1.4 (elevated, reference: 0.8-1.1)
Platelet Count: 98 x10^9/L (low, reference: 150-400)
Creatinine: 0.9 mg/dL (normal)
Sodium: 138 mEq/L (normal)
WBC: 5.2 x10^9/L (normal)
Hemoglobin: 11.8 g/dL (low, reference 12-16)

Fibroscan score: 12.4 kPa (significant fibrosis, F3)
MELD score: 11

Notes: Patient continues to drink approximately 2 glasses wine daily.`;

export default function ImportPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Check your ANTHROPIC_API_KEY.');
    } finally {
      setLoading(false);
    }
  };

  const useExample = () => {
    setText(EXAMPLE_TEXT);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Upload className="text-slate-600" size={24} />
          Import Medical History
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Paste lab results or medical notes — AI will extract and import the structured data
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-sm text-blue-800">
        <strong>How it works:</strong> Paste any text containing lab values (from doctor notes, lab reports, discharge summaries).
        Claude AI will extract dates, test names, values, units, and reference ranges, then save them to your health records.
      </div>

      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Medical History Text</label>
            <button
              type="button"
              onClick={useExample}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <FileText size={12} />
              Load example
            </button>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste lab results, doctor notes, discharge summary, or any medical text here..."
            className="w-full h-64 border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Accepts plain text, lab reports, clinical notes. The more context the better.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Parsing with AI...' : 'Import Records'}
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Import failed</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-lg text-sm">
            <CheckCircle size={16} />
            <span className="font-medium">{result.message}</span>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm font-medium mb-1">Warnings:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-yellow-700 text-xs">{e}</p>
              ))}
            </div>
          )}

          {result.records && result.records.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">
                  Extracted Records ({result.records.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2 text-slate-600 font-medium">Date</th>
                      <th className="text-left px-4 py-2 text-slate-600 font-medium">Test</th>
                      <th className="text-left px-4 py-2 text-slate-600 font-medium">Value</th>
                      <th className="text-left px-4 py-2 text-slate-600 font-medium">Unit</th>
                      <th className="text-left px-4 py-2 text-slate-600 font-medium">Reference</th>
                      <th className="text-left px-4 py-2 text-slate-600 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.records.map((r, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-500 text-xs">{r.date}</td>
                        <td className="px-4 py-2 font-medium text-slate-900">{r.test_name}</td>
                        <td className="px-4 py-2 text-slate-700">{r.value}</td>
                        <td className="px-4 py-2 text-slate-500 text-xs">{r.unit}</td>
                        <td className="px-4 py-2 text-slate-400 text-xs">{r.reference_range || '—'}</td>
                        <td className="px-4 py-2 text-slate-400 text-xs">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <a
              href="/health"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              View in Health Data →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
