import { type RepositoryActivityItem } from "./types";
import { formatDateTime, formatRelativeTime, getRiskBadgeClass } from "./utils";

interface RecentActivityCardProps {
  activity: RepositoryActivityItem[];
}

export function RecentActivityCard({ activity }: Readonly<RecentActivityCardProps>) {
  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title text-primary">Recent scan activity</h3>
            <p className="text-base-content/70 text-sm">Latest vulnerability scans across your repositories</p>
          </div>
        </div>
        {activity.length === 0 ? (
          <div className="py-8 text-center text-base-content/60">
            No scans yet. Run a vulnerability scan to see results here.
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-4 md:hidden">
              {activity.map(({ repo, summary }) => (
                <div key={repo.id} className="rounded-xl border border-base-300 p-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-primary text-base">{repo.name}</p>
                    <p className="text-xs text-base-content/60 break-all">{repo.full_name}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div>
                      <p className="text-xs uppercase text-base-content/60">Last scan</p>
                      <p className="text-secondary font-medium">
                        {formatRelativeTime(summary?.latestScan?.scan_timestamp)}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {formatDateTime(summary?.latestScan?.scan_timestamp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-base-content/60">Vulnerabilities</p>
                      <span className={`${getRiskBadgeClass(summary?.latestScan?.total_vulnerabilities ?? 0)} text-xs`}>
                        {summary?.latestScan?.total_vulnerabilities ?? 0}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-base-content/60">Packages</p>
                      <p className="font-semibold">{summary?.latestScan?.total_packages ?? "-"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto mt-4 hidden md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>Repository</th>
                    <th>Last scan</th>
                    <th className="text-center">Vulnerabilities</th>
                    <th className="text-center">Packages</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map(({ repo, summary }) => (
                    <tr key={repo.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-primary">{repo.name}</p>
                          <p className="text-xs text-base-content/60">{repo.full_name}</p>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm text-secondary">
                          {formatRelativeTime(summary?.latestScan?.scan_timestamp)}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {formatDateTime(summary?.latestScan?.scan_timestamp)}
                        </p>
                      </td>
                      <td className="text-center">
                        <span className={getRiskBadgeClass(summary?.latestScan?.total_vulnerabilities ?? 0)}>
                          {summary?.latestScan?.total_vulnerabilities ?? 0}
                        </span>
                      </td>
                      <td className="text-center">{summary?.latestScan?.total_packages ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
