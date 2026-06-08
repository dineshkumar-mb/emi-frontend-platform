import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  ArrowRight, 
  TrendingDown, 
  CheckCircle, 
  Filter, 
  Bell, 
  LineChart, 
  Info,
  Check,
  AlertCircle
} from 'lucide-react';

const QUICK_QUESTIONS = [
  'Which loan should I close first?',
  'Can I pre-close my high-interest loan?',
  'How much interest will I save if I pay 2 EMIs extra?',
  'How healthy are my finances and debt burden?',
];

export default function AiAdvisor() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Financial Advisor. I have access to your active loans, assets, goals, and monthly income/expenses. Ask me anything about pre-closing, refinancing, or planning your path to becoming debt-free.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [simulations, setSimulations] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const handleSend = async (textToSend) => {
    const messageText = textToSend || query;
    if (!messageText.trim()) return;

    // Append user message
    setChatHistory((prev) => [...prev, { sender: 'user', text: messageText }]);
    setQuery('');
    setLoading(true);

    try {
      const r = await fetch('/api/intelligence/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: messageText }),
      });
      
      if (r.ok) {
        const data = await r.json();
        
        // Append AI message along with any associated copilot actions
        setChatHistory((prev) => [
          ...prev, 
          { 
            sender: 'ai', 
            text: data.response, 
            actions: data.actions || [] 
          }
        ]);
        
        if (data.simulations && data.simulations.length > 0) {
          setSimulations(data.simulations);
        }
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        }
      } else {
        setChatHistory((prev) => [...prev, { sender: 'ai', text: 'Sorry, I failed to connect to the advisor engine.' }]);
      }
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: 'ai', text: 'Error executing advisors request: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render inline copilot action cards
  const renderActionCard = (action, idx) => {
    const { type, actionData } = action;
    if (!actionData) return null;

    switch (type) {
      case 'FILTER_LOANS':
        return (
          <div key={idx} style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Filter size={16} color="var(--color-brand)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Copilot Search Results: Filtered Loans</span>
            </div>
            {actionData.loans && actionData.loans.length > 0 ? (
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 4px' }}>Bank</th>
                      <th style={{ padding: '6px 4px' }}>Type</th>
                      <th style={{ padding: '6px 4px' }}>Balance</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right' }}>Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionData.loans.map((loan, lIdx) => (
                      <tr key={lIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '8px 4px', fontWeight: 600 }}>{loan.provider}</td>
                        <td style={{ padding: '8px 4px', color: 'var(--text-secondary)' }}>{loan.loanType}</td>
                        <td style={{ padding: '8px 4px', fontWeight: 700 }}>₹{loan.outstandingBalance.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 4px', color: 'var(--color-warning)', fontWeight: 700, textAlign: 'right' }}>{loan.interestRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No active loans match the specified filters.</p>
            )}
          </div>
        );

      case 'CREATE_REPAYMENT_PLAN':
        const chartData = actionData.chartData || [];
        // Generate SVG points for the line graph
        let svgPoints = '';
        let svgAreaPoints = '';
        if (chartData.length > 1) {
          const maxDebt = Math.max(...chartData.map(d => d.totalDebt), 1);
          svgPoints = chartData.map((d, index) => {
            const x = (index / (chartData.length - 1)) * 260;
            const y = 90 - (d.totalDebt / maxDebt) * 80;
            return `${x},${y}`;
          }).join(' ');
          svgAreaPoints = `0,90 ${svgPoints} 260,90`;
        }

        return (
          <div key={idx} style={{ marginTop: '16px', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '16px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <LineChart size={16} color="var(--color-brand)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Copilot Amortization Engine</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Months to Debt-Free</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand)' }}>{actionData.monthsToDebtFree} Months</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Total Interest Paid</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-danger)' }}>₹{actionData.totalInterestPaid.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {chartData.length > 1 && (
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Debt Payoff Amortization Curve</span>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="100%" height="100" viewBox="0 0 260 100" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {/* Grid line */}
                    <line x1="0" y1="90" x2="260" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    
                    {/* Area under curve */}
                    <polygon points={svgAreaPoints} fill="url(#glowGrad)" />
                    
                    {/* Curve line */}
                    <polyline
                      fill="none"
                      stroke="var(--color-brand)"
                      strokeWidth="2.5"
                      points={svgPoints}
                    />
                  </svg>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <Info size={12} color="var(--text-muted)" />
              <span>Projected using extra monthly payment: ₹{(actionData.extraPaymentUsed || 0).toLocaleString('en-IN')}.</span>
            </div>
          </div>
        );

      case 'SET_EMI_ALERT':
        return (
          <div key={idx} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '14px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={14} color="var(--color-success)" />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-success)', display: 'block' }}>Alert Rule Configured</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{actionData.message || 'Alert threshold saved successfully.'}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in page-container">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '6px' }}>AI Financial Advisor</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Simulate prepayments, plan pre-closures, evaluate refinancing, and optimize your debt strategies.
        </p>
      </div>

      <div className="grid-2-col" style={{ gap: '24px' }}>
        {/* Chat Terminal */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '620px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--color-brand)" /> Advisor Chat Terminal
          </h3>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px', paddingRight: '8px' }}>
            {chatHistory.map((chat, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: chat.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '85%' }}>
                  <div
                    style={{
                      background: chat.sender === 'user' ? 'var(--color-brand)' : 'rgba(255,255,255,0.03)',
                      border: chat.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                      color: chat.sender === 'user' ? '#fff' : 'var(--text-primary)',
                      borderRadius: chat.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      lineHeight: '1.45',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {chat.text}
                  </div>
                  {/* Render Copilot Action Cards inline if present in AI response */}
                  {chat.actions && chat.actions.map((action, actionIdx) => renderActionCard(action, actionIdx))}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    borderRadius: '14px 14px 14px 2px',
                    padding: '12px 16px',
                    fontSize: '0.85rem',
                  }}
                >
                  <span className="typing-indicator">AI is computing financial insights...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Start Questions */}
          {chatHistory.length === 1 && (
            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Quick Starts</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'border 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-brand)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <span>{q}</span>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inputs */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ask about prepayment, closing order, refinancing, or safety ratios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={loading}
              style={{ flex: 1, minHeight: '44px' }}
            />
            <button
              onClick={() => handleSend()}
              className="btn btn-primary"
              disabled={loading || !query.trim()}
              style={{ padding: '0 16px', minHeight: '44px' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* AI Recommendations & Simulations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Actionable Roadmap */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="var(--color-success)" /> Actionable Recommendations
            </h3>
            {recommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px' }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{rec}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <HelpCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px', display: 'inline-block' }} />
                <p style={{ fontSize: '0.88rem' }}>Ask the AI Advisor a question to generate specific payoff recommendations.</p>
              </div>
            )}
          </div>

          {/* Savings Simulations */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={18} color="var(--color-warning)" /> Payoff Simulations
            </h3>
            {simulations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {simulations.map((sim, i) => (
                  <div key={i} style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.15)', padding: '16px', borderRadius: '10px' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f59e0b', marginBottom: '8px' }}>{sim.description}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Interest Saved</span>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-success)', marginTop: '2px' }}>₹{sim.interestSaved.toLocaleString()}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tenure Reduced</span>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-brand)', marginTop: '2px' }}>{sim.tenureReducedMonths} Months</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <HelpCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px', display: 'inline-block' }} />
                <p style={{ fontSize: '0.88rem' }}>Enter a scenario above (e.g., "What if I pay ₹50,000 extra on my Axis loan?") to simulate payoffs.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
