import React from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, LineChart } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
    <div className={`absolute -right-10 -top-10 size-24 rounded-full blur-2xl opacity-20 ${accent}`} />
    <div className="flex items-center gap-3">
      <div className={`inline-flex items-center justify-center rounded-lg p-2.5 text-white ${accent}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-semibold mt-0.5">₹ {value.toLocaleString('en-IN')}</p>
      </div>
    </div>
  </div>
);

const StatCards = ({ totalIncome, totalExpenses, totalInvestments, netBalance }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <StatCard icon={ArrowUpCircle} label="Total Income" value={totalIncome} accent="bg-emerald-500" />
      <StatCard icon={ArrowDownCircle} label="Total Expenses" value={totalExpenses} accent="bg-rose-500" />
      <StatCard icon={LineChart} label="Investments" value={totalInvestments} accent="bg-indigo-500" />
      <StatCard icon={Wallet} label="Net Balance" value={netBalance} accent="bg-amber-500" />
    </div>
  );
};

export default StatCards;
