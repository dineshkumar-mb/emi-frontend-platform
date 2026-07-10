/**
 * Excel Export Utility — SheetJS (xlsx)
 * Generates a multi-sheet .xlsx workbook from the EMI portfolio data.
 */
import * as XLSX from 'xlsx';
import { getAmortizationSchedule } from './emiCalc';

const currencyFmt = (val) =>
  typeof val === 'number' ? `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : val;

/**
 * Build Sheet 1: Portfolio Summary
 */
function buildPortfolioSheet(loans) {
  const headers = [
    'Provider', 'Loan Type', 'Principal (₹)', 'Interest Rate (%)',
    'Tenure (Months)', 'EMI / Month (₹)', 'Outstanding Balance (₹)',
    'Next Due Date', 'Status',
  ];

  const rows = loans.map((l) => [
    l.provider,
    l.loanType,
    l.principal,
    l.interestRate,
    l.tenure,
    l.emiAmount,
    l.outstandingBalance,
    l.nextDueDate ? new Date(l.nextDueDate).toLocaleDateString('en-IN') : 'N/A',
    l.status || 'Active',
  ]);

  // Totals row
  const totalEmi = loans.reduce((s, l) => s + l.emiAmount, 0);
  const totalBalance = loans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalsRow = ['TOTAL', '', '', '', '', totalEmi, totalBalance, '', ''];

  const data = [headers, ...rows, [], totalsRow];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column widths
  ws['!cols'] = [
    { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 20 }, { wch: 24 }, { wch: 18 }, { wch: 12 },
  ];

  return ws;
}

/**
 * Build Sheet 2: Full Amortization Schedules (all loans, stacked)
 */
function buildAmortizationSheet(loans, payments = []) {
  const allRows = [];

  loans.forEach((loan, idx) => {
    if (idx > 0) allRows.push([]); // blank separator row

    // Loan header block
    allRows.push([`LOAN: ${loan.provider} — ${loan.loanType}`]);
    allRows.push([
      `Principal: ₹${loan.principal.toLocaleString('en-IN')}`,
      `Rate: ${loan.interestRate}% p.a.`,
      `Tenure: ${loan.tenure} months`,
      `EMI: ₹${loan.emiAmount.toLocaleString('en-IN')}/mo`,
    ]);
    allRows.push([]); // blank

    // Table headers
    allRows.push(['Month', 'EMI Payment (₹)', 'Principal Paid (₹)', 'Interest Paid (₹)', 'Remaining Balance (₹)']);

    // Find actual payments for this loan
    const loanPayments = payments
      .filter((p) => {
        const id = p.loanId?._id || p.loanId;
        return id && id.toString() === loan._id.toString();
      })
      .sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

    // 1. Output the actual payments made
    loanPayments.forEach((p, pIdx) => {
      allRows.push([
        pIdx + 1,
        p.emiAmount || p.amount || loan.emiAmount,
        typeof p.principalPaid === 'number' ? Number(p.principalPaid.toFixed(2)) : 0,
        typeof p.interestPaid === 'number' ? Number(p.interestPaid.toFixed(2)) : 0,
        typeof p.outstandingBalance === 'number' ? Number(p.outstandingBalance.toFixed(2)) : 0,
      ]);
    });

    // 2. Generate the remaining theoretical schedule starting from the last actual balance
    let balance = loanPayments.length > 0 
      ? loanPayments[loanPayments.length - 1].outstandingBalance 
      : loan.principal;

    const monthlyRate = loan.interestRate / 12 / 100;
    const emi = loan.emiAmount;

    for (let month = loanPayments.length + 1; month <= loan.tenure; month++) {
      if (balance <= 0) break;
      const interestPaid = Number((balance * monthlyRate).toFixed(2));
      let principalPaid = Number((emi - interestPaid).toFixed(2));
      if (principalPaid > balance) {
        principalPaid = balance;
      }
      balance = Number((balance - principalPaid).toFixed(2));
      if (balance < 0) balance = 0;

      allRows.push([month, emi, principalPaid, interestPaid, balance]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  ws['!cols'] = [
    { wch: 10 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 26 },
  ];
  return ws;
}

/**
 * Build Sheet 3: Payment History
 */
function buildPaymentHistorySheet(loans, payments = []) {
  // If we have detailed payments (LoanPayment documents from API)
  if (payments && payments.length > 0) {
    const headers = [
      'Provider',
      'Loan Type',
      'EMI No.',
      'Amount Paid (₹)',
      'Principal Paid (₹)',
      'Interest Paid (₹)',
      'Remaining Balance (₹)',
      'Date',
      'Reference ID',
      'Source',
      'Status'
    ];

    const rows = payments.map((p) => {
      const provider = p.loanId?.provider || 'Unknown';
      const loanType = p.loanId?.loanType || 'Unknown';

      return [
        provider,
        loanType,
        p.emiNumber || '—',
        p.emiAmount || p.amount || 0,
        typeof p.principalPaid === 'number' ? Number(p.principalPaid.toFixed(2)) : '—',
        typeof p.interestPaid === 'number' ? Number(p.interestPaid.toFixed(2)) : '—',
        typeof p.outstandingBalance === 'number' ? Number(p.outstandingBalance.toFixed(2)) : '—',
        p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : 'N/A',
        p.transactionId || p.refId || '—',
        p.source || 'Manual',
        p.paymentStatus || 'success',
      ];
    });

    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 20 },
      { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 12 }
    ];
    return ws;
  }

  // Fallback to basic paymentHistory from the loan models if detailed payments are not available
  const headers = ['Provider', 'Amount Paid (₹)', 'Date', 'Reference ID', 'Source'];
  const rows = [];

  loans.forEach((loan) => {
    const history = loan.paymentHistory || [];
    history.forEach((p) => {
      rows.push([
        loan.provider,
        p.amount,
        p.date ? new Date(p.date).toLocaleDateString('en-IN') : 'N/A',
        p.refId || '—',
        p.source || 'Manual',
      ]);
    });
  });

  if (rows.length === 0) {
    rows.push(['No payment history recorded yet', '', '', '', '']);
  }

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 14 }];
  return ws;
}

/**
 * Main export function — triggers browser download of .xlsx
 * @param {Array} loans - Array of loan objects from API
 * @param {string} [filename] - Optional custom filename
 * @param {Array} [payments] - Detailed payments history from API
 */
export function exportToExcel(loans, filename, payments = []) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildPortfolioSheet(loans), 'Portfolio Summary');
  XLSX.utils.book_append_sheet(wb, buildAmortizationSheet(loans), 'Amortization Schedules');
  XLSX.utils.book_append_sheet(wb, buildPaymentHistorySheet(loans, payments), 'Payment History');

  const date = new Date().toISOString().split('T')[0];
  const name = filename || `emi-portfolio-${date}.xlsx`;

  XLSX.writeFile(wb, name);
}

/**
 * Export a single amortization schedule (for the EMI Calculator page)
 * @param {object} params - { principal, interestRate, tenure, emi, totalInterest, totalRepayment }
 */
export function exportSingleSchedule(params) {
  const { principal, interestRate, tenure, emi, totalInterest, totalRepayment } = params;
  const wb = XLSX.utils.book_new();

  const schedule = getAmortizationSchedule(principal, interestRate, tenure);

  const summaryRows = [
    ['EMI Calculation Summary'],
    [],
    ['Principal Amount', `₹${principal.toLocaleString('en-IN')}`],
    ['Interest Rate', `${interestRate}% p.a.`],
    ['Tenure', `${tenure} months`],
    ['Monthly EMI', `₹${emi.toFixed(2)}`],
    ['Total Interest', `₹${totalInterest.toFixed(2)}`],
    ['Total Repayment', `₹${totalRepayment.toFixed(2)}`],
    [],
    ['Month', 'EMI Payment (₹)', 'Principal Paid (₹)', 'Interest Paid (₹)', 'Remaining Balance (₹)'],
    ...schedule.map((r) => [r.month, r.emi, r.principalPaid, r.interestPaid, r.remainingBalance]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryRows);
  ws['!cols'] = [{ wch: 10 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 26 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Amortization Schedule');

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `emi-schedule-${date}.xlsx`);
}
