import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login({ onToggleAuth, onForgotPassword }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '12px', background: 'var(--gradient-brand)', marginBottom: '16px', boxShadow: '0 8px 24px var(--color-brand-glow)' }}>
            <LogIn size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Access your loan accounts and tracking dashboard</p>
        </div>

        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--color-danger)', fontSize: '0.88rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onForgotPassword}
                style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginBottom: '20px' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <button 
            type="button" 
            onClick={onToggleAuth} 
            style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
