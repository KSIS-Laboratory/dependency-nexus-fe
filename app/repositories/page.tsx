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
      message: `วิเคราะห์ช่องโหว่ใน ${repoName} แบบสั้นๆ`,
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
    <div className="min-h-screen bg-base-200">
      <PageHeader user={user} showUser>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-base-content">Repositories</h1>
        </div>
      </PageHeader>

      <main className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-fade-in">
          <div>
            <h2 className="text-3xl font-bold text-base-content flex items-center gap-3">
              <span>All Repositories</span>
              <span className="badge badge-primary">{repositories.length}</span>
            </h2>
            <p className="mt-2 text-base-content/60">
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
            {filteredRepositories.map((repo, index) => (
              <div key={repo.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.03}s` }}>
                <RepositoryCard
                  repository={repo}
                  onClick={() => handleAnalyze(repo.full_name)}
                  onAskAI={() => handleAskAI(repo.name)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body items-center text-center py-20">
              <div className="bg-base-200 p-6 rounded-full mb-6">
                <FolderGit2 className="h-10 w-10 text-base-content/60" />
              </div>
              <h3 className="text-xl font-bold text-base-content mb-2">No repositories found</h3>
              <p className="text-base-content/60 max-w-xs">
                {searchQuery
                  ? `No matches for "${searchQuery}". Try a different search term.`
                  : "You don't have any repositories connected yet."}
              </p>
              {searchQuery && (
                <button
                  className="btn btn-outline mt-6"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {user?.id && <ChatbotWidget userId={user.id} />}
    </div>
  );
}
