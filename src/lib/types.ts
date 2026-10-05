export type ApplicationStatus = 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';

export interface LoanProduct {
  code: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  annualRate: number;
  maxTermMonths: number;
  maxLtv: number | null;
}

export interface LoanApplicationRequest {
  applicantName: string;
  productCode: string;
  monthlyIncome: number;
  monthlyDebt: number;
  creditScore: number;
  amount: number;
  termMonths: number;
  propertyValue?: number;
}

export interface Assessment {
  id: number;
  applicantName: string;
  productCode: string;
  amount: number;
  termMonths: number;
  monthlyPayment: number;
  status: ApplicationStatus;
  score: number;
  reasons: string[];
  createdAt: string;
}

/** RFC 7807 problem response returned by the Spring Boot API. */
export interface ProblemDetail {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string>;
}
