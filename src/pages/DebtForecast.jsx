import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, HelpCircle, Flame, Snowflake, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/geoConfig';

export default function DebtForecast() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('snowball'); // 'snowball' | 'avalanche' | 'normal'

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const r = await fetch('/api/intelligence/debt-free-forecast');
        if (r.ok) {
          const resData = await r.json();
          setData(resData);
        } else {
          setError('Failed to load payoff strategy forecast.');
        }
      } catch (err) {
        setError('Network error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><p style={{ color: 'var(--text-secondary)' }}>Calculating payoff strategy timeline...</p></div>;
  }

  if (error || !data || !data.hasLoans) {
    return (
      <div className="animate-fade-in page-container">
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '6px' }}>Debt-Free Forecast</h1>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '20px' }}>
          <HelpCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', display: 'inline-block' }} />
          <h3>No Active Loans to Simulate</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>
            Please add loans to your portfolio on the dashboard to visualize payoff forecasts and strategies.
          </p>
        </div>
      </div>
    );
  }

  const { normal, snowball, avalanche } = data;

  // Prepare chart points for Recharts.
  // Combine chartData arrays from normal, snowball, and avalanche by month index.
  const maxMonths = Math.max(normal.monthsToDebtFree, snowball.monthsToDebtFree, avalanche.monthsToDebtFree);
  const chartPoints = [];

  for (let m = 0; m <= maxMonths; m++) {
    // Only sample every 2-3 months if tenure is very long to avoid performance slowdowns
    if (maxMonths > 48 && m % 2 !== 0 && m !== maxMonths) continue;

    const normalPt = normal.chartData.find(d => d.month === m) || { totalDebt: 0 };
    const snowballPt = snowball.chartData.find(d => d.month === m) || { totalDebt: 0 };
    const avalanchePt = avalanche.chartData.find(d => d.month === m) || { totalDebt: 0 };

    chartPoints.push({
      month: `Month ${m}`,
      'Normal (No Extra)': normalPt.totalDebt,
      'Snowball Strategy': snowballPt.totalDebt,
      'Avalanche Strategy': avalanchePt.totalDebt,
    });
  }

  const getTargetDate = (monthsCount) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsCount);
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  const getStats = (strategy) => {
    switch (strategy) {
      case 'snowball': return { label: 'Snowball', months: snowball.monthsToDebtFree, interest: snowball.totalInterest, saved: normal.totalInterest - snowball.totalInterest };
      case 'avalanche': return { label: 'Avalanche', months: avalanche.monthsToDebtFree, interest: avalanche.totalInterest, saved: normal.totalInterest - avalanche.totalInterest };
      case 'normal':
      default:
        return { label: 'Normal', months: normal.monthsToDebtFree, interest: normal.totalInterest, saved: 0 };
    }
  };

  const currentStats = getStats(selectedStrategy);

  return (
    <div className="animate-fade-in page-container">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '6px' }}>Debt-Free Forecast</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Evaluate snowball and avalanche plans to accelerate paydown and save on interest.
        </p>
      </div>

      {/* Strategies Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Normal */}
        <div
          onClick={() => setSelectedStrategy('normal')}
          className="glass-panel"
          style={{
            padding: '24px',
            cursor: 'pointer',
            border: selectedStrategy === 'normal' ? '2px solid var(--text-muted)' : '1px solid var(--border-color)',
            opacity: selectedStrategy === 'normal' ? 1 : 0.7,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Normal Schedule</span>
            <Calendar size={18} color="var(--text-muted)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '12px' }}>{normal.monthsToDebtFree} Months</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Debt-free date: {getTargetDate(normal.monthsToDebtFree)}</p>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '12px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>Total Interest Paid</span>
            <strong style={{ color: 'var(--color-danger)' }}>{formatCurrency(normal.totalInterest, user?.geo || 'IN')}</strong>
          </div>
        </div>

        {/* Snowball */}
        <div
          onClick={() => setSelectedStrategy('snowball')}
          className="glass-panel"
          style={{
            padding: '24px',
            cursor: 'pointer',
            border: selectedStrategy === 'snowball' ? '2px solid var(--color-brand)' : '1px solid var(--border-color)',
            background: 'rgba(99,102,241,0.02)',
            opacity: selectedStrategy === 'snowball' ? 1 : 0.7,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand)' }}>Snowball Method</span>
            <Snowflake size={18} color="var(--color-brand)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '12px', color: 'var(--color-brand)' }}>{snowball.monthsToDebtFree} Months</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Debt-free date: {getTargetDate(snowball.monthsToDebtFree)}</p>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '12px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>Interest Saved</span>
            <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(normal.totalInterest - snowball.totalInterest, user?.geo || 'IN')}</strong>
          </div>
        </div>

        {/* Avalanche */}
        <div
          onClick={() => setSelectedStrategy('avalanche')}
          className="glass-panel"
          style={{
            padding: '24px',
            cursor: 'pointer',
            border: selectedStrategy === 'avalanche' ? '2px solid var(--color-warning)' : '1px solid var(--border-color)',
            background: 'rgba(245,158,11,0.02)',
            opacity: selectedStrategy === 'avalanche' ? 1 : 0.7,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-warning)' }}>Avalanche Method</span>
            <Flame size={18} color="var(--color-warning)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '12px', color: 'var(--color-warning)' }}>{avalanche.monthsToDebtFree} Months</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Debt-free date: {getTargetDate(avalanche.monthsToDebtFree)}</p>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '12px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>Interest Saved</span>
            <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(normal.totalInterest - avalanche.totalInterest, user?.geo || 'IN')}</strong>
          </div>
        </div>
      </div>

      {/* Payoff Graph Projections */}
      <div className="grid-2-col" style={{ gap: '24px' }}>
        {/* Graph */}
        <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Remaining Debt Projections</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints}>
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} />
                <Legend iconType="circle" fontSize={11} />
                <Line type="monotone" dataKey="Normal (No Extra)" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Snowball Strategy" stroke="#6366f1" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Avalanche Strategy" stroke="#f59e0b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Strategy Details & Strategy Description */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--color-brand)" /> Accelerated Roadmap ({currentStats.label})
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.4', marginBottom: '20px' }}>
              {selectedStrategy === 'snowball' && 'The Snowball method focuses on paying off the smallest balances first to gain psychological momentum, rolling completed EMIs into larger loans.'}
              {selectedStrategy === 'avalanche' && 'The Avalanche method targets the highest interest rate loans first to achieve mathematically maximum savings, rolling completed EMIs into other loans.'}
              {selectedStrategy === 'normal' && 'The standard method where you pay the minimum due payments monthly, taking the longest time and paying the most interest.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Months Saved</span>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
                  {normal.monthsToDebtFree - currentStats.months} Months
                </h4>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Savings Ratio</span>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brand)', marginTop: '4px' }}>
                  {normal.totalInterest > 0 ? ((currentStats.saved / normal.totalInterest) * 100).toFixed(0) : 0}%
                </h4>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Interest Paid ({currentStats.label}):</span>
              <strong>{formatCurrency(currentStats.interest, user?.geo || 'IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Interest Saved:</span>
              <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(currentStats.saved, user?.geo || 'IN')}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
