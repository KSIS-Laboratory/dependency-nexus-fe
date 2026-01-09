"use client";

import { useEffect, useState } from "react";
import { GitBranch, Package, CirclePlus, CircleMinus, Diff, TrendingUp, TrendingDown, AlertCircle, History, Clock, ChevronDown, Eye, ArrowRightLeft } from "lucide-react";
import { useScanHistory } from "@/hooks/useScanHistory";
import type { DependencyScanVersion } from "@/lib/scan-history";
import { EmptyState } from "@/components/EmptyState";

interface ScanHistoryPanelProps {
  readonly repositoryId: string;
  readonly repositoryName: string;
  readonly token: string;
  readonly onViewVersion?: (version: DependencyScanVersion) => void;
  readonly onScan?: () => void;
  readonly isScanning?: boolean;
}

// Helper: format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Helper: format short version ID
function formatVersionId(versionId: string, index: number): string {
  // Extract date part if it's a timestamp-based ID
  const match = versionId.match(/v(\d+)_(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `v${match[1]} (${match[3]}/${match[4]})`;
  }
  return `v${index + 1}`;
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
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetchVersionList();
    fetchLatestScan();
  }, [fetchVersionList, fetchLatestScan]);

  // Auto-select latest two versions for comparison
  useEffect(() => {
    if (versionList && versionList.versions.length >= 2 && !selectedVersions.from && !selectedVersions.to) {
      setSelectedVersions({
        from: versionList.versions[0].version_id,
        to: versionList.versions[1].version_id,
      });
    }
  }, [versionList, selectedVersions.from, selectedVersions.to]);

  const handleCompare = async () => {
    if (selectedVersions.from && selectedVersions.to) {
      await compareScans(selectedVersions.from, selectedVersions.to);
      setShowComparison(true);
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
        return <CirclePlus className="h-4 w-4 text-success" />;
      case "removed":
        return <CircleMinus className="h-4 w-4 text-error" />;
      case "updated":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  if (loading && !versionList && !viewingVersionId) {
    return (
      <div className="flex items-center justify-center gap-3 py-16">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/70">Loading scan history...</p>
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

  if (!versionList || versionList.versions.length === 0) {
    return (
      <EmptyState
        title="No scan history found"
        description="Start scanning dependencies to track changes and build a history of your security posture."
        icon={History}
        onScan={onScan}
        isScanning={isScanning}
      />
    );
  }

  const versions = versionList.versions;

  return (
    <div className="space-y-6">
      {/* Summary Bar: Latest Scan + Compare Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latest Scan Summary */}
        {latestScan && (
          <div className="card bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Latest Scan
                </h3>
                <span className="badge badge-primary badge-outline badge-sm">
                  {formatRelativeTime(new Date(latestScan.scan_timestamp))}
                </span>
              </div>
              <div className="flex items-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-primary">{latestScan.total_count}</div>
                  <div className="text-xs text-base-content/60">Dependencies</div>
                </div>
                <div className="divider divider-horizontal m-0"></div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-base-content">{latestScan.package_managers.length}</div>
                  <div className="text-xs text-base-content/60">Package<br />Managers</div>
                </div>
                {latestScan.commit_hash && (
                  <>
                    <div className="divider divider-horizontal m-0"></div>
                    <div className="flex items-center gap-1 text-xs text-base-content/50 font-mono">
                      <GitBranch className="h-3 w-3" />
                      {latestScan.commit_hash.substring(0, 7)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compare Versions Tool */}
        <div className="card bg-base-100 border border-base-200">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-secondary" />
                Compare Versions
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {/* From Dropdown */}
              <div className="dropdown dropdown-bottom flex-1">
                <div tabIndex={0} role="button" className="btn btn-sm btn-outline w-full justify-between">
                  <span className="truncate text-xs">
                    {selectedVersions.from ? formatVersionId(selectedVersions.from, versions.findIndex(v => v.version_id === selectedVersions.from)) : "From..."}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </div>
                <ul tabIndex={0} className="dropdown-content z-50 menu p-1 shadow-lg bg-base-100 rounded-box w-56 max-h-48 overflow-auto border border-base-200">
                  {versions.map((v, idx) => (
                    <li key={v.version_id}>
                      <button
                        onClick={() => setSelectedVersions(prev => ({ ...prev, from: v.version_id }))}
                        className={`text-xs ${selectedVersions.from === v.version_id ? 'active' : ''}`}
                      >
                        <span className="font-mono">{formatVersionId(v.version_id, idx)}</span>
                        <span className="text-base-content/50">{formatRelativeTime(new Date(v.scan_timestamp))}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <span className="text-base-content/50">→</span>

              {/* To Dropdown */}
              <div className="dropdown dropdown-bottom flex-1">
                <div tabIndex={0} role="button" className="btn btn-sm btn-outline w-full justify-between">
                  <span className="truncate text-xs">
                    {selectedVersions.to ? formatVersionId(selectedVersions.to, versions.findIndex(v => v.version_id === selectedVersions.to)) : "To..."}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </div>
                <ul tabIndex={0} className="dropdown-content z-50 menu p-1 shadow-lg bg-base-100 rounded-box w-56 max-h-48 overflow-auto border border-base-200">
                  {versions.map((v, idx) => (
                    <li key={v.version_id}>
                      <button
                        onClick={() => setSelectedVersions(prev => ({ ...prev, to: v.version_id }))}
                        className={`text-xs ${selectedVersions.to === v.version_id ? 'active' : ''}`}
                      >
                        <span className="font-mono">{formatVersionId(v.version_id, idx)}</span>
                        <span className="text-base-content/50">{formatRelativeTime(new Date(v.scan_timestamp))}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Compare Button */}
              <button
                className="btn btn-sm btn-primary"
                onClick={handleCompare}
                disabled={!selectedVersions.from || !selectedVersions.to || loading}
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
      </div>

      {/* Comparison Results (Expandable) */}
      {comparison && showComparison && (
        <div className="card bg-base-100 border border-base-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Diff className="h-5 w-5 text-success" />
                Comparison Results
              </h3>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setShowComparison(false)}
              >
                ✕
              </button>
            </div>

            {/* Change Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl">
                <CirclePlus className="h-6 w-6 text-success" />
                <div>
                  <div className="text-2xl font-bold text-success">{comparison.added_count}</div>
                  <div className="text-xs text-success/70">Added</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-error/10 rounded-xl">
                <CircleMinus className="h-6 w-6 text-error" />
                <div>
                  <div className="text-2xl font-bold text-error">{comparison.removed_count}</div>
                  <div className="text-xs text-error/70">Removed</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-xl">
                <AlertCircle className="h-6 w-6 text-warning" />
                <div>
                  <div className="text-2xl font-bold text-warning">{comparison.updated_count}</div>
                  <div className="text-xs text-warning/70">Updated</div>
                </div>
              </div>
            </div>

            {/* Changes List */}
            {comparison.changes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {comparison.changes.map((change) => (
                  <div
                    key={`${change.dependency_name}-${change.package_manager}-${change.change_type}`}
                    className="flex items-center gap-2 p-2 bg-base-200/50 rounded-lg text-sm"
                  >
                    {getChangeIcon(change.change_type)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{change.dependency_name}</div>
                      <div className="text-xs text-base-content/60">
                        {change.change_type === "added" && (
                          <span className="text-success">+ {change.new_version}</span>
                        )}
                        {change.change_type === "removed" && (
                          <span className="text-error">- {change.old_version}</span>
                        )}
                        {change.change_type === "updated" && (
                          <span>{change.old_version} → <span className="text-warning font-semibold">{change.new_version}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-base-content/50 bg-base-200/30 rounded-lg">
                No changes detected between these versions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Table (Full Width) */}
      <div className="card bg-base-100 border border-base-200 overflow-hidden">
        <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/30">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Scan History
          </h3>
          <span className="badge badge-ghost">{versions.length} scans</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead className="bg-base-200/50">
              <tr>
                <th className="w-12">#</th>
                <th>Version</th>
                <th>Date</th>
                <th>Dependencies</th>
                <th>Security</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version, idx) => (
                <tr key={version.version_id} className="hover">
                  <td>
                    <span className="badge badge-ghost badge-sm font-mono">
                      {versions.length - idx}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono font-semibold text-sm">
                        {formatVersionId(version.version_id, idx)}
                      </span>
                      {version.commit_hash && (
                        <div className="flex items-center gap-1 text-xs text-base-content/50">
                          <GitBranch className="h-3 w-3" />
                          <span className="font-mono">{version.commit_hash.substring(0, 7)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm">{new Date(version.scan_timestamp).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-xs text-base-content/50">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(new Date(version.scan_timestamp))}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary/60" />
                      <span className="font-semibold">{version.total_count}</span>
                    </div>
                  </td>
                  <td>
                    {version.vulnerability_summary ? (
                      <div className="flex gap-1 flex-wrap">
                        {version.vulnerability_summary.total > 0 ? (
                          <>
                            {version.vulnerability_summary.critical > 0 && (
                              <span className="badge badge-error badge-xs">{version.vulnerability_summary.critical} C</span>
                            )}
                            {version.vulnerability_summary.high > 0 && (
                              <span className="badge badge-warning badge-xs">{version.vulnerability_summary.high} H</span>
                            )}
                            {version.vulnerability_summary.moderate > 0 && (
                              <span className="badge badge-accent badge-xs">{version.vulnerability_summary.moderate} M</span>
                            )}
                            {version.vulnerability_summary.low > 0 && (
                              <span className="badge badge-info badge-xs">{version.vulnerability_summary.low} L</span>
                            )}
                          </>
                        ) : (
                          <span className="badge badge-success badge-xs gap-1">✓ Safe</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-base-content/30 text-xs">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => handleViewDetail(version.version_id)}
                        disabled={viewingVersionId === version.version_id}
                        title="View Details"
                      >
                        {viewingVersionId === version.version_id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
