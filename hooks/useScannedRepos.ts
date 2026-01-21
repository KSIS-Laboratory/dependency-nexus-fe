"use client";

import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";

interface ScannedRepository {
  name: string;
  full_name: string;
  has_history: boolean;
}

interface ScannedReposResponse {
  repositories: ScannedRepository[];
}

async function fetchScannedRepos(
  githubToken: string
): Promise<ScannedRepository[]> {
  const response = await fetch(`${API_URL}/api/github/repositories`, {
    headers: { Authorization: `Bearer ${githubToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  const data: ScannedReposResponse = await response.json();
  return (data.repositories ?? []).filter((r) => r.has_history);
}

export interface UseScannedReposResult {
  repos: ScannedRepository[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useScannedRepos(
  githubToken: string | null
): UseScannedReposResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.repositories.scanned,
    queryFn: async () => {
      if (!githubToken) {
        throw new Error("GitHub token is required");
      }
      return fetchScannedRepos(githubToken);
    },
    enabled: !!githubToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    repos: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch: async () => {
      await refetch();
    },
  };
}
