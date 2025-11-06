import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/auth";
import { JWTUtils } from "@/lib/jwt-utils";

export interface UseAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  githubToken: string | null;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [githubToken, setGithubToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = AuthService.getToken();
      
      if (!token) {
        setIsAuthenticated(false);
        setGithubToken(null);
        setIsLoading(false);
        return;
      }

      const ghToken = JWTUtils.getGitHubToken(token);
      
      if (ghToken) {
        setIsAuthenticated(true);
        setGithubToken(ghToken);
      } else {
        setIsAuthenticated(false);
        setGithubToken(null);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setGithubToken(null);
    router.push("/");
  };

  return {
    isAuthenticated,
    isLoading,
    githubToken,
    logout,
  };
}
