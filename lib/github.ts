import { API_URL, API_ENDPOINTS } from "./constants";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  html_url: string;
  language?: string;
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
}

export interface DependencyFile {
  type: string;
  path: string;
  size: number;
  url: string;
}

export interface DependencyAnalysis {
  repository: string;
  dependency_files: Record<string, DependencyFile>;
  dependencies: Record<string, any>;
}

export class GitHubAPIService {
  private static getHeaders(githubToken: string) {
    return {
      "Authorization": `Bearer ${githubToken}`,
      "Content-Type": "application/json",
    };
  }

  static async getRepositories(githubToken: string): Promise<Repository[]> {
    const response = await fetch(`${API_URL}${API_ENDPOINTS.GITHUB.REPOSITORIES}`, {
      headers: this.getHeaders(githubToken),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const data = await response.json();
    return data.repositories;
  }

  static async analyzeDependencies(
    githubToken: string,
    owner: string,
    repo: string
  ): Promise<DependencyAnalysis> {
    const response = await fetch(
      `${API_URL}${API_ENDPOINTS.GITHUB.DEPENDENCIES(owner, repo)}`,
      {
        headers: this.getHeaders(githubToken),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to analyze dependencies");
    }

    return await response.json();
  }

  static async getDependencyFiles(
    githubToken: string,
    owner: string,
    repo: string
  ): Promise<Record<string, DependencyFile>> {
    const response = await fetch(
      `${API_URL}${API_ENDPOINTS.GITHUB.FILES(owner, repo)}`,
      {
        headers: this.getHeaders(githubToken),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch dependency files");
    }

    const data = await response.json();
    return data.dependency_files;
  }
}
