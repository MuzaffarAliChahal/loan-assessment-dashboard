import { assess } from './scoring';
import type { Assessment, ApplicationStatus, LoanApplicationRequest, LoanProduct, ProblemDetail } from './types';

export interface LoanApi {
  readonly mode: 'live' | 'demo';
  products(): Promise<LoanProduct[]>;
  submit(request: LoanApplicationRequest): Promise<Assessment>;
  recent(status?: ApplicationStatus): Promise<Assessment[]>;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly fieldErrors: Record<string, string> = {}) {
    super(message);
  }
}

/** Talks to the Spring Boot loan-assessment-api (/api/v1/...). */
export function httpApi(baseUrl = ''): LoanApi {
  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      let problem: ProblemDetail = {};
      try { problem = await res.json(); } catch { /* not JSON */ }
      throw new ApiError(problem.detail ?? problem.title ?? `Request failed (${res.status})`, res.status, problem.errors);
    }
    return res.json() as Promise<T>;
  }
  return {
    mode: 'live',
    products: () => call('/api/v1/products'),
    submit: (request) => call('/api/v1/applications', { method: 'POST', body: JSON.stringify(request) }),
    recent: (status) => call(`/api/v1/applications${status ? `?status=${status}` : ''}`),
  };
}

export const DEMO_PRODUCTS: LoanProduct[] = [
  { code: 'PERSONAL', name: 'Personal Loan', minAmount: 1000, maxAmount: 50000, annualRate: 14.5, maxTermMonths: 60, maxLtv: null },
  { code: 'AUTO', name: 'Auto Loan', minAmount: 5000, maxAmount: 100000, annualRate: 10, maxTermMonths: 84, maxLtv: 0.9 },
  { code: 'HOME', name: 'Home Loan', minAmount: 20000, maxAmount: 1000000, annualRate: 8.75, maxTermMonths: 360, maxLtv: 0.8 },
];

/** In-browser fake of the API, so the dashboard can be explored without running the backend. */
export function demoApi(): LoanApi {
  const store: Assessment[] = [];
  let nextId = 1;
  return {
    mode: 'demo',
    products: async () => DEMO_PRODUCTS,
    submit: async (request) => {
      const product = DEMO_PRODUCTS.find((p) => p.code === request.productCode);
      if (!product) throw new ApiError(`Product ${request.productCode} not found`, 404);
      const result = assess(request, product);
      const saved: Assessment = {
        id: nextId++,
        applicantName: request.applicantName.trim(),
        productCode: product.code,
        amount: request.amount,
        termMonths: request.termMonths,
        createdAt: new Date().toISOString(),
        ...result,
      };
      store.unshift(saved);
      return saved;
    },
    recent: async (status) => store.filter((a) => !status || a.status === status).slice(0, 50),
  };
}

export function createApi(): LoanApi {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  const demo = import.meta.env.VITE_DEMO === 'true' || import.meta.env.MODE === 'demo';
  return demo ? demoApi() : httpApi(url ?? '');
}
