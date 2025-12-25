"use client";

import React from "react";
import { RepositorySelector } from "./RepositorySelector";

interface RepositoryEmptyStateProps {
    /** Currently selected repositories */
    readonly selectedRepos: string[];
    /** Callback when selection changes */
    readonly onSelectionChange: (repos: string[]) => void;
    /** Custom title text */
    readonly title?: string;
    /** Custom description text */
    readonly description?: string;
    /** Icon element to display */
    readonly icon?: React.ReactNode;
}

/**
 * Empty state component shown when no repository is selected for visualization.
 * Provides a consistent UI across KnowledgeGraph, CollapsibleTree, and HierarchicalEdgeBundling.
 */
export const RepositoryEmptyState: React.FC<RepositoryEmptyStateProps> = ({
    selectedRepos,
    onSelectionChange,
    title = "Select a Repository",
    description = "Choose one or more repositories from the dropdown above to visualize the data.",
    icon,
}) => {
    const defaultIcon = (
        <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );

    return (
        <div className="flex flex-col items-center justify-center h-full bg-base-100 p-8 relative">
            {/* Repository Selector Dropdown - Top Right */}
            <div className="absolute top-4 right-4 z-10">
                <RepositorySelector
                    selectedRepos={selectedRepos}
                    onSelectionChange={onSelectionChange}
                />
            </div>

            {/* Prompt Message */}
            <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    {icon || defaultIcon}
                </div>
                <h3 className="text-xl font-semibold text-base-content mb-2">{title}</h3>
                <p className="text-base-content/60 max-w-sm">{description}</p>
            </div>
        </div>
    );
};
