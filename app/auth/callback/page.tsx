"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ROUTES } from "@/lib/constants";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        console.error("Authentication error:", error);
        router.push(`${ROUTES.HOME}?error=${error}`);
        return;
      }

      if (token) {
        AuthService.setToken(token);
        router.push(ROUTES.DASHBOARD);
      } else {
        router.push(`${ROUTES.HOME}?error=auth_failed`);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return <LoadingSpinner message="Authenticating..." />;
}
