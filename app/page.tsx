"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Hero } from "@/components/Hero";
import { LoginCard } from "@/components/LoginCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ROUTES } from "@/lib/constants";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in URL params
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam === "auth_failed" ? "Authentication failed. Please try again." : errorParam);
    }

    const checkAuthentication = async () => {
      if (!AuthService.isAuthenticated()) {
        setIsChecking(false);
        return;
      }

      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          router.push(ROUTES.DASHBOARD);
          return;
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
      }
      
      setIsChecking(false);
    };

    checkAuthentication();
  }, [router, searchParams]);

  const handleGitHubLogin = () => {
    globalThis.location.href = AuthService.getGitHubLoginUrl();
  };

  if (isChecking) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 font-sans">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <main className="flex w-full max-w-md flex-col items-center gap-8 px-6 py-16">
        <Hero
          title="Dependency Nexus"
          subtitle="Analyze and manage your project dependencies"
        />
        
        {error && (
          <div role="alert" className="alert alert-error w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}
        
        <LoginCard onLogin={handleGitHubLogin} />
      </main>
    </div>
  );
}
