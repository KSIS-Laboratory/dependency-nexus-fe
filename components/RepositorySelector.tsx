"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, RefreshCw, Check } from "lucide-react";
import { API_URL } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

interface RepositorySelectorProps {
    selectedRepos: string[];
    onSelectionChange: (repos: string[]) => void;
    multiSelect?: boolean;
    className?: string;
}

export const RepositorySelector: React.FC<RepositorySelectorProps> = ({
    selectedRepos,
    onSelectionChange,
    multiSelect = true,
    className = "",
}) => {
    const { githubToken } = useAuth();
    const [availableRepos, setAvailableRepos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRepos = async () => {
        if (!githubToken) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/github/repositories`, {
                headers: { Authorization: `Bearer ${githubToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.repositories && Array.isArray(data.repositories)) {
                    // Filter only repositories that have scan history
                    const scannedRepos = data.repositories
                        .filter((r: any) => r.has_history)
                        .map((r: any) => r.name);
                    setAvailableRepos(scannedRepos);
                }
            } else {
                setError("Failed to fetch repositories");
            }
        } catch (err) {
            console.error("Failed to fetch repos", err);
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRepos();
    }, [githubToken]);

    const handleSelect = (repo: string) => {
        if (multiSelect) {
            if (selectedRepos.includes(repo)) {
                onSelectionChange(selectedRepos.filter(r => r !== repo));
            } else {
                onSelectionChange([...selectedRepos, repo]);
            }
        } else {
            // Single select toggle
            if (selectedRepos.includes(repo)) {
                onSelectionChange([]);
            } else {
                onSelectionChange([repo]);
            }
            setIsDropdownOpen(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedRepos.length === availableRepos.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange([...availableRepos]);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className="flex gap-2">
                <div className="relative">
                    <button
                        className="btn btn-sm bg-base-100 shadow-md border-base-300 hover:bg-base-200 transition-all font-normal"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className="text-base-content flex items-center gap-2">
                            {selectedRepos.length === 0
                                ? "Select Scanned Repository"
                                : `${selectedRepos.length} Selected`}
                        </span>
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <>
                            {/* Backdrop to close dropdown on outside click */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsDropdownOpen(false)}
                            />

                            <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-base-100 rounded-lg shadow-xl border border-base-300 z-50 flex flex-col">
                                {loading ? (
                                    <div className="p-4 text-center text-sm text-base-content/60">
                                        <span className="loading loading-spinner loading-xs mr-2"></span>
                                        Loading repositories...
                                    </div>
                                ) : error ? (
                                    <div className="p-4 text-center text-error text-sm">
                                        {error}
                                        <button
                                            className="btn btn-xs btn-ghost mt-2"
                                            onClick={(e) => { e.stopPropagation(); fetchRepos(); }}
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : availableRepos.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-base-content/60">
                                        No scanned repositories found.
                                        <br />
                                        <span className="text-xs opacity-70">Run a scan first to see it here.</span>
                                    </div>
                                ) : (
                                    <>
                                        {multiSelect && (
                                            <div className="p-2 border-b border-base-200 sticky top-0 bg-base-100 z-10">
                                                <button
                                                    className={`btn btn-sm btn-ghost w-full justify-start font-normal ${selectedRepos.length === availableRepos.length ? 'text-primary' : ''}`}
                                                    onClick={handleSelectAll}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${selectedRepos.length === availableRepos.length ? 'bg-primary border-primary text-primary-content' : 'border-base-content/40'}`}>
                                                        {selectedRepos.length === availableRepos.length && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <span className="truncate">
                                                        {selectedRepos.length === availableRepos.length ? "Deselect All" : "Select All Scanned"}
                                                    </span>
                                                </button>
                                            </div>
                                        )}

                                        <div className="p-2 flex flex-col gap-1">
                                            {availableRepos.map(repo => (
                                                <button
                                                    key={repo}
                                                    className="btn btn-sm btn-ghost justify-start font-normal h-auto py-2"
                                                    onClick={() => handleSelect(repo)}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 flex-shrink-0 ${selectedRepos.includes(repo) ? 'bg-primary border-primary text-primary-content has-checked' : 'border-base-content/40'}`}>
                                                        {selectedRepos.includes(repo) && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <span className="truncate text-left" title={repo}>{repo}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={fetchRepos}
                    className="btn btn-sm btn-circle bg-base-100 shadow-md border-base-300 hover:bg-base-200 transition-all"
                    title="Refresh Repositories"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>
        </div>
    );
};
