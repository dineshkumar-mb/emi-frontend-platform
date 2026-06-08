/**
 * Local Payment Validation Engine (Stage-2 Fallback)
 * 
 * Runs entirely client-side when the Gemini backend is unavailable.
 * Operates ONLY on already-structured, redacted parse output — never raw SMS text.
 */

const CRITICAL_FLAGS  = new Set(['otp_detected', 'pin_detected', 'cvv_detected', 'suspicious_phishing', 'contains_full_sensitive_id']);
const NOISE_FLAGS     = new Set(['low_signal', 'ambiguous_source']);

const NEXT_ACTION_MAP = {
  low:    'confirm_payment',
  medium: 'flag_for_review',
  high:   'reject_payment',
};

/**
 * Compute provider name similarity score (0–60 points).
 */
function providerMatchScore(parsedProvider, loanProvider) {
  if (!parsedProvider || !loanProvider) return 0;
  const a = parsedProvider.toLowerCase().trim();
  const b = loanProvider.toLowerCase().trim();
  if (a === b) return 60;
  if (a.includes(b) || b.includes(a)) return 55;
  // Check if first token matches (e.g. "HDFC" in "HDFC Bank Limited")
  const aToken = a.split(/\s+/)[0];
  const bToken = b.split(/\s+/)[0];
  if (aToken === bToken) return 45;
  return 0;
}

/**
 * Compute amount proximity score (0–40 points).
 */
function amountMatchScore(parsed, expected) {
  if (!parsed || !expected) return 0;
  const deviation = Math.abs(parsed - expected) / expected;
  if (deviation <= 0.03)  return 40; // within 3%
  if (deviation <= 0.05)  return 32; // within 5%
  if (deviation <= 0.08)  return 20; // within 8%
  if (deviation <= 0.15)  return 10; // within 15%
  return 0;
}

/**
 * Determine risk level from all signals.
 */
function computeRiskLevel(parsedPayment, matchedLoan) {
  const { securityFlags = [], confidence, amount, paymentStatus, isEMIRelated } = parsedPayment;
  const { emiAmount } = matchedLoan;

  // Critical flags → always HIGH
  if (securityFlags.some(f => CRITICAL_FLAGS.has(f))) return 'high';

  // Spoofed / unverified source
  if (!isEMIRelated && parsedPayment.transactionType === 'upi') return 'medium';

  // Amount deviation
  if (amount && emiAmount) {
    const dev = Math.abs(amount - emiAmount) / emiAmount;
    if (dev > 0.20) return 'high';
    if (dev > 0.08) return 'medium';
  }

  // Low confidence
  if (confidence < 35) return 'high';
  if (confidence < 60) return 'medium';

  // Status check
  if (paymentStatus === 'failed' || paymentStatus === 'reversed') return 'medium';

  // Only noise flags remain
  const realFlags = securityFlags.filter(f => !NOISE_FLAGS.has(f));
  if (realFlags.length > 0) return 'medium';

  return 'low';
}

/**
 * Build a concise, non-sensitive recommendation string.
 */
function buildRecommendation(riskLevel, parsedPayment, matchedLoan, linkedConf) {
  const { paymentStatus, isEMIRelated, isRecurringPattern, securityFlags = [] } = parsedPayment;
  const { loanType } = matchedLoan;

  if (securityFlags.includes('suspicious_phishing')) {
    return 'Potential phishing attempt detected. Do not confirm this payment — verify through official banking channels.';
  }
  if (securityFlags.includes('otp_detected')) {
    return 'This message contains an OTP. It is not a payment confirmation — no action needed.';
  }
  if (riskLevel === 'high') {
    return `High-risk payment signal detected. Manual verification is required before marking ${loanType || 'this loan'} as paid.`;
  }
  if (riskLevel === 'medium') {
    if (paymentStatus === 'failed') return 'Payment appears to have failed. Check with your bank before marking EMI as paid.';
    if (!isRecurringPattern)       return 'Non-recurring payment detected. Verify this is a genuine EMI before confirming.';
    if (linkedConf < 55)           return 'Loan match is uncertain. Confirm the provider manually before recording this payment.';
    return 'Payment is plausible but requires brief manual verification before confirmation.';
  }
  // Low risk
  if (isEMIRelated) return `EMI payment confirmed with high confidence. Safe to record against ${loanType || 'loan'}.`;
  return 'Payment detected. Confirm it is EMI-related before updating your loan balance.';
}

/**
 * Main local validation function.
 * 
 * @param {object} parsedPayment - Full output from parseSmsText() or Gemini SMS parser
 * @param {object} matchedLoan   - The matched loan object from the portfolio
 * @param {string} engineUsed    - "local" | "ai"
 * @returns {object} - Full validation schema output
 */
export function validatePaymentLocally(parsedPayment, matchedLoan, engineUsed = 'local') {
  // Guard: missing inputs
  if (!parsedPayment || !matchedLoan) {
    return {
      validated: false,
      riskLevel: 'high',
      linkedLoanConfidence: 0,
      recommendation: 'Validation payload is incomplete. Cannot proceed safely.',
      nextAction: 'reject_payment',
      manualReviewRequired: true,
    };
  }

  const { securityFlags = [], confidence, paymentStatus, isEMIRelated, amount } = parsedPayment;
  const provider = parsedPayment.provider || parsedPayment.merchantOrBank;

  // Compute linked loan confidence (0–100)
  const provScore   = providerMatchScore(provider, matchedLoan.provider);
  const amtScore    = amountMatchScore(amount, matchedLoan.emiAmount);
  const linkedConf  = Math.min(100, provScore + amtScore);

  // Risk level
  const riskLevel = computeRiskLevel(parsedPayment, matchedLoan);

  // Validated: only true if all green signals align
  const criticalFlagsPresent = securityFlags.some(f => CRITICAL_FLAGS.has(f));
  const validated = (
    !criticalFlagsPresent &&
    isEMIRelated === true &&
    (paymentStatus === 'success' || paymentStatus === 'unknown') &&
    confidence >= 55 &&
    linkedConf >= 40 &&
    riskLevel !== 'high'
  );

  const manualReviewRequired = riskLevel === 'high' || !validated || linkedConf < 40;

  const recommendation = buildRecommendation(riskLevel, parsedPayment, matchedLoan, linkedConf);

  const nextAction = manualReviewRequired
    ? (riskLevel === 'high' ? 'reject_payment' : 'flag_for_review')
    : (validated ? 'confirm_payment' : 'flag_for_review');

  return {
    validated,
    riskLevel,
    linkedLoanConfidence: linkedConf,
    recommendation,
    nextAction,
    manualReviewRequired,
  };
}
