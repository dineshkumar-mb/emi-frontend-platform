import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle, Info, Landmark, Download, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CreditHealth() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState('');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const r = await fetch('/api/intelligence/health-score');
        if (r.ok) {
          setData(await r.json());
        } else {
          setError('Failed to compute credit health stats.');
        }
      } catch (err) {
        setError('Network error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><p style={{ color: 'var(--text-secondary)' }}>Calculating credit stability indices...</p></div>;
  }

  if (error || !data) {
    return (
      <div className="animate-fade-in page-container">
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '6px' }}>Credit & Loan Health</h1>
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', marginTop: '20px', color: 'var(--color-danger)' }}>
          <ShieldAlert size={36} style={{ display: 'inline-block', marginBottom: '10px' }} />
          <p>{error || 'Failed to retrieve stats.'}</p>
        </div>
      </div>
    );
  }

  const {
    healthScore,
    rating,
    debtToIncomeRatio,
    paymentConsistency,
    creditUtilization,
    loanDiversityScore,
    defaultRisk,
    explanation,
  } = data;

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 65) return 'var(--color-brand)';
    if (score >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="animate-fade-in page-container">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '6px' }}>Credit Health Intelligence</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Evaluate credit health stability indices, default risks, and payment discipline.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <a
              href="/api/intelligence/report/pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '10px',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 600, fontSize: '0.84rem'
              }}
            >
              <Download size={15} /> Download PDF
            </a>
            <button
              onClick={async () => {
                setSendingReport(true); setReportMsg('');
                try {
                  const r = await fetch('/api/intelligence/report/send-monthly', { method: 'POST', credentials: 'include' });
                  const d = await r.json();
                  setReportMsg(r.ok ? '✅ ' + d.message : '❌ ' + d.message);
                } catch(e) { setReportMsg('❌ Failed: ' + e.message); }
                finally { setSendingReport(false); setTimeout(() => setReportMsg(''), 4000); }
              }}
              disabled={sendingReport}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '10px',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                color: '#10b981', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem',
                opacity: sendingReport ? 0.6 : 1
              }}
            >
              <Mail size={15} /> {sendingReport ? 'Sending...' : 'Email Report'}
            </button>
          </div>
        </div>
        {reportMsg && (
          <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem',
            background: reportMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: reportMsg.startsWith('✅') ? '#10b981' : '#ef4444',
            border: `1px solid ${reportMsg.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}>
            {reportMsg}
          </div>
        )}
      </div>

      <div className="grid-2-col" style={{ gap: '24px' }}>
        {/* Score Dial */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Loan Health Score</p>
          
          {/* Dial Graphic */}
          <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={getScoreColor(healthScore)}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: '1', color: getScoreColor(healthScore) }}>{healthScore}</h1>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{rating}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', marginTop: '24px', width: '100%' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.45', textAlign: 'center' }}>
              {explanation}
            </p>
          </div>
        </div>

        {/* Scoring Breakdown & Risk Indices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metrics */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>Health Parameters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Payment Consistency', value: `${paymentConsistency}%`, width: paymentConsistency, color: 'var(--color-success)', sub: 'Timely repayments ratio' },
                { label: 'Debt Utilization', value: `${creditUtilization}%`, width: creditUtilization, color: 'var(--color-brand)', sub: 'Outstanding to principal ratio' },
                { label: 'Debt-to-Income Burden', value: `${debtToIncomeRatio}%`, width: debtToIncomeRatio, color: debtToIncomeRatio > 40 ? 'var(--color-danger)' : 'var(--color-success)', sub: 'EMI outflow to monthly income' },
                { label: 'Loan Diversity Index', value: `${loanDiversityScore}%`, width: loanDiversityScore, color: 'var(--color-warning)', sub: 'Liability classes distribution' },
              ].map((p, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{p.label} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>({p.sub})</span></span>
                    <strong>{p.value}</strong>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${Math.max(p.width, 2)}%`, background: p.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stability Indicators */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Risk Intelligence Indices</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Default Risk</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: defaultRisk === 'High' ? 'var(--color-danger)' : 'var(--color-success)', marginTop: '4px' }}>
                  {defaultRisk} Risk
                </h4>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Credit Discipline</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: paymentConsistency >= 85 ? 'var(--color-success)' : 'var(--color-warning)', marginTop: '4px' }}>
                  {paymentConsistency >= 85 ? 'High Discipline' : 'Needs Attention'}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
