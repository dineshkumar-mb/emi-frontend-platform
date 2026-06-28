import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { 
  TrendingUp, Calendar, ShieldAlert, Plus, Trash2, Sparkles, Info, X,
  Calculator, HelpCircle, FileText, Send, SendHorizontal, Download,
  Clipboard, CheckCircle2, AlertCircle, Smartphone, Zap, Shield,
  RefreshCw, CreditCard, Repeat, Activity, Eye, EyeOff
} from 'lucide-react';
import { parseSmsText, matchLoan } from '../utils/smsParser';
import { validatePaymentLocally } from '../utils/paymentValidator';
import { exportToExcel } from '../utils/excelExport';
import { getOrGenerateKeyPair, exportPublicKeyJwk, signPayload } from '../utils/cryptoHelper';
import { formatCurrency, getGeoConfig } from '../utils/geoConfig';

// ── Helper: channel / type labels ─────────────────────────────────────────────
const TX_TYPE_LABEL = {
  debit: 'Bank Debit', credit: 'Credit', refund: 'Refund',
  autopay: 'Auto-Pay / Standing Instruction', upi: 'UPI Transfer',
  card_emi: 'Credit Card EMI', loan_payment: 'Loan Repayment',
  bank_alert: 'Bank Alert', unknown: 'Unknown',
};
const TX_TYPE_COLOR = {
  debit: '#94a3b8', credit: '#10b981', refund: '#f59e0b',
  autopay: '#818cf8', upi: '#3b82f6', card_emi: '#ec4899',
  loan_payment: '#10b981', bank_alert: '#f59e0b', unknown: '#64748b',
};
const STATUS_COLOR = {
  success: 'var(--color-success)', failed: 'var(--color-danger)',
  pending: 'var(--color-warning)', reversed: '#f59e0b', unknown: 'var(--text-muted)',
};
const FLAG_META = {
  otp_detected:              { icon: '🔐', label: 'OTP detected — not payment related',    danger: true },
  pin_detected:              { icon: '🔑', label: 'PIN mentioned — credentials suppressed', danger: true },
  cvv_detected:              { icon: '💳', label: 'CVV mentioned — suppressed',             danger: true },
  suspicious_phishing:       { icon: '⚠️', label: 'Phishing / spoofed message suspected',  danger: true },
  contains_full_sensitive_id:{ icon: '🚨', label: 'Full account/card number detected',     danger: true },
  low_signal:                { icon: 'ℹ️', label: 'Low signal — may not be a payment',     danger: false },
  ambiguous_source:          { icon: '❓', label: 'Ambiguous source — could not verify',   danger: false },
};

