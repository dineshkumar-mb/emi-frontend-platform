/**
 * Security-First Financial Intelligence SMS Parser
 * Implements the full structured output schema with security flag detection.
 * 
 * This is the LOCAL (offline) engine — instant results.
 * For AI-enhanced accuracy, the backend Gemini engine is called in parallel.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

const BANK_KEYWORDS = [
  'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes bank', 'pnb', 'bob',
  'canara', 'indusind', 'rbl', 'federal', 'idfc', 'bajaj', 'tata',
  'lic', 'piramal', 'aditya birla', 'muthoot', 'manappuram',
  'home credit', 'fullerton', 'capital first', 'citi', 'standard chartered',
  'barclays', 'idbi', 'uco', 'union bank', 'indian bank', 'central bank',
  'bandhan', 'au small', 'equitas', 'ujjivan', 'jana', 'suryoday',
];

const UPI_PROVIDERS = ['gpay', 'google pay', 'phonepe', 'paytm', 'bhim', 'amazon pay', 'slice', 'cred'];

const LOAN_TYPE_MAP = {
  'home loan': 'Home Loan', 'housing loan': 'Home Loan', 'mortgage': 'Home Loan',
  'vehicle loan': 'Vehicle Loan', 'car loan': 'Vehicle Loan', 'auto loan': 'Vehicle Loan', 'bike loan': 'Vehicle Loan',
  'education loan': 'Education Loan', 'student loan': 'Education Loan',
  'personal loan': 'Personal Loan',
  'credit card emi': 'Credit Card EMI', 'cc emi': 'Credit Card EMI', 'card emi': 'Credit Card EMI',
  'gold loan': 'Gold Loan',
  'business loan': 'Business Loan', 'msme loan': 'Business Loan',
  'bnpl': 'BNPL', 'buy now pay later': 'BNPL',
};

const NON_RELEVANT_PATTERNS = [
  /\bOTP\b/i,
  /\bone.?time.?password\b/i,
  /your\s+\d{4,8}\s+is\s+your/i,
  /\bdelivery\b.*\border\b/i,
  /\bcashback\b/i,
  /\brecharge\b/i,
  /\blogin\b.*\balert\b/i,
  /\bverification\s+code\b/i,
  /\bwelcome\s+offer\b/i,
];

// ── Security Detection ─────────────────────────────────────────────────────────

/** Detect OTP patterns: standalone 4-8 digit numbers near OTP/code/password keywords */
function detectOTP(text) {
  return /\b(?:otp|one.?time|verification|passcode)\b[^.]*\b(\d{4,8})\b/i.test(text) ||
         /\b(\d{4,8})\b[^.]*\b(?:otp|code|password|pin)\b/i.test(text);
}

/** Detect explicit PIN mention */
function detectPIN(text) {
  return /\b(?:upi|atm|debit|credit|card)\s*pin\b/i.test(text) ||
         /\benter\s+(?:your\s+)?pin\b/i.test(text);
}

/** Detect CVV mention */
function detectCVV(text) {
  return /\bcvv\b|\bcvc\b|\bcard\s+verification\b/i.test(text);
}

/** Detect phishing indicators */
function detectPhishing(text) {
  return /click\s+(?:here|this\s+link)|verify\s+your\s+account|share\s+your|send\s+your\s+otp|confirm\s+your\s+details|urgent.*account|blocked.*click/i.test(text);
}

/** Detect full sensitive identifiers (full card/account numbers) */
function detectFullSensitiveId(text) {
  // 16-digit card number pattern or 9-18 digit account numbers without masking
  return /\b\d{16}\b/.test(text) || /account\s+(?:number|no\.?)\s*:?\s*\d{9,18}\b/i.test(text);
}

function buildSecurityFlags(text) {
  const flags = [];
  if (detectOTP(text)) flags.push('otp_detected');
  if (detectPIN(text)) flags.push('pin_detected');
  if (detectCVV(text)) flags.push('cvv_detected');
  if (detectPhishing(text)) flags.push('suspicious_phishing');
  if (detectFullSensitiveId(text)) flags.push('contains_full_sensitive_id');
  return flags;
}

