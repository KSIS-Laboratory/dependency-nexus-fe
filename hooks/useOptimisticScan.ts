import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  VulnerabilityAPIService,
  VulnerabilityQueryResponse,
  PackageQuery,
} from "@/lib/vulnerability";
import { scanCache } from "@/lib/scan-cache";

export interface UseOptimisticScanResult {
  vulnerabilities: VulnerabilityQueryResponse | null;
  isScanning: boolean;
  isFromCache: boolean;
  error: string | null;
  scanPackages: (
    repositoryId: string,
    packages: PackageQuery[]
  ) => Promise<VulnerabilityQueryResponse | undefined>;
  invalidateCache: (repositoryId: string) => void;
  reset: () => void;
}

/**
 * Hook for optimistic vulnerability scanning with caching
 * - Returns cached data immediately if available
 * - Performs background refresh
 * - Prevents duplicate requests
 */
export function useOptimisticScan(
  token: string | null
): UseOptimisticScanResult {
  const [vulnerabilities, setVulnerabilities] =
    useState<VulnerabilityQueryResponse | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      repositoryId,
      packages,
    }: {
      repositoryId: string;
      packages: PackageQuery[];
    }) => {
      if (!token) {
        throw new Error("Token is required");
      }
      if (packages.length === 0) {
        throw new Error("No packages to scan");
      }

      // Generate hash for cache lookup
      const packagesHash = scanCache.hashPackages(packages);

      // Check cache first for optimistic update
      const cached = scanCache.get<VulnerabilityQueryResponse>(
        repositoryId,
        packagesHash
      );

      if (cached) {
        // Return cached immediately
        setVulnerabilities(cached);
        setIsFromCache(true);

        // Background refresh
        VulnerabilityAPIService.scanAndSavePackages(token, repositoryId, packages)
          .then((fresh) => {
            setVulnerabilities(fresh);
            setIsFromCache(false);
            // Invalidate related queries
            queryClient.invalidateQueries({
              queryKey: ["vulnerabilities", repositoryId],
            });
          })
          .catch((err) => {
            console.warn("[OptimisticScan] Background refresh failed:", err);
          });

        return cached;
      }

      // No cache, perform fresh scan
      const result = await VulnerabilityAPIService.scanAndSavePackages(
        token,
        repositoryId,
        packages
      );

      setVulnerabilities(result);
      setIsFromCache(false);

      return result;
    },
    onSuccess: (data, { repositoryId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["vulnerabilities", repositoryId],
      });
      queryClient.invalidateQueries({
        queryKey: ["scanHistory", repositoryId],
      });
    },
  });

  const scanPackages = useCallback(
    async (repositoryId: string, packages: PackageQuery[]) => {
      if (!token || packages.length === 0) {
        return undefined;
      }

      // Cancel previous request if still in-flight
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      return mutation.mutateAsync({ repositoryId, packages });
    },
    [token, mutation]
  );

  const invalidateCache = useCallback((repositoryId: string) => {
    scanCache.invalidate(repositoryId);
  }, []);

  const reset = useCallback(() => {
    setVulnerabilities(null);
    setIsFromCache(false);
    mutation.reset();
  }, [mutation]);

  return {
    vulnerabilities,
    isScanning: mutation.isPending,
    isFromCache,
    error: mutation.error?.message ?? null,
    scanPackages,
    invalidateCache,
    reset,
  };
}
