"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Calendar, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useScanVersions, ScanVersion } from "@/hooks/useScanVersions";

interface ScanVersionSelectorProps {
    /** Repository ID (e.g., "owner/repo-name") */
    readonly repositoryId: string;
    /** Currently selected version ID */
    readonly selectedVersionId: string | null;
    /** Callback when version changes */
    readonly onVersionChange: (versionId: string, scanId: string) => void;
    /** Optional class name */
    readonly className?: string;
}

// Helper: format version label
function formatVersionLabel(
    version: ScanVersion,
    index: number,
    total: number
): string {
    const versionRegex = /v(\d+)_(\d{4})-(\d{2})-(\d{2})/;
    const versionMatch = versionRegex.exec(version.version_id);
    if (versionMatch) {
        const vNum = versionMatch[1];
        const date = `${versionMatch[3]}/${versionMatch[4]}`;
        return `v${vNum} (${date})`;
    }
    return `v${total - index}`;
}

// Helper: format relative time
function formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
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

export function ScanVersionSelector({
    repositoryId,
    selectedVersionId,
    onVersionChange,
    className = "",
}: ScanVersionSelectorProps) {
    const { githubToken } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    // Extract repo name from repositoryId for the API
    const repoName = repositoryId.includes("/")
        ? repositoryId.split("/")[1]
        : repositoryId;

    const { versions, isLoading, error, refetch } = useScanVersions(
        repositoryId,
        repoName,
        githubToken
    );

    // Auto-select latest version if none selected (only once)
    const hasAutoSelected = React.useRef(false);
    useEffect(() => {
        if (versions.length > 0 && !selectedVersionId && !hasAutoSelected.current) {
            hasAutoSelected.current = true;
            const latestVersion = versions[0];
            onVersionChange(latestVersion.version_id, latestVersion.version_id);
        }
    }, [versions, selectedVersionId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Get currently selected version object
    const selectedVersion = versions.find(
        (v) => v.version_id === selectedVersionId
    );
    const selectedIndex = versions.findIndex(
        (v) => v.version_id === selectedVersionId
    );

    if (!repositoryId) {
        return null;
    }

    return (
        <div className={`relative ${className}`}>
            <button
                className="btn btn-sm bg-base-100 shadow-md border-base-300 hover:bg-base-200 transition-all font-normal gap-2"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading || versions.length === 0}
            >
                <Calendar className="w-3.5 h-3.5 text-secondary" />
                <span className="text-base-content">
                    {isLoading ? (
                        <span className="flex items-center gap-1">
                            <span className="loading loading-spinner loading-xs"></span>
                            Loading...
                        </span>
                    ) : versions.length === 0 ? (
                        "No versions"
                    ) : selectedVersion ? (
                        formatVersionLabel(selectedVersion, selectedIndex, versions.length)
                    ) : (
                        "Select version"
                    )}
                </span>
                <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        role="presentation"
                        tabIndex={-1}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setIsOpen(false);
                        }}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-64 max-h-72 overflow-y-auto bg-base-100 rounded-lg shadow-xl border border-base-300 z-50">
                        {error ? (
                            <div className="p-3 text-center text-error text-sm">
                                {error}
                                <button
                                    className="btn btn-xs btn-ghost mt-2"
                                    onClick={() => refetch()}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className="p-1.5 flex flex-col gap-0.5">
                                {versions.map((version, idx) => {
                                    const isSelected = version.version_id === selectedVersionId;
                                    const vulnSummary = version.vulnerability_summary;
                                    const hasVulns = vulnSummary && vulnSummary.total > 0;

                                    return (
                                        <button
                                            key={version.version_id}
                                            className={`btn btn-sm btn-ghost justify-start font-normal h-auto py-2 px-3 ${isSelected ? "bg-primary/10" : ""
                                                }`}
                                            onClick={() => {
                                                onVersionChange(
                                                    version.version_id,
                                                    version.version_id
                                                );
                                                setIsOpen(false);
                                            }}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded border flex items-center justify-center mr-2 shrink-0 ${isSelected
                                                    ? "bg-primary border-primary text-primary-content"
                                                    : "border-base-content/30"
                                                    }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                            <div className="flex flex-col items-start min-w-0 flex-1">
                                                <div className="flex items-center gap-2 w-full">
                                                    <span className="font-mono font-medium text-sm">
                                                        {formatVersionLabel(version, idx, versions.length)}
                                                    </span>
                                                    {idx === 0 && (
                                                        <span className="badge badge-xs badge-primary">
                                                            Latest
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-base-content/50 w-full">
                                                    <span>
                                                        {formatRelativeTime(version.scan_timestamp)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{version.total_count} deps</span>
                                                    {vulnSummary && (
                                                        <>
                                                            <span>•</span>
                                                            {hasVulns ? (
                                                                <span className="text-warning">
                                                                    {vulnSummary.total} vulns
                                                                </span>
                                                            ) : (
                                                                <span className="text-success">✓ Safe</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default ScanVersionSelector;
