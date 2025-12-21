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
    <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-base-content">Project Health</h3>
          <p className="text-base-content/60 text-sm">Quick access to your most active repositories</p>
        </div>
        <button
          className="btn btn-outline btn-primary btn-sm gap-2"
          onClick={onViewAll}
        >
          View all repositories
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length > 0 ? (
          projects.map(({ repo, summary }, index) => (
            <div
              key={repo.id}
              className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${(index + 1) * 0.05}s` }}
            >
              <div className="card-body p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-linear-to-br from-primary to-secondary rounded-xl text-primary-content shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <FolderGit2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base-content truncate max-w-40" title={repo.name}>
                        {repo.name}
                      </h4>
                      <p className="text-xs text-base-content/60 truncate max-w-40">
                        {repo.full_name}
                      </p>
                    </div>
                  </div>
                  <div className={`badge ${getRiskBadgeClass(summary?.latestScan?.total_vulnerabilities ?? 0)} badge-sm`}>
                    {summary?.latestScan?.total_vulnerabilities ?? 0} vulns
                  </div>
                </div>

                <div className="divider my-1"></div>

                <div className="flex items-center justify-between text-xs text-base-content/60 mb-3">
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

                <button
                  onClick={() => onViewRepository(repo.full_name)}
                  className="btn btn-outline btn-sm w-full"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full card bg-base-100 border-2 border-dashed border-base-300">
            <div className="card-body items-center text-center py-12">
              <FolderGit2 className="h-12 w-12 text-base-content/30" />
              <p className="font-medium text-base-content">No projects found</p>
              <p className="text-sm text-base-content/60">Connect repositories to start visualizing their health.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
