import React, { useState, useMemo } from "react";
import { Shield, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, ExternalLink, Package } from "lucide-react";
import { VulnerabilitySummary } from "@/components/VulnerabilitySummary";
import { EmptyState } from "@/components/EmptyState";
import { getSeverityFromScore, getSeverityBadgeClass } from "@/lib/severity";
import { VulnerabilityDetailModal } from "@/components/VulnerabilityDetailModal";

interface SecurityTabProps {
    hasVulnerabilityData: boolean;
    totalVulnerabilityCount: number;
    vulnerabilityData: any;
    scanFromCache: boolean;
    localIsScanning: boolean;
    onScan: () => void;
}

// Severity configuration
const SEVERITY_CONFIG = {
    CRITICAL: { label: "Critical", color: "badge-error", bgColor: "bg-error/10", borderColor: "border-error/30", icon: "🔴" },
    HIGH: { label: "High", color: "badge-warning", bgColor: "bg-warning/10", borderColor: "border-warning/30", icon: "🟡" },
    MODERATE: { label: "Moderate", color: "badge-accent", bgColor: "bg-accent/10", borderColor: "border-accent/30", icon: "🟢" },
    LOW: { label: "Low", color: "badge-info", bgColor: "bg-info/10", borderColor: "border-info/30", icon: "🔵" },
    UNKNOWN: { label: "Unknown", color: "badge-ghost", bgColor: "bg-base-200", borderColor: "border-base-300", icon: "⚪" },
};

type SeverityLevel = keyof typeof SEVERITY_CONFIG;

interface GroupedVuln {
    vuln: any;
    packageName: string;
}

// Compact vulnerability item component
function CompactVulnItem({ vuln, packageName, onView }: { vuln: any; packageName: string; onView: () => void }) {
    return (
        <div className="flex items-center gap-2 p-2 bg-base-100 hover:bg-base-200/50 rounded-lg border border-base-200 transition-colors group">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-base-content truncate">
                        {vuln.id}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <Package className="h-3 w-3 text-base-content/40" />
                    <span className="text-xs text-base-content/60 truncate">{packageName}</span>
                </div>
            </div>
            <button
                onClick={onView}
                className="btn btn-xs btn-ghost opacity-60 group-hover:opacity-100"
                title="View Details"
            >
                <ExternalLink className="h-3 w-3" />
            </button>
        </div>
    );
}

// Collapsible severity section
function SeveritySection({
    severity,
    vulns,
    defaultOpen = true
}: {
    severity: SeverityLevel;
    vulns: GroupedVuln[];
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [selectedVulnId, setSelectedVulnId] = useState<string | null>(null);
    const config = SEVERITY_CONFIG[severity];

    if (vulns.length === 0) return null;

    return (
        <div className={`rounded-xl border ${config.borderColor} overflow-hidden`}>
            {/* Header - Click to toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 ${config.bgColor} flex items-center justify-between hover:brightness-95 transition-all`}
            >
                <div className="flex items-center gap-3">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-base-content/60" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-base-content/60" />
                    )}
                    <span className="text-lg">{config.icon}</span>
                    <span className="font-bold text-base-content">{config.label}</span>
                    <span className={`badge ${config.color} badge-sm`}>
                        {vulns.length}
                    </span>
                </div>
                <span className="text-xs text-base-content/50">
                    {isOpen ? "Click to collapse" : "Click to expand"}
                </span>
            </button>

            {/* Content - Grid of compact items */}
            {isOpen && (
                <div className="p-3 bg-base-100/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {vulns.map(({ vuln, packageName }) => (
                            <CompactVulnItem
                                key={`${vuln.id}-${packageName}`}
                                vuln={vuln}
                                packageName={packageName}
                                onView={() => setSelectedVulnId(vuln.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedVulnId && (
                <VulnerabilityDetailModal
                    vulnId={selectedVulnId}
                    isOpen={!!selectedVulnId}
                    onClose={() => setSelectedVulnId(null)}
                />
            )}
        </div>
    );
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
    hasVulnerabilityData,
    totalVulnerabilityCount,
    vulnerabilityData,
    scanFromCache,
    localIsScanning,
    onScan,
}) => {
    // Group vulnerabilities by severity
    const groupedBySeverity = useMemo(() => {
        const groups: Record<SeverityLevel, GroupedVuln[]> = {
            CRITICAL: [],
            HIGH: [],
            MODERATE: [],
            LOW: [],
            UNKNOWN: [],
        };

        if (!vulnerabilityData?.results) return groups;

        vulnerabilityData.results.forEach((result: any) => {
            if (!result.vulnerabilities) return;

            result.vulnerabilities.forEach((vuln: any) => {
                const score = vuln.severity?.[0]?.score;
                const numScore = score ? Number.parseFloat(score) : 0;
                const severityLevel = getSeverityFromScore(numScore) as SeverityLevel;

                groups[severityLevel].push({
                    vuln,
                    packageName: result.package?.name || "Unknown Package",
                });
            });
        });

        return groups;
    }, [vulnerabilityData]);

    return (
        <div className="p-6 animate-in fade-in duration-300">
            {hasVulnerabilityData ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    {totalVulnerabilityCount > 0 ? (
                        <VulnerabilitySummary data={vulnerabilityData} />
                    ) : (
                        <div className="glass-card p-4 border-l-4 border-green-500">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                <div>
                                    <h3 className="font-bold text-green-600">Secure & Safe!</h3>
                                    <div className="text-sm text-[#778873]">
                                        No known vulnerabilities found in your dependencies.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grouped by Severity */}
                    {totalVulnerabilityCount > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#D2DCB6]">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <h3 className="font-bold text-lg text-[#2D3B2D]">Vulnerability Details</h3>
                                {scanFromCache && (
                                    <span className="badge bg-[#A1BC98] text-white border-none ml-auto gap-1">
                                        <Shield className="h-3 w-3" />
                                        Cached Result
                                    </span>
                                )}
                            </div>

                            {/* Severity Sections */}
                            <div className="space-y-3">
                                <SeveritySection
                                    severity="CRITICAL"
                                    vulns={groupedBySeverity.CRITICAL}
                                    defaultOpen={true}
                                />
                                <SeveritySection
                                    severity="HIGH"
                                    vulns={groupedBySeverity.HIGH}
                                    defaultOpen={true}
                                />
                                <SeveritySection
                                    severity="MODERATE"
                                    vulns={groupedBySeverity.MODERATE}
                                    defaultOpen={groupedBySeverity.CRITICAL.length === 0 && groupedBySeverity.HIGH.length === 0}
                                />
                                <SeveritySection
                                    severity="LOW"
                                    vulns={groupedBySeverity.LOW}
                                    defaultOpen={false}
                                />
                                <SeveritySection
                                    severity="UNKNOWN"
                                    vulns={groupedBySeverity.UNKNOWN}
                                    defaultOpen={false}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState
                    onScan={onScan}
                    isScanning={localIsScanning}
                />
            )}
        </div>
    );
};
