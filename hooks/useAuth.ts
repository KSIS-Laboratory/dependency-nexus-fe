import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/auth";
import { JWTUtils } from "@/lib/jwt-utils";
import { ROUTES } from "@/lib/constants";

export interface UseAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  githubToken: string | null;
  jwtToken: string | null;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    setIsAuthenticated(false);
    setGithubToken(null);
    setJwtToken(null);
    setIsLoading(false);
    router.push(ROUTES.HOME);
  }, [router]);

  const logout = useCallback(() => {
    void AuthService.logout();
    redirectToLogin();
  }, [redirectToLogin]);

  useEffect(() => {
    const checkAuth = () => {
      const token = AuthService.getToken();

      if (!token) {
        redirectToLogin();
        return;
      }

      if (JWTUtils.isExpired(token)) {
        logout();
        return;
      }

      const ghToken = JWTUtils.getGitHubToken(token);

      if (ghToken) {
        setIsAuthenticated(true);
        setGithubToken(ghToken);
        setJwtToken(token); // Store the JWT token itself
      } else {
        redirectToLogin();
        return;
      }

      setIsLoading(false);
    };

    checkAuth();

    const intervalId = globalThis.setInterval(() => {
      const token = AuthService.getToken();
      if (token && JWTUtils.isExpired(token)) {
        logout();
      }
    }, 30_000);

    return () => globalThis.clearInterval(intervalId);
  }, [logout, redirectToLogin]);

  return {
    isAuthenticated,
    isLoading,
    githubToken,
    jwtToken,
    logout,
  };
}
