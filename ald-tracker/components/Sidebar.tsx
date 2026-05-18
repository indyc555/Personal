'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Pill,
  Beaker,
  Newspaper,
  FlaskConical,
  MapPin,
  Upload,
  Home,
  Wine,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/health', label: 'Health Data', icon: Activity },
  { href: '/treatment', label: 'Treatments', icon: Pill },
  { href: '/vitamins', label: 'Vitamins', icon: Beaker },
  { href: '/news', label: 'ALD News', icon: Newspaper },
  { href: '/trials', label: 'Clinical Trials', icon: FlaskConical },
  { href: '/doctors', label: 'Doctors', icon: MapPin },
  { href: '/import', label: 'Import Data', icon: Upload },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-navy-900 flex flex-col" style={{ backgroundColor: '#0f172a' }}>
      {/* App Title */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <h1 className="text-white font-bold text-lg leading-tight">Hepto<br />Tracker</h1>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="mx-4 mt-4 p-3 rounded-lg bg-slate-800 border border-slate-600">
        <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-2">Patient</p>
        <p className="text-white font-semibold text-sm">Jane Doe</p>
        <p className="text-slate-400 text-xs mt-0.5">Houston, TX</p>
        <div className="mt-2 pt-2 border-t border-slate-600">
          <p className="text-slate-400 text-xs">Condition</p>
          <p className="text-orange-400 text-xs font-medium">ALD</p>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Wine size={12} className="text-purple-400" />
          <p className="text-purple-400 text-xs font-medium">300 mL/day current</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700">
        <p className="text-slate-500 text-xs">Personal health tracker</p>
        <p className="text-slate-600 text-xs">Not medical advice</p>
      </div>
    </aside>
  );
}
