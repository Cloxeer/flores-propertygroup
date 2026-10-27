/**
 * ELI5: One quiet line that sums up the day, so the page has a single thing to read first.
 * What: Non-interactive summary of active deals, tasks due today and deals ready to close.
 * Owns: The overview summary line markup and its copy.
 * Depends on: Nothing (pure display, props only).
 */
export interface DashboardMetricsProps {
  activeCount: number;
  dueTodayCount: number;
  readyToCloseCount: number;
}

export function DashboardMetrics({ activeCount, dueTodayCount, readyToCloseCount }: DashboardMetricsProps) {
  return (
    <p className="summary-line">
      <span>
        <strong>{activeCount}</strong> active
      </span>
      <span>
        <strong>{dueTodayCount}</strong> due today
      </span>
      <span>
        <strong>{readyToCloseCount}</strong> ready to close
      </span>
    </p>
  );
}
