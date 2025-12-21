import { ShieldCheck, Activity, ShieldAlert, Clock } from "lucide-react";
import type { DashboardStats } from "./types";
import { formatDateTime, formatRelativeTime } from "./utils";

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: Readonly<DashboardStatsGridProps>) {
  const statItems = [
    {
      icon: ShieldCheck,
      title: "Total Repositories",
      value: stats.repoCount,
      desc: "Connected to GitHub",
      iconBg: "bg-primary",
    },
    {
      icon: Activity,
      title: "Monitored",
      value: stats.scannedCount,
      desc: "Active scans",
      iconBg: "bg-secondary",
    },
    {
      icon: ShieldAlert,
      title: "Vulnerabilities",
      value: stats.totalVulnerabilities,
      desc: "Across latest scans",
      iconBg: "bg-warning",
      valueColor: stats.totalVulnerabilities > 0 ? "text-warning" : "text-success",
    },
    {
      icon: Clock,
      title: "Last Scan",
      value: stats.lastScan ? formatRelativeTime(stats.lastScan) : "N/A",
      desc: stats.lastScan ? formatDateTime(stats.lastScan) : "No scans yet",
      iconBg: "bg-info",
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
      {statItems.map((item, index) => (
        <div
          key={item.title}
          className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="card-body p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${item.iconBg} shadow-sm`}>
                <item.icon className="h-5 w-5 text-base-100" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-base-content/60">{item.title}</p>
              <p className={`${item.isText ? 'text-lg' : 'text-3xl'} font-bold ${item.valueColor || 'text-base-content'}`}>
                {item.value}
              </p>
              <p className="text-xs text-base-content/50">{item.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
