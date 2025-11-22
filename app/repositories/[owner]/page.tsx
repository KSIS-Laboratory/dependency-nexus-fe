"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRepositories } from "@/hooks/useRepositories";
import { AuthService, User } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { RepositoryCard } from "@/components/RepositoryCard";
import { PageHeader } from "@/components/PageHeader";
import { OwnerProfileHeader } from "@/components/OwnerProfileHeader";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { triggerChatbotContext } from "@/lib/chatbot";
import { ArrowLeft, Search } from "lucide-react";

export default function OwnerRepositoriesPage({ params }: { readonly params: Promise<{ owner: string }> }) {
    const router = useRouter();
    // Unwrap params using use() hook for Next.js 15+
    const { owner } = use(params);

    const { isAuthenticated, isLoading: authLoading, githubToken } = useAuth();
    const {
        repositories,
        isLoading: reposLoading,
        error,
        refetch
    } = useRepositories(githubToken);

    const [user, setUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const loadUser = async () => {
            if (isAuthenticated) {
                try {
                    const userData = await AuthService.getCurrentUser();
                    setUser(userData);
                } catch (err) {
                    console.error("Failed to load user", err);
                }
            }
        };
        loadUser();
    }, [isAuthenticated]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace("/");
        }
    }, [authLoading, isAuthenticated, router]);

    const handleAnalyze = (repoName: string) => {
        router.push(`/repositories/${repoName}/dependencies`);
    };

    const handleAskAI = (repoName: string) => {
        triggerChatbotContext({
            message: `Analyze repository ${repoName}`,
            autoSend: true,
        });
    };

    // Filter repositories by owner and search query
    const ownerRepositories = repositories.filter(repo => repo.owner === owner);

    const filteredRepositories = ownerRepositories.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate stats
    const totalStars = ownerRepositories.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    const languages = Array.from(new Set(ownerRepositories.map(repo => repo.language).filter((l): l is string => !!l)));

    if (authLoading || reposLoading) {
        return <LoadingSpinner message={`Loading ${owner}'s repositories...`} />;
    }

    if (error) {
        return (
            <ErrorMessage
                message="Failed to load repositories"
                details={error}
                onRetry={refetch}
            />
        );
    }

    return (
        <div className="min-h-screen bg-base-200/50">
            <PageHeader user={user} showUser>
                <div className="flex items-center gap-4">
                    <Link
                        href="/repositories"
                        className="btn btn-ghost btn-circle btn-sm hover:bg-base-content/10"
                        aria-label="Back to all repositories"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm breadcrumbs text-base-content/60">
                        <ul>
                            <li><Link href="/repositories">Repositories</Link></li>
                            <li className="font-semibold text-base-content">{owner}</li>
                        </ul>
                    </div>
                </div>
            </PageHeader>

            <main className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                {/* Owner Profile Header */}
                <OwnerProfileHeader
                    owner={owner}
                    repositoryCount={ownerRepositories.length}
                    totalStars={totalStars}
                    languages={languages}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                {/* Repositories Grid */}
                {filteredRepositories.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredRepositories.map((repo) => (
                            <RepositoryCard
                                key={repo.id}
                                repository={repo}
                                onClick={() => handleAnalyze(repo.full_name)}
                                onAskAI={() => handleAskAI(repo.name)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-base-100/50 backdrop-blur-sm rounded-3xl border border-base-200/50 border-dashed">
                        <div className="bg-base-200 p-6 rounded-full mb-6 animate-pulse">
                            <Search className="h-10 w-10 text-base-content/30" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No repositories found</h3>
                        <p className="text-base-content/60 max-w-md mx-auto">
                            {searchQuery
                                ? `No matches for "${searchQuery}" in ${owner}'s repositories.`
                                : `${owner} doesn't have any repositories visible to you.`}
                        </p>
                        {searchQuery && (
                            <button
                                className="btn btn-primary btn-outline mt-6"
                                onClick={() => setSearchQuery("")}
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}
            </main>

            {user?.id && <ChatbotWidget userId={user.id} />}
        </div>
    );
}
