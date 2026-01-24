import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { PackageQuery, VulnerabilityQueryResponse } from "@/lib/vulnerability";

export type ScanJobStatus = "pending" | "in_progress" | "completed" | "failed";

export interface ScanJobResponse {
  job_id: string;
  repository_id: string;
  status: ScanJobStatus;
  progress: number;
  message: string;
  total_packages: number;
  scanned_packages: number;
  total_vulnerabilities: number;
  created_at: string;
  updated_at: string;
  result?: VulnerabilityQueryResponse;
  error?: string;
}

export interface UseBackgroundScanResult {
  // State
  jobId: string | null;
  status: ScanJobStatus | null;
  progress: number;
  message: string;
  scannedPackages: number;
  totalPackages: number;
  totalVulnerabilities: number;
  result: VulnerabilityQueryResponse | null;
  error: string | null;
  isScanning: boolean;
  isComplete: boolean;

  // Actions
  startScan: (repositoryId: string, packages: PackageQuery[]) => Promise<void>;
  checkStatus: (jobId: string) => Promise<ScanJobResponse | null>;
  reset: () => void;
}

const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds

/**
 * Hook for background vulnerability scanning with polling
 */
export function useBackgroundScan(token: string | null): UseBackgroundScanResult {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanJobStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [scannedPackages, setScannedPackages] = useState(0);
  const [totalPackages, setTotalPackages] = useState(0);
  const [totalVulnerabilities, setTotalVulnerabilities] = useState(0);
  const [result, setResult] = useState<VulnerabilityQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const isScanning = status === "pending" || status === "in_progress";
  const isComplete = status === "completed" || status === "failed";

  /**
   * Check status of a job
   */
  const checkStatus = useCallback(
    async (checkJobId: string): Promise<ScanJobResponse | null> => {
      if (!token) return null;

      try {
        const response = await fetch(
          `${API_URL}${API_ENDPOINTS.VULNERABILITIES.SCAN_STATUS(checkJobId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Failed to check status: ${response.status}`);
        }

        return response.json();
      } catch (err) {
        console.error("[BackgroundScan] Status check failed:", err);
        return null;
      }
    },
    [token]
  );

  /**
   * Update state from job response
   */
  const updateFromResponse = useCallback((job: ScanJobResponse) => {
    if (!isMountedRef.current) return;

    setStatus(job.status);
    setProgress(job.progress);
    setMessage(job.message);
    setScannedPackages(job.scanned_packages);
    setTotalPackages(job.total_packages);
    setTotalVulnerabilities(job.total_vulnerabilities);

    if (job.status === "completed" && job.result) {
      setResult(job.result);
    }

    if (job.status === "failed" && job.error) {
      setError(job.error);
    }
  }, []);

  /**
   * Start polling for job status
   */
  const startPolling = useCallback(
    (pollJobId: string) => {
      // Clear existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      const poll = async () => {
        const job = await checkStatus(pollJobId);

        if (!job || !isMountedRef.current) {
          return;
        }

        updateFromResponse(job);

        // Stop polling if job is complete
        if (job.status === "completed" || job.status === "failed") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      };

      // Initial check
      poll();

      // Start interval
      pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    },
    [checkStatus, updateFromResponse]
  );

  /**
   * Start a background scan
   */
  const startScan = useCallback(
    async (repositoryId: string, packages: PackageQuery[]) => {
      if (!token) {
        setError("Authentication required");
        return;
      }

      if (packages.length === 0) {
        setError("No packages to scan");
        return;
      }

      // Reset state
      setError(null);
      setResult(null);
      setProgress(0);
      setStatus("pending");
      setMessage("Starting scan...");
      setTotalPackages(packages.length);
      setScannedPackages(0);
      setTotalVulnerabilities(0);

      try {
        const response = await fetch(
          `${API_URL}${API_ENDPOINTS.VULNERABILITIES.SCAN_START}?repository_id=${encodeURIComponent(repositoryId)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ packages }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to start scan: ${response.status}`);
        }

        const data = await response.json();
        setJobId(data.job_id);

        console.log(`[BackgroundScan] Started job ${data.job_id} for ${repositoryId}`);

        // Start polling
        startPolling(data.job_id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to start scan";
        setError(errorMessage);
        setStatus("failed");
        console.error("[BackgroundScan] Start failed:", err);
      }
    },
    [token, startPolling]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setJobId(null);
    setStatus(null);
    setProgress(0);
    setMessage("");
    setScannedPackages(0);
    setTotalPackages(0);
    setTotalVulnerabilities(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    jobId,
    status,
    progress,
    message,
    scannedPackages,
    totalPackages,
    totalVulnerabilities,
    result,
    error,
    isScanning,
    isComplete,
    startScan,
    checkStatus,
    reset,
  };
}
