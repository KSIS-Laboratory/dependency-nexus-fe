"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { RefreshCw } from "lucide-react";
import { VisualizationLoadingOverlay } from "@/components/VisualizationLoadingOverlay";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { GraphLegend } from "@/components/GraphLegend";
import { KNOWLEDGE_GRAPH_QUERY, KNOWLEDGE_GRAPH_DEFAULT_QUERY, KNOWLEDGE_GRAPH_REPO_QUERY } from "@/lib/graph-queries";
import { VulnerabilityDetailModal } from "@/components/VulnerabilityDetailModal";
import { getSeverityHexColor, getNodeTypeHexColor, FULL_LEGEND_ITEMS } from "@/lib/severity";

import { RepositorySelector } from "./RepositorySelector";
import { RepositoryEmptyState } from "./RepositoryEmptyState";

interface KnowledgeGraphProps {
    width?: number;
    height?: number;
    userName?: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    labels: string[];
    properties: Record<string, any>;
    group?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    id: string;
    type: string;
    source: string | GraphNode;
    target: string | GraphNode;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
    width = 800,
    height = 600,
    userName,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

    // Vulnerability modal state
    const [selectedVulnId, setSelectedVulnId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);



    const processGraphData = (results: any[]) => {
        const uniqueNodes = new Map<string, GraphNode>();
        const uniqueLinks = new Map<string, GraphLink>();

        results.forEach((row) => {
            // Process nodes n and m
            [row.n, row.m].forEach((nodeData) => {
                if (nodeData && !uniqueNodes.has(nodeData.elementId)) {
                    uniqueNodes.set(nodeData.elementId, {
                        id: nodeData.elementId,
                        labels: nodeData.labels,
                        properties: nodeData.properties,
                        x: width / 2 + (Math.random() - 0.5) * 200, // Initial random spread
                        y: height / 2 + (Math.random() - 0.5) * 200,
                    });
                }
            });

            // Process relationship r
            if (row.r && !uniqueLinks.has(row.r.elementId)) {
                uniqueLinks.set(row.r.elementId, {
                    id: row.r.elementId,
                    type: row.r.type,
                    source: row.r.startNodeElementId,
                    target: row.r.endNodeElementId,
                });
            }
        });

        // Add a fixed center node anchor
        const centerNodeId = "center-anchor";
        const centerNode: GraphNode = {
            id: centerNodeId,
            labels: ["Anchor"],
            properties: { name: "Center" },
            fx: width / 2,
            fy: height / 2,
            x: width / 2,
            y: height / 2,
        };
        uniqueNodes.set(centerNodeId, centerNode);

        // Connect only Repository nodes to the center anchor
        uniqueNodes.forEach((node) => {
            if (node.id !== centerNodeId && node.labels.includes("Repository")) {
                uniqueLinks.set(`anchor-${node.id}`, {
                    id: `anchor-${node.id}`,
                    type: "ANCHOR",
                    source: centerNodeId,
                    target: node.id,
                });
            }
        });

        setNodes(Array.from(uniqueNodes.values()));
        setLinks(Array.from(uniqueLinks.values()));
    };
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            let cypherQuery = KNOWLEDGE_GRAPH_DEFAULT_QUERY;
            let parameters: any = undefined;

            if (selectedRepos.length > 0) {
                cypherQuery = KNOWLEDGE_GRAPH_REPO_QUERY;
                parameters = { repoNames: selectedRepos };
            } else if (userName) {
                cypherQuery = KNOWLEDGE_GRAPH_QUERY;
                parameters = { userName };
            }

