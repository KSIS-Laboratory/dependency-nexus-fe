"use client";

import { Loader2, AlertCircle, CheckCircle, Package, Shield, Database, Zap } from "lucide-react";
import type { ScanJobStatus } from "@/hooks/useBackgroundScan";

interface BackgroundScanProgressProps {
    readonly status: ScanJobStatus | null;
    readonly progress: number;
    readonly message: string;
    readonly scannedPackages: number;
    readonly totalPackages: number;
    readonly totalVulnerabilities: number;
    readonly error?: string | null;
    readonly onCancel?: () => void;
}

/**
 * Progress indicator for background scan jobs
 * Shows real-time progress with package counts
 */
export function BackgroundScanProgress({
    status,
    progress,
    message,
    scannedPackages,
    totalPackages,
    totalVulnerabilities,
    error,
    onCancel,
}: BackgroundScanProgressProps) {
    if (!status) return null;

    const isScanning = status === "pending" || status === "in_progress";
    const isComplete = status === "completed";
    const isFailed = status === "failed";

    return (
        <div
            className={`
        alert shadow-lg w-full
        ${isComplete ? "bg-success/10 border-success/20" : ""}
        ${isFailed ? "bg-error/10 border-error/20" : ""}
        ${isScanning ? "bg-info/10 border-info/20" : ""}
      `}
        >
            <div className="w-full space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {isScanning && <Loader2 className="h-5 w-5 animate-spin text-info" />}
                        {isComplete && <CheckCircle className="h-5 w-5 text-success" />}
                        {isFailed && <AlertCircle className="h-5 w-5 text-error" />}

                        <div>
                            <h3 className="font-semibold text-base-content">
                                {isScanning && "Scanning in Progress"}
                                {isComplete && "Scan Complete!"}
                                {isFailed && "Scan Failed"}
                            </h3>
                            <p className="text-sm text-base-content/70">{message}</p>
                        </div>
                    </div>

                    {isScanning && onCancel && (
                        <button
                            onClick={onCancel}
                            className="btn btn-ghost btn-xs"
                            type="button"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {/* Progress bar */}
                {isScanning && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-base-content/60">
                            <span>{progress}%</span>
                            <span>
                                {scannedPackages}/{totalPackages} packages
                            </span>
                        </div>
                        <progress
                            className="progress progress-info w-full"
                            value={progress}
                            max="100"
                        />
                    </div>
                )}

                {/* Stats */}
                {(isScanning || isComplete) && (
                    <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1.5 text-base-content/80">
                            <Package className="h-4 w-4" />
                            <span>
                                {scannedPackages}/{totalPackages} packages
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-base-content/80">
                            <Shield className="h-4 w-4" />
                            <span>
                                {totalVulnerabilities} vulnerabilities found
                            </span>
                        </div>
                        {isComplete && (
                            <div className="flex items-center gap-1.5 text-success">
                                <Database className="h-4 w-4" />
                                <span>Saved to history</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Error display */}
                {isFailed && error && (
                    <div className="text-sm text-error bg-error/10 rounded-lg p-2">
                        {error}
                    </div>
                )}

                {/* Hint for background scanning */}
                {isScanning && (
                    <div className="flex items-center gap-2 text-xs text-base-content/50 pt-1 border-t border-base-content/10">
                        <Zap className="h-3 w-3" />
                        <span>You can navigate away - the scan will continue in the background</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Minimal inline progress badge
 */
export function ScanProgressBadge({
    status,
    progress,
}: {
    status: ScanJobStatus | null;
    progress: number;
}) {
    if (!status) return null;

    if (status === "pending" || status === "in_progress") {
        return (
            <span className="badge badge-info gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Scanning {progress}%
            </span>
        );
    }

    if (status === "completed") {
        return (
            <span className="badge badge-success gap-1">
                <CheckCircle className="h-3 w-3" />
                Complete
            </span>
        );
    }

    if (status === "failed") {
        return (
            <span className="badge badge-error gap-1">
                <AlertCircle className="h-3 w-3" />
                Failed
            </span>
        );
    }

    return null;
}
