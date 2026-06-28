import React, { useState } from 'react';
import { KeyRound, AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function ResetPassword({ resetToken, onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`/api/auth/resetpassword/${resetToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to reset password. The token may be invalid or expired.');
      }
      
      setStatus('success');
      setMessage('Password has been successfully updated.');
      
      // Auto-login or redirect
      setTimeout(() => {
        // Since the reset endpoint returns a token, we could technically just call a context method here to log in,
        // but typically a page reload or standard login is safer. We'll reload the app to let AuthContext pick up the token.
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to reset password. The token may be invalid or expired.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 30px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '12px', background: 'var(--gradient-brand)', marginBottom: '16px', boxShadow: '0 8px 24px var(--color-brand-glow)' }}>
            <KeyRound size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Set New Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Please enter your new password below.</p>
        </div>

        {status === 'error' && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--color-danger)', fontSize: '0.88rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="glass-panel" style={{ background: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--color-success)', fontSize: '0.88rem' }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{message} Redirecting to dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={status === 'loading' || status === 'success'}
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
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Confirm New Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              className="form-input" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={status === 'loading' || status === 'success'}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }} 
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? 'Resetting...' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Reset Password <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
