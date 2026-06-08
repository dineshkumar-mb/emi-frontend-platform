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
function buildAmortizationSheet(loans) {
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

    const schedule = getAmortizationSchedule(loan.principal, loan.interestRate, loan.tenure);
    schedule.forEach((row) => {
      allRows.push([row.month, row.emi, row.principalPaid, row.interestPaid, row.remainingBalance]);
    });
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
function buildPaymentHistorySheet(loans) {
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
 */
export function exportToExcel(loans, filename) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildPortfolioSheet(loans), 'Portfolio Summary');
  XLSX.utils.book_append_sheet(wb, buildAmortizationSheet(loans), 'Amortization Schedules');
  XLSX.utils.book_append_sheet(wb, buildPaymentHistorySheet(loans), 'Payment History');

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
