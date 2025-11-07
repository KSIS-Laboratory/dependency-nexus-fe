// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  },
} as const;
