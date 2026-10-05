import { assess, monthlyPayment } from './scoring';
import { DEMO_PRODUCTS } from './api';

const [personal, auto, home] = DEMO_PRODUCTS;
const base = { applicantName: 'Ayesha Khan', productCode: 'PERSONAL', monthlyIncome: 6000, monthlyDebt: 500, creditScore: 760, amount: 15000, termMonths: 36 };

describe('monthlyPayment', () => {
  it('matches the Java EmiCalculator', () => {
    expect(monthlyPayment(15000, 14.5, 36)).toBe(516.31);
  });
  it('handles a zero rate', () => {
    expect(monthlyPayment(1200, 0, 12)).toBe(100);
  });
});

describe('assess', () => {
  it('approves a strong applicant', () => {
    const r = assess(base, personal);
    expect(r.status).toBe('APPROVED');
    expect(r.score).toBe(100);
    expect(r.reasons).toContain('[PASS] DTI: debt-to-income 16.9% is within 36%');
  });

  it('sends a borderline credit score to manual review', () => {
    const r = assess({ ...base, creditScore: 650 }, personal);
    expect(r.status).toBe('MANUAL_REVIEW');
    expect(r.score).toBe(85);
  });

  it('rejects when debt-to-income is too high', () => {
    expect(assess({ ...base, monthlyIncome: 2000 }, personal).status).toBe('REJECTED');
  });

  it('requires collateral for secured products', () => {
    const r = assess({ ...base, productCode: 'HOME', amount: 200000, termMonths: 240 }, home);
    expect(r.status).toBe('REJECTED');
    expect(r.reasons).toContain('[FAIL] LTV: collateral value is required for HOME');
  });

  it('reviews a loan-to-value slightly above the limit', () => {
    const r = assess({ ...base, productCode: 'AUTO', amount: 23000, termMonths: 60, propertyValue: 25000, monthlyIncome: 9000 }, auto);
    expect(r.reasons.find((x) => x.includes('LTV'))).toBe('[REVIEW] LTV: loan-to-value 92.0% is slightly above 90%');
  });

  it('rejects amounts outside product limits', () => {
    expect(assess({ ...base, amount: 60000 }, personal).reasons[0]).toBe('[FAIL] LIMITS: amount must be between 1000 and 50000');
  });
});
