import type { ApplicationStatus } from '../lib/types';
import { statusLabel } from '../lib/format';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{statusLabel[status]}</span>;
}