export default function Dashboard({ onSendToCalculator }) {
  const { user, refreshUser } = useAuth();
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [historyStats, setHistoryStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [aiInsight, setAiInsight] = useState('');
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Form states
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [provider, setProvider]           = useState('');
  const [loanType, setLoanType]           = useState('Personal Loan');
  const [principal, setPrincipal]         = useState('');
  const [interestRate, setInterestRate]   = useState('');
  const [tenure, setTenure]               = useState('');
  const [nextDueDate, setNextDueDate]     = useState('');
  const [formLoading, setFormLoading]     = useState(false);

  // Upload Statement
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile]               = useState(null);
  const [uploadLoading, setUploadLoading]         = useState(false);

  // Telegram
  const [telegramChatId, setTelegramChatId] = useState(user?.telegramChatId || '-5128959794');
  const [telegramStatus, setTelegramStatus] = useState('');

  // WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
  const [whatsappStatus, setWhatsappStatus] = useState('');
  const [showWhatsapp, setShowWhatsapp]     = useState(false);
  const [showTelegram, setShowTelegram]     = useState(false);

  // SMS Detection — dual-engine state
  const [isSmsModalOpen, setIsSmsModalOpen]   = useState(false);
  const [smsText, setSmsText]                 = useState('');
  const [parsedSms, setParsedSms]             = useState(null);       // local engine result
  const [aiParsed, setAiParsed]               = useState(null);       // Gemini engine result
  const [aiLoading, setAiLoading]             = useState(false);
  const [activeEngine, setActiveEngine]       = useState('local');    // 'local' | 'ai'
  const [smsMatchedLoan, setSmsMatchedLoan]   = useState(null);
  const [smsConfirming, setSmsConfirming]     = useState(false);
  const [smsResult, setSmsResult]             = useState(null);
  const [clipboardLoading, setClipboardLoading] = useState(false);
  const [validation, setValidation]           = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const debounceRef = useRef(null);

  // Prepayment
  const [selectedLoanForPrepay, setSelectedLoanForPrepay] = useState(null);
  const [prepayAmount, setPrepayAmount] = useState('');
  const [prepayMonth, setPrepayMonth]   = useState('1');
  const [prepayResult, setPrepayResult] = useState(null);
  const [prepayLoading, setPrepayLoading] = useState(false);

  // Notification Center States
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    emiReminders: true,
    paymentAlerts: true,
    overdueAlerts: true,
    monthlyReports: true,
    financialTips: false
  });
  const [notificationAnalytics, setNotificationAnalytics] = useState({
    sentToday: 0,
    successRate: 100,
    failedCount: 0,
    topTemplate: 'None'
  });
  const [autopayLoanId, setAutopayLoanId] = useState('');
  const [autopayStatus, setAutopayStatus] = useState('success');
  const [autopayReason, setAutopayReason] = useState('');
  const [autopaySimulating, setAutopaySimulating] = useState(false);
  const [autopayMessage, setAutopayMessage] = useState('');

  const activeParsed = activeEngine === 'ai' && aiParsed ? aiParsed : parsedSms;

  useEffect(() => {
    if (user) {
      setTelegramChatId(user.telegramChatId || '-5128959794');
      setWhatsappNumber(user.whatsappNumber || '');
    }
  }, [user]);


  // ── Device Trust: Check and Register Web Crypto Key Pair ──
  useEffect(() => {
    const checkAndRegisterKey = async () => {
      if (user && !user.devicePublicKey) {
        try {
          console.log('[Dashboard] Device trust registration active...');
          const { publicKey } = await getOrGenerateKeyPair();
          const jwkStr = await exportPublicKeyJwk(publicKey);
          const r = await fetch('/api/auth/register-key', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey: jwkStr }),
          });
          if (r.ok) {
            console.log('[Dashboard] Device public key registered successfully!');
            refreshUser();
          } else {
            console.error('[Dashboard] Device key registration failed.');
          }
        } catch (err) {
          console.error('[Dashboard] Device keypair generation error:', err);
        }
      }
    };
    checkAndRegisterKey();
  }, [user]);

  // ── Trigger Stage-2 Payment Validation ──
  useEffect(() => {
    if (!smsMatchedLoan || !activeParsed || !activeParsed.amount) {
      setValidation(null);
      return;
    }

    const runValidation = async () => {
      setValidationLoading(true);
      try {
        if (activeEngine === 'ai') {
          const { privateKey } = await getOrGenerateKeyPair();
          const nonce = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          const timestamp = new Date().toISOString();
          const body = {
            parsedPayment: activeParsed,
            matchedLoanId: smsMatchedLoan._id,
            engineUsed: 'ai',
          };
          const signature = await signPayload(privateKey, body);

          const r = await fetch('/api/loans/validate-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-device-signature': signature,
              'x-device-timestamp': timestamp,
              'x-device-nonce': nonce,
            },
            body: JSON.stringify(body),
          });
          if (r.ok) {
            const data = await r.json();
            setValidation(data);
          } else {
            // Local validation fallback
            const localVal = validatePaymentLocally(activeParsed, smsMatchedLoan, 'ai-fallback');
            setValidation(localVal);
          }
        } else {
          // Offline local validation
          const localVal = validatePaymentLocally(activeParsed, smsMatchedLoan, 'local');
          setValidation(localVal);
        }
      } catch (err) {
        console.error('[Dashboard] Stage-2 Validation Error:', err);
        const localVal = validatePaymentLocally(activeParsed, smsMatchedLoan, 'error-fallback');
        setValidation(localVal);
      } finally {
        setValidationLoading(false);
      }
    };

    runValidation();
  }, [smsMatchedLoan, activeParsed, activeEngine]);

  // ── Notification Center Helpers ──
  const fetchNotificationData = async () => {
    try {
      const [rPrefs, rLogs, rAnalytics] = await Promise.all([
        fetch('/api/notifications/preferences'),
        fetch('/api/notifications/logs'),
        fetch('/api/notifications/analytics')
      ]);
      if (rPrefs.ok) {
        const data = await rPrefs.json();
        setNotificationPrefs(data);
      }
      if (rLogs.ok) setNotificationLogs(await rLogs.json());
      if (rAnalytics.ok) setNotificationAnalytics(await rAnalytics.json());
    } catch (err) {
      console.error('Error fetching notification center data:', err);
    }
  };

  const handleResetRecentNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all Recent Notifications?')) return;
    try {
      const r = await fetch('/api/intelligence/notifications', { method: 'DELETE' });
      if (r.ok) {
        setNotifications([]);
      } else {
        const d = await r.json();
        setError(d.message || 'Failed to reset notifications.');
      }
    } catch {
      setError('Network error clearing notifications.');
    }
  };

  const handleResetDeliveryLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all Live Delivery Logs?')) return;
    try {
      const r = await fetch('/api/notifications/logs', { method: 'DELETE' });
      if (r.ok) {
        fetchNotificationData();
      } else {
        const d = await r.json();
        setError(d.message || 'Failed to reset delivery logs.');
      }
    } catch {
      setError('Network error clearing delivery logs.');
    }
  };

  const handleTogglePreference = async (key) => {
    const updated = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key]
    };
    setNotificationPrefs(updated);
    try {
      const r = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (r.ok) {
        const data = await r.json();
        if (data.preferences) setNotificationPrefs(data.preferences);
      }
    } catch (err) {
      console.error('Failed to update notification preference:', err);
    }
  };

  const handleSimulateAutopay = async (e) => {
    e.preventDefault();
    if (!autopayLoanId) return;
    setAutopaySimulating(true);
    setAutopayMessage('');
    try {
      const r = await fetch(`/api/notifications/simulate-autopay/${autopayLoanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: autopayStatus, reason: autopayStatus === 'failure' ? autopayReason : '' })
      });
      const data = await r.json();
      setAutopayMessage(data.message || 'Simulation triggered.');
      fetchNotificationData();
    } catch (err) {
      setAutopayMessage('Failed to trigger autopay simulation.');
    } finally {
      setAutopaySimulating(false);
    }
  };

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setHealthLoading(true);
      const [rLoans, rPayments, rStats, rNotifications, rHealth] = await Promise.all([
        fetch('/api/loans'),
        fetch('/api/loans/payments'),
        fetch('/api/loans/payment-history'),
        fetch('/api/intelligence/notifications'),
        fetch('/api/intelligence/health-score')
      ]);

      if (rLoans.ok) setLoans(await rLoans.json());
      if (rPayments.ok) setPayments(await rPayments.json());
      if (rStats.ok) setHistoryStats(await rStats.json());
      if (rNotifications.ok) {
        const data = await rNotifications.json();
        setNotifications(data.logs || []);
      }
      if (rHealth.ok) {
        setHealthData(await rHealth.json());
      }
      fetchNotificationData();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Server connection lost.');
    } finally {
      setLoading(false);
      setHealthLoading(false);
    }
  };

  const generatePortfolioInsights = async () => {
    setAiInsightLoading(true);
    try {
      const r = await fetch('/api/intelligence/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Analyze my active loans and provide specific prepayment recommendations, estimated interest savings, and debt reduction tips in a short bulleted format.' }),
      });
      if (r.ok) {
        const data = await r.json();
        setAiInsight(data.response || 'No insights available.');
      }
    } catch (err) {
      console.error('Error generating AI insights:', err);
    } finally {
      setAiInsightLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-generate insights on load if active loans exist
    if (loans.length > 0) {
      generatePortfolioInsights();
    }
  }, []);

  // ── SMS Dual-Engine ────────────────────────────────────────────────────────

  /** Run local regex engine immediately; schedule Gemini AI after 900ms debounce */
  const handleSmsTextChange = (text) => {
    setSmsText(text);
    setSmsResult(null);
    setAiParsed(null);
    setActiveEngine('local');

    if (text.trim().length > 15) {
      // Local engine — instant
      const local = parseSmsText(text);
      setParsedSms(local);
      setSmsMatchedLoan(matchLoan(local, loans));

      // Gemini engine — debounced 900ms
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runGeminiEngine(text), 900);
    } else {
      setParsedSms(null);
      setSmsMatchedLoan(null);
    }
  };

  const runGeminiEngine = async (text) => {
    setAiLoading(true);
    try {
      const r = await fetch('/api/loans/parse-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (r.ok) {
        const data = await r.json();
        setAiParsed(data);
        // Auto-switch to AI view if higher confidence
        if (data.confidence > (parsedSms?.confidence || 0)) {
          setActiveEngine('ai');
          setSmsMatchedLoan(matchLoan(data, loans));
        }
      }
    } catch { /* silent — local engine is the fallback */ }
    finally { setAiLoading(false); }
  };

  const handleReadClipboard = async () => {
    setClipboardLoading(true);
    try {
      const text = await navigator.clipboard.readText();
      handleSmsTextChange(text);
    } catch {
      alert('Could not read clipboard. Please paste the SMS text manually.');
    } finally { setClipboardLoading(false); }
  };
  const handleConfirmSmsPayment = async () => {
    if (!smsMatchedLoan || !activeParsed) return;
    setSmsConfirming(true);
    setSmsResult(null);
    try {
      const body = {
        amount: activeParsed.amount || smsMatchedLoan.emiAmount,
        refId:  activeParsed.referenceIdMasked,
        source: activeParsed.transactionType === 'upi' ? 'GPay' : 'SMS',
        date:   activeParsed.paymentDate ? new Date(activeParsed.paymentDate).toISOString() : new Date().toISOString(),
      };

      const { privateKey } = await getOrGenerateKeyPair();
      const nonce = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();
      const signature = await signPayload(privateKey, body);

      const r = await fetch(`/api/loans/${smsMatchedLoan._id}/mark-paid`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-device-signature': signature,
          'x-device-timestamp': timestamp,
          'x-device-nonce': nonce
        },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setSmsResult({ type: 'success', message: `✓ Payment of ${formatCurrency(body.amount, user?.geo || 'IN')} confirmed for ${smsMatchedLoan.provider}!` });
        fetchLoans();
      } else {
        const d = await r.json();
        setSmsResult({ type: 'error', message: d.message || 'Failed to record payment.' });
      }
    } catch (err) { 
      console.error('[Dashboard] Error confirming payment:', err);
      setSmsResult({ type: 'error', message: 'Network error confirming payment.' }); 
    } finally { setSmsConfirming(false); }
  };

  const closeSmsModal = () => {
    clearTimeout(debounceRef.current);
    setIsSmsModalOpen(false); setSmsText('');
    setParsedSms(null); setAiParsed(null);
    setSmsMatchedLoan(null); setSmsResult(null);
    setAiLoading(false); setActiveEngine('local');
  };

  // ── Loan CRUD ──────────────────────────────────────────────────────────────

  const handleAddLoan = async (e) => {
    e.preventDefault(); setFormLoading(true); setError('');
    try {
      const r = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, loanType, principal: Number(principal), interestRate: Number(interestRate), tenure: Number(tenure), nextDueDate }),
      });
      if (r.ok) {
        setIsModalOpen(false);
        setProvider(''); setLoanType('Personal Loan'); setPrincipal('');
        setInterestRate(''); setTenure(''); setNextDueDate('');
        fetchLoans();
      } else { const d = await r.json(); setError(d.message || 'Failed to add loan.'); }
    } catch { setError('Network error adding loan.'); }
    finally { setFormLoading(false); }
  };

  const handleUploadStatement = async (e) => {
    e.preventDefault(); if (!uploadFile) return;
    setUploadLoading(true); setError('');
    const fd = new FormData(); fd.append('file', uploadFile);
    try {
      const r = await fetch('/api/loans/upload-statement', { method: 'POST', body: fd });
      if (r.ok) {
        const data = await r.json();
        setProvider(data.provider || ''); setLoanType(data.loanType || 'Personal Loan');
        setPrincipal(data.principal ? String(data.principal) : '');
        setInterestRate(data.interestRate ? String(data.interestRate) : '');
        setTenure(data.tenure ? String(data.tenure) : '');
        if (data.nextDueDate) {
          try { setNextDueDate(new Date(data.nextDueDate).toISOString().split('T')[0]); } catch { setNextDueDate(''); }
        }
        if (onSendToCalculator) onSendToCalculator({ principal: data.principal || 1500000, interestRate: data.interestRate || 10.5, tenure: data.tenure || 36 });
        setIsUploadModalOpen(false); setIsModalOpen(true); setUploadFile(null);
      } else { const d = await r.json(); setError(d.message || 'Gemini failed to extract data.'); }
    } catch { setError('Network error calling Gemini parser.'); }
    finally { setUploadLoading(false); }
  };

  const handleDeleteLoan = async (id) => {
    if (!window.confirm('Delete this loan record?')) return;
    try {
      const r = await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      if (r.ok) { if (selectedLoanForPrepay?._id === id) { setSelectedLoanForPrepay(null); setPrepayResult(null); } fetchLoans(); }
    } catch { setError('Failed to delete loan.'); }
  };

  const handlePrepaySimulate = async (e) => {
    e.preventDefault(); if (!selectedLoanForPrepay) return;
    setPrepayLoading(true); setPrepayResult(null);
    try {
      const r = await fetch(`/api/loans/${selectedLoanForPrepay._id}/prepay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prepaymentAmount: Number(prepayAmount), prepaymentMonth: Number(prepayMonth) }),
      });
      if (r.ok) setPrepayResult(await r.json());
      else setError('Prepayment simulation failed.');
    } catch { setError('Network error simulating prepayment.'); }
    finally { setPrepayLoading(false); }
  };

  // ── Telegram ───────────────────────────────────────────────────────────────

  const handleSaveTelegramId = async () => {
    setTelegramStatus('Saving...');
    try {
      const r = await fetch('/api/auth/telegram', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telegramChatId }) });
      if (r.ok) { setTelegramStatus('Chat ID saved!'); refreshUser(); } else setTelegramStatus('Failed to update ID.');
    } catch { setTelegramStatus('Network connection error.'); }
  };
  const handleSendTestTelegram = async () => {
    setTelegramStatus('Pinging bot...');
    try {
      const r = await fetch('/api/loans/test-telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telegramChatId }) });
      if (r.ok) setTelegramStatus('Ping delivered! Check Telegram.');
      else { const d = await r.json(); setTelegramStatus(d.message || 'Ping failed.'); }
    } catch { setTelegramStatus('Connection error.'); }
  };
  const handleTriggerSweep = async (source) => {
    const setStatus = source === 'whatsapp' ? setWhatsappStatus : setTelegramStatus;
    setStatus('Running sweep...');
    try {
      const r = await fetch('/api/loans/trigger-scheduler', { method: 'POST' });
      if (r.ok) { 
        const d = await r.json(); 
        setStatus(d.message); 
        fetchNotificationData();
      } else {
        setStatus('Scheduler run failed.');
      }
    } catch { 
      setStatus('Network error.'); 
    }
  };

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  const handleSaveWhatsappNumber = async () => {
    setWhatsappStatus('Saving...');
    try {
      const r = await fetch('/api/auth/whatsapp-number', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber }),
      });
      if (r.ok) {
        setWhatsappStatus('WhatsApp number saved!');
        refreshUser();
        fetchNotificationData();
      } else {
        const d = await r.json();
        setWhatsappStatus(d.message || 'Failed to update WhatsApp number.');
      }
    } catch {
      setWhatsappStatus('Network connection error.');
    }
  };
  const handleSendTestWhatsapp = async () => {
    setWhatsappStatus('Pinging WhatsApp...');
    try {
      const r = await fetch('/api/loans/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber }),
      });
      if (r.ok) {
        setWhatsappStatus('Ping delivered! Check WhatsApp.');
      } else {
        const d = await r.json();
        setWhatsappStatus(d.message || 'Ping failed.');
      }
    } catch {
      setWhatsappStatus('Connection error.');
    }
  };

  // ── Computed Stats ─────────────────────────────────────────────────────────

  const stats = React.useMemo(() => {
    const totalOutstanding = loans.reduce((s, l) => s + l.outstandingBalance, 0);
    const monthlyEmi = loans.reduce((s, l) => s + l.emiAmount, 0);
    let earliestDue = null;
    loans.forEach(l => { if (l.nextDueDate) { const d = new Date(l.nextDueDate); if (!earliestDue || d < earliestDue) earliestDue = d; } });

    // EMI Paid Today
    const todayStr = new Date().toDateString();
    const emiPaidToday = payments
      .filter(p => new Date(p.paymentDate).toDateString() === todayStr && p.paymentStatus === 'success')
      .reduce((sum, p) => sum + p.emiAmount, 0);

    // Total Principal & Interest Paid
    const totalPrincipalPaid = historyStats?.totalPrincipalPaid || 0;
    const totalInterestPaid = historyStats?.totalInterestPaid || 0;

    // Debt Free Countdown
    const activeLoans = loans.filter(l => l.status === 'active' && l.outstandingBalance > 0);
    let remainingText = '0 Months';
    let estimatedClosureText = 'N/A';
    if (activeLoans.length > 0) {
      let furthestClosureDate = new Date();
      for (const loan of activeLoans) {
        const nextDue = loan.nextDueDate ? new Date(loan.nextDueDate) : new Date();
        const emi = loan.emiAmount || (loan.outstandingBalance / 12) || 1;
        const annualRate = loan.interestRate || 0;
        let remainingMonths = 1;

        if (annualRate > 0) {
          const r = annualRate / 12 / 100;
          if (emi > loan.outstandingBalance * r) {
            const remaining = Math.log(emi / (emi - loan.outstandingBalance * r)) / Math.log(1 + r);
            remainingMonths = Math.max(1, Math.ceil(remaining));
          } else {
            remainingMonths = Math.max(1, Math.ceil(loan.outstandingBalance / emi));
          }
        } else {
          remainingMonths = Math.max(1, Math.ceil(loan.outstandingBalance / emi));
        }

        const closureDate = new Date(nextDue);
        closureDate.setMonth(closureDate.getMonth() + (remainingMonths - 1));
        if (closureDate > furthestClosureDate) {
          furthestClosureDate = closureDate;
        }
      }
      const today = new Date();
      let yearsDiff = furthestClosureDate.getFullYear() - today.getFullYear();
      let monthsDiff = furthestClosureDate.getMonth() - today.getMonth();
      if (monthsDiff < 0) {
        yearsDiff -= 1;
        monthsDiff += 12;
      }
      remainingText = '';
      if (yearsDiff > 0) remainingText += `${yearsDiff} Year${yearsDiff > 1 ? 's' : ''} `;
      if (monthsDiff > 0 || yearsDiff === 0) remainingText += `${monthsDiff} Month${monthsDiff > 1 ? 's' : ''}`;
      remainingText = remainingText.trim();
      estimatedClosureText = furthestClosureDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    }

    return {
      totalOutstanding,
      monthlyEmi,
      activeCount: loans.length,
      nextDue: earliestDue ? earliestDue.toLocaleDateString() : 'N/A',
      emiPaidToday,
      totalPrincipalPaid,
      totalInterestPaid,
      remainingText,
      estimatedClosureText
    };
  }, [loans, payments, historyStats]);

  const barChartData = React.useMemo(() => loans.map(l => ({ name: l.provider.split(' ')[0], EMI: l.emiAmount })), [loans]);
  const pieChartData = React.useMemo(() => {
    const cats = {}; loans.forEach(l => { cats[l.loanType] = (cats[l.loanType] || 0) + l.principal; });
    return Object.keys(cats).map(k => ({ name: k, value: cats[k] }));
  }, [loans]);
  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

  // Confidence badge
  const confClass  = (c) => c >= 65 ? 'confidence-high' : c >= 35 ? 'confidence-medium' : 'confidence-low';
  const confLabel  = (c) => c >= 65 ? 'High Confidence' : c >= 35 ? 'Medium Confidence' : 'Low Confidence';

  if (loading && loans.length === 0) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'80vh' }}><p style={{ color:'var(--text-secondary)', fontSize:'1.1rem' }}>Loading finance details...</p></div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in page-container">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{user.name}</span>. Here is your loan portfolio health.</p>
        </div>
        <div className="dashboard-header-actions">
          {loans.length > 0 && (
            <button onClick={() => exportToExcel(loans)} className="btn btn-secondary" style={{ borderColor:'rgba(16,185,129,0.3)', color:'var(--color-success)' }}>
              <Download size={16} /> Export Excel
            </button>
          )}
          <button onClick={() => setIsSmsModalOpen(true)} className="btn btn-secondary" style={{ borderColor:'rgba(245,158,11,0.3)', color:'var(--color-warning)' }}>
            <Smartphone size={16} /> Detect Payment
          </button>
          <button onClick={() => setIsUploadModalOpen(true)} className="btn btn-secondary" style={{ border:'1px dashed var(--color-brand)', background:'rgba(99,102,241,0.03)' }}>
            <FileText size={16} color="var(--color-brand)" /> Upload Statement
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Add Loan
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ background:'rgba(239,68,68,0.08)', borderColor:'rgba(239,68,68,0.2)', padding:'12px 16px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px', color:'var(--color-danger)', fontSize:'0.88rem' }}>
          <ShieldAlert size={18} style={{ flexShrink:0 }} /><span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {[
          { label:'Total Outstanding', value:formatCurrency(stats.totalOutstanding, user?.geo || 'IN'), icon:<TrendingUp size={16}/>, sub:'Outstanding principal balance', color:'var(--text-primary)' },
          { label:'Monthly EMI Outflow', value:formatCurrency(stats.monthlyEmi, user?.geo || 'IN'), icon:<Calendar size={16}/>, sub:'Total monthly payments', color:'var(--color-brand)' },
          { label:'EMI Paid Today', value:formatCurrency(stats.emiPaidToday, user?.geo || 'IN'), icon:<CheckCircle2 size={16}/>, sub:'Auto-processed payments today', color: stats.emiPaidToday > 0 ? 'var(--color-success)' : 'var(--text-muted)' },
          { label:'Principal Paid Till Date', value:formatCurrency(stats.totalPrincipalPaid, user?.geo || 'IN'), icon:<TrendingUp size={16}/>, sub:'Total paid towards principal', color:'var(--color-success)' },
          { label:'Interest Paid Till Date', value:formatCurrency(stats.totalInterestPaid, user?.geo || 'IN'), icon:<TrendingUp size={16}/>, sub:'Total paid towards interest', color:'var(--color-warning)' },
          { label:'Debt-Free Countdown', value: stats.remainingText, icon:<Zap size={16}/>, sub:`Est. Closure: ${stats.estimatedClosureText}`, color:'var(--color-brand)' },
        ].map((m, i) => (
          <div key={i} className="glass-panel" style={{ padding:'20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{m.label}</p>
                <div style={{ color: m.color }}>{m.icon}</div>
              </div>
              <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:m.color||'inherit', marginTop:'8px' }}>{m.value}</h2>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'10px', color:'var(--text-muted)', fontSize:'0.72rem' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Financial Health Score Widget */}
      {healthData && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Activity size={18} color="var(--color-brand)" /> AI Financial Health Score
            </h3>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: ['Excellent', 'Good'].includes(healthData.rating) ? 'rgba(16, 185, 129, 0.08)' : healthData.rating === 'Average' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${['Excellent', 'Good'].includes(healthData.rating) ? 'rgba(16, 185, 129, 0.2)' : healthData.rating === 'Average' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              color: ['Excellent', 'Good'].includes(healthData.rating) ? 'var(--color-success)' : healthData.rating === 'Average' ? 'var(--color-warning)' : 'var(--color-danger)',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              {healthData.rating} Rating
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Circular Gauge */}
            <div style={{ flex: '0 0 130px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="110" height="110" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="8"
                />
                {/* Foreground circle with dashboard colors */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={healthData.healthScore >= 80 ? 'url(#healthGradGreen)' : healthData.healthScore >= 50 ? 'url(#healthGradYellow)' : 'url(#healthGradRed)'}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthData.healthScore / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
                {/* Definitions for Gradients */}
                <defs>
                  <linearGradient id="healthGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="healthGradYellow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <linearGradient id="healthGradRed" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#b91c1c" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{healthData.healthScore}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '-4px' }}>Index</span>
              </div>
            </div>

            {/* Explanation & Recommendations */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 8px 0' }}>
                  {healthData.explanation}
                </p>
                {healthData.weights && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Dynamic weights allocated:</span>
                    <span>EMI burden ({healthData.weights.emiBurdenWeight}%)</span>
                    <span>·</span>
                    <span>Emergency fund ({healthData.weights.emergencyFundWeight}%)</span>
                    <span>·</span>
                    <span>Savings ({healthData.weights.savingsRateWeight}%)</span>
                  </div>
                )}
              </div>

              {/* Actionable recommendations list */}
              {healthData.recommendations && healthData.recommendations.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: 0 }}>AI Optimization Playbook</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {healthData.recommendations.map((rec, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        lineHeight: '1.45'
                      }}>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: rec.priority === 'High' ? 'rgba(239, 68, 68, 0.08)' : rec.priority === 'Medium' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                          color: rec.priority === 'High' ? 'var(--color-danger)' : rec.priority === 'Medium' ? 'var(--color-warning)' : 'var(--color-brand)',
                          border: `1px solid ${rec.priority === 'High' ? 'rgba(239, 68, 68, 0.2)' : rec.priority === 'Medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                          flexShrink: 0
                        }}>
                          {rec.category || 'AI'}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{rec.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {loans.length === 0 ? (
        <div className="glass-panel" style={{ padding:'50px', textAlign:'center', margin:'40px 0' }}>
          <h3 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:'8px' }}>No active loans tracked yet</h3>
          <p style={{ color:'var(--text-secondary)', marginBottom:'24px', maxWidth:'460px', margin:'0 auto 24px' }}>Get started by adding your loan contracts or upload statements via Gemini AI.</p>
          <div style={{ display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => setIsUploadModalOpen(true)} className="btn btn-secondary">Upload Statement File</button>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Create First Loan Record</button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid-2-col">
            {/* Loans list */}
            <div className="glass-panel" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'20px' }}>
              <h3 style={{ fontSize:'1.15rem', fontWeight:700 }}>Your Active Loans</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'16px', overflowY:'auto', maxHeight:'420px' }}>
                {loans.map(loan => (
                  <div key={loan._id} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', gap:'10px' }}>
                      <div style={{ minWidth:0 }}>
                        <h4 style={{ fontWeight:700, fontSize:'0.98rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{loan.provider}</h4>
                        <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:'4px', marginTop:'4px', display:'inline-block' }}>{loan.loanType}</span>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <h4 style={{ fontWeight:800, fontSize:'1rem' }}>{formatCurrency(loan.emiAmount, user?.geo || 'IN')}/mo</h4>
                        <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>at {loan.interestRate}%</p>
                      </div>
                    </div>
                    <div style={{ margin:'12px 0 8px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'4px' }}>
                        <span>Balance: {formatCurrency(loan.outstandingBalance, user?.geo || 'IN')}</span>
                        <span>Principal: {formatCurrency(loan.principal, user?.geo || 'IN')}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'4px' }}>
                        <span>Total Interest: {formatCurrency((loan.emiAmount * loan.tenure) - loan.principal, user?.geo || 'IN')}</span>
                        <span>Total Payment: {formatCurrency(loan.emiAmount * loan.tenure, user?.geo || 'IN')}</span>
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar" style={{ width:`${Math.max(((loan.principal - loan.outstandingBalance) / loan.principal) * 100, 2)}%` }}></div>
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'12px', borderTop:'1px solid rgba(255,255,255,0.03)', paddingTop:'10px', flexWrap:'wrap', gap:'8px' }}>
                      <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                        Due: {new Date(loan.nextDueDate).toLocaleDateString()}
                        {(loan.paymentHistory||[]).length > 0 && <span style={{ marginLeft:'8px', color:'var(--color-success)', fontWeight:600 }}>✓ {loan.paymentHistory.length} paid</span>}
                      </span>
                      <div className="loan-card-actions">
                        <button onClick={() => { setSelectedLoanForPrepay(loan); setPrepayResult(null); setPrepayAmount(''); }} className="btn btn-secondary btn-sm"><Calculator size={12}/> Forecast</button>
                        <button onClick={() => onSendToCalculator && onSendToCalculator({ principal:loan.principal, interestRate:loan.interestRate, tenure:loan.tenure })} className="btn btn-secondary btn-sm" style={{ borderColor:'var(--color-brand)', color:'var(--color-brand)' }}><Calculator size={12}/> Analyze</button>
                        <button onClick={() => handleDeleteLoan(loan._id)} className="btn btn-sm" style={{ padding:'4px 8px', background:'transparent', border:'1px solid rgba(239,68,68,0.2)', color:'var(--color-danger)', minHeight:'32px' }}><Trash2 size={12}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="glass-panel" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'20px', minHeight:'430px' }}>
              <h3 style={{ fontSize:'1.15rem', fontWeight:700 }}>Obligations Distribution</h3>
              <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap:'20px', flex:1 }}>
                <div style={{ width:'100%', height:'160px' }}>
                  <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'8px', textTransform:'uppercase' }}>EMI outflow by provider</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false}/>
                      <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false}/>
                      <ChartTooltip contentStyle={{ background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'8px' }} formatter={v => [formatCurrency(v, user?.geo || 'IN'), 'EMI']}/>
                      <Bar dataKey="EMI" fill="#6366f1" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width:'100%', height:'160px', display:'flex', alignItems:'center' }}>
                  <div style={{ flex:1, height:'100%' }}>
                    <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'4px', textTransform:'uppercase' }}>Debt Concentration (Principal)</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                          {pieChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                        </Pie>
                        <ChartTooltip contentStyle={{ background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'8px' }} formatter={v => [formatCurrency(v, user?.geo || 'IN'), 'Principal']}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px', paddingLeft:'16px', maxWidth:'160px' }}>
                    {pieChartData.map((e, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.72rem' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:PIE_COLORS[i%PIE_COLORS.length], flexShrink:0 }}></div>
                        <span style={{ color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prepayment Simulator */}
          {selectedLoanForPrepay && (
            <div className="glass-panel animate-fade-in" style={{ padding:'24px', marginBottom:'30px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', gap:'12px' }}>
                <div>
                  <h3 style={{ fontSize:'1.25rem', fontWeight:800 }}>Prepayment Savings Forecaster</h3>
                  <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>Simulating: <strong style={{ color:'var(--text-primary)' }}>{selectedLoanForPrepay.provider} ({selectedLoanForPrepay.loanType})</strong></p>
                </div>
                <button onClick={() => { setSelectedLoanForPrepay(null); setPrepayResult(null); }} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', flexShrink:0 }}><X size={20}/></button>
              </div>
              <div className="prepay-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'20px' }}>
                <div style={{ background:'rgba(255,255,255,0.01)', border:'1px solid var(--border-color)', padding:'20px', borderRadius:'12px' }}>
                  <form onSubmit={handlePrepaySimulate}>
                    <div className="form-group"><label className="form-label">Prepayment Amount ({getGeoConfig(user?.geo || 'IN').symbol})</label><input type="number" className="form-input" placeholder="e.g. 50000" value={prepayAmount} onChange={e => setPrepayAmount(e.target.value)} required min={100}/></div>
                    <div className="form-group" style={{ marginBottom:'20px' }}><label className="form-label">Prepay at month index</label>
                      <select value={prepayMonth} onChange={e => setPrepayMonth(e.target.value)} style={{ width:'100%' }}>
                        {Array.from({ length: selectedLoanForPrepay.tenure }, (_, i) => <option key={i+1} value={i+1}>Month {i+1}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width:'100%' }} disabled={prepayLoading}>{prepayLoading ? 'Calculating...' : 'Forecast Savings'}</button>
                  </form>
                </div>
                <div style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
                  {prepayResult ? (
                    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                        <div style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:'10px', padding:'16px', textAlign:'center' }}>
                          <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)', textTransform:'uppercase' }}>Interest Saved</p>
                          <h3 style={{ fontSize:'1.45rem', fontWeight:800, color:'var(--color-success)', marginTop:'4px' }}>{formatCurrency(prepayResult.savings.interestSaved, user?.geo || 'IN')}</h3>
                        </div>
                        <div style={{ background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:'10px', padding:'16px', textAlign:'center' }}>
                          <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)', textTransform:'uppercase' }}>Tenure Reduced</p>
                          <h3 style={{ fontSize:'1.45rem', fontWeight:800, color:'var(--color-brand)', marginTop:'4px' }}>{prepayResult.savings.tenureSavedMonths} Months</h3>
                        </div>
                      </div>
                      <div style={{ background:'rgba(255,255,255,0.01)', border:'1px solid var(--border-color)', borderRadius:'10px', padding:'14px', fontSize:'0.85rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'4px' }}><span style={{ color:'var(--text-secondary)' }}>Total Interest (Before / After):</span><span>{formatCurrency(prepayResult.original.totalInterest, user?.geo || 'IN')} / <strong>{formatCurrency(prepayResult.projected.totalInterest, user?.geo || 'IN')}</strong></span></div>
                        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'4px' }}><span style={{ color:'var(--text-secondary)' }}>Tenure (Before / After):</span><span>{prepayResult.original.tenureMonths}m / <strong>{prepayResult.projected.tenureMonths}m</strong></span></div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'20px', color:'var(--text-secondary)' }}>
                      <HelpCircle size={36} style={{ color:'var(--text-muted)', marginBottom:'8px', display:'inline-block' }}/>
                      <p style={{ fontSize:'0.88rem' }}>Enter a prepayment amount and forecast savings in interest and duration.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Insights & Recent Notifications */}
          <div className="grid-2-col" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* AI Insights Widget */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--color-warning)" /> AI Portfolio Insights
                </h3>
                <button
                  onClick={generatePortfolioInsights}
                  className="btn btn-secondary btn-sm"
                  disabled={aiInsightLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {aiInsightLoading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
                  {aiInsightLoading ? 'Generating...' : 'Refresh Insights'}
                </button>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {aiInsight ? (
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {aiInsight}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <HelpCircle size={28} style={{ marginBottom: '8px', display: 'inline-block' }} />
                    <p style={{ fontSize: '0.82rem' }}>No insights generated yet. Click "Refresh Insights" to let Gemini AI analyze your portfolio.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Notifications Log Widget */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Activity size={18} color="var(--color-brand)" /> Recent Notifications
                </h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleResetRecentNotifications} 
                    className="btn btn-secondary btn-sm" 
                    style={{ minHeight: '30px', padding: '4px 10px', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '280px' }}>
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((log, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', background: log.type === 'whatsapp' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', color: log.type === 'whatsapp' ? 'var(--color-success)' : 'var(--color-brand)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {log.type}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.message}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, background: log.status?.toLowerCase() === 'sent' || log.status?.toLowerCase() === 'success' || log.status?.toLowerCase() === 'mock_sent' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: log.status?.toLowerCase() === 'sent' || log.status?.toLowerCase() === 'success' || log.status?.toLowerCase() === 'mock_sent' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {log.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.82rem' }}>No notifications sent yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Notification Center & Automation Settings ── */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '30px' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} color="var(--color-brand)" /> Notification & Automation Center
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Configure alerts, check delivery logs, simulate payments, and link channels.</p>
          </div>
          <button onClick={fetchNotificationData} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} /> Sync Logs
          </button>
        </div>

        {/* Analytics row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Sent Today', value: notificationAnalytics.sentToday, sub: 'Total dispatches today', color: 'var(--text-primary)' },
            { label: 'Success Rate', value: `${notificationAnalytics.successRate}%`, sub: 'Delivery success rate', color: 'var(--color-success)' },
            { label: 'Failed Alerts', value: notificationAnalytics.failedCount, sub: 'Failed alert delivery attempts', color: notificationAnalytics.failedCount > 0 ? 'var(--color-danger)' : 'var(--text-muted)' },
            { label: 'Top Template', value: (notificationAnalytics.topTemplate || 'None').replace(/_/g, ' '), sub: 'Most triggered alert', color: 'var(--color-brand)' }
          ].map((card, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '10px' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{card.label}</p>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: card.color, margin: '6px 0 2px' }}>{card.value}</h4>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Settings and Channels Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Preferences Toggles */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>Preferences Toggles</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {[
                  { key: 'emiReminders', label: 'EMI Reminders', desc: 'Upcoming payments due today/tomorrow' },
                  { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'EMI success & auto-pay alerts' },
                  { key: 'overdueAlerts', label: 'Overdue Alerts', desc: 'Missed payments warning' },
                  { key: 'monthlyReports', label: 'Monthly Summary', desc: 'Loan status summaries' },
                  { key: 'financialTips', label: 'Smart Financial Tips', desc: 'AI-generated refinance & credit tips' }
                ].map((pref) => (
                  <div key={pref.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pref.label}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{pref.desc}</p>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs[pref.key]}
                        onChange={() => handleTogglePreference(pref.key)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span className="slider" style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: notificationPrefs[pref.key] ? 'var(--color-brand)' : '#334155',
                        borderRadius: '34px',
                        transition: '.3s'
                      }}>
                        <span className="slider-knob" style={{
                          position: 'absolute',
                          height: '16px', width: '16px',
                          left: notificationPrefs[pref.key] ? '18px' : '4px',
                          bottom: '3px',
                          background: 'white',
                          borderRadius: '50%',
                          transition: '.3s'
                        }}/>
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Channels Linking */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>Channel Connections</h4>
              
              {/* WhatsApp linking */}
              <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>WhatsApp Number</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showWhatsapp ? "text" : "password"} 
                      className="form-input" 
                      style={{ flex: 1, paddingRight: '40px' }} 
                      placeholder="e.g. +919876543210" 
                      value={whatsappNumber} 
                      onChange={e => setWhatsappNumber(e.target.value)} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowWhatsapp(!showWhatsapp)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showWhatsapp ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button onClick={handleSaveWhatsappNumber} className="btn btn-secondary btn-sm">Save</button>
                  <button onClick={handleSendTestWhatsapp} className="btn btn-secondary btn-sm" disabled={!whatsappNumber}><Send size={12} /></button>
                </div>
                {whatsappStatus && <p style={{ fontSize: '0.7rem', color: whatsappStatus.includes('failed') ? 'var(--color-danger)' : 'var(--color-success)', marginTop: '4px' }}>{whatsappStatus}</p>}
              </div>

              {/* Telegram linking */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Telegram Chat ID</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showTelegram ? "text" : "password"} 
                      className="form-input" 
                      style={{ flex: 1, paddingRight: '40px' }} 
                      placeholder="e.g. -5128959794" 
                      value={telegramChatId} 
                      onChange={e => setTelegramChatId(e.target.value)} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowTelegram(!showTelegram)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showTelegram ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button onClick={handleSaveTelegramId} className="btn btn-secondary btn-sm">Save</button>
                  <button onClick={handleSendTestTelegram} className="btn btn-secondary btn-sm" disabled={!telegramChatId}><Send size={12} /></button>
                </div>
                {telegramStatus && <p style={{ fontSize: '0.7rem', color: telegramStatus.includes('failed') ? 'var(--color-danger)' : 'var(--color-success)', marginTop: '4px' }}>{telegramStatus}</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={() => handleTriggerSweep('whatsapp')} className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', marginTop: '12px', width: '100%' }}>
                  <SendHorizontal size={12} style={{ marginRight: '4px' }} /> Manual Alerts Scan & Sweep
                </button>
              </div>
            </div>

            {/* Autopay Simulation */}
            {loans.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>Autopay Simulation</h4>
                <form onSubmit={handleSimulateAutopay} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Select Loan</label>
                    <select value={autopayLoanId} onChange={e => setAutopayLoanId(e.target.value)} required style={{ width: '100%' }}>
                      <option value="">-- Choose Loan --</option>
                      {loans.map(l => <option key={l._id} value={l._id}>{l.provider} ({l.loanType})</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Status</label>
                      <select value={autopayStatus} onChange={e => setAutopayStatus(e.target.value)} style={{ width: '100%' }}>
                        <option value="success">Success</option>
                        <option value="failure">Failure</option>
                      </select>
                    </div>
                    {autopayStatus === 'failure' && (
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Reason</label>
                        <input type="text" className="form-input" placeholder="e.g. Insufficient funds" value={autopayReason} onChange={e => setAutopayReason(e.target.value)} required />
                      </div>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={autopaySimulating || !autopayLoanId}>
                    {autopaySimulating ? 'Simulating...' : 'Trigger Auto-Debit Simulation'}
                  </button>
                  {autopayMessage && <p style={{ fontSize: '0.72rem', color: 'var(--color-brand)', textAlign: 'center' }}>{autopayMessage}</p>}
                </form>
              </div>
            )}
          </div>

          {/* Logs / History Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', margin: 0 }}>Live Delivery Logs</h4>
                {notificationLogs.length > 0 && (
                  <button 
                    onClick={handleResetDeliveryLogs} 
                    className="btn btn-secondary btn-sm" 
                    style={{ minHeight: '30px', padding: '4px 10px', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '520px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', flex: 1, marginTop: '12px' }}>
                {notificationLogs.length > 0 ? (
                  notificationLogs.map((log) => (
                    <div key={log._id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(99,102,241,0.08)', color: 'var(--color-brand)', padding: '2px 6px', borderRadius: '4px' }}>
                          {(log.template || 'OUTBOX').replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, background: log.status === 'delivered' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: log.status === 'delivered' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {log.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.4', margin: '6px 0' }}>
                        {log.message}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '6px' }}>
                        <span>To: {log.phone}</span>
                        <span>{new Date(log.sentAt).toLocaleString()}</span>
                      </div>
                      {log.failedReason && (
                        <p style={{ fontSize: '0.68rem', color: 'var(--color-danger)', background: 'rgba(239,68,68,0.04)', padding: '4px 8px', borderRadius: '4px', marginTop: '6px' }}>
                          Reason: {log.failedReason}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                    <HelpCircle size={28} style={{ marginBottom: '8px', display: 'inline-block', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.82rem' }}>No automated alerts dispatched yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          MODAL: Add Loan
      ═══════════════════════════════════════ */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}>
          <div className="glass-panel modal-panel animate-fade-in" style={{ width:'100%', maxWidth:'500px', padding:'30px', background:'var(--bg-secondary)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <h3 style={{ fontSize:'1.25rem', fontWeight:800 }}>Add Active Loan Contract</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddLoan}>
              <div className="form-group"><label className="form-label">Provider Name (Bank)</label><input type="text" className="form-input" placeholder="e.g. HDFC, SBI, Bajaj" value={provider} onChange={e => setProvider(e.target.value)} required/></div>
              <div className="form-group"><label className="form-label">Loan Classification</label>
                <select value={loanType} onChange={e => setLoanType(e.target.value)} style={{ width:'100%' }}>
                  {['Personal Loan','Home Loan','Vehicle Loan','Education Loan','Credit Card EMI','BNPL','Gold Loan','Business Loan','Other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <div className="form-group"><label className="form-label">Principal ({getGeoConfig(user?.geo || 'IN').symbol})</label><input type="number" className="form-input" placeholder="e.g. 1500000" value={principal} onChange={e => setPrincipal(e.target.value)} required min={1}/></div>
                <div className="form-group"><label className="form-label">Interest Rate (% p.a.)</label><input type="number" step="0.01" className="form-input" placeholder="e.g. 8.5" value={interestRate} onChange={e => setInterestRate(e.target.value)} required min={0.1}/></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <div className="form-group"><label className="form-label">Tenure (Months)</label><input type="number" className="form-input" placeholder="e.g. 180" value={tenure} onChange={e => setTenure(e.target.value)} required min={1}/></div>
                <div className="form-group"><label className="form-label">Next Due Date</label><input type="date" className="form-input" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} required/></div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', padding:'12px', marginTop:'14px' }} disabled={formLoading}>{formLoading ? 'Adding Record...' : 'Confirm Loan Details'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL: Upload Statement
      ═══════════════════════════════════════ */}
      {isUploadModalOpen && (
        <div className="modal-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}>
          <div className="glass-panel modal-panel animate-fade-in" style={{ width:'100%', maxWidth:'440px', padding:'30px', background:'var(--bg-secondary)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'1.2rem', fontWeight:800 }}>Upload Statement / Alert Text</h3>
              <button onClick={() => { setIsUploadModalOpen(false); setUploadFile(null); }} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer' }}><X size={20}/></button>
            </div>
            <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'20px' }}>Select any statement file (PDF, Image, CSV, Text). Our Gemini Multimodal AI parser will extract loan details automatically.</p>
            <form onSubmit={handleUploadStatement}>
              <div className="form-group" style={{ marginBottom:'24px' }}>
                <label className="form-label">Select Statement / Document File</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.csv" className="form-input" onChange={e => setUploadFile(e.target.files[0])} required/>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', padding:'12px' }} disabled={uploadLoading || !uploadFile}>
                <Sparkles size={16}/> {uploadLoading ? 'AI Analysis in Progress...' : 'Parse with Gemini AI'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL: SMS / GPay Payment Detection
          Dual-Engine: Local regex + Gemini AI
      ═══════════════════════════════════════ */}
      {isSmsModalOpen && (
        <div className="modal-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}>
          <div className="glass-panel modal-panel animate-fade-in" style={{ width:'100%', maxWidth:'560px', padding:'30px', background:'var(--bg-secondary)', maxHeight:'92vh', overflowY:'auto' }}>

            {/* Modal header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
              <h3 style={{ fontSize:'1.2rem', fontWeight:800, display:'flex', alignItems:'center', gap:'8px' }}>
                <Smartphone size={20} color="var(--color-warning)"/> SMS / GPay Payment Detector
              </h3>
              <button onClick={closeSmsModal} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer' }}><X size={20}/></button>
            </div>
            <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'18px' }}>
              Paste a GPay / UPI / bank SMS below. The <strong style={{ color:'var(--color-brand)' }}>Local</strong> engine runs instantly; the <strong style={{ color:'var(--color-warning)' }}>AI engine</strong> (Gemini) runs after a short delay for higher accuracy.
            </p>

            {/* Clipboard button */}
            <button onClick={handleReadClipboard} className="btn btn-secondary" style={{ width:'100%', marginBottom:'14px', borderColor:'rgba(245,158,11,0.3)', color:'var(--color-warning)' }} disabled={clipboardLoading}>
              <Clipboard size={16}/> {clipboardLoading ? 'Reading clipboard...' : 'Auto-Read Clipboard'}
            </button>

            {/* Textarea */}
            <div className="form-group" style={{ marginBottom:'14px' }}>
              <label className="form-label">Paste SMS / Notification Text</label>
              <textarea className="form-input" rows={4}
                placeholder={'Example:\n"Dear Customer, EMI of Rs.12,450 for your HDFC Home Loan debited on 24-May-2026. Ref: HDFC1234567"'}
                value={smsText} onChange={e => handleSmsTextChange(e.target.value)}
                style={{ resize:'vertical', fontFamily:'monospace', fontSize:'0.85rem', lineHeight:'1.6' }}
              />
            </div>

            {/* Engine toggle + status */}
            {smsText.length > 15 && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Engine:</span>
                <button
                  onClick={() => { setActiveEngine('local'); setSmsMatchedLoan(matchLoan(parsedSms, loans)); }}
                  className="btn btn-sm"
                  style={{ background: activeEngine==='local' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border:`1px solid ${activeEngine==='local' ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`, color: activeEngine==='local' ? 'var(--color-brand)' : 'var(--text-secondary)', minHeight:'30px' }}
                >
                  <Zap size={12}/> Local
                </button>
                <button
                  onClick={() => { if (aiParsed) { setActiveEngine('ai'); setSmsMatchedLoan(matchLoan(aiParsed, loans)); } }}
                  className="btn btn-sm"
                  disabled={!aiParsed && !aiLoading}
                  style={{ background: activeEngine==='ai' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)', border:`1px solid ${activeEngine==='ai' ? 'rgba(245,158,11,0.35)' : 'var(--border-color)'}`, color: activeEngine==='ai' ? 'var(--color-warning)' : 'var(--text-secondary)', minHeight:'30px' }}
                >
                  {aiLoading ? <RefreshCw size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Sparkles size={12}/>} {aiLoading ? 'AI Processing...' : aiParsed ? 'AI Enhanced' : 'AI Pending'}
                </button>
                {aiParsed && activeEngine === 'ai' && (
                  <span style={{ fontSize:'0.72rem', color:'var(--color-warning)', fontWeight:600 }}>Gemini AI active</span>
                )}
              </div>
            )}

            {/* Parse results */}
            {activeParsed && smsText.length > 15 && (
              <div className="animate-fade-in">

                {/* Security flags — show prominently if any danger flags */}
                {activeParsed.securityFlags?.length > 0 && (
                  <div style={{ marginBottom:'14px', display:'flex', flexDirection:'column', gap:'6px' }}>
                    {activeParsed.securityFlags.map(flag => {
                      const m = FLAG_META[flag] || { icon:'ℹ️', label:flag, danger:false };
                      return (
                        <div key={flag} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', borderRadius:'8px', background: m.danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)', border:`1px solid ${m.danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                          <span style={{ fontSize:'1rem' }}>{m.icon}</span>
                          <span style={{ fontSize:'0.8rem', fontWeight:600, color: m.danger ? 'var(--color-danger)' : 'var(--text-secondary)' }}>{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Only show extraction details if relevant */}
                {activeParsed.isRelevant && (
                  <>
                    {/* Confidence + relevance header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', flexWrap:'wrap', gap:'8px' }}>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        <span className={`confidence-badge ${confClass(activeParsed.confidence)}`}>
                          {activeParsed.confidence}% — {confLabel(activeParsed.confidence)}
                        </span>
                        {activeParsed.isEMIRelated && (
                          <span className="confidence-badge confidence-high"><CreditCard size={10}/> EMI Payment</span>
                        )}
                        {activeParsed.isRecurringPattern && (
                          <span className="confidence-badge confidence-medium"><Repeat size={10}/> Recurring</span>
                        )}
                      </div>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase' }}>
                        {activeParsed.channel} · {TX_TYPE_LABEL[activeParsed.transactionType] || activeParsed.transactionType}
                      </span>
                    </div>

                    {/* Parsed fields grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' }}>
                      {[
                        { label:'Amount', value: activeParsed.amount ? `₹${activeParsed.amount.toLocaleString('en-IN')}` : null, color:'var(--color-success)' },
                        { label:'Provider / Bank', value: activeParsed.provider || activeParsed.merchantOrBank, color:'var(--text-primary)' },
                        { label:'Loan Type', value: activeParsed.loanType, color:'var(--color-brand)' },
                        { label:'Payment Status', value: activeParsed.paymentStatus, color: STATUS_COLOR[activeParsed.paymentStatus] },
                        { label:'Date', value: activeParsed.paymentDate, color:'var(--text-primary)' },
                        { label:'Acct Ending', value: activeParsed.accountEnding, color:'var(--text-secondary)' },
                        { label:'Ref ID (masked)', value: activeParsed.referenceIdMasked, color:'var(--color-brand)' },
                        { label:'Tx Type', value: TX_TYPE_LABEL[activeParsed.transactionType], color: TX_TYPE_COLOR[activeParsed.transactionType] || 'var(--text-secondary)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="sms-field">
                          <div className="sms-field-label">{label}</div>
                          <div className="sms-field-value" style={{ color: value ? color : 'var(--text-muted)', fontSize:'0.85rem' }}>
                            {value || 'Not detected'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI explanation */}
                    {activeParsed.explanation && (
                      <div style={{ display:'flex', gap:'8px', padding:'10px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border-color)', borderRadius:'8px', marginBottom:'14px' }}>
                        <Activity size={14} style={{ color:'var(--text-muted)', flexShrink:0, marginTop:'1px' }}/>
                        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:'1.5' }}>{activeParsed.explanation}</p>
                      </div>
                    )}

                    {/* Matched loan */}
                    {smsMatchedLoan ? (
                      <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'10px', padding:'14px', marginBottom:'14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                          <CheckCircle2 size={16} color="var(--color-success)"/>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--color-success)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Loan Matched</span>
                        </div>
                        <p style={{ fontWeight:700, fontSize:'0.95rem' }}>{smsMatchedLoan.provider} — {smsMatchedLoan.loanType}</p>
                        <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginTop:'2px' }}>
                          EMI: ₹{smsMatchedLoan.emiAmount.toLocaleString('en-IN')}/mo &nbsp;·&nbsp; Balance: ₹{smsMatchedLoan.outstandingBalance.toLocaleString('en-IN')}
                        </p>
                      </div>
                    ) : (
                      <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'10px', padding:'12px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                        <AlertCircle size={16} color="var(--color-warning)"/>
                        <p style={{ fontSize:'0.83rem', color:'var(--color-warning)' }}>No loan matched. Ensure the bank name in the SMS matches a loan in your portfolio.</p>
                      </div>
                    )}

                    {/* ── Stage-2 Validation Panel ── */}
                    {smsMatchedLoan && activeParsed.amount && (
                      <div className={`validation-panel validation-panel-${validation?.riskLevel || 'medium'}`}>

                        {/* Validation header row */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', flexWrap:'wrap', gap:'8px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <Shield size={15} style={{ color: validation?.riskLevel === 'low' ? 'var(--color-success)' : validation?.riskLevel === 'high' ? 'var(--color-danger)' : 'var(--color-warning)', flexShrink:0 }}/>
                            <span style={{ fontSize:'0.78rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-secondary)' }}>Payment Validation</span>
                          </div>
                          {validationLoading ? (
                            <span style={{ fontSize:'0.75rem', color:'var(--color-brand)', display:'flex', alignItems:'center', gap:'5px' }}>
                              <RefreshCw size={11} style={{ animation:'spin 1s linear infinite' }}/> AI validating...
                            </span>
                          ) : validation ? (
                            <span className={`risk-badge risk-${validation.riskLevel}`}>
                              {validation.riskLevel === 'low' ? '✓ Low Risk' : validation.riskLevel === 'high' ? '⚠ High Risk' : '~ Medium Risk'}
                            </span>
                          ) : (
                            <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Validating...</span>
                          )}
                        </div>

                        {/* AI recommendation */}
                        {validation?.recommendation && (
                          <p style={{ fontSize:'0.82rem', lineHeight:'1.55', color:'var(--text-secondary)', marginBottom:'12px', fontStyle:'italic', borderLeft:'2px solid var(--border-color)', paddingLeft:'10px' }}>
                            {validation.recommendation}
                          </p>
                        )}

                        {/* Metric chips */}
                        {validation && (
                          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px' }}>
                            <div style={{ flex:'1 1 100px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-color)', borderRadius:'8px', padding:'9px 12px', textAlign:'center' }}>
                              <p style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'3px' }}>Loan Confidence</p>
                              <p style={{ fontSize:'1rem', fontWeight:800, color: validation.linkedLoanConfidence >= 60 ? 'var(--color-success)' : validation.linkedLoanConfidence >= 35 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                                {validation.linkedLoanConfidence}%
                              </p>
                            </div>
                            <div style={{ flex:'1 1 120px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-color)', borderRadius:'8px', padding:'9px 12px', textAlign:'center' }}>
                              <p style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'3px' }}>Next Action</p>
                              <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.03em', color: ['confirm_payment','mark_as_paid'].includes(validation.nextAction) ? 'var(--color-success)' : validation.nextAction === 'reject_payment' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                                {(validation.nextAction || '').replace(/_/g,' ')}
                              </p>
                            </div>
                            <div style={{ flex:'1 1 100px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-color)', borderRadius:'8px', padding:'9px 12px', textAlign:'center' }}>
                              <p style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'3px' }}>Manual Review</p>
                              <p style={{ fontSize:'0.82rem', fontWeight:700, color: validation.manualReviewRequired ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                {validation.manualReviewRequired ? 'Required' : 'Not needed'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Action: reject vs confirm */}
                        {validation?.nextAction === 'reject_payment' ? (
                          <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', display:'flex', alignItems:'center', gap:'8px', color:'var(--color-danger)', fontSize:'0.82rem', fontWeight:600 }}>
                            <ShieldAlert size={15}/> Payment rejected by validation engine. Do not confirm.
                          </div>
                        ) : (
                          <button
                            onClick={handleConfirmSmsPayment}
                            className="btn btn-primary"
                            style={{ width:'100%', opacity: (validation?.manualReviewRequired && !validation?.validated) ? 0.8 : 1 }}
                            disabled={smsConfirming}
                          >
                            <CheckCircle2 size={16}/>
                            {smsConfirming ? 'Recording Payment...' : (
                              validation?.manualReviewRequired && !validation?.validated
                                ? `Confirm Anyway (Review Advised) — ₹${activeParsed.amount.toLocaleString('en-IN')}`
                                : `Confirm Payment of ₹${activeParsed.amount.toLocaleString('en-IN')} → ${smsMatchedLoan.provider}`
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {!activeParsed.isRelevant && !activeParsed.securityFlags?.some(f => ['otp_detected','suspicious_phishing'].includes(f)) && (
                  <div style={{ textAlign:'center', padding:'16px', color:'var(--text-muted)', fontSize:'0.88rem' }}>
                    This text doesn't appear to be a financial payment notification.
                  </div>
                )}
              </div>
            )}

            {/* Payment confirmation result */}
            {smsResult && (
              <div className="animate-fade-in" style={{ marginTop:'14px', padding:'12px 16px', borderRadius:'10px', background: smsResult.type==='success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${smsResult.type==='success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: smsResult.type==='success' ? 'var(--color-success)' : 'var(--color-danger)', fontWeight:600, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:'8px' }}>
                {smsResult.type==='success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                {smsResult.message}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
