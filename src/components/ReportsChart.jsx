import React, { useMemo, useState } from 'react';

/****
  Props: transactions: Array<{ id, type: 'income'|'expense'|'investment'|'transfer', amount: number, date: string }>
****/
export default function ReportsChart({ transactions = [] }) {
  const [monthsBack, setMonthsBack] = useState(6);

  const data = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ key, label: d.toLocaleString(undefined, { month: 'short' }), income: 0, expense: 0 });
    }
    const map = Object.fromEntries(buckets.map(b => [b.key, b]));
    for (const t of transactions) {
      const dt = new Date(t.date);
      const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (!map[k]) continue;
      if (t.type === 'income') map[k].income += Number(t.amount) || 0;
      if (t.type === 'expense') map[k].expense += Number(t.amount) || 0;
    }
    return buckets;
  }, [transactions, monthsBack]);

  const maxVal = Math.max(1, ...data.map(d => Math.max(d.income, d.expense)));

  return (
    <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Income vs Expense</h2>
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <label>Months:</label>
          <select value={monthsBack} onChange={e => setMonthsBack(Number(e.target.value))} className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900">
            {[3,6,9,12].map(n => (<option key={n} value={n}>{n}</option>))}
          </select>
        </div>
      </div>
      <div className="relative h-52 w-full">
        <svg className="h-full w-full" viewBox={`0 0 ${data.length * 40 + 20} 200`}>
          {/* grid */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i} x1={0} x2={data.length * 40 + 20} y1={i * 40} y2={i * 40} stroke="#e5e7eb" opacity="0.5" />
          ))}
          {data.map((d, idx) => {
            const x = 20 + idx * 40;
            const incH = (d.income / maxVal) * 160;
            const expH = (d.expense / maxVal) * 160;
            return (
              <g key={d.key}>
                <rect x={x - 10} y={180 - incH} width={10} height={incH} rx={2} fill="#10b981" />
                <rect x={x + 2} y={180 - expH} width={10} height={expH} rx={2} fill="#ef4444" />
                <text x={x} y={195} textAnchor="middle" className="fill-neutral-500 text-[10px]">{d.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Income</div>
        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Expense</div>
      </div>
    </div>
  );
}
