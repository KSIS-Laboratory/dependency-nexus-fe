/**
 * React Hook for Scan History Management
 * Handles dependency version tracking with S3 storage
 */

import { useState, useCallback } from "react";
import {
  createScanVersion,
  detectChanges,
  getScanHistory,
  getVersionList,
  getLatestScan,
  getScanVersion,
  compareVersions,
  type DependencyScanVersion,
  type ScanHistoryResponse,
  type ScanVersionListResponse,
  type CreateScanRequest,
  type ScanChangeDetectionResponse,
  type ScanComparison,
} from "@/lib/scan-history";

interface UseScanHistoryOptions {
  repositoryId?: string;
  repositoryName?: string;
  token?: string;
  onError?: (error: Error) => void;
}

export function useScanHistory(options: UseScanHistoryOptions = {}) {
  const { repositoryId, repositoryName, token, onError } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryResponse | null>(null);
  const [versionList, setVersionList] = useState<ScanVersionListResponse | null>(null);
  const [latestScan, setLatestScan] = useState<DependencyScanVersion | null>(null);
  const [currentVersion, setCurrentVersion] = useState<DependencyScanVersion | null>(null);
  const [comparison, setComparison] = useState<ScanComparison | null>(null);
  const [changeDetection, setChangeDetection] = useState<ScanChangeDetectionResponse | null>(null);

  const handleError = useCallback(
    (err: Error) => {
      const message = err.message || "An error occurred";
      setError(message);
      if (onError) {
        onError(err);
      }
    },
    [onError]
  );

  /**
   * Create a new scan version
   */
  const createScan = useCallback(
    async (request: CreateScanRequest) => {
      if (!token) {
        throw new Error("Authentication token required");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await createScanVersion(request, token);
        setCurrentVersion(result);
        return result;
      } catch (err) {
        handleError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  /**
   * Detect changes and create new scan
   * Use this to check if dependencies changed before creating a new version
   */
  const detectAndCreateScan = useCallback(
    async (request: CreateScanRequest) => {
      if (!token) {
        throw new Error("Authentication token required");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await detectChanges(request, token);
        setChangeDetection(result);
        setCurrentVersion(result.comparison ? 
          await getScanVersion(request.repository_id, result.current_version_id, token) : 
          null
        );
        return result;
      } catch (err) {
        handleError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  /**
   * Fetch complete scan history
   */
  const fetchScanHistory = useCallback(
    async (repoId?: string, repoName?: string) => {
      const id = repoId || repositoryId;
      const name = repoName || repositoryName;

      if (!id || !name || !token) {
        throw new Error("Repository ID, name, and token required");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getScanHistory(id, name, token);
        setScanHistory(result);
        return result;
      } catch (err) {
        handleError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [repositoryId, repositoryName, token, handleError]
  );

  /**
   * Fetch lightweight version list
   */
  const fetchVersionList = useCallback(
    async (repoId?: string, repoName?: string) => {
      const id = repoId || repositoryId;
      const name = repoName || repositoryName;

      if (!id || !name || !token) {
        throw new Error("Repository ID, name, and token required");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getVersionList(id, name, token);
        setVersionList(result);
        return result;
      } catch (err) {
        handleError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [repositoryId, repositoryName, token, handleError]
  );

  /**
   * Fetch latest scan
   */
  const fetchLatestScan = useCallback(
    async (repoId?: string) => {
      const id = repoId || repositoryId;

      if (!id || !token) {
        throw new Error("Repository ID and token required");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getLatestScan(id, token);
        setLatestScan(result);
        return result;
      } catch (err) {
        handleError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [repositoryId, token, handleError]
  );

  /**
   * Fetch specific version
   */
  const fetchVersion = useCallback(
    async (versionId: string, repoId?: string) => {
      const id = repoId || repositoryId;

      if (!id || !token) {
        throw new Error("Repository ID and token required");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getScanVersion(id, versionId, token);
        setCurrentVersion(result);
        return result;
      } catch (err) {
        handleError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [repositoryId, token, handleError]
  );

  /**
   * Compare two versions
   */
  const compareScans = useCallback(
    async (fromVersion: string, toVersion: string, repoId?: string) => {
      const id = repoId || repositoryId;

      if (!id || !token) {
        throw new Error("Repository ID and token required");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await compareVersions(id, fromVersion, toVersion, token);
        setComparison(result);
        return result;
      } catch (err) {
        handleError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [repositoryId, token, handleError]
  );

  /**
   * Clear all state
   */
  const clearState = useCallback(() => {
    setScanHistory(null);
    setVersionList(null);
    setLatestScan(null);
    setCurrentVersion(null);
    setComparison(null);
    setChangeDetection(null);
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    scanHistory,
    versionList,
    latestScan,
    currentVersion,
    comparison,
    changeDetection,

    // Actions
    createScan,
    detectAndCreateScan,
    fetchScanHistory,
    fetchVersionList,
    fetchLatestScan,
    fetchVersion,
    compareScans,
    clearState,
  };
}
