// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_BASE_URL = API_URL; // Alias for consistency

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  TOKEN_EXPIRY: "token_expiry",
} as const;

// Routes
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  REPOSITORIES: "/repositories",
  AUTH_CALLBACK: "/auth/callback",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    GITHUB: "/api/auth/github",
    CALLBACK: "/api/auth/github/callback",
    ME: "/api/auth/me",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
  },
  GITHUB: {
    REPOSITORIES: "/api/github/repositories",
    DEPENDENCIES: (owner: string, repo: string) =>
      `/api/github/repositories/${owner}/${repo}/dependencies`,
    FILES: (owner: string, repo: string) =>
      `/api/github/repositories/${owner}/${repo}/files`,
  },
  VULNERABILITIES: {
    SCAN: "/api/vulnerabilities/scan",
    SCAN_SINGLE: (ecosystem: string, packageName: string, version?: string) => {
      const baseUrl = `/api/vulnerabilities/scan/${ecosystem}/${packageName}`;
      return version ? `${baseUrl}?version=${version}` : baseUrl;
    },
    DETAIL: (vulnId: string) => `/api/vulnerabilities/detail/${vulnId}`,
    SCAN_AND_SAVE: "/api/vulnerabilities/scan-and-save",
    HISTORY: (repositoryId: string) => `/api/vulnerabilities/history/${repositoryId}`,
    HISTORY_DETAIL: (repositoryId: string) => `/api/vulnerabilities/history/${repositoryId}/detail`,
  },
  SCAN_HISTORY: {
    CREATE_SCAN: "/api/scan-history/scans",
    DETECT_CHANGES: "/api/scan-history/detect-changes",
    HISTORY: (repoId: string) => `/api/scan-history/repositories/${repoId}/history`,
    VERSIONS: (repoId: string) => `/api/scan-history/repositories/${repoId}/versions`,
    LATEST: (repoId: string) => `/api/scan-history/repositories/${repoId}/latest`,
    VERSION: (repoId: string, versionId: string) => `/api/scan-history/repositories/${repoId}/versions/${versionId}`,
    COMPARE: (repoId: string) => `/api/scan-history/repositories/${repoId}/compare`,
    HEALTH: "/api/scan-history/health",
  },
} as const;
