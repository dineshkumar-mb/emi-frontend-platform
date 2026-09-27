import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Landmark, RefreshCw, ExternalLink, Sparkles, 
  Search, Filter, AlertCircle, Percent, ArrowUpRight, CheckCircle2,
  Clock, BookOpen, ChevronRight, Layers, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MarketNews({ onConsultAdvisor }) {
  const { user } = useAuth();
  const [news, setNews] = useState([]);
  const [repoOverview, setRepoOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [repoOnly, setRepoOnly] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchRepoOverview = async () => {
    try {
      const res = await fetch('/api/news/repo-rate');
      if (res.ok) {
        const json = await res.json();
        setRepoOverview(json.data);
      }
    } catch (err) {
      console.warn('Failed to load repo rate overview:', err);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/news/latest', window.location.origin);
      url.searchParams.set('limit', '30');
      if (selectedCategory !== 'All') {
        url.searchParams.set('category', selectedCategory);
      }
      if (repoOnly) {
        url.searchParams.set('repoOnly', 'true');
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setNews(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch latest news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepoOverview();
  }, []);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, repoOnly]);

  const handleTriggerCrawl = async () => {
    try {
      setRefreshing(true);
      setStatusMessage('Contacting financial news portals & RBI...');
      const res = await fetch('/api/news/crawl', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setStatusMessage(data.message || 'Scraper sweep triggered! Fetching latest parsed articles...');
        // Refresh articles after a short parsing delay
        setTimeout(() => {
          fetchNews();
          fetchRepoOverview();
          setStatusMessage('');
          setRefreshing(false);
        }, 2500);
      } else {
        setStatusMessage('Crawl request completed.');
        setRefreshing(false);
      }
    } catch (err) {
      console.error('Trigger crawl error:', err);
      setStatusMessage('Error triggering crawler.');
      setRefreshing(false);
    }
  };

  const filteredNews = news.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const meta = item.metadata || {};
    return (
      (meta.title && meta.title.toLowerCase().includes(q)) ||
      (meta.summary && meta.summary.toLowerCase().includes(q)) ||
      (meta.source && meta.source.toLowerCase().includes(q)) ||
      (meta.borrowerImpact && meta.borrowerImpact.toLowerCase().includes(q))
    );
  });

  const getSourceBadgeStyle = (source) => {
    switch (source?.toLowerCase()) {
      case 'rbi':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'economic times':
        return { background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' };
      case 'moneycontrol':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'livemint':
        return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      default:
        return { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              padding: '3px 8px', 
              borderRadius: '20px', 
              background: 'rgba(99, 102, 241, 0.15)', 
              color: '#818cf8', 
              border: '1px solid rgba(99, 102, 241, 0.3)' 
            }}>
              <Landmark size={12} /> Live Macro Intelligence
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              • Scraped from RBI & top business portals
            </span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Market Intelligence & Repo Rate Watch
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '6px 0 0 0', maxWidth: '780px' }}>
            Track the Reserve Bank of India policy repo rate, monetary policy decisions, and external benchmark lending rate (EBLR) adjustments that directly dictate your floating home loan and auto loan EMIs.
          </p>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleTriggerCrawl}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 16px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'spin-animation' : ''} />
            {refreshing ? 'Scraping Portals...' : 'Refresh Live News'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#818cf8',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={16} />
          {statusMessage}
        </div>
      )}

      {/* KPI Repo Rate Indicators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Repo Rate Card */}
        <div className="glass-panel" style={{
          padding: '20px',
          borderRadius: '16px',
          borderLeft: '4px solid var(--color-brand)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(255,255,255,0.01) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              RBI Policy Repo Rate
            </span>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-success)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              Active Benchmark
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {repoOverview?.policyRepoRate || '6.50%'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>p.a.</span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Direct anchor for all retail bank floating home & car loans (EBLR).
          </p>
        </div>

        {/* SDF Rate Card */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              SDF Rate (Deposit)
            </span>
            <Percent size={14} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {repoOverview?.standingDepositFacilityRate || '6.25%'}
            </span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Standing Deposit Facility rate for absorbing system liquidity.
          </p>
        </div>

        {/* MSF / Bank Rate Card */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              MSF & Bank Rate
            </span>
            <Landmark size={14} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {repoOverview?.marginalStandingFacilityRate || '6.75%'}
            </span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Marginal Standing Facility emergency borrowing ceiling.
          </p>
        </div>

        {/* MPC Policy Stance */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              MPC Policy Stance
            </span>
            <ShieldCheck size={14} color="var(--color-brand)" />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#818cf8', marginTop: '6px' }}>
            {repoOverview?.mpcStance || 'Neutral'}
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Focus on anchoring inflation while supporting stable retail lending.
          </p>
        </div>
      </div>

      {/* How Repo Rate Impacts Your Loans Educational Guide */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '28px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={18} color="var(--color-brand)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            How Repo Rate Changes Directly Impact Your Monthly EMI
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <span>🔺 If Repo Rate Rises (+25 bps)</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
              <strong>EMI Impact:</strong> Floating home loan interest rates increase immediately on reset dates. Adds <strong>+₹15 to ₹18 per lakh</strong> on a 20-year loan.
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              💡 <em>Strategy:</em> Prepay a portion of the principal to keep the loan duration from extending.
            </span>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <span>⏸️ Rate Holds Steady (Current 6.50%)</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
              <strong>EMI Impact:</strong> Predictable monthly cash flow. No changes to loan repayment schedule or tenure.
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              💡 <em>Strategy:</em> Great window to prepay extra principal to close high-interest personal loans first.
            </span>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <span>🔻 If Repo Rate Cuts (-25 bps)</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
              <strong>EMI Impact:</strong> Saves <strong>~₹750 to ₹900/month</strong> on a ₹50 Lakh loan. Automatically passed on within 90 days.
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              💡 <em>Strategy:</em> Keep the old EMI amount to pay off the mortgage years ahead of schedule!
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['All', 'Repo Rate', 'RBI Circular', 'Home Loan', 'Banking', 'Economy'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                background: selectedCategory === cat ? 'var(--color-brand)' : 'var(--bg-card)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {cat === 'All' ? 'All Updates' : cat}
            </button>
          ))}
        </div>

        {/* Search Bar & Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '6px 12px',
            gap: '8px',
            width: '240px'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search news, EBLR, SBI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                width: '100%'
              }}
            />
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            cursor: 'pointer',
            color: repoOnly ? 'var(--color-brand)' : 'var(--text-secondary)',
            fontWeight: 600,
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={repoOnly}
              onChange={(e) => setRepoOnly(e.target.checked)}
              style={{ accentColor: 'var(--color-brand)', cursor: 'pointer' }}
            />
            Repo Rate Only
          </label>
        </div>
      </div>

      {/* News Feed Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={24} className="spin-animation" style={{ marginBottom: '12px' }} />
          <p>Retrieving scraped financial articles and RBI circulars...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <BookOpen size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>No articles found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No updates match your search criteria. Click "Refresh Live News" to fetch recent headlines.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredNews.map((item, idx) => {
            const meta = item.metadata || {};
            const sourceStyle = getSourceBadgeStyle(meta.source);
            const dateStr = meta.publishedDate ? new Date(meta.publishedDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }) : 'Recent';

            return (
              <div
                key={item._id || idx}
                className="glass-panel"
                style={{
                  padding: '22px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: meta.repoRateMentioned ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-color)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  {/* Top Bar: Source + Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        ...sourceStyle,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {meta.source || 'Financial Portal'}
                      </span>
                      <span style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem'
                      }}>
                        {meta.category || 'Macro'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> {dateStr}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: '0 0 10px 0',
                    lineHeight: 1.4
                  }}>
                    {meta.title}
                  </h3>

                  {/* Borrower Impact Highlight */}
                  {meta.borrowerImpact && (
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#818cf8', fontWeight: 700, fontSize: '0.75rem', marginBottom: '3px' }}>
                        <Sparkles size={12} /> BORROWER & EMI IMPACT:
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        {meta.borrowerImpact}
                      </p>
                    </div>
                  )}

                  {/* Summary / Snippet */}
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: '0 0 16px 0'
                  }}>
                    {meta.summary || (item.content ? item.content.substring(0, 220) + '...' : '')}
                  </p>
                </div>

                {/* Footer Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: 'auto'
                }}>
                  {meta.url ? (
                    <a
                      href={meta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        color: 'var(--color-brand)',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      Read full source <ArrowUpRight size={13} />
                    </a>
                  ) : <div />}

                  {onConsultAdvisor && (
                    <button
                      onClick={() => onConsultAdvisor(`Regarding this recent market update: "${meta.title}", how does this impact my current loan portfolio and EMI strategy?`)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#818cf8',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all var(--transition-fast)'
                      }}
                      title="Consult AI Advisor on how this affects your loans"
                    >
                      <Sparkles size={11} /> Ask AI Advisor
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
