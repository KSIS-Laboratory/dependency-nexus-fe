/**
 * React Hook for Scan History Management
 * Handles dependency version tracking with S3 storage
 * Refactored to use TanStack Query for better caching
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  createScanVersion,
  detectChanges,
  getVersionList,
  getLatestScan,
  getScanVersion,
  compareVersions,
  type DependencyScanVersion,
  type ScanVersionListResponse,
  type CreateScanRequest,
  type ScanChangeDetectionResponse,
  type ScanComparison,
} from "@/lib/scan-history";
import { queryKeys } from "@/lib/query-keys";

interface UseScanHistoryOptions {
  repositoryId?: string;
  repositoryName?: string;
  token?: string;
  onError?: (error: Error) => void;
}

export function useScanHistory(options: UseScanHistoryOptions = {}) {
  const { repositoryId, repositoryName, token, onError } = options;
  const queryClient = useQueryClient();

  const handleError = useCallback(
    (err: Error) => {
      if (onError) {
        onError(err);
      }
    },
    [onError]
  );

  // Query: Fetch version list
  const versionListQuery = useQuery({
    queryKey: queryKeys.scanHistory.versions(
      repositoryId ?? "",
      repositoryName ?? ""
    ),
    queryFn: async () => {
      if (!repositoryId || !repositoryName || !token) {
        throw new Error("Repository ID, name, and token required");
      }
      return getVersionList(repositoryId, repositoryName, token);
    },
    enabled: !!repositoryId && !!repositoryName && !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Query: Fetch latest scan
  const latestScanQuery = useQuery({
    queryKey: queryKeys.scanHistory.latest(repositoryId ?? ""),
    queryFn: async () => {
      if (!repositoryId || !token) {
        throw new Error("Repository ID and token required");
      }
      return getLatestScan(repositoryId, token);
    },
    enabled: !!repositoryId && !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation: Create scan
  const createScanMutation = useMutation({
    mutationFn: async (request: CreateScanRequest) => {
      if (!token) {
        throw new Error("Authentication token required");
      }
      return createScanVersion(request, token);
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.scanHistory.all,
      });
    },
    onError: handleError,
  });

  // Mutation: Detect changes
  const detectChangesMutation = useMutation({
    mutationFn: async (request: CreateScanRequest) => {
      if (!token) {
        throw new Error("Authentication token required");
      }
      return detectChanges(request, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scanHistory.all,
      });
    },
    onError: handleError,
  });

  // Mutation: Compare versions
  const compareMutation = useMutation({
    mutationFn: async ({
      fromVersion,
      toVersion,
      repoId,
    }: {
      fromVersion: string;
      toVersion: string;
      repoId?: string;
    }) => {
      const id = repoId || repositoryId;
      if (!id || !token) {
        throw new Error("Repository ID and token required");
      }
      return compareVersions(id, fromVersion, toVersion, token);
    },
    onError: handleError,
  });

  // Mutation: Fetch specific version (using mutation for on-demand fetching)
  const fetchVersionMutation = useMutation({
    mutationFn: async ({
      versionId,
      repoId,
    }: {
      versionId: string;
      repoId?: string;
    }) => {
      const id = repoId || repositoryId;
      if (!id || !token) {
        throw new Error("Repository ID and token required");
      }
      return getScanVersion(id, versionId, token);
    },
    onError: handleError,
  });

  // Legacy wrapper functions for backward compatibility
  const fetchVersionList = useCallback(
    async (repoId?: string, repoName?: string) => {
      // Just trigger a refetch
      await versionListQuery.refetch();
      return versionListQuery.data;
    },
    [versionListQuery]
  );

  const fetchLatestScan = useCallback(async () => {
    await latestScanQuery.refetch();
    return latestScanQuery.data;
  }, [latestScanQuery]);

  const fetchVersion = useCallback(
    async (versionId: string, repoId?: string) => {
      return fetchVersionMutation.mutateAsync({ versionId, repoId });
    },
    [fetchVersionMutation]
  );

  const createScan = useCallback(
    async (request: CreateScanRequest) => {
      return createScanMutation.mutateAsync(request);
    },
    [createScanMutation]
  );

  const detectAndCreateScan = useCallback(
    async (request: CreateScanRequest) => {
      return detectChangesMutation.mutateAsync(request);
    },
    [detectChangesMutation]
  );

  const compareScans = useCallback(
    async (fromVersion: string, toVersion: string, repoId?: string) => {
      return compareMutation.mutateAsync({ fromVersion, toVersion, repoId });
    },
    [compareMutation]
  );

  const clearState = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.scanHistory.all,
    });
  }, [queryClient]);

  // Combined loading state
  const loading =
    versionListQuery.isLoading ||
    latestScanQuery.isLoading ||
    createScanMutation.isPending ||
    detectChangesMutation.isPending ||
    compareMutation.isPending ||
    fetchVersionMutation.isPending;

  // Combined error state
  const error =
    versionListQuery.error?.message ||
    latestScanQuery.error?.message ||
    createScanMutation.error?.message ||
    detectChangesMutation.error?.message ||
    compareMutation.error?.message ||
    fetchVersionMutation.error?.message ||
    null;

  return {
    // State
    loading,
    error,
    versionList: versionListQuery.data ?? null,
    latestScan: latestScanQuery.data ?? null,
    currentVersion: fetchVersionMutation.data ?? null,
    comparison: compareMutation.data ?? null,
    changeDetection: detectChangesMutation.data ?? null,

    // For backward compatibility with ScanHistoryPanel
    scanHistory: null,

    // Actions
    createScan,
    detectAndCreateScan,
    fetchScanHistory: fetchVersionList, // Alias
    fetchVersionList,
    fetchLatestScan,
    fetchVersion,
    compareScans,
    clearState,
  };
}
