"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRepositories } from "@/hooks/useRepositories";
import { AuthService, User } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { RepositoryCard } from "@/components/RepositoryCard";
import { RepositorySearch } from "@/components/RepositorySearch";
import { PageHeader } from "@/components/PageHeader";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { triggerChatbotContext } from "@/lib/chatbot";
import { FolderGit2, ArrowLeft } from "lucide-react";

export default function RepositoriesPage() {
  const router = useRouter();
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

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || reposLoading) {
    return <LoadingSpinner message="Loading repositories..." />;
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
            href="/dashboard"
            className="btn btn-ghost btn-circle btn-sm hover:bg-base-content/10"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-base-content">Repositories</h1>
        </div>
      </PageHeader>

      <main className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-base-content flex items-center gap-3">
              <span>All Repositories</span>
              <span className="badge badge-lg badge-primary badge-outline font-mono">{repositories.length}</span>
            </h2>
            <p className="mt-2 text-base-content/70">
              Manage and analyze your GitHub repositories
            </p>
          </div>

          <div className="w-full md:max-w-xs">
            <RepositorySearch
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </div>

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
              <FolderGit2 className="h-10 w-10 text-base-content/30" />
            </div>
            <h3 className="text-xl font-bold mb-2">No repositories found</h3>
            <p className="text-base-content/60 max-w-xs mx-auto">
              {searchQuery
                ? `No matches for "${searchQuery}". Try a different search term.`
                : "You don't have any repositories connected yet."}
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
