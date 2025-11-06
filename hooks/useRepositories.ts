import { useState, useEffect } from "react";
import { GitHubAPIService, Repository } from "@/lib/github";

export interface UseRepositoriesResult {
  repositories: Repository[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRepositories(githubToken: string | null): UseRepositoriesResult {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = async () => {
    if (!githubToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const repos = await GitHubAPIService.getRepositories(githubToken);
      setRepositories(repos);
    } catch (err: any) {
      setError(err.message || "Failed to fetch repositories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, [githubToken]);

  return {
    repositories,
    isLoading,
    error,
    refetch: fetchRepositories,
  };
}
