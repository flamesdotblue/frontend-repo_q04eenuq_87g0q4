import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';

export default function CRUDTabs({ accounts, transactions, investments, onCreate, onUpdate, onDelete }) {
  const [tab, setTab] = useState('accounts');
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (tab !== 'accounts') payload.amount = Number(payload.amount) || 0;
    if (editingId) {
      onUpdate(tab, editingId, payload);
    } else {
      onCreate(tab, payload);
    }
    setForm({});
    setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setForm(rest);
  };

  const list = useMemo(() => {
    if (tab === 'accounts') return accounts;
    if (tab === 'transactions') return transactions;
    return investments;
  }, [tab, accounts, transactions, investments]);

  return (
    <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-4 flex items-center gap-2">
        {['accounts','transactions','investments'].map(t => (
          <button key={t} onClick={() => { setTab(t); setForm({}); setEditingId(null); }}
            className={`rounded-full px-3 py-1 text-sm ${tab===t ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        {tab === 'accounts' && (
          <>
            <input required placeholder="Name" value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <input placeholder="Type (Cash, Bank)" value={form.type||''} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <input type="number" step="0.01" placeholder="Starting Balance" value={form.balance||''} onChange={e=>setForm(f=>({...f,balance:e.target.value}))}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-neutral-900">
              <Plus size={16}/> {editingId? 'Update' : 'Add'}
            </button>
          </>
        )}
        {tab !== 'accounts' && (
          <>
            <select required value={form.accountId||''} onChange={e=>setForm(f=>({...f,accountId:e.target.value}))}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
              <option value="">Select Account</option>
              {accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
            <input required placeholder="Title" value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <input type="number" required step="0.01" placeholder="Amount" value={form.amount||''} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <input type="date" required value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            {tab === 'transactions' && (
              <select required value={form.type||'expense'} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 md:col-span-2">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            )}
            {tab === 'investments' && (
              <input placeholder="Asset (e.g. BTC, AAPL)" value={form.asset||''} onChange={e=>setForm(f=>({...f,asset:e.target.value}))}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 md:col-span-2" />
            )}
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-neutral-900 md:col-span-1">
              <Plus size={16}/> {editingId? 'Update' : 'Add'}
            </button>
          </>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-neutral-500">
            <tr>
              {tab === 'accounts' ? (
                <>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Balance</th>
                </>
              ) : tab === 'transactions' ? (
                <>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Account</th>
                </>
              ) : (
                <>
                  <th className="px-2 py-2">Asset</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Account</th>
                </>
              )}
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(item => (
              <tr key={item.id} className="border-t border-neutral-100 dark:border-neutral-800">
                {tab === 'accounts' ? (
                  <>
                    <td className="px-2 py-2">{item.name}</td>
                    <td className="px-2 py-2">{item.type||'-'}</td>
                    <td className="px-2 py-2">{Number(item.balance||0).toFixed(2)}</td>
                  </>
                ) : tab === 'transactions' ? (
                  <>
                    <td className="px-2 py-2">{item.title}</td>
                    <td className="px-2 py-2 capitalize">{item.type}</td>
                    <td className="px-2 py-2">{Number(item.amount).toFixed(2)}</td>
                    <td className="px-2 py-2">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-2 py-2">{accounts.find(a=>a.id===item.accountId)?.name||'-'}</td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-2">{item.asset||'-'}</td>
                    <td className="px-2 py-2">{item.title}</td>
                    <td className="px-2 py-2">{Number(item.amount).toFixed(2)}</td>
                    <td className="px-2 py-2">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-2 py-2">{accounts.find(a=>a.id===item.accountId)?.name||'-'}</td>
                  </>
                )}
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>startEdit(item)} className="rounded-md border border-neutral-300 p-1 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800" aria-label="Edit"><Pencil size={16}/></button>
                    <button onClick={()=>onDelete(tab, item.id)} className="rounded-md border border-red-300 p-1 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20" aria-label="Delete"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-sm text-neutral-500">No records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
