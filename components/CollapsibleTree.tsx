"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import { GraphLegend } from "@/components/GraphLegend";

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
    readonly x0?: number;
    readonly y0?: number;
    readonly _children?: ExtendedHierarchyNode[] | null; // Store collapsed children here
}

export const CollapsibleTree: React.FC<CollapsibleTreeProps> = ({ userName }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [data, setData] = useState<RawData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const cypherQuery = `
          MATCH (s:Scan)
          WHERE s.scanned_by = $userName OR s.scanned_by = 'System'
          MATCH (s)-[:INCLUDES_PACKAGE]->(p:Package)
          OPTIONAL MATCH (r:Repository)-[:HAS_SCAN]->(s)
          OPTIONAL MATCH (p)-[:AFFECTS]-(v:Vulnerability)
          RETURN COALESCE(r.name, "Unknown Repo") as repo, p.name as package, v.severity as severity, v.id as vuln_id
          LIMIT 2000
        `;

                console.log("Fetching Tree Data for user:", userName);
                const response = await fetch(
                    `${API_URL}${API_ENDPOINTS.CHATBOT.KNOWLEDGE_QUERY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            cypher_query: cypherQuery,
                            parameters: { userName: userName || "System" },
                        }),
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch graph data");

                const json = await response.json();
                console.log("Tree Data Result:", json);
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

        if (userName) {
            fetchData();
        }
    }, [userName]);

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

            if (row.vuln_id) {
                pkgNode.children!.push({
                    name: row.vuln_id,
                    severity: row.severity || "UNKNOWN",
                    type: "vulnerability"
                });
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

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
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
            const nodes = root.descendants() as ExtendedHierarchyNode[];
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
                    if (d.children) {
                        d._children = d.children as ExtendedHierarchyNode[];
                        d.children = null;
                    } else {
                        d.children = d._children;
                        d._children = null;
                    }
                    update(d);
                });

            nodeEnter.append("circle")
                .attr("r", 5)
                .attr("fill", (d) => d._children ? "#555" : "#999")
                .attr("stroke-width", 10);

            nodeEnter.append("text")
                .attr("dy", "0.31em")
                .attr("x", (d) => d._children ? -6 : 6)
                .attr("text-anchor", (d) => d._children ? "end" : "start")
                .text((d) => d.data.name)
                .clone(true).lower()
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", 3)
                .attr("stroke", "white");

            // Color text by severity
            nodeEnter.select("text")
                .attr("fill", (d) => {
                    if (d.data.type === 'vulnerability') {
                        const sev = d.data.severity?.toUpperCase() || "";
                        if (sev.includes("CRITICAL")) return "#ef4444";
                        if (sev.includes("HIGH")) return "#f97316";
                        if (sev.includes("MEDIUM")) return "#eab308";
                        if (sev.includes("LOW")) return "#3b82f6";
                    }
                    return "black";
                });

            // Transition nodes to new position
            node.merge(nodeEnter).transition(transition as any)
                .attr("transform", (d) => `translate(${d.y},${d.x})`)
                .attr("fill-opacity", 1)
                .attr("stroke-opacity", 1);

            node.select("circle")
                .attr("fill", (d) => d._children ? "#555" : "#999");

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
                            (pkg as ExtendedHierarchyNode)._children = pkg.children as ExtendedHierarchyNode[];
                            pkg.children = null;
                        }
                    });
                }
            });
        }

        update(root);

    }, [data]);

    const handleZoom = (factor: number) => {
        if (!svgRef.current || !zoomRef.current) return;
        d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, factor);
    };

    const handleReset = () => {
        if (!svgRef.current || !zoomRef.current) return;
        d3.select(svgRef.current).transition().call(zoomRef.current.transform, d3.zoomIdentity);
    };

    if (loading) return <LoadingSpinner message="Loading tree data..." />;
    if (error) return <div className="alert alert-error"><AlertCircle className="w-4 h-4" />{error}</div>;
    if (!data.length) return <div className="alert alert-info">No data found for tree visualization.</div>;

    return (
        <div className="relative w-full h-full overflow-hidden bg-white rounded-lg border p-4">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button className="btn btn-sm btn-circle btn-ghost bg-base-200" onClick={() => handleZoom(1.2)}>+</button>
                <button className="btn btn-sm btn-circle btn-ghost bg-base-200" onClick={() => handleZoom(0.8)}>-</button>
                <button className="btn btn-sm btn-ghost bg-base-200" onClick={handleReset}>Reset</button>
            </div>
            <svg ref={svgRef} className="w-full h-full min-h-[800px]"></svg>
            <GraphLegend items={[
                { label: "Critical Severity", color: "#ef4444" },
                { label: "High Severity", color: "#f97316" },
                { label: "Medium Severity", color: "#eab308" },
                { label: "Low Severity", color: "#3b82f6" },
                { label: "Repository / Package", color: "#555" }
            ]} />
        </div>
    );
};
