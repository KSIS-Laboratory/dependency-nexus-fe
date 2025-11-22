import type { HighlightedProjectItem } from "./types";
import { getRiskBadgeClass, formatRelativeTime } from "./utils";
import { ArrowRight, FolderGit2, Calendar } from "lucide-react";

interface ProjectHealthSectionProps {
  projects: HighlightedProjectItem[];
  onViewRepository: (fullName: string) => void;
  onViewAll: () => void;
}

export function ProjectHealthSection({
  projects,
  onViewRepository,
  onViewAll,
}: Readonly<ProjectHealthSectionProps>) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold">Project Health</h3>
          <p className="text-base-content/70 text-sm">Quick access to your most active repositories</p>
        </div>
        <button className="btn btn-ghost btn-sm text-primary" onClick={onViewAll}>
          View all repositories
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length > 0 ? (
          projects.map(({ repo, summary }) => (
            <div key={repo.id} className="card card-compact bg-base-100 shadow-md hover:shadow-lg transition-shadow border border-base-200">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <FolderGit2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base truncate max-w-[180px]" title={repo.name}>
                        {repo.name}
                      </h4>
                      <p className="text-xs text-base-content/60 truncate max-w-[180px]">
                        {repo.full_name}
                      </p>
                    </div>
                  </div>
                  <div className={`badge ${getRiskBadgeClass(summary?.latestScan?.total_vulnerabilities ?? 0)} badge-sm`}>
                    {summary?.latestScan?.total_vulnerabilities ?? 0} vulns
                  </div>
                </div>

                <div className="divider my-1"></div>

                <div className="flex items-center justify-between text-xs text-base-content/70">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {summary?.latestScan?.scan_timestamp
                        ? formatRelativeTime(summary.latestScan.scan_timestamp)
                        : "No scans"}
                    </span>
                  </div>
                  <span>
                    {summary?.totalScans ? `${summary.totalScans} scans` : "Not scanned"}
                  </span>
                </div>

                <div className="card-actions justify-end mt-2">
                  <button
                    onClick={() => onViewRepository(repo.full_name)}
                    className="btn btn-xs btn-outline w-full"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-base-300 p-12 text-center text-base-content/60 bg-base-50">
            <FolderGit2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No projects found</p>
            <p className="text-sm mt-1">Connect repositories to start visualizing their health.</p>
          </div>
        )}
      </div>
    </section>
  );
}
