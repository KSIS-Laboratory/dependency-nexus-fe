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
    <div className="min-h-screen flex items-center justify-center bg-base-200 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <main className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 px-6 py-16">
        <Hero
          title="Dependency Nexus"
          subtitle="Analyze and visualize your project dependencies"
        />

        {error && (
          <div role="alert" className="alert alert-error w-full animate-slide-up">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        <LoginCard onLogin={handleGitHubLogin} />
      </main>
    </div>
  );
}
