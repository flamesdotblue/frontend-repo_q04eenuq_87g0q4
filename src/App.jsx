import React, { useMemo, useState } from 'react';
import HeroSpline from './components/HeroSpline';
import StatCards from './components/StatCards';
import IncomeExpenseChart from './components/IncomeExpenseChart';
import FloatingActionButton from './components/FloatingActionButton';

function App() {
  // Sample local data for preview. In the full app, this will come from IndexedDB.
  const [transactions] = useState([
    { type: 'income', amount: 65000, date: '2025-05-01' },
    { type: 'expense', amount: 2200, date: '2025-05-02' },
    { type: 'expense', amount: 3500, date: '2025-05-04' },
    { type: 'income', amount: 12000, date: '2025-04-28' },
    { type: 'investment', amount: 5000, date: '2025-04-26' },
    { type: 'expense', amount: 1800, date: '2025-04-22' },
    { type: 'income', amount: 7000, date: '2025-03-18' },
    { type: 'expense', amount: 2600, date: '2025-03-19' },
    { type: 'income', amount: 65000, date: '2025-02-01' },
    { type: 'expense', amount: 9800, date: '2025-02-10' },
  ]);

  const totals = useMemo(() => {
    const inc = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const inv = transactions.filter(t => t.type === 'investment').reduce((a, b) => a + b.amount, 0);
    return { inc, exp, inv, net: inc - exp };
  }, [transactions]);

  const months = useMemo(() => {
    // create last 6 months labels
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600" />
            <h2 className="font-semibold tracking-tight">Fintrack PWA</h2>
          </div>
          <div className="text-xs text-slate-500">Offline • Installable • Private</div>
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
              {transactions.slice(-6).reverse().map((t, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300 capitalize">{t.type}</span>
                  <span className={t.type === 'expense' ? 'text-rose-500' : t.type === 'income' ? 'text-emerald-500' : 'text-indigo-500'}>
                    {t.type === 'expense' ? '-' : '+'} ₹ {t.amount.toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <FloatingActionButton
        onAddIncome={() => alert('Add Income form (offline)')}
        onAddExpense={() => alert('Add Expense form (offline)')}
        onAddInvestment={() => alert('Add Investment form (offline)')}
        onTransfer={() => alert('Transfer between accounts (offline)')}
      />
    </div>
  );
}

export default App;
