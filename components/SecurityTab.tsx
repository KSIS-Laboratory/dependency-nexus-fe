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

                    {/* Detailed List */}
                    {totalVulnerabilityCount > 0 && (
                        <div className="space-y-6">
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

                            <div className="grid gap-6">
                                {vulnerabilityData?.results?.map((result: any) => (
                                    result.vulnerability_count > 0 && (
                                        <div
                                            key={result.package.name}
                                            className=" hover:shadow-lg transition-all duration-300"
                                        >
                                            <div className="card-body p-0">
                                                <div className="p-4 border-b bg-primary/10 border-base-content/10 flex items-center justify-between rounded-t-2xl">
                                                    <h4 className="font-bold text-lg flex items-center gap-2 text-primary">
                                                        <Package className="h-5 w-5 text-primary" />
                                                        {result.package.name}
                                                    </h4>
                                                    <span className="badge text-error border-none gap-1 bg-base/10 font-medium">
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
