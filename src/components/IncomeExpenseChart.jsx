import React, { useMemo } from 'react';

// Lightweight inline SVG line chart to avoid extra chart libraries for now
const IncomeExpenseChart = ({ monthly }) => {
  const { width, height, padding } = { width: 640, height: 260, padding: 32 };

  const scaled = useMemo(() => {
    if (!monthly || monthly.length === 0) return { income: [], expense: [], labels: [] };
    const maxVal = Math.max(
      ...monthly.flatMap((m) => [m.income || 0, m.expense || 0, 1])
    );
    const scaleY = (v) => height - padding - (v / maxVal) * (height - padding * 2);
    const scaleX = (i) => padding + (i * (width - padding * 2)) / Math.max(1, monthly.length - 1);

    const income = monthly.map((m, i) => ({ x: scaleX(i), y: scaleY(m.income || 0) }));
    const expense = monthly.map((m, i) => ({ x: scaleX(i), y: scaleY(m.expense || 0) }));
    const labels = monthly.map((m) => m.label);
    return { income, expense, labels, maxVal };
  }, [monthly]);

  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Income vs Expense (6 months)</h3>
        <div className="text-xs text-slate-500 dark:text-slate-400">Local preview</div>
      </div>
      <div className="w-full overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="min-w-[480px]">
          {/* grid */}
          <g>
            {Array.from({ length: 4 }).map((_, i) => {
              const y = 32 + (i * (height - 64)) / 4;
              return <line key={i} x1="32" x2={width - 32} y1={y} y2={y} stroke="#e5e7eb" className="dark:stroke-slate-800" />;
            })}
          </g>
          {/* axes */}
          <line x1="32" x2="32" y1="24" y2={height - 24} stroke="#94a3b8" strokeWidth="1" />
          <line x1="32" x2={width - 24} y1={height - 32} y2={height - 32} stroke="#94a3b8" strokeWidth="1" />

          {/* paths */}
          <path d={toPath(scaled.expense)} fill="none" stroke="#ef4444" strokeWidth="2.5" />
          <path d={toPath(scaled.income)} fill="none" stroke="#10b981" strokeWidth="2.5" />

          {/* dots */}
          {scaled.income.map((p, i) => (
            <circle key={`i-${i}`} cx={p.x} cy={p.y} r="3" fill="#10b981" />
          ))}
          {scaled.expense.map((p, i) => (
            <circle key={`e-${i}`} cx={p.x} cy={p.y} r="3" fill="#ef4444" />
          ))}

          {/* labels */}
          {scaled.labels.map((l, i) => (
            <text key={l} x={32 + (i * (width - 64)) / Math.max(1, scaled.labels.length - 1)} y={height - 10} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px]">
              {l}
            </text>
          ))}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-3 text-sm">
        <div className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" /> Income</div>
        <div className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-rose-500" /> Expense</div>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;
