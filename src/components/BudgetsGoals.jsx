import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function BudgetsGoals({ budgets, goals, onAddBudget, onRemoveBudget, onAddGoal, onRemoveGoal, transactions }) {
  const [bForm, setBForm] = useState({ name: '', limit: '' });
  const [gForm, setGForm] = useState({ title: '', target: '' });

  const monthSpend = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const spentByCat = {};
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const dt = new Date(t.date);
      if (dt < start) continue;
      const cat = t.category || 'General';
      spentByCat[cat] = (spentByCat[cat] || 0) + Number(t.amount || 0);
    }
    return spentByCat;
  }, [transactions]);

  const goalsProgress = useMemo(() => {
    const sumIncome = transactions.filter(t=>t.type==='income').reduce((a,b)=>a+Number(b.amount||0),0);
    return goals.map(g => ({ ...g, progress: Math.min(100, Math.round((sumIncome / Number(g.target||1)) * 100)) }));
  }, [goals, transactions]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Budgets</h3>
          <form onSubmit={(e)=>{e.preventDefault(); onAddBudget({ name: bForm.name || 'General', limit: Number(bForm.limit||0) }); setBForm({name:'',limit:''});}} className="flex items-center gap-2">
            <input required placeholder="Category" value={bForm.name} onChange={e=>setBForm(f=>({...f,name:e.target.value}))}
              className="w-28 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <input required type="number" step="0.01" placeholder="Limit" value={bForm.limit} onChange={e=>setBForm(f=>({...f,limit:e.target.value}))}
              className="w-28 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <button className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-1 text-xs text-white dark:bg-white dark:text-neutral-900"><Plus size={14}/>Add</button>
          </form>
        </div>
        <div className="space-y-3">
          {budgets.map((b, idx) => {
            const spent = monthSpend[b.name] || 0;
            const pct = Math.min(100, Math.round((spent / (b.limit || 1)) * 100));
            return (
              <div key={idx} className="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="font-medium">{b.name}</div>
                  <div className="text-neutral-500">{spent.toFixed(2)} / {Number(b.limit).toFixed(2)}</div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div className={`h-full ${pct < 80 ? 'bg-emerald-500' : pct < 100 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <button onClick={()=>onRemoveBudget(idx)} className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"><Trash2 size={14}/>Remove</button>
                </div>
              </div>
            );
          })}
          {budgets.length === 0 && (
            <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">No budgets yet. Add your first category limit above.</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Goals</h3>
          <form onSubmit={(e)=>{e.preventDefault(); onAddGoal({ title: gForm.title || 'Goal', target: Number(gForm.target||0) }); setGForm({title:'',target:''});}} className="flex items-center gap-2">
            <input required placeholder="Title" value={gForm.title} onChange={e=>setGForm(f=>({...f,title:e.target.value}))}
              className="w-36 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <input required type="number" step="0.01" placeholder="Target" value={gForm.target} onChange={e=>setGForm(f=>({...f,target:e.target.value}))}
              className="w-28 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <button className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-1 text-xs text-white dark:bg-white dark:text-neutral-900"><Plus size={14}/>Add</button>
          </form>
        </div>
        <div className="space-y-3">
          {goalsProgress.map((g, idx) => (
            <div key={idx} className="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="font-medium">{g.title}</div>
                <div className="text-neutral-500">Target: {Number(g.target).toFixed(2)}</div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div className="h-full bg-blue-500" style={{ width: `${g.progress}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <span>{g.progress}%</span>
                <button onClick={()=>onRemoveGoal(idx)} className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"><Trash2 size={14}/>Remove</button>
              </div>
            </div>
          ))}
          {goals.length === 0 && (
            <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">No goals yet. Add your first savings goal above.</div>
          )}
        </div>
      </div>
    </div>
  );
}
