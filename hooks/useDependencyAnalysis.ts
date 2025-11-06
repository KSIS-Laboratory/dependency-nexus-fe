import { useState, useEffect } from "react";
import { GitHubAPIService, DependencyAnalysis } from "@/lib/github";

export interface UseDependencyAnalysisResult {
  analysis: DependencyAnalysis | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDependencyAnalysis(
  githubToken: string | null,
  owner: string,
  repo: string
): UseDependencyAnalysisResult {
  const [analysis, setAnalysis] = useState<DependencyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (!githubToken || !owner || !repo) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await GitHubAPIService.analyzeDependencies(
        githubToken,
        owner,
        repo
      );
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze dependencies");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [githubToken, owner, repo]);

  return {
    analysis,
    isLoading,
    error,
    refetch: fetchAnalysis,
  };
}
