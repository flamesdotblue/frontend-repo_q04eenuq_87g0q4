import { create } from 'zustand';
import { db, seedDefaults, recalcAccountBalances } from '../lib/db';

export const useAppStore = create((set, get) => ({
  ready: false,
  accounts: [],
  transactions: [],
  categories: [],
  settings: {},

  init: async () => {
    await seedDefaults();
    const [accounts, transactions, categories, settingsArr] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.orderBy('date').toArray(),
      db.categories.toArray(),
      db.settings.toArray(),
    ]);
    const settings = Object.fromEntries(settingsArr.map((s) => [s.key, s.value]));
    set({ accounts, transactions, categories, settings, ready: true });
  },

  addAccount: async (data) => {
    const id = await db.accounts.add({
      name: data.name,
      type: data.type,
      bank: data.bank || '',
      initialBalance: Number(data.initialBalance || 0),
      balance: Number(data.initialBalance || 0),
      createdAt: new Date().toISOString(),
    });
    await recalcAccountBalances();
    const accounts = await db.accounts.toArray();
    set({ accounts });
    return id;
  },

  editAccount: async (id, patch) => {
    await db.accounts.update(id, patch);
    await recalcAccountBalances();
    const accounts = await db.accounts.toArray();
    set({ accounts });
  },

  deleteAccount: async (id) => {
    await db.transaction('rw', db.accounts, db.transactions, async () => {
      await db.transactions.where('accountId').equals(id).delete();
      await db.accounts.delete(id);
    });
    await recalcAccountBalances();
    const [accounts, transactions] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.orderBy('date').toArray(),
    ]);
    set({ accounts, transactions });
  },

  addTransaction: async (tx) => {
    const data = {
      type: tx.type, // income | expense | investment | transfer_in | transfer_out
      category: tx.category || '',
      subcategory: tx.subcategory || '',
      amount: Number(tx.amount || 0),
      accountId: Number(tx.accountId),
      date: tx.date || new Date().toISOString(),
      description: tx.description || '',
      meta: tx.meta || {},
    };
    await db.transactions.add(data);
    await recalcAccountBalances();
    const [transactions, accounts] = await Promise.all([
      db.transactions.orderBy('date').toArray(),
      db.accounts.toArray(),
    ]);
    set({ transactions, accounts });
  },

  transfer: async ({ fromAccountId, toAccountId, amount, date, notes }) => {
    if (fromAccountId === toAccountId) throw new Error('Source and destination cannot be the same');
    const acc = await db.accounts.get(fromAccountId);
    if (!acc) throw new Error('Source account not found');
    if ((acc.balance || 0) < amount) throw new Error('Insufficient balance');

    await db.transaction('rw', db.transactions, async () => {
      await db.transactions.add({ type: 'transfer_out', amount, accountId: fromAccountId, date, description: notes || '' });
      await db.transactions.add({ type: 'transfer_in', amount, accountId: toAccountId, date, description: notes || '' });
    });

    await recalcAccountBalances();
    const [transactions, accounts] = await Promise.all([
      db.transactions.orderBy('date').toArray(),
      db.accounts.toArray(),
    ]);
    set({ transactions, accounts });
  },

  addCategory: async ({ kind, name }) => {
    await db.categories.add({ kind, name, isDefault: false });
    const categories = await db.categories.toArray();
    set({ categories });
  },

  deleteCategory: async (id) => {
    const cat = await db.categories.get(id);
    if (cat?.isDefault) throw new Error('Cannot delete default category');
    await db.categories.delete(id);
    const categories = await db.categories.toArray();
    set({ categories });
  },

  exportJSON: async () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts: await db.accounts.toArray(),
      transactions: await db.transactions.toArray(),
      categories: await db.categories.toArray(),
      settings: await db.settings.toArray(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fintrack-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON: async (file) => {
    const text = await file.text();
    const data = JSON.parse(text);
    await db.transaction('rw', db.accounts, db.transactions, db.categories, db.settings, async () => {
      await db.accounts.clear();
      await db.transactions.clear();
      await db.categories.clear();
      await db.settings.clear();
      await db.accounts.bulkAdd(data.accounts || []);
      await db.transactions.bulkAdd(data.transactions || []);
      await db.categories.bulkAdd(data.categories || []);
      if (data.settings) await db.settings.bulkAdd(data.settings);
    });
    await recalcAccountBalances();
    const [accounts, transactions, categories] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.orderBy('date').toArray(),
      db.categories.toArray(),
    ]);
    set({ accounts, transactions, categories });
  },
}));
