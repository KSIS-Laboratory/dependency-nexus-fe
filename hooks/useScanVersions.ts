"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";

interface ScanVersion {
  version_id: string;
  scan_timestamp: string;
  total_count: number;
  vulnerability_summary?: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
}

interface VersionListResponse {
  versions: ScanVersion[];
}

async function fetchVersionList(
  repositoryId: string,
  repositoryName: string,
  githubToken: string
): Promise<ScanVersion[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/scan-history/repositories/${encodeURIComponent(
      repositoryId
    )}/versions?repository_name=${encodeURIComponent(repositoryName)}`,
    {
      headers: { Authorization: `Bearer ${githubToken}` },
    }
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error("Failed to fetch versions");
  }

  const data: VersionListResponse = await response.json();
  return data.versions ?? [];
}

export interface UseScanVersionsResult {
  versions: ScanVersion[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useScanVersions(
  repositoryId: string | null,
  repositoryName: string | null,
  githubToken: string | null
): UseScanVersionsResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.scanHistory.versions(
      repositoryId ?? "",
      repositoryName ?? ""
    ),
    queryFn: async () => {
      if (!githubToken || !repositoryId || !repositoryName) {
        throw new Error("Missing required parameters");
      }
      return fetchVersionList(repositoryId, repositoryName, githubToken);
    },
    enabled: !!githubToken && !!repositoryId && !!repositoryName,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    // Ensure versions is always an array
    versions: Array.isArray(data) ? data : [],
    isLoading,
    error: error?.message ?? null,
    refetch: async () => {
      await refetch();
    },
  };
}

export type { ScanVersion };
