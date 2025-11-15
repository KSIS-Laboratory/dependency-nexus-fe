import type { Repository } from "@/lib/github";

export interface ScanHistoryEntry {
  scan_timestamp: string;
  total_packages: number;
  total_vulnerabilities: number;
  version_id?: string;
  file_path: string;
  scanned_by?: string;
}

export interface RepositoryScanSummary {
  totalScans: number;
  latestScan: ScanHistoryEntry | null;
}

export interface DashboardStats {
  repoCount: number;
  scannedCount: number;
  totalVulnerabilities: number;
  lastScan?: string;
}

export interface RiskBuckets {
  healthy: number;
  warning: number;
  critical: number;
  unscanned: number;
}

export interface RepositoryActivityItem {
  repo: Repository;
  summary?: RepositoryScanSummary;
}

export interface HighlightedProjectItem {
  repo: Repository;
  summary?: RepositoryScanSummary;
}
