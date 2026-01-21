"use client";

import React, { useState, useMemo } from "react";
import { Filter, ChevronDown, X } from "lucide-react";
import { Repository } from "@/lib/github";

export interface RepositoryFilters {
    owners: string[];
    languages: string[];
    visibility: "all" | "public" | "private" | "fork" | "starred";
    scanned: "all" | "scanned" | "not_scanned";
}

interface RepositoryFilterBarProps {
    readonly repositories: Repository[];
    readonly filters: RepositoryFilters;
    readonly onFiltersChange: (filters: RepositoryFilters) => void;
}

export const defaultFilters: RepositoryFilters = {
    owners: [],
    languages: [],
    visibility: "all",
    scanned: "all",
};

// Helper function to get visibility label
function getVisibilityLabel(visibility: RepositoryFilters["visibility"]): string {
    const labels: Record<RepositoryFilters["visibility"], string> = {
        all: "All",
        public: "Public",
        private: "Private",
        fork: "Fork",
        starred: "Starred",
    };
    return labels[visibility];
}


export function RepositoryFilterBar({
    repositories,
    filters,
    onFiltersChange,
}: RepositoryFilterBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Extract unique values from repositories
    const { uniqueOwners, uniqueLanguages, stats } = useMemo(() => {
        const owners = new Set<string>();
        const languages = new Set<string>();
        let publicCount = 0;
        let privateCount = 0;
        let forkCount = 0;
        let starredCount = 0;
        let scannedCount = 0;

        repositories.forEach((repo) => {
            owners.add(repo.owner);
            if (repo.language) languages.add(repo.language);
            if (repo.private) privateCount++;
            else publicCount++;
            if (repo.fork) forkCount++;
            if (repo.is_starred) starredCount++;
            if (repo.has_history) scannedCount++;
        });

        return {
            uniqueOwners: Array.from(owners).sort((a, b) => a.localeCompare(b)),
            uniqueLanguages: Array.from(languages).sort((a, b) => a.localeCompare(b)),
            stats: { publicCount, privateCount, forkCount, starredCount, scannedCount },
        };
    }, [repositories]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.owners.length > 0) count++;
        if (filters.languages.length > 0) count++;
        if (filters.visibility !== "all") count++;
        if (filters.scanned !== "all") count++;
        return count;
    }, [filters]);

    const handleOwnerToggle = (owner: string) => {
        const newOwners = filters.owners.includes(owner)
            ? filters.owners.filter((o) => o !== owner)
            : [...filters.owners, owner];
        onFiltersChange({ ...filters, owners: newOwners });
    };

    const handleLanguageToggle = (language: string) => {
        const newLanguages = filters.languages.includes(language)
            ? filters.languages.filter((l) => l !== language)
            : [...filters.languages, language];
        onFiltersChange({ ...filters, languages: newLanguages });
    };

    const handleVisibilityChange = (visibility: RepositoryFilters["visibility"]) => {
        onFiltersChange({ ...filters, visibility });
    };

    const handleScannedChange = (scanned: RepositoryFilters["scanned"]) => {
        onFiltersChange({ ...filters, scanned });
    };

    const clearAllFilters = () => {
        onFiltersChange(defaultFilters);
    };

    return (
        <div className="mb-6">
            {/* Filter Toggle Button */}
            <div className="flex items-center gap-2 mb-3">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`btn btn-sm gap-2 ${isExpanded ? "btn-primary" : "btn-ghost"}`}
                >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="badge badge-secondary badge-sm">{activeFilterCount}</span>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {/* Active Filter Pills */}
                {activeFilterCount > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {filters.owners.map((owner) => (
                            <span key={owner} className="badge badge-outline gap-1">
                                {owner}
                                <button onClick={() => handleOwnerToggle(owner)} className="hover:text-error">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                        {filters.languages.map((lang) => (
                            <span key={lang} className="badge badge-outline gap-1">
                                {lang}
                                <button onClick={() => handleLanguageToggle(lang)} className="hover:text-error">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                        {filters.visibility !== "all" && (
                            <span className="badge badge-outline gap-1">
                                {getVisibilityLabel(filters.visibility)}
                                <button onClick={() => handleVisibilityChange("all")} className="hover:text-error">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filters.scanned !== "all" && (
                            <span className="badge badge-outline gap-1">
                                {filters.scanned === "scanned" ? "Scanned" : "Not Scanned"}
                                <button onClick={() => handleScannedChange("all")} className="hover:text-error">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        <button onClick={clearAllFilters} className="btn btn-ghost btn-xs text-error">
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* Expanded Filter Panel */}
            {isExpanded && (
                <div className="card bg-base-100 border border-base-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Owner Filter */}
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-base-content/70">Owner</h4>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {uniqueOwners.map((owner) => (
                                    <label key={owner} className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm checkbox-primary"
                                            checked={filters.owners.includes(owner)}
                                            onChange={() => handleOwnerToggle(owner)}
                                        />
                                        <span className="text-sm truncate">{owner}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Language Filter */}
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-base-content/70">Language</h4>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {uniqueLanguages.length > 0 ? (
                                    uniqueLanguages.map((lang) => (
                                        <label key={lang} className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm checkbox-primary"
                                                checked={filters.languages.includes(lang)}
                                                onChange={() => handleLanguageToggle(lang)}
                                            />
                                            <span className="text-sm">{lang}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-sm text-base-content/50">No languages detected</p>
                                )}
                            </div>
                        </div>

                        {/* Visibility Filter */}
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-base-content/70">Visibility</h4>
                            <div className="space-y-1">
                                {(["all", "public", "private", "fork", "starred"] as const).map((option) => (
                                    <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-1 rounded">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            className="radio radio-sm radio-primary"
                                            checked={filters.visibility === option}
                                            onChange={() => handleVisibilityChange(option)}
                                        />
                                        <span className="text-sm capitalize">{option}</span>
                                        {option === "public" && <span className="text-xs text-base-content/50">({stats.publicCount})</span>}
                                        {option === "private" && <span className="text-xs text-base-content/50">({stats.privateCount})</span>}
                                        {option === "fork" && <span className="text-xs text-base-content/50">({stats.forkCount})</span>}
                                        {option === "starred" && <span className="text-xs text-base-content/50">({stats.starredCount})</span>}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Scanned Status Filter */}
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-base-content/70">Scan Status</h4>
                            <div className="space-y-1">
                                {(["all", "scanned", "not_scanned"] as const).map((option) => (
                                    <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-1 rounded">
                                        <input
                                            type="radio"
                                            name="scanned"
                                            className="radio radio-sm radio-primary"
                                            checked={filters.scanned === option}
                                            onChange={() => handleScannedChange(option)}
                                        />
                                        <span className="text-sm">
                                            {option === "all" ? "All" : option === "scanned" ? "Scanned" : "Not Scanned"}
                                        </span>
                                        {option === "scanned" && (
                                            <span className="text-xs text-base-content/50">({stats.scannedCount})</span>
                                        )}
                                        {option === "not_scanned" && (
                                            <span className="text-xs text-base-content/50">({repositories.length - stats.scannedCount})</span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Apply filters to a list of repositories
 */
export function applyRepositoryFilters(
    repositories: Repository[],
    filters: RepositoryFilters,
    searchQuery: string
): Repository[] {
    return repositories.filter((repo) => {
        // Search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                repo.name.toLowerCase().includes(query) ||
                repo.description?.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }

        // Owner filter
        if (filters.owners.length > 0 && !filters.owners.includes(repo.owner)) {
            return false;
        }

        // Language filter
        if (filters.languages.length > 0 && !filters.languages.includes(repo.language || "")) {
            return false;
        }

        // Visibility filter
        if (filters.visibility === "public" && repo.private) return false;
        if (filters.visibility === "private" && !repo.private) return false;
        if (filters.visibility === "fork" && !repo.fork) return false;
        if (filters.visibility === "starred" && !repo.is_starred) return false;

        // Scanned status filter
        if (filters.scanned === "scanned" && !repo.has_history) return false;
        if (filters.scanned === "not_scanned" && repo.has_history) return false;

        return true;
    });
}
