import { ShieldCheck, Activity, ShieldAlert, Clock } from "lucide-react";
import type { DashboardStats } from "./types";
import { formatDateTime, formatRelativeTime } from "./utils";

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: Readonly<DashboardStatsGridProps>) {
  return (
    <div className="stats stats-vertical lg:stats-horizontal shadow-xl bg-base-100 w-full border border-base-200">
      <div className="stat">
        <div className="stat-figure text-primary">
          <ShieldCheck className="inline-block w-8 h-8 stroke-current" />
        </div>
        <div className="stat-title">Total Repositories</div>
        <div className="stat-value text-primary">{stats.repoCount}</div>
        <div className="stat-desc">Connected to GitHub</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-secondary">
          <Activity className="inline-block w-8 h-8 stroke-current" />
        </div>
        <div className="stat-title">Monitored</div>
        <div className="stat-value text-secondary">{stats.scannedCount}</div>
        <div className="stat-desc">Active scans</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-error">
          <ShieldAlert className="inline-block w-8 h-8 stroke-current" />
        </div>
        <div className="stat-title">Vulnerabilities</div>
        <div className="stat-value text-error">{stats.totalVulnerabilities}</div>
        <div className="stat-desc">Across latest scans</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-info">
          <Clock className="inline-block w-8 h-8 stroke-current" />
        </div>
        <div className="stat-title">Last Scan</div>
        <div className="stat-value text-lg">
          {stats.lastScan ? formatRelativeTime(stats.lastScan) : "N/A"}
        </div>
        <div className="stat-desc">
          {stats.lastScan ? formatDateTime(stats.lastScan) : "No scans yet"}
        </div>
      </div>
    </div>
  );
}
