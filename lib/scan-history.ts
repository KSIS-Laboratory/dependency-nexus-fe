/**
 * Scan History API Client
 * Handles dependency version tracking and S3 storage integration
 */

import { API_BASE_URL } from "./constants";

// ==================== Types ====================

export interface DependencyItem {
  name: string;
  version: string;
  package_manager: string;
  file_path?: string;
}

export interface DependencyScanVersion {
  version_id: string;
  repository_id: string;
  repository_name: string;
  scan_timestamp: string;
  commit_hash?: string;
  branch: string;
  dependencies: DependencyItem[];
  total_count: number;
  package_managers: string[];
  vulnerability_summary?: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
}

export interface DependencyChange {
  dependency_name: string;
  old_version?: string;
  new_version?: string;
  change_type: "added" | "removed" | "updated";
  package_manager: string;
}

export interface ScanComparison {
  from_version: string;
  to_version: string;
  from_timestamp: string;
  to_timestamp: string;
  changes: DependencyChange[];
  added_count: number;
  removed_count: number;
  updated_count: number;
  total_changes: number;
}

export interface ScanHistoryResponse {
  repository_id: string;
  repository_name: string;
  total_versions: number;
  versions: DependencyScanVersion[];
}

export interface ScanVersionListResponse {
  repository_id: string;
  repository_name: string;
  versions: Array<{
    version_id: string;
    scan_timestamp: string;
    total_count: number;
    commit_hash?: string;
    vulnerability_summary?: {
      total: number;
      critical: number;
      high: number;
      moderate: number;
      low: number;
    };
  }>;
}

export interface CreateScanRequest {
  repository_id: string;
  repository_name: string;
  commit_hash?: string;
  branch: string;
  dependencies: DependencyItem[];
}

export interface ScanChangeDetectionResponse {
  has_changes: boolean;
  previous_version_id?: string;
  current_version_id: string;
  changes: DependencyChange[];
  comparison?: ScanComparison;
}

// ==================== API Functions ====================

/**
 * Create a new dependency scan version
 */
export async function createScanVersion(
  request: CreateScanRequest,
  token: string
): Promise<DependencyScanVersion> {
  const response = await fetch(`${API_BASE_URL}/api/scan-history/scans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create scan version");
  }

  return response.json();
}

/**
 * Detect changes and create new scan version
 * Returns information about what changed since last scan
 */
export async function detectChanges(
  request: CreateScanRequest,
  token: string
): Promise<ScanChangeDetectionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/scan-history/detect-changes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to detect changes");
  }

  return response.json();
}

/**
 * Get complete scan history for a repository
 */
export async function getScanHistory(
  repositoryId: string,
  repositoryName: string,
  token: string
): Promise<ScanHistoryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/scan-history/repositories/${repositoryId}/history?repository_name=${encodeURIComponent(
      repositoryName
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to get scan history");
  }

  return response.json();
}

/**
 * Get lightweight list of scan versions
 */
export async function getVersionList(
  repositoryId: string,
  repositoryName: string,
  token: string
): Promise<ScanVersionListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/scan-history/repositories/${repositoryId}/versions?repository_name=${encodeURIComponent(
      repositoryName
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to get version list");
  }

  return response.json();
}

/**
 * Get the latest scan version for a repository
 */
export async function getLatestScan(
  repositoryId: string,
  token: string
): Promise<DependencyScanVersion | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/scan-history/repositories/${repositoryId}/latest`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) {
    return null; // No scan found
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to get latest scan");
  }

  return response.json();
}

/**
 * Get a specific scan version by ID
 */
export async function getScanVersion(
  repositoryId: string,
  versionId: string,
  token: string
): Promise<DependencyScanVersion> {
  const response = await fetch(
    `${API_BASE_URL}/api/scan-history/repositories/${repositoryId}/versions/${versionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to get scan version");
  }

  return response.json();
}

/**
 * Compare two scan versions
 */
export async function compareVersions(
  repositoryId: string,
  fromVersion: string,
  toVersion: string,
  token: string
): Promise<ScanComparison> {
  const response = await fetch(
    `${API_BASE_URL}/api/scan-history/repositories/${repositoryId}/compare?from_version=${fromVersion}&to_version=${toVersion}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to compare versions");
  }

  return response.json();
}

/**
 * Check scan history health
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE_URL}/api/scan-history/health`);

  if (!response.ok) {
    throw new Error("Scan history service is unavailable");
  }

  return response.json();
}
