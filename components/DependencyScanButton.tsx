"use client";

import { useState } from "react";
import { Scan, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { useScanHistory } from "@/hooks/useScanHistory";
import type { DependencyItem } from "@/lib/scan-history";

interface DependencyScanButtonProps {
  repositoryId: string;
  repositoryName: string;
  dependencies: Array<{
    name: string;
    version: string;
    packageManager: string;
    filePath?: string;
  }>;
  commitHash?: string;
  branch?: string;
  token: string;
  onScanComplete?: (hasChanges: boolean, changeCount: number) => void;
}

export function DependencyScanButton({
  repositoryId,
  repositoryName,
  dependencies,
  commitHash,
  branch = "main",
  token,
  onScanComplete,
}: DependencyScanButtonProps) {
  const { detectAndCreateScan, loading, changeDetection } = useScanHistory({ token });
  const [showResults, setShowResults] = useState(false);

  const handleScan = async () => {
    try {
      const deps: DependencyItem[] = dependencies.map((dep) => ({
        name: dep.name,
        version: dep.version,
        package_manager: dep.packageManager,
        file_path: dep.filePath,
      }));

      const result = await detectAndCreateScan({
        repository_id: repositoryId,
        repository_name: repositoryName,
        branch,
        commit_hash: commitHash,
        dependencies: deps,
      });

      setShowResults(true);

      if (onScanComplete) {
        onScanComplete(result.has_changes, result.changes.length);
      }

      // Auto-hide results after 5 seconds
      setTimeout(() => setShowResults(false), 5000);
    } catch (error) {
      console.error("Scan error:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scan Button */}
      <button
        className="btn btn-primary gap-2"
        onClick={handleScan}
        disabled={loading || dependencies.length === 0}
      >
        {loading ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            กำลังตรวจสอบ...
          </>
        ) : (
          <>
            <Scan className="h-5 w-5" />
            สแกนและบันทึก Version
          </>
        )}
      </button>

      {/* Results Toast */}
      {showResults && changeDetection && (
        <div className="toast toast-top toast-end z-50">
          <div
            className={`alert ${
              changeDetection.has_changes ? "alert-warning" : "alert-success"
            } shadow-lg`}
          >
            <div className="flex items-start gap-3">
              {changeDetection.has_changes ? (
                <AlertTriangle className="h-6 w-6 shrink-0" />
              ) : (
                <CheckCircle className="h-6 w-6 shrink-0" />
              )}
              <div>
                <h3 className="font-bold">
                  {changeDetection.has_changes
                    ? "พบการเปลี่ยนแปลง!"
                    : "ไม่มีการเปลี่ยนแปลง"}
                </h3>
                <div className="text-sm">
                  {changeDetection.has_changes ? (
                    <>
                      <p>Version: {changeDetection.current_version_id}</p>
                      <p className="mt-1">
                        เปลี่ยนแปลง {changeDetection.changes.length} รายการ
                      </p>
                      {changeDetection.comparison && (
                        <div className="flex gap-3 mt-2">
                          <span className="badge badge-success badge-sm">
                            +{changeDetection.comparison.added_count}
                          </span>
                          <span className="badge badge-error badge-sm">
                            -{changeDetection.comparison.removed_count}
                          </span>
                          <span className="badge badge-warning badge-sm">
                            ↻{changeDetection.comparison.updated_count}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p>ใช้ข้อมูลจาก S3</p>
                      <p className="text-xs opacity-70">
                        Version: {changeDetection.current_version_id}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Results Card */}
      {changeDetection && changeDetection.has_changes && showResults && (
        <div className="card bg-base-100 shadow-xl border border-warning">
          <div className="card-body">
            <h3 className="card-title text-warning">
              <TrendingUp className="h-5 w-5" />
              รายละเอียดการเปลี่ยนแปลง
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {changeDetection.changes.map((change, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-base-200 rounded"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{change.dependency_name}</div>
                    <div className="text-xs text-base-content/70">
                      {change.change_type === "added" && (
                        <span className="text-success">+ {change.new_version}</span>
                      )}
                      {change.change_type === "removed" && (
                        <span className="text-error">- {change.old_version}</span>
                      )}
                      {change.change_type === "updated" && (
                        <span>
                          {change.old_version} → {change.new_version}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-xs badge-outline">
                      {change.package_manager}
                    </span>
                    {change.change_type === "added" && (
                      <span className="badge badge-success badge-xs">NEW</span>
                    )}
                    {change.change_type === "removed" && (
                      <span className="badge badge-error badge-xs">DEL</span>
                    )}
                    {change.change_type === "updated" && (
                      <span className="badge badge-warning badge-xs">UPD</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
