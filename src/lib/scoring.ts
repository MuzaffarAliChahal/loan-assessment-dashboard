/**
 * Client-side copy of the loan-assessment-api rules. Used by the offline demo mode
 * (so the dashboard works on GitHub Pages without a backend) and covered by unit tests
 * that use the same numbers as the Java API tests.
 */
import type { ApplicationStatus, LoanApplicationRequest, LoanProduct } from './types';

type Outcome = 'PASS' | 'REVIEW' | 'FAIL';
interface RuleResult { rule: string; outcome: Outcome; message: string; penalty: number }

const pct = (v: number) => `${(Math.round(v * 1000) / 10).toFixed(1)}%`;

export function monthlyPayment(principal: number, annualRatePercent: number, termMonths: number): number {
  if (termMonths <= 0) throw new Error('termMonths must be positive');
  if (annualRatePercent === 0) return round2(principal / termMonths);
  const r = annualRatePercent / 1200;
  const growth = Math.pow(1 + r, termMonths);
  return round2((principal * r * growth) / (growth - 1));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function limitsRule(app: LoanApplicationRequest, p: LoanProduct): RuleResult {
  if (app.amount < p.minAmount || app.amount > p.maxAmount) {
    return { rule: 'LIMITS', outcome: 'FAIL', message: `amount must be between ${p.minAmount} and ${p.maxAmount}`, penalty: 50 };
  }
  if (app.termMonths > p.maxTermMonths) {
    return { rule: 'LIMITS', outcome: 'FAIL', message: `term must be ${p.maxTermMonths} months or less`, penalty: 50 };
  }
  return { rule: 'LIMITS', outcome: 'PASS', message: 'amount and term are within product limits', penalty: 0 };
}

function creditRule(app: LoanApplicationRequest): RuleResult {
  const s = app.creditScore;
  if (s >= 700) return { rule: 'CREDIT', outcome: 'PASS', message: `credit score ${s} is 700 or higher`, penalty: 0 };
  if (s >= 620) return { rule: 'CREDIT', outcome: 'REVIEW', message: `credit score ${s} is between 620 and 699`, penalty: 15 };
  return { rule: 'CREDIT', outcome: 'FAIL', message: `credit score ${s} is below 620`, penalty: 40 };
}

function dtiRule(app: LoanApplicationRequest, payment: number): RuleResult {
  const dti = (app.monthlyDebt + payment) / app.monthlyIncome;
  if (dti <= 0.36) return { rule: 'DTI', outcome: 'PASS', message: `debt-to-income ${pct(dti)} is within 36%`, penalty: 0 };
  if (dti <= 0.43) return { rule: 'DTI', outcome: 'REVIEW', message: `debt-to-income ${pct(dti)} is between 36% and 43%`, penalty: 15 };
  return { rule: 'DTI', outcome: 'FAIL', message: `debt-to-income ${pct(dti)} is above 43%`, penalty: 40 };
}

function ltvRule(app: LoanApplicationRequest, p: LoanProduct): RuleResult {
  if (p.maxLtv == null) return { rule: 'LTV', outcome: 'PASS', message: 'unsecured product, no collateral required', penalty: 0 };
  if (!app.propertyValue || app.propertyValue <= 0) {
    return { rule: 'LTV', outcome: 'FAIL', message: `collateral value is required for ${p.code}`, penalty: 50 };
  }
  const ltv = app.amount / app.propertyValue;
  const max = `${Math.round(p.maxLtv * 100)}%`;
  if (ltv <= p.maxLtv) return { rule: 'LTV', outcome: 'PASS', message: `loan-to-value ${pct(ltv)} is within ${max}`, penalty: 0 };
  if (ltv <= p.maxLtv + 0.05) return { rule: 'LTV', outcome: 'REVIEW', message: `loan-to-value ${pct(ltv)} is slightly above ${max}`, penalty: 10 };
  return { rule: 'LTV', outcome: 'FAIL', message: `loan-to-value ${pct(ltv)} is above ${max}`, penalty: 30 };
}

export function assess(app: LoanApplicationRequest, product: LoanProduct) {
  const payment = monthlyPayment(app.amount, product.annualRate, app.termMonths);
  const results = [limitsRule(app, product), creditRule(app), dtiRule(app, payment), ltvRule(app, product)];
  const score = Math.max(0, 100 - results.reduce((sum, r) => sum + r.penalty, 0));
  const status: ApplicationStatus = results.some((r) => r.outcome === 'FAIL')
    ? 'REJECTED'
    : results.some((r) => r.outcome === 'REVIEW')
      ? 'MANUAL_REVIEW'
      : 'APPROVED';
  return {
    monthlyPayment: payment,
    status,
    score,
    reasons: results.map((r) => `[${r.outcome}] ${r.rule}: ${r.message}`),
  };
}