// ── Field Extractors ───────────────────────────────────────────────────────────

function extractAmount(text) {
  const patterns = [
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)/i,
    /(?:amount|amt)[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /debited[^.]*?(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /paid[^.]*?(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:debited|paid|deducted|processed)/i,
  ];

  let best = null;
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const v = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(v) && v >= 100 && v <= 100000000) {
        if (!best || v < best) best = v; // prefer smaller (more likely EMI vs principal)
      }
    }
  }
  return best;
}

function extractProvider(text) {
  const lower = text.toLowerCase();
  // Check UPI apps first
  for (const u of UPI_PROVIDERS) {
    if (lower.includes(u)) return { provider: u.replace(/\b\w/g, c => c.toUpperCase()), isUpi: true };
  }
  // Then banks
  for (const bank of BANK_KEYWORDS) {
    if (lower.includes(bank)) return { provider: bank.replace(/\b\w/g, c => c.toUpperCase()), isUpi: false };
  }
  return { provider: null, isUpi: false };
}

function extractLoanType(text) {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(LOAN_TYPE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function extractMaskedAccount(text) {
  // Matches patterns like: XX1234, xxxx1234, ending 1234, a/c ending 5678
  const patterns = [
    /(?:a\/c|acct?|account)\s*(?:no\.?|number|ending|#)?\s*(?:xx+|[*]+)?(\d{3,6})\b/i,
    /(?:xx|[*]){2,}(\d{3,6})\b/,
    /ending\s+(?:in\s+)?(\d{3,6})\b/i,
    /(?:card|debit|credit)\s+(?:no\.?\s+)?(?:xx|[*])+(\d{4})\b/i,
    /\bA\/c\s+[Xx]+(\d{3,4})\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return `XX${m[1]}`;
  }
  return null;
}

function extractRefId(text) {
  const patterns = [
    /(?:ref(?:erence)?(?:\s*(?:no\.?|id|#))?\s*:?\s*)([A-Z0-9]{6,22})/i,
    /(?:txn|transaction)(?:\s*(?:id|no\.?|#))?\s*:?\s*([A-Z0-9]{6,22})/i,
    /\bUTR\s*:?\s*([A-Z0-9]{6,22})/i,
    /\bRRN\s*:?\s*([A-Z0-9]{6,22})/i,
    /\bOrder\s*(?:id|no\.?)\s*:?\s*([A-Z0-9]{6,22})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      // Mask middle portion for privacy
      const id = m[1];
      if (id.length > 6) {
        return id.slice(0, 3) + '****' + id.slice(-3);
      }
      return id;
    }
  }
  return null;
}

function extractDate(text) {
  const patterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{2,4})/i,
    /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/,
    /(?:on\s+)(\d{1,2}[\-\/]\w+[\-\/]\d{2,4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

function classifyTransactionType(text, isUpi, isEmiRelated) {
  const lower = text.toLowerCase();
  if (/auto.?(?:debit|pay|payment)/i.test(text)) return 'autopay';
  if (/\bemi\b/i.test(text)) return 'loan_payment';
  if (/\brepayment\b|\binstall?ment\b/i.test(text)) return 'loan_payment';
  if (/\bcard\s+emi\b|\bcc\s+emi\b/i.test(text)) return 'card_emi';
  if (/\brefund\b|\breversed\b/i.test(text)) return 'refund';
  if (/\bcredit(?:ed)?\b/i.test(text) && !/debit/i.test(text)) return 'credit';
  if (isUpi) return 'upi';
  if (/\bdebited?\b/i.test(text)) return 'debit';
  if (/\balert\b|\bnotice\b/i.test(text)) return 'bank_alert';
  return 'unknown';
}

function classifyPaymentStatus(text) {
  if (/\bfailed\b|\bfailure\b|\bdeclined\b|\bnot\s+processed\b/i.test(text)) return 'failed';
  if (/\breversed\b|\brefunded\b|\bcancelled\b/i.test(text)) return 'reversed';
  if (/\bpending\b|\binitiating\b|\bin\s+progress\b/i.test(text)) return 'pending';
  if (/\bsuccessful\b|\bsuccessfully\b|\bapproved\b|\bcompleted\b|\bdebited\b|\bpaid\b|\bprocessed\b/i.test(text)) return 'success';
  return 'unknown';
}

function detectChannel(text) {
  // Short texts = SMS; mentions of "notification" = notification
  if (text.length < 300) return 'sms';
  if (/\bnotif(?:ication)?\b/i.test(text)) return 'notification';
  if (/\bstatement\b|\btransaction\s+history\b/i.test(text)) return 'statement';
  return 'sms';
}

function isEmiRelated(text) {
  return /\bemi\b|\binstall?ment\b|\brepayment\b|\bauto.?debit\b|\bloan\s+(?:payment|emi|repayment)\b|\bmonthly\s+(?:installment|payment|emi)\b|\bcard\s+emi\b/i.test(text);
}

function isRecurringPattern(text) {
  return /\bauto.?(?:debit|pay)\b|\bstanding\s+instruction\b|\bsi\s+executed\b|\bmonthly\b.*\bdebited\b|\brecurring\b/i.test(text);
}

function isRelevantText(text) {
  // Check for explicit non-relevant patterns first
  if (NON_RELEVANT_PATTERNS.some(p => p.test(text))) return false;
  // Must have at least one payment or financial signal
  return /\b(?:debited?|paid|payment|credit|debit|transfer|emi|loan|upi|auto.?pay|amount|transaction|repay)\b/i.test(text);
}

function buildConfidence(params) {
  const { amount, provider, refId, date, isEmi, status, securityFlags, text } = params;
  let score = 0;

  if (amount) score += 25;
  if (provider) score += 20;
  if (refId) score += 15;
  if (date) score += 10;
  if (isEmi) score += 15;
  if (status === 'success') score += 10;
  if (/\b(?:hdfc|icici|sbi|axis|kotak)\b/i.test(text)) score += 5; // major bank bonus

  // Deductions
  if (securityFlags.includes('suspicious_phishing')) score = Math.min(score, 20);
  if (securityFlags.includes('otp_detected')) score -= 15;
  if (securityFlags.includes('ambiguous_source')) score -= 10;
  if (!amount && !provider) score = Math.min(score, 15);

  return Math.max(0, Math.min(100, score));
}

function buildExplanation(params) {
  const { isRelevant, isEmi, amount, provider, status, securityFlags, transactionType } = params;
  if (!isRelevant) return 'Text does not appear to be a financial payment notification.';
  if (securityFlags.includes('suspicious_phishing')) return 'WARNING: Possible phishing/spoofed message detected. Do not act on this.';
  if (securityFlags.includes('otp_detected')) return 'OTP message detected — not payment-related. Sensitive info suppressed.';

  const parts = [];
  if (isEmi) parts.push('EMI/loan payment detected');
  else parts.push('Payment transaction detected');
  if (provider) parts.push(`from ${provider}`);
  if (amount) parts.push(`of ₹${amount.toLocaleString('en-IN')}`);
  if (status && status !== 'unknown') parts.push(`(${status})`);
  if (transactionType) parts.push(`[${transactionType}]`);
  return parts.join(' ') + '.';
}

// ── Main Parser ────────────────────────────────────────────────────────────────

/**
 * Parse raw SMS/notification text and return the full structured schema.
 * @param {string} text - Raw input text
 * @returns {SMSParseResult} - Full schema output
 */
export function parseSmsText(text) {
  if (!text || text.trim().length < 8) {
    return {
      isRelevant: false, isEMIRelated: false, channel: 'unknown',
      provider: null, merchantOrBank: null, loanType: null,
      transactionType: 'unknown', amount: null, currency: 'INR',
      paymentStatus: 'unknown', paymentDate: null,
      accountEnding: null, referenceIdMasked: null,
      isRecurringPattern: false, estimatedMonthlyEMI: null,
      confidence: 0, securityFlags: ['low_signal'],
      explanation: 'Input text is too short to analyze.',
    };
  }

  const securityFlags = buildSecurityFlags(text);

  // If OTP or phishing detected — short circuit, suppress details
  if (securityFlags.includes('otp_detected') || securityFlags.includes('suspicious_phishing')) {
    return {
      isRelevant: false, isEMIRelated: false, channel: detectChannel(text),
      provider: null, merchantOrBank: null, loanType: null,
      transactionType: 'unknown', amount: null, currency: 'INR',
      paymentStatus: 'unknown', paymentDate: null,
      accountEnding: null, referenceIdMasked: null,
      isRecurringPattern: false, estimatedMonthlyEMI: null,
      confidence: 5,
      securityFlags,
      explanation: securityFlags.includes('suspicious_phishing')
        ? 'WARNING: Suspicious phishing/spoofed message. Credentials or actions requested. Do not share.'
        : 'OTP message detected. No payment data extracted for security.',
    };
  }

  const relevant = isRelevantText(text);
  if (!relevant) {
    return {
      isRelevant: false, isEMIRelated: false, channel: detectChannel(text),
      provider: null, merchantOrBank: null, loanType: null,
      transactionType: 'unknown', amount: null, currency: 'INR',
      paymentStatus: 'unknown', paymentDate: null,
      accountEnding: null, referenceIdMasked: null,
      isRecurringPattern: false, estimatedMonthlyEMI: null,
      confidence: 0,
      securityFlags: [...securityFlags, 'low_signal'],
      explanation: 'Text does not appear to be a financial payment notification.',
    };
  }

  // Extract all fields
  const amount = extractAmount(text);
  const { provider, isUpi } = extractProvider(text);
  const loanType = extractLoanType(text);
  const accountEnding = extractMaskedAccount(text);
  const referenceIdMasked = extractRefId(text);
  const paymentDate = extractDate(text);
  const emiRelated = isEmiRelated(text);
  const recurring = isRecurringPattern(text);
  const transactionType = classifyTransactionType(text, isUpi, emiRelated);
  const paymentStatus = classifyPaymentStatus(text);
  const channel = detectChannel(text);

  if (!provider && !amount) securityFlags.push('ambiguous_source');

  const confidence = buildConfidence({
    amount, provider, refId: referenceIdMasked, date: paymentDate,
    isEmi: emiRelated, status: paymentStatus, securityFlags, text,
  });

  const explanation = buildExplanation({
    isRelevant: true, isEmi: emiRelated, amount, provider,
    status: paymentStatus, securityFlags, transactionType,
  });

  return {
    isRelevant: true,
    isEMIRelated: emiRelated,
    channel,
    provider: isUpi ? null : provider,
    merchantOrBank: isUpi ? provider : provider,
    loanType,
    transactionType,
    amount,
    currency: 'INR',
    paymentStatus,
    paymentDate,
    accountEnding,
    referenceIdMasked,
    isRecurringPattern: recurring,
    estimatedMonthlyEMI: emiRelated && amount ? amount : null,
    confidence,
    securityFlags,
    explanation,
  };
}

/**
 * Find the best matching loan from portfolio using the full parse result.
 * @param {object} parsed - Full SMSParseResult
 * @param {Array} loans - User's active loans from DB
 * @returns {object|null} - Best matched loan or null
 */
export function matchLoan(parsed, loans) {
  if (!parsed.isRelevant || !loans || loans.length === 0) return null;

  const scored = loans.map((loan) => {
    let score = 0;

    // Provider / bank name match
    const ref = (parsed.provider || parsed.merchantOrBank || '').toLowerCase();
    if (ref && loan.provider) {
      const provLower = loan.provider.toLowerCase();
      if (provLower.includes(ref) || ref.includes(provLower)) score += 60;
    }

    // Loan type match
    if (parsed.loanType && loan.loanType === parsed.loanType) score += 20;

    // Amount proximity to EMI (within 8% tolerance)
    if (parsed.amount && loan.emiAmount) {
      const diff = Math.abs(parsed.amount - loan.emiAmount);
      const pct = diff / loan.emiAmount;
      if (pct <= 0.03) score += 40;
      else if (pct <= 0.08) score += 25;
      else if (pct <= 0.15) score += 10;
    }

    return { loan, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score >= 20 ? scored[0].loan : null;
}