            const response = await fetch(
                `${API_URL}${API_ENDPOINTS.CHATBOT.KNOWLEDGE_QUERY}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cypher_query: cypherQuery,
                        parameters,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch graph data: ${response.statusText}`);
            }

            const data = await response.json();
            processGraphData(data.results);
        } catch (err) {
            console.error("Error fetching graph data:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedRepos.length > 0) {
            fetchData();
        } else {
            // Clear data when no repos selected
            setNodes([]);
            setLinks([]);
            setLoading(false);
        }
    }, [selectedRepos]);

    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        // Get actual dimensions from container
        const rect = svgRef.current.getBoundingClientRect();
        const actualWidth = rect.width || width;
        const actualHeight = rect.height || height;

        const g = svg.append("g");

        // Zoom behavior
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Simulation
        const simulation = d3
            .forceSimulation<GraphNode>(nodes)
            .alphaDecay(0.01) // Slower decay for smoother settling
            .velocityDecay(0.4) // Standard friction
            .force(
                "link",
                d3
                    .forceLink<GraphNode, GraphLink>(links)
                    .id((d) => d.id)
                    .distance(100)
            )
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(actualWidth / 2, actualHeight / 2))
            .force("collide", d3.forceCollide().radius(50).iterations(2));

        // Render links
        const link = g
            .append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", 1.5);

        // Render nodes
        const node = g
            .append("g")
            .attr("stroke", "#000000")
            .attr("stroke-width", 1.5)
            .selectAll("g")
            .data(nodes)
            .join("g")
            .style("cursor", "pointer")
            .call(
                d3
                    .drag<any, GraphNode>()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            )
            .on("click", (event, d) => {
                // Open modal for vulnerability nodes
                if (d.labels.includes("Vulnerability") && d.properties.id) {
                    event.stopPropagation();
                    setSelectedVulnId(d.properties.id);
                    setIsModalOpen(true);
                }
            });

        // Node circles
        node
            .append("circle")
            .attr("r", 20)
            .attr("fill", (d) => getNodeColor(d.labels, d.properties));

        // Node labels - get theme color from CSS variable
        const computedStyle = getComputedStyle(document.documentElement);
        const baseContentColor = computedStyle.getPropertyValue('--bc').trim();
        // DaisyUI uses oklch format, convert to usable color
        const textColor = baseContentColor ? `oklch(${baseContentColor})` : 'currentColor';

        node
            .append("text")
            .text((d) => getNodeLabel(d))
            .attr("x", 25)
            .attr("y", 5)
            .style("font-size", "14px")
            .style("fill", textColor)
            .style("font-weight", "600")
            .style("stroke", "none")
            .style("pointer-events", "none")
            .on("click", (event, d) => {
                // Open modal for vulnerability nodes
                if (d.labels.includes("Vulnerability") && d.properties.id) {
                    event.stopPropagation();
                    setSelectedVulnId(d.properties.id);
                    setIsModalOpen(true);
                }
            });
        simulation.on("tick", () => {
            link
                .attr("x1", (d) => (d.source as GraphNode).x!)
                .attr("y1", (d) => (d.source as GraphNode).y!)
                .attr("x2", (d) => (d.target as GraphNode).x!)
                .attr("y2", (d) => (d.target as GraphNode).y!);

            node.attr("transform", (d) => `translate(${d.x},${d.y})`);
        });

        function dragstarted(event: any, d: GraphNode) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: GraphNode) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event: any, d: GraphNode) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }, [nodes, links, width, height]);

    const getNodeColor = (labels: string[], properties?: Record<string, any>) => {
        if (!labels || labels.length === 0) return getNodeTypeHexColor('DEFAULT');
        if (labels.includes("Anchor")) return 'transparent';
        if (labels.includes("Repository")) return getNodeTypeHexColor('REPOSITORY');
        if (labels.includes("Package")) return getNodeTypeHexColor('PACKAGE');
        if (labels.includes("Vulnerability")) {
            const severity = properties?.severity || 'UNKNOWN';
            return getSeverityHexColor(severity);
        }
        if (labels.includes("Scan")) return getNodeTypeHexColor('SCAN');
        return getNodeTypeHexColor('DEFAULT');
    };


    const getNodeLabel = (node: GraphNode) => {
        if (node.labels.includes("Repository")) return node.properties.name || "Repo";
        if (node.labels.includes("Package")) return node.properties.name || "Pkg";
        if (node.labels.includes("Vulnerability")) return node.properties.id || "Vuln";
        if (node.labels.includes("Scan")) {
            return node.properties.scan_id ? `Scan ${node.properties.scan_id.substring(0, 8)}` : "Scan";
        }
        return node.id;
    };

    // Check if showing empty state
    const showEmptyState = nodes.length === 0 && !loading && selectedRepos.length === 0;

    return (
        <div className="relative h-full overflow-hidden bg-base-100">
            {/* Controls Bar - Always visible, same instance */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <RepositorySelector
                    selectedRepos={selectedRepos}
                    onSelectionChange={setSelectedRepos}
                />
            </div>

            {/* Empty State Overlay */}
            {showEmptyState && (
                <RepositoryEmptyState
                    title="Select a Repository"
                    description="Choose one or more repositories from the dropdown above to visualize the knowledge graph."
                    icon={
                        <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    }
                />
            )}

            {/* Loading Overlay */}
            {loading && <VisualizationLoadingOverlay message="Loading graph data..." />}

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/95 z-20">
                    <div className="card bg-error/10 border border-error/20 max-w-md">
                        <div className="card-body items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-error">Error Loading Graph</h3>
                            <p className="text-sm text-base-content/70">{error}</p>
                            <button onClick={fetchData} className="btn btn-sm btn-primary mt-2">
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Graph Canvas */}
            <svg ref={svgRef} className="w-full h-full cursor-move bg-base-200/30" />

            {/* Legend */}
            <GraphLegend items={FULL_LEGEND_ITEMS} className="absolute bottom-4 right-4 z-10" />

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

export default KnowledgeGraph;

