"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRepositories } from "@/hooks/useRepositories";
import { AuthService, User } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { RepositoryCard } from "@/components/RepositoryCard";
import { RepositorySearch } from "@/components/RepositorySearch";
import { RepositoryFilterBar, RepositoryFilters, defaultFilters, applyRepositoryFilters } from "@/components/RepositoryFilterBar";
import { PageHeader } from "@/components/PageHeader";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { triggerChatbotContext, ChatbotClient } from "@/lib/chatbot";
import { FolderGit2, ArrowLeft, Loader2 } from "lucide-react";

export default function RepositoriesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, githubToken } = useAuth();
  const {
    repositories,
    isLoading: reposLoading,
    isLoadingMore,
    error,
    hasMore,
    refetch,
    loadMore
  } = useRepositories(githubToken);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<RepositoryFilters>(defaultFilters);

  // Intersection Observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  // Infinite scroll observer - only when no filters active
  const hasActiveFilters = filters.owners.length > 0 ||
    filters.languages.length > 0 ||
    filters.visibility !== "all" ||
    filters.scanned !== "all";

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !searchQuery && !hasActiveFilters) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore, searchQuery, hasActiveFilters]);

  const handleAnalyze = (repoName: string) => {
    router.push(`/repositories/${repoName}/dependencies`);
  };

  const handleAskAI = async (repoFullName: string, repoName: string) => {
    // Extract vulnerability context from MinIO automatically
    let contextInfo = "";
    try {
      const context = await ChatbotClient.extractRepositoryContext(repoFullName, 15);
      if (context.vulnerability_count > 0) {
        contextInfo = `\n\n[Vulnerability Context - ${context.vulnerability_count} รายการ]\n${context.summary}\n\n${context.context}`;
      }
    } catch (error) {
      console.warn("Could not fetch vulnerability context:", error);
    }

    const prompt = `[Repository: ${repoName}]

กรุณาวิเคราะห์ช่องโหว่ (Vulnerabilities) ของ repository นี้:

1. สรุปจำนวนช่องโหว่ตาม Severity (Critical, High, Moderate, Low)
2. แสดง packages ที่มีความเสี่ยงสูงสุด 5 อันดับ
3. แนะนำวิธีแก้ไขเร่งด่วนสำหรับ Critical vulnerabilities
4. ประเมินความเสี่ยงโดยรวมของ repository${contextInfo}`;

    triggerChatbotContext({
      message: prompt,
      autoSend: true,
    });
  };

  // Apply all filters
  const filteredRepositories = applyRepositoryFilters(repositories, filters, searchQuery);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 animate-fade-in">
          <div>
            <h2 className="text-3xl font-bold text-base-content flex items-center gap-3">
              <span>All Repositories</span>
              <span className="badge badge-primary">{repositories.length}{hasMore ? '+' : ''}</span>
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

        {/* Filter Bar */}
        <RepositoryFilterBar
          repositories={repositories}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Results Count */}
        {(searchQuery || hasActiveFilters) && (
          <div className="mb-4 text-sm text-base-content/60">
            Showing {filteredRepositories.length} of {repositories.length} repositories
          </div>
        )}

        {filteredRepositories.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRepositories.map((repo, index) => (
                <div key={repo.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(index, 20) * 0.03}s` }}>
                  <RepositoryCard
                    repository={repo}
                    onClick={() => handleAnalyze(repo.full_name)}
                    onAskAI={() => handleAskAI(repo.full_name, repo.name)}
                  />
                </div>
              ))}
            </div>

            {/* Load More Trigger / Loading Indicator */}
            {!searchQuery && !hasActiveFilters && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-base-content/60">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more repositories...</span>
                  </div>
                )}
                {!hasMore && repositories.length > 0 && (
                  <p className="text-base-content/40 text-sm">
                    All {repositories.length} repositories loaded
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body items-center text-center py-20">
              <div className="bg-base-200 p-6 rounded-full mb-6">
                <FolderGit2 className="h-10 w-10 text-base-content/60" />
              </div>
              <h3 className="text-xl font-bold text-base-content mb-2">No repositories found</h3>
              <p className="text-base-content/60 max-w-xs">
                {searchQuery || hasActiveFilters
                  ? "No repositories match your current filters. Try adjusting your search or filters."
                  : "You don't have any repositories connected yet."}
              </p>
              {(searchQuery || hasActiveFilters) && (
                <button
                  className="btn btn-outline mt-6"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters(defaultFilters);
                  }}
                >
                  Clear all filters
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
