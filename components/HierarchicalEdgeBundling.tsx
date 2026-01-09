"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { VisualizationLoadingOverlay } from "@/components/VisualizationLoadingOverlay";
import { AlertCircle } from "lucide-react";
import { GraphLegend } from "@/components/GraphLegend";
import { TREE_DATA_QUERY, COMPARE_REPOS_QUERY, TREE_DATA_BY_SCANS } from "@/lib/graph-queries";
import { VulnerabilityDetailModal } from "@/components/VulnerabilityDetailModal";
import { SEVERITY_LEGEND_ITEMS, getSeverityHexColor } from "@/lib/severity";

import { RepositorySelector } from "./RepositorySelector";
import { RepositoryEmptyState } from "./RepositoryEmptyState";
import { ScanVersionSelector } from "./ScanVersionSelector";
import { MultiRepoVersionSelector } from "./MultiRepoVersionSelector";

interface HierarchicalEdgeBundlingProps {
    readonly userName?: string;
}

interface RawData {
    readonly repo: string;
    readonly package: string;
    readonly severity: string | null;
    readonly vuln_id: string | null;
}

interface HierarchyNode {
    readonly name: string;
    readonly type: "root" | "group" | "repo" | "package" | "severity" | "vulnerability";
    readonly children?: HierarchyNode[];
    readonly path?: string; // Unique identifier path
}

