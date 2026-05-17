'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, RefreshCw, AlertCircle, Phone, Building2 } from 'lucide-react';

// Dynamic import to avoid SSR issues with Leaflet
const DoctorsMap = dynamic(() => import('@/components/DoctorsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
      <RefreshCw className="animate-spin mr-2" size={16} />
      Loading map...
    </div>
  ),
});

interface Doctor {
  id: number;
  name: string;
  practice: string;
  address: string;
  phone: string;
  specialties: string;
  reputation_notes: string;
  lat: number;
  lng: number;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/doctors');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setDoctors(json.doctors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex gap-2 text-slate-500">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading doctors...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="text-red-500" size={24} />
          Houston Hepatologists
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Top liver specialists in Houston, TX — Texas Medical Center area</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Map */}
      <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <DoctorsMap doctors={doctors} />
      </div>

      {/* Doctor List */}
      <div className="grid grid-cols-2 gap-4">
        {doctors.map(doctor => (
          <div key={doctor.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-900 text-sm leading-snug">{doctor.name}</h2>
                <p className="text-blue-600 text-xs mt-0.5">{doctor.practice}</p>
                <div className="flex items-start gap-1 mt-1.5">
                  <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-500 text-xs leading-relaxed">{doctor.address}</p>
                </div>
                {doctor.phone && (
                  <a
                    href={`tel:${doctor.phone}`}
                    className="flex items-center gap-1 mt-1 text-xs text-green-700 hover:text-green-900"
                  >
                    <Phone size={12} />
                    {doctor.phone}
                  </a>
                )}
                {doctor.specialties && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doctor.specialties.split(',').map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {doctor.reputation_notes && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 italic leading-relaxed">{doctor.reputation_notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Tip:</strong> For ALD specifically, ask for a hepatologist (liver specialist) rather than a general gastroenterologist.
        Baylor College of Medicine and Houston Methodist have dedicated liver programs with ALD expertise.
        Consider requesting a Fibroscan assessment to stage your fibrosis level.
      </div>
    </div>
  );
}
