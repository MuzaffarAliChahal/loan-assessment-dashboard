const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const formatMoney = (n: number) => money.format(n);

export const statusLabel = {
  APPROVED: 'Approved',
  MANUAL_REVIEW: 'Manual review',
  REJECTED: 'Rejected',
} as const;
