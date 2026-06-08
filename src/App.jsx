import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import EmiCalculator from './pages/EmiCalculator';
import AiAdvisor from './pages/AiAdvisor';
import DebtForecast from './pages/DebtForecast';
import CreditHealth from './pages/CreditHealth';
import NetWorthGoals from './pages/NetWorthGoals';
import SubscriptionsExpenses from './pages/SubscriptionsExpenses';
import FraudAlerts from './pages/FraudAlerts';
import BankConnect from './pages/BankConnect';
import { Landmark, LogOut, LayoutDashboard, Calculator as CalcIcon, Menu, X, Globe, Sparkles, TrendingUp, ShieldAlert, Coins, RefreshCw, Link2 } from 'lucide-react';
import { GEO_CONFIGS } from './utils/geoConfig';


function AppContent() {
  const { user, loading, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoginView, setIsLoginView] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 600 }}>Loading EMI Tracker...</p>
      </div>
    );
  }

  if (!user) {
    return isLoginView ? (
      <Login onToggleAuth={() => setIsLoginView(false)} />
    ) : (
      <Signup onToggleAuth={() => setIsLoginView(true)} />
    );
  }

  return (
    <div>
      <header className="nav-header">
        <div className="nav-container">
          <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); handleTabChange('dashboard'); }}>
            <Landmark size={22} color="#818cf8" />
            <span>EMI Tracker AI</span>
          </a>
          
          {/* Desktop Navigation */}
          <nav className="nav-menu" style={{ gap: '6px' }}>
            <button 
              onClick={() => handleTabChange('dashboard')}
              className={`nav-link btn btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'dashboard' ? 'rgba(99,102,241,0.1)' : 'none', 
                border: activeTab === 'dashboard' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: activeTab === 'dashboard' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '8px 12px', minHeight: '36px', fontSize: '0.82rem'
              }}
            >
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <button 
              onClick={() => handleTabChange('advisor')}
              className={`nav-link btn btn-secondary ${activeTab === 'advisor' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'advisor' ? 'rgba(99,102,241,0.1)' : 'none', 
                border: activeTab === 'advisor' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: activeTab === 'advisor' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '8px 12px', minHeight: '36px', fontSize: '0.82rem'
              }}
            >
              <Sparkles size={14} /> AI Advisor
            </button>
            <button 
              onClick={() => handleTabChange('forecast')}
              className={`nav-link btn btn-secondary ${activeTab === 'forecast' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'forecast' ? 'rgba(99,102,241,0.1)' : 'none', 
                border: activeTab === 'forecast' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: activeTab === 'forecast' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '8px 12px', minHeight: '36px', fontSize: '0.82rem'
              }}
            >
              <TrendingUp size={14} /> Payoff Forecast
            </button>
            <button 
              onClick={() => handleTabChange('health')}
              className={`nav-link btn btn-secondary ${activeTab === 'health' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'health' ? 'rgba(99,102,241,0.1)' : 'none', 
                border: activeTab === 'health' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: activeTab === 'health' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '8px 12px', minHeight: '36px', fontSize: '0.82rem'
              }}
            >
              <ShieldAlert size={14} /> Credit Health
            </button>
            <button 
              onClick={() => handleTabChange('net-worth')}
              className={`nav-link btn btn-secondary ${activeTab === 'net-worth' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'net-worth' ? 'rgba(99,102,241,0.1)' : 'none', 
                border: activeTab === 'net-worth' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: activeTab === 'net-worth' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '8px 12px', minHeight: '36px', fontSize: '0.82rem'
              }}
            >
              <Coins size={14} /> Net Worth
            </button>
            <button 
              onClick={() => handleTabChange('subscriptions')}
              className={`nav-link btn btn-secondary ${activeTab === 'subscriptions' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'subscriptions' ? 'rgba(99,102,241,0.1)' : 'none', 
                border: activeTab === 'subscriptions' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: activeTab === 'subscriptions' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '8px 12px', minHeight: '36px', fontSize: '0.82rem'
              }}
            >
              <RefreshCw size={14} /> Subscriptions
            </button>
            <button 
              onClick={() => handleTabChange('bank-connect')}
              className={`nav-link btn btn-secondary ${activeTab === 'bank-connect' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'bank-connect' ? 'rgba(99,102,241,0.1)' : 'none', 
                border: activeTab === 'bank-connect' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: activeTab === 'bank-connect' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '8px 12px', minHeight: '36px', fontSize: '0.82rem'
              }}
            >
              <Link2 size={14} /> Bank Link
            </button>
            <button 
              onClick={() => handleTabChange('fraud')}
              className={`nav-link btn btn-secondary ${activeTab === 'fraud' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'fraud' ? 'rgba(239,68,68,0.1)' : 'none', 
                border: activeTab === 'fraud' ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: activeTab === 'fraud' ? '#ef4444' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '8px 12px', minHeight: '36px', fontSize: '0.82rem'
              }}
            >
              <ShieldAlert size={14} /> Security
            </button>
            <button 
              onClick={() => handleTabChange('calculator')}
              className={`nav-link btn btn-secondary ${activeTab === 'calculator' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'calculator' ? 'rgba(99,102,241,0.1)' : 'none', 
                border: activeTab === 'calculator' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: activeTab === 'calculator' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '8px 12px', minHeight: '36px', fontSize: '0.82rem'
              }}
            >
              <CalcIcon size={14} /> EMI Calc
            </button>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px 8px' }}>
                <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}><Globe size={13} style={{ marginRight: '4px' }} /> Region:</span>
                <select
                  value={user.geo || 'IN'}
                  onChange={async (e) => {
                    const newGeo = e.target.value;
                    try {
                      const r = await fetch('/api/auth/geo', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ geo: newGeo }),
                      });
                      if (r.ok) {
                        refreshUser();
                      }
                    } catch (err) {
                      console.error('Failed to save geo preference:', err);
                    }
                  }}
                  style={{
                    background: 'none',
                    color: 'var(--text-primary)',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    padding: '4px 0'
                  }}
                >
                  <option value="IN" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇮🇳 IN (₹)</option>
                  <option value="US" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇺🇸 US ($)</option>
                  <option value="GB" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇬🇧 GB (£)</option>
                  <option value="EU" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇪🇺 EU (€)</option>
                  <option value="AE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇦🇪 AE (د.إ)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }} title={`User ID: ${user._id}`}>ID: {user._id.substring(0, 8)}... ({user.email})</span>
              </div>
              <button 
                onClick={logout}
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', cursor: 'pointer', minHeight: '36px' }}
              >
                <LogOut size={12} /> Log out
              </button>
            </div>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Drawer */}
        <div className={`nav-mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
          <button
            className={`nav-mobile-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            className={`nav-mobile-item ${activeTab === 'advisor' ? 'active' : ''}`}
            onClick={() => handleTabChange('advisor')}
          >
            <Sparkles size={18} /> AI Advisor
          </button>
          <button
            className={`nav-mobile-item ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => handleTabChange('forecast')}
          >
            <TrendingUp size={18} /> Payoff Forecast
          </button>
          <button
            className={`nav-mobile-item ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => handleTabChange('health')}
          >
            <ShieldAlert size={18} /> Credit Health
          </button>
          <button
            className={`nav-mobile-item ${activeTab === 'net-worth' ? 'active' : ''}`}
            onClick={() => handleTabChange('net-worth')}
          >
            <Coins size={18} /> Net Worth
          </button>
          <button
            className={`nav-mobile-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => handleTabChange('subscriptions')}
          >
            <RefreshCw size={18} /> Subscriptions
          </button>
          <button
            className={`nav-mobile-item ${activeTab === 'bank-connect' ? 'active' : ''}`}
            onClick={() => handleTabChange('bank-connect')}
          >
            <Link2 size={18} /> Bank Link
          </button>
          <button
            className={`nav-mobile-item ${activeTab === 'fraud' ? 'active' : ''}`}
            onClick={() => handleTabChange('fraud')}
            style={{ color: activeTab === 'fraud' ? '#ef4444' : undefined }}
          >
            <ShieldAlert size={18} /> Security
          </button>
          <button
            className={`nav-mobile-item ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => handleTabChange('calculator')}
          >
            <CalcIcon size={18} /> EMI Calculator
          </button>
          <div className="nav-mobile-divider" />
          <div className="nav-mobile-user" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px' }}>
              <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}><Globe size={14} style={{ marginRight: '6px' }} /> Region:</span>
              <select
                value={user.geo || 'IN'}
                onChange={async (e) => {
                  const newGeo = e.target.value;
                  try {
                    const r = await fetch('/api/auth/geo', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ geo: newGeo }),
                    });
                    if (r.ok) {
                      refreshUser();
                    }
                  } catch (err) {
                    console.error('Failed to save geo preference:', err);
                  }
                }}
                style={{
                  background: 'none',
                  color: 'var(--text-primary)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="IN" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇮🇳 IN (₹)</option>
                <option value="US" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇺🇸 US ($)</option>
                <option value="GB" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇬🇧 GB (£)</option>
                <option value="EU" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇪🇺 EU (€)</option>
                <option value="AE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇦🇪 AE (د.إ)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{user.name}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {user._id} ({user.email})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px', minHeight: '34px', width: '100%' }}
              >
                <LogOut size={12} /> Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ minHeight: 'calc(100vh - 64px)' }}>
        {activeTab === 'dashboard' && (
          <Dashboard onSendToCalculator={(inputs) => { setCalculatorInputs(inputs); handleTabChange('calculator'); }} />
        )}
        {activeTab === 'advisor' && <AiAdvisor />}
        {activeTab === 'forecast' && <DebtForecast />}
        {activeTab === 'health' && <CreditHealth />}
        {activeTab === 'net-worth' && <NetWorthGoals />}
        {activeTab === 'subscriptions' && <SubscriptionsExpenses />}
        {activeTab === 'bank-connect' && <BankConnect />}
        {activeTab === 'fraud' && <FraudAlerts />}
        {activeTab === 'calculator' && <EmiCalculator inputs={calculatorInputs} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
