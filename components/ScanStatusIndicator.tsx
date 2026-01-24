"use client";

import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

export type ScanStatus = "fresh" | "warning" | "stale" | "never" | "unknown";

interface ScanStatusIndicatorProps {
    /** Last scan date - null if never scanned */
    lastScanDate: Date | null;
    /** Show as badge or inline text */
    variant?: "badge" | "text" | "dot";
    /** Show the date label */
    showDate?: boolean;
    /** Custom className */
    className?: string;
    /** Days threshold for warning (default: 30) */
    warningDays?: number;
    /** Days threshold for stale (default: 60) */
    staleDays?: number;
}

interface StatusConfig {
    status: ScanStatus;
    label: string;
    badgeClass: string;
    dotClass: string;
    Icon: typeof CheckCircle;
}

/**
 * Calculate scan status based on days since last scan
 */
export function getScanStatus(
    daysSinceLastScan: number | null,
    warningDays: number = 30,
    staleDays: number = 60
): ScanStatus {
    if (daysSinceLastScan === null) return "never";
    if (daysSinceLastScan <= warningDays) return "fresh";
    if (daysSinceLastScan <= staleDays) return "warning";
    return "stale";
}

/**
 * Get configuration for a scan status
 */
export function getStatusConfig(status: ScanStatus): StatusConfig {
    const configs: Record<ScanStatus, StatusConfig> = {
        fresh: {
            status: "fresh",
            label: "Recently scanned",
            badgeClass: "badge-success",
            dotClass: "bg-success",
            Icon: CheckCircle,
        },
        warning: {
            status: "warning",
            label: "Scan recommended",
            badgeClass: "badge-warning",
            dotClass: "bg-warning",
            Icon: AlertTriangle,
        },
        stale: {
            status: "stale",
            label: "Scan overdue",
            badgeClass: "badge-error",
            dotClass: "bg-error",
            Icon: XCircle,
        },
        never: {
            status: "never",
            label: "Never scanned",
            badgeClass: "badge-ghost",
            dotClass: "bg-base-content/30",
            Icon: HelpCircle,
        },
        unknown: {
            status: "unknown",
            label: "Unknown",
            badgeClass: "badge-ghost",
            dotClass: "bg-base-content/20",
            Icon: HelpCircle,
        },
    };

    return configs[status];
}

/**
 * Format days since last scan as readable text
 */
function formatDaysText(days: number): string {
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
}

/**
 * Format badge text based on days and options
 */
function formatBadgeText(
    days: number,
    showDate: boolean,
    formattedDate: string | null
): string {
    if (days === 0) return "Today";
    if (days <= 7) return `${days}d`;
    if (showDate && formattedDate) return formattedDate;
    return `${days}d ago`;
}

export default function ScanStatusIndicator({
    lastScanDate,
    variant = "badge",
    showDate = false,
    className = "",
    warningDays = 30,
    staleDays = 60,
}: Readonly<ScanStatusIndicatorProps>) {
    // Calculate days since last scan
    const daysSinceLastScan = lastScanDate
        ? Math.floor((Date.now() - lastScanDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const status = getScanStatus(daysSinceLastScan, warningDays, staleDays);
    const config = getStatusConfig(status);
    const { Icon, label, badgeClass, dotClass } = config;

    // Format date for display
    const formattedDate = lastScanDate
        ? lastScanDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })
        : null;

    // Dot variant - minimal indicator
    if (variant === "dot") {
        return (
            <div className={`flex items-center gap-1.5 ${className}`} title={label}>
                <span className={`w-2 h-2 rounded-full ${dotClass} animate-pulse`} />
                {showDate && formattedDate && (
                    <span className="text-xs text-base-content/60">{formattedDate}</span>
                )}
            </div>
        );
    }

    // Text variant - inline with icon
    if (variant === "text") {
        const textContent =
            daysSinceLastScan !== null ? formatDaysText(daysSinceLastScan) : "Never";

        return (
            <div
                className={`flex items-center gap-1.5 text-xs ${className}`}
                title={label}
            >
                <Icon className="w-3.5 h-3.5" />
                <span className="opacity-80">{textContent}</span>
            </div>
        );
    }

    // Badge variant (default) - full badge with icon and label
    const badgeTitle =
        daysSinceLastScan !== null
            ? `Last scan: ${daysSinceLastScan} days ago`
            : "Never scanned";

    const badgeContent =
        daysSinceLastScan !== null
            ? formatBadgeText(daysSinceLastScan, showDate, formattedDate)
            : "Never";

    return (
        <div
            className={`badge ${badgeClass} badge-sm gap-1 font-medium ${className} truncate`}
            title={badgeTitle}
        >
            <Icon className="w-3 h-3" />
            {badgeContent}
        </div>
    );
}
