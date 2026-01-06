"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { AlertTriangle, Grid3X3, X } from "lucide-react";
import { VisualizationLoadingOverlay } from "@/components/VisualizationLoadingOverlay";
import { RepositorySelector } from "@/components/RepositorySelector";
import { RepositoryEmptyState } from "@/components/RepositoryEmptyState";
import { VulnerabilityDetailModal } from "@/components/VulnerabilityDetailModal";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { HEATMAP_QUERY_REPOS } from "@/lib/graph-queries";
import { SEVERITY_COLORS } from "@/lib/severity";

interface SecurityHeatmapProps {
    width?: number;
    height?: number;
}

interface VulnInfo {
    id: string;
    severity: string;
}

interface RepoSummary {
    repo: string;
    critical: number;
    high: number;
    moderate: number;
    low: number;
    total: number;
    vulnerabilities: VulnInfo[];
}

export function SecurityHeatmap({
    width = 900,
    height = 500,
}: Readonly<SecurityHeatmapProps>) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<RepoSummary[]>([]);
    const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
    const [hoveredCell, setHoveredCell] = useState<{ repo: string; severity: string; count: number; vulns: VulnInfo[] } | null>(null);

    // Modal state
    const [selectedVulnId, setSelectedVulnId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Panel state for showing vulnerability list
    const [selectedCell, setSelectedCell] = useState<{ repo: string; severity: string; vulns: VulnInfo[] } | null>(null);

    const severityLevels = ["CRITICAL", "HIGH", "MODERATE", "LOW"];

    const fetchData = async () => {
        if (selectedRepos.length === 0) {
            setData([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}${API_ENDPOINTS.CHATBOT.KNOWLEDGE_QUERY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cypher_query: HEATMAP_QUERY_REPOS,
                        parameters: { repoNames: selectedRepos },
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const result = await response.json();
            const repoMap = new Map<string, RepoSummary>();

            for (const record of result.results || []) {
                const repo = record.repo || "Unknown";
                const vulnId = record.vulnId || "";
                const severity = (record.severity || "UNKNOWN").toUpperCase();

                if (!repoMap.has(repo)) {
                    repoMap.set(repo, {
                        repo,
                        critical: 0,
                        high: 0,
                        moderate: 0,
                        low: 0,
                        total: 0,
                        vulnerabilities: []
                    });
                }

                const summary = repoMap.get(repo)!;

                // Only add if vulnId is not empty and not already added
                if (vulnId && !summary.vulnerabilities.some(v => v.id === vulnId)) {
                    summary.vulnerabilities.push({ id: vulnId, severity });
                    summary.total += 1;

                    if (severity === "CRITICAL") summary.critical += 1;
                    else if (severity === "HIGH") summary.high += 1;
                    else if (severity === "MODERATE" || severity === "MEDIUM") summary.moderate += 1;
                    else if (severity === "LOW") summary.low += 1;
                }
            }

            const summaries = Array.from(repoMap.values()).sort((a, b) => b.total - a.total);
            setData(summaries);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedRepos.length > 0) {
            fetchData();
        } else {
            setData([]);
            setLoading(false);
        }
    }, [selectedRepos]);

    const getCountForSeverity = (d: RepoSummary, severity: string): number => {
        switch (severity) {
            case "CRITICAL": return d.critical;
            case "HIGH": return d.high;
            case "MODERATE": return d.moderate;
            default: return d.low;
        }
    };

    const getVulnsForSeverity = (d: RepoSummary, severity: string): VulnInfo[] => {
        const normalizedSeverity = severity === "MODERATE" ? ["MODERATE", "MEDIUM"] : [severity];
        return d.vulnerabilities.filter(v => normalizedSeverity.includes(v.severity.toUpperCase()));
    };

    // Handle cell click to show vulnerability list
    const handleCellClick = (repo: string, severity: string, vulns: VulnInfo[]) => {
        if (vulns.length > 0) {
            setSelectedCell({ repo, severity, vulns });
        }
    };

    // Handle vulnerability click to open modal
    const handleVulnClick = (vulnId: string) => {
        setSelectedVulnId(vulnId);
        setIsModalOpen(true);
    };

    // Use container dimensions for responsive sizing
    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width || width;
        const containerHeight = containerRect.height || height;

        const margin = { top: 80, right: 100, bottom: 60, left: 180 };
        const chartWidth = containerWidth - margin.left - margin.right;
        const chartHeight = containerHeight - margin.top - margin.bottom;

        const cellWidth = Math.max(80, chartWidth / severityLevels.length);
        const cellHeight = Math.max(50, Math.min(80, chartHeight / data.length));

        const actualChartWidth = cellWidth * severityLevels.length;
        const actualChartHeight = cellHeight * data.length;

        const offsetX = (containerWidth - actualChartWidth - margin.left - margin.right) / 2;
        const offsetY = (containerHeight - actualChartHeight - margin.top - margin.bottom) / 2;

        svg.attr("width", containerWidth).attr("height", containerHeight);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left + Math.max(0, offsetX)}, ${margin.top + Math.max(0, offsetY)})`);

        const xScale = d3.scaleBand()
            .domain(severityLevels)
            .range([0, actualChartWidth])
            .padding(0.06);

        const yScale = d3.scaleBand()
            .domain(data.map(d => d.repo))
            .range([0, actualChartHeight])
            .padding(0.08);

        const maxCount = d3.max(data, d => Math.max(d.critical, d.high, d.moderate, d.low)) || 1;

        // Create cells
        const cellData = data.flatMap(d =>
            severityLevels.map(severity => ({
                repo: d.repo,
                severity,
                count: getCountForSeverity(d, severity),
                total: d.total,
                vulns: getVulnsForSeverity(d, severity),
            }))
        );

        const cells = g.selectAll(".cell")
            .data(cellData)
            .enter()
            .append("g")
            .attr("class", "cell")
            .style("cursor", d => d.count > 0 ? "pointer" : "default");

        // Cell rectangles
        cells.append("rect")
            .attr("x", d => xScale(d.severity) || 0)
            .attr("y", d => yScale(d.repo) || 0)
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("rx", 8)
            .attr("ry", 8)
            .attr("fill", d => {
                if (d.count === 0) return "rgba(128, 128, 128, 0.06)";
                const baseColor = SEVERITY_COLORS[d.severity] || SEVERITY_COLORS.UNKNOWN;
                const opacity = Math.min(0.3 + (d.count / maxCount) * 0.7, 1);
                const colorObj = d3.color(baseColor);
                return colorObj ? colorObj.copy({ opacity }).toString() : baseColor;
            })
            .attr("stroke", d => d.count > 0 ? SEVERITY_COLORS[d.severity] : "rgba(128,128,128,0.15)")
            .attr("stroke-width", d => d.count > 0 ? 2 : 1)
            .on("mouseenter", function (event, d) {
                if (d.count > 0) {
                    d3.select(this)
                        .transition()
                        .duration(150)
                        .attr("stroke-width", 3)
                        .attr("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.15))");
                    setHoveredCell({ repo: d.repo, severity: d.severity, count: d.count, vulns: d.vulns });
                }
            })
            .on("mouseleave", function (_, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("stroke-width", d.count > 0 ? 2 : 1)
                    .attr("filter", "none");
                setHoveredCell(null);
            })
            .on("click", function (_, d) {
                if (d.count > 0) {
                    handleCellClick(d.repo, d.severity, d.vulns);
                }
            });

        // Count labels
        cells.append("text")
            .attr("x", d => (xScale(d.severity) || 0) + xScale.bandwidth() / 2)
            .attr("y", d => (yScale(d.repo) || 0) + yScale.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("fill", d => d.count > 0 ? "white" : "rgba(128, 128, 128, 0.3)")
            .attr("font-size", "16px")
            .attr("font-weight", "700")
            .style("text-shadow", d => d.count > 0 ? "0 2px 4px rgba(0,0,0,0.3)" : "none")
            .style("pointer-events", "none")
            .text(d => d.count > 0 ? d.count : "–");

        // Column headers
        const headerGroup = g.append("g").attr("transform", "translate(0, -20)");

        severityLevels.forEach(severity => {
            const x = (xScale(severity) || 0) + xScale.bandwidth() / 2;

            headerGroup.append("circle")
                .attr("cx", x)
                .attr("cy", -20)
                .attr("r", 6)
                .attr("fill", SEVERITY_COLORS[severity]);

            headerGroup.append("text")
                .attr("x", x)
                .attr("y", 0)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "600")
                .attr("fill", SEVERITY_COLORS[severity])
                .text(severity.charAt(0) + severity.slice(1).toLowerCase());
        });

        // Row labels
        g.append("g")
            .selectAll(".repo-label")
            .data(data)
            .enter()
            .append("text")
            .attr("x", -16)
            .attr("y", d => (yScale(d.repo) || 0) + yScale.bandwidth() / 2)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "central")
            .attr("font-size", "13px")
            .attr("font-weight", "500")
            .attr("fill", "currentColor")
            .attr("class", "text-base-content")
            .text(d => d.repo.length > 22 ? d.repo.slice(0, 20) + "…" : d.repo);

        // Total column
        const totalGroup = g.append("g")
            .attr("transform", `translate(${actualChartWidth + 20}, 0)`);

        totalGroup.selectAll(".total-bg")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", -8)
            .attr("y", d => (yScale(d.repo) || 0) + yScale.bandwidth() / 2 - 12)
            .attr("width", 50)
            .attr("height", 24)
            .attr("rx", 12)
            .attr("fill", d => {
                if (d.total === 0) return "rgba(128,128,128,0.1)";
                if (d.critical > 0) return "rgba(239,68,68,0.15)";
                if (d.high > 0) return "rgba(245,158,11,0.15)";
                return "rgba(128,128,128,0.1)";
            });

        totalGroup.selectAll(".total-text")
            .data(data)
            .enter()
            .append("text")
            .attr("x", 17)
            .attr("y", d => (yScale(d.repo) || 0) + yScale.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("font-size", "13px")
            .attr("font-weight", "700")
            .attr("fill", d => {
                if (d.critical > 0) return "#ef4444";
                if (d.high > 0) return "#f59e0b";
                return "currentColor";
            })
            .text(d => d.total);

    }, [data, width, height]);

    const handleRepoSelectionChange = (repos: string[]) => setSelectedRepos(repos);

    // Check if showing empty state
    const showEmptyState = selectedRepos.length === 0 && !loading;

    // Totals
    const totals = {
        critical: data.reduce((sum, d) => sum + d.critical, 0),
        high: data.reduce((sum, d) => sum + d.high, 0),
        moderate: data.reduce((sum, d) => sum + d.moderate, 0),
        low: data.reduce((sum, d) => sum + d.low, 0),
    };
    const totalVulns = totals.critical + totals.high + totals.moderate + totals.low;

    return (
        <div ref={containerRef} className="relative h-full overflow-hidden bg-base-100">
            {/* Controls - Top Right */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <RepositorySelector
                    selectedRepos={selectedRepos}
                    onSelectionChange={handleRepoSelectionChange}
                />
            </div>

            {/* Empty State Overlay */}
            {showEmptyState && (
                <RepositoryEmptyState
                    title="Select Repositories"
                    description="Choose one or more repositories to visualize the security heatmap."
                    icon={<Grid3X3 className="w-10 h-10 text-primary" />}
                />
            )}

            {/* Loading Overlay */}
            {loading && <VisualizationLoadingOverlay message="Loading heatmap data..." />}

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/95 z-20">
                    <div className="text-center text-error">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                        <p className="mb-3">{error}</p>
                        <button onClick={fetchData} className="btn btn-sm btn-primary">
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* No vulnerabilities state */}
            {!loading && !error && data.length === 0 && selectedRepos.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-base-content/60">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg text-base-content mb-1">No Vulnerabilities Found</h3>
                        <p className="text-sm">Selected repositories are secure!</p>
                    </div>
                </div>
            )}

            {/* Chart Canvas */}
            <svg ref={svgRef} className="w-full h-full cursor-default bg-base-200/30" />

            {/* Hover Tooltip */}
            {hoveredCell && !selectedCell && (
                <div className="absolute top-4 left-4 z-10 bg-base-100/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-xl border border-base-300">
                    <div className="font-semibold text-base-content mb-1">{hoveredCell.repo}</div>
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: SEVERITY_COLORS[hoveredCell.severity] }}
                        />
                        <span className="text-sm">
                            <span style={{ color: SEVERITY_COLORS[hoveredCell.severity] }} className="font-semibold">
                                {hoveredCell.severity.charAt(0) + hoveredCell.severity.slice(1).toLowerCase()}
                            </span>
                            {": "}
                            <strong>{hoveredCell.count}</strong> {hoveredCell.count === 1 ? 'vulnerability' : 'vulnerabilities'}
                        </span>
                    </div>
                    <p className="text-xs text-base-content/50 mt-2">Click to view details</p>
                </div>
            )}

            {/* Vulnerability List Panel */}
            {selectedCell && (
                <div className="absolute top-4 left-4 z-20 bg-base-100 backdrop-blur-sm rounded-xl shadow-2xl border border-base-300 w-80 max-h-[60vh] overflow-hidden flex flex-col">
                    {/* Panel Header */}
                    <div className="px-4 py-3 border-b border-base-300 flex items-center justify-between bg-base-200/50">
                        <div>
                            <div className="font-semibold text-base-content">{selectedCell.repo}</div>
                            <div className="flex items-center gap-2 text-sm">
                                <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: SEVERITY_COLORS[selectedCell.severity] }}
                                />
                                <span style={{ color: SEVERITY_COLORS[selectedCell.severity] }} className="font-medium">
                                    {selectedCell.severity.charAt(0) + selectedCell.severity.slice(1).toLowerCase()}
                                </span>
                                <span className="text-base-content/60">
                                    ({selectedCell.vulns.length} {selectedCell.vulns.length === 1 ? 'vulnerability' : 'vulnerabilities'})
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedCell(null)}
                            className="btn btn-sm btn-circle btn-ghost"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Vulnerability List */}
                    <div className="overflow-y-auto flex-1 p-2">
                        {selectedCell.vulns.map((vuln) => (
                            <button
                                key={vuln.id}
                                onClick={() => handleVulnClick(vuln.id)}
                                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors group flex items-center gap-2"
                            >
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: SEVERITY_COLORS[vuln.severity.toUpperCase()] }}
                                />
                                <span className="text-sm font-mono text-base-content group-hover:text-primary truncate">
                                    {vuln.id}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Stats - Bottom Left */}
            {data.length > 0 && !selectedCell && (
                <div className="absolute bottom-4 left-4 z-10 bg-base-100/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-xl border border-base-300">
                    <div className="flex items-center gap-1 mb-2 text-xs text-base-content/60 font-medium">
                        <Grid3X3 className="w-3.5 h-3.5" />
                        <span>{data.length} {data.length === 1 ? 'repository' : 'repositories'}</span>
                        <span className="mx-1">•</span>
                        <span>{totalVulns} total vulnerabilities</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-error" />
                            <span className="font-bold text-error">{totals.critical}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-warning" />
                            <span className="font-bold text-warning">{totals.high}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-accent" />
                            <span className="font-bold text-accent">{totals.moderate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-info" />
                            <span className="font-bold text-info">{totals.low}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Vulnerability Detail Modal */}
            {selectedVulnId && (
                <VulnerabilityDetailModal
                    vulnId={selectedVulnId}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedVulnId(null);
                    }}
                />
            )}
        </div>
    );
}

export default SecurityHeatmap;
