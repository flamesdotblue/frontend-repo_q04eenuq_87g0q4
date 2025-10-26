import React, { useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, LineChart, Repeat } from 'lucide-react';

const ActionButton = ({ icon: Icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-white ${color} shadow hover:brightness-110 transition`}
  >
    <Icon size={18} /> {label}
  </button>
);

const FloatingActionButton = ({ onAddIncome, onAddExpense, onAddInvestment, onTransfer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-5 bottom-6 z-20">
      {/* menu */}
      {open && (
        <div className="mb-3 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl">
          <div className="grid gap-2">
            <ActionButton icon={ArrowUpCircle} label="Add Income" color="bg-emerald-600" onClick={onAddIncome} />
            <ActionButton icon={ArrowDownCircle} label="Add Expense" color="bg-rose-600" onClick={onAddExpense} />
            <ActionButton icon={LineChart} label="Add Investment" color="bg-indigo-600" onClick={onAddInvestment} />
            <ActionButton icon={Repeat} label="Transfer" color="bg-amber-600" onClick={onTransfer} />
          </div>
        </div>
      )}

      {/* fab */}
      <button
        aria-label="Add"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center justify-center size-14 rounded-full bg-blue-600 text-white shadow-xl hover:scale-105 active:scale-95 transition"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default FloatingActionButton;
