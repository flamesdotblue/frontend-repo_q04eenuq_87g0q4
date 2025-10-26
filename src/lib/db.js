import Dexie from 'dexie';

// IndexedDB setup using Dexie
// Tables:
// - accounts: {id, name, type, bank, balance, createdAt}
// - transactions: {id, type, category, subcategory, amount, accountId, date, description, meta}
// - categories: {id, kind, name, isDefault}
// - settings: {key, value}

export const db = new Dexie('fintrack_db');

db.version(1).stores({
  accounts: '++id, name, type, bank, balance, createdAt',
  transactions: '++id, type, category, subcategory, amount, accountId, date',
  categories: '++id, kind, name, isDefault',
  settings: '&key',
});

export async function seedDefaults() {
  const count = await db.categories.count();
  if (count > 0) return;
  const income = ['Salary', 'Freelance', 'Business', 'Investment', 'Other'];
  const expense = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Education', 'Other'];
  await db.categories.bulkAdd([
    ...income.map((n) => ({ kind: 'income', name: n, isDefault: true })),
    ...expense.map((n) => ({ kind: 'expense', name: n, isDefault: true })),
  ]);
}

export async function recalcAccountBalances() {
  const accounts = await db.accounts.toArray();
  for (const acc of accounts) {
    const txs = await db.transactions.where('accountId').equals(acc.id).toArray();
    const income = txs.filter(t => t.type === 'income').reduce((a,b)=>a+b.amount,0);
    const expense = txs.filter(t => t.type === 'expense').reduce((a,b)=>a+b.amount,0);
    const investment = txs.filter(t => t.type === 'investment').reduce((a,b)=>a+b.amount,0);
    const transfersIn = txs.filter(t => t.type === 'transfer_in').reduce((a,b)=>a+b.amount,0);
    const transfersOut = txs.filter(t => t.type === 'transfer_out').reduce((a,b)=>a+b.amount,0);
    const newBal = (acc.initialBalance || 0) + income - expense - investment + transfersIn - transfersOut;
    await db.accounts.update(acc.id, { balance: newBal });
  }
}
