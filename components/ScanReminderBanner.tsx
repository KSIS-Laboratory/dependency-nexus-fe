"use client";

import { AlertTriangle, Scan, X, Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";

interface ScanReminderBannerProps {
    /** Last scan date - null if never scanned */
    lastScanDate: Date | null;
    /** Repository name for context */
    repositoryName?: string;
    /** Callback when user clicks scan button */
    onScanClick?: () => void;
    /** Number of days before showing warning (default: 30) */
    reminderDays?: number;
    /** Allow user to dismiss the banner */
    dismissible?: boolean;
    /** Persist dismiss state in localStorage */
    persistDismiss?: boolean;
}

export default function ScanReminderBanner({
    lastScanDate,
    repositoryName,
    onScanClick,
    reminderDays = 30,
    dismissible = true,
    persistDismiss = true,
}: Readonly<ScanReminderBannerProps>) {
    const [dismissed, setDismissed] = useState(false);

    // Storage key for persist dismiss
    const storageKey = repositoryName
        ? `scan-reminder-dismissed-${repositoryName}`
        : "scan-reminder-dismissed-global";

    // Check localStorage on mount
    useEffect(() => {
        if (persistDismiss) {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const { dismissedAt, lastScanDateStr } = JSON.parse(stored);
                // Re-show if scan date changed or dismissed more than 7 days ago
                const dismissedTime = new Date(dismissedAt).getTime();
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

                if (
                    dismissedTime > sevenDaysAgo &&
                    lastScanDateStr === lastScanDate?.toISOString()
                ) {
                    setDismissed(true);
                }
            }
        }
    }, [persistDismiss, storageKey, lastScanDate]);

    // Calculate days since last scan
    const daysSinceLastScan = lastScanDate
        ? Math.floor(
            (Date.now() - lastScanDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        : null;

    // Determine if we should show the banner
    const isFirstTime = !lastScanDate;
    const isOverdue = daysSinceLastScan !== null && daysSinceLastScan >= reminderDays;
    const shouldShow = !dismissed && (isFirstTime || isOverdue);

    if (!shouldShow) return null;

    const handleDismiss = () => {
        setDismissed(true);
        if (persistDismiss) {
            localStorage.setItem(
                storageKey,
                JSON.stringify({
                    dismissedAt: new Date().toISOString(),
                    lastScanDateStr: lastScanDate?.toISOString() ?? null,
                })
            );
        }
    };

    // Determine severity level for styling
    const getSeverityLevel = () => {
        if (isFirstTime) return "info";
        if (daysSinceLastScan! >= 90) return "error";
        if (daysSinceLastScan! >= 60) return "warning";
        return "warning";
    };

    const severity = getSeverityLevel();

    const alertClass = {
        info: "alert-info",
        warning: "alert-warning",
        error: "alert-error",
    }[severity];

    const IconComponent = {
        info: ShieldCheck,
        warning: AlertTriangle,
        error: ShieldAlert,
    }[severity];

    // Helper function to render description message based on scan status
    const renderDescriptionMessage = () => {
        if (isFirstTime) {
            return "Recommended to scan dependencies to check for vulnerabilities";
        }
        if (daysSinceLastScan! >= 90) {
            return " ⛔ Exceeded 90 days! Urgent scan to check for new vulnerabilities";
        }
        if (daysSinceLastScan! >= 60) {
            return "🔶 Exceeded 60 days! Recommended to scan dependencies to check for vulnerabilities";
        }
        return "Recommended to scan dependencies to check for vulnerabilities";
    };

    return (
        <div
            className={`alert ${alertClass} shadow-lg mb-4 animate-in fade-in slide-in-from-top-2 duration-300`}
            role="alert"
        >
            <IconComponent className="w-6 h-6 shrink-0" />

            <div className="flex-1">
                <h3 className="font-bold text-base">
                    {isFirstTime ? (
                        <>🔍 Never scanned dependencies</>
                    ) : (
                        <>
                            Scan last {daysSinceLastScan} days ago
                            {repositoryName && (
                                <span className="font-normal opacity-80"> ({repositoryName})</span>
                            )}
                        </>
                    )}
                </h3>
                <p className="text-sm opacity-80 mt-0.5">
                    {renderDescriptionMessage()}
                </p>

                {lastScanDate && (
                    <div className="flex items-center gap-1 text-xs opacity-60 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                            Scan last:{" "}
                            {lastScanDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {onScanClick && (
                    <button
                        className="btn btn-primary btn-sm gap-1"
                        onClick={onScanClick}
                    >
                        <Scan className="w-4 h-4" />
                        Scan Now
                    </button>
                )}

                {dismissible && (
                    <button
                        className="btn btn-ghost btn-sm btn-square"
                        onClick={handleDismiss}
                        aria-label="Dismiss reminder"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
