import type { Assessment } from '../lib/types';
import { formatMoney } from '../lib/format';
import { StatusBadge } from './StatusBadge';

export function DecisionCard({ assessment }: { assessment: Assessment | null }) {
  if (!assessment) {
    return (
      <section className="card decision empty">
        <h2>Decision</h2>
        <p className="muted">Submit an application to see the instant decision and the reason behind every rule.</p>
      </section>
    );
  }
  const { status, score, reasons, monthlyPayment, applicantName, productCode, amount, termMonths } = assessment;
  return (
    <section className="card decision" aria-live="polite">
      <div className="decision-head">
        <div>
          <h2>Decision</h2>
          <p className="muted">{applicantName} · {productCode} · {formatMoney(amount)} over {termMonths} months</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="score">
        <div className="score-ring" style={{ ['--score' as string]: score }} data-testid="score">
          <span>{score}</span>
        </div>
        <div>
          <div className="muted">Monthly payment</div>
          <div className="big">{formatMoney(monthlyPayment)}</div>
        </div>
      </div>
      <ul className="reasons">
        {reasons.map((r) => {
          const outcome = r.match(/^\[(\w+)\]/)?.[1] ?? 'PASS';
          return (
            <li key={r} className={`reason reason-${outcome.toLowerCase()}`}>
              {r.replace(/^\[\w+\]\s*/, '')}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
