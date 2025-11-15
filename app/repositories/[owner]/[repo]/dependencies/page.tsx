"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDependencyAnalysis } from "@/hooks/useDependencyAnalysis";
// Removed useVulnerabilityScanAndSave hook - now using direct API calls with smart caching
import { AuthService, User } from "@/lib/auth";
import { VulnerabilityAPIService } from "@/lib/vulnerability";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { DependencyFileCard } from "@/components/DependencyFileCard";
import { DependencySection } from "@/components/DependencySection";
import { VulnerabilitySummary } from "@/components/VulnerabilitySummary";
import { VulnerabilityCard } from "@/components/VulnerabilityCard";
import { ScanHistoryPanel } from "@/components/ScanHistoryPanel";
import { Package, ArrowLeft, Shield, AlertTriangle, FileCode } from "lucide-react";

const isUnsupportedDependencyFile = (deps: unknown): deps is { raw_content: string } => {
  return typeof deps === "object" && deps !== null && "raw_content" in deps;
};

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
  const [showVulnerabilities, setShowVulnerabilities] = useState(false);
  const [showScanHistory, setShowScanHistory] = useState(false);
  const [scanFromCache, setScanFromCache] = useState(false);
  const [localVulnerabilities, setLocalVulnerabilities] = useState<any>(null);
  const [cachedVulnerabilities, setCachedVulnerabilities] = useState<any>(null);
  const [localIsScanning, setLocalIsScanning] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoadingCached, setIsLoadingCached] = useState(false);
  const [cacheError, setCacheError] = useState<string | null>(null);

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
      setIsLoadingCached(true);
      setCacheError(null);
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
        setCacheError("Failed to load latest scan results");
      } finally {
        setIsLoadingCached(false);
      }
    };

    fetchCachedVulnerabilities();
  }, [jwtToken, owner, repo]);

  // Manual vulnerability scan handler with smart caching
  const handleVulnerabilityScan = async () => {
    if (analysis && jwtToken) {
      const allPackages = Object.entries(analysis.dependencies || {})
        .filter(([, deps]) => !isUnsupportedDependencyFile(deps))
        .flatMap(([filename, deps]) =>
          VulnerabilityAPIService.convertDependenciesToPackageQueries(deps, filename)
        );
      
      if (allPackages.length > 0) {
        setLocalIsScanning(true);
        setLocalError(null);
        setScanFromCache(false);

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
      }
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

  // Check if repository has no dependency files
  const hasDependencyFiles = Object.keys(analysis?.dependency_files || {}).length > 0;

  return (
    <div className="min-h-screen bg-base-200">
      <PageHeader user={user} showUser>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/repositories")}
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Back to repositories"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">
            {owner}/{repo}
          </h1>
        </div>
      </PageHeader>

      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
        {/* Page Title & Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3 text-base-content mb-2">
                <Package className="h-8 w-8 text-primary" />
                Dependency Analysis
              </h2>
              <p className="text-base-content/70 text-sm">Analyze and monitor dependency vulnerabilities</p>
            </div>
            
            {/* Action Buttons */}
            {hasDependencyFiles && dependencyEntries.length > 0 && jwtToken && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleVulnerabilityScan}
                  disabled={localIsScanning}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {localIsScanning ? "Scanning..." : "Scan vulnerabilities"}
                </button>
                <button
                  onClick={() => setShowScanHistory(!showScanHistory)}
                  className="btn btn-outline btn-sm gap-2 text-base-content"
                >
                  <FileCode className="h-4 w-4" />
                  {showScanHistory ? "Hide history" : "View history"}
                </button>
              </div>
            )}
          </div>

          {/* Scan History Panel */}
          {showScanHistory && jwtToken && (
            <div className="animate-in slide-in-from-top duration-300">
              <ScanHistoryPanel
                repositoryId={`${owner}/${repo}`}
                repositoryName={repo}
                token={jwtToken}
              />
            </div>
          )}
        </div>

        {!hasDependencyFiles ? (
          /* Empty State */
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-16">
              <Package className="h-16 w-16 text-base-content/30 mb-4" />
              <h3 className="text-xl font-bold text-base-content mb-2">
                Not found any dependency files
              </h3>
              <p className="text-base-content/70">
                This repository doesn't have any dependency files that can be analyzed.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Vulnerability Status Alerts */}
            {(localIsScanning || hasVulnerabilityData || localError || cacheError || scanFromCache || isLoadingCached) && (
              <div className="mb-6 space-y-3">
                {localIsScanning && (
                  <div className="alert alert-info">
                    <Shield className="h-5 w-5" />
                    <span>Scanning vulnerabilities...</span>
                  </div>
                )}
                {isLoadingCached && (
                  <div className="alert alert-info">
                    <Shield className="h-5 w-5" />
                    <span>Loading cached scan results...</span>
                  </div>
                )}
                {scanFromCache && !localIsScanning && hasVulnerabilityData && (
                  <div className="alert alert-success">
                    <Shield className="h-5 w-5" />
                    <span>✅ Using cached scan results (dependencies unchanged)</span>
                  </div>
                )}
                {localError && (
                  <div className="alert alert-error">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{localError}</span>
                  </div>
                )}
                {cacheError && (
                  <div className="alert alert-warning">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{cacheError}</span>
                  </div>
                )}
                {!localIsScanning && hasVulnerabilityData && totalVulnerabilityCount === 0 && (
                  <div className="alert alert-success">
                    <Shield className="h-5 w-5" />
                    <span>✨ No vulnerabilities found in this project</span>
                  </div>
                )}
              </div>
            )}

            {/* Vulnerability Summary */}
            {hasVulnerabilityData && totalVulnerabilityCount > 0 && (
              <div className="mb-6">
                <VulnerabilitySummary data={vulnerabilityData} />
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column: Dependency Files (1/3) */}
              <div className="lg:col-span-1">
                <div className="card bg-base-100 shadow-xl sticky top-6">
                  <div className="card-body">
                    <h3 className="card-title text-lg flex items-center gap-2 text-base-content">
                      <FileCode className="h-5 w-5 text-primary" />
                      Dependency Files
                      <div className="badge badge-primary badge-sm">
                        {Object.keys(analysis?.dependency_files || {}).length}
                      </div>
                    </h3>
                    <div className="space-y-3 mt-4">
                      {Object.entries(analysis?.dependency_files || {}).map(([filename, info]) => (
                        <DependencyFileCard
                          key={filename}
                          filename={filename}
                          info={info}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Dependencies & Vulnerabilities (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Dependencies Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold flex items-center gap-2 text-base-content">
                      <Package className="h-6 w-6 text-primary" />
                      Dependencies
                    </h3>
                    {hasVulnerabilityData && totalVulnerabilityCount > 0 && (
                      <button
                        onClick={() => setShowVulnerabilities(!showVulnerabilities)}
                        className="btn btn-outline btn-sm gap-2 text-base-content"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        {showVulnerabilities ? "Hide vulnerabilities" : "Show vulnerabilities"}
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {dependencyEntries.map(([filename, deps]: [string, any]) => (
                      <DependencySection
                        key={filename}
                        filename={filename}
                        dependencies={deps}
                      />
                    ))}
                  </div>
                </div>

                {/* Vulnerabilities Detail Section */}
                {hasVulnerabilityData && showVulnerabilities && totalVulnerabilityCount > 0 && (
                  <div className="animate-in slide-in-from-bottom duration-300">
                    <div className="divider"></div>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-base-content">
                      <AlertTriangle className="h-6 w-6 text-error" />
                      Vulnerabilities detail
                      {scanFromCache && (
                        <span className="badge badge-success badge-sm gap-1">
                          <Shield className="h-3 w-3" />
                          Cached
                        </span>
                      )}
                    </h3>
                    <div className="space-y-6">
                      {vulnerabilityData?.results?.map((result: any) => (
                        result.vulnerability_count > 0 && (
                          <div key={result.package.name} className="card bg-base-100 shadow-lg text-base-content">
                            <div className="card-body">
                              <h4 className="card-title text-lg flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {result.package.name}
                                <span className="badge badge-error badge-sm">
                                  {result.vulnerability_count} vulnerabilities
                                </span>
                              </h4>
                              <div className="grid gap-4 mt-4">
                                {result.vulnerabilities.map((vuln: any) => (
                                  <VulnerabilityCard key={vuln.id} vulnerability={vuln} />
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
