import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import EmiCalculator from './pages/EmiCalculator';
import AiAdvisor from './pages/AiAdvisor';
import DebtForecast from './pages/DebtForecast';
import CreditHealth from './pages/CreditHealth';
import NetWorthGoals from './pages/NetWorthGoals';
import SubscriptionsExpenses from './pages/SubscriptionsExpenses';
import FraudAlerts from './pages/FraudAlerts';
import { Landmark, LogOut, LayoutDashboard, Calculator as CalcIcon, Menu, X, Globe, Sparkles, TrendingUp, ShieldAlert, Coins, RefreshCw, ChevronDown, Copy, Check } from 'lucide-react';
import { GEO_CONFIGS } from './utils/geoConfig';



function AppContent() {
  const { user, loading, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login');
  const [resetToken, setResetToken] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState(null);

  // Dropdown States
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const toolsDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('resetToken');
    if (token) {
      setResetToken(token);
      setAuthView('reset-password');
    }

    function handleClickOutside(event) {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target)) {
        setIsToolsDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsToolsDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const handleCopyId = () => {
    if (user && user._id) {
      navigator.clipboard.writeText(user._id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const isToolActive = ['net-worth', 'subscriptions', 'fraud', 'calculator'].includes(activeTab);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 600 }}>Loading EMI Tracker...</p>
      </div>
    );
  }

  if (!user) {
    if (authView === 'login') return <Login onToggleAuth={() => setAuthView('signup')} onForgotPassword={() => setAuthView('forgot-password')} />;
    if (authView === 'signup') return <Signup onToggleAuth={() => setAuthView('login')} />;
    if (authView === 'forgot-password') return <ForgotPassword onBackToLogin={() => setAuthView('login')} />;
    if (authView === 'reset-password') return <ResetPassword resetToken={resetToken} onLoginSuccess={() => window.location.href = '/'} />;
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
          <nav className="nav-menu">
            <button 
              onClick={() => handleTabChange('dashboard')}
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={15} /> Dashboard
            </button>
            <button 
              onClick={() => handleTabChange('advisor')}
              className={`nav-link ${activeTab === 'advisor' ? 'active' : ''}`}
            >
              <Sparkles size={15} /> AI Advisor
            </button>
            <button 
              onClick={() => handleTabChange('forecast')}
              className={`nav-link ${activeTab === 'forecast' ? 'active' : ''}`}
            >
              <TrendingUp size={15} /> Payoff Forecast
            </button>
            <button 
              onClick={() => handleTabChange('health')}
              className={`nav-link ${activeTab === 'health' ? 'active' : ''}`}
            >
              <ShieldAlert size={15} /> Credit Health
            </button>

            {/* Tools Dropdown Container */}
            <div className={`dropdown-container ${isToolActive ? 'active' : ''}`} ref={toolsDropdownRef}>
              <button 
                onClick={() => {
                  setIsToolsDropdownOpen(!isToolsDropdownOpen);
                  setIsProfileDropdownOpen(false);
                }}
                className={`nav-link nav-dropdown-trigger ${isToolActive ? 'active' : ''}`}
              >
                Tools <ChevronDown size={13} className="chevron" />
              </button>
              
              <div className={`dropdown-menu ${isToolsDropdownOpen ? 'open' : ''}`}>
                <button 
                  onClick={() => handleTabChange('net-worth')}
                  className={`dropdown-item ${activeTab === 'net-worth' ? 'active' : ''}`}
                >
                  <Coins size={14} /> Net Worth
                </button>
                <button 
                  onClick={() => handleTabChange('subscriptions')}
                  className={`dropdown-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
                >
                  <RefreshCw size={14} /> Subscriptions
                </button>
                <button 
                  onClick={() => handleTabChange('fraud')}
                  className={`dropdown-item ${activeTab === 'fraud' ? 'active' : ''}`}
                >
                  <ShieldAlert size={14} /> Security
                </button>
                <button 
                  onClick={() => handleTabChange('calculator')}
                  className={`dropdown-item ${activeTab === 'calculator' ? 'active' : ''}`}
                >
                  <CalcIcon size={14} /> EMI Calculator
                </button>
              </div>
            </div>
            
            <div style={{ width: '1px', height: '22px', background: 'var(--border-color)', margin: '0 8px' }}></div>
            
            {/* Profile Dropdown Container */}
            <div className="dropdown-container" ref={profileDropdownRef}>
              <button 
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsToolsDropdownOpen(false);
                }}
                className={`profile-trigger ${isProfileDropdownOpen ? 'active' : ''}`}
              >
                <div className="profile-avatar">
                  {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U'}
                </div>
                <span className="profile-trigger-name">{user.name}</span>
                <ChevronDown size={13} className="chevron" />
              </button>

              <div className={`dropdown-menu profile-dropdown ${isProfileDropdownOpen ? 'open' : ''}`}>
                <div className="profile-dropdown-header">
                  <div className="profile-avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U'}
                  </div>
                  <div className="profile-dropdown-info">
                    <div className="profile-dropdown-name">{user.name}</div>
                    <div className="profile-dropdown-email">{user.email}</div>
                    <div 
                      className="profile-dropdown-id" 
                      onClick={handleCopyId}
                      title="Click to copy User ID"
                    >
                      {isCopied ? <Check size={10} color="var(--color-success)" /> : <Copy size={10} />}
                      ID: {user._id.substring(0, 8)}... {isCopied ? 'Copied!' : ''}
                    </div>
                  </div>
                </div>

                <div className="profile-dropdown-section">
                  <span className="profile-dropdown-label">Region</span>
                  <div className="profile-dropdown-region">
                    <Globe size={13} />
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
                    >
                      <option value="IN">🇮🇳 India (₹)</option>
                      <option value="US">🇺🇸 United States ($)</option>
                      <option value="GB">🇬🇧 United Kingdom (£)</option>
                      <option value="EU">🇪🇺 Europe (€)</option>
                      <option value="AE">🇦🇪 UAE (د.إ)</option>
                    </select>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

                <button 
                  onClick={logout}
                  className="profile-logout-btn"
                >
                  <LogOut size={13} /> Log out
                </button>
              </div>
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
          <div className="nav-mobile-section-title">Main Pages</div>
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

          <div className="nav-mobile-divider" />
          <div className="nav-mobile-section-title">Tools & Calculators</div>
          
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
          <div className="nav-mobile-user">
            <div className="nav-mobile-section-title" style={{ padding: '0 0 8px 0' }}>Profile & Settings</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{user.name}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {user._id} ({user.email})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}><Globe size={14} style={{ marginRight: '6px' }} /> Region:</span>
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
                }}
              >
                <option value="IN">🇮🇳 IN (₹)</option>
                <option value="US">🇺🇸 US ($)</option>
                <option value="GB">🇬🇧 GB (£)</option>
                <option value="EU">🇪🇺 EU (€)</option>
                <option value="AE">🇦🇪 AE (د.إ)</option>
              </select>
            </div>

            <button
              onClick={() => { logout(); setIsMobileMenuOpen(false); }}
              className="profile-logout-btn"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </header>

      <main style={{ minHeight: 'calc(100vh - 70px)' }}>
        {activeTab === 'dashboard' && (
          <Dashboard onSendToCalculator={(inputs) => { setCalculatorInputs(inputs); handleTabChange('calculator'); }} />
        )}
        {activeTab === 'advisor' && <AiAdvisor />}
        {activeTab === 'forecast' && <DebtForecast />}
        {activeTab === 'health' && <CreditHealth />}
        {activeTab === 'net-worth' && <NetWorthGoals />}
        {activeTab === 'subscriptions' && <SubscriptionsExpenses />}
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
