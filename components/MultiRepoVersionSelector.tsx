"use client";

import React, { useState, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { ChevronDown, Calendar, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/query-keys";

interface ScanVersion {
    version_id: string;
    scan_timestamp: string;
    total_count: number;
    vulnerability_summary?: {
        total: number;
        critical: number;
        high: number;
        moderate: number;
        low: number;
    };
}

interface MultiRepoVersionSelectorProps {
    /** Array of repository IDs (e.g., ["owner/repo1", "owner/repo2"]) */
    readonly repositoryIds: string[];
    /** Map of repositoryId -> selected versionId/scanId */
    readonly selectedVersions: Record<
        string,
        { versionId: string; scanId: string }
    >;
    /** Callback when any version changes */
    readonly onVersionsChange: (
        versions: Record<string, { versionId: string; scanId: string }>
    ) => void;
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

// Helper: get repo display name
function getRepoDisplayName(repoId: string): string {
    return repoId.includes("/") ? repoId.split("/")[1] : repoId;
}

// Fetch function for versions
async function fetchVersionsForRepo(
    repoId: string,
    githubToken: string
): Promise<ScanVersion[]> {
    const repoName = repoId.includes("/") ? repoId.split("/")[1] : repoId;
    const response = await fetch(
        `${API_BASE_URL}/api/scan-history/repositories/${encodeURIComponent(
            repoId
        )}/versions?repository_name=${encodeURIComponent(repoName)}`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
    );

    if (response.status === 404) {
        return [];
    }

    if (!response.ok) {
        throw new Error("Failed to fetch versions");
    }

    const data = await response.json();
    // Ensure we always return an array
    return Array.isArray(data.versions) ? data.versions : [];
}

export function MultiRepoVersionSelector({
    repositoryIds,
    selectedVersions,
    onVersionsChange,
    className = "",
}: MultiRepoVersionSelectorProps) {
    const { githubToken } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    // Use useQueries for parallel fetching of all repos
    const queries = useQueries({
        queries: repositoryIds.map((repoId) => {
            const repoName = repoId.includes("/") ? repoId.split("/")[1] : repoId;
            return {
                queryKey: queryKeys.scanHistory.versions(repoId, repoName),
                queryFn: () => fetchVersionsForRepo(repoId, githubToken!),
                enabled: !!githubToken,
                staleTime: 2 * 60 * 1000, // 2 minutes
            };
        }),
    });

    // Build versionsByRepo from queries
    const versionsByRepo: Record<string, ScanVersion[]> = {};
    const loadingRepos = new Set<string>();

    repositoryIds.forEach((repoId, idx) => {
        const query = queries[idx];
        if (query.isLoading) {
            loadingRepos.add(repoId);
        }
        // Ensure data is always an array
        const queryData = query.data;
        versionsByRepo[repoId] = Array.isArray(queryData) ? queryData : [];
    });

    // Auto-select latest version for repos without selection (only once per repo)
    const autoSelectedRepos = React.useRef<Set<string>>(new Set());
    useEffect(() => {
        const updates: Record<string, { versionId: string; scanId: string }> = {};

        repositoryIds.forEach((repoId, idx) => {
            const versions = queries[idx].data;
            if (
                versions &&
                versions.length > 0 &&
                !selectedVersions[repoId] &&
                !autoSelectedRepos.current.has(repoId)
            ) {
                autoSelectedRepos.current.add(repoId);
                const latest = versions[0];
                updates[repoId] = {
                    versionId: latest.version_id,
                    scanId: latest.version_id,
                };
            }
        });

        if (Object.keys(updates).length > 0) {
            onVersionsChange({ ...selectedVersions, ...updates });
        }
    }, [repositoryIds.join(","), queries.map(q => q.data?.length ?? 0).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle version selection for a specific repo
    const handleVersionSelect = (repoId: string, version: ScanVersion) => {
        onVersionsChange({
            ...selectedVersions,
            [repoId]: { versionId: version.version_id, scanId: version.version_id },
        });
    };

    // Get summary text
    const getSummaryText = (): string => {
        const count = Object.keys(selectedVersions).length;
        if (count === 0) return "Select versions";
        if (count === 1) {
            const [repoId, { versionId }] = Object.entries(selectedVersions)[0];
            const repoVersions = versionsByRepo[repoId];
            // Defensive check: ensure versions is an array
            const versions = Array.isArray(repoVersions) ? repoVersions : [];
            const version = versions.find((v) => v.version_id === versionId);
            const idx = versions.findIndex((v) => v.version_id === versionId);
            return version
                ? formatVersionLabel(version, idx, versions.length)
                : versionId;
        }
        return `${count} repo versions`;
    };

    if (repositoryIds.length === 0) return null;

    return (
        <div className={`relative ${className}`}>
            <button
                className="btn btn-sm bg-base-100 shadow-md border-base-300 hover:bg-base-200 transition-all font-normal gap-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Calendar className="w-3.5 h-3.5 text-secondary" />
                <span className="text-base-content">{getSummaryText()}</span>
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

                    {/* Dropdown Panel */}
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-base-100 rounded-lg shadow-xl border border-base-300 z-50">
                        <div className="p-2 border-b border-base-200 flex justify-between items-center">
                            <span className="text-sm font-medium text-base-content/70">
                                Version per Repository
                            </span>
                            <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="p-2 space-y-3">
                            {repositoryIds.map((repoId) => {
                                const versions = versionsByRepo[repoId] || [];
                                const selectedVersion = selectedVersions[repoId];
                                const isLoading = loadingRepos.has(repoId);

                                return (
                                    <div key={repoId} className="space-y-1">
                                        <div className="text-xs font-semibold text-base-content/60 px-1">
                                            {getRepoDisplayName(repoId)}
                                        </div>

                                        {isLoading ? (
                                            <div className="flex items-center gap-2 px-2 py-1 text-xs text-base-content/50">
                                                <span className="loading loading-spinner loading-xs"></span>
                                                Loading versions...
                                            </div>
                                        ) : versions.length === 0 ? (
                                            <div className="text-xs text-base-content/50 px-2 py-1">
                                                No versions found
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {versions.slice(0, 5).map((version, idx) => {
                                                    const isSelected =
                                                        selectedVersion?.versionId === version.version_id;
                                                    const vulnCount =
                                                        version.vulnerability_summary?.total || 0;

                                                    return (
                                                        <button
                                                            key={version.version_id}
                                                            className={`btn btn-xs ${isSelected
                                                                ? "btn-primary"
                                                                : "btn-ghost border border-base-300"
                                                                }`}
                                                            onClick={() =>
                                                                handleVersionSelect(repoId, version)
                                                            }
                                                            title={`${formatRelativeTime(
                                                                version.scan_timestamp
                                                            )} • ${version.total_count} deps • ${vulnCount} vulns`}
                                                        >
                                                            {formatVersionLabel(
                                                                version,
                                                                idx,
                                                                versions.length
                                                            )}
                                                            {idx === 0 && !isSelected && (
                                                                <span className="ml-1 text-[10px] opacity-60">
                                                                    latest
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default MultiRepoVersionSelector;
