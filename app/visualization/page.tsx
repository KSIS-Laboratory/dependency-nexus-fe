"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { AuthService, User } from "@/lib/auth";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { ArrowLeft, Network, GitMerge, Share2, Info, Home, Grid3X3, TrendingUp } from "lucide-react";
import { HierarchicalEdgeBundling } from "@/components/HierarchicalEdgeBundling";
import { CollapsibleTree } from "@/components/CollapsibleTree";
import { SecurityHeatmap } from "@/components/SecurityHeatmap";
import { TrendAnalysis } from "@/components/TrendAnalysis";
import Link from "next/link";

type TabId = 'force' | 'tree' | 'hierarchical' | 'heatmap' | 'trend';

interface TabConfig {
    id: TabId;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    description: string;
    tips: string[];
}

export default function KnowledgeGraphPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('force');
    const [showTips, setShowTips] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            if (isLoading) return;
            if (!isAuthenticated) {
                router.push("/");
                return;
            }
            try {
                const currentUser = await AuthService.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error("Failed to load user", error);
            }
        };
        loadUser();
    }, [isAuthenticated, isLoading, router]);

    const tabs: TabConfig[] = [
        {
            id: 'force',
            label: 'Force Graph',
            shortLabel: 'Force',
            icon: Share2,
            description: 'Interactive force-directed graph showing package dependencies and their relationships.',
            tips: [
                'Drag nodes to rearrange the layout',
                'Scroll to zoom in/out',
                'Click on a vulnerability node to view details',
                'Color indicates vulnerability severity'
            ]
        },
        {
            id: 'tree',
            label: 'Tree View',
            shortLabel: 'Tree',
            icon: Network,
            description: 'Hierarchical tree visualization of dependency chains from root to leaves.',
            tips: [
                'Click nodes to expand/collapse branches',
                'Click on a vulnerability node to view details',
                'Shows dependency depth clearly',
                'Great for understanding package hierarchy',
                'Hover for vulnerability details'
            ]
        },
        {
            id: 'hierarchical',
            label: 'Hierarchical Edge Bundling',
            shortLabel: 'Radial',
            icon: GitMerge,
            description: 'Circular layout with bundled edges to show complex relationships clearly.',
            tips: [
                'Hover over nodes to highlight connections',
                'Click on a vulnerability node to view details',
                'Bundled edges reduce visual clutter',
                'Great for seeing overall structure',
                'Colors indicate vulnerability severity'
            ]
        },
        {
            id: 'heatmap',
            label: 'Security Heatmap',
            shortLabel: 'Heatmap',
            icon: Grid3X3,
            description: 'Heatmap showing vulnerability severity distribution across all repositories.',
            tips: [
                'Color intensity shows vulnerability count',
                'Filter by specific repositories',
                'Quickly identify high-risk repos',
                'Summary stats at the bottom'
            ]
        },
        {
            id: 'trend',
            label: 'Trend Analysis',
            shortLabel: 'Trend',
            icon: TrendingUp,
            description: 'Track vulnerability counts over time to see if security is improving or declining.',
            tips: [
                'Shows vulnerability trends over scan history',
                'Stacked areas show severity breakdown',
                'Trend indicator shows overall direction',
                'Hover points for detailed breakdown'
            ]
        },
    ];

    const activeTabConfig = tabs.find(t => t.id === activeTab)!;

    return (
        <div className="min-h-screen bg-base-200">
            <PageHeader user={user} showUser>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        {/* Breadcrumb */}
                        <div className="hidden sm:flex items-center text-sm breadcrumbs p-0 m-0">
                            <ul className="flex items-center gap-1">
                                <li>
                                    <Link href="/dashboard" className="text-base-content/60 hover:text-primary transition-colors flex items-center gap-1">
                                        <Home className="w-3.5 h-3.5" />
                                        Dashboard
                                    </Link>
                                </li>
                                <li className="flex items-center">
                                    <span className="text-base-content font-medium">Visualization</span>
                                </li>
                            </ul>
                        </div>
                        <h1 className="text-xl font-bold text-base-content sm:hidden">
                            Visualization
                        </h1>
                    </div>
                </div>
            </PageHeader>

            <main className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header Card */}
                <div className="card bg-base-100 shadow-lg mb-4 overflow-hidden">
                    <div className="card-body p-4 sm:p-6">
                        <div className="flex flex-col gap-4">
                            {/* Title and Description */}
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
                                        <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                                            Dependency & Vulnerability Graph
                                        </span>
                                    </h2>
                                    <p className="text-base-content/60 text-sm mt-2 max-w-2xl">
                                        Explore and analyze relationships between your repositories, packages, and security vulnerabilities
                                        using interactive graph visualizations.
                                    </p>
                                </div>
                            </div>

                            {/* Tabs Navigation - Sticky on scroll */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-base-200">
                                <div role="tablist" className="tabs tabs-boxed bg-base-200 p-1 flex-wrap rounded-lg">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            role="tab"
                                            aria-selected={activeTab === tab.id}
                                            className={`tab gap-2 transition-all duration-200 ${activeTab === tab.id
                                                ? 'tab-active bg-primary text-primary-content shadow-md rounded-lg'
                                                : 'hover:bg-base-300 rounded-lg'
                                                }`}
                                            onClick={() => setActiveTab(tab.id)}
                                            title={tab.description}
                                        >
                                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                                            <span className="hidden md:inline">{tab.label}</span>
                                            <span className="md:hidden">{tab.shortLabel}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Tips Toggle */}
                                <button
                                    onClick={() => setShowTips(!showTips)}
                                    className={`btn btn-sm btn-ghost gap-2 ${showTips ? 'text-info' : 'text-base-content/60'}`}
                                >
                                    <Info className="w-4 h-4" />
                                    <span className="hidden sm:inline">{showTips ? 'Hide Tips' : 'Show Tips'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tips Panel - Collapsible */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showTips ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'
                    }`}>
                    <div className="alert bg-info/10 border border-info/20 shadow-sm">
                        <Info className="w-5 h-5 text-info shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-base-content text-sm">{activeTabConfig.label}</h3>
                            <p className="text-xs text-base-content/70 mt-0.5">{activeTabConfig.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {activeTabConfig.tips.map((tip) => (
                                    <span key={`tip-${activeTab}-${tip.slice(0, 15).replaceAll(/\s/g, '-')}`} className="badge badge-sm badge-ghost bg-base-100/50">
                                        {tip}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visualization Card */}
                <div className="card bg-base-100 shadow-lg rounded-lg overflow-hidden">
                    {/* Active Tab Indicator Bar */}
                    <div className="h-1 bg-linear-to-r from-primary via-secondary to-accent"></div>

                    {/* Visualization Container - Responsive Height */}
                    <div className="w-full h-[calc(100vh-320px)] min-h-[500px] max-h-[800px] bg-base-100 relative">
                        {/* Tab Content with Fade Transition */}
                        <div className="absolute inset-0 transition-opacity duration-300">
                            {activeTab === 'force' && (
                                <KnowledgeGraph width={1200} height={700} userName={user?.username} />
                            )}
                            {activeTab === 'tree' && (
                                <CollapsibleTree userName={user?.username} />
                            )}
                            {activeTab === 'hierarchical' && (
                                <HierarchicalEdgeBundling userName={user?.username} />
                            )}
                            {activeTab === 'heatmap' && (
                                <SecurityHeatmap width={1100} height={600} />
                            )}
                            {activeTab === 'trend' && (
                                <TrendAnalysis />
                            )}
                        </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="px-4 py-2 bg-base-200/50 border-t border-base-300 flex items-center justify-between text-xs text-base-content/60">
                        <div className="flex items-center gap-4 ">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                <span>Ready</span>
                            </span>
                            <span className="hidden sm:inline">Current View: <span className="font-medium text-base-content">{activeTabConfig.label}</span></span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

