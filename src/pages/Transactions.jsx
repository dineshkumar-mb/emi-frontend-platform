import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Plus, Trash2, RefreshCw,
  Filter, Search, Calendar, Receipt, TrendingDown, TrendingUp,
  ShoppingBag, Coffee, Fuel, Smartphone, Activity, Zap,
  X, DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getGeoConfig } from '../utils/geoConfig';

const CATEGORIES = [
  'Food', 'Fuel', 'Travel', 'Shopping', 'Medical',
  'Entertainment', 'Bills', 'Insurance', 'Investments', 'Loans', 'Subscriptions', 'Salary', 'Other'
];

const CATEGORY_META = {
  Food: { icon: Coffee, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  Fuel: { icon: Fuel, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  Travel: { icon: Activity, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  Shopping: { icon: ShoppingBag, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  Medical: { icon: Activity, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  Entertainment: { icon: Zap, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  Bills: { icon: Receipt, color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  Insurance: { icon: Activity, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  Investments: { icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  Loans: { icon: DollarSign, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  Subscriptions: { icon: Smartphone, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  Salary: { icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  Other: { icon: Receipt, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

function AddTransactionModal({ onClose, onSave, loading, geo }) {
  const [form, setForm] = useState({ description: '', category: 'Food', amount: '', type: 'debit', date: new Date().toISOString().split('T')[0] });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '28px', width: '100%', maxWidth: '440px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <h3 style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Add Transaction</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description *</label>
            <input className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Grocery at BigBazaar" />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
              <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
              <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="debit">Expense (Debit)</option>
                <option value="credit">Income (Credit)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount *</label>
              <input className="form-input" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min="0" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.description.trim() || !form.amount || loading}
            style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: form.type === 'credit' ? '#10b981' : '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: (!form.description.trim() || !form.amount || loading) ? 0.6 : 1 }}
          >
            {loading ? 'Saving...' : form.type === 'credit' ? '+ Add Income' : '+ Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { user } = useAuth();
  const geo = getGeoConfig(user?.geo || 'IN');
  const fmt = (n) => formatCurrency(n, user?.geo || 'IN');

  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filterCat) params.set('category', filterCat);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/transactions?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to fetch transactions', e);
    } finally {
      setLoading(false);
    }
  }, [filterCat, filterType]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleAdd = async (form) => {
    setSaving(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (res.ok) {
        const tx = await res.json();
        setTransactions(prev => [tx, ...prev]);
        setTotal(t => t + 1);
        setAddModal(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t._id !== id));
        setTotal(t => t - 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = transactions.filter(tx => {
    if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalDebit = filtered.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const totalCredit = filtered.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const netFlow = totalCredit - totalDebit;

  // Group by date
  const grouped = filtered.reduce((acc, tx) => {
    const d = new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(tx);
    return acc;
  }, {});

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tx-row:hover { background: rgba(255,255,255,0.02) !important; }
        .tx-row { transition: background 0.15s; }
        .del-btn:hover { color: #ef4444 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.6rem', margin: 0 }}>Transaction History</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.875rem' }}>
            {total} total transactions • real-time ledger
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
        >
          <Plus size={17} /> Add Transaction
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Expenses', value: fmt(totalDebit), icon: ArrowDownLeft, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Total Income', value: fmt(totalCredit), icon: ArrowUpRight, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Net Cash Flow', value: fmt(Math.abs(netFlow)), icon: netFlow >= 0 ? TrendingUp : TrendingDown, color: netFlow >= 0 ? '#10b981' : '#ef4444', bg: netFlow >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', prefix: netFlow >= 0 ? '+' : '-' },
          { label: 'Transactions', value: filtered.length, icon: Receipt, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: s.bg, borderRadius: '10px', padding: '10px', display: 'flex', flexShrink: 0 }}>
              <s.icon color={s.color} size={20} />
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: '1.25rem', fontWeight: 900 }}>{s.prefix || ''}{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            style={{ width: '100%', paddingLeft: '36px', padding: '9px 12px 9px 36px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '9px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '9px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}>
          <option value="">All Types</option>
          <option value="debit">Expenses</option>
          <option value="credit">Income</option>
        </select>
        <button onClick={fetchTransactions} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>Loading transactions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Receipt color="#64748b" size={48} style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>No Transactions Yet</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px', fontSize: '0.9rem' }}>
            {search || filterCat || filterType ? 'No transactions match your filters.' : 'Upload a bank statement or add a transaction manually to get started.'}
          </p>
          <button onClick={() => setAddModal(true)} style={{ padding: '10px 20px', background: '#6366f1', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Calendar size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{date}</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {txs.length} tx • {fmt(txs.reduce((s, t) => t.type === 'debit' ? s - t.amount : s + t.amount, 0))}
                </span>
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                {txs.map((tx, idx) => {
                  const meta = CATEGORY_META[tx.category] || CATEGORY_META.Other;
                  const Icon = meta.icon;
                  const isDebit = tx.type === 'debit';
                  return (
                    <div
                      key={tx._id}
                      className="tx-row"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
                        borderBottom: idx < txs.length - 1 ? '1px solid var(--border-color)' : 'none',
                      }}
                    >
                      <div style={{ background: meta.bg, borderRadius: '10px', padding: '9px', display: 'flex', flexShrink: 0 }}>
                        <Icon color={meta.color} size={17} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tx.description}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                          <span style={{ background: meta.bg, color: meta.color, padding: '1px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>{tx.category}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: isDebit ? '#ef4444' : '#10b981' }}>
                          {isDebit ? '-' : '+'}{fmt(tx.amount)}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                          {isDebit ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                          {tx.type}
                        </div>
                      </div>
                      <button
                        className="del-btn"
                        onClick={() => handleDelete(tx._id)}
                        disabled={deleting === tx._id}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', transition: 'color 0.15s', flexShrink: 0 }}
                      >
                        {deleting === tx._id ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {addModal && <AddTransactionModal onClose={() => setAddModal(false)} onSave={handleAdd} loading={saving} geo={geo} />}
    </div>
  );
}
