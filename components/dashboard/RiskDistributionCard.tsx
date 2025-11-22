import type { RiskBuckets } from "./types";

interface RiskDistributionCardProps {
  buckets: RiskBuckets;
}

export function RiskDistributionCard({ buckets }: Readonly<RiskDistributionCardProps>) {
  const total = Math.max(buckets.healthy + buckets.warning + buckets.critical + buckets.unscanned, 1);

  const progressBar = (label: string, value: number, color: string) => (
    <div className="space-y-1" key={label}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-base-content/60">{value} repos</span>
      </div>
      <progress
        className={`progress ${color} w-full h-2`}
        value={(value / total) * 100}
        max={100}
      />
    </div>
  );

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h3 className="card-title text-lg">Risk Distribution</h3>
        <p className="text-base-content/70 text-sm mb-4">
          Overview of repository health status
        </p>

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
