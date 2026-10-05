import type { ApplicationStatus, Assessment } from '../lib/types';
import { formatMoney, statusLabel } from '../lib/format';
import { StatusBadge } from './StatusBadge';

interface Props {
  rows: Assessment[];
  filter: ApplicationStatus | '';
  onFilter: (s: ApplicationStatus | '') => void;
}

export function ApplicationsTable({ rows, filter, onFilter }: Props) {
  return (
    <section className="card">
      <div className="table-head">
        <h2>Recent applications</h2>
        <select aria-label="Filter by status" value={filter} onChange={(e) => onFilter(e.target.value as ApplicationStatus | '')}>
          <option value="">All statuses</option>
          {(Object.keys(statusLabel) as ApplicationStatus[]).map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
      </div>
      {rows.length === 0 ? (
        <p className="muted">No applications yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Applicant</th><th>Product</th><th className="num">Amount</th><th className="num">Payment</th><th className="num">Score</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.applicantName}</td>
                  <td>{a.productCode}</td>
                  <td className="num">{formatMoney(a.amount)}</td>
                  <td className="num">{formatMoney(a.monthlyPayment)}</td>
                  <td className="num">{a.score}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
