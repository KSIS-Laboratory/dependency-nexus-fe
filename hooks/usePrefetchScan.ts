import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { VulnerabilityAPIService, PackageQuery } from "@/lib/vulnerability";
import { scanCache } from "@/lib/scan-cache";

/**
 * Hook for prefetching vulnerability data
 * Use this to preload data before user navigates to scan results
 */
export function usePrefetchScan(token: string | null) {
  const queryClient = useQueryClient();

  /**
   * Prefetch scan data for a repository
   * Call this on hover or when repository is visible in viewport
   */
  const prefetchScan = useCallback(
    async (repositoryId: string, packages: PackageQuery[]) => {
      if (!token || packages.length === 0) return;

      const packagesHash = scanCache.hashPackages(packages);

      // Skip if already cached
      if (scanCache.get(repositoryId, packagesHash)) {
        console.log(`[Prefetch] Already cached: ${repositoryId}`);
        return;
      }

      console.log(`[Prefetch] Starting prefetch for ${repositoryId}`);

      try {
        // Use queryClient prefetch for React Query integration
        await queryClient.prefetchQuery({
          queryKey: ["vulnerabilities", repositoryId, packagesHash],
          queryFn: () =>
            VulnerabilityAPIService.scanAndSavePackages(
              token,
              repositoryId,
              packages
            ),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });

        console.log(`[Prefetch] Completed for ${repositoryId}`);
      } catch (err) {
        console.warn(`[Prefetch] Failed for ${repositoryId}:`, err);
      }
    },
    [token, queryClient]
  );

  /**
   * Prefetch scan history for a repository
   */
  const prefetchHistory = useCallback(
    async (repositoryId: string) => {
      if (!token) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: ["scanHistory", repositoryId],
          queryFn: () =>
            VulnerabilityAPIService.getScanHistory(token, repositoryId),
          staleTime: 2 * 60 * 1000, // 2 minutes
        });
      } catch (err) {
        console.warn(`[Prefetch] History failed for ${repositoryId}:`, err);
      }
    },
    [token, queryClient]
  );

  /**
   * Prefetch vulnerability detail
   */
  const prefetchVulnDetail = useCallback(
    async (vulnId: string) => {
      if (!token || !vulnId) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: ["vulnDetail", vulnId],
          queryFn: () =>
            VulnerabilityAPIService.getVulnerabilityDetail(token, vulnId),
          staleTime: 30 * 60 * 1000, // 30 minutes (vuln details don't change often)
        });
      } catch (err) {
        console.warn(`[Prefetch] Vuln detail failed for ${vulnId}:`, err);
      }
    },
    [token, queryClient]
  );

  return {
    prefetchScan,
    prefetchHistory,
    prefetchVulnDetail,
  };
}
