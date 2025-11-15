import { ShieldCheck, Activity, ShieldAlert, Clock } from "lucide-react";
import type { DashboardStats } from "./types";
import { formatDateTime, formatRelativeTime } from "./utils";

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: Readonly<DashboardStatsGridProps>) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <p className="text-sm uppercase tracking-wide text-base-content/60">Repositories</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-base-content sm:text-4xl">{stats.repoCount}</span>
            <ShieldCheck className="h-8 w-8 text-primary" aria-hidden />
          </div>
          <p className="text-sm text-base-content/70">Connected to your GitHub account</p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <p className="text-sm uppercase tracking-wide text-base-content/60">Monitored repos</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-base-content sm:text-4xl">{stats.scannedCount}</span>
            <Activity className="h-8 w-8 text-secondary" aria-hidden />
          </div>
          <p className="text-sm text-base-content/70">Have at least one vulnerability scan</p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <p className="text-sm uppercase tracking-wide text-base-content/60">Open vulnerabilities</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-error sm:text-4xl">{stats.totalVulnerabilities}</span>
            <ShieldAlert className="h-8 w-8 text-error" aria-hidden />
          </div>
          <p className="text-sm text-base-content/70">Across the latest scan for each repo</p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <p className="text-sm uppercase tracking-wide text-base-content/60">Last scan</p>
          <div className="flex items-end justify-between">
            <span className="text-base font-semibold text-base-content sm:text-lg">
              {stats.lastScan ? formatRelativeTime(stats.lastScan) : "No scans"}
            </span>
            <Clock className="h-8 w-8 text-info" aria-hidden />
          </div>
          <p className="text-sm text-base-content/70">{formatDateTime(stats.lastScan)}</p>
        </div>
      </div>
    </section>
  );
}
