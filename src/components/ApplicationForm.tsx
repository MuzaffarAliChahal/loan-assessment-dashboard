import { useMemo, useState, type FormEvent } from 'react';
import { monthlyPayment } from '../lib/scoring';
import { formatMoney } from '../lib/format';
import type { LoanApplicationRequest, LoanProduct } from '../lib/types';

interface Props {
  products: LoanProduct[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (request: LoanApplicationRequest) => void;
}

type Fields = Record<'applicantName' | 'productCode' | 'monthlyIncome' | 'monthlyDebt' | 'creditScore' | 'amount' | 'termMonths' | 'propertyValue', string>;

const initial: Fields = {
  applicantName: 'Ayesha Khan',
  productCode: 'PERSONAL',
  monthlyIncome: '6000',
  monthlyDebt: '500',
  creditScore: '760',
  amount: '15000',
  termMonths: '36',
  propertyValue: '',
};

export function validate(f: Fields, product?: LoanProduct): Record<string, string> {
  const e: Record<string, string> = {};
  const num = (k: keyof Fields) => Number(f[k]);
  if (!f.applicantName.trim()) e.applicantName = 'Name is required';
  if (!(num('monthlyIncome') > 0)) e.monthlyIncome = 'Income must be greater than 0';
  if (f.monthlyDebt === '' || num('monthlyDebt') < 0) e.monthlyDebt = 'Debt cannot be negative';
  if (!(num('creditScore') >= 300 && num('creditScore') <= 850)) e.creditScore = 'Credit score must be 300 to 850';
  if (!(num('amount') > 0)) e.amount = 'Amount must be greater than 0';
  if (!(Number.isInteger(num('termMonths')) && num('termMonths') >= 1 && num('termMonths') <= 480)) e.termMonths = 'Term must be 1 to 480 months';
  if (product?.maxLtv != null && !(num('propertyValue') > 0)) e.propertyValue = `Collateral value is required for ${product.name}`;
  return e;
}

export function ApplicationForm({ products, submitting, serverErrors = {}, onSubmit }: Props) {
  const [fields, setFields] = useState<Fields>(initial);
  const [touched, setTouched] = useState(false);
  const product = products.find((p) => p.code === fields.productCode);
  const errors = { ...(touched ? validate(fields, product) : {}), ...serverErrors };

  const preview = useMemo(() => {
    const amount = Number(fields.amount);
    const term = Number(fields.termMonths);
    if (!product || !(amount > 0) || !(term > 0)) return null;
    return monthlyPayment(amount, product.annualRate, term);
  }, [fields.amount, fields.termMonths, product]);

  const set = (k: keyof Fields) => (ev: { target: { value: string } }) => setFields((f) => ({ ...f, [k]: ev.target.value }));

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setTouched(true);
    if (Object.keys(validate(fields, product)).length > 0) return;
    onSubmit({
      applicantName: fields.applicantName.trim(),
      productCode: fields.productCode,
      monthlyIncome: Number(fields.monthlyIncome),
      monthlyDebt: Number(fields.monthlyDebt),
      creditScore: Number(fields.creditScore),
      amount: Number(fields.amount),
      termMonths: Number(fields.termMonths),
      ...(product?.maxLtv != null ? { propertyValue: Number(fields.propertyValue) } : {}),
    });
  }

  const field = (k: keyof Fields, label: string, type = 'number', extra?: string) => (
    <label className="field">
      <span>{label}</span>
      <input name={k} type={type} value={fields[k]} onChange={set(k)} aria-invalid={!!errors[k]} />
      {errors[k] ? <small className="error">{errors[k]}</small> : extra ? <small>{extra}</small> : null}
    </label>
  );

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>New application</h2>
      {field('applicantName', 'Applicant name', 'text')}
      <label className="field">
        <span>Loan product</span>
        <select name="productCode" value={fields.productCode} onChange={set('productCode')}>
          {products.map((p) => (
            <option key={p.code} value={p.code}>{p.name} ({p.annualRate}% APR)</option>
          ))}
        </select>
        {product && (
          <small>
            {formatMoney(product.minAmount)} to {formatMoney(product.maxAmount)}, up to {product.maxTermMonths} months
            {product.maxLtv != null ? `, max LTV ${Math.round(product.maxLtv * 100)}%` : ''}
          </small>
        )}
      </label>
      <div className="row">
        {field('monthlyIncome', 'Monthly income')}
        {field('monthlyDebt', 'Monthly debt payments')}
      </div>
      <div className="row">
        {field('amount', 'Loan amount')}
        {field('termMonths', 'Term (months)')}
      </div>
      <div className="row">
        {field('creditScore', 'Credit score')}
        {product?.maxLtv != null ? field('propertyValue', 'Collateral value') : <div />}
      </div>
      <div className="form-footer">
        <span className="muted">{preview != null ? <>Estimated payment <strong>{formatMoney(preview)}</strong> / month</> : ' '}</span>
        <button type="submit" disabled={submitting}>{submitting ? 'Assessing…' : 'Get decision'}</button>
      </div>
    </form>
  );
}
