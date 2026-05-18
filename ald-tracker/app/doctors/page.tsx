'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import {
  MapPin, RefreshCw, AlertCircle, Phone, Building2,
  ChevronDown, ChevronUp, Plus, FileText, Image as ImageIcon,
  X, Trash2, CheckCircle, StickyNote,
} from 'lucide-react';

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

interface DoctorNote {
  id: number;
  doctor_id: number;
  date: string;
  note_text: string | null;
  image_media_type: string | null;
  created_at: string;
}

function NoteForm({
  doctorId,
  onSaved,
  onCancel,
}: {
  doctorId: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [noteMode, setNoteMode] = useState<'text' | 'image'>('text');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [noteText, setNoteText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body: Record<string, string> = { date };
      if (noteMode === 'image' && imageFile && imagePreview) {
        body.image_data = imagePreview.split(',')[1];
        body.image_media_type = imageFile.type;
        if (noteText.trim()) body.note_text = noteText;
      } else {
        body.note_text = noteText;
      }

      const res = await fetch(`/api/doctors/${doctorId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Add Note</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setNoteMode('text')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${noteMode === 'text' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}>
            <FileText size={11} /> Text
          </button>
          <button type="button" onClick={() => setNoteMode('image')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${noteMode === 'image' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}>
            <ImageIcon size={11} /> Image
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          required />
      </div>

      {noteMode === 'text' ? (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Note</label>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Appointment notes, impressions, follow-up items..."
            className="w-full h-24 border border-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            required />
        </div>
      ) : (
        <div className="space-y-2">
          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <ImageIcon size={20} className="text-slate-400 mb-1" />
              <span className="text-xs text-slate-500">Click to upload image</span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          ) : (
            <div className="relative">
              <img src={imagePreview} alt="Note image" className="w-full max-h-40 object-contain rounded border border-slate-200" />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-1 right-1 p-1 bg-white rounded-full shadow border border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600">
                <X size={12} />
              </button>
            </div>
          )}
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Optional caption or notes about this image..."
            className="w-full h-16 border border-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
        </div>
      )}

      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="px-3 py-1 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-100">Cancel</button>
        <button type="submit" disabled={saving}
          className="px-3 py-1 text-xs bg-slate-800 text-white rounded hover:bg-slate-700 disabled:bg-slate-300 flex items-center gap-1">
          {saving ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle size={11} />}
          {saving ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </form>
  );
}

function DoctorNotes({ doctorId }: { doctorId: number }) {
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedImage, setExpandedImage] = useState<number | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/notes`);
      const data = await res.json();
      setNotes(data.notes || []);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (expanded) fetchNotes();
  }, [expanded, fetchNotes]);

  const deleteNote = async (noteId: number) => {
    if (!confirm('Delete this note?')) return;
    await fetch(`/api/doctors/${doctorId}/notes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    });
    fetchNotes();
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full text-xs text-slate-600 hover:text-slate-900 font-medium"
      >
        <span className="flex items-center gap-1.5">
          <StickyNote size={13} />
          Notes {notes.length > 0 && !expanded ? `(${notes.length})` : ''}
        </span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {loading ? (
            <p className="text-xs text-slate-400 flex items-center gap-1"><RefreshCw size={11} className="animate-spin" /> Loading...</p>
          ) : notes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No notes yet.</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="bg-white border border-slate-200 rounded-lg p-2.5 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500">{note.date}</span>
                  <button onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
                {note.note_text && (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
                )}
                {note.image_media_type && (
                  <div className="mt-2">
                    {expandedImage === note.id ? (
                      <div>
                        <img
                          src={`/api/doctors/${doctorId}/notes/${note.id}/image`}
                          alt="Note image"
                          className="w-full rounded border border-slate-200 cursor-pointer"
                          onClick={() => setExpandedImage(null)}
                        />
                        <button onClick={() => setExpandedImage(null)} className="text-xs text-slate-400 mt-1 hover:text-slate-600">Collapse</button>
                      </div>
                    ) : (
                      <button onClick={() => setExpandedImage(note.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                        <ImageIcon size={11} /> View attached image
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {showForm ? (
            <NoteForm
              doctorId={doctorId}
              onSaved={() => { setShowForm(false); fetchNotes(); }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1">
              <Plus size={12} /> Add note
            </button>
          )}
        </div>
      )}
    </div>
  );
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
        <p className="text-slate-500 text-sm mt-0.5">Top liver specialists in Houston, TX — click Notes on any card to add dated notes or images</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <DoctorsMap doctors={doctors} />
      </div>

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
                  <a href={`tel:${doctor.phone}`}
                    className="flex items-center gap-1 mt-1 text-xs text-green-700 hover:text-green-900">
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
            <DoctorNotes doctorId={doctor.id} />
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Tip:</strong> For ALD specifically, ask for a hepatologist rather than a general gastroenterologist.
        Baylor College of Medicine and Houston Methodist have dedicated liver programs with ALD expertise.
        Consider requesting a Fibroscan assessment to stage your fibrosis level.
      </div>
    </div>
  );
}
