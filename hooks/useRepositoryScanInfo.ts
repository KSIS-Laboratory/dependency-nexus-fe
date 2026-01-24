"use client";

import { useState, useEffect, useMemo } from "react";
import { VulnerabilityAPIService } from "@/lib/vulnerability";

interface ScanInfo {
  lastScanDate: Date | null;
  totalScans: number;
  totalVulnerabilities: number;
}

interface UseRepositoryScanInfoResult {
  scanInfo: Record<string, ScanInfo>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch scan information for multiple repositories
 * Returns a map of repository full_name to scan info
 */
export function useRepositoryScanInfo(
  jwtToken: string | null,
  repositoryNames: string[]
): UseRepositoryScanInfoResult {
  const [scanInfo, setScanInfo] = useState<Record<string, ScanInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize repository names to prevent unnecessary re-fetches
  const repoNamesKey = useMemo(
    () => repositoryNames.toSorted((a, b) => a.localeCompare(b)).join(","),
    [repositoryNames]
  );

  useEffect(() => {
    if (!jwtToken || repositoryNames.length === 0) {
      setScanInfo({});
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const fetchScanInfo = async () => {
      try {
        // Batch fetch scan history for all repositories
        const results = await Promise.allSettled(
          repositoryNames.map(async (repoName) => {
            const history = await VulnerabilityAPIService.getScanHistory(
              jwtToken,
              repoName
            );

            const latestScan = history?.scans?.[0] ?? null;
            const lastScanDate = latestScan?.scan_timestamp
              ? new Date(latestScan.scan_timestamp)
              : null;

            return {
              repoName,
              info: {
                lastScanDate,
                totalScans: history?.total_scans ?? history?.scans?.length ?? 0,
                totalVulnerabilities: latestScan?.total_vulnerabilities ?? 0,
              },
            };
          })
        );

        if (isCancelled) return;

        const newScanInfo: Record<string, ScanInfo> = {};

        for (const result of results) {
          if (result.status === "fulfilled") {
            newScanInfo[result.value.repoName] = result.value.info;
          } else {
            // For failed requests, set null values
            // We don't need to show error for individual repos
          }
        }

        setScanInfo(newScanInfo);
        setIsLoading(false);
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch scan info");
          setIsLoading(false);
        }
      }
    };

    fetchScanInfo();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwtToken, repoNamesKey]);

  return { scanInfo, isLoading, error };
}

/**
 * Get scan info for a single repository
 */
export function getScanInfo(
  scanInfoMap: Record<string, ScanInfo>,
  repoFullName: string
): ScanInfo | undefined {
  return scanInfoMap[repoFullName];
}
