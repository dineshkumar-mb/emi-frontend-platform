import React, { useState, useMemo, useEffect } from 'react';
import { calculateEMI, getAmortizationSchedule } from '../utils/emiCalc';
import { exportSingleSchedule } from '../utils/excelExport';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Calculator, IndianRupee, DollarSign, Euro, PoundSterling, Coins, Calendar, Percent, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getGeoConfig } from '../utils/geoConfig';

export default function EmiCalculator({ inputs }) {
  const { user } = useAuth();
  const geoCode = user?.geo || 'IN';
  
  const [principal, setPrincipal] = useState(1500000);
  const [interestRate, setInterestRate] = useState(10.5);
  const [tenure, setTenure] = useState(36); // in months
  const [showSchedule, setShowSchedule] = useState(false);

  const CurrencyIcon = ({ size, color }) => {
    switch (geoCode) {
      case 'US': return <DollarSign size={size} color={color} />;
      case 'GB': return <PoundSterling size={size} color={color} />;
      case 'EU': return <Euro size={size} color={color} />;
      case 'AE': return <Coins size={size} color={color} />;
      case 'IN':
      default:
        return <IndianRupee size={size} color={color} />;
    }
  };

  // Sync with prop values reactively (e.g. from PDF uploads or Dashboard "Analyze")
  useEffect(() => {
    if (inputs) {
      if (inputs.principal) setPrincipal(inputs.principal);
      if (inputs.interestRate) setInterestRate(inputs.interestRate);
      if (inputs.tenure) setTenure(inputs.tenure);
    }
  }, [inputs]);

  // Memoized Calculations
  const calculations = useMemo(() => {
    const emi = calculateEMI(principal, interestRate, tenure);
    const schedule = getAmortizationSchedule(principal, interestRate, tenure);
    const totalRepayment = Number((emi * tenure).toFixed(2));
    const totalInterest = Number((totalRepayment - principal).toFixed(2));
    return { emi, totalRepayment, totalInterest, schedule };
  }, [principal, interestRate, tenure]);

  const { emi, totalRepayment, totalInterest, schedule } = calculations;

  const chartData = [
    { name: 'Principal Amount', value: principal },
    { name: 'Total Interest', value: totalInterest },
  ];

  const COLORS = ['#6366f1', '#10b981'];

  const handleExportSchedule = () => {
    exportSingleSchedule({ principal, interestRate, tenure, emi, totalInterest, totalRepayment });
  };

  return (
    <div className="animate-fade-in page-container">
      {/* Page Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '6px' }}>Interactive EMI Calculator</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Forecast monthly obligations, total interest cost, and amortization schedules.
          </p>
        </div>
        <button
          onClick={handleExportSchedule}
          className="btn btn-secondary"
          style={{ borderColor: 'rgba(16,185,129,0.3)', color: 'var(--color-success)', flexShrink: 0 }}
          title="Download amortization schedule as Excel"
        >
          <Download size={16} /> Export Schedule
        </button>
      </div>

      {/* ── Top 3 Cards ── */}
      <div className="emi-calc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* Input Sliders */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>
            <Calculator size={18} color="var(--color-brand)" />
            Configure Loan Parameters
          </h3>

          {/* Principal */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.88rem' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CurrencyIcon size={13} /> Principal Amount
              </span>
              <span style={{ color: 'var(--color-brand)', fontWeight: 800 }}>
                {formatCurrency(principal, geoCode)}
              </span>
            </div>
            <input
              type="range"
              min="50000"
              max="5000000"
              step="10000"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', outline: 'none', cursor: 'pointer', accentColor: 'var(--color-brand)', marginTop: '6px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>{formatCurrency(50000, geoCode)}</span>
              <span>{formatCurrency(2500000, geoCode)}</span>
              <span>{formatCurrency(5000000, geoCode)}</span>
            </div>
            {/* Manual input */}
            <input
              type="number"
              className="form-input"
              value={principal}
              onChange={(e) => setPrincipal(Math.max(50000, Math.min(5000000, Number(e.target.value))))}
              style={{ marginTop: '10px', fontSize: '0.9rem', padding: '8px 14px' }}
              min={50000}
              max={5000000}
            />
          </div>

          {/* Interest Rate */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.88rem' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Percent size={13} /> Interest Rate (p.a.)
              </span>
              <span style={{ color: 'var(--color-brand)', fontWeight: 800 }}>{interestRate}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', outline: 'none', cursor: 'pointer', accentColor: 'var(--color-brand)', marginTop: '6px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>1%</span>
              <span>15%</span>
              <span>30%</span>
            </div>
            <input
              type="number"
              className="form-input"
              value={interestRate}
              onChange={(e) => setInterestRate(Math.max(0.1, Math.min(30, Number(e.target.value))))}
              step="0.1"
              style={{ marginTop: '10px', fontSize: '0.9rem', padding: '8px 14px' }}
            />
          </div>

          {/* Tenure */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.88rem' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> Loan Tenure
              </span>
              <span style={{ color: 'var(--color-brand)', fontWeight: 800 }}>
                {tenure} mo ({Math.round((tenure / 12) * 10) / 10} yrs)
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="360"
              step="3"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', outline: 'none', cursor: 'pointer', accentColor: 'var(--color-brand)', marginTop: '6px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>3m</span>
              <span>15yr</span>
              <span>30yr</span>
            </div>
            <input
              type="number"
              className="form-input"
              value={tenure}
              onChange={(e) => setTenure(Math.max(3, Math.min(360, Number(e.target.value))))}
              style={{ marginTop: '10px', fontSize: '0.9rem', padding: '8px 14px' }}
              min={3}
              max={360}
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Calculation Output</h3>

            {/* Monthly EMI Hero */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px 20px', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Monthly EMI</p>
              <h2 style={{
                fontSize: '2.8rem', fontWeight: 900,
                background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1.1,
              }}>
                {formatCurrency(emi, geoCode)}
              </h2>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '10px' }}>
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '10px', padding: '14px' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Principal Amount</p>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px', color: 'var(--color-brand)' }}>{formatCurrency(principal, geoCode)}</h4>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '10px', padding: '14px' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Interest</p>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px', color: 'var(--color-success)' }}>{formatCurrency(totalInterest, geoCode)}</h4>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount Payable</p>
              <h4 style={{ fontSize: '1.35rem', fontWeight: 900, marginTop: '4px' }}>{formatCurrency(totalRepayment, geoCode)}</h4>
            </div>

            {/* Interest ratio bar */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Interest ratio</span>
                <span style={{ fontWeight: 600 }}>{totalRepayment > 0 ? ((totalInterest / totalRepayment) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar progress-bar-success" style={{ width: `${totalRepayment > 0 ? ((principal / totalRepayment) * 100).toFixed(1) : 100}%` }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span style={{ color: 'var(--color-success)' }}>■ Principal</span>
                <span style={{ color: 'var(--color-brand)' }}>■ Interest</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '20px', gap: '8px' }}
          >
            {showSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showSchedule ? 'Hide Amortization Table' : 'View Amortization Table'}
          </button>
        </div>

        {/* Chart Panel */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', alignSelf: 'flex-start' }}>Payment Breakdown</h3>
          <div style={{ width: '100%', height: '230px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }}
                  formatter={(value) => [formatCurrency(value, geoCode), '']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick stats below chart */}
          <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Interest Rate</p>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-brand)', marginTop: '2px' }}>{interestRate}%</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tenure</p>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '2px' }}>{Math.round(tenure / 12 * 10) / 10} yrs</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Amortization Table ── */}
      {showSchedule && (
        <div className="glass-panel animate-fade-in" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Amortization Schedule</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
                {schedule.length} monthly payments · Total: {formatCurrency(totalRepayment, geoCode)}
              </p>
            </div>
            <button
              onClick={handleExportSchedule}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'rgba(16,185,129,0.3)', color: 'var(--color-success)' }}
            >
              <Download size={14} /> Download Excel
            </button>
          </div>
          
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '580px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Month', 'EMI Payment', 'Principal Paid', 'Interest Paid', 'Remaining Balance'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr
                    key={row.month}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 16px', fontWeight: 700, fontSize: '0.88rem' }}>
                      <span style={{ background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px' }}>{row.month}</span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '0.9rem', fontWeight: 500 }}>{formatCurrency(row.emi, geoCode)}</td>
                    <td style={{ padding: '11px 16px', fontSize: '0.9rem', color: '#818cf8', fontWeight: 600 }}>{formatCurrency(row.principalPaid, geoCode)}</td>
                    <td style={{ padding: '11px 16px', fontSize: '0.9rem', color: '#10b981', fontWeight: 600 }}>{formatCurrency(row.interestPaid, geoCode)}</td>
                    <td style={{ padding: '11px 16px', fontSize: '0.9rem', fontWeight: 500 }}>{formatCurrency(row.remainingBalance, geoCode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
