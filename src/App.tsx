import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, createApi, type LoanApi } from './lib/api';
import type { ApplicationStatus, Assessment, LoanApplicationRequest, LoanProduct } from './lib/types';
import { ApplicationForm } from './components/ApplicationForm';
import { DecisionCard } from './components/DecisionCard';
import { ApplicationsTable } from './components/ApplicationsTable';

export default function App({ api: injected }: { api?: LoanApi }) {
  const api = useMemo(() => injected ?? createApi(), [injected]);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [latest, setLatest] = useState<Assessment | null>(null);
  const [rows, setRows] = useState<Assessment[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => setRows(await api.recent(filter || undefined)), [api, filter]);

  useEffect(() => {
    api.products().then(setProducts).catch(() => setError('Could not reach the loan API. Is it running on port 8080?'));
  }, [api]);

  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);

  async function submit(request: LoanApplicationRequest) {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      setLatest(await api.submit(request));
      await refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setFieldErrors(e.fieldErrors);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const counts = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Loan Assessment</h1>
          <p className="muted">Instant, explainable loan decisions</p>
        </div>
        <span className={`mode mode-${api.mode}`}>{api.mode === 'demo' ? 'Demo mode · in-browser API' : 'Live API'}</span>
      </header>

      {error && <div role="alert" className="alert">{error}</div>}

      <div className="stats">
        <div className="stat"><span>{rows.length}</span>Applications</div>
        <div className="stat ok"><span>{counts.APPROVED ?? 0}</span>Approved</div>
        <div className="stat warn"><span>{counts.MANUAL_REVIEW ?? 0}</span>Manual review</div>
        <div className="stat bad"><span>{counts.REJECTED ?? 0}</span>Rejected</div>
      </div>

      <main className="grid">
        {products.length > 0 ? (
          <ApplicationForm products={products} submitting={submitting} serverErrors={fieldErrors} onSubmit={submit} />
        ) : (
          <section className="card"><p className="muted">Loading products…</p></section>
        )}
        <DecisionCard assessment={latest} />
      </main>

      <ApplicationsTable rows={rows} filter={filter} onFilter={setFilter} />
      <footer className="muted">Frontend for <a href="https://github.com/MuzaffarAliChahal/loan-assessment-api">loan-assessment-api</a> (Java 21, Spring Boot)</footer>
    </div>
  );
}
