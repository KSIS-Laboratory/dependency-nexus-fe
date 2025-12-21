"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDependencyAnalysis } from "@/hooks/useDependencyAnalysis";
import { AuthService, User } from "@/lib/auth";
import { VulnerabilityAPIService } from "@/lib/vulnerability";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import {
  Package,
  ArrowLeft,
  Shield,
  History,
  AlertCircle,
  Github,
  Layers
} from "lucide-react";
import { DependenciesTab } from "@/components/DependenciesTab";
import { SecurityTab } from "@/components/SecurityTab";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { ScanHistoryPanel } from "@/components/ScanHistoryPanel";

const isUnsupportedDependencyFile = (deps: unknown): deps is { raw_content: string } => {
  return typeof deps === "object" && deps !== null && "raw_content" in deps;
};

type TabType = 'dependencies' | 'security' | 'history';

export default function DependenciesPage() {
  const router = useRouter();
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const { isAuthenticated, isLoading: authLoading, githubToken, jwtToken } = useAuth();
  const { analysis, isLoading: analysisLoading, error } = useDependencyAnalysis(
    githubToken,
    owner,
    repo
  );
  const [user, setUser] = useState<User | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('dependencies');

  // Scan & Data State
  const [scanFromCache, setScanFromCache] = useState(false);
  const [localVulnerabilities, setLocalVulnerabilities] = useState<any>(null);
  const [cachedVulnerabilities, setCachedVulnerabilities] = useState<any>(null);
  const [localIsScanning, setLocalIsScanning] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [viewingHistoryVersion, setViewingHistoryVersion] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated) {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
      }
    };
    loadUser();
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchCachedVulnerabilities = async () => {
      if (!jwtToken) return;
      try {
        const cached = await VulnerabilityAPIService.getLatestCachedScan(
          jwtToken,
          `${owner}/${repo}`
        );
        if (cached?.data) {
          setCachedVulnerabilities(cached.data);
          setScanFromCache(true);
        }
      } catch (error) {
        console.error("Failed to load cached vulnerabilities", error);
      }
    };

    fetchCachedVulnerabilities();
  }, [jwtToken, owner, repo]);

  // Manual vulnerability scan handler with smart caching
  const handleVulnerabilityScan = async () => {
    if (analysis && jwtToken) {
      // Get all valid dependency entries
      const validEntries = Object.entries(analysis.dependencies || {})
        .filter(([, deps]) => !isUnsupportedDependencyFile(deps));

      console.log("📂 Scanning dependency files:", validEntries.map(([name]) => name));

      const allPackages = validEntries
        .flatMap(([filename, deps]) =>
          VulnerabilityAPIService.convertDependenciesToPackageQueries(deps, filename)
        );

      if (allPackages.length > 0) {
        setLocalIsScanning(true);
        setLocalError(null);
        setScanFromCache(false);
        setViewingHistoryVersion(null);

        try {
          // Use smart scan that checks cache first
          const result = await VulnerabilityAPIService.smartScanPackages(
            jwtToken,
            `${owner}/${repo}`,
            allPackages
          );

          setLocalVulnerabilities(result.data);
          setCachedVulnerabilities(result.data);
          setScanFromCache(result.fromCache);

          // Switch to security tab to show results
          setActiveTab('security');

          if (result.fromCache) {
            console.log("✅ Using cached scan result");
          } else {
            console.log("🔄 New scan completed");
          }
        } catch (error: any) {
          console.error("Scan failed:", error);
          setLocalError(error.message || "Failed to scan vulnerabilities");
        } finally {
          setLocalIsScanning(false);
        }
      } else {
        setLocalError("No valid packages found to scan in the detected dependency files.");
      }
    }
  };

  const handleViewVersion = async (version: any) => {
    if (!jwtToken) return;
    setLocalIsScanning(true);
    setLocalError(null);
    try {
      // Convert DependencyItem[] to PackageQuery[]
      const packages = version.dependencies.map((dep: any) => ({
        name: dep.name,
        version: dep.version,
        ecosystem: dep.package_manager
      }));

      // Scan these packages (Read-only scan, does not create new history)
      const result = await VulnerabilityAPIService.scanPackages(
        jwtToken,
        packages
      );

      setLocalVulnerabilities(result);
      // We don't set scanFromCache because this is a fresh "in-memory" scan of old deps
      setScanFromCache(false);
      setViewingHistoryVersion(version.version_id);

      // Switch to security tab to view details
      setActiveTab('security');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Failed to load version", err);
      setLocalError(err.message || "Failed to load historical version");
    } finally {
      setLocalIsScanning(false);
    }
  };

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push("/");
    return null;
  }

  const isLoading = authLoading || analysisLoading;

  if (isLoading) {
    return <LoadingSpinner message="Analyzing dependencies..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onBack={() => router.push("/repositories")}
      />
    );
  }

  const dependencyEntries = Object.entries(analysis?.dependencies || {}).filter(
    ([, deps]) => !isUnsupportedDependencyFile(deps)
  );

  const vulnerabilityData = localVulnerabilities || cachedVulnerabilities;
  const hasVulnerabilityData = Boolean(vulnerabilityData);
  const totalVulnerabilityCount = vulnerabilityData?.total_vulnerabilities ?? 0;
  const hasDependencyFiles = Object.keys(analysis?.dependency_files || {}).length > 0;



  return (
    <div className="page-bg-mesh pb-20">
      <PageHeader user={user} showUser>
        <div className="flex items-center gap-4">
          <Link
            href={`/repositories/${owner}`}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
            aria-label="Back to owner repositories"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Link>
          <div className="flex items-center gap-2 text-sm breadcrumbs text-base-content">
            <ul>
              <li><Link href="/repositories" className="hover:text-primary">Repositories</Link></li>
              <li><Link href={`/repositories/${owner}`} className="hover:text-primary">{owner}</Link></li>
              <li className="font-semibold text-primary">{repo}</li>
            </ul>
          </div>
        </div>
      </PageHeader>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-linear-to-br from-primary to-secondary rounded-2xl text-white shadow-sm">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-primary tracking-tight mb-1">
                {repo}
              </h2>
              <p className="text-base-content flex items-center gap-2 font-medium">
                <Github className="h-4 w-4" />
                {owner}
              </p>
            </div>
          </div>

          {/* Global Actions */}
          {hasDependencyFiles && dependencyEntries.length > 0 && jwtToken && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleVulnerabilityScan}
                disabled={localIsScanning}
                className={`btn gap-2 shadow-md transition-all duration-300 ${localIsScanning
                  ? "btn-disabled opacity-70"
                  : "btn-primary hover:scale-105 active:scale-95"
                  }`}
              >
                {localIsScanning ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {localIsScanning ? "Scanning..." : "Scan Vulnerabilities"}
              </button>
            </div>
          )}
        </div>

        {hasDependencyFiles ? (
          <>
            {/* Status Alerts */}
            <div className="space-y-4 mb-6">
              {localIsScanning && (
                <div className="alert alert-info shadow-lg bg-info/10 border-info/20 text-info-content">
                  <div className="flex items-center gap-3">
                    <span className="loading loading-spinner loading-md text-info"></span>
                    <div>
                      <h3 className="font-bold">Scanning in progress</h3>
                      <div className="text-xs opacity-80">Analyzing dependencies for security vulnerabilities...</div>
                    </div>
                  </div>
                </div>
              )}

              {viewingHistoryVersion && (
                <div className="alert alert-warning shadow-lg bg-warning/10 border-warning/20 text-warning-content flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-warning" />
                    <div>
                      <h3 className="font-bold">Viewing Historical Version: {viewingHistoryVersion}</h3>
                      <div className="text-xs opacity-80">You are viewing a past scan result.</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-ghost hover:bg-warning/20"
                    onClick={() => {
                      setViewingHistoryVersion(null);
                      setLocalVulnerabilities(cachedVulnerabilities);
                      setActiveTab('security');
                    }}
                  >
                    Exit History View
                  </button>
                </div>
              )}

              {localError && (
                <div className="alert alert-error shadow-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span>{localError}</span>
                </div>
              )}
            </div>

            {/* Tabs Navigation */}
            <div role="tablist" className="tabs tabs-lifted tabs-lg mb-6 bg-transparent">
              <button
                role="tab"
                className={`tab font-bold transition-all duration-200 ${activeTab === 'dependencies' ? 'tab-active text-primary [--tab-bg:oklch(var(--b1))]' : 'text-base-content/60 hover:text-base-content'}`}
                onClick={() => setActiveTab('dependencies')}
              >
                <Layers className="w-4 h-4 mr-2" />
                Dependencies
              </button>
              <button
                role="tab"
                className={`tab font-bold transition-all duration-200 ${activeTab === 'security' ? 'tab-active text-primary [--tab-bg:oklch(var(--b1))]' : 'text-base-content/60 hover:text-base-content'}`}
                onClick={() => setActiveTab('security')}
              >
                <Shield className="w-4 h-4 mr-2" />
                Security
                {totalVulnerabilityCount > 0 && (
                  <span className="badge badge-sm badge-error ml-2">{totalVulnerabilityCount}</span>
                )}
              </button>
              <button
                role="tab"
                className={`tab font-bold transition-all duration-200 ${activeTab === 'history' ? 'tab-active text-primary [--tab-bg:oklch(var(--b1))]' : 'text-base-content/60 hover:text-base-content'}`}
                onClick={() => setActiveTab('history')}
              >
                <History className="w-4 h-4 mr-2" />
                History
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-base-100 rounded-b-box rounded-tr-box border-base-300 min-h-[500px]">
              {activeTab === 'dependencies' && (
                <DependenciesTab
                  analysis={analysis}
                  onScan={handleVulnerabilityScan}
                  isScanning={localIsScanning}
                />
              )}
              {activeTab === 'security' && (
                <SecurityTab
                  hasVulnerabilityData={hasVulnerabilityData}
                  totalVulnerabilityCount={totalVulnerabilityCount}
                  vulnerabilityData={vulnerabilityData}
                  scanFromCache={scanFromCache}
                  localIsScanning={localIsScanning}
                  onScan={handleVulnerabilityScan}
                />
              )}
              {activeTab === 'history' && (
                <div className="p-6 animate-in fade-in duration-300">
                  <div className="max-w-5xl mx-auto">
                    <ScanHistoryPanel
                      repositoryId={`${owner}/${repo}`}
                      repositoryName={repo}
                      token={jwtToken || ''}
                      onViewVersion={handleViewVersion}
                      onScan={handleVulnerabilityScan}
                      isScanning={localIsScanning}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center bg-base-100/50 backdrop-blur-sm rounded-3xl border border-base-200/50 border-dashed">
            <div className="bg-base-200 p-6 rounded-full mb-6">
              <Package className="h-12 w-12 text-base-content/30" />
            </div>
            <h3 className="text-xl font-bold text-base-content mb-2">
              No dependency files found
            </h3>
            <p className="text-base-content/60 max-w-md mx-auto">
              This repository doesn't appear to have any supported dependency files (like package.json, requirements.txt) that we can analyze.
            </p>
          </div>
        )}
      </main>

      {user?.id && <ChatbotWidget userId={user.id} />}
    </div>
  );
}
