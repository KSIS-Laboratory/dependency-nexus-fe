import type { RiskBuckets } from "./types";

interface RiskDistributionCardProps {
  readonly riskBuckets: RiskBuckets;
}

const RiskBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="font-medium text-base-content w-20">{label}</span>
    <span className="text-base-content/60 font-semibold w-16 text-right">{value} repos</span>
    <div className="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(value * 10, 100)}%` }}
      />
    </div>
  </div>
);

export function RiskDistributionCard({ riskBuckets }: RiskDistributionCardProps) {
  return (
    <div className="card bg-base-100 shadow-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="card-body">
        <h3 className="text-lg font-bold text-base-content mb-1">Risk Distribution</h3>
        <p className="text-base-content/60 text-sm mb-6">
          Vulnerability risk levels based on latest scans
        </p>

        <div className="space-y-4">
          <RiskBar label="Critical" value={riskBuckets.critical} color="bg-error" />
          <RiskBar label="Warning" value={riskBuckets.warning} color="bg-warning" />
          <RiskBar label="Healthy" value={riskBuckets.healthy} color="bg-success" />
          <RiskBar label="Unscanned" value={riskBuckets.unscanned} color="bg-base-content/30" />
        </div>
      </div>
    </div>
  );
}
