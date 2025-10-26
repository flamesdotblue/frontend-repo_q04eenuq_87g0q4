import React from 'react';
import ReportsChart from './ReportsChart.jsx';
import BudgetsGoals from './BudgetsGoals.jsx';

export default function DashboardOverview({ transactions, budgets, goals, onAddBudget, onRemoveBudget, onAddGoal, onRemoveGoal }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <ReportsChart transactions={transactions} />
      <BudgetsGoals 
        budgets={budgets}
        goals={goals}
        transactions={transactions}
        onAddBudget={onAddBudget}
        onRemoveBudget={onRemoveBudget}
        onAddGoal={onAddGoal}
        onRemoveGoal={onRemoveGoal}
      />
    </section>
  );
}
