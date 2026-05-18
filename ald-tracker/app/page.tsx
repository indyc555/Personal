import Link from 'next/link';
import { Activity, Pill, Beaker, Newspaper, FlaskConical, MapPin, Upload, ArrowRight, Wine, AlertTriangle } from 'lucide-react';

const sections = [
  {
    href: '/health',
    title: 'Health Data',
    icon: Activity,
    description: 'Log lab results, track alcohol intake, and get AI analysis of your health metrics.',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    href: '/treatment',
    title: 'Treatment Options',
    icon: Pill,
    description: 'Research current ALD treatments, clinical evidence, and options for patients who continue drinking.',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    href: '/vitamins',
    title: 'Vitamins & Supplements',
    icon: Beaker,
    description: 'Evidence-based vitamin recommendations for ALD with dosage, formulation, and liver safety info.',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    href: '/news',
    title: 'ALD News',
    icon: Newspaper,
    description: 'Latest research, clinical trial results, and treatment developments for ALD.',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    href: '/trials',
    title: 'Clinical Trials',
    icon: FlaskConical,
    description: 'Active recruiting trials for ALD from ClinicalTrials.gov, with Texas/Houston trials highlighted.',
    lightColor: 'bg-teal-50',
    textColor: 'text-teal-600',
  },
  {
    href: '/doctors',
    title: 'Doctors & Specialists',
    icon: MapPin,
    description: 'Top hepatologists in Houston TX, with interactive map and contact information.',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    href: '/import',
    title: 'Import Medical History',
    icon: Upload,
    description: 'Paste medical history text to automatically extract and import lab values into your health records.',
    lightColor: 'bg-slate-50',
    textColor: 'text-slate-600',
  },
];

export default function HomePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Hepto Tracker</h1>
        <p className="text-slate-600 text-lg">Personal ALD management dashboard</p>
        <p className="text-slate-400 text-sm mt-1">Today is May 17, 2026</p>
      </div>

      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-amber-800 font-semibold text-sm">Medical Disclaimer</p>
          <p className="text-amber-700 text-sm mt-0.5">
            This app is a personal research tool only. Always consult your hepatologist for medical decisions.
            AI-generated information may contain errors. Current alcohol intake: <strong>300 mL/day</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Wine className="text-purple-500" size={18} />
            <p className="text-slate-500 text-sm font-medium">Current Intake</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">300 mL</p>
          <p className="text-slate-400 text-xs mt-0.5">~2 glasses wine/day</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-blue-500" size={18} />
            <p className="text-slate-500 text-sm font-medium">Condition</p>
          </div>
          <p className="text-lg font-bold text-slate-900">ALD</p>
          <p className="text-slate-400 text-xs mt-0.5">Since ~2011</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-red-500" size={18} />
            <p className="text-slate-500 text-sm font-medium">Location</p>
          </div>
          <p className="text-lg font-bold text-slate-900">Houston, TX</p>
          <p className="text-slate-400 text-xs mt-0.5">Texas Medical Center</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sections.map(({ href, title, icon: Icon, description, lightColor, textColor }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 ${lightColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={textColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-400 text-sm">
          Need help? Click the chat button in the bottom-right corner to ask the AI assistant.
        </p>
      </div>
    </div>
  );
}
