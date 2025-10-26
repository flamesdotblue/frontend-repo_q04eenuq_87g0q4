import React, { useEffect, useMemo, useState } from 'react';
import { Moon, Sun, Download, Upload, Share2, Info } from 'lucide-react';

export default function SettingsPanel({ snapshot, onImport }) {
  const [tab, setTab] = useState('appearance');
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return localStorage.getItem('theme') || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && sysDark);
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareLink = async () => {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(snapshot))));
    const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
    try { await navigator.clipboard.writeText(url); alert('Share link copied to clipboard. Open on another device to import.'); }
    catch { prompt('Copy this link:', url); }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-4 flex items-center gap-2">
        {['appearance','data','about'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-sm capitalize ${tab===t ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'appearance' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Theme</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={()=>setTheme('light')} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${theme==='light' ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900' : 'border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900'}`}><Sun size={16}/>Light</button>
            <button onClick={()=>setTheme('dark')} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${theme==='dark' ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900' : 'border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900'}`}><Moon size={16}/>Dark</button>
            <button onClick={()=>setTheme('system')} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${theme==='system' ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900' : 'border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900'}`}>System</button>
          </div>
        </div>
      )}

      {tab === 'data' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Data Controls</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Export or import a JSON snapshot. Or share a one-click link that embeds your data in the URL hash for easy transfer between devices.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"><Download size={16}/>Export JSON</button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900">
              <Upload size={16}/> Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={e=>onImport(e.target.files?.[0])} />
            </label>
            <button onClick={handleShareLink} className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-neutral-900"><Share2 size={16}/>Share Link</button>
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"><Info size={14}/> About</div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">This app is an offline-first personal finance tracker with a modern 3D cover, clean dashboard, and simple data portability. No sign-in needed.</p>
          <ul className="list-inside list-disc text-sm text-neutral-600 dark:text-neutral-400">
            <li>Dashboard: budgets, goals, and monthly trends.</li>
            <li>Manage: full CRUD for accounts, transactions, investments.</li>
            <li>Settings: theme, data export/import, share link.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
