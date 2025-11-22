import { type RepositoryActivityItem } from "./types";
import { formatDateTime, formatRelativeTime, getRiskBadgeClass } from "./utils";
import { triggerChatbotContext } from "@/lib/chatbot";
import { MessageCircle, Package } from "lucide-react";

function buildRepoContextMessage(item: RepositoryActivityItem): string {
  const { repo, summary } = item;
  const latest = summary?.latestScan;
  const parts = [
    `Analyze repository ${repo.full_name} (ID: ${repo.id}).`,
  ];

  if (latest) {
    parts.push(
      `Latest scan (${formatDateTime(latest.scan_timestamp)}): ${latest.total_vulnerabilities ?? 0} vulnerabilities impacting ${latest.total_packages ?? 0} packages.`
    );
  } else {
    parts.push("No scan history yet; suggest next actions to initiate vulnerability scanning.");
  }

  parts.push("Provide prioritized remediation guidance tailored to this repository.");

  return parts.join(" \n");
}

interface RecentActivityCardProps {
  activity: RepositoryActivityItem[];
}



export function RecentActivityCard({ activity }: Readonly<RecentActivityCardProps>) {
  const handleAskAssistant = (item: RepositoryActivityItem) => {
    const message = buildRepoContextMessage(item);
    triggerChatbotContext({ message, autoSend: true });
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body p-0 sm:p-6">
        <div className="flex items-center justify-between px-6 pt-6 sm:px-0 sm:pt-0">
          <div>
            <h3 className="card-title text-lg">Recent Activity</h3>
            <p className="text-base-content/70 text-sm">Latest vulnerability scans</p>
          </div>
        </div>

        {activity.length === 0 ? (
          <div className="py-12 text-center text-base-content/60">
            No scans yet. Run a vulnerability scan to see results here.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Repository</th>
                  <th className="hidden sm:table-cell">Last Scan</th>
                  <th className="text-center">Vulns</th>
                  <th className="text-center hidden md:table-cell">Packages</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activity.map(({ repo, summary }) => (
                  <tr key={repo.id} className="hover">
                    <td>
                      <div className="font-bold text-primary">{repo.name}</div>
                      <div className="text-xs opacity-50 truncate max-w-[150px] sm:max-w-xs">
                        {repo.full_name}
                      </div>
                      <div className="sm:hidden text-xs mt-1 opacity-70">
                        {formatRelativeTime(summary?.latestScan?.scan_timestamp)}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <div className="text-sm">
                        {formatRelativeTime(summary?.latestScan?.scan_timestamp)}
                      </div>
                      <div className="text-xs opacity-50">
                        {formatDateTime(summary?.latestScan?.scan_timestamp)}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`badge badge-sm ${getRiskBadgeClass(summary?.latestScan?.total_vulnerabilities ?? 0)}`}>
                        {summary?.latestScan?.total_vulnerabilities ?? 0}
                      </span>
                    </td>
                    <td className="text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1 opacity-70">
                        <Package className="w-3 h-3" />
                        {summary?.latestScan?.total_packages ?? "-"}
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-ghost btn-xs sm:btn-sm text-secondary tooltip tooltip-left"
                        data-tip="Ask AI Assistant"
                        onClick={() => handleAskAssistant({ repo, summary })}
                        aria-label={`Ask AI about ${repo.name}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Ask AI</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
