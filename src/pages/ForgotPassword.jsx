import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgotpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to send reset email. Please try again later.');
      }
      

      setStatus('success');
      setMessage('If an account with that email exists, we have sent a password reset link.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to send reset email. Please try again later.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 30px' }}>
        
        <button 
          onClick={onBackToLogin}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: 0 }}
        >
          <ArrowLeft size={18} /> Back to Login
        </button>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '12px', background: 'var(--gradient-brand)', marginBottom: '16px', boxShadow: '0 8px 24px var(--color-brand-glow)' }}>
            <Mail size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your email address and we'll send you a link to reset your password.</p>
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
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {status === 'loading' ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
