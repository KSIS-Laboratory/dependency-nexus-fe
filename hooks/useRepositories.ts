import { useState, useEffect, useCallback } from "react";
import { GitHubAPIService, Repository } from "@/lib/github";

export interface UseRepositoriesResult {
  repositories: Repository[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const PER_PAGE = 15;

export function useRepositories(githubToken: string | null): UseRepositoriesResult {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchRepositories = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!githubToken) {
      setIsLoading(false);
      return;
    }

    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const response = await GitHubAPIService.getRepositories(githubToken, pageNum, PER_PAGE);
      
      if (append) {
        setRepositories(prev => [...prev, ...response.repositories]);
      } else {
        setRepositories(response.repositories);
      }
      
      setHasMore(response.has_more);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || "Failed to fetch repositories");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [githubToken]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await fetchRepositories(page + 1, true);
  }, [fetchRepositories, hasMore, isLoadingMore, page]);

  const refetch = useCallback(async () => {
    setPage(1);
    await fetchRepositories(1, false);
  }, [fetchRepositories]);

  useEffect(() => {
    fetchRepositories(1, false);
  }, [fetchRepositories]);

  return {
    repositories,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    page,
    refetch,
    loadMore,
  };
}
