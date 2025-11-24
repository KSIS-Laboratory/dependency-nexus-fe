import React from "react";
import { Shield, CheckCircle2, AlertTriangle, Package } from "lucide-react";
import { VulnerabilitySummary } from "@/components/VulnerabilitySummary";
import { VulnerabilityCard } from "@/components/VulnerabilityCard";
import { EmptyState } from "@/components/EmptyState";

interface SecurityTabProps {
    hasVulnerabilityData: boolean;
    totalVulnerabilityCount: number;
    vulnerabilityData: any;
    scanFromCache: boolean;
    localIsScanning: boolean;
    onScan: () => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
    hasVulnerabilityData,
    totalVulnerabilityCount,
    vulnerabilityData,
    scanFromCache,
    localIsScanning,
    onScan,
}) => {
    return (
        <div className="p-6 animate-in fade-in duration-300">
            {hasVulnerabilityData ? (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    {totalVulnerabilityCount > 0 ? (
                        <VulnerabilitySummary data={vulnerabilityData} />
                    ) : (
                        <div className="alert alert-success shadow-lg bg-success/10 border-success/20">
                            <CheckCircle2 className="h-6 w-6 text-success" />
                            <div>
                                <h3 className="font-bold text-success">Secure & Safe!</h3>
                                <div className="text-sm opacity-80">
                                    No known vulnerabilities found in your dependencies.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detailed List */}
                    {totalVulnerabilityCount > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-base-200">
                                <AlertTriangle className="h-5 w-5 text-error" />
                                <h3 className="font-bold text-lg">Vulnerability Details</h3>
                                {scanFromCache && (
                                    <span className="badge badge-success badge-sm gap-1 text-white border-none ml-auto">
                                        <Shield className="h-3 w-3" />
                                        Cached Result
                                    </span>
                                )}
                            </div>

                            <div className="grid gap-6">
                                {vulnerabilityData?.results?.map((result: any) => (
                                    result.vulnerability_count > 0 && (
                                        <div
                                            key={result.package.name}
                                            className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="card-body p-0">
                                                <div className="p-4 border-b border-base-200 bg-base-200/30 flex items-center justify-between">
                                                    <h4 className="font-bold text-lg flex items-center gap-2">
                                                        <Package className="h-5 w-5 text-base-content/70" />
                                                        {result.package.name}
                                                    </h4>
                                                    <span className="badge badge-error gap-1 font-medium">
                                                        {result.vulnerability_count} issues
                                                    </span>
                                                </div>
                                                <div className="p-4 grid gap-4">
                                                    {result.vulnerabilities.map((vuln: any) => (
                                                        <VulnerabilityCard key={vuln.id} vulnerability={vuln} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
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
