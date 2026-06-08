import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  Shield, 
  CheckCircle, 
  RefreshCw, 
  UserCheck, 
  Link2, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  Lock, 
  Check, 
  ChevronRight, 
  Info,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BankConnect() {
  const { user, refreshUser } = useAuth();
  
  // State variables
  const [vua, setVua] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Consent Flow States
  const [currentConsent, setCurrentConsent] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [syncedResults, setSyncedResults] = useState(null);

  // Hardcoded list of supported Consent Managers & Banks
  const consentManagers = [
    { id: 'finvu', name: 'FinVu Consent Manager', suffix: '@finvu' },
    { id: 'sahamati', name: 'Sahamati Sandbox', suffix: '@sahamati' },
    { id: 'onemoney', name: 'OneMoney Manager', suffix: '@onemoney' },
    { id: 'anumati', name: 'Anumati Aggregator', suffix: '@anumati' }
  ];

  const popularBanks = [
    { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC', logoColor: '#1e40af' },
    { id: 'sbi', name: 'State Bank of India', code: 'SBI', logoColor: '#0369a1' },
    { id: 'icici', name: 'ICICI Bank', code: 'ICICI', logoColor: '#c2410c' },
    { id: 'axis', name: 'Axis Bank', code: 'AXIS', logoColor: '#881337' }
  ];

  // Request consent from Backend
  const handleRequestConsent = async (e) => {
    e.preventDefault();
    if (!vua) {
      setError('Please enter your Virtual Unified Address (VUA).');
      return;
    }
    if (!selectedBank) {
      setError('Please select a bank to link.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/consent/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vua })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to initiate consent request.');
      }

      setCurrentConsent(data);
      setShowSimulator(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simulating Mock Approval from user's Consent Manager App
  const handleMockApprove = async () => {
    if (!currentConsent) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/consent/mock-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentId: currentConsent.consentId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to approve consent.');
      }

      setCurrentConsent(data);
      // Immediately start the sync phase
      await handleSyncData(data.consentId);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Pull FIP bank data & sync collections
  const handleSyncData = async (consentId) => {
    setSyncingData(true);
    setError('');

    try {
      const res = await fetch('/api/consent/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to sync financial statements.');
      }

      setSyncedResults(data.data);
      setSuccessMsg(data.message);
      setShowSimulator(false);
      
      // Refresh user auth/context to update dashboard and overall health charts
      if (refreshUser) {
        refreshUser();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingData(false);
      setLoading(false);
    }
  };

  // Reset consent states
  const handleResetFlow = () => {
    setCurrentConsent(null);
    setShowSimulator(false);
    setSyncedResults(null);
    setVua('');
    setSelectedBank('');
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '1000px' }}>
      
      {/* Title Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Account Aggregator Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Securely link and auto-sync your Indian bank statements under the RBI-regulated Account Aggregator framework.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', padding: '8px 14px' }}>
          <Shield size={16} color="var(--color-success)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)' }}>RBI Sandbox Mode</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: syncedResults ? '1fr' : '1.3fr 1fr', gap: '30px', alignItems: 'start', marginTop: '10px' }}>
        
        {/* Main Flow Card */}
        <div className="card" style={{ padding: '30px' }}>
          {!syncedResults ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Link2 size={20} color="var(--color-brand)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Link Bank Accounts</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Consent is encrypted, revokable, and time-bound.</p>
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', color: 'var(--color-danger)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestConsent}>
                {/* Bank Selector */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Step 1: Select Financial Institution (FIP)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '6px' }}>
                    {popularBanks.map((bank) => (
                      <div 
                        key={bank.id}
                        onClick={() => setSelectedBank(bank.id)}
                        style={{
                          border: selectedBank === bank.id ? '2px solid var(--color-brand)' : '1px solid var(--border-color)',
                          background: selectedBank === bank.id ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255,255,255,0.01)',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: bank.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                            {bank.code}
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{bank.name}</span>
                        </div>
                        {selectedBank === bank.id && (
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={12} color="#fff" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* VUA Handle Input */}
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Step 2: Enter Account Aggregator VUA (Virtual Address)</label>
                  <div style={{ position: 'relative', marginTop: '6px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 9876543210@finvu or test@sahamati" 
                      value={vua}
                      onChange={(e) => setVua(e.target.value)}
                      style={{ paddingLeft: '16px', paddingRight: '120px' }}
                    />
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '6px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                        Sahamati
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Don't have a VUA? You can type <code style={{ color: 'var(--color-brand)', fontWeight: 600 }}>test@sahamati</code> to simulate standard sandbox flow.
                  </span>
                </div>

                {/* Submit Consent Request */}
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ width: '100%', minHeight: '46px' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Requesting Consent...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Consent Request</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Sync Success Card */
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={36} color="var(--color-success)" />
              </div>
              
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Sync Complete!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 24px' }}>
                Successfully established consent. Finvu Consent Manager signed the request securely, and synced financial parameters into your Mitr AI dashboard.
              </p>

              {/* Collapsible synched data overview */}
              <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto 30px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Synced Accounts Summary
                </h4>
                
                {/* Assets */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-brand)', marginBottom: '6px' }}>ASSETS & SAVINGS</div>
                  {syncedResults.assets && syncedResults.assets.map((asset, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < syncedResults.assets.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{asset.name} ({asset.type})</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        {asset.value < 0 ? '-' : ''}₹{Math.abs(asset.value).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Loans */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '6px' }}>LIABILITIES & LOANS</div>
                  {syncedResults.loans && syncedResults.loans.map((loan, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block' }}>{loan.provider} - {loan.loanType}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Interest Rate: {loan.interestRate}% | EMI: ₹{loan.emiAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                        ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button 
                  onClick={handleResetFlow}
                  className="btn btn-secondary"
                >
                  Link Another Account
                </button>
                <a 
                  href="#"
                  onClick={(e) => { e.preventDefault(); window.location.reload(); }} // Refresh or simple tab redirect
                  className="btn btn-primary"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Info Column (Only visible when not showing final synced results) */}
        {!syncedResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Trust Shield Panel */}
            <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(13, 17, 29, 0.7) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Lock size={18} color="var(--color-brand)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Security & GDPR Compliant</h4>
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><strong>No Credentials Shared:</strong> You never input your bank passwords, net banking pins, or OTPs on Mitr AI.</li>
                <li><strong>Dynamic Consent:</strong> You control the validity duration and can revoke this permission anytime inside the app.</li>
                <li><strong>Digital Signatures:</strong> All pulls leverage standard digital signatures verified by Sahamati schema guidelines.</li>
              </ul>
            </div>

            {/* How it works panel */}
            <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>How AA Consents Work</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Submit VUA Request</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Mitr AI submits a consent request with your unique VUA identifier.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Approve in AA App</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Open your Consent Manager application (Finvu, Sahamati app, etc.) and approve.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Encrypted Sync</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Mitr AI fetches bank statements from FIPs and builds your financial plan.</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* AA SIMULATOR DIALOG / MODAL (RBI Sandbox Simulation) */}
      {showSimulator && currentConsent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', background: '#0e1726', border: '2px solid var(--color-brand)', borderRadius: '20px', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ background: 'var(--gradient-brand)', padding: '24px', color: '#fff', textAlign: 'center', position: 'relative' }}>
              <Landmark size={32} style={{ marginBottom: '8px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Sahamati Consent Gateway</h3>
              <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Simulated RBI Account Aggregator Sandbox</p>
              
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                SIMULATION
              </div>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Requester (FIU):</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Mitr AI Platform</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>User VUA:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{vua}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Consent ID:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentConsent.consentId}</span>
                </div>
              </div>

              {/* Permissions List */}
              <div style={{ marginBottom: '24px' }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                  Requested Access Permissions:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <CheckCircle size={14} color="var(--color-success)" style={{ marginTop: '2px' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      <strong>FIP Profile & Accounts:</strong> SBI and linked banking entities.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <CheckCircle size={14} color="var(--color-success)" style={{ marginTop: '2px' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      <strong>Account Balances:</strong> Real-time savings deposit tracking.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <CheckCircle size={14} color="var(--color-success)" style={{ marginTop: '2px' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      <strong>Amortizations & Transactions:</strong> Historical statements (12 months).
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Info size={14} color="var(--color-warning)" style={{ marginTop: '2px' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <strong>Consent Duration:</strong> Valid till {new Date(currentConsent.expireAt).toLocaleDateString()} (1 month). Revokable anytime.
                    </span>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              {syncingData ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                  <Loader2 size={32} className="animate-spin" color="var(--color-brand)" style={{ marginBottom: '12px' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>PULLING SECURE FIP DATA...</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Simulating financial statement import and database sync...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setShowSimulator(false)}
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    Reject
                  </button>
                  <button 
                    onClick={handleMockApprove}
                    className="btn btn-primary" 
                    style={{ flex: 1, background: 'var(--gradient-success)', boxShadow: '0 4px 14px 0 var(--color-success-glow)' }}
                  >
                    Approve Consent
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
