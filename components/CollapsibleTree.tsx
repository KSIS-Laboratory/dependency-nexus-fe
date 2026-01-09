"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { VisualizationLoadingOverlay } from "@/components/VisualizationLoadingOverlay";
import { AlertCircle } from "lucide-react";
import { GraphLegend } from "@/components/GraphLegend";
import { TREE_DATA_QUERY, COMPARE_REPOS_QUERY, TREE_DATA_BY_SCANS } from "@/lib/graph-queries";
import { VulnerabilityDetailModal } from "@/components/VulnerabilityDetailModal";
import { getSeverityHexColor, SEVERITY_LEGEND_ITEMS } from "@/lib/severity";

import { RepositorySelector } from "./RepositorySelector";
import { RepositoryEmptyState } from "./RepositoryEmptyState";
import { ScanVersionSelector } from "./ScanVersionSelector";
import { MultiRepoVersionSelector } from "./MultiRepoVersionSelector";

interface CollapsibleTreeProps {
    readonly userName?: string;
}

interface RawData {
    readonly repo: string;
    readonly package: string;
    readonly severity: string | null;
    readonly vuln_id: string | null;
}

interface TreeNode {
    readonly name: string;
    readonly children?: TreeNode[];
    readonly severity?: string;
    readonly type: "root" | "repo" | "package" | "vulnerability";
}

// Extend D3's HierarchyPointNode to include state for animation and collapsing
interface ExtendedHierarchyNode extends d3.HierarchyPointNode<TreeNode> {
    x0?: number;
    y0?: number;
    _children?: ExtendedHierarchyNode[]; // Store collapsed children here
    id?: string;
}

