import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';

export default function Signup({ onToggleAuth }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password, income, expenses);
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '12px', background: 'var(--gradient-brand)', marginBottom: '16px', boxShadow: '0 8px 24px var(--color-brand-glow)' }}>
            <UserPlus size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join now to track your EMIs and calculate prepayments</p>
        </div>

        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--color-danger)', fontSize: '0.88rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Monthly Income (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 50000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                min={0}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Expenses (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 20000"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                min={0}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px', marginBottom: '20px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <button 
            type="button" 
            onClick={onToggleAuth} 
            style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
