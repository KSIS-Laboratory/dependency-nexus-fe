"use client";

import React from "react";

interface RepositoryEmptyStateProps {
    /** Custom title text */
    readonly title?: string;
    /** Custom description text */
    readonly description?: string;
    /** Icon element to display */
    readonly icon?: React.ReactNode;
    /** Additional class names */
    readonly className?: string;
}

/**
 * Empty state content component shown when no repository is selected for visualization.
 * Does NOT include RepositorySelector - parent component should render it separately
 * to prevent dropdown from closing when first repo is selected.
 */
export const RepositoryEmptyState: React.FC<RepositoryEmptyStateProps> = ({
    title = "Select a Repository",
    description = "Choose one or more repositories from the dropdown above to visualize the data.",
    icon,
    className = "",
}) => {
    const defaultIcon = (
        <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );

    return (
        <div className={`absolute inset-0 flex items-center justify-center z-5 ${className} bg-base-200`}>
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

