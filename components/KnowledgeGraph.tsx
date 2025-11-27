"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Loader2, RefreshCw } from "lucide-react";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { GraphLegend } from "@/components/GraphLegend";

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

        setNodes(Array.from(uniqueNodes.values()));
        setLinks(Array.from(uniqueLinks.values()));
    };
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const cypherQuery = userName
                ? `
                  MATCH (s:Scan {scanned_by: $userName})-[r1]-(n)
                  RETURN s as n, r1 as r, n as m
                  UNION
                  MATCH (s:Scan {scanned_by: $userName})-[r1]-(n)-[r2]-(o)
                  RETURN n, r2 as r, o as m
                  LIMIT 300
                  `
                : "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 300";

            const response = await fetch(
                `${API_URL}${API_ENDPOINTS.CHATBOT.KNOWLEDGE_QUERY}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cypher_query: cypherQuery,
                        parameters: userName ? { userName } : undefined,
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
        fetchData();
    }, []);

    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

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
            .force(
                "link",
                d3
                    .forceLink<GraphNode, GraphLink>(links)
                    .id((d) => d.id)
                    .distance(100)
            )
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(50));

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
            .call(
                d3
                    .drag<any, GraphNode>()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            );

        // Node circles
        node
            .append("circle")
            .attr("r", 20)
            .attr("fill", (d) => getNodeColor(d.labels));

        // Node labels
        node
            .append("text")
            .text((d) => getNodeLabel(d))
            .attr("x", 25)
            .attr("y", 5)
            .style("font-size", "14px")
            .style("fill", "#000000")
            .style("font-weight", "600")
            .style("stroke", "none")
            .style("pointer-events", "none");

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

    const getNodeColor = (labels: string[]) => {
        if (labels.includes("Repository")) return "#ef4444"; // Red
        if (labels.includes("Package")) return "#3b82f6"; // Blue
        if (labels.includes("Vulnerability")) return "#eab308"; // Yellow
        if (labels.includes("Scan")) return "#10b981"; // Green
        return "#6b7280"; // Gray
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

    return (
        <div className="relative border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={fetchData}
                    className="btn btn-sm btn-ghost btn-circle bg-white/80 hover:bg-white"
                    title="Refresh Graph"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20">
                    <div className="text-error text-center p-4">
                        <p className="font-bold">Error loading graph</p>
                        <p className="text-sm">{error}</p>
                        <button onClick={fetchData} className="btn btn-sm btn-primary mt-4">
                            Retry
                        </button>
                    </div>
                </div>
            )}

            <svg ref={svgRef} width={width} height={height} className="cursor-move bg-slate-50" />

            <GraphLegend items={[
                { label: "Repository", color: "#ef4444" },
                { label: "Package", color: "#3b82f6" },
                { label: "Vulnerability", color: "#eab308" },
                { label: "Scan", color: "#10b981" }
            ]} className="right-4" />
        </div>
    );
};

export default KnowledgeGraph;
