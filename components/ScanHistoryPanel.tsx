"use client";

import { useEffect, useState } from "react";
import { GitBranch, Package, TrendingUp, TrendingDown, AlertCircle, History } from "lucide-react";
import { useScanHistory } from "@/hooks/useScanHistory";
import type { DependencyScanVersion, DependencyChange } from "@/lib/scan-history";
import { EmptyState } from "@/components/EmptyState";

interface ScanHistoryPanelProps {
  readonly repositoryId: string;
  readonly repositoryName: string;
  readonly token: string;
  readonly onViewVersion?: (version: DependencyScanVersion) => void;
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
    fetchVersion,
    compareScans,
  } = useScanHistory({ repositoryId, repositoryName, token });

  const [selectedVersions, setSelectedVersions] = useState<{
    from?: string;
    to?: string;
  }>({});

  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);

  useEffect(() => {
    fetchVersionList();
    fetchLatestScan();
  }, [fetchVersionList, fetchLatestScan]);

  const handleCompare = async () => {
    if (selectedVersions.from && selectedVersions.to) {
      await compareScans(selectedVersions.from, selectedVersions.to);
    }
  };

  const handleViewDetail = async (versionId: string) => {
    if (!onViewVersion) return;

    setViewingVersionId(versionId);
    try {
      const fullVersion = await fetchVersion(versionId);
      onViewVersion(fullVersion);
    } catch (error) {
      console.error("Failed to fetch version details:", error);
    } finally {
      setViewingVersionId(null);
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

  if (loading && !versionList && !viewingVersionId) {
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: History List (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {versionList && versionList.versions.length > 0 ? (
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body p-0">
              <div className="p-4 border-b border-base-200 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Scan History
                </h3>
                <span className="badge badge-ghost">{versionList.versions.length} versions</span>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Date</th>
                      <th>Stats</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionList.versions.map((version) => (
                      <tr key={version.version_id} className="hover">
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-xs">{version.version_id}</span>
                            {version.commit_hash && (
                              <div className="flex items-center gap-1 text-xs text-base-content/60">
                                <GitBranch className="h-3 w-3" />
                                <span className="font-mono">{version.commit_hash.substring(0, 7)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col text-sm">
                            <span>{new Date(version.scan_timestamp).toLocaleDateString()}</span>
                            <span className="text-xs text-base-content/60">{new Date(version.scan_timestamp).toLocaleTimeString()}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs">
                              <Package className="h-3 w-3" />
                              {version.total_count} deps
                            </div>
                            {version.vulnerability_summary ? (
                              <div className="flex gap-1">
                                {version.vulnerability_summary.total > 0 ? (
                                  <>
                                    {version.vulnerability_summary.critical > 0 && (
                                      <div className="badge badge-error badge-xs font-mono" title="Critical">
                                        {version.vulnerability_summary.critical}
                                      </div>
                                    )}
                                    {version.vulnerability_summary.high > 0 && (
                                      <div className="badge badge-warning badge-xs font-mono" title="High">
                                        {version.vulnerability_summary.high}
                                      </div>
                                    )}
                                    {(version.vulnerability_summary.critical === 0 && version.vulnerability_summary.high === 0) && (
                                      <div className="badge badge-info badge-xs font-mono" title="Total">
                                        {version.vulnerability_summary.total}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="badge badge-success badge-xs">Safe</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-base-content/30 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              className="btn btn-square btn-ghost btn-sm"
                              onClick={() => handleViewDetail(version.version_id)}
                              disabled={viewingVersionId === version.version_id}
                              title="View Details"
                            >
                              {viewingVersionId === version.version_id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )}
                            </button>
                            <div className="join">
                              <button
                                className={`btn btn-xs join-item ${selectedVersions.from === version.version_id ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() =>
                                  setSelectedVersions((prev) => ({
                                    ...prev,
                                    from: version.version_id,
                                  }))
                                }
                                title="Compare From"
                              >
                                A
                              </button>
                              <button
                                className={`btn btn-xs join-item ${selectedVersions.to === version.version_id ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() =>
                                  setSelectedVersions((prev) => ({
                                    ...prev,
                                    to: version.version_id,
                                  }))
                                }
                                title="Compare To"
                              >
                                B
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No scan history found"
            description="Start scanning dependencies to track changes and build a history of your security posture."
            icon={History}
            onScan={onScan}
            isScanning={isScanning}
          />
        )}
      </div>

      {/* Right Column: Summary & Tools (4 cols) */}
      <div className="lg:col-span-4 space-y-6 sticky top-6">
        {/* Latest Scan Card */}
        {latestScan && (
          <div className="card bg-base-100 shadow-xl border border-primary/20 overflow-hidden">
            <div className="bg-primary/5 p-4 border-b border-primary/10">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Package className="h-5 w-5" />
                Latest Scan
              </h3>
            </div>
            <div className="card-body p-4 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">Version</span>
                <span className="font-mono font-bold">{latestScan.version_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">Date</span>
                <span className="text-sm text-right">{new Date(latestScan.scan_timestamp).toLocaleString()}</span>
              </div>
              <div className="divider my-0"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 bg-base-200 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{latestScan.total_count}</div>
                  <div className="text-xs text-base-content/70">Dependencies</div>
                </div>
                <div className="text-center p-2 bg-base-200 rounded-lg">
                  <div className="text-2xl font-bold text-base-content">
                    {latestScan.package_managers.length}
                  </div>
                  <div className="text-xs text-base-content/70">Managers</div>
                </div>
              </div>
              {latestScan.commit_hash && (
                <div className="text-xs text-center text-base-content/50 font-mono mt-2">
                  {latestScan.branch} @ {latestScan.commit_hash.substring(0, 7)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Tool */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body p-4">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Compare Versions
            </h3>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                <div className="text-xs text-base-content/60 mb-1">From (A)</div>
                <div className="font-mono font-bold text-sm truncate">
                  {selectedVersions.from || "Select..."}
                </div>
              </div>
              <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                <div className="text-xs text-base-content/60 mb-1">To (B)</div>
                <div className="font-mono font-bold text-sm truncate">
                  {selectedVersions.to || "Select..."}
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={handleCompare}
              disabled={!selectedVersions.from || !selectedVersions.to || loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Compare Versions"
              )}
            </button>
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="card bg-base-100 shadow-xl border border-base-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="card-body p-4">
              <h3 className="font-bold text-base mb-3">Changes</h3>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex flex-col items-center p-2 bg-success/10 rounded-lg text-success">
                  <TrendingUp className="h-4 w-4 mb-1" />
                  <span className="font-bold">{comparison.added_count}</span>
                  <span className="text-[10px]">Added</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-error/10 rounded-lg text-error">
                  <TrendingDown className="h-4 w-4 mb-1" />
                  <span className="font-bold">{comparison.removed_count}</span>
                  <span className="text-[10px]">Removed</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-warning/10 rounded-lg text-warning">
                  <AlertCircle className="h-4 w-4 mb-1" />
                  <span className="font-bold">{comparison.updated_count}</span>
                  <span className="text-[10px]">Updated</span>
                </div>
              </div>

              {comparison.changes.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {comparison.changes.map((change) => (
                    <div key={`${change.dependency_name}-${change.package_manager}-${change.change_type}`} className="text-sm p-2 bg-base-200 rounded border border-base-300">
                      <div className="flex items-center gap-2 mb-1">
                        {getChangeIcon(change.change_type)}
                        <span className="font-semibold truncate flex-1">{change.dependency_name}</span>
                      </div>
                      <div className="text-xs pl-6">
                        {change.change_type === "added" && (
                          <span className="text-success">+ {change.new_version}</span>
                        )}
                        {change.change_type === "removed" && (
                          <span className="text-error">- {change.old_version}</span>
                        )}
                        {change.change_type === "updated" && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="opacity-70">{change.old_version}</span>
                            <span>→</span>
                            <span className="text-warning font-bold">{change.new_version}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-base-content/60 bg-base-200/50 rounded-lg border border-dashed border-base-300">
                  No changes detected between these versions.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
