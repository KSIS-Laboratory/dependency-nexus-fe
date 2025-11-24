"use client";

import { useEffect, useState } from "react";
import { Clock, GitBranch, Package, TrendingUp, TrendingDown, AlertCircle, History } from "lucide-react";
import { useScanHistory } from "@/hooks/useScanHistory";
import type { DependencyScanVersion, DependencyChange } from "@/lib/scan-history";
import { EmptyState } from "@/components/EmptyState";

interface ScanHistoryPanelProps {
  readonly repositoryId: string;
  readonly repositoryName: string;
  readonly token: string;
  readonly onViewVersion?: (versionId: string) => void;
  readonly onScan?: () => void;
  readonly isScanning?: boolean;
}

export function ScanHistoryPanel({
  repositoryId,
  repositoryName,
  token,
  onViewVersion,
  onScan,
  isScanning = false,
}: ScanHistoryPanelProps) {
  const {
    loading,
    error,
    versionList,
    latestScan,
    comparison,
    fetchVersionList,
    fetchLatestScan,
    compareScans,
  } = useScanHistory({ repositoryId, repositoryName, token });

  const [selectedVersions, setSelectedVersions] = useState<{
    from?: string;
    to?: string;
  }>({});

  useEffect(() => {
    fetchVersionList();
    fetchLatestScan();
  }, [fetchVersionList, fetchLatestScan]);

  const handleCompare = async () => {
    if (selectedVersions.from && selectedVersions.to) {
      await compareScans(selectedVersions.from, selectedVersions.to);
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "added":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "removed":
        return <TrendingDown className="h-4 w-4 text-error" />;
      case "updated":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  if (loading && !versionList) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-center gap-2">
            <span className="loading loading-spinner loading-md"></span>
            <p>Loading scan history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Latest Scan Summary */}
      {latestScan && (
        <div className="card bg-linear-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <div className="card-body">
            <h3 className="card-title text-primary">
              <Package className="h-5 w-5" />
              Latest Scan
            </h3>
            <div className="stats stats-vertical lg:stats-horizontal shadow">
              <div className="stat">
                <div className="stat-title">Version</div>
                <div className="stat-value text-2xl">{latestScan.version_id}</div>
                <div className="stat-desc">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {new Date(latestScan.scan_timestamp).toLocaleString()}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Dependencies</div>
                <div className="stat-value text-2xl text-primary">
                  {latestScan.total_count}
                </div>
                <div className="stat-desc">
                  {latestScan.package_managers.join(", ")}
                </div>
              </div>
              {latestScan.commit_hash && (
                <div className="stat">
                  <div className="stat-title">Commit</div>
                  <div className="stat-value text-sm font-mono">
                    {latestScan.commit_hash.substring(0, 7)}
                  </div>
                  <div className="stat-desc">
                    <GitBranch className="inline h-3 w-3 mr-1" />
                    {latestScan.branch}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version List */}
      {versionList && versionList.versions.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Scan History</h3>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Date</th>
                    <th>Dependencies</th>
                    <th>Vulnerabilities</th>
                    <th>Commit</th>
                    <th>Compare</th>
                  </tr>
                </thead>
                <tbody>
                  {versionList.versions.map((version) => (
                    <tr key={version.version_id}>
                      <td>
                        <span className="badge badge-primary">{version.version_id}</span>
                      </td>
                      <td className="text-sm">
                        {new Date(version.scan_timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-ghost">{version.total_count}</span>
                      </td>
                      <td>
                        {version.vulnerability_summary ? (
                          <div className="flex gap-1">
                            {version.vulnerability_summary.total > 0 ? (
                              <>
                                {version.vulnerability_summary.critical > 0 && (
                                  <div className="badge badge-error badge-sm" title="Critical">
                                    {version.vulnerability_summary.critical}
                                  </div>
                                )}
                                {version.vulnerability_summary.high > 0 && (
                                  <div className="badge badge-warning badge-sm" title="High">
                                    {version.vulnerability_summary.high}
                                  </div>
                                )}
                                {(version.vulnerability_summary.critical === 0 && version.vulnerability_summary.high === 0) && (
                                  <div className="badge badge-info badge-sm" title="Total">
                                    {version.vulnerability_summary.total}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="badge badge-success badge-sm">Safe</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-base-content/30">-</span>
                        )}
                      </td>
                      <td>
                        {version.commit_hash ? (
                          <code className="text-xs">{version.commit_hash.substring(0, 7)}</code>
                        ) : (
                          <span className="text-base-content/50">-</span>
                        )}
                      </td>
                      <td>
                        <div className="join">
                          <button
                            className="btn btn-xs join-item btn-ghost"
                            onClick={() => onViewVersion?.(version.version_id)}
                            title="View Details"
                          >
                            View
                          </button>
                          <button
                            className="btn btn-xs join-item"
                            onClick={() =>
                              setSelectedVersions((prev) => ({
                                ...prev,
                                from: version.version_id,
                              }))
                            }
                          >
                            From
                          </button>
                          <button
                            className="btn btn-xs join-item"
                            onClick={() =>
                              setSelectedVersions((prev) => ({
                                ...prev,
                                to: version.version_id,
                              }))
                            }
                          >
                            To
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Compare Section */}
            {selectedVersions.from && selectedVersions.to && (
              <div className="card bg-base-200 mt-4">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-outline">{selectedVersions.from}</span>
                      <span>→</span>
                      <span className="badge badge-outline">{selectedVersions.to}</span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCompare}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        "Compare"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Comparison Results</h3>

            <div className="stats stats-vertical lg:stats-horizontal shadow">
              <div className="stat">
                <div className="stat-figure text-success">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div className="stat-title">Added</div>
                <div className="stat-value text-success">{comparison.added_count}</div>
              </div>
              <div className="stat">
                <div className="stat-figure text-error">
                  <TrendingDown className="h-8 w-8" />
                </div>
                <div className="stat-title">Removed</div>
                <div className="stat-value text-error">{comparison.removed_count}</div>
              </div>
              <div className="stat">
                <div className="stat-figure text-warning">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="stat-title">Updated</div>
                <div className="stat-value text-warning">{comparison.updated_count}</div>
              </div>
            </div>

            {comparison.changes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold mb-2">Change Details</h4>
                <div className="space-y-2">
                  {comparison.changes.map((change) => (
                    <div key={`${change.dependency_name}-${change.package_manager}-${change.change_type}`} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                      {getChangeIcon(change.change_type)}
                      <div className="flex-1">
                        <div className="font-semibold">{change.dependency_name}</div>
                        <div className="text-sm text-base-content/70">
                          {change.change_type === "added" && (
                            <span className="text-success">+ {change.new_version}</span>
                          )}
                          {change.change_type === "removed" && (
                            <span className="text-error">- {change.old_version}</span>
                          )}
                          {change.change_type === "updated" && (
                            <span>
                              {change.old_version} → <span className="text-warning">{change.new_version}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="badge badge-sm badge-outline">
                        {change.package_manager}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {versionList?.versions.length === 0 && (
        <EmptyState
          title="No scan history found"
          description="Start scanning dependencies to track changes and build a history of your security posture."
          icon={History}
          onScan={onScan}
          isScanning={isScanning}
        />
      )}
    </div>
  );
}
