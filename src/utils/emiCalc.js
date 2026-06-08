/**
 * Client-side EMI and Amortization schedule calculations.
 */

export const calculateEMI = (principal, annualRate, tenureMonths) => {
  if (!principal || !tenureMonths) return 0;
  if (!annualRate) return Number((principal / tenureMonths).toFixed(2));

  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  return Number(emi.toFixed(2));
};

export const getAmortizationSchedule = (principal, annualRate, tenureMonths) => {
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = annualRate / 12 / 100;
  
  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= tenureMonths; month++) {
    if (balance <= 0) break;
    
    const interestPaid = Number((balance * monthlyRate).toFixed(2));
    let principalPaid = Number((emi - interestPaid).toFixed(2));
    
    if (principalPaid > balance) {
      principalPaid = balance;
    }
    
    balance = Number((balance - principalPaid).toFixed(2));
    if (balance < 0) balance = 0;

    schedule.push({
      month,
      emi,
      interestPaid,
      principalPaid,
      remainingBalance: balance,
    });
  }

  return schedule;
};
