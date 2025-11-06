import jwt from "jsonwebtoken";

export interface JWTPayload {
  sub: string;
  username: string;
  email: string;
  avatar_url: string;
  github_token: string;
  github_refresh_token: string;
  github_token_expires_at: number;
  exp: number;
}

export class JWTUtils {
  /**
   * Decode JWT token without verification (client-side only)
   */
  static decode(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error("Failed to decode JWT:", error);
      return null;
    }
  }

  /**
   * Extract GitHub access token from JWT
   */
  static getGitHubToken(token: string): string | null {
    const decoded = this.decode(token);
    return decoded?.github_token || null;
  }

  /**
   * Check if token is expired
   */
  static isExpired(token: string): boolean {
    const decoded = this.decode(token);
    if (!decoded?.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  }
}
