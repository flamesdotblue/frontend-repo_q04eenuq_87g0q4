import React, { useMemo, useState } from 'react';
import HeroSpline from './components/HeroSpline.jsx';
import DashboardOverview from './components/DashboardOverview.jsx';
import CRUDTabs from './components/CRUDTabs.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now();
}

export default function App() {
  // Primary navigation
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'manage' | 'settings'

  // Demo state (would be persisted with IndexedDB in a full app)
  const [accounts, setAccounts] = useState([
    { id: uid(), name: 'Cash', type: 'Wallet', balance: 250.0 },
    { id: uid(), name: 'Checking', type: 'Bank', balance: 1340.42 },
  ]);
  const [transactions, setTransactions] = useState([
    { id: uid(), title: 'Groceries', type: 'expense', amount: 54.2, date: new Date().toISOString().slice(0,10), accountId: '' },
    { id: uid(), title: 'Salary', type: 'income', amount: 2200, date: new Date().toISOString().slice(0,10), accountId: '' },
  ]);
  const [investments, setInvestments] = useState([
    { id: uid(), asset: 'AAPL', title: 'Buy AAPL', amount: 300, date: new Date().toISOString().slice(0,10), accountId: '' },
  ]);
  const [budgets, setBudgets] = useState([
    { name: 'Food', limit: 300 },
  ]);
  const [goals, setGoals] = useState([
    { title: 'Emergency Fund', target: 1000 },
  ]);

  // Ensure seeded account IDs on sample data
  React.useEffect(() => {
    if (accounts.length > 0) {
      setTransactions(ts => ts.map(t => t.accountId ? t : { ...t, accountId: accounts[0].id }));
      setInvestments(iv => iv.map(i => i.accountId ? i : { ...i, accountId: accounts[0].id }));
    }
  }, [accounts.length]);

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((a,b)=>a + Number(b.amount||0), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((a,b)=>a + Number(b.amount||0), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  // CRUD handlers
  const handleCreate = (type, payload) => {
    if (type === 'accounts') {
      setAccounts(prev => [...prev, { id: uid(), balance: Number(payload.balance||0), name: payload.name, type: payload.type }]);
    } else if (type === 'transactions') {
      setTransactions(prev => [...prev, { id: uid(), ...payload, amount: Number(payload.amount||0) }]);
    } else if (type === 'investments') {
      setInvestments(prev => [...prev, { id: uid(), ...payload, amount: Number(payload.amount||0) }]);
    }
  };

  const handleUpdate = (type, id, payload) => {
    const patch = (list) => list.map(item => item.id === id ? { ...item, ...payload, amount: payload.amount !== undefined ? Number(payload.amount) : item.amount } : item);
    if (type === 'accounts') setAccounts(list => list.map(a => a.id === id ? { ...a, ...payload, balance: Number(payload.balance||a.balance||0) } : a));
    if (type === 'transactions') setTransactions(patch);
    if (type === 'investments') setInvestments(patch);
  };

  const handleDelete = (type, id) => {
    if (type === 'accounts') {
      setAccounts(list => list.filter(a => a.id !== id));
      setTransactions(list => list.filter(t => t.accountId !== id));
      setInvestments(list => list.filter(i => i.accountId !== id));
    }
    if (type === 'transactions') setTransactions(list => list.filter(t => t.id !== id));
    if (type === 'investments') setInvestments(list => list.filter(i => i.id !== id));
  };

  // Budgets & Goals
  const onAddBudget = (b) => setBudgets(prev => [...prev, b]);
  const onRemoveBudget = (idx) => setBudgets(prev => prev.filter((_,i)=>i!==idx));
  const onAddGoal = (g) => setGoals(prev => [...prev, g]);
  const onRemoveGoal = (idx) => setGoals(prev => prev.filter((_,i)=>i!==idx));

  // Import handler used by Settings
  const snapshot = useMemo(() => ({ accounts, transactions, investments, budgets, goals }), [accounts, transactions, investments, budgets, goals]);
  const handleImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.accounts) setAccounts(data.accounts);
        if (data.transactions) setTransactions(data.transactions);
        if (data.investments) setInvestments(data.investments);
        if (data.budgets) setBudgets(data.budgets);
        if (data.goals) setGoals(data.goals);
      } catch (e) {
        alert('Invalid file');
      }
    };
    reader.readAsText(file);
  };

  // Auto-import from hash if present
  React.useEffect(() => {
    if (window.location.hash.startsWith('#data=')) {
      try {
        const dataStr = decodeURIComponent(escape(atob(window.location.hash.replace('#data=',''))));
        const data = JSON.parse(dataStr);
        if (data.accounts) setAccounts(data.accounts);
        if (data.transactions) setTransactions(data.transactions);
        if (data.investments) setInvestments(data.investments);
        if (data.budgets) setBudgets(data.budgets);
        if (data.goals) setGoals(data.goals);
        window.location.hash = '';
      } catch (e) { /* ignore */ }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-20 border-b border-neutral-200/60 bg-white/80 backdrop-blur dark:border-neutral-800/60 dark:bg-neutral-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-blue-600" />
            <div>
              <div className="text-sm font-semibold">Fintrack PWA</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Income {totals.income.toFixed(2)} • Expense {totals.expense.toFixed(2)} • Net {totals.net.toFixed(2)}</div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'manage', label: 'Manage' },
              { id: 'settings', label: 'Settings' },
            ].map(item => (
              <button key={item.id} onClick={()=>setView(item.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${view===item.id ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4">
        <HeroSpline />

        {view === 'dashboard' && (
          <DashboardOverview 
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            onAddBudget={onAddBudget}
            onRemoveBudget={onRemoveBudget}
            onAddGoal={onAddGoal}
            onRemoveGoal={onRemoveGoal}
          />
        )}

        {view === 'manage' && (
          <CRUDTabs 
            accounts={accounts}
            transactions={transactions}
            investments={investments}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}

        {view === 'settings' && (
          <SettingsPanel snapshot={snapshot} onImport={handleImport} />
        )}

        <footer className="py-8 text-center text-xs text-neutral-500">Offline-first. Share data across devices via export/import or share-link. No cloud required.</footer>
      </main>
    </div>
  );
}
