import React, { useEffect, useMemo, useState } from 'react';
import HeroSpline from './components/HeroSpline';
import StatCards from './components/StatCards';
import IncomeExpenseChart from './components/IncomeExpenseChart';
import FloatingActionButton from './components/FloatingActionButton';
import { useAppStore } from './store/appStore';

function App() {
  const {
    ready,
    init,
    accounts,
    transactions,
    addAccount,
    addTransaction,
    transfer,
    exportJSON,
    importJSON,
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
            <button onClick={exportJSON} className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white">Export</button>
            <label className="px-2.5 py-1.5 rounded-md bg-indigo-600 text-white cursor-pointer">
              {importing ? 'Importing...' : 'Import'}
              <input type="file" accept="application/json" onChange={async (e)=>{ if(!e.target.files?.[0]) return; setImporting(true); try{ await importJSON(e.target.files[0]); } finally { setImporting(false);} }} className="hidden" />
            </label>
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
    </div>
  );
}

export default App;