export const CollapsibleTree: React.FC<CollapsibleTreeProps> = ({ userName }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const [data, setData] = useState<RawData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVulnId, setSelectedVulnId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Repo selection state
    const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

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
                console.error("Unexpected data format:", json);
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

    // Zoom behavior
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const gRef = useRef<SVGGElement>(null);

    // Render D3 Tree
    useEffect(() => {
        if (!data.length || !svgRef.current) return;

        // Transform data to hierarchy
        const rootNode: TreeNode = { name: "Dependency Nexus", children: [], type: "root" };
        const repos = new Map<string, TreeNode>();

        data.forEach(row => {
            if (!repos.has(row.repo)) {
                repos.set(row.repo, { name: row.repo, children: [], type: "repo" });
                rootNode.children!.push(repos.get(row.repo)!);
            }
            const repoNode = repos.get(row.repo)!;

            let pkgNode = repoNode.children!.find(c => c.name === row.package);
            if (!pkgNode) {
                pkgNode = { name: row.package, children: [], type: "package" };
                repoNode.children!.push(pkgNode);
            }

            // Only add vulnerability if it doesn't already exist
            if (row.vuln_id) {
                const vulnExists = pkgNode.children!.some(c => c.name === row.vuln_id);
                if (!vulnExists) {
                    pkgNode.children!.push({
                        name: row.vuln_id,
                        severity: row.severity || "UNKNOWN",
                        type: "vulnerability"
                    });
                }
            }
        });

        const width = 1200;
        const marginTop = 10;
        const marginBottom = 10;
        const marginLeft = 100;

        const root = d3.hierarchy<TreeNode>(rootNode) as ExtendedHierarchyNode;
        const dx = 20;
        const dy = width / 5;

        const tree = d3.tree<TreeNode>().nodeSize([dx, dy]);
        const diagonal = d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, ExtendedHierarchyNode>()
            .x(d => d.y)
            .y(d => d.x);

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [-marginLeft, -marginTop, width, dx].join(" "))
            .style("font", "12px sans-serif")
            .style("user-select", "none");

        svg.selectAll("*").remove();

        // Add Zoom Group
        const g = svg.append("g");
        // @ts-ignore
        gRef.current = g.node();

        // Calculate dynamic max zoom based on node count
        const totalNodes = root.descendants().length;
        // Base max zoom of 4, add 1 for every 20 nodes to allow deeper zoom for larger trees
        // Cap at 50 to prevent excessive zooming
        const maxZoom = Math.min(50, Math.max(4, 4 + Math.floor(totalNodes / 20)));

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, maxZoom])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);
        zoomRef.current = zoom;

        const gLink = g.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5);

        const gNode = g.append("g")
            .attr("cursor", "pointer")
            .attr("pointer-events", "all");

        function update(source: ExtendedHierarchyNode) {
            const duration = 250;
            const nodes = root.descendants();
            const links = root.links();

            tree(root);

            let left = root;
            let right = root;
            root.eachBefore((node: ExtendedHierarchyNode) => {
                if (node.x < left.x) left = node;
                if (node.x > right.x) right = node;
            });

            const height = right.x - left.x + marginTop + marginBottom;

            const transition = svg.transition()
                .duration(duration)
                .attr("viewBox", [-marginLeft, left.x - marginTop, width, height].join(" "));

            // Update nodes
            const node = gNode.selectAll<SVGGElement, ExtendedHierarchyNode>("g")
                .data(nodes, (d) => d.id || (d.id = Math.random().toString()));

            const nodeEnter = node.enter().append("g")
                .attr("transform", () => `translate(${source.y0 || source.y},${source.x0 || source.x})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0)
                .on("click", (event, d) => {
                    if (d.data.type === 'vulnerability') {
                        setSelectedVulnId(d.data.name);
                        setIsModalOpen(true);
                        // Prevent event bubbling if needed, though D3 handles it
                        event.stopPropagation();
                        return;
                    }

                    if (d.children) {
                        d._children = d.children;
                        d.children = undefined;
                    } else {
                        d.children = d._children;
                        d._children = undefined;
                    }
                    update(d);
                });

            nodeEnter.append("circle")
                .attr("r", 5)
                .attr("fill", (d) => {
                    if (d.data.type === 'vulnerability') {
                        return getSeverityHexColor(d.data.severity || 'UNKNOWN');
                    }
                    return d._children ? "#555" : "#999";
                })
                .attr("stroke-width", 10);

            // Get theme color for text
            const computedStyle = getComputedStyle(document.documentElement);
            const baseContentColor = computedStyle.getPropertyValue('--bc').trim();
            const themeTextColor = baseContentColor ? `oklch(${baseContentColor})` : 'currentColor';

            nodeEnter.append("text")
                .attr("dy", "0.31em")
                .attr("x", (d) => d._children ? -6 : 6)
                .attr("text-anchor", (d) => d._children ? "end" : "start")
                .text((d) => d.data.name)
                .clone(true).lower()
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", 3)
                .attr("stroke", "white");

            // Color text by severity (vulnerabilities) or theme color (others)
            nodeEnter.select("text")
                .attr("fill", (d) => {
                    if (d.data.type === 'vulnerability') {
                        return getSeverityHexColor(d.data.severity || 'UNKNOWN');
                    }
                    return themeTextColor;
                });

            // Transition nodes to new position
            node.merge(nodeEnter).transition(transition as any)
                .attr("transform", (d) => `translate(${d.y},${d.x})`)
                .attr("fill-opacity", 1)
                .attr("stroke-opacity", 1);

            node.select("circle")
                .attr("fill", (d) => {
                    if (d.data.type === 'vulnerability') {
                        return getSeverityHexColor(d.data.severity || 'UNKNOWN');
                    }
                    return d._children ? "#555" : "#999";
                });

            // Exit nodes
            node.exit().transition(transition as any).remove()
                .attr("transform", () => `translate(${source.y},${source.x})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0);

            // Update links
            const link = gLink.selectAll<SVGPathElement, d3.HierarchyPointLink<TreeNode>>("path")
                .data(links, (d: any) => d.target.id);

            const linkEnter = link.enter().append("path")
                .attr("d", () => {
                    const o = { x: source.x0 || source.x, y: source.y0 || source.y };
                    return diagonal({ source: o, target: o } as any);
                });

            link.merge(linkEnter).transition(transition as any)
                .attr("d", diagonal as any);

            link.exit().transition(transition as any).remove()
                .attr("d", () => {
                    const o = { x: source.x, y: source.y };
                    return diagonal({ source: o, target: o } as any);
                });

            // Stash old positions
            root.eachBefore((d: ExtendedHierarchyNode) => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        // Initialize positions
        root.x0 = dy / 2;
        root.y0 = 0;

        // Initial collapse: Collapse packages
        if (root.children) {
            root.children.forEach((repo) => {
                if (repo.children) {
                    repo.children.forEach((pkg) => {
                        // Collapse if it has children (vulnerabilities)
                        if (pkg.children) {
                            (pkg)._children = pkg.children;
                            pkg.children = undefined;
                        }
                    });
                }
            });
        }

        update(root);

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
        <div className="relative w-full h-full overflow-hidden bg-base-100">
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
                    description="Choose one or more repositories from the dropdown above to visualize their dependency tree."
                    icon={
                        <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    }
                />
            )}

            {/* Loading Overlay */}
            {loading && <VisualizationLoadingOverlay message="Loading tree data..." />}

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/95 z-20">
                    <div className="alert alert-error max-w-md shadow-lg">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Tree Canvas */}
            <svg ref={svgRef} className="w-full h-full min-h-[600px] bg-base-200/30"></svg>

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

