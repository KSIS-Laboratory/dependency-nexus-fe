import { API_URL, API_ENDPOINTS } from "./constants";
import { AuthService } from "./auth";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  description?: string;
  private: boolean;
  html_url: string;
  language?: string;
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
  has_history?: boolean;
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

export interface RepositoriesResponse {
  repositories: Repository[];
  count: number;
  page: number;
  per_page: number;
  total_count: number;
  has_more: boolean;
}

export class GitHubAPIService {
  private static handleUnauthorized(response: Response): void {
    if (response.status === 401) {
      AuthService.removeToken();
      throw new Error("Session expired. Please sign in again.");
    }
  }

  private static getHeaders(githubToken: string) {
    return {
      "Authorization": `Bearer ${githubToken}`,
      "Content-Type": "application/json",
    };
  }

  static async getRepositories(
    githubToken: string,
    page: number = 1,
    perPage: number = 15
  ): Promise<RepositoriesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    
    const response = await fetch(
      `${API_URL}${API_ENDPOINTS.GITHUB.REPOSITORIES}?${params}`,
      {
        headers: this.getHeaders(githubToken),
      }
    );

    this.handleUnauthorized(response);

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    return await response.json();
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

    this.handleUnauthorized(response);

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

    this.handleUnauthorized(response);

    if (!response.ok) {
      throw new Error("Failed to fetch dependency files");
    }

    const data = await response.json();
    return data.dependency_files;
  }
}
