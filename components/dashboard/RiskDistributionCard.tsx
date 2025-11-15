import type { RiskBuckets } from "./types";

interface RiskDistributionCardProps {
  buckets: RiskBuckets;
}

export function RiskDistributionCard({ buckets }: Readonly<RiskDistributionCardProps>) {
  const total = Math.max(buckets.healthy + buckets.warning + buckets.critical + buckets.unscanned, 1);

  const progressBar = (label: string, value: number, color: string) => (
    <div className="space-y-2" key={label}>
      <div className="flex flex-col gap-1 text-sm text-base-content/80 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-base-content">{label}</span>
        <span className="text-xs uppercase tracking-wide text-base-content/60">{value} repos</span>
      </div>
      <progress className={`progress ${color}`} value={(value / total) * 100} max={100} />
    </div>
  );

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body space-y-6">
        <div>
          <h3 className="card-title text-primary text-lg sm:text-xl">Risk distribution</h3>
          <p className="text-base-content/70 text-sm">
            Snapshot of repositories grouped by vulnerability counts from cached scan JSON files
          </p>
        </div>

        <div className="space-y-4">
          {progressBar("Healthy (0 vulnerabilities)", buckets.healthy, "progress-success")}
          {progressBar("Warning (1-5 vulnerabilities)", buckets.warning, "progress-warning")}
          {progressBar("Critical (>5 vulnerabilities)", buckets.critical, "progress-error")}
          {progressBar("Not scanned yet", buckets.unscanned, "progress-info")}
        </div>
      </div>
    </div>
  );
}
