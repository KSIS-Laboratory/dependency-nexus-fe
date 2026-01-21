import { useQuery } from "@tanstack/react-query";
import { GitHubAPIService, DependencyAnalysis } from "@/lib/github";
import { queryKeys } from "@/lib/query-keys";

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
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dependencies.analysis(owner, repo),
    queryFn: async () => {
      if (!githubToken) {
        throw new Error("GitHub token is required");
      }
      return GitHubAPIService.analyzeDependencies(githubToken, owner, repo);
    },
    enabled: !!githubToken && !!owner && !!repo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    analysis: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch: async () => {
      await refetch();
    },
  };
}
