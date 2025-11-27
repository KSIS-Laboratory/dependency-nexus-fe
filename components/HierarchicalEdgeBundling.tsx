"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import { GraphLegend } from "@/components/GraphLegend";

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

        if (userName) {
            fetchData();
        }
    }, [userName]);

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
                const node: HierarchyNode = { name: pkgName, type: "package", children: [], path: `Repositories/${repoName}/${pkgName}` };
                pkgMap.set(key, node);
                getRepoNode(repoName).children!.push(node);
            }
            return pkgMap.get(key)!;
        };

        const getSevNode = (severity: string) => {
            const sevName = severity || "UNKNOWN";
            if (!sevMap.has(sevName)) {
                const node: HierarchyNode = { name: sevName, type: "severity", children: [], path: `Vulnerabilities/${sevName}` };
                sevMap.set(sevName, node);
                vulnsGroup.children!.push(node);
            }
            return sevMap.get(sevName)!;
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

        tree(rootHierarchy);

        // Map paths to nodes for link creation
        const nodeByPath = new Map(rootHierarchy.descendants().map(d => [d.data.path, d]));

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
                const target = d![d!.length - 1];
                if (target.data.type === 'vulnerability') {
                    const path = target.data.path || "";
                    if (path.includes("CRITICAL")) return "#ef4444";
                    if (path.includes("HIGH")) return "#f97316";
                    if (path.includes("MEDIUM")) return "#eab308";
                    if (path.includes("LOW")) return "#94a3b8";
                }
                return "#ccc";
            })
            .attr("stroke-width", 1);

        // Draw Nodes
        const node = g.append("g")
            .selectAll("g")
            .data(rootHierarchy.leaves())
            .join("g")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
            .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
            .text(d => d.data.name)
            .attr("fill", d => {
                if (d.data.type === 'vulnerability') {
                    const path = d.data.path || "";
                    if (path.includes("CRITICAL")) return "#ef4444";
                    if (path.includes("HIGH")) return "#f97316";
                    if (path.includes("MEDIUM")) return "#eab308";
                    if (path.includes("LOW")) return "#94a3b8";
                }
                return "#333";
            })
            .style("font-weight", d => d.data.type === 'vulnerability' ? "bold" : "normal")
            .each(function (d) { (d as any).textNode = this; });

        // Interaction
        const mouseovered = (event: any, d: any) => {
            node.style("opacity", 0.1);
            link.style("stroke-opacity", 0.1);

            d3.select(event.currentTarget).style("opacity", 1);

            // Highlight connected links
            link.filter((l: any) => l[0] === d || l[l.length - 1] === d)
                .style("stroke-opacity", 1)
                .style("stroke-width", 2)
                .each(function (l: any) {
                    // Highlight connected node
                    const other = l[0] === d ? l[l.length - 1] : l[0];
                    d3.select((other as any).textNode).style("opacity", 1).style("font-weight", "bold");
                });
        };

        const mouseouted = () => {
            node.style("opacity", 1).style("font-weight", d => d.data.type === 'vulnerability' ? "bold" : "normal");
            link.style("stroke-opacity", 0.5).style("stroke-width", 1);
        };

        node.on("mouseover", mouseovered)
            .on("mouseout", mouseouted);

    }, [data]);

    if (loading) return <LoadingSpinner message="Loading visualization..." />;
    if (error) return <div className="alert alert-error"><AlertCircle className="w-4 h-4" />{error}</div>;
    if (!data.length) return <div className="alert alert-info">No data found.</div>;

    return (
        <div className="w-full h-full overflow-hidden bg-white rounded-lg border p-4 flex justify-center items-center relative">
            <svg ref={svgRef} className="w-full h-full"></svg>
            <GraphLegend items={[
                { label: "Critical Severity", color: "#ef4444" },
                { label: "High Severity", color: "#f97316" },
                { label: "Medium Severity", color: "#eab308" },
                { label: "Low Severity", color: "#94a3b8" },
                { label: "Repository / Package", color: "#333" }
            ]} />
        </div>
    );
};
