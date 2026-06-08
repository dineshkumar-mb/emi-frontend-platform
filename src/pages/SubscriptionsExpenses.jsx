import React, { useState, useEffect } from 'react';
import { CreditCard, Repeat, Trash2, Plus, HelpCircle, FileText, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/geoConfig';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#14b8a6', '#f43f5e'];

export default function SubscriptionsExpenses() {
  const { user } = useAuth();
  
  // States
  const [subscriptions, setSubscriptions] = useState([]);
  const [burden, setBurden] = useState({ totalMonthlyBurden: 0, recommendations: [] });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sub Form
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subFrequency, setSubFrequency] = useState('monthly');
  const [subLoading, setSubLoading] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Statement Analyzer Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, burdenRes] = await Promise.all([
        fetch('/api/subscriptions'),
        fetch('/api/subscriptions/detect'),
      ]);

      if (subsRes.ok && burdenRes.ok) {
        setSubscriptions(await subsRes.json());
        setBurden(await burdenRes.json());
      } else {
        setError('Failed to fetch subscriptions.');
      }
    } catch (err) {
      setError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSub = async (e) => {
    e.preventDefault();
    setSubLoading(true);
    try {
      const r = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subName, amount: Number(subAmount), frequency: subFrequency }),
      });
      if (r.ok) {
        setSubName('');
        setSubAmount('');
        setIsSubModalOpen(false);
        fetchData();
      }
    } catch {
      setError('Failed to add subscription.');
    } finally {
      setSubLoading(false);
    }
  };

  const handleDeleteSub = async (id) => {
    if (!window.confirm('Delete this subscription?')) return;
    try {
      const r = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      if (r.ok) fetchData();
    } catch {
      setError('Failed to delete subscription.');
    }
  };

  const handleUploadStatement = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadResult(null);
    setError('');

    const fd = new FormData();
    fd.append('file', uploadFile);

    try {
      const r = await fetch('/api/intelligence/analyze-statement', {
        method: 'POST',
        body: fd,
      });
      if (r.ok) {
        const data = await r.json();
        setUploadResult(data);
        setIsUploadModalOpen(false);
        fetchData();
      } else {
        const d = await r.json();
        setError(d.message || 'Gemini statement analyzer failed.');
      }
    } catch (err) {
      setError('Statement analyzer connection lost: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Quick Mock Expense graph data
  const subTotal = burden.totalMonthlyBurden;
  const mockExpenseData = [
    { name: 'Subscriptions', value: subTotal || 1200 },
    { name: 'Food', value: 8500 },
    { name: 'Fuel & Utility', value: 4200 },
    { name: 'Shopping', value: 6800 },
    { name: 'Medical', value: 1500 },
    { name: 'Entertainment', value: 3100 },
  ];

  if (loading && subscriptions.length === 0) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><p style={{ color: 'var(--text-secondary)' }}>Loading subscriptions and expenses...</p></div>;
  }

  return (
    <div className="animate-fade-in page-container">
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '6px' }}>Subscriptions & Expenses</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Monitor monthly SaaS/media recurring burn rates and upload bank statements to auto-categorise bills.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setIsUploadModalOpen(true)} className="btn btn-secondary" style={{ border: '1px dashed var(--color-brand)', background: 'rgba(99,102,241,0.03)' }}>
            <FileText size={16} color="var(--color-brand)" /> Analyze Bank Statement
          </button>
          <button onClick={() => setIsSubModalOpen(true)} className="btn btn-primary"><Plus size={16} /> Add Subscription</button>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Subscription Burden Hero */}
      <div className="metrics-grid" style={{ marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Total Subscription Burn</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-brand)', marginTop: '8px' }}>
              {formatCurrency(burden.totalMonthlyBurden, user?.geo || 'IN')}/mo
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>Annual Projections: {formatCurrency(burden.totalMonthlyBurden * 12, user?.geo || 'IN')}/yr</p>
          </div>
          <CreditCard size={36} color="var(--color-brand)" style={{ opacity: 0.8 }} />
        </div>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>SaaS / Subscription count</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-success)', marginTop: '8px' }}>{subscriptions.length} Active</h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>Auto-debited from bank accounts</p>
          </div>
          <Repeat size={36} color="var(--color-success)" style={{ opacity: 0.8 }} />
        </div>
      </div>

      {/* Statement Analysis Results Banner */}
      {uploadResult && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '28px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.02)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
            <CheckCircle size={20} color="var(--color-success)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Gemini Statement Processing Complete</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{uploadResult.summary.explanation}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Detected Income</span>
              <h4 style={{ fontWeight: 800, marginTop: '2px', color: 'var(--color-success)' }}>{formatCurrency(uploadResult.summary.detectedMonthlyIncome, user?.geo || 'IN')}</h4>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Detected Recurring Bill</span>
              <h4 style={{ fontWeight: 800, marginTop: '2px', color: 'var(--color-danger)' }}>{formatCurrency(uploadResult.summary.detectedMonthlyExpenses, user?.geo || 'IN')}</h4>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Created Subscriptions</span>
              <h4 style={{ fontWeight: 800, marginTop: '2px', color: 'var(--color-brand)' }}>{uploadResult.subscriptionsCreated.length} Added</h4>
            </div>
          </div>
          {uploadResult.loansDetected.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Loans / Liabilities Detected in Statement</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {uploadResult.loansDetected.map((loan, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem' }}>
                    <span><strong>{loan.provider}</strong> ({loan.loanType})</span>
                    <span>EMI: <strong>{formatCurrency(loan.emiAmount, user?.geo || 'IN')}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid-2-col" style={{ gap: '24px' }}>
        {/* Active Subscriptions */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Repeat size={18} color="var(--color-brand)" /> Active Subscriptions
          </h3>
          {subscriptions.length === 0 ? (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <HelpCircle size={30} style={{ color: 'var(--text-muted)', marginBottom: '8px', display: 'inline-block' }} />
              <p style={{ fontSize: '0.85rem' }}>No subscriptions logged. Click Add Subscription to record monthly charges.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {subscriptions.map(sub => {
                const rec = burden.recommendations.find(r => r.id === sub._id);
                return (
                  <div key={sub._id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{sub.name}</h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{formatCurrency(sub.amount, user?.geo || 'IN')} / {sub.frequency}</span>
                      </div>
                      <button onClick={() => handleDeleteSub(sub._id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                    {rec && (
                      <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={12} color="var(--color-warning)" />
                        <span>{rec.recommendation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense Category Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', alignSelf: 'flex-start' }}>Monthly Expense Distribution</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockExpenseData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {mockExpenseData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} formatter={v => formatCurrency(v, user?.geo || 'IN')} />
                <Legend iconType="circle" fontSize={10} layout="horizontal" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MODAL: Add Sub */}
      {isSubModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '30px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Record Subscription</h3>
              <button onClick={() => setIsSubModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddSub}>
              <div className="form-group"><label className="form-label">Subscription Provider</label><input type="text" className="form-input" placeholder="e.g. Netflix, Prime, ChatGPT" value={subName} onChange={e => setSubName(e.target.value)} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group"><label className="form-label">Billing Amount</label><input type="number" className="form-input" placeholder="e.g. 199" value={subAmount} onChange={e => setSubAmount(e.target.value)} required min={1} /></div>
                <div className="form-group"><label className="form-label">Frequency</label>
                  <select value={subFrequency} onChange={e => setSubFrequency(e.target.value)} style={{ width: '100%' }}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={subLoading}>{subLoading ? 'Saving...' : 'Add Subscription'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Analyze Statement */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '30px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Upload Statement / Invoice</h3>
              <button onClick={() => { setIsUploadModalOpen(false); setUploadFile(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Select a PDF statement, image screenshot of your transactions list, or CSV sheet. Gemini Multimodal AI will parse, categorize, and auto-detect recurring bills and SaaS accounts.
            </p>
            <form onSubmit={handleUploadStatement}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Select Bank Statement File</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.csv" className="form-input" onChange={e => setUploadFile(e.target.files[0])} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={uploadLoading || !uploadFile}>
                <Sparkles size={16} /> {uploadLoading ? 'Running AI Categorization...' : 'Analyze with Gemini AI'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
