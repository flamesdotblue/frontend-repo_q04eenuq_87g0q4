import React, { useEffect, useMemo, useState } from 'react';
import HeroSpline from './components/HeroSpline';
import StatCards from './components/StatCards';
import IncomeExpenseChart from './components/IncomeExpenseChart';
import FloatingActionButton from './components/FloatingActionButton';
import { useAppStore } from './store/appStore';
import { FileDown, FileUp, Lock, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

function App() {
  const {
    ready,
    locked,
    init,
    accounts,
    transactions,
    addAccount,
    addTransaction,
    transfer,
    exportJSON,
    importJSON,
    exportEncrypted,
    importEncrypted,
    setPIN,
    clearPIN,
    unlock,
  } = useAppStore();

  // Service worker registration and theme init
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    // Prefer system dark
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  // seed a default account for first-run
  useEffect(() => {
    if (ready && accounts.length === 0) {
      addAccount({ name: 'Cash', type: 'Cash', bank: '', initialBalance: 0 });
    }
  }, [ready, accounts.length, addAccount]);

  const totals = useMemo(() => {
    const inc = transactions.filter(t => t.type === 'income').reduce((a, b) => a + (b.amount || 0), 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + (b.amount || 0), 0);
    const inv = transactions.filter(t => t.type === 'investment').reduce((a, b) => a + (b.amount || 0), 0);
    return { inc, exp, inv, net: inc - exp };
  }, [transactions]);

  const months = useMemo(() => {
    const now = new Date();
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleString('en-US', { month: 'short' }) });
    }
    return arr;
  }, []);

  const monthlyChart = useMemo(() => {
    const map = Object.fromEntries(months.map(m => [m.key, { income: 0, expense: 0, label: m.label }]));
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (map[key]) {
        if (t.type === 'income') map[key].income += t.amount;
        if (t.type === 'expense') map[key].expense += t.amount;
      }
    });
    return months.map(m => ({ label: m.label, ...map[m.key] }));
  }, [months, transactions]);

  const handleAddIncome = async () => {
    if (accounts.length === 0) return;
    const amount = Number(prompt('Amount (₹)') || 0);
    const accountId = accounts[0].id;
    if (!amount) return;
    await addTransaction({ type: 'income', amount, accountId, date: new Date().toISOString(), category: 'Other' });
  };

  const handleAddExpense = async () => {
    if (accounts.length === 0) return;
    const amount = Number(prompt('Amount (₹)') || 0);
    const accountId = accounts[0].id;
    if (!amount) return;
    await addTransaction({ type: 'expense', amount, accountId, date: new Date().toISOString(), category: 'Other' });
  };

  const handleAddInvestment = async () => {
    if (accounts.length === 0) return;
    const amount = Number(prompt('Amount (₹)') || 0);
    const accountId = accounts[0].id;
    if (!amount) return;
    await addTransaction({ type: 'investment', amount, accountId, date: new Date().toISOString(), category: 'Other' });
  };

  const handleTransfer = async () => {
    if (accounts.length < 2) {
      alert('Create at least two accounts to transfer between them.');
      return;
    }
    const amount = Number(prompt('Amount (₹)') || 0);
    if (!amount) return;
    await transfer({ fromAccountId: accounts[0].id, toAccountId: accounts[1].id, amount, date: new Date().toISOString() });
  };

  const handleAddAccount = async () => {
    const name = prompt('Account Name');
    if (!name) return;
    await addAccount({ name, type: 'Savings', bank: '', initialBalance: 0 });
  };

  const [importing, setImporting] = useState(false);

  // Security: PIN entry overlay if locked
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const tryUnlock = async () => {
    const ok = await unlock(pinInput);
    if (!ok) {
      setPinError('Incorrect PIN');
    } else {
      setPinInput('');
      setPinError('');
    }
  };

  const handleSetPin = async () => {
    const pin = prompt('Set a 4+ digit PIN to lock the app');
    if (pin) await setPIN(pin);
  };
  const handleClearPin = async () => {
    const sure = confirm('Remove PIN lock?');
    if (sure) await clearPIN();
  };

  const handleExportEncrypted = async () => {
    const pwd = prompt('Enter a password to encrypt the backup');
    if (!pwd) return;
    await exportEncrypted(pwd);
  };

  const handleImportEncrypted = async (file) => {
    const pwd = prompt('Enter the password used for encryption');
    if (!pwd) return;
    await importEncrypted(file, pwd);
  };

  const generateReportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Fintrack Report', 14, 18);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Total Income: ₹ ${Number(totals.inc).toLocaleString('en-IN')}`, 14, 36);
    doc.text(`Total Expense: ₹ ${Number(totals.exp).toLocaleString('en-IN')}`, 14, 44);
    doc.text(`Net Balance: ₹ ${Number(totals.net).toLocaleString('en-IN')}`, 14, 52);

    doc.text('Recent Transactions:', 14, 66);
    const recent = transactions.slice(-20).reverse();
    let y = 74;
    recent.forEach((t) => {
      const line = `${new Date(t.date).toLocaleDateString()}  ${t.type.padEnd(8)}  ₹ ${t.amount}`;
      doc.text(line, 14, y);
      y += 8;
      if (y > 280) { doc.addPage(); y = 20; }
    });

    doc.save('fintrack-report.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600" />
            <h2 className="font-semibold tracking-tight">Fintrack PWA</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button onClick={handleAddAccount} className="px-2.5 py-1.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900">Add Account</button>
            <button onClick={exportJSON} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-600 text-white"><FileDown size={14}/>Export</button>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-600 text-white cursor-pointer">
              <FileUp size={14}/>{importing ? 'Importing...' : 'Import'}
              <input type="file" accept="application/json" onChange={async (e)=>{ if(!e.target.files?.[0]) return; setImporting(true); try{ await importJSON(e.target.files[0]); } finally { setImporting(false);} }} className="hidden" />
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-purple-600 text-white cursor-pointer">
              <Lock size={14}/>Import .enc
              <input type="file" accept="application/octet-stream" onChange={async (e)=>{ if(!e.target.files?.[0]) return; await handleImportEncrypted(e.target.files[0]); e.target.value=''; }} className="hidden" />
            </label>
            <button onClick={handleExportEncrypted} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-fuchsia-600 text-white"><Lock size={14}/>Encrypt Export</button>
            <button onClick={generateReportPDF} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-600 text-white"><FileText size={14}/>Report PDF</button>
            {!locked ? (
              <button onClick={handleSetPin} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-700 text-white"><Lock size={14}/>Set PIN</button>
            ) : (
              <button onClick={handleClearPin} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-700 text-white"><Lock size={14}/>Remove PIN</button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <HeroSpline />

        <StatCards
          totalIncome={totals.inc}
          totalExpenses={totals.exp}
          totalInvestments={totals.inv}
          netBalance={totals.net}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <IncomeExpenseChart monthly={monthlyChart} />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="font-semibold mb-3">Recent Transactions</h3>
            <ul className="space-y-2">
              {transactions.slice(-10).reverse().map((t, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300 capitalize">{t.type}</span>
                  <span className={t.type === 'expense' ? 'text-rose-500' : t.type === 'income' ? 'text-emerald-500' : 'text-indigo-500'}>
                    {t.type === 'expense' ? '-' : '+'} ₹ {Number(t.amount||0).toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
              <h4 className="font-medium text-sm mb-2">Accounts</h4>
              <ul className="space-y-1 text-sm">
                {accounts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span>{a.name}</span>
                    <span className="text-slate-500">₹ {Number(a.balance||0).toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <FloatingActionButton
        onAddIncome={handleAddIncome}
        onAddExpense={handleAddExpense}
        onAddInvestment={handleAddInvestment}
        onTransfer={handleTransfer}
      />

      {locked && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={18} />
              <h3 className="font-semibold">App Locked</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Enter your PIN to unlock</p>
            <input value={pinInput} onChange={(e)=>setPinInput(e.target.value)} type="password" placeholder="PIN" className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none" />
            {pinError && <p className="text-rose-500 text-sm mt-2">{pinError}</p>}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={tryUnlock} className="px-3 py-1.5 rounded-md bg-blue-600 text-white">Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
