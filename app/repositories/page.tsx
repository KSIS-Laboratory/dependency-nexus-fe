"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRepositories } from "@/hooks/useRepositories";
import { AuthService, User } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { RepositoryCard } from "@/components/RepositoryCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FolderGit2, ArrowLeft } from "lucide-react";


export default function RepositoriesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, githubToken } = useAuth();
  const { repositories, isLoading: reposLoading, error } = useRepositories(githubToken);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated) {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
      }
    };
    loadUser();
  }, [isAuthenticated]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push("/");
    return null;
  }

  const isLoading = authLoading || reposLoading;

  const handleAnalyze = (fullName: string) => {
    router.push(`/repositories/${fullName}/dependencies`);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading repositories..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <PageHeader user={user} showUser>
        <button
            onClick={() => router.push("/dashboard")}
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Back to repositories"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        <h1 className="text-xl font-bold text-base-content">Your Repositories</h1>
      </PageHeader>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <span>Repositories</span>
            <span className="badge badge-lg badge-outline ml-3 text-base-content">{repositories.length}</span>
          </h2>
          <p className="mt-2 opacity-70 text-base-content">
            Click on a repository to analyze its dependencies
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              onClick={() => handleAnalyze(repo.full_name)}
            />
          ))}
        </div>

        {repositories.length === 0 && (
          <EmptyState
            icon={FolderGit2}
            message="No repositories found"
          />
        )}
      </main>
    </div>
  );
}
