"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GitBranch, ChevronUp, X, RefreshCw, Check } from "lucide-react";
import { API_URL } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

interface ChatRepoSelectorProps {
    selectedRepo: string | null;
    onSelectionChange: (repo: string | null) => void;
    className?: string;
}

/**
 * Compact repository selector designed for ChatbotWidget
 * Shows dropdown upward with @repo_name format
 */
export const ChatRepoSelector: React.FC<ChatRepoSelectorProps> = ({
    selectedRepo,
    onSelectionChange,
    className = "",
}) => {
    const { githubToken } = useAuth();
    const [availableRepos, setAvailableRepos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRepos = useCallback(async () => {
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
                    const scannedRepos = data.repositories
                        .filter((r: { has_history?: boolean }) => r.has_history)
                        .map((r: { name: string }) => r.name);
                    setAvailableRepos(scannedRepos);
                }
            } else {
                setError("Failed to load");
            }
        } catch {
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    }, [githubToken]);

    useEffect(() => {
        fetchRepos();
    }, [fetchRepos]);

    const handleSelect = (repo: string) => {
        if (selectedRepo === repo) {
            onSelectionChange(null);
        } else {
            onSelectionChange(repo);
        }
        setIsOpen(false);
    };

    const getShortName = (repo: string) => {
        return repo.split('/').pop() || repo;
    };

    const renderDropdownContent = () => {
        if (loading) {
            return (
                <div className="p-3 text-center text-xs text-base-content/60">
                    <span className="loading loading-spinner loading-xs mr-2" />
                    <span>กำลังโหลด...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-3 text-center text-xs text-error">
                    <span>{error}</span>
                </div>
            );
        }

        if (availableRepos.length === 0) {
            return (
                <div className="p-3 text-center text-xs text-base-content/60">
                    <span>ไม่พบ repository ที่ scan แล้ว</span>
                </div>
            );
        }

        return (
            <div className="p-1">
                {availableRepos.map(repo => (
                    <button
                        key={repo}
                        type="button"
                        className={`btn btn-xs btn-ghost w-full justify-start font-normal h-auto py-1.5 gap-2 ${selectedRepo === repo ? 'bg-primary/10 text-primary' : ''}`}
                        onClick={() => handleSelect(repo)}
                    >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selectedRepo === repo
                            ? 'bg-primary border-primary text-primary-content'
                            : 'border-base-content/30'
                            }`}>
                            {selectedRepo === repo && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <GitBranch className="w-3 h-3 opacity-50 shrink-0" />
                        <span className="truncate text-left text-xs" title={repo}>
                            {repo}
                        </span>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`btn btn-xs gap-1 ${selectedRepo
                    ? 'btn-primary'
                    : 'btn-ghost text-base-content/60 hover:text-base-content'
                    }`}
            >
                <GitBranch className="w-3 h-3" />
                {selectedRepo ? (
                    <span className="max-w-20 truncate">{getShortName(selectedRepo)}</span>
                ) : (
                    <span>Context</span>
                )}
                <ChevronUp className={`w-3 h-3 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
            </button>

            {/* Clear button when selected */}
            {selectedRepo && (
                <button
                    type="button"
                    onClick={() => onSelectionChange(null)}
                    className="btn btn-xs btn-circle btn-ghost ml-1"
                    title="ล้าง context"
                >
                    <X className="w-3 h-3" />
                </button>
            )}

            {/* Dropdown (opens upward) */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <button
                        type="button"
                        className="fixed inset-0 z-40 cursor-default bg-transparent border-none"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close dropdown"
                    />

                    {/* Dropdown Content */}
                    <div className="absolute bottom-full left-0 mb-2 w-56 max-h-48 overflow-y-auto bg-base-100 rounded-lg shadow-xl border border-base-300 z-50">
                        {/* Header */}
                        <div className="sticky top-0 bg-base-100 border-b border-base-200 p-2 flex justify-between items-center z-50">
                            <span className="text-xs font-medium text-base-content/70">
                                เลือก Repository Context
                            </span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fetchRepos(); }}
                                className="btn btn-xs btn-circle btn-ghost"
                                title="รีเฟรช"
                            >
                                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* Content */}
                        {renderDropdownContent()}
                    </div>
                </>
            )}
        </div>
    );
};
