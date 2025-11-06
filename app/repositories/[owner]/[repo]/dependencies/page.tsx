"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDependencyAnalysis } from "@/hooks/useDependencyAnalysis";
import { AuthService, User } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { DependencyFileCard } from "@/components/DependencyFileCard";
import { DependencySection } from "@/components/DependencySection";
import { EmptyState } from "@/components/EmptyState";
import { Package, ArrowLeft } from "lucide-react";

export default function DependenciesPage() {
  const router = useRouter();
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  
  const { isAuthenticated, isLoading: authLoading, githubToken } = useAuth();
  const { analysis, isLoading: analysisLoading, error } = useDependencyAnalysis(
    githubToken,
    owner,
    repo
  );
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

  const isLoading = authLoading || analysisLoading;

  if (isLoading) {
    return <LoadingSpinner message="Analyzing dependencies..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onBack={() => router.push("/repositories")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <PageHeader user={user} showUser>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/repositories")}
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Back to repositories"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">
            {owner}/{repo}
          </h1>
        </div>
      </PageHeader>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Dependency Analysis
          </h2>
        </div>

        {/* Dependency Files Found */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 ">
            <h3 className="text-xl font-bold">
              Dependency Files
            </h3>
            <div>
              {Object.keys(analysis?.dependency_files || {}).length}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(analysis?.dependency_files || {}).map(([filename, info]) => (
              <DependencyFileCard
                key={filename}
                filename={filename}
                info={info}
              />
            ))}
          </div>
        </div>

        {/* Dependencies */}
        <div>
          <h3 className="text-xl font-bold mb-4">
            Dependencies
          </h3>
          <div className="space-y-6">
            {Object.entries(analysis?.dependencies || {}).map(([filename, deps]: [string, any]) => (
              <DependencySection
                key={filename}
                filename={filename}
                dependencies={deps}
              />
            ))}
          </div>
        </div>

        {Object.keys(analysis?.dependency_files || {}).length === 0 && (
          <EmptyState
            icon={Package}
            message="No dependency files found in this repository"
          />
        )}
      </main>
    </div>
  );
}
