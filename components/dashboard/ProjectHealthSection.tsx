import type { HighlightedProjectItem } from "./types";
import { getRiskBadgeClass, formatRelativeTime } from "./utils";
import { ArrowRight } from "lucide-react";

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
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="card-title text-primary">Project health</h3>
              <p className="text-sm text-base-content/70">Dive deeper into each repository</p>
            </div>
            <button className="btn btn-outline btn-primary" onClick={onViewAll}>
              View all repositories
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {projects.length > 0 ? (
              projects.map(({ repo, summary }) => (
                <div key={repo.id} className="card bg-base-200/60">
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-semibold text-base-content">{repo.name}</p>
                        <p className="text-sm text-base-content/60">{repo.full_name}</p>
                      </div>
                      <span className="text-xs uppercase text-base-content/60">
                        {summary?.totalScans ? `${summary.totalScans} scans` : "Not scanned"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className={getRiskBadgeClass(summary?.latestScan?.total_vulnerabilities ?? 0)}>
                        {summary?.latestScan?.total_vulnerabilities ?? 0} vulns
                      </span>
                      <div>
                        <p className="text-xs text-base-content/60">Last scan</p>
                        <p className="text-sm text-base-content">
                          {summary?.latestScan?.scan_timestamp
                            ? formatRelativeTime(summary.latestScan.scan_timestamp)
                            : "No scans yet"}
                        </p>
                      </div>
                    </div>

                    <div className="card-actions mt-4">
                      <button
                        onClick={() => onViewRepository(repo.full_name)}
                        className="btn btn-outline btn-sm btn-secondary gap-2"
                      >
                        View details
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-base-300 p-8 text-center text-base-content/60">
                Connect repositories to start visualizing their health.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
