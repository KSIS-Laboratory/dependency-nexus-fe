import type { RepositoryActivityItem } from "./types";
import { formatRelativeTime, getRiskBadgeClass } from "./utils"
import { Activity, ArrowRight } from "lucide-react";

interface RecentActivityCardProps {
  activities: RepositoryActivityItem[];
  onViewAll: () => void;
  onViewRepository: (fullName: string) => void;
}

export function RecentActivityCard({ activities, onViewAll, onViewRepository }: Readonly<RecentActivityCardProps>) {
  return (
    <div className="card bg-base-100 shadow-md animate-slide-up" style={{ animationDelay: '0.08s' }}>
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-base-content">Recent Activity</h3>
              <p className="text-base-content/60 text-sm">Latest vulnerability scans</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm gap-1" onClick={onViewAll}>
            View all
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {activities.length > 0 ? (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="table table-sm">
              <thead>
                <tr className="text-base-content/60">
                  <th>Repository</th>
                  <th className="hidden sm:table-cell">Scanned</th>
                  <th>Vulnerabilities</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activities.map(({ repo, summary }) => (
                  <tr key={repo.id} className="hover:bg-base-200/50">
                    <td>
                      <div className="font-bold text-base-content">{repo.name}</div>
                      <div className="text-xs text-base-content/60 sm:hidden">
                        {formatRelativeTime(summary?.latestScan?.scan_timestamp)}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell text-base-content/60">
                      {formatRelativeTime(summary?.latestScan?.scan_timestamp)}
                    </td>
                    <td>
                      <span className={`badge ${getRiskBadgeClass(summary?.latestScan?.total_vulnerabilities ?? 0)} badge-sm`}>
                        {summary?.latestScan?.total_vulnerabilities ?? 0}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => onViewRepository(repo.full_name)}
                        className="btn btn-ghost btn-xs text-base-content/60 tooltip tooltip-left"
                        data-tip="View details"
                        aria-label={`View details for ${repo.name}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-base-content/60">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