export const HierarchicalEdgeBundling: React.FC<HierarchicalEdgeBundlingProps> = ({ userName }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const [data, setData] = useState<RawData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Repo selection state
    const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

    // Vulnerability modal state
    const [selectedVulnId, setSelectedVulnId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Version selection state: maps repoId -> {versionId, scanId}
    const [selectedVersions, setSelectedVersions] = useState<Record<string, { versionId: string; scanId: string }>>({});



    // Fetch tree data
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Check if we have version selections for all repos
            const scanIds = selectedRepos
                .map(repo => selectedVersions[repo]?.scanId)
                .filter(Boolean) as string[];
            const useVersionFilter = scanIds.length > 0 && scanIds.length === selectedRepos.length;

            // Use version-filtered query if available, else repo-specific, else default
            let cypherQuery: string;
            let parameters: any;

            if (useVersionFilter) {
                cypherQuery = TREE_DATA_BY_SCANS;
                parameters = { scanIds };
            } else if (selectedRepos.length > 0) {
                cypherQuery = COMPARE_REPOS_QUERY;
                parameters = { repoNames: selectedRepos };
            } else {
                cypherQuery = TREE_DATA_QUERY;
                parameters = { userName: userName || "System" };
            }

            const response = await fetch(
                `${API_URL}${API_ENDPOINTS.CHATBOT.KNOWLEDGE_QUERY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cypher_query: cypherQuery,
                        parameters,
                    }),
                }
            );

            if (!response.ok) throw new Error("Failed to fetch graph data");

            const json = await response.json();
            if (json.results && Array.isArray(json.results)) {
                setData(json.results);
            } else if (Array.isArray(json)) {
                setData(json);
            } else {
                setData([]);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedRepos.length > 0) {
            fetchData();
        } else {
            // Clear data when no repos selected
            setData([]);
            setLoading(false);
        }
    }, [selectedRepos, selectedVersions]);

    // Render D3
    useEffect(() => {
        if (!data.length || !svgRef.current) return;

        const width = 900;
        const radius = width / 2;

        // 1. Build Hierarchy
        // Root -> [Repositories, Vulnerabilities]
        // Repositories -> Repo -> Package
        // Vulnerabilities -> Severity -> VulnID

        const root: HierarchyNode = { name: "root", type: "root", children: [] };
        const reposGroup: HierarchyNode = { name: "Repositories", type: "group", children: [] };
        const vulnsGroup: HierarchyNode = { name: "Vulnerabilities", type: "group", children: [] };
        root.children!.push(reposGroup, vulnsGroup);

        const repoMap = new Map<string, HierarchyNode>();
        const pkgMap = new Map<string, HierarchyNode>(); // Key: repo/package
        const sevMap = new Map<string, HierarchyNode>();
        const vulnMap = new Map<string, HierarchyNode>(); // Key: vuln_id

        // Helper to find/create nodes
        const getRepoNode = (name: string) => {
            if (!repoMap.has(name)) {
                const node: HierarchyNode = { name, type: "repo", children: [], path: `Repositories/${name}` };
                repoMap.set(name, node);
                reposGroup.children!.push(node);
            }
            return repoMap.get(name)!;
        };

        const getPkgNode = (repoName: string, pkgName: string) => {
            const key = `${repoName}/${pkgName}`;
            if (!pkgMap.has(key)) {
                const node: HierarchyNode = {
                    name: `${repoName} / ${pkgName}`,
                    type: "package",
                    children: [],
                    path: `Repositories/${repoName}/${pkgName}`
                };
                pkgMap.set(key, node);
                getRepoNode(repoName).children!.push(node);
            }
            return pkgMap.get(key)!;
        };

        const getSevNode = (severity: string = "UNKNOWN") => {
            if (!sevMap.has(severity)) {
                const node: HierarchyNode = { name: severity, type: "severity", children: [], path: `Vulnerabilities/${severity}` };
                sevMap.set(severity, node);
                vulnsGroup.children!.push(node);
            }
            return sevMap.get(severity)!;
        };

        const getVulnNode = (severity: string, vulnId: string) => {
            if (!vulnMap.has(vulnId)) {
                const node: HierarchyNode = { name: vulnId, type: "vulnerability", children: [], path: `Vulnerabilities/${severity || "UNKNOWN"}/${vulnId}` };
                vulnMap.set(vulnId, node);
                getSevNode(severity).children!.push(node);
            }
            return vulnMap.get(vulnId)!;
        };

        // 2. Populate Hierarchy and Links
        const links: { source: string; target: string }[] = [];

        data.forEach(row => {
            const pkgNode = getPkgNode(row.repo, row.package);

            if (row.vuln_id) {
                const vulnNode = getVulnNode(row.severity || "UNKNOWN", row.vuln_id);
                // Create link
                links.push({ source: pkgNode.path!, target: vulnNode.path! });
            }
        });

        // 3. D3 Layout
        const tree = d3.cluster<HierarchyNode>()
            .size([2 * Math.PI, radius - 100]);

        const rootHierarchy = d3.hierarchy(root)
            .sort((a, b) => d3.ascending(a.data.name, b.data.name));

        const clusterRoot = tree(rootHierarchy);

        // Map paths to nodes for link creation
        const nodeByPath = new Map(clusterRoot.descendants().map(d => [d.data.path, d]));

        const bundledLinks = links.map(link => {
            const source = nodeByPath.get(link.source);
            const target = nodeByPath.get(link.target);
            return (source && target) ? source.path(target) : null;
        }).filter(l => l !== null);

        const line = d3.lineRadial<d3.HierarchyPointNode<HierarchyNode>>()
            .curve(d3.curveBundle.beta(0.85))
            .radius(d => d.y)
            .angle(d => d.x);

        // 4. Render SVG
        const svg = d3.select(svgRef.current)
            .attr("viewBox", [-width / 2, -width / 2, width, width].join(" "))
            .style("font", "10px sans-serif");

        svg.selectAll("*").remove();

        // Add Zoom behavior
        const g = svg.append("g");

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Draw Links
        const link = g.append("g")
            .attr("fill", "none")
            .attr("stroke-opacity", 0.5)
            .selectAll("path")
            .data(bundledLinks)
            .join("path")
            .style("mix-blend-mode", "multiply")
            .attr("d", d => line(d as any))
            .attr("stroke", d => {
                // Color based on target (vulnerability) severity
                const target = d.at(-1);
                if (target?.data.type === 'vulnerability') {
                    const path = target.data.path || "";
                    // Extract severity from path like "Vulnerabilities/CRITICAL/CVE-xxx"
                    if (path.includes("CRITICAL")) return getSeverityHexColor('CRITICAL');
                    if (path.includes("HIGH")) return getSeverityHexColor('HIGH');
                    if (path.includes("MODERATE")) return getSeverityHexColor('MODERATE');
                    if (path.includes("LOW")) return getSeverityHexColor('LOW');
                    return getSeverityHexColor('UNKNOWN');
                }
                return getSeverityHexColor('UNKNOWN');
            })
            .attr("stroke-width", 1);

        // Draw Nodes
        const node = g.append("g")
            .selectAll("g")
            .data(clusterRoot.leaves())
            .join("g")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

        // Get theme color for text
        const computedStyle = getComputedStyle(document.documentElement);
        const baseContentColor = computedStyle.getPropertyValue('--bc').trim();
        const themeTextColor = baseContentColor ? `oklch(${baseContentColor})` : 'currentColor';

        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
            .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
            .text(d => d.data.name)
            .attr("fill", d => {
                if (d.data.type === 'vulnerability') {
                    const path = d.data.path || "";
                    if (path.includes("CRITICAL")) return getSeverityHexColor('CRITICAL');
                    if (path.includes("HIGH")) return getSeverityHexColor('HIGH');
                    if (path.includes("MODERATE")) return getSeverityHexColor('MODERATE');
                    if (path.includes("LOW")) return getSeverityHexColor('LOW');
                    return getSeverityHexColor('UNKNOWN');
                }
                // Use theme color for repos and packages
                return themeTextColor;
            })
            .style("font-weight", d => d.data.type === 'vulnerability' ? "bold" : "normal")
            .style("cursor", "pointer")
            .each(function (d) { (d as any).textNode = this; });

        // Interaction
        // Interaction
        let activeNode: any = null;

        const highlight = (d: any, element: any) => {
            node.style("opacity", 0.1);
            link.style("stroke-opacity", 0.1);

            d3.select(element).style("opacity", 1);

            // Highlight connected links
            link.filter((l: any) => l[0] === d || l[l.length - 1] === d)
                .style("stroke-opacity", 1)
                .style("stroke-width", 2)
                .each(function (l: any) {
                    // Highlight connected node
                    const other = l[0] === d ? l[l.length - 1] : l[0];
                    if (other.textNode) {
                        d3.select(other.textNode.parentNode).style("opacity", 1);
                        d3.select(other.textNode).style("font-weight", "bold");
                    }
                });
        };

        const reset = () => {
            node.style("opacity", 1).style("font-weight", d => d.data.type === 'vulnerability' ? "bold" : "normal");
            link.style("stroke-opacity", 0.5).style("stroke-width", 1);
        };

        const mouseovered = (event: any, d: any) => {
            if (activeNode) return;
            highlight(d, event.currentTarget);
        };

        const mouseouted = () => {
            if (activeNode) return;
            reset();
        };

        const clicked = (event: any, d: any) => {
            event.stopPropagation();
            if (activeNode === d) {
                // Second click on same node - open modal for vulnerability
                if (d.data.type === 'vulnerability') {
                    setSelectedVulnId(d.data.name);
                    setIsModalOpen(true);
                }
                activeNode = null;
                reset();
            } else {
                activeNode = d;
                highlight(d, event.currentTarget);
            }
        };

        const bgClicked = () => {
            activeNode = null;
            reset();
        };

        node.on("mouseover", mouseovered)
            .on("mouseout", mouseouted)
            .on("click", clicked)
            .on("dblclick", (event: any, d: any) => {
                // Double-click shortcut to open modal directly
                event.stopPropagation();
                if (d.data.type === 'vulnerability') {
                    setSelectedVulnId(d.data.name);
                    setIsModalOpen(true);
                }
            });

        svg.on("click", bgClicked);

    }, [data]);

    // Check if showing empty state
    const showEmptyState = !data.length && !loading && selectedRepos.length === 0;

    // Handle repo selection change - preserves versions for repos that remain selected
    const handleRepoSelectionChange = (repos: string[]) => {
        setSelectedVersions(prev => {
            const newVersions: Record<string, { versionId: string; scanId: string }> = {};
            for (const repo of repos) {
                if (prev[repo]) {
                    newVersions[repo] = prev[repo];
                }
            }
            return newVersions;
        });
        setSelectedRepos(repos);
    };

    return (
        <div className="w-full h-full overflow-hidden bg-base-100 flex justify-center items-center relative">
            {/* Controls Bar - Always visible, same instance */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                {/* Version selector - single repo uses simple selector, multi uses panel */}
                {selectedRepos.length === 1 && (
                    <ScanVersionSelector
                        repositoryId={selectedRepos[0]}
                        selectedVersionId={selectedVersions[selectedRepos[0]]?.versionId ?? null}
                        onVersionChange={(versionId, scanId) => {
                            setSelectedVersions(prev => ({
                                ...prev,
                                [selectedRepos[0]]: { versionId, scanId }
                            }));
                        }}
                    />
                )}
                {selectedRepos.length > 1 && (
                    <MultiRepoVersionSelector
                        repositoryIds={selectedRepos}
                        selectedVersions={selectedVersions}
                        onVersionsChange={setSelectedVersions}
                    />
                )}
                <RepositorySelector
                    selectedRepos={selectedRepos}
                    onSelectionChange={handleRepoSelectionChange}
                    useFullName={true}
                />
            </div>

            {/* Empty State Overlay */}
            {showEmptyState && (
                <RepositoryEmptyState
                    title="Select a Repository"
                    description="Choose one or more repositories from the dropdown above to visualize the radial dependency graph."
                    icon={
                        <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    }
                />
            )}

            {/* Loading Overlay */}
            {loading && <VisualizationLoadingOverlay message="Loading visualization..." />}

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/95 z-20">
                    <div className="alert alert-error max-w-md shadow-lg">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Radial Graph Canvas */}
            <svg ref={svgRef} className="w-full h-full bg-base-200/30"></svg>

            {/* Legend */}
            <GraphLegend className="absolute bottom-4 right-4 z-10" items={SEVERITY_LEGEND_ITEMS} />

            {/* Vulnerability Detail Modal */}
            {selectedVulnId && (
                <VulnerabilityDetailModal
                    vulnId={selectedVulnId}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

