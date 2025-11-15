"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService, User } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useAuth } from "@/hooks/useAuth";
import { useRepositories } from "@/hooks/useRepositories";
import { VulnerabilityAPIService } from "@/lib/vulnerability";
import { LogOut, ShieldAlert } from "lucide-react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardStatsGrid } from "@/components/dashboard/DashboardStatsGrid";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { RiskDistributionCard } from "@/components/dashboard/RiskDistributionCard";
import { ProjectHealthSection } from "@/components/dashboard/ProjectHealthSection";
import type {
  ScanHistoryEntry,
  RepositoryScanSummary,
  DashboardStats,
  RiskBuckets,
  RepositoryActivityItem,
  HighlightedProjectItem,
} from "@/components/dashboard/types";

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, githubToken, jwtToken, logout } = useAuth();
  const { repositories, isLoading: reposLoading, error: repoError } = useRepositories(githubToken);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [repoInsights, setRepoInsights] = useState<Record<string, RepositoryScanSummary>>({});
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const loadUser = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
        setUser(null);
        setUserLoading(false);
        return;
      }

      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } finally {
        setUserLoading(false);
      }
    };

    loadUser();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!jwtToken || repositories.length === 0) {
      setRepoInsights({});
      setInsightsLoading(false);
      setInsightsError(null);
      return;
    }

    let isCancelled = false;
    setInsightsLoading(true);
    setInsightsError(null);

    const loadInsights = async () => {
      const results = await Promise.allSettled(
        repositories.map(async (repo) => {
          const history = await VulnerabilityAPIService.getScanHistory(jwtToken, repo.full_name);
          const latestScan: ScanHistoryEntry | null = history?.scans?.[0] ?? null;
          return [repo.full_name, {
            totalScans: history?.total_scans ?? history?.scans?.length ?? 0,
            latestScan,
          }] as const;
        })
      );

      if (isCancelled) {
        return;
      }

      const summaries: Record<string, RepositoryScanSummary> = {};
      const errors: string[] = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          const [repoId, summary] = result.value;
          summaries[repoId] = summary;
        } else {
          const errorMessage = result.reason?.message ?? "Failed to load scan history";
          errors.push(errorMessage);
        }
      }

      setRepoInsights(summaries);
      if (errors.length) {
        setInsightsError(errors[0]);
      }
      setInsightsLoading(false);
    };

    loadInsights().catch((error: Error) => {
      if (!isCancelled) {
        setInsightsError(error.message || "Failed to load scan history");
        setInsightsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [jwtToken, repositories, refreshCounter]);

  const dashboardStats: DashboardStats = useMemo(() => {
    const repoCount = repositories.length;
    const scannedCount = Object.values(repoInsights).filter((summary) => summary.totalScans > 0).length;
    const totalVulnerabilities = Object.values(repoInsights).reduce((sum, summary) => {
      return sum + (summary.latestScan?.total_vulnerabilities ?? 0);
    }, 0);

    const lastScan = Object.values(repoInsights)
      .map((summary) => summary.latestScan?.scan_timestamp)
      .filter((timestamp): timestamp is string => typeof timestamp === "string" && timestamp.length > 0)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    return {
      repoCount,
      scannedCount,
      totalVulnerabilities,
      lastScan,
    };
  }, [repositories, repoInsights]);

  const riskBuckets: RiskBuckets = useMemo(() => {
    const buckets: RiskBuckets = { healthy: 0, warning: 0, critical: 0, unscanned: 0 };

    for (const repo of repositories) {
      const summary = repoInsights[repo.full_name];
      if (!summary?.latestScan) {
        buckets.unscanned += 1;
        continue;
      }

      const count = summary.latestScan.total_vulnerabilities ?? 0;
      if (count === 0) buckets.healthy += 1;
      else if (count <= 5) buckets.warning += 1;
      else buckets.critical += 1;
    }

    return buckets;
  }, [repositories, repoInsights]);

  const recentActivity: RepositoryActivityItem[] = useMemo(() => {
    return repositories
      .map((repo) => ({ repo, summary: repoInsights[repo.full_name] }))
      .filter(({ summary }) => Boolean(summary?.latestScan))
      .sort((a, b) => {
        const timeA = new Date(a.summary?.latestScan?.scan_timestamp || 0).getTime();
        const timeB = new Date(b.summary?.latestScan?.scan_timestamp || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [repositories, repoInsights]);

  const highlightedProjects: HighlightedProjectItem[] = useMemo(() => {
    return repositories
      .map((repo) => ({ repo, summary: repoInsights[repo.full_name] }))
      .sort((a, b) => {
        const vulnsA = a.summary?.latestScan?.total_vulnerabilities ?? -1;
        const vulnsB = b.summary?.latestScan?.total_vulnerabilities ?? -1;
        return vulnsB - vulnsA;
      })
      .slice(0, 6);
  }, [repositories, repoInsights]);

  const handleRefreshInsights = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  const handleNavigateToRepositories = () => {
    router.push("/repositories");
  };

  const handleViewRepository = (fullName: string) => {
    router.push(`/repositories/${fullName}/dependencies`);
  };

  if (repoError) {
    return <ErrorMessage message={repoError} onBack={() => router.push("/")} />;
  }

  const isLoadingState = authLoading || userLoading || reposLoading || insightsLoading;

  if (isLoadingState) {
    return <LoadingSpinner message="Preparing your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <PageHeader user={user} showUser>
        <h1 className="text-xl font-bold text-base-content">
          Security Overview
        </h1>
        <button
          onClick={() => logout()}
          className="btn btn-outline btn-error gap-2 ml-auto"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </PageHeader>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <DashboardHero
          userName={user?.username ?? "team"}
          onRefresh={handleRefreshInsights}
          onViewRepositories={handleNavigateToRepositories}
        />

        {insightsError && (
          <div className="alert alert-warning">
            <ShieldAlert className="h-5 w-5" />
            <span>{insightsError}</span>
          </div>
        )}

        <DashboardStatsGrid stats={dashboardStats} />

        <section className="grid gap-6 lg:grid-cols-2">
          <RecentActivityCard activity={recentActivity} />
          <RiskDistributionCard buckets={riskBuckets} />
        </section>

        <ProjectHealthSection
          projects={highlightedProjects}
          onViewRepository={handleViewRepository}
          onViewAll={handleNavigateToRepositories}
        />
      </main>
    </div>
  );
}
