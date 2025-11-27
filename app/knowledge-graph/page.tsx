"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { AuthService, User } from "@/lib/auth";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { ArrowLeft } from "lucide-react";

export default function KnowledgeGraphPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [user, setUser] = useState<User | null>(null);

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
                        <h2 className="card-title mb-4">Dependency & Vulnerability Graph</h2>
                        <p className="text-base-content/70 mb-6">
                            Visualize the relationships between repositories, packages, and vulnerabilities.
                            Nodes are interactive - drag to rearrange.
                        </p>

                        <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                            <KnowledgeGraph width={1200} height={600} userName={user?.username} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
