import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, CheckCircle, Plus, Trash2, ArrowRight, HelpCircle, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/geoConfig';

export default function NetWorthGoals() {
  const { user } = useAuth();
  
  // States
  const [assets, setAssets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [netWorthData, setNetWorthData] = useState({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Asset Form
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('Bank Account');
  const [assetValue, setAssetValue] = useState('');
  const [assetLoading, setAssetLoading] = useState(false);

  // Goal Form
  const [goalName, setGoalName] = useState('');
  const [goalCategory, setGoalCategory] = useState('Emergency Fund');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalLoading, setGoalLoading] = useState(false);

  const [activeForm, setActiveForm] = useState(null); // 'asset' | 'goal' | null

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, goalsRes, netWorthRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/goals'),
        fetch('/api/assets/net-worth'),
      ]);

      if (assetsRes.ok && goalsRes.ok && netWorthRes.ok) {
        setAssets(await assetsRes.json());
        setGoals(await goalsRes.json());
        setNetWorthData(await netWorthRes.json());
      } else {
        setError('Failed to retrieve net worth or goal planner matrices.');
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

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setAssetLoading(true);
    try {
      const r = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: assetName, category: assetCategory, value: Number(assetValue) }),
      });
      if (r.ok) {
        setAssetName('');
        setAssetValue('');
        setActiveForm(null);
        fetchData();
      }
    } catch {
      setError('Failed to add asset.');
    } finally {
      setAssetLoading(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Remove this asset?')) return;
    try {
      const r = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      if (r.ok) fetchData();
    } catch {
      setError('Failed to delete asset.');
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setGoalLoading(true);
    try {
      const r = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: goalName,
          category: goalCategory,
          targetAmount: Number(goalTargetAmount),
          currentAmount: Number(goalCurrentAmount || 0),
          targetDate: goalTargetDate,
        }),
      });
      if (r.ok) {
        setGoalName('');
        setGoalTargetAmount('');
        setGoalCurrentAmount('');
        setGoalTargetDate('');
        setActiveForm(null);
        fetchData();
      }
    } catch {
      setError('Failed to add goal.');
    } finally {
      setGoalLoading(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Remove this goal?')) return;
    try {
      const r = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (r.ok) fetchData();
    } catch {
      setError('Failed to delete goal.');
    }
  };

  if (loading && assets.length === 0 && goals.length === 0) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><p style={{ color: 'var(--text-secondary)' }}>Loading asset portfolios and smart goals...</p></div>;
  }

  return (
    <div className="animate-fade-in page-container">
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '6px' }}>Net Worth & Goals</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Balance asset holdings against outstanding liabilities and track saving goals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActiveForm('asset')} className="btn btn-secondary"><Plus size={16} /> Add Asset</button>
          <button onClick={() => setActiveForm('goal')} className="btn btn-primary"><Plus size={16} /> Add Goal</button>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Net Worth Summary Cards */}
      <div className="metrics-grid" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Assets', value: formatCurrency(netWorthData.totalAssets, user?.geo || 'IN'), sub: 'Savings, investments & holdings', color: 'var(--color-success)' },
          { label: 'Outstanding Liabilities', value: formatCurrency(netWorthData.totalLiabilities, user?.geo || 'IN'), sub: 'Accumulated active loan debt', color: 'var(--color-danger)' },
          { label: 'Calculated Net Worth', value: formatCurrency(netWorthData.netWorth, user?.geo || 'IN'), sub: 'Assets minus liabilities', color: 'var(--color-brand)' },
        ].map((item, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '24px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>{item.label}</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: item.color, marginTop: '8px' }}>{item.value}</h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Forms Modals */}
      {activeForm === 'asset' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '30px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Record Asset Holding</h3>
              <button onClick={() => setActiveForm(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddAsset}>
              <div className="form-group"><label className="form-label">Asset Name</label><input type="text" className="form-input" placeholder="e.g. HDFC Account, Gold ETF" value={assetName} onChange={e => setAssetName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Classification</label>
                <select value={assetCategory} onChange={e => setAssetCategory(e.target.value)} style={{ width: '100%' }}>
                  {['Bank Account', 'Mutual Funds', 'Stocks', 'Gold', 'Real Estate', 'Other'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Value</label><input type="number" className="form-input" placeholder="e.g. 150000" value={assetValue} onChange={e => setAssetValue(e.target.value)} required min={1} /></div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={assetLoading}>{assetLoading ? 'Adding...' : 'Confirm Asset'}</button>
            </form>
          </div>
        </div>
      )}

      {activeForm === 'goal' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '30px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create Saving Goal</h3>
              <button onClick={() => setActiveForm(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddGoal}>
              <div className="form-group"><label className="form-label">Goal Name</label><input type="text" className="form-input" placeholder="e.g. Vacation Fund, Car Purchase" value={goalName} onChange={e => setGoalName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Classification</label>
                <select value={goalCategory} onChange={e => setGoalCategory(e.target.value)} style={{ width: '100%' }}>
                  {['House Purchase', 'Car Purchase', 'Marriage Fund', 'Emergency Fund', 'Retirement Fund', 'Vacation Fund', 'Other'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group"><label className="form-label">Target Amount</label><input type="number" className="form-input" placeholder="e.g. 500000" value={goalTargetAmount} onChange={e => setGoalTargetAmount(e.target.value)} required min={1} /></div>
                <div className="form-group"><label className="form-label">Current Saved</label><input type="number" className="form-input" placeholder="e.g. 50000" value={goalCurrentAmount} onChange={e => setGoalCurrentAmount(e.target.value)} min={0} /></div>
              </div>
              <div className="form-group"><label className="form-label">Target Date</label><input type="date" className="form-input" value={goalTargetDate} onChange={e => setGoalTargetDate(e.target.value)} required /></div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={goalLoading}>{goalLoading ? 'Analyzing goal variables...' : 'Confirm Goal'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Assets & Goals lists */}
      <div className="grid-2-col" style={{ gap: '24px' }}>
        {/* Assets List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--color-success)" /> Active Asset Allocation
          </h3>
          {assets.length === 0 ? (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Landmark size={30} style={{ color: 'var(--text-muted)', marginBottom: '8px', display: 'inline-block' }} />
              <p style={{ fontSize: '0.85rem' }}>No assets tracked. Click Add Asset to record savings accounts or mutual funds.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assets.map(asset => (
                <div key={asset._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{asset.name}</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>{asset.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <strong style={{ fontSize: '0.92rem' }}>{formatCurrency(asset.value, user?.geo || 'IN')}</strong>
                    <button onClick={() => handleDeleteAsset(asset._id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="var(--color-brand)" /> Smart Saving Goals
          </h3>
          {goals.length === 0 ? (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Target size={30} style={{ color: 'var(--text-muted)', marginBottom: '8px', display: 'inline-block' }} />
              <p style={{ fontSize: '0.85rem' }}>No goals defined. Click Add Goal to launch saving roadmap trackers.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {goals.map(goal => (
                <div key={goal._id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{goal.name}</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>{goal.category}</span>
                    </div>
                    <button onClick={() => handleDeleteGoal(goal._id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', marginTop: '10px' }}>
                    <span>Progress: {formatCurrency(goal.currentAmount, user?.geo || 'IN')}</span>
                    <span>Target: {formatCurrency(goal.targetAmount, user?.geo || 'IN')}</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(2, (goal.currentAmount / goal.targetAmount) * 100))}%` }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <span>Target Date: {new Date(goal.targetDate).toLocaleDateString()}</span>
                    <span>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}% Achieved</span>
                  </div>

                  {/* AI Recommendation Box */}
                  <div style={{ background: 'rgba(99,102,241,0.04)', borderLeft: '3px solid var(--color-brand)', padding: '10px 12px', borderRadius: '4px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <strong>AI Advice:</strong> {goal.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
