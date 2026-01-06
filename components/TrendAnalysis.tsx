"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { VisualizationLoadingOverlay } from "@/components/VisualizationLoadingOverlay";
import { RepositorySelector } from "@/components/RepositorySelector";
import { RepositoryEmptyState } from "@/components/RepositoryEmptyState";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { AuthService } from "@/lib/auth";

interface TrendData {
    date: Date;
    critical: number;
    high: number;
    moderate: number;
    low: number;
    total: number;
    versionId: string;
    repoName: string;
    repoFullName: string;
}

interface ScanHistoryItem {
    scan_timestamp: string;
    total_vulnerabilities: number;
    version_id: string;
    vulnerability_summary?: {
        critical?: number;
        high?: number;
        moderate?: number;
        low?: number;
        total?: number;
    };
}

// Color palette for different repos
const REPO_COLORS = [
    "#6366f1", // indigo
    "#f59e0b", // amber
    "#10b981", // emerald
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#f97316", // orange
    "#ec4899", // pink
];

export function TrendAnalysis() {
    const svgRef = useRef<SVGSVGElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<Map<string, TrendData[]>>(new Map());
    const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
    const [hoveredPoint, setHoveredPoint] = useState<TrendData | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Fetch scan history for selected repos
    const fetchData = async () => {
        if (selectedRepos.length === 0) {
            setData(new Map());
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const repoDataMap = new Map<string, TrendData[]>();
            const token = AuthService.getToken();

            for (const repoFullName of selectedRepos) {
                try {
                    const response = await fetch(
                        `${API_URL}${API_ENDPOINTS.VULNERABILITIES.HISTORY(repoFullName)}`,
                        {
                            headers: {
                                "Content-Type": "application/json",
                                ...(token && { Authorization: `Bearer ${token}` }),
                            },
                            credentials: "include",
                        }
                    );

                    if (!response.ok) continue;

                    const result = await response.json();
                    const scans: ScanHistoryItem[] = result.scans || [];

                    const repoData: TrendData[] = scans.map((scan) => {
                        const summary = scan.vulnerability_summary || {};
                        return {
                            date: new Date(scan.scan_timestamp),
                            critical: summary.critical || 0,
                            high: summary.high || 0,
                            moderate: summary.moderate || 0,
                            low: summary.low || 0,
                            total: scan.total_vulnerabilities || summary.total || 0,
                            versionId: scan.version_id,
                            repoName: repoFullName.split("/").pop() || repoFullName,
                            repoFullName: repoFullName,
                        };
                    });

                    repoData.sort((a, b) => a.date.getTime() - b.date.getTime());

                    if (repoData.length > 0) {
                        repoDataMap.set(repoFullName, repoData);
                    }
                } catch (err) {
                    console.error(`Failed to fetch history for ${repoFullName}:`, err);
                }
            }

            setData(repoDataMap);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedRepos]);

    // Render D3 Chart
    useEffect(() => {
        if (data.size === 0 || !svgRef.current || !chartContainerRef.current) return;

        const container = chartContainerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        // Increased margins to accommodate controls: top for trend indicator, bottom for legend
        const margin = { top: 60, right: 30, bottom: 90, left: 55 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Get all dates and max value
        const allData: TrendData[] = [];
        data.forEach(repoData => allData.push(...repoData));

        if (allData.length === 0) return;

        // Scales
        const xExtent = d3.extent(allData, d => d.date) as [Date, Date];
        const xScale = d3.scaleTime()
            .domain(xExtent)
            .range([0, innerWidth]);

        const yMax = d3.max(allData, d => d.total) || 0;
        const yScale = d3.scaleLinear()
            .domain([0, yMax * 1.15])
            .range([innerHeight, 0]);

        // Grid lines
        g.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.08)
            .call(d3.axisLeft(yScale)
                .tickSize(-innerWidth)
                .tickFormat(() => ""));

        // X Axis
        const xAxis = g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale)
                .ticks(Math.min(6, innerWidth / 100))
                .tickFormat(d3.timeFormat("%b %d") as any));

        xAxis.selectAll("text")
            .attr("fill", "currentColor")
            .attr("opacity", 0.6)
            .attr("font-size", "11px");

        xAxis.selectAll("line, path")
            .attr("stroke", "currentColor")
            .attr("opacity", 0.2);

        // Y Axis
        const yAxis = g.append("g")
            .call(d3.axisLeft(yScale).ticks(5));

        yAxis.selectAll("text")
            .attr("fill", "currentColor")
            .attr("opacity", 0.6)
            .attr("font-size", "11px");

        yAxis.selectAll("line, path")
            .attr("stroke", "currentColor")
            .attr("opacity", 0.2);

        // Draw areas, lines, and points for each repo
        const repoNames = Array.from(data.keys());

        // First pass: draw all areas (background)
        repoNames.forEach((repoFullName, index) => {
            const repoData = data.get(repoFullName)!;
            const color = REPO_COLORS[index % REPO_COLORS.length];

            const area = d3.area<TrendData>()
                .x(d => xScale(d.date))
                .y0(innerHeight)
                .y1(d => yScale(d.total))
                .curve(d3.curveMonotoneX);

            g.append("path")
                .datum(repoData)
                .attr("fill", color)
                .attr("opacity", 0.12)
                .attr("d", area)
                .style("pointer-events", "none"); // Don't block mouse events
        });

        // Second pass: draw all lines
        repoNames.forEach((repoFullName, index) => {
            const repoData = data.get(repoFullName)!;
            const color = REPO_COLORS[index % REPO_COLORS.length];

            const line = d3.line<TrendData>()
                .x(d => xScale(d.date))
                .y(d => yScale(d.total))
                .curve(d3.curveMonotoneX);

            g.append("path")
                .datum(repoData)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 2.5)
                .attr("d", line)
                .style("pointer-events", "none"); // Don't block mouse events
        });

        // Third pass: draw all points (on top for interaction)
        repoNames.forEach((repoFullName, index) => {
            const repoData = data.get(repoFullName)!;
            const color = REPO_COLORS[index % REPO_COLORS.length];

            g.selectAll(`.point-${index}`)
                .data(repoData)
                .enter()
                .append("circle")
                .attr("class", `point-${index}`)
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScale(d.total))
                .attr("r", 6)
                .attr("fill", color)
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .style("cursor", "pointer")
                .on("mouseenter", (event, d) => {
                    const rect = container.getBoundingClientRect();
                    setMousePos({
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top
                    });
                    setHoveredPoint(d);
                    d3.select(event.currentTarget)
                        .transition()
                        .duration(150)
                        .attr("r", 9);
                })
                .on("mousemove", (event) => {
                    const rect = container.getBoundingClientRect();
                    setMousePos({
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top
                    });
                })
                .on("mouseleave", (event) => {
                    setHoveredPoint(null);
                    d3.select(event.currentTarget)
                        .transition()
                        .duration(150)
                        .attr("r", 6);
                });
        });

    }, [data]);

    // Calculate overall trend
    const getTrendIndicator = () => {
        if (data.size === 0) return { icon: Minus, color: "text-base-content/60", text: "No data", diff: 0 };

        let totalFirst = 0;
        let totalLast = 0;

        data.forEach(repoData => {
            if (repoData.length >= 1) {
                const recent = repoData.slice(-Math.min(5, repoData.length));
                totalFirst += recent[0]?.total || 0;
                totalLast += recent.at(-1)?.total ?? 0;
            }
        });

        const diff = totalLast - totalFirst;
        const pct = totalFirst > 0 ? Math.abs((diff / totalFirst) * 100).toFixed(1) : "0";

        if (diff > 0) {
            return { icon: TrendingUp, color: "text-error", text: `+${pct}%`, diff };
        } else if (diff < 0) {
            return { icon: TrendingDown, color: "text-success", text: `-${pct}%`, diff };
        }
        return { icon: Minus, color: "text-base-content/60", text: "0%", diff: 0 };
    };

    const trend = getTrendIndicator();
    const TrendIcon = trend.icon;

    const showEmptyState = selectedRepos.length === 0 && !loading;
    const hasData = data.size > 0;

    // Get repo color
    const getRepoColor = (repoFullName: string) => {
        const index = Array.from(data.keys()).indexOf(repoFullName);
        return REPO_COLORS[index % REPO_COLORS.length];
    };

    // Calculate tooltip position
    const getTooltipStyle = () => {
        if (!chartContainerRef.current) return {};
        const containerWidth = chartContainerRef.current.clientWidth;
        const containerHeight = chartContainerRef.current.clientHeight;

        let left = mousePos.x + 15;
        let top = mousePos.y - 10;

        // Flip if too close to right edge
        if (left + 200 > containerWidth) {
            left = mousePos.x - 215;
        }
        // Flip if too close to bottom
        if (top + 150 > containerHeight) {
            top = mousePos.y - 160;
        }

        return { left, top };
    };

    return (
        <div ref={chartContainerRef} className="relative h-full bg-base-200 overflow-hidden">
            {/* Controls - Top Right */}
            <div className="absolute top-4 right-4 z-10">
                <RepositorySelector
                    selectedRepos={selectedRepos}
                    onSelectionChange={setSelectedRepos}
                    useFullName
                />
            </div>

            {/* Empty State */}
            {showEmptyState && (
                <RepositoryEmptyState
                    title="Select Repositories"
                    description="Choose repositories to view vulnerability trends over time."
                    icon={<TrendingUp className="w-10 h-10 text-primary" />}
                />
            )}

            {/* Loading */}
            {loading && <VisualizationLoadingOverlay message="Loading trend data..." />}

            {/* Error */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-200/95 z-20">
                    <div className="text-center text-error">
                        <p className="mb-3">{error}</p>
                        <button onClick={fetchData} className="btn btn-sm btn-primary">
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* No Data */}
            {!loading && !error && !hasData && selectedRepos.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-base-content/60">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-info/10 flex items-center justify-center">
                            <TrendingUp className="w-7 h-7 text-info" />
                        </div>
                        <h3 className="font-semibold text-base-content mb-1">No Scan History</h3>
                        <p className="text-sm">Selected repositories don't have scan history yet.</p>
                    </div>
                </div>
            )}

            {/* Chart */}
            <svg ref={svgRef} className="w-full h-full" />

            {/* Tooltip - follows cursor */}
            {hoveredPoint && (
                <div
                    className="absolute z-30 bg-base-100 shadow-xl rounded-lg border border-base-300 p-3 min-w-[180px] pointer-events-none"
                    style={getTooltipStyle()}
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getRepoColor(hoveredPoint.repoFullName) }}
                        />
                        <span className="font-medium text-sm text-base-content truncate">
                            {hoveredPoint.repoName}
                        </span>
                    </div>
                    <div className="text-xs text-base-content/50 mb-2">
                        {hoveredPoint.date.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-error" />
                            <span className="text-base-content/70">Critical:</span>
                            <span className="font-semibold">{hoveredPoint.critical}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-warning" />
                            <span className="text-base-content/70">High:</span>
                            <span className="font-semibold">{hoveredPoint.high}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-accent" />
                            <span className="text-base-content/70">Moderate:</span>
                            <span className="font-semibold">{hoveredPoint.moderate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-info" />
                            <span className="text-base-content/70">Low:</span>
                            <span className="font-semibold">{hoveredPoint.low}</span>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-base-200 text-sm font-medium flex justify-between">
                        <span>Total</span>
                        <span className="text-primary">{hoveredPoint.total}</span>
                    </div>
                </div>
            )}

            {/* Legend - Bottom Left - Compact horizontal */}
            {hasData && (
                <div className="absolute bottom-3 left-3 z-5 flex gap-3 overflow-x-auto max-w-[calc(100%-6rem)] pb-1">
                    {Array.from(data.entries()).map(([repoFullName]) => {
                        const color = getRepoColor(repoFullName);
                        const shortName = repoFullName.split("/").pop() || repoFullName;

                        return (
                            <div
                                key={repoFullName}
                                className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                title={repoFullName}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-xs text-base-content/70 hover:text-base-content transition-colors">
                                    {shortName.length > 12 ? shortName.slice(0, 12) + '...' : shortName}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default TrendAnalysis;
