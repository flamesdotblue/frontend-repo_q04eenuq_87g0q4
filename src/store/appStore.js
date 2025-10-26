import { create } from 'zustand';
import { db, seedDefaults, recalcAccountBalances } from '../lib/db';

// Simple Web Crypto helpers for PIN hashing and AES-GCM encryption for backups
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptJSON(password, data) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const payload = new Uint8Array(salt.byteLength + iv.byteLength + cipher.byteLength);
  payload.set(salt, 0);
  payload.set(iv, salt.byteLength);
  payload.set(new Uint8Array(cipher), salt.byteLength + iv.byteLength);
  return payload;
}

async function decryptJSON(password, payload) {
  const salt = payload.slice(0, 16);
  const iv = payload.slice(16, 28);
  const data = payload.slice(28);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  const text = new TextDecoder().decode(plain);
  return JSON.parse(text);
}

export const useAppStore = create((set, get) => ({
  ready: false,
  locked: false,
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
    const locked = !!settings.pinHash; // lock if PIN is set
    set({ accounts, transactions, categories, settings, ready: true, locked });
  },

  // PIN lock
  setPIN: async (pin) => {
    if (!pin) return;
    const pinHash = await sha256(String(pin));
    await db.settings.put({ key: 'pinHash', value: pinHash });
    const settingsArr = await db.settings.toArray();
    const settings = Object.fromEntries(settingsArr.map((s) => [s.key, s.value]));
    set({ settings, locked: true });
  },
  clearPIN: async () => {
    await db.settings.delete('pinHash');
    const settingsArr = await db.settings.toArray();
    const settings = Object.fromEntries(settingsArr.map((s) => [s.key, s.value]));
    set({ settings, locked: false });
  },
  unlock: async (pin) => {
    const pinHash = await sha256(String(pin));
    const rec = await db.settings.get('pinHash');
    if (rec && rec.value === pinHash) {
      set({ locked: false });
      return true;
    }
    return false;
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

  // Budgets and Goals stored under settings keys as arrays
  addBudget: async (budget) => {
    const current = (await db.settings.get('budgets'))?.value || [];
    current.push({ id: crypto.randomUUID(), ...budget });
    await db.settings.put({ key: 'budgets', value: current });
    const settingsArr = await db.settings.toArray();
    const settings = Object.fromEntries(settingsArr.map((s) => [s.key, s.value]));
    set({ settings });
  },
  deleteBudget: async (id) => {
    const current = (await db.settings.get('budgets'))?.value || [];
    const next = current.filter((b) => b.id !== id);
    await db.settings.put({ key: 'budgets', value: next });
    const settingsArr = await db.settings.toArray();
    const settings = Object.fromEntries(settingsArr.map((s) => [s.key, s.value]));
    set({ settings });
  },
  addGoal: async (goal) => {
    const current = (await db.settings.get('goals'))?.value || [];
    current.push({ id: crypto.randomUUID(), ...goal });
    await db.settings.put({ key: 'goals', value: current });
    const settingsArr = await db.settings.toArray();
    const settings = Object.fromEntries(settingsArr.map((s) => [s.key, s.value]));
    set({ settings });
  },
  deleteGoal: async (id) => {
    const current = (await db.settings.get('goals'))?.value || [];
    const next = current.filter((g) => g.id !== id);
    await db.settings.put({ key: 'goals', value: next });
    const settingsArr = await db.settings.toArray();
    const settings = Object.fromEntries(settingsArr.map((s) => [s.key, s.value]));
    set({ settings });
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

  exportEncrypted: async (password) => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts: await db.accounts.toArray(),
      transactions: await db.transactions.toArray(),
      categories: await db.categories.toArray(),
      settings: await db.settings.toArray(),
    };
    const bytes = await encryptJSON(password, payload);
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fintrack-backup.enc';
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
    const [accounts, transactions, categories, settingsArr] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.orderBy('date').toArray(),
      db.categories.toArray(),
      db.settings.toArray(),
    ]);
    const settings = Object.fromEntries(settingsArr.map((s) => [s.key, s.value]));
    set({ accounts, transactions, categories, settings });
  },

  importEncrypted: async (file, password) => {
    const buf = new Uint8Array(await file.arrayBuffer());
    const data = await decryptJSON(password, buf);
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
    const [accounts, transactions, categories, settingsArr] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.orderBy('date').toArray(),
      db.categories.toArray(),
      db.settings.toArray(),
    ]);
    const settings = Object.fromEntries(settingsArr.map((s) => [s.key, s.value]));
    set({ accounts, transactions, categories, settings });
  },
}));
