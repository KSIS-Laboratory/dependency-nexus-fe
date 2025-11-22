"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ROUTES } from "@/lib/constants";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scrubSensitiveParams = useCallback(() => {
    if (globalThis.window === undefined) {
      return;
    }

    const url = new URL(globalThis.window.location.href);
    url.searchParams.delete("token");
    url.searchParams.delete("error");
    const title = document === undefined ? "" : document.title;
    globalThis.window.history.replaceState({}, title, url.toString());
  }, []);

  useEffect(() => {
    const handleCallback = () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        console.error("Authentication error occurred.");
        scrubSensitiveParams();
        router.push(`${ROUTES.HOME}?error=${error}`);
        return;
      }

      if (token) {
        AuthService.setToken(token);
        scrubSensitiveParams();
        router.push(ROUTES.DASHBOARD);
      } else {
        router.push(`${ROUTES.HOME}?error=auth_failed`);
      }
    };

    handleCallback();
  }, [searchParams, router, scrubSensitiveParams]);

  return <LoadingSpinner message="Authenticating..." />;
}
