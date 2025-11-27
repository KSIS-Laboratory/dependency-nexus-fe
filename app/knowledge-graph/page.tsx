"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { AuthService, User } from "@/lib/auth";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { ArrowLeft, Network, GitMerge, Share2 } from "lucide-react";
import { HierarchicalEdgeBundling } from "@/components/HierarchicalEdgeBundling";
import { CollapsibleTree } from "@/components/CollapsibleTree";

export default function KnowledgeGraphPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'force' | 'tree' | 'hierarchical'>('force');

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

    return (
        <div className="min-h-screen bg-base-200">
            <PageHeader user={user} showUser>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="btn btn-ghost btn-sm btn-circle"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-base-content">
                        Knowledge Graph Visualization
                    </h1>
                </div>
            </PageHeader>

            <main className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="card-title">Dependency & Vulnerability Graph</h2>
                                <p className="text-base-content/70">
                                    Visualize the relationships between repositories, packages, and vulnerabilities.
                                </p>
                            </div>

                            <div className="tabs tabs-boxed bg-base-200">
                                <button
                                    className={`tab ${activeTab === 'force' ? 'tab-active' : ''}`}
                                    onClick={() => setActiveTab('force')}
                                >
                                    <Network className="w-4 h-4 mr-2" /> Force Graph
                                </button>
                                <button
                                    className={`tab ${activeTab === 'tree' ? 'tab-active' : ''}`}
                                    onClick={() => setActiveTab('tree')}
                                >
                                    <GitMerge className="w-4 h-4 mr-2" /> Tree View
                                </button>
                                <button
                                    className={`tab ${activeTab === 'hierarchical' ? 'tab-active' : ''}`}
                                    onClick={() => setActiveTab('hierarchical')}
                                >
                                    <Share2 className="w-4 h-4 mr-2" /> Hierarchical Edge Bundling
                                </button>
                            </div>
                        </div>

                        <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-white">
                            {activeTab === 'force' && (
                                <KnowledgeGraph width={1200} height={600} userName={user?.username} />
                            )}
                            {activeTab === 'tree' && (
                                <CollapsibleTree userName={user?.username} />
                            )}
                            {activeTab === 'hierarchical' && (
                                <HierarchicalEdgeBundling userName={user?.username} />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
