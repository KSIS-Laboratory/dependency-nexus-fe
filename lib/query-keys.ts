export const queryKeys = {
  repositories: {
    all: ["repositories"] as const,
    list: (page: number) => ["repositories", "list", page] as const,
    infinite: (perPage: number) =>
      ["repositories", "infinite", perPage] as const,
    scanned: ["repositories", "scanned"] as const,
  },
  dependencies: {
    all: ["dependencies"] as const,
    analysis: (owner: string, repo: string) =>
      ["dependencies", "analysis", owner, repo] as const,
  },
  vulnerabilities: {
    all: ["vulnerabilities"] as const,
    scan: (repositoryId: string) =>
      ["vulnerabilities", "scan", repositoryId] as const,
    analysis: (repoId: string) =>
      ["vulnerabilities", "analysis", repoId] as const,
  },
  scanHistory: {
    all: ["scanHistory"] as const,
    versions: (repositoryId: string, repositoryName: string) =>
      ["scanHistory", "versions", repositoryId, repositoryName] as const,
    latest: (repositoryId: string) =>
      ["scanHistory", "latest", repositoryId] as const,
  },
} as const;


