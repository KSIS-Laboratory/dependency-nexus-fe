const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
}

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export class AuthService {
  private static TOKEN_KEY = "auth_token";
  private static REFRESH_TOKEN_KEY = "refresh_token";
  private static TOKEN_EXPIRY_KEY = "token_expiry";

  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static getTokenExpiry(): number | null {
    if (typeof window === "undefined") return null;
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry) : null;
  }

  static setTokenExpiry(expiresIn: number): void {
    if (typeof window === "undefined") return;
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  static removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;
    return Date.now() >= expiry;
  }

  static async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(
        `${API_URL}/api/auth/refresh?refresh_token=${refreshToken}`,
        { method: "POST" }
      );

      if (!response.ok) {
        this.removeToken();
        return false;
      }

      const data: TokenData = await response.json();
      
      // Update tokens in localStorage
      if (data.access_token) {
        this.setToken(data.access_token);
      }
      if (data.refresh_token) {
        this.setRefreshToken(data.refresh_token);
      }
      if (data.expires_in) {
        this.setTokenExpiry(data.expires_in);
      }

      return true;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      this.removeToken();
      return false;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    // Check if token is expired and try to refresh
    if (this.isTokenExpired()) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        return null;
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me?token=${token}`);
      if (!response.ok) {
        // Try refreshing token if request fails
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry with new token
          const newToken = this.getToken();
          const retryResponse = await fetch(`${API_URL}/api/auth/me?token=${newToken}`);
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        this.removeToken();
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to get current user:", error);
      this.removeToken();
      return null;
    }
  }

  static getGitHubLoginUrl(): string {
    return `${API_URL}/api/auth/github`;
  }

  static async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.removeToken();
    }
  }
}
