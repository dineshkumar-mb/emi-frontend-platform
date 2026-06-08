import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Zap, Link, CreditCard, ArrowUpDown, CheckCircle2, Clock, RefreshCw, Scan } from 'lucide-react';

const THREAT_META = {
  double_debit: {
    label: 'Double Debit',
    icon: ArrowUpDown,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
  },
  phishing_link: {
    label: 'Phishing Link',
    icon: Link,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  spoofed_payment: {
    label: 'Spoofed Payment',
    icon: CreditCard,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.25)',
  },
  unusual_large_amount: {
    label: 'Unusual Large Amount',
    icon: Zap,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.25)',
  },
};

const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#6366f1',
  low: '#10b981',
};

function getRiskLevel(score) {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function ScanTestModal({ onClose, onSubmit, loading }) {
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)'
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px',
        padding: '28px', width: '100%', maxWidth: '520px', margin: '0 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
            <Scan color="#6366f1" size={20} />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem', fontWeight: 700 }}>Scan Transaction for Threats</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.78rem' }}>Simulate real-time fraud detection on any text</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Transaction / SMS Text *
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste SMS or transaction message here..."
              rows={4}
              style={{
                width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 150000"
                style={{
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)',
                  fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Provider / Bank
              </label>
              <input
                type="text"
                value={provider}
                onChange={e => setProvider(e.target.value)}
                placeholder="e.g. HDFC Bank"
                style={{
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)',
                  fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
            }}
          >Cancel</button>
          <button
            onClick={() => onSubmit({ text, amount: parseFloat(amount) || 0, provider })}
            disabled={!text.trim() || loading}
            style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.85rem', opacity: (!text.trim() || loading) ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Scanning...</> : <><Scan size={14} /> Scan Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | active | resolved
  const [scanModal, setScanModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [resolving, setResolving] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/fraud', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      console.error('Failed to fetch fraud alerts:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleScan = async ({ text, amount, provider }) => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/intelligence/scan-text', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, amount, provider, source: 'Manual' }),
      });
      const data = res.ok ? await res.json() : { threatDetected: false, message: 'Scan request failed.' };
      setScanResult({
        success: res.ok,
        threat: data.threatDetected,
        status: data.message || (data.threatDetected ? '⚠️ Threat detected! Check alerts list below.' : '✅ No threats found. Transaction looks safe.')
      });
      setScanModal(false);
      setTimeout(() => { fetchAlerts(); setScanResult(null); }, 3000);
    } catch (err) {
      setScanResult({ success: false, threat: false, status: 'Scan failed: ' + err.message });
    } finally {
      setScanning(false);
    }
  };


  const handleResolve = async (id) => {
    setResolving(id);
    try {
      const res = await fetch(`/api/intelligence/fraud/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: 'resolved' } : a));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(null);
    }
  };

  const filtered = alerts.filter(a => filter === 'all' ? true : a.status === filter);
  const activeCount = alerts.filter(a => a.status === 'active').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  const avgRisk = alerts.length > 0
    ? Math.round(alerts.reduce((s, a) => s + a.riskScore, 0) / alerts.length)
    : 0;

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.7; }
        }
        .alert-card:hover { border-color: rgba(99,102,241,0.3) !important; transform: translateY(-1px); }
        .alert-card { transition: all 0.2s ease; }
        .resolve-btn:hover { background: rgba(16,185,129,0.2) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            background: 'rgba(239,68,68,0.12)', borderRadius: '12px', padding: '10px', display: 'flex',
            animation: activeCount > 0 ? 'pulse-ring 2.5s ease infinite' : 'none'
          }}>
            <ShieldAlert color="#ef4444" size={24} />
          </div>
          <div>
            <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
              Fraud Detection & Security Center
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
              Real-time threat monitoring for your financial transactions
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Active Threats', value: activeCount, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Resolved', value: resolvedCount, icon: ShieldCheck, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Total Alerts', value: alerts.length, icon: ShieldAlert, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
          { label: 'Avg Risk Score', value: `${avgRisk}%`, icon: Zap, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: stat.bg, borderRadius: '10px', padding: '10px', display: 'flex', flexShrink: 0 }}>
              <stat.icon color={stat.color} size={20} />
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
              <div style={{ color: stat.color, fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', padding: '4px', gap: '4px' }}>
          {['all', 'active', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.8rem', textTransform: 'capitalize',
                background: filter === f ? '#6366f1' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={fetchAlerts}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem'
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>

        <button
          onClick={() => setScanModal(true)}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
            borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
          }}
        >
          <Scan size={16} /> Scan Transaction
        </button>
      </div>

      {/* Scan Result Toast */}
      {scanResult && (
        <div style={{
          background: scanResult.threat ? 'rgba(239,68,68,0.12)' : scanResult.success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${scanResult.threat ? 'rgba(239,68,68,0.3)' : scanResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '10px', padding: '12px 18px', marginBottom: '16px',
          color: scanResult.threat ? '#f59e0b' : scanResult.success ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '0.88rem',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {scanResult.threat ? <AlertTriangle size={16} /> : scanResult.success ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
          {scanResult.status}
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>Loading security alerts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShieldCheck color="#10b981" size={48} style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>All Clear</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {filter === 'all' ? 'No fraud alerts detected on your account.' : `No ${filter} alerts found.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(alert => {
            const meta = THREAT_META[alert.threatType] || {
              label: alert.threatType || 'Unknown', icon: AlertTriangle,
              color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)'
            };
            const ThreatIcon = meta.icon;
            const risk = getRiskLevel(alert.riskScore);
            const riskColor = RISK_COLORS[risk];
            const isResolved = alert.status === 'resolved';

            return (
              <div
                key={alert._id}
                className="card alert-card"
                style={{
                  padding: '20px',
                  border: `1px solid ${isResolved ? 'rgba(255,255,255,0.04)' : meta.border}`,
                  opacity: isResolved ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Threat icon */}
                  <div style={{ background: meta.bg, borderRadius: '10px', padding: '10px', display: 'flex', flexShrink: 0 }}>
                    <ThreatIcon color={meta.color} size={20} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                        padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700
                      }}>
                        {meta.label}
                      </span>
                      <span style={{
                        background: `rgba(${risk === 'critical' ? '239,68,68' : risk === 'high' ? '245,158,11' : risk === 'medium' ? '99,102,241' : '16,185,129'},0.1)`,
                        color: riskColor, padding: '2px 10px', borderRadius: '20px',
                        fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${riskColor}30`
                      }}>
                        {alert.riskScore}% Risk
                      </span>
                      <span style={{
                        background: isResolved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
                        color: isResolved ? '#10b981' : '#ef4444',
                        padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        {isResolved ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        {isResolved ? 'Resolved' : 'Active'}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                        <Clock size={12} />
                        {new Date(alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 10px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Source: </span>
                      {alert.source} •{' '}
                      {alert.message?.substring(0, 140)}{alert.message?.length > 140 ? '...' : ''}
                    </p>

                    {/* Risk bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Risk Level</span>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                        <div style={{
                          height: '100%', borderRadius: '10px',
                          width: `${alert.riskScore}%`,
                          background: `linear-gradient(90deg, ${riskColor}60, ${riskColor})`,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: riskColor, fontWeight: 700, minWidth: '30px', textAlign: 'right' }}>
                        {alert.riskScore}%
                      </span>
                    </div>
                  </div>

                  {/* Resolve Action */}
                  {!isResolved && (
                    <button
                      className="resolve-btn"
                      onClick={() => handleResolve(alert._id)}
                      disabled={resolving === alert._id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontWeight: 600,
                        fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s'
                      }}
                    >
                      {resolving === alert._id ? (
                        <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scan Modal */}
      {scanModal && (
        <ScanTestModal
          onClose={() => setScanModal(false)}
          onSubmit={handleScan}
          loading={scanning}
        />
      )}
    </div>
  );
}
